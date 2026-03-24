"""
Auth API: POST /login, POST /logout, GET /me
"""
import json
import os
import secrets
import psycopg2

SCHEMA = 't_p3626951_support_pro_2_naviga'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def user_row_to_dict(row):
    return {
        'id': str(row[0]),
        'name': row[1],
        'login': row[2],
        'email': row[3],
        'role': row[4],
        'status': row[5],
    }

def get_user_by_token(token, cur):
    cur.execute(
        f"SELECT u.id, u.name, u.login, u.email, u.role, u.status "
        f"FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON s.user_id = u.id "
        f"WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers = {**CORS, 'Content-Type': 'application/json'}

    # POST /login
    if method == 'POST' and path.endswith('/login'):
        body = json.loads(event.get('body') or '{}')
        login = body.get('login', '').strip()
        password = body.get('password', '').strip()

        if not login or not password:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Введите логин и пароль'})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, name, login, email, role, status FROM {SCHEMA}.users WHERE login = %s AND password_hash = %s",
            (login, password)
        )
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Неверный логин или пароль'})}

        user = user_row_to_dict(row)
        token = secrets.token_hex(32)
        cur.execute(
            f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)",
            (user['id'], token)
        )
        cur.execute(
            f"UPDATE {SCHEMA}.users SET status = 'online', updated_at = NOW() WHERE id = %s",
            (user['id'],)
        )
        conn.commit(); cur.close(); conn.close()
        user['status'] = 'online'
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'user': user, 'token': token})}

    # POST /logout
    if method == 'POST' and path.endswith('/logout'):
        token = event.get('headers', {}).get('X-Authorization', '').replace('Bearer ', '')
        if token:
            conn = get_conn(); cur = conn.cursor()
            row = get_user_by_token(token, cur)
            if row:
                cur.execute(f"UPDATE {SCHEMA}.users SET status = 'offline', updated_at = NOW() WHERE id = %s", (str(row[0]),))
            cur.execute(f"DELETE FROM {SCHEMA}.sessions WHERE token = %s", (token,))
            conn.commit(); cur.close(); conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    # GET /me
    if method == 'GET' and path.endswith('/me'):
        token = event.get('headers', {}).get('X-Authorization', '').replace('Bearer ', '')
        if not token:
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Нет токена'})}
        conn = get_conn(); cur = conn.cursor()
        row = get_user_by_token(token, cur)
        cur.close(); conn.close()
        if not row:
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Сессия истекла'})}
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'user': user_row_to_dict(row)})}

    return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Not found'})}
