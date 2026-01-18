-- VPN Service Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS t_p58863800_vpn_setup_project.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- VPN Servers table
CREATE TABLE IF NOT EXISTS t_p58863800_vpn_setup_project.vpn_servers (
    id SERIAL PRIMARY KEY,
    server_name VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    flag_emoji VARCHAR(10),
    ip_address VARCHAR(45) NOT NULL,
    port INTEGER DEFAULT 1194,
    protocol VARCHAR(50) DEFAULT 'OpenVPN',
    max_connections INTEGER DEFAULT 100,
    current_load DECIMAL(5,2) DEFAULT 0.00,
    ping_ms INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User VPN Connections table
CREATE TABLE IF NOT EXISTS t_p58863800_vpn_setup_project.vpn_connections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p58863800_vpn_setup_project.users(id),
    server_id INTEGER REFERENCES t_p58863800_vpn_setup_project.vpn_servers(id),
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    disconnected_at TIMESTAMP,
    bytes_sent BIGINT DEFAULT 0,
    bytes_received BIGINT DEFAULT 0,
    connection_status VARCHAR(50) DEFAULT 'active',
    client_ip VARCHAR(45),
    vpn_ip VARCHAR(45)
);

-- VPN Configurations table (stores generated config files)
CREATE TABLE IF NOT EXISTS t_p58863800_vpn_setup_project.vpn_configs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p58863800_vpn_setup_project.users(id),
    server_id INTEGER REFERENCES t_p58863800_vpn_setup_project.vpn_servers(id),
    config_type VARCHAR(50) NOT NULL,
    encryption VARCHAR(50) DEFAULT 'AES-256-GCM',
    config_content TEXT,
    private_key TEXT,
    public_key TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Connection Logs table
CREATE TABLE IF NOT EXISTS t_p58863800_vpn_setup_project.connection_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p58863800_vpn_setup_project.users(id),
    connection_id INTEGER REFERENCES t_p58863800_vpn_setup_project.vpn_connections(id),
    event_type VARCHAR(100) NOT NULL,
    event_details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert demo VPN servers
INSERT INTO t_p58863800_vpn_setup_project.vpn_servers 
(server_name, country, city, flag_emoji, ip_address, port, protocol, current_load, ping_ms, is_active) 
VALUES
('US-NY-01', 'США', 'Нью-Йорк', '🇺🇸', '104.18.32.15', 1194, 'OpenVPN', 45.0, 23, true),
('US-LA-01', 'США', 'Лос-Анджелес', '🇺🇸', '104.18.33.16', 1194, 'OpenVPN', 67.0, 35, true),
('GB-LON-01', 'Великобритания', 'Лондон', '🇬🇧', '104.18.34.17', 1194, 'OpenVPN', 32.0, 12, true),
('DE-BER-01', 'Германия', 'Берлин', '🇩🇪', '104.18.35.18', 1194, 'OpenVPN', 28.0, 8, true),
('NL-AMS-01', 'Нидерланды', 'Амстердам', '🇳🇱', '104.18.36.19', 1194, 'OpenVPN', 51.0, 15, true),
('FR-PAR-01', 'Франция', 'Париж', '🇫🇷', '104.18.37.20', 1194, 'OpenVPN', 39.0, 18, true),
('JP-TOK-01', 'Япония', 'Токио', '🇯🇵', '104.18.38.21', 1194, 'OpenVPN', 73.0, 89, true),
('SG-SIN-01', 'Сингапур', 'Сингапур', '🇸🇬', '104.18.39.22', 1194, 'OpenVPN', 62.0, 102, true),
('CA-TOR-01', 'Канада', 'Торонто', '🇨🇦', '104.18.40.23', 1194, 'OpenVPN', 41.0, 28, true),
('AU-SYD-01', 'Австралия', 'Сидней', '🇦🇺', '104.18.41.24', 1194, 'OpenVPN', 55.0, 156, true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON t_p58863800_vpn_setup_project.users(email);
CREATE INDEX IF NOT EXISTS idx_vpn_connections_user_id ON t_p58863800_vpn_setup_project.vpn_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_vpn_connections_status ON t_p58863800_vpn_setup_project.vpn_connections(connection_status);
CREATE INDEX IF NOT EXISTS idx_connection_logs_user_id ON t_p58863800_vpn_setup_project.connection_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_vpn_servers_active ON t_p58863800_vpn_setup_project.vpn_servers(is_active);