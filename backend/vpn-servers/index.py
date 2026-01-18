import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для получения списка VPN серверов и их статуса'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            cursor.execute('''
                SELECT 
                    id, server_name, country, city, flag_emoji,
                    ip_address, port, protocol, max_connections,
                    current_load, ping_ms, is_active
                FROM t_p58863800_vpn_setup_project.vpn_servers
                WHERE is_active = true
                ORDER BY ping_ms ASC
            ''')
            
            servers = cursor.fetchall()
            
            servers_list = [
                {
                    'id': str(s['id']),
                    'country': s['country'],
                    'city': s['city'],
                    'flag': s['flag_emoji'],
                    'load': float(s['current_load']),
                    'ping': s['ping_ms'],
                    'serverName': s['server_name'],
                    'ipAddress': s['ip_address'],
                    'port': s['port'],
                    'protocol': s['protocol']
                }
                for s in servers
            ]
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'servers': servers_list
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
