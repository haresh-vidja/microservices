<?php
/**
 * EmailHistory Model
 * Tracks email sending history and status
 */

class EmailHistory {
    private $conn;
    private $table_name = 'email_history';

    public $id;
    public $template_code;
    public $recipient_email;
    public $recipient_name;
    public $subject;
    public $body_html;
    public $body_text;
    public $variables;
    public $status;
    public $sent_at;
    public $error_message;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Create email history record
     */
    public function create() {
        $sql = "INSERT INTO " . $this->table_name . " 
                (template_code, recipient_email, recipient_name, subject, 
                 body_html, body_text, variables, status, sent_at, error_message) 
                VALUES 
                (:template_code, :recipient_email, :recipient_name, :subject, 
                 :body_html, :body_text, :variables, :status, :sent_at, :error_message)
                RETURNING id";

        $stmt = $this->conn->prepare($sql);

        $stmt->bindParam(':template_code', $this->template_code);
        $stmt->bindParam(':recipient_email', $this->recipient_email);
        $stmt->bindParam(':recipient_name', $this->recipient_name);
        $stmt->bindParam(':subject', $this->subject);
        $stmt->bindParam(':body_html', $this->body_html);
        $stmt->bindParam(':body_text', $this->body_text);
        $stmt->bindParam(':variables', $this->variables);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':sent_at', $this->sent_at);
        $stmt->bindParam(':error_message', $this->error_message);

        if ($stmt->execute()) {
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['id'];
        }

        return false;
    }

    /**
     * Update email history status
     */
    public function updateStatus($id, $status, $error_message = null) {
        $sql = "UPDATE " . $this->table_name . " 
                SET status = :status, error_message = :error_message";
        
        if ($status === 'sent') {
            $sql .= ", sent_at = CURRENT_TIMESTAMP";
        }
        
        $sql .= " WHERE id = :id";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':error_message', $error_message);
        $stmt->bindParam(':id', $id);

        return $stmt->execute();
    }

    /**
     * Get email history by ID
     */
    public function getById($id) {
        $sql = "SELECT * FROM " . $this->table_name . " WHERE id = :id LIMIT 1";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $this->id = $row['id'];
            $this->template_code = $row['template_code'];
            $this->recipient_email = $row['recipient_email'];
            $this->recipient_name = $row['recipient_name'];
            $this->subject = $row['subject'];
            $this->body_html = $row['body_html'];
            $this->body_text = $row['body_text'];
            $this->variables = $row['variables'];
            $this->status = $row['status'];
            $this->sent_at = $row['sent_at'];
            $this->error_message = $row['error_message'];
            $this->created_at = $row['created_at'];
            return true;
        }

        return false;
    }

    /**
     * Get all email history with pagination
     */
    public function getAll($page = 1, $limit = 20, $status = null, $email = null) {
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT * FROM " . $this->table_name . " WHERE 1=1";
        $params = [];

        if ($status) {
            $sql .= " AND status = :status";
            $params['status'] = $status;
        }

        if ($email) {
            $sql .= " AND recipient_email ILIKE :email";
            $params['email'] = '%' . $email . '%';
        }

        $sql .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($sql);
        
        foreach ($params as $key => $value) {
            $stmt->bindParam(':' . $key, $value);
        }
        
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $history = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $history[] = $row;
        }

        return $history;
    }

    /**
     * Get total count for pagination
     */
    public function getTotalCount($status = null, $email = null) {
        $sql = "SELECT COUNT(*) as total FROM " . $this->table_name . " WHERE 1=1";
        $params = [];

        if ($status) {
            $sql .= " AND status = :status";
            $params['status'] = $status;
        }

        if ($email) {
            $sql .= " AND recipient_email ILIKE :email";
            $params['email'] = '%' . $email . '%';
        }

        $stmt = $this->conn->prepare($sql);
        
        foreach ($params as $key => $value) {
            $stmt->bindParam(':' . $key, $value);
        }
        
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return (int) $result['total'];
    }

    /**
     * Get email statistics
     */
    public function getStats($days = 30) {
        $sql = "SELECT 
                    status,
                    COUNT(*) as count,
                    DATE(created_at) as date
                FROM " . $this->table_name . "
                WHERE created_at >= NOW() - INTERVAL ':days days'
                GROUP BY status, DATE(created_at)
                ORDER BY date DESC";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':days', $days, PDO::PARAM_INT);
        $stmt->execute();

        $stats = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $stats[] = $row;
        }

        return $stats;
    }

    /**
     * Get failed emails for retry
     */
    public function getFailedEmails($limit = 50) {
        $sql = "SELECT * FROM " . $this->table_name . "
                WHERE status = 'failed'
                ORDER BY created_at ASC
                LIMIT :limit";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        $failed = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $failed[] = $row;
        }

        return $failed;
    }

    /**
     * Clean old records (older than specified days)
     */
    public function cleanOldRecords($days = 90) {
        $sql = "DELETE FROM " . $this->table_name . " 
                WHERE created_at < NOW() - INTERVAL ':days days'";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':days', $days, PDO::PARAM_INT);
        
        return $stmt->execute();
    }

    /**
     * Convert object to array
     */
    public function toArray() {
        return [
            'id' => $this->id,
            'template_code' => $this->template_code,
            'recipient_email' => $this->recipient_email,
            'recipient_name' => $this->recipient_name,
            'subject' => $this->subject,
            'body_html' => $this->body_html,
            'body_text' => $this->body_text,
            'variables' => json_decode($this->variables, true),
            'status' => $this->status,
            'sent_at' => $this->sent_at,
            'error_message' => $this->error_message,
            'created_at' => $this->created_at
        ];
    }
}
?>