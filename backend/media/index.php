<?php
/**
 * Media Service API Entry Point
 * 
 * @fileoverview Core PHP REST API for media file management
 * @description This service handles file uploads, image processing, thumbnail
 * generation, and media file serving. It provides RESTful APIs for media
 * operations and integrates with the PostgreSQL database for metadata storage.
 * 
 * @author Haresh Vidja
 * @version 1.0.0
 * @since 2023-11-01
 * @package MediaService
 */

// Enable error reporting for development environment
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set default timezone to UTC for consistency
date_default_timezone_set('UTC');

/**
 * CORS Headers Configuration
 * @description Allows cross-origin requests from any domain
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

/**
 * Handle Preflight OPTIONS Request
 * @description Responds to CORS preflight requests for complex HTTP methods
 */
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include the main controller for media operations
require_once 'controllers/MediaController.php';

/**
 * URL Parsing and Route Extraction
 * @description Extracts the request path and method for routing
 */
$request_uri = $_SERVER['REQUEST_URI'];
$script_name = dirname($_SERVER['SCRIPT_NAME']);

// Remove script path from URI to get clean path
if ($script_name !== '/') {
    $request_uri = str_replace($script_name, '', $request_uri);
}

// Extract path without query string
$path = parse_url($request_uri, PHP_URL_PATH);
$path = trim($path, '/');

// Split path into segments for routing
$segments = explode('/', $path);

// Get HTTP method for request handling
$method = $_SERVER['REQUEST_METHOD'];

/**
 * Controller Initialization
 * @description Creates instance of MediaController for handling requests
 */
$controller = new MediaController();

/**
 * Request Routing Logic
 * @description Routes incoming requests to appropriate controller methods
 * based on URL path and HTTP method
 */
try {
    // Health check endpoint for monitoring
    if ($path === 'health' && $method === 'GET') {
        $controller->healthCheck();
        exit;
    }

    // API routes with /api/v1 prefix structure
    if (count($segments) >= 3 && $segments[0] === 'api' && $segments[1] === 'v1') {
        $endpoint = $segments[2]; // Extract endpoint (e.g., 'media')
        
        switch ($endpoint) {
            case 'media':
                if (count($segments) >= 4) {
                    $action = $segments[3]; // Extract action (e.g., 'upload', 'serve')
                    
                    switch ($action) {
                        case 'upload':
                            // Handle file upload requests
                            if ($method === 'POST') {
                                $controller->uploadFile();
                            } else {
                                http_response_code(405);
                                echo json_encode(['success' => false, 'message' => 'Method not allowed']);
                            }
                            break;
                            
                        case 'serve':
                            // Serve original media files
                            if ($method === 'GET' && count($segments) >= 5) {
                                $media_id = $segments[4]; // Extract media ID from URL
                                $controller->serveMedia($media_id);
                            } else {
                                http_response_code(404);
                                echo json_encode(['success' => false, 'message' => 'Media ID required']);
                            }
                            break;
                            
                        case 'serve-thumb':
                            // Serve thumbnail versions of media files
                            if ($method === 'GET' && count($segments) >= 5) {
                                $media_id = $segments[4]; // Extract media ID from URL
                                $controller->serveMediaThumb($media_id);
                            } else {
                                http_response_code(404);
                                echo json_encode(['success' => false, 'message' => 'Media ID required']);
                            }
                            break;
                            
                        case 'mark-used':
                            // Mark media files as used by other services
                            if ($method === 'POST' && count($segments) >= 5) {
                                $media_id = $segments[4]; // Extract media ID from URL
                                $controller->markAsUsed($media_id);
                            } else {
                                http_response_code(405);
                                echo json_encode(['success' => false, 'message' => 'Method not allowed']);
                            }
                            break;
                            
                        case 'delete':
                            // Delete media files and associated metadata
                            if ($method === 'DELETE' && count($segments) >= 5) {
                                $media_id = $segments[4]; // Extract media ID from URL
                                $controller->deleteMedia($media_id);
                            } else {
                                http_response_code(405);
                                echo json_encode(['success' => false, 'message' => 'Method not allowed']);
                            }
                            break;
                            
                        case 'info':
                            // Get media file metadata and information
                            if ($method === 'GET' && count($segments) >= 5) {
                                $media_id = $segments[4]; // Extract media ID from URL
                                $controller->getMediaInfo($media_id);
                            } else {
                                http_response_code(404);
                                echo json_encode(['success' => false, 'message' => 'Media ID required']);
                            }
                            break;
                            
                        case 'list':
                            // List media files with optional filtering and pagination
                            if ($method === 'GET') {
                                $controller->listMedia();
                            } else {
                                http_response_code(405);
                                echo json_encode(['success' => false, 'message' => 'Method not allowed']);
                            }
                            break;
                            
                        default:
                            // Handle unknown media actions
                            http_response_code(404);
                            echo json_encode(['success' => false, 'message' => 'Media action not found']);
                            break;
                    }
                } else {
                    // Handle incomplete media endpoint paths
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Media action required']);
                }
                break;
                
            default:
                // Handle unknown endpoints
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
                break;
        }
    } else {
        // Handle non-API requests
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'API endpoint not found']);
    }
    
} catch (Exception $e) {
    /**
     * Global Error Handler
     * @description Catches and handles any unhandled exceptions
     */
    error_log('Media Service Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Internal server error',
        'error' => $e->getMessage()
    ]);
}
?>