<?php
/**
 * Database Configuration for Notification Service
 * PostgreSQL connection settings
 */

class Database {
    private $host = 'localhost';
    private $port = '5432';
    private $db_name = 'notifications_db';
    private $username = 'postgres';
    private $password = 'password';
    public $conn;

    public function getConnection() {
        $this->conn = null;
        
        try {
            $dsn = "pgsql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name;
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        
        return $this->conn;
    }

    public function createTables() {
        $sql = "
        CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
        
        -- Notification templates table
        CREATE TABLE IF NOT EXISTS notification_templates (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            code VARCHAR(100) UNIQUE NOT NULL,
            subject VARCHAR(500) NOT NULL,
            body_html TEXT,
            body_text TEXT,
            variables JSONB DEFAULT '[]',
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- SMTP configuration table
        CREATE TABLE IF NOT EXISTS smtp_configs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            host VARCHAR(255) NOT NULL,
            port INTEGER DEFAULT 587,
            username VARCHAR(255) NOT NULL,
            password TEXT NOT NULL,
            encryption VARCHAR(10) DEFAULT 'tls',
            from_email VARCHAR(255) NOT NULL,
            from_name VARCHAR(255) DEFAULT 'System',
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Email history table
        CREATE TABLE IF NOT EXISTS email_history (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            template_code VARCHAR(100),
            recipient_email VARCHAR(255) NOT NULL,
            recipient_name VARCHAR(255),
            subject VARCHAR(500),
            body_html TEXT,
            body_text TEXT,
            variables JSONB,
            status VARCHAR(20) DEFAULT 'pending',
            sent_at TIMESTAMP,
            error_message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_templates_code ON notification_templates(code);
        CREATE INDEX IF NOT EXISTS idx_templates_active ON notification_templates(is_active);
        CREATE INDEX IF NOT EXISTS idx_smtp_active ON smtp_configs(is_active);
        CREATE INDEX IF NOT EXISTS idx_history_status ON email_history(status);
        CREATE INDEX IF NOT EXISTS idx_history_recipient ON email_history(recipient_email);
        CREATE INDEX IF NOT EXISTS idx_history_created ON email_history(created_at);
        ";

        try {
            $this->conn->exec($sql);
            return true;
        } catch(PDOException $exception) {
            throw new Exception("Error creating tables: " . $exception->getMessage());
        }
    }
}
?>