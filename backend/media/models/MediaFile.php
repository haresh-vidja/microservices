<?php
/**
 * MediaFile Model
 * Handles database operations for media files
 */

require_once '../config/database.php';

class MediaFile {
    private $conn;
    private $table_name = "media_files";
    
    public $id;
    public $original_filename;
    public $stored_filename;
    public $file_size;
    public $file_extension;
    public $content_type;
    public $upload_type;
    public $access_url;
    public $thumbnail_url;
    public $is_used;
    public $uploaded_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Create new media file record
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                (original_filename, stored_filename, file_size, file_extension, 
                 content_type, upload_type, access_url, thumbnail_url, is_used)
                VALUES
                (:original_filename, :stored_filename, :file_size, :file_extension,
                 :content_type, :upload_type, :access_url, :thumbnail_url, :is_used)
                RETURNING id";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->original_filename = htmlspecialchars(strip_tags($this->original_filename));
        $this->stored_filename = htmlspecialchars(strip_tags($this->stored_filename));
        $this->file_extension = htmlspecialchars(strip_tags($this->file_extension));
        $this->content_type = htmlspecialchars(strip_tags($this->content_type));
        $this->upload_type = htmlspecialchars(strip_tags($this->upload_type));
        $this->access_url = htmlspecialchars(strip_tags($this->access_url));

        // Bind values
        $stmt->bindParam(":original_filename", $this->original_filename);
        $stmt->bindParam(":stored_filename", $this->stored_filename);
        $stmt->bindParam(":file_size", $this->file_size, PDO::PARAM_INT);
        $stmt->bindParam(":file_extension", $this->file_extension);
        $stmt->bindParam(":content_type", $this->content_type);
        $stmt->bindParam(":upload_type", $this->upload_type);
        $stmt->bindParam(":access_url", $this->access_url);
        $stmt->bindParam(":thumbnail_url", $this->thumbnail_url);
        $stmt->bindParam(":is_used", $this->is_used, PDO::PARAM_INT);

        if($stmt->execute()) {
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['id'];
        }

        return false;
    }

    /**
     * Get media file by ID
     */
    public function getById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $this->id = $row['id'];
            $this->original_filename = $row['original_filename'];
            $this->stored_filename = $row['stored_filename'];
            $this->file_size = $row['file_size'];
            $this->file_extension = $row['file_extension'];
            $this->content_type = $row['content_type'];
            $this->upload_type = $row['upload_type'];
            $this->access_url = $row['access_url'];
            $this->thumbnail_url = $row['thumbnail_url'];
            $this->is_used = $row['is_used'];
            $this->uploaded_at = $row['uploaded_at'];
            $this->updated_at = $row['updated_at'];

            return true;
        }

        return false;
    }

    /**
     * Update is_used status
     */
    public function updateUsedStatus($id, $is_used) {
        $query = "UPDATE " . $this->table_name . " 
                SET is_used = :is_used, updated_at = CURRENT_TIMESTAMP 
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":is_used", $is_used, PDO::PARAM_INT);
        $stmt->bindParam(":id", $id);

        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    /**
     * Mark multiple files as used
     */
    public function markMultipleAsUsed($ids) {
        if (empty($ids)) {
            return false;
        }

        $placeholders = str_repeat('?,', count($ids) - 1) . '?';
        $query = "UPDATE " . $this->table_name . " 
                SET is_used = 1, updated_at = CURRENT_TIMESTAMP 
                WHERE id IN ($placeholders)";

        $stmt = $this->conn->prepare($query);
        
        if($stmt->execute($ids)) {
            return $stmt->rowCount();
        }

        return false;
    }

    /**
     * Get temporary files older than 4 hours
     */
    public function getTemporaryFiles() {
        $query = "SELECT * FROM " . $this->table_name . " 
                WHERE is_used = 0 AND uploaded_at < NOW() - INTERVAL '4 hours'";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Delete media file record
     */
    public function delete($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);

        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    /**
     * Get all media files with pagination
     */
    public function getAll($page = 1, $limit = 10, $upload_type = null) {
        $offset = ($page - 1) * $limit;
        
        $where_clause = "";
        if ($upload_type) {
            $where_clause = " WHERE upload_type = :upload_type";
        }

        $query = "SELECT * FROM " . $this->table_name . $where_clause . "
                ORDER BY uploaded_at DESC 
                LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($query);
        
        if ($upload_type) {
            $stmt->bindParam(":upload_type", $upload_type);
        }
        
        $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
        $stmt->bindParam(":offset", $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get total count
     */
    public function getTotalCount($upload_type = null) {
        $where_clause = "";
        if ($upload_type) {
            $where_clause = " WHERE upload_type = :upload_type";
        }

        $query = "SELECT COUNT(*) as total FROM " . $this->table_name . $where_clause;
        $stmt = $this->conn->prepare($query);
        
        if ($upload_type) {
            $stmt->bindParam(":upload_type", $upload_type);
        }
        
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $row['total'];
    }
}
?>