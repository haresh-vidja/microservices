<?php
/**
 * File Handler Utility
 * Handles file operations and image processing
 */

class FileHandler {
    private $upload_base_path;
    private $allowed_types = [
        'image' => ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        'document' => ['application/pdf'],
        'csv' => ['text/csv', 'application/csv', 'text/plain']
    ];
    
    private $max_file_size = 5242880; // 5MB

    public function __construct() {
        $this->upload_base_path = dirname(__DIR__) . '/uploads/';
        $this->ensureDirectoriesExist();
    }

    /**
     * Ensure upload directories exist
     */
    private function ensureDirectoriesExist() {
        $directories = ['profile', 'service', 'temp', 'thumbnails'];
        
        foreach ($directories as $dir) {
            $path = $this->upload_base_path . $dir;
            if (!is_dir($path)) {
                mkdir($path, 0755, true);
            }
        }
    }

    /**
     * Generate unique filename with UUID
     */
    private function generateUniqueFilename($extension) {
        return $this->generateUUID() . '.' . $extension;
    }

    /**
     * Generate UUID v4
     */
    private function generateUUID() {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    /**
     * Validate uploaded file
     */
    public function validateFile($file) {
        $errors = [];

        // Check if file was uploaded
        if (!isset($file['tmp_name']) || empty($file['tmp_name'])) {
            $errors[] = 'No file uploaded';
            return $errors;
        }

        // Check file size
        if ($file['size'] > $this->max_file_size) {
            $errors[] = 'File size exceeds maximum limit of 5MB';
        }

        // Check file type
        $is_valid_type = false;
        foreach ($this->allowed_types as $category => $types) {
            if (in_array($file['type'], $types)) {
                $is_valid_type = true;
                break;
            }
        }

        if (!$is_valid_type) {
            $errors[] = 'Invalid file type. Only images, PDF, and CSV files are allowed';
        }

        // Additional MIME type validation
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $detected_type = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if ($detected_type !== $file['type']) {
            $errors[] = 'File type mismatch. Detected: ' . $detected_type;
        }

        return $errors;
    }

    /**
     * Handle file upload
     */
    public function handleUpload($file, $upload_type = 'temp') {
        // Validate file
        $validation_errors = $this->validateFile($file);
        if (!empty($validation_errors)) {
            throw new Exception(implode(', ', $validation_errors));
        }

        // Get file extension
        $original_filename = $file['name'];
        $extension = strtolower(pathinfo($original_filename, PATHINFO_EXTENSION));
        
        // Generate unique filename
        $stored_filename = $this->generateUniqueFilename($extension);
        
        // Determine upload directory
        $upload_dir = $this->upload_base_path . $upload_type . '/';
        $file_path = $upload_dir . $stored_filename;

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $file_path)) {
            throw new Exception('Failed to move uploaded file');
        }

        // Create thumbnail for images
        $thumbnail_url = null;
        if ($this->isImage($file['type'])) {
            $thumbnail_url = $this->createThumbnail($file_path, $stored_filename, $upload_type);
        }

        // Generate access URL
        $access_url = $this->generateAccessUrl($upload_type, $stored_filename);

        return [
            'original_filename' => $original_filename,
            'stored_filename' => $stored_filename,
            'file_size' => $file['size'],
            'file_extension' => $extension,
            'content_type' => $file['type'],
            'upload_type' => $upload_type,
            'access_url' => $access_url,
            'thumbnail_url' => $thumbnail_url,
            'file_path' => $file_path
        ];
    }

    /**
     * Check if file is an image
     */
    private function isImage($mime_type) {
        return in_array($mime_type, $this->allowed_types['image']);
    }

    /**
     * Create thumbnail for images
     */
    private function createThumbnail($source_path, $filename, $upload_type) {
        try {
            // Get image info
            $image_info = getimagesize($source_path);
            if (!$image_info) {
                return null;
            }

            $width = $image_info[0];
            $height = $image_info[1];
            $type = $image_info[2];

            // Create image resource based on type
            switch ($type) {
                case IMAGETYPE_JPEG:
                    $source = imagecreatefromjpeg($source_path);
                    break;
                case IMAGETYPE_PNG:
                    $source = imagecreatefrompng($source_path);
                    break;
                case IMAGETYPE_GIF:
                    $source = imagecreatefromgif($source_path);
                    break;
                case IMAGETYPE_WEBP:
                    $source = imagecreatefromwebp($source_path);
                    break;
                default:
                    return null;
            }

            if (!$source) {
                return null;
            }

            // Calculate thumbnail dimensions (200x200)
            $thumb_width = 200;
            $thumb_height = 200;

            // Calculate crop dimensions for square thumbnail
            if ($width > $height) {
                $crop_size = $height;
                $crop_x = ($width - $height) / 2;
                $crop_y = 0;
            } else {
                $crop_size = $width;
                $crop_x = 0;
                $crop_y = ($height - $width) / 2;
            }

            // Create thumbnail
            $thumbnail = imagecreatetruecolor($thumb_width, $thumb_height);
            
            // Preserve transparency for PNG and GIF
            if ($type == IMAGETYPE_PNG || $type == IMAGETYPE_GIF) {
                imagealphablending($thumbnail, false);
                imagesavealpha($thumbnail, true);
                $transparent = imagecolorallocatealpha($thumbnail, 0, 0, 0, 127);
                imagefill($thumbnail, 0, 0, $transparent);
            }

            // Resample image to create thumbnail
            imagecopyresampled(
                $thumbnail, $source,
                0, 0, $crop_x, $crop_y,
                $thumb_width, $thumb_height,
                $crop_size, $crop_size
            );

            // Generate thumbnail filename
            $thumb_filename = 'thumb_' . $filename;
            $thumb_path = $this->upload_base_path . 'thumbnails/' . $thumb_filename;

            // Save thumbnail
            $success = false;
            switch ($type) {
                case IMAGETYPE_JPEG:
                    $success = imagejpeg($thumbnail, $thumb_path, 80);
                    break;
                case IMAGETYPE_PNG:
                    $success = imagepng($thumbnail, $thumb_path, 8);
                    break;
                case IMAGETYPE_GIF:
                    $success = imagegif($thumbnail, $thumb_path);
                    break;
                case IMAGETYPE_WEBP:
                    $success = imagewebp($thumbnail, $thumb_path, 80);
                    break;
            }

            // Clean up memory
            imagedestroy($source);
            imagedestroy($thumbnail);

            if ($success) {
                return $this->generateAccessUrl('thumbnails', $thumb_filename);
            }

            return null;

        } catch (Exception $e) {
            error_log('Thumbnail creation failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Generate access URL
     */
    private function generateAccessUrl($upload_type, $filename) {
        $base_url = $this->getBaseUrl();
        return $base_url . '/uploads/' . $upload_type . '/' . $filename;
    }

    /**
     * Get base URL
     */
    private function getBaseUrl() {
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $port = $_SERVER['SERVER_PORT'] ?? '3003';
        
        // Don't include port if it's standard (80 for HTTP, 443 for HTTPS)
        if (($protocol === 'http' && $port == '80') || ($protocol === 'https' && $port == '443')) {
            return $protocol . '://' . $host;
        }
        
        return $protocol . '://' . $host . ':' . $port;
    }

    /**
     * Delete file from filesystem
     */
    public function deleteFile($file_path, $thumbnail_url = null) {
        $deleted = false;
        
        // Delete main file
        if (file_exists($file_path)) {
            $deleted = unlink($file_path);
        }

        // Delete thumbnail if exists
        if ($thumbnail_url) {
            $thumbnail_path = $this->urlToPath($thumbnail_url);
            if ($thumbnail_path && file_exists($thumbnail_path)) {
                unlink($thumbnail_path);
            }
        }

        return $deleted;
    }

    /**
     * Convert URL to file path
     */
    private function urlToPath($url) {
        // Extract relative path from URL
        $parsed = parse_url($url);
        $path = $parsed['path'] ?? '';
        
        // Remove leading slash and convert to file path
        $relative_path = ltrim($path, '/');
        $file_path = dirname(__DIR__) . '/' . $relative_path;
        
        return $file_path;
    }

    /**
     * Get file type category
     */
    public function getFileTypeCategory($mime_type) {
        foreach ($this->allowed_types as $category => $types) {
            if (in_array($mime_type, $types)) {
                return $category;
            }
        }
        return 'unknown';
    }
}
?>