<?php
/**
 * Cleanup Script for Temporary Files
 * Run this script via cron job every hour
 * Example cron: 0 * * * * /usr/bin/php /path/to/cleanup.php
 */

// Set timezone
date_default_timezone_set('UTC');

// Include required files
require_once 'controllers/MediaController.php';

// Log function
function logMessage($message) {
    $log_file = __DIR__ . '/logs/cleanup.log';
    $log_dir = dirname($log_file);
    
    if (!is_dir($log_dir)) {
        mkdir($log_dir, 0755, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($log_file, "[{$timestamp}] {$message}\n", FILE_APPEND | LOCK_EX);
    echo "[{$timestamp}] {$message}\n";
}

try {
    logMessage("Starting cleanup process...");
    
    // Initialize controller
    $controller = new MediaController();
    
    // Capture output
    ob_start();
    $controller->cleanupTemporaryFiles();
    $output = ob_get_clean();
    
    // Parse JSON response
    $response = json_decode($output, true);
    
    if ($response && $response['success']) {
        $deleted_count = $response['data']['deleted_count'] ?? 0;
        $total_found = $response['data']['total_found'] ?? 0;
        logMessage("Cleanup completed successfully. Found: {$total_found}, Deleted: {$deleted_count}");
    } else {
        $message = $response['message'] ?? 'Unknown error';
        logMessage("Cleanup failed: {$message}");
    }
    
} catch (Exception $e) {
    logMessage("Cleanup error: " . $e->getMessage());
}

logMessage("Cleanup process finished.");
?>