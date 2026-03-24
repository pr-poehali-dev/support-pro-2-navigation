"""
Dashboard API: GET / — статистика для дашборда
"""
import json
import os
import psycopg2

SCHEMA = 't_p3626951_support_pro_2_naviga'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def auth_user(event):
    token = event.get('headers', {}).get('X-Authorization', '').replace('Bearer ', '')
    if not token:
        return None
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        f"SELECT u.id, u.role FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON s.user_id = u.id "
        f"WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    cur.close(); conn.close()
    return {'id': str(row[0]), 'role': row[1]} if row else None

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    headers = {**CORS, 'Content-Type': 'application/json'}

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    actor = auth_user(event)
    if not actor:
        return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Unauthorized'})}

    conn = get_conn(); cur = conn.cursor()

    # Active chats
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.chats WHERE status = 'open'")
    active_chats = cur.fetchone()[0]

    # Resolved today
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.chats WHERE status = 'resolved' AND updated_at::date = NOW()::date")
    resolved_today = cur.fetchone()[0]

    # Total messages today
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.messages WHERE created_at::date = NOW()::date")
    messages_today = cur.fetchone()[0]

    # Operators status
    cur.execute(
        f"SELECT u.id, u.name, u.status, "
        f"COUNT(c.id) FILTER (WHERE c.status = 'open') as active_chats, "
        f"COUNT(c2.id) FILTER (WHERE c2.status = 'resolved' AND c2.updated_at::date = NOW()::date) as resolved "
        f"FROM {SCHEMA}.users u "
        f"LEFT JOIN {SCHEMA}.chats c ON c.operator_id = u.id AND c.status = 'open' "
        f"LEFT JOIN {SCHEMA}.chats c2 ON c2.operator_id = u.id "
        f"WHERE u.role = 'operator' GROUP BY u.id, u.name, u.status ORDER BY u.name"
    )
    op_rows = cur.fetchall()
    operators = [{'id': str(r[0]), 'name': r[1], 'status': r[2], 'activeChats': r[3], 'resolvedToday': r[4]} for r in op_rows]

    # Recent chats
    cur.execute(
        f"SELECT c.id, c.client_name, c.subject, c.status, c.priority, c.channel, c.updated_at, "
        f"(SELECT text FROM {SCHEMA}.messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) "
        f"FROM {SCHEMA}.chats c ORDER BY c.updated_at DESC LIMIT 10"
    )
    chat_rows = cur.fetchall()
    recent_chats = [{'id': str(r[0]), 'clientName': r[1], 'subject': r[2], 'status': r[3], 'priority': r[4], 'channel': r[5], 'updatedAt': r[6].isoformat(), 'lastMessage': r[7]} for r in chat_rows]

    # Chart: messages by hour today
    cur.execute(
        f"SELECT EXTRACT(HOUR FROM created_at)::int as h, COUNT(*) "
        f"FROM {SCHEMA}.messages WHERE created_at::date = NOW()::date GROUP BY h ORDER BY h"
    )
    hourly_raw = {r[0]: r[1] for r in cur.fetchall()}
    chart_data = [{'hour': f'{h:02d}:00', 'messages': hourly_raw.get(h, 0)} for h in range(8, 21)]

    cur.close(); conn.close()
    return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
        'stats': {
            'activeChats': active_chats,
            'resolvedToday': resolved_today,
            'messagesToday': messages_today,
        },
        'operators': operators,
        'recentChats': recent_chats,
        'chartData': chart_data,
    })}
