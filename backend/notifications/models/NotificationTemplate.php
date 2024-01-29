<?php
/**
 * NotificationTemplate Model
 * Manages email templates for notifications
 */

class NotificationTemplate {
    private $conn;
    private $table_name = 'notification_templates';

    public $id;
    public $name;
    public $code;
    public $subject;
    public $body_html;
    public $body_text;
    public $variables;
    public $is_active;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Create new template
     */
    public function create() {
        $sql = "INSERT INTO " . $this->table_name . " 
                (name, code, subject, body_html, body_text, variables, is_active) 
                VALUES 
                (:name, :code, :subject, :body_html, :body_text, :variables, :is_active)
                RETURNING id";

        $stmt = $this->conn->prepare($sql);

        $stmt->bindParam(':name', $this->name);
        $stmt->bindParam(':code', $this->code);
        $stmt->bindParam(':subject', $this->subject);
        $stmt->bindParam(':body_html', $this->body_html);
        $stmt->bindParam(':body_text', $this->body_text);
        $stmt->bindParam(':variables', $this->variables);
        $stmt->bindParam(':is_active', $this->is_active);

        if ($stmt->execute()) {
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['id'];
        }

        return false;
    }

    /**
     * Get template by ID
     */
    public function getById($id) {
        $sql = "SELECT * FROM " . $this->table_name . " WHERE id = :id LIMIT 1";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $this->id = $row['id'];
            $this->name = $row['name'];
            $this->code = $row['code'];
            $this->subject = $row['subject'];
            $this->body_html = $row['body_html'];
            $this->body_text = $row['body_text'];
            $this->variables = $row['variables'];
            $this->is_active = $row['is_active'];
            $this->created_at = $row['created_at'];
            $this->updated_at = $row['updated_at'];
            return true;
        }

        return false;
    }

    /**
     * Get template by code
     */
    public function getByCode($code) {
        $sql = "SELECT * FROM " . $this->table_name . " 
                WHERE code = :code AND is_active = 1 
                LIMIT 1";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':code', $code);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $this->id = $row['id'];
            $this->name = $row['name'];
            $this->code = $row['code'];
            $this->subject = $row['subject'];
            $this->body_html = $row['body_html'];
            $this->body_text = $row['body_text'];
            $this->variables = $row['variables'];
            $this->is_active = $row['is_active'];
            $this->created_at = $row['created_at'];
            $this->updated_at = $row['updated_at'];
            return true;
        }

        return false;
    }

    /**
     * Get all templates
     */
    public function getAll($active_only = false) {
        $sql = "SELECT * FROM " . $this->table_name;
        
        if ($active_only) {
            $sql .= " WHERE is_active = 1";
        }
        
        $sql .= " ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute();

        $templates = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $templates[] = $row;
        }

        return $templates;
    }

    /**
     * Update template
     */
    public function update() {
        $sql = "UPDATE " . $this->table_name . " 
                SET name = :name, subject = :subject, body_html = :body_html, 
                    body_text = :body_text, variables = :variables, 
                    is_active = :is_active, updated_at = CURRENT_TIMESTAMP
                WHERE id = :id";

        $stmt = $this->conn->prepare($sql);

        $stmt->bindParam(':name', $this->name);
        $stmt->bindParam(':subject', $this->subject);
        $stmt->bindParam(':body_html', $this->body_html);
        $stmt->bindParam(':body_text', $this->body_text);
        $stmt->bindParam(':variables', $this->variables);
        $stmt->bindParam(':is_active', $this->is_active);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    /**
     * Delete template
     */
    public function delete() {
        $sql = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':id', $this->id);

        return $stmt->execute();
    }

    /**
     * Convert object to array
     */
    public function toArray() {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'subject' => $this->subject,
            'body_html' => $this->body_html,
            'body_text' => $this->body_text,
            'variables' => json_decode($this->variables, true),
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at
        ];
    }
}
?>