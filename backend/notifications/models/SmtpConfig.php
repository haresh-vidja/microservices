<?php
/**
 * SmtpConfig Model
 * Manages SMTP configuration for email sending
 */

class SmtpConfig {
    private $conn;
    private $table_name = 'smtp_configs';

    public $id;
    public $host;
    public $port;
    public $username;
    public $password;
    public $encryption;
    public $from_email;
    public $from_name;
    public $is_active;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Create or update SMTP configuration
     */
    public function createOrUpdate() {
        $existingConfig = $this->getActive();
        
        if ($existingConfig) {
            return $this->updateExisting($existingConfig['id']);
        } else {
            return $this->create();
        }
    }

    /**
     * Create new SMTP configuration
     */
    private function create() {
        $sql = "INSERT INTO " . $this->table_name . " 
                (host, port, username, password, encryption, from_email, from_name, is_active) 
                VALUES 
                (:host, :port, :username, :password, :encryption, :from_email, :from_name, :is_active)
                RETURNING id";

        $stmt = $this->conn->prepare($sql);

        $stmt->bindParam(':host', $this->host);
        $stmt->bindParam(':port', $this->port);
        $stmt->bindParam(':username', $this->username);
        $stmt->bindParam(':password', $this->password);
        $stmt->bindParam(':encryption', $this->encryption);
        $stmt->bindParam(':from_email', $this->from_email);
        $stmt->bindParam(':from_name', $this->from_name);
        $stmt->bindParam(':is_active', $this->is_active);

        if ($stmt->execute()) {
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['id'];
        }

        return false;
    }

    /**
     * Update existing SMTP configuration
     */
    private function updateExisting($id) {
        $sql = "UPDATE " . $this->table_name . " 
                SET host = :host, port = :port, username = :username, 
                    password = :password, encryption = :encryption, 
                    from_email = :from_email, from_name = :from_name, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :id";

        $stmt = $this->conn->prepare($sql);

        $stmt->bindParam(':host', $this->host);
        $stmt->bindParam(':port', $this->port);
        $stmt->bindParam(':username', $this->username);
        $stmt->bindParam(':password', $this->password);
        $stmt->bindParam(':encryption', $this->encryption);
        $stmt->bindParam(':from_email', $this->from_email);
        $stmt->bindParam(':from_name', $this->from_name);
        $stmt->bindParam(':id', $id);

        return $stmt->execute();
    }

    /**
     * Get active SMTP configuration
     */
    public function getActive() {
        $sql = "SELECT * FROM " . $this->table_name . " 
                WHERE is_active = 1 
                ORDER BY created_at DESC 
                LIMIT 1";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Get SMTP configuration by ID
     */
    public function getById($id) {
        $sql = "SELECT * FROM " . $this->table_name . " WHERE id = :id LIMIT 1";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $this->id = $row['id'];
            $this->host = $row['host'];
            $this->port = $row['port'];
            $this->username = $row['username'];
            $this->password = $row['password'];
            $this->encryption = $row['encryption'];
            $this->from_email = $row['from_email'];
            $this->from_name = $row['from_name'];
            $this->is_active = $row['is_active'];
            $this->created_at = $row['created_at'];
            $this->updated_at = $row['updated_at'];
            return true;
        }

        return false;
    }

    /**
     * Get all SMTP configurations
     */
    public function getAll() {
        $sql = "SELECT * FROM " . $this->table_name . " ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute();

        $configs = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            unset($row['password']);
            $configs[] = $row;
        }

        return $configs;
    }

    /**
     * Test SMTP connection
     */
    public function testConnection() {
        if (!$this->host || !$this->username || !$this->password) {
            return ['success' => false, 'message' => 'Missing SMTP configuration'];
        }

        try {
            $socket = fsockopen($this->host, $this->port, $errno, $errstr, 10);
            if (!$socket) {
                return ['success' => false, 'message' => "Cannot connect to {$this->host}:{$this->port} - {$errstr}"];
            }
            
            fclose($socket);
            return ['success' => true, 'message' => 'SMTP connection successful'];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Deactivate all configurations
     */
    public function deactivateAll() {
        $sql = "UPDATE " . $this->table_name . " SET is_active = 0";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute();
    }

    /**
     * Convert object to array (excluding password)
     */
    public function toArray($includePassword = false) {
        $data = [
            'id' => $this->id,
            'host' => $this->host,
            'port' => $this->port,
            'username' => $this->username,
            'encryption' => $this->encryption,
            'from_email' => $this->from_email,
            'from_name' => $this->from_name,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at
        ];

        if ($includePassword) {
            $data['password'] = $this->password;
        }

        return $data;
    }
}
?>