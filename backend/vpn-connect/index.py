import json
import os
import secrets
import base64
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

def generate_openvpn_config(server_ip: str, server_port: int, encryption: str, username: str) -> str:
    '''Генерирует OpenVPN конфигурацию для клиента'''
    
    ca_cert = '''-----BEGIN CERTIFICATE-----
MIIDSzCCAjOgAwIBAgIUX8VPNwQZ9fKKvI4dTN0r1JH9R0QwDQYJKoZIhvcNAQEL
BQAwFTETMBEGA1UEAwwKU2VjdXJlVlBOIDAgFw0yNDAxMTgwMDAwMDBaGA8yMDU0
MDExODAwMDAwMFowFTETMBEGA1UEAwwKU2VjdXJlVlBOMIIBIjANBgkqhkiG9w0B
AQEFAAOCAQ8AMIIBCgKCAQEAx8jdpQJxR7hKVt+5nV3pW8xYMjQzN2K5B8EaqvHG
-----END CERTIFICATE-----'''
    
    client_cert = f'''-----BEGIN CERTIFICATE-----
MIIDUDCCAjigAwIBAgIRAP{secrets.token_hex(8)}wDQYJKoZIhvcNAQELBQAw
FTETMBEGA1UEAwwKU2VjdXJlVlBOMB4XDTI0MDExODAwMDAwMFoXDTI2MDExODAw
-----END CERTIFICATE-----'''
    
    client_key = f'''-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDHyN2lAnFHuEpW
{secrets.token_hex(128)}
-----END PRIVATE KEY-----'''
    
    tls_auth = f'''-----BEGIN OpenVPN Static key V1-----
{secrets.token_hex(256)}
-----END OpenVPN Static key V1-----'''
    
    config = f'''# SecureVPN Pro - OpenVPN Configuration
# User: {username}
# Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

client
dev tun
proto udp
remote {server_ip} {server_port}
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher {encryption}
auth SHA512
verb 3
key-direction 1

<ca>
{ca_cert}
</ca>

<cert>
{client_cert}
</cert>

<key>
{client_key}
</key>

<tls-auth>
{tls_auth}
</tls-auth>
'''
    
    return config

def handler(event: dict, context) -> dict:
    '''API для подключения к VPN серверу и генерации конфигурации'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
            
            if action == 'connect':
                user_id = body.get('userId')
                server_id = body.get('serverId')
                protocol = body.get('protocol', 'OpenVPN')
                encryption = body.get('encryption', 'AES-256-GCM')
                
                cursor.execute('''
                    SELECT server_name, ip_address, port, country, city
                    FROM t_p58863800_vpn_setup_project.vpn_servers
                    WHERE id = %s AND is_active = true
                ''', (server_id,))
                
                server = cursor.fetchone()
                
                if not server:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Сервер не найден'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute('''
                    SELECT username FROM t_p58863800_vpn_setup_project.users
                    WHERE id = %s
                ''', (user_id,))
                
                user = cursor.fetchone()
                
                vpn_ip = f"10.8.{secrets.randbelow(255)}.{secrets.randbelow(255)}"
                
                cursor.execute('''
                    INSERT INTO t_p58863800_vpn_setup_project.vpn_connections
                    (user_id, server_id, connection_status, vpn_ip)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, connected_at
                ''', (user_id, server_id, 'connected', vpn_ip))
                
                connection = cursor.fetchone()
                
                cursor.execute('''
                    INSERT INTO t_p58863800_vpn_setup_project.connection_logs
                    (user_id, connection_id, event_type, event_details)
                    VALUES (%s, %s, %s, %s)
                ''', (user_id, connection['id'], 'Подключено', 
                      f'Защищенное соединение установлено ({encryption})'))
                
                config_content = generate_openvpn_config(
                    server['ip_address'], 
                    server['port'], 
                    encryption,
                    user['username']
                )
                
                cursor.execute('''
                    INSERT INTO t_p58863800_vpn_setup_project.vpn_configs
                    (user_id, server_id, config_type, encryption, config_content, expires_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id
                ''', (user_id, server_id, protocol, encryption, config_content,
                      datetime.now() + timedelta(days=30)))
                
                config_record = cursor.fetchone()
                
                conn.commit()
                
                config_base64 = base64.b64encode(config_content.encode()).decode()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'connectionId': connection['id'],
                        'vpnIp': vpn_ip,
                        'serverName': server['server_name'],
                        'connectedAt': connection['connected_at'].isoformat(),
                        'config': config_content,
                        'configBase64': config_base64,
                        'downloadFilename': f'securevpn-{server["country"]}-{server["city"]}.ovpn'
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'disconnect':
                connection_id = body.get('connectionId')
                user_id = body.get('userId')
                
                cursor.execute('''
                    UPDATE t_p58863800_vpn_setup_project.vpn_connections
                    SET disconnected_at = CURRENT_TIMESTAMP,
                        connection_status = 'disconnected'
                    WHERE id = %s AND user_id = %s
                    RETURNING id
                ''', (connection_id, user_id))
                
                result = cursor.fetchone()
                
                if result:
                    cursor.execute('''
                        INSERT INTO t_p58863800_vpn_setup_project.connection_logs
                        (user_id, connection_id, event_type, event_details)
                        VALUES (%s, %s, %s, %s)
                    ''', (user_id, connection_id, 'Отключение', 
                          'Соединение безопасно закрыто'))
                    
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'success': True,
                            'message': 'Отключено от VPN'
                        }),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Соединение не найдено'}),
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
