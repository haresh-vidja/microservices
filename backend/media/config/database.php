<?php
/**
 * Database Configuration
 * PostgreSQL connection settings
 */

class Database {
    private $host = 'localhost';
    private $port = '5432';
    private $db_name = 'media_db';
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
        
        CREATE TABLE IF NOT EXISTS media_files (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            original_filename VARCHAR(255) NOT NULL,
            stored_filename VARCHAR(255) NOT NULL,
            file_size BIGINT NOT NULL,
            file_extension VARCHAR(10) NOT NULL,
            content_type VARCHAR(100) NOT NULL,
            upload_type VARCHAR(20) NOT NULL DEFAULT 'temp',
            access_url TEXT NOT NULL,
            thumbnail_url TEXT NULL,
            is_used INTEGER DEFAULT 0,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_media_is_used ON media_files(is_used);
        CREATE INDEX IF NOT EXISTS idx_media_uploaded_at ON media_files(uploaded_at);
        CREATE INDEX IF NOT EXISTS idx_media_upload_type ON media_files(upload_type);
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