<?php
/**
 * Media Controller
 * Handles API requests for media operations
 * 
 * @package MediaService
 * @class MediaController
 * @description Manages file uploads, downloads, validation, and cleanup operations.
 * Handles image processing, thumbnail generation, and media metadata management.
 */

require_once __DIR__ . '/../models/MediaFile.php';
require_once __DIR__ . '/../utils/FileHandler.php';
require_once __DIR__ . '/../config/database.php';

class MediaController {
    private $db;
    private $media_file;
    private $file_handler;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        
        // Create tables if they don't exist
        $database->createTables();
        
        $this->media_file = new MediaFile($this->db);
        $this->file_handler = new FileHandler();
    }

    /**
     * Handle file upload with validation and processing
     * 
     * @method uploadFile
     * @return void Outputs JSON response
     * @throws Exception File upload errors, validation failures
     * @description Processes multipart file uploads, validates file types,
     * generates thumbnails for images, and stores metadata in database
     */
    public function uploadFile() {
        try {
            // Check if file was uploaded
            if (!isset($_FILES['file'])) {
                $this->sendResponse(400, false, 'No file uploaded');
                return;
            }

            $file = $_FILES['file'];
            $upload_type = $_POST['type'] ?? 'temp';

            // Validate upload type
            $allowed_types = ['profile', 'service', 'temp'];
            if (!in_array($upload_type, $allowed_types)) {
                $upload_type = 'temp';
            }

            // Handle file upload
            $file_data = $this->file_handler->handleUpload($file, $upload_type);

            // Save to database
            $this->media_file->original_filename = $file_data['original_filename'];
            $this->media_file->stored_filename = $file_data['stored_filename'];
            $this->media_file->file_size = $file_data['file_size'];
            $this->media_file->file_extension = $file_data['file_extension'];
            $this->media_file->content_type = $file_data['content_type'];
            $this->media_file->upload_type = $file_data['upload_type'];
            $this->media_file->access_url = $file_data['access_url'];
            $this->media_file->thumbnail_url = $file_data['thumbnail_url'];
            $this->media_file->is_used = 0;

            $file_id = $this->media_file->create();

            if ($file_id) {
                // Only return ID for security - no direct file paths
                $response_data = [
                    'id' => $file_id,
                    'original_filename' => $file_data['original_filename'],
                    'file_size' => $file_data['file_size'],
                    'content_type' => $file_data['content_type'],
                    'has_thumbnail' => !empty($file_data['thumbnail_url'])
                ];

                $this->sendResponse(201, true, 'File uploaded successfully', $response_data);
            } else {
                // Delete uploaded file if database insertion failed
                $this->file_handler->deleteFile($file_data['file_path'], $file_data['thumbnail_url']);
                $this->sendResponse(500, false, 'Failed to save file information');
            }

        } catch (Exception $e) {
            $this->sendResponse(400, false, $e->getMessage());
        }
    }

    /**
     * Serve media file securely by ID
     */
    public function serveMedia($media_id) {
        try {
            if (!$this->isValidUUID($media_id)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid media ID format']);
                return;
            }

            if (!$this->media_file->getById($media_id)) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Media not found']);
                return;
            }

            $file_path = dirname(__DIR__) . '/uploads/' . $this->media_file->upload_type . '/' . $this->media_file->stored_filename;
            
            if (!file_exists($file_path)) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'File not found on disk']);
                return;
            }

            // Get MIME type
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime_type = finfo_file($finfo, $file_path);
            finfo_close($finfo);

            // Set headers for secure serving
            header('Content-Type: ' . $mime_type);
            header('Content-Length: ' . filesize($file_path));
            header('Cache-Control: public, max-age=86400'); // 1 day cache
            header('Content-Disposition: inline; filename="' . $this->media_file->original_filename . '"');
            
            // Security headers
            header('X-Content-Type-Options: nosniff');
            header('X-Frame-Options: DENY');
            
            // Stream file
            readfile($file_path);
            exit;

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error serving file: ' . $e->getMessage()]);
        }
    }

    /**
     * Serve media thumbnail securely by ID
     */
    public function serveMediaThumb($media_id) {
        try {
            if (!$this->isValidUUID($media_id)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid media ID format']);
                return;
            }

            if (!$this->media_file->getById($media_id)) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Media not found']);
                return;
            }

            // If no thumbnail, serve original (for non-image files)
            $thumb_path = null;
            if ($this->media_file->thumbnail_url) {
                $thumb_path = dirname(__DIR__) . '/uploads/thumbnails/' . basename($this->media_file->thumbnail_url);
            }

            // Fallback to original if thumbnail doesn't exist
            if (!$thumb_path || !file_exists($thumb_path)) {
                $thumb_path = dirname(__DIR__) . '/uploads/' . $this->media_file->upload_type . '/' . $this->media_file->stored_filename;
            }

            if (!file_exists($thumb_path)) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Thumbnail not found']);
                return;
            }

            // Get MIME type
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime_type = finfo_file($finfo, $thumb_path);
            finfo_close($finfo);

            // Set headers
            header('Content-Type: ' . $mime_type);
            header('Content-Length: ' . filesize($thumb_path));
            header('Cache-Control: public, max-age=86400'); // 1 day cache
            header('Content-Disposition: inline; filename="thumb_' . $this->media_file->original_filename . '"');
            
            // Security headers
            header('X-Content-Type-Options: nosniff');
            header('X-Frame-Options: DENY');
            
            // Stream file
            readfile($thumb_path);
            exit;

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error serving thumbnail: ' . $e->getMessage()]);
        }
    }

    /**
     * Mark single file as used (for service-to-service communication)
     */
    public function markAsUsed($media_id) {
        try {
            if (!$this->isValidUUID($media_id)) {
                $this->sendResponse(400, false, 'Invalid media ID format');
                return;
            }

            $success = $this->media_file->updateUsedStatus($media_id, 1);
            
            if ($success) {
                $this->sendResponse(200, true, 'Media marked as used', ['media_id' => $media_id]);
            } else {
                $this->sendResponse(404, false, 'Media not found or failed to update');
            }

        } catch (Exception $e) {
            $this->sendResponse(500, false, $e->getMessage());
        }
    }

    /**
     * Mark files as used (bulk)
     */
    public function markAsUsedBulk() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['ids']) || !is_array($input['ids'])) {
                $this->sendResponse(400, false, 'Invalid or missing ids array');
                return;
            }

            $ids = $input['ids'];
            if (empty($ids)) {
                $this->sendResponse(400, false, 'No IDs provided');
                return;
            }

            // Validate UUIDs
            foreach ($ids as $id) {
                if (!$this->isValidUUID($id)) {
                    $this->sendResponse(400, false, 'Invalid UUID format: ' . $id);
                    return;
                }
            }

            $updated_count = $this->media_file->markMultipleAsUsed($ids);

            if ($updated_count !== false) {
                $this->sendResponse(200, true, "Successfully marked {$updated_count} files as used", [
                    'updated_count' => $updated_count,
                    'ids' => $ids
                ]);
            } else {
                $this->sendResponse(500, false, 'Failed to update files');
            }

        } catch (Exception $e) {
            $this->sendResponse(500, false, $e->getMessage());
        }
    }

    /**
     * Get file by ID
     */
    public function getFile($id) {
        try {
            if (!$this->isValidUUID($id)) {
                $this->sendResponse(400, false, 'Invalid UUID format');
                return;
            }

            if ($this->media_file->getById($id)) {
                $data = [
                    'id' => $this->media_file->id,
                    'original_filename' => $this->media_file->original_filename,
                    'stored_filename' => $this->media_file->stored_filename,
                    'file_size' => (int)$this->media_file->file_size,
                    'file_extension' => $this->media_file->file_extension,
                    'content_type' => $this->media_file->content_type,
                    'upload_type' => $this->media_file->upload_type,
                    'access_url' => $this->media_file->access_url,
                    'thumbnail_url' => $this->media_file->thumbnail_url,
                    'is_used' => (int)$this->media_file->is_used,
                    'uploaded_at' => $this->media_file->uploaded_at,
                    'updated_at' => $this->media_file->updated_at
                ];

                $this->sendResponse(200, true, 'File retrieved successfully', $data);
            } else {
                $this->sendResponse(404, false, 'File not found');
            }

        } catch (Exception $e) {
            $this->sendResponse(500, false, $e->getMessage());
        }
    }

    /**
     * Delete file
     */
    public function deleteFile($id) {
        try {
            if (!$this->isValidUUID($id)) {
                $this->sendResponse(400, false, 'Invalid UUID format');
                return;
            }

            // Get file information first
            if (!$this->media_file->getById($id)) {
                $this->sendResponse(404, false, 'File not found');
                return;
            }

            // Delete physical file
            $file_path = dirname(__DIR__) . '/uploads/' . $this->media_file->upload_type . '/' . $this->media_file->stored_filename;
            $this->file_handler->deleteFile($file_path, $this->media_file->thumbnail_url);

            // Delete database record
            if ($this->media_file->delete($id)) {
                $this->sendResponse(200, true, 'File deleted successfully');
            } else {
                $this->sendResponse(500, false, 'Failed to delete file record');
            }

        } catch (Exception $e) {
            $this->sendResponse(500, false, $e->getMessage());
        }
    }

    /**
     * List files with pagination
     */
    public function listFiles() {
        try {
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            $upload_type = isset($_GET['type']) ? $_GET['type'] : null;

            if ($page < 1) $page = 1;
            if ($limit < 1 || $limit > 100) $limit = 10;

            $files = $this->media_file->getAll($page, $limit, $upload_type);
            $total = $this->media_file->getTotalCount($upload_type);

            $response_data = [
                'files' => $files,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => (int)$total,
                    'pages' => ceil($total / $limit)
                ]
            ];

            $this->sendResponse(200, true, 'Files retrieved successfully', $response_data);

        } catch (Exception $e) {
            $this->sendResponse(500, false, $e->getMessage());
        }
    }

    /**
     * Clean up temporary files (cron job)
     */
    public function cleanupTemporaryFiles() {
        try {
            $temp_files = $this->media_file->getTemporaryFiles();
            $deleted_count = 0;

            foreach ($temp_files as $file) {
                // Delete physical file
                $file_path = dirname(__DIR__) . '/uploads/' . $file['upload_type'] . '/' . $file['stored_filename'];
                $this->file_handler->deleteFile($file_path, $file['thumbnail_url']);

                // Delete database record
                if ($this->media_file->delete($file['id'])) {
                    $deleted_count++;
                }
            }

            $this->sendResponse(200, true, "Cleaned up {$deleted_count} temporary files", [
                'deleted_count' => $deleted_count,
                'total_found' => count($temp_files)
            ]);

        } catch (Exception $e) {
            $this->sendResponse(500, false, $e->getMessage());
        }
    }

    /**
     * Validate multiple media files (for inter-service communication)
     */
    public function validateFiles() {
        try {
            // Verify service key
            $service_key = $_SERVER['HTTP_X_SERVICE_KEY'] ?? null;
            $valid_keys = [
                'admin-secret-key-2024',
                'order-secret-key-2024', 
                'customer-secret-key-2024',
                'seller-secret-key-2024',
                'product-secret-key-2024',
                'notification-secret-key-2024'
            ];

            if (!$service_key || !in_array($service_key, $valid_keys)) {
                $this->sendResponse(403, false, 'Invalid or missing service key');
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            $file_ids = $input['fileIds'] ?? [];

            if (empty($file_ids) || !is_array($file_ids)) {
                $this->sendResponse(400, false, 'fileIds array is required');
                return;
            }

            $results = [];
            foreach ($file_ids as $file_id) {
                if (!$this->isValidUUID($file_id)) {
                    $results[] = [
                        'id' => $file_id,
                        'valid' => false,
                        'exists' => false,
                        'reason' => 'Invalid UUID format'
                    ];
                    continue;
                }

                if (!$this->media_file->getById($file_id)) {
                    $results[] = [
                        'id' => $file_id,
                        'valid' => false,
                        'exists' => false,
                        'reason' => 'File not found'
                    ];
                    continue;
                }

                // Check if file physically exists
                $file_path = dirname(__DIR__) . '/uploads/' . $this->media_file->upload_type . '/' . $this->media_file->stored_filename;
                $file_exists = file_exists($file_path);

                $results[] = [
                    'id' => $file_id,
                    'valid' => $file_exists,
                    'exists' => true,
                    'filename' => $this->media_file->stored_filename,
                    'original_name' => $this->media_file->original_filename,
                    'file_size' => $this->media_file->file_size,
                    'file_type' => $this->media_file->content_type,
                    'url' => $this->media_file->access_url,
                    'thumbnail_url' => $this->media_file->thumbnail_url,
                    'is_used' => $this->media_file->is_used,
                    'uploaded_at' => $this->media_file->uploaded_at
                ];
            }

            $summary = [
                'total' => count($file_ids),
                'valid' => count(array_filter($results, fn($r) => $r['valid'])),
                'invalid' => count(array_filter($results, fn($r) => !$r['valid']))
            ];

            $this->sendResponse(200, true, 'File validation completed', [
                'files' => $results,
                'summary' => $summary
            ]);

        } catch (Exception $e) {
            $this->sendResponse(500, false, $e->getMessage());
        }
    }

    /**
     * Bulk mark files as used (for inter-service communication)
     */
    public function bulkMarkAsUsed() {
        try {
            // Verify service key
            $service_key = $_SERVER['HTTP_X_SERVICE_KEY'] ?? null;
            $valid_keys = [
                'admin-secret-key-2024',
                'order-secret-key-2024', 
                'customer-secret-key-2024',
                'seller-secret-key-2024',
                'product-secret-key-2024',
                'notification-secret-key-2024'
            ];

            if (!$service_key || !in_array($service_key, $valid_keys)) {
                $this->sendResponse(403, false, 'Invalid or missing service key');
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            $file_ids = $input['fileIds'] ?? [];

            if (empty($file_ids) || !is_array($file_ids)) {
                $this->sendResponse(400, false, 'fileIds array is required');
                return;
            }

            $results = [];
            foreach ($file_ids as $file_id) {
                if (!$this->isValidUUID($file_id)) {
                    $results[] = [
                        'id' => $file_id,
                        'success' => false,
                        'message' => 'Invalid UUID format'
                    ];
                    continue;
                }

                $success = $this->media_file->updateUsedStatus($file_id, 1);
                $results[] = [
                    'id' => $file_id,
                    'success' => $success,
                    'message' => $success ? 'Marked as used' : 'Failed to mark as used'
                ];
            }

            $summary = [
                'total' => count($file_ids),
                'successful' => count(array_filter($results, fn($r) => $r['success'])),
                'failed' => count(array_filter($results, fn($r) => !$r['success']))
            ];

            $this->sendResponse(200, true, 'Bulk mark as used completed', [
                'results' => $results,
                'summary' => $summary
            ]);

        } catch (Exception $e) {
            $this->sendResponse(500, false, $e->getMessage());
        }
    }

    /**
     * Mark files as not used
     */
    public function markAsNotUsed() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['ids']) || !is_array($input['ids'])) {
                $this->sendResponse(400, false, 'Invalid or missing ids array');
                return;
            }

            $ids = $input['ids'];
            if (empty($ids)) {
                $this->sendResponse(400, false, 'No IDs provided');
                return;
            }

            // Validate UUIDs
            foreach ($ids as $id) {
                if (!$this->isValidUUID($id)) {
                    $this->sendResponse(400, false, 'Invalid UUID format: ' . $id);
                    return;
                }
            }

            $updated_count = $this->media_file->markMultipleAsNotUsed($ids);

            if ($updated_count !== false) {
                $this->sendResponse(200, true, "Successfully marked {$updated_count} files as not used", [
                    'updated_count' => $updated_count,
                    'ids' => $ids
                ]);
            } else {
                $this->sendResponse(500, false, 'Failed to update files');
            }

        } catch (Exception $e) {
            $this->sendResponse(500, false, $e->getMessage());
        }
    }

    /**
     * Health check
     */
    public function healthCheck() {
        $this->sendResponse(200, true, 'Media service is healthy', [
            'service' => 'media-service-php',
            'timestamp' => date('c'),
            'database' => $this->db ? 'connected' : 'disconnected'
        ]);
    }

    /**
     * Validate UUID format
     */
    private function isValidUUID($uuid) {
        if ($uuid === null || $uuid === '') {
            return false;
        }
        return preg_match('/^[a-f\d]{8}(-[a-f\d]{4}){4}[a-f\d]{8}$/i', $uuid);
    }

    /**
     * Send JSON response
     */
    private function sendResponse($status_code, $success, $message, $data = null) {
        http_response_code($status_code);
        header('Content-Type: application/json');
        
        $response = [
            'success' => $success,
            'message' => $message
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        echo json_encode($response, JSON_PRETTY_PRINT);
        exit;
    }
}
?>