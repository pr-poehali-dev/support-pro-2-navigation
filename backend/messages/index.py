"""
Messages API: GET /{chatId} (list messages), POST /{chatId} (send message)
Поддерживает как операторов (X-Authorization) так и клиентов (X-Client-Token)
"""
import json
import os
import psycopg2

SCHEMA = 't_p3626951_support_pro_2_naviga'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Authorization, X-Client-Token',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def auth_operator(event):
    token = event.get('headers', {}).get('X-Authorization', '').replace('Bearer ', '')
    if not token:
        return None
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        f"SELECT u.id, u.name, u.role FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON s.user_id = u.id "
        f"WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    cur.close(); conn.close()
    if not row:
        return None
    return {'id': str(row[0]), 'name': row[1], 'role': row[2]}

def get_chat_by_client_token(client_token, cur):
    cur.execute(f"SELECT id, client_name FROM {SCHEMA}.chats WHERE client_token = %s", (client_token,))
    return cur.fetchone()

def msg_row_to_dict(row):
    return {
        'id': str(row[0]),
        'chatId': str(row[1]),
        'senderType': row[2],
        'senderId': str(row[3]) if row[3] else None,
        'senderName': row[4],
        'text': row[5],
        'createdAt': row[6].isoformat(),
    }

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    headers = {**CORS, 'Content-Type': 'application/json'}

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    parts = path.strip('/').split('/')
    chat_id = parts[-1] if parts else None

    operator = auth_operator(event)
    client_token = event.get('headers', {}).get('X-Client-Token', '')

    conn = get_conn(); cur = conn.cursor()

    if method == 'GET':
        # Verify access
        if operator:
            cur.execute(f"SELECT id FROM {SCHEMA}.chats WHERE id = %s", (chat_id,))
        elif client_token:
            cur.execute(f"SELECT id FROM {SCHEMA}.chats WHERE id = %s AND client_token = %s", (chat_id, client_token))
        else:
            cur.close(); conn.close()
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Unauthorized'})}
        if not cur.fetchone():
            cur.close(); conn.close()
            return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Нет доступа'})}

        since = (event.get('queryStringParameters') or {}).get('since', '')
        if since:
            cur.execute(
                f"SELECT id, chat_id, sender_type, sender_id, sender_name, text, created_at "
                f"FROM {SCHEMA}.messages WHERE chat_id = %s AND created_at > %s ORDER BY created_at",
                (chat_id, since)
            )
        else:
            cur.execute(
                f"SELECT id, chat_id, sender_type, sender_id, sender_name, text, created_at "
                f"FROM {SCHEMA}.messages WHERE chat_id = %s ORDER BY created_at",
                (chat_id,)
            )
        rows = cur.fetchall()
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'messages': [msg_row_to_dict(r) for r in rows]})}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        text = body.get('text', '').strip()
        if not text:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Пустое сообщение'})}

        if operator:
            sender_type = 'operator'
            sender_id = operator['id']
            sender_name = operator['name']
            # Assign operator if not assigned
            cur.execute(f"UPDATE {SCHEMA}.chats SET operator_id = COALESCE(operator_id, %s), updated_at = NOW() WHERE id = %s", (sender_id, chat_id))
        elif client_token:
            chat_row = get_chat_by_client_token(client_token, cur)
            if not chat_row or str(chat_row[0]) != chat_id:
                cur.close(); conn.close()
                return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Нет доступа'})}
            sender_type = 'client'
            sender_id = None
            sender_name = chat_row[1]
            cur.execute(f"UPDATE {SCHEMA}.chats SET status = 'open', updated_at = NOW() WHERE id = %s", (chat_id,))
        else:
            cur.close(); conn.close()
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Unauthorized'})}

        cur.execute(
            f"INSERT INTO {SCHEMA}.messages (chat_id, sender_type, sender_id, sender_name, text) "
            f"VALUES (%s, %s, %s, %s, %s) RETURNING id, chat_id, sender_type, sender_id, sender_name, text, created_at",
            (chat_id, sender_type, sender_id, sender_name, text)
        )
        row = cur.fetchone()
        conn.commit(); cur.close(); conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'message': msg_row_to_dict(row)})}

    cur.close(); conn.close()
    return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Not found'})}
