<?php
/**
 * Database Configuration
 * PostgreSQL connection settings
 */

class Database {
    private $db_file;
    public $conn;

    public function __construct() {
        $this->db_file = __DIR__ . '/../database/media.db';
        // Create database directory if it doesn't exist
        $db_dir = dirname($this->db_file);
        if (!file_exists($db_dir)) {
            mkdir($db_dir, 0777, true);
        }
    }

    public function getConnection() {
        $this->conn = null;
        
        try {
            $dsn = "sqlite:" . $this->db_file;
            $this->conn = new PDO($dsn);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        
        return $this->conn;
    }

    public function createTables() {
        // SQLite compatible table creation
        $sql = "
        CREATE TABLE IF NOT EXISTS media_files (
            id TEXT PRIMARY KEY,
            original_filename TEXT NOT NULL,
            stored_filename TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            file_extension TEXT NOT NULL,
            content_type TEXT NOT NULL,
            upload_type TEXT NOT NULL DEFAULT 'temp',
            access_url TEXT NOT NULL,
            thumbnail_url TEXT NULL,
            is_used INTEGER DEFAULT 0,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        ";

        try {
            $this->conn->exec($sql);
            
            // Create indexes separately for SQLite
            $this->conn->exec("CREATE INDEX IF NOT EXISTS idx_media_is_used ON media_files(is_used);");
            $this->conn->exec("CREATE INDEX IF NOT EXISTS idx_media_uploaded_at ON media_files(uploaded_at);");
            $this->conn->exec("CREATE INDEX IF NOT EXISTS idx_media_upload_type ON media_files(upload_type);");
            return true;
        } catch(PDOException $exception) {
            throw new Exception("Error creating tables: " . $exception->getMessage());
        }
    }
}
?>