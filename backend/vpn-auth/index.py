import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для регистрации и аутентификации пользователей VPN-сервиса'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'register':
                email = body.get('email')
                password = body.get('password')
                username = body.get('username', email.split('@')[0])
                
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                
                cursor.execute('''
                    INSERT INTO t_p58863800_vpn_setup_project.users 
                    (email, password_hash, username, subscription_tier)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, email, username, subscription_tier, created_at
                ''', (email, password_hash, username, 'premium'))
                
                user = cursor.fetchone()
                conn.commit()
                
                user_data = {
                    'id': user['id'],
                    'email': user['email'],
                    'username': user['username'],
                    'subscription_tier': user['subscription_tier'],
                    'created_at': user['created_at'].isoformat() if user['created_at'] else None
                }
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'user': user_data,
                        'message': 'Аккаунт успешно создан'
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'login':
                email = body.get('email')
                password = body.get('password')
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                
                cursor.execute('''
                    SELECT id, email, username, subscription_tier, created_at
                    FROM t_p58863800_vpn_setup_project.users
                    WHERE email = %s AND password_hash = %s AND is_active = true
                ''', (email, password_hash))
                
                user = cursor.fetchone()
                
                if user:
                    cursor.execute('''
                        UPDATE t_p58863800_vpn_setup_project.users
                        SET last_login = CURRENT_TIMESTAMP
                        WHERE id = %s
                    ''', (user['id'],))
                    conn.commit()
                    
                    user_data = {
                        'id': user['id'],
                        'email': user['email'],
                        'username': user['username'],
                        'subscription_tier': user['subscription_tier'],
                        'created_at': user['created_at'].isoformat() if user['created_at'] else None
                    }
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'success': True,
                            'user': user_data,
                            'message': 'Успешный вход'
                        }),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'success': False,
                            'message': 'Неверный email или пароль'
                        }),
                        'isBase64Encoded': False
                    }
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }