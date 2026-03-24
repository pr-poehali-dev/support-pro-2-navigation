"""
Users API: GET / (list), POST / (create), PUT /{id} (update), PATCH /{id}/status
"""
import json
import os
import psycopg2

SCHEMA = 't_p3626951_support_pro_2_naviga'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

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

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    headers = {**CORS, 'Content-Type': 'application/json'}

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    actor = auth_user(event)
    if not actor:
        return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Unauthorized'})}

    conn = get_conn(); cur = conn.cursor()

    # GET / — list users
    if method == 'GET' and (path.endswith('/users') or path.endswith('/users/')):
        cur.execute(f"SELECT id, name, login, email, role, status, created_at FROM {SCHEMA}.users ORDER BY created_at")
        rows = cur.fetchall()
        cur.close(); conn.close()
        users = [{'id': str(r[0]), 'name': r[1], 'login': r[2], 'email': r[3], 'role': r[4], 'status': r[5], 'createdAt': r[6].isoformat()} for r in rows]
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'users': users})}

    # POST / — create user (admin only)
    if method == 'POST' and (path.endswith('/users') or path.endswith('/users/')):
        if actor['role'] != 'admin':
            cur.close(); conn.close()
            return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Только администратор'})}
        body = json.loads(event.get('body') or '{}')
        name = body.get('name', '').strip()
        login = body.get('login', '').strip()
        email = body.get('email', '').strip()
        password = body.get('password', '').strip()
        role = body.get('role', 'operator')
        if not name or not login or not password:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Заполните все поля'})}
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE login = %s", (login,))
        if cur.fetchone():
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Логин уже занят'})}
        cur.execute(
            f"INSERT INTO {SCHEMA}.users (name, login, email, password_hash, role) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (name, login, email, password, role)
        )
        new_id = str(cur.fetchone()[0])
        conn.commit(); cur.close(); conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'id': new_id, 'ok': True})}

    # PATCH /{id}/status — update own status
    if method == 'PATCH' and '/status' in path:
        parts = path.strip('/').split('/')
        user_id = parts[-2] if len(parts) >= 2 else None
        body = json.loads(event.get('body') or '{}')
        new_status = body.get('status')
        if not new_status or new_status not in ('online','busy','away','offline'):
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неверный статус'})}
        target_id = user_id if user_id else actor['id']
        cur.execute(f"UPDATE {SCHEMA}.users SET status = %s, updated_at = NOW() WHERE id = %s", (new_status, target_id))
        conn.commit(); cur.close(); conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    # PUT /{id} — update user
    if method == 'PUT':
        if actor['role'] != 'admin':
            cur.close(); conn.close()
            return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Только администратор'})}
        parts = path.strip('/').split('/')
        user_id = parts[-1]
        body = json.loads(event.get('body') or '{}')
        fields = []
        vals = []
        for f in ('name', 'email', 'role'):
            if f in body:
                fields.append(f"{f} = %s")
                vals.append(body[f])
        if 'password' in body and body['password']:
            fields.append("password_hash = %s")
            vals.append(body['password'])
        if fields:
            fields.append("updated_at = NOW()")
            vals.append(user_id)
            cur.execute(f"UPDATE {SCHEMA}.users SET {', '.join(fields)} WHERE id = %s", vals)
            conn.commit()
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    cur.close(); conn.close()
    return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Not found'})}
