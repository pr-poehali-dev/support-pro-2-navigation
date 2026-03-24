"""
Chats API: GET / (list), POST / (create), GET /{id}, PATCH /{id} (update status/priority/operator)
"""
import json
import os
import secrets
import psycopg2

SCHEMA = 't_p3626951_support_pro_2_naviga'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Authorization, X-Client-Token',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def auth_user(event):
    token = event.get('headers', {}).get('X-Authorization', '').replace('Bearer ', '')
    if not token:
        return None
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        f"SELECT u.id, u.name, u.login, u.email, u.role, u.status "
        f"FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON s.user_id = u.id "
        f"WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    cur.close(); conn.close()
    if not row:
        return None
    return {'id': str(row[0]), 'name': row[1], 'login': row[2], 'email': row[3], 'role': row[4], 'status': row[5]}

def chat_row_to_dict(row):
    return {
        'id': str(row[0]),
        'clientName': row[1],
        'clientEmail': row[2],
        'subject': row[3],
        'status': row[4],
        'priority': row[5],
        'operatorId': str(row[6]) if row[6] else None,
        'operatorName': row[7],
        'channel': row[8],
        'clientToken': row[9],
        'createdAt': row[10].isoformat(),
        'updatedAt': row[11].isoformat(),
        'lastMessage': row[12],
        'unreadCount': row[13] or 0,
    }

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    headers = {**CORS, 'Content-Type': 'application/json'}

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    actor = auth_user(event)

    conn = get_conn(); cur = conn.cursor()

    # POST /chats/client — create chat from client portal (no auth)
    if method == 'POST' and path.endswith('/client'):
        body = json.loads(event.get('body') or '{}')
        client_name = body.get('clientName', '').strip() or 'Клиент'
        client_email = body.get('clientEmail', '').strip()
        subject = body.get('subject', 'Новое обращение').strip()
        client_token = secrets.token_hex(24)
        cur.execute(
            f"INSERT INTO {SCHEMA}.chats (client_name, client_email, subject, client_token, channel) "
            f"VALUES (%s, %s, %s, %s, 'web') RETURNING id, client_token",
            (client_name, client_email, subject, client_token)
        )
        row = cur.fetchone()
        chat_id, token = str(row[0]), row[1]
        first_msg = body.get('firstMessage', '').strip()
        if first_msg:
            cur.execute(
                f"INSERT INTO {SCHEMA}.messages (chat_id, sender_type, sender_name, text) VALUES (%s, 'client', %s, %s)",
                (chat_id, client_name, first_msg)
            )
            cur.execute(f"UPDATE {SCHEMA}.chats SET updated_at = NOW() WHERE id = %s", (chat_id,))
        conn.commit(); cur.close(); conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'chatId': chat_id, 'clientToken': token})}

    # GET /chats/client — get chat by client token
    if method == 'GET' and path.endswith('/client'):
        client_token = event.get('headers', {}).get('X-Client-Token', '')
        if not client_token:
            cur.close(); conn.close()
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Нет токена'})}
        cur.execute(
            f"SELECT c.id, c.client_name, c.client_email, c.subject, c.status, c.priority, "
            f"c.operator_id, u.name, c.channel, c.client_token, c.created_at, c.updated_at, "
            f"(SELECT text FROM {SCHEMA}.messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1), "
            f"0 FROM {SCHEMA}.chats c LEFT JOIN {SCHEMA}.users u ON c.operator_id = u.id "
            f"WHERE c.client_token = %s",
            (client_token,)
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row:
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Чат не найден'})}
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'chat': chat_row_to_dict(row)})}

    # All below require operator auth
    if not actor:
        cur.close(); conn.close()
        return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Unauthorized'})}

    # GET /chats — list
    if method == 'GET' and (path.endswith('/chats') or path.endswith('/chats/')):
        params = event.get('queryStringParameters') or {}
        status_filter = params.get('status', '')
        operator_filter = params.get('operator_id', '')
        where = "WHERE 1=1"
        vals = []
        if status_filter:
            where += " AND c.status = %s"; vals.append(status_filter)
        if operator_filter:
            where += " AND c.operator_id = %s"; vals.append(operator_filter)
        cur.execute(
            f"SELECT c.id, c.client_name, c.client_email, c.subject, c.status, c.priority, "
            f"c.operator_id, u.name, c.channel, c.client_token, c.created_at, c.updated_at, "
            f"(SELECT text FROM {SCHEMA}.messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1), "
            f"(SELECT COUNT(*) FROM {SCHEMA}.messages WHERE chat_id = c.id AND sender_type = 'client') "
            f"FROM {SCHEMA}.chats c LEFT JOIN {SCHEMA}.users u ON c.operator_id = u.id "
            f"{where} ORDER BY c.updated_at DESC",
            vals
        )
        rows = cur.fetchall()
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'chats': [chat_row_to_dict(r) for r in rows]})}

    # GET /chats/{id}
    if method == 'GET':
        chat_id = path.strip('/').split('/')[-1]
        cur.execute(
            f"SELECT c.id, c.client_name, c.client_email, c.subject, c.status, c.priority, "
            f"c.operator_id, u.name, c.channel, c.client_token, c.created_at, c.updated_at, "
            f"NULL, 0 FROM {SCHEMA}.chats c LEFT JOIN {SCHEMA}.users u ON c.operator_id = u.id WHERE c.id = %s",
            (chat_id,)
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row:
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Не найден'})}
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'chat': chat_row_to_dict(row)})}

    # PATCH /chats/{id}
    if method == 'PATCH':
        chat_id = path.strip('/').split('/')[-1]
        body = json.loads(event.get('body') or '{}')
        fields = []; vals = []
        for f in ('status', 'priority', 'operator_id'):
            if f in body:
                fields.append(f"{f} = %s"); vals.append(body[f])
        if fields:
            fields.append("updated_at = NOW()")
            vals.append(chat_id)
            cur.execute(f"UPDATE {SCHEMA}.chats SET {', '.join(fields)} WHERE id = %s", vals)
            conn.commit()
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    cur.close(); conn.close()
    return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Not found'})}
