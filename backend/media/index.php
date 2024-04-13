<?php
/**
 * Media Service API Entry Point
 * Core PHP REST API for media file management
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set timezone
date_default_timezone_set('UTC');

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include controller
require_once 'controllers/MediaController.php';

// Parse URL and get route
$request_uri = $_SERVER['REQUEST_URI'];
$script_name = dirname($_SERVER['SCRIPT_NAME']);

// Remove script path from URI
if ($script_name !== '/') {
    $request_uri = str_replace($script_name, '', $request_uri);
}

// Remove query string
$path = parse_url($request_uri, PHP_URL_PATH);
$path = trim($path, '/');

// Split path into segments
$segments = explode('/', $path);

// Get HTTP method
$method = $_SERVER['REQUEST_METHOD'];

// Initialize controller
$controller = new MediaController();

// Route requests
try {
    // Health check
    if ($path === 'health' && $method === 'GET') {
        $controller->healthCheck();
        exit;
    }

    // API routes (expect /api/v1 prefix)
    if (count($segments) >= 3 && $segments[0] === 'api' && $segments[1] === 'v1') {
        $endpoint = $segments[2];
        
        switch ($endpoint) {
            case 'media':
                if (count($segments) >= 4) {
                    $action = $segments[3];
                    
                    switch ($action) {
                        case 'upload':
                            if ($method === 'POST') {
                                $controller->uploadFile();
                            } else {
                                http_response_code(405);
                                echo json_encode(['success' => false, 'message' => 'Method not allowed']);
                            }
                            break;
                            
                        case 'serve':
                            if ($method === 'GET' && count($segments) >= 5) {
                                $media_id = $segments[4];
                                $controller->serveMedia($media_id);
                            } else {
                                http_response_code(404);
                                echo json_encode(['success' => false, 'message' => 'Media ID required']);
                            }
                            break;
                            
                        case 'serve-thumb':
                            if ($method === 'GET' && count($segments) >= 5) {
                                $media_id = $segments[4];
                                $controller->serveMediaThumb($media_id);
                            } else {
                                http_response_code(404);
                                echo json_encode(['success' => false, 'message' => 'Media ID required']);
                            }
                            break;
                            
                        case 'mark-used':
                            if ($method === 'POST' && count($segments) >= 5) {
                                $media_id = $segments[4];
                                $controller->markAsUsed($media_id);
                            } else {
                                http_response_code(400);
                                echo json_encode(['success' => false, 'message' => 'Media ID required']);
                            }
                            break;
                            
                        case 'mark-not-used':
                            if ($method === 'POST') {
                                $controller->markAsNotUsed();
                            } else {
                                http_response_code(405);
                                echo json_encode(['success' => false, 'message' => 'Method not allowed']);
                            }
                            break;
                            
                        case 'cleanup':
                            if ($method === 'POST') {
                                $controller->cleanupTemporaryFiles();
                            } else {
                                http_response_code(405);
                                echo json_encode(['success' => false, 'message' => 'Method not allowed']);
                            }
                            break;
                            
                        case 'validate':
                            if ($method === 'POST') {
                                $controller->validateFiles();
                            } else {
                                http_response_code(405);
                                echo json_encode(['success' => false, 'message' => 'Method not allowed']);
                            }
                            break;
                            
                        case 'bulk-mark-used':
                            if ($method === 'POST') {
                                $controller->bulkMarkAsUsed();
                            } else {
                                http_response_code(405);
                                echo json_encode(['success' => false, 'message' => 'Method not allowed']);
                            }
                            break;

                        default:
                            // Check if it's a UUID (file ID)
                            if (preg_match('/^[a-f\d]{8}(-[a-f\d]{4}){4}[a-f\d]{8}$/i', $action)) {
                                switch ($method) {
                                    case 'GET':
                                        $controller->getFile($action);
                                        break;
                                    case 'DELETE':
                                        $controller->deleteFile($action);
                                        break;
                                    default:
                                        http_response_code(405);
                                        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
                                }
                            } else {
                                http_response_code(404);
                                echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
                            }
                    }
                } else {
                    // List files
                    if ($method === 'GET') {
                        $controller->listFiles();
                    } else {
                        http_response_code(405);
                        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
                    }
                }
                break;
                
            default:
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'API endpoint not found']);
        }
    }
    // Direct file access disabled for security
    // All media access now goes through API Gateway -> serve endpoints
    else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Route not found']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error: ' . $e->getMessage()
    ]);
}
?>