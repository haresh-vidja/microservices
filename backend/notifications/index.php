<?php
/**
 * Notification Service API Entry Point
 * 
 * @fileoverview Core PHP service for email notifications with template management
 * @description This service handles email notifications, template management, SMTP
 * configuration, and notification history. It provides RESTful APIs for sending
 * emails and managing email templates with support for multiple notification types.
 * 
 * @author Haresh Vidja
 * @version 1.0.0
 * @since 2023-11-01
 * @package NotificationService
 */

// Enable error reporting for development environment
error_reporting(E_ALL);
ini_set('display_errors', 1);

/**
 * CORS Headers Configuration
 * @description Allows cross-origin requests from any domain
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Service-Key');

/**
 * Handle Preflight OPTIONS Request
 * @description Responds to CORS preflight requests for complex HTTP methods
 */
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include the main controller for notification operations
require_once 'controllers/NotificationController.php';

/**
 * URL Parsing and Route Extraction
 * @description Extracts the request path and method for routing
 */
$path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$segments = explode('/', $path);
$method = $_SERVER['REQUEST_METHOD'];

/**
 * Controller Initialization
 * @description Creates instance of NotificationController for handling requests
 */
$controller = new NotificationController();

/**
 * Request Routing Logic
 * @description Routes incoming requests to appropriate controller methods
 * based on URL path and HTTP method
 */
try {
    // Health check endpoint for monitoring
    if ($path === 'health' && $method === 'GET') {
        $controller->healthCheck();
    } 
    // API routes with /api/v1 prefix structure
    elseif (count($segments) >= 3 && $segments[0] === 'api' && $segments[1] === 'v1') {
        $endpoint = $segments[2]; // Extract endpoint (e.g., 'templates', 'smtp', 'send')
        
        switch ($endpoint) {
            case 'templates':
                // Handle email template operations
                if (count($segments) === 3) {
                    // List all templates or create new template
                    if ($method === 'GET') {
                        $controller->getTemplates(); // Get all email templates
                    } elseif ($method === 'POST') {
                        $controller->createTemplate(); // Create new email template
                    }
                } elseif (count($segments) === 4) {
                    // Operations on specific template by ID
                    $templateId = $segments[3]; // Extract template ID from URL
                    
                    if ($method === 'GET') {
                        $controller->getTemplate($templateId); // Get specific template
                    } elseif ($method === 'PUT') {
                        $controller->updateTemplate($templateId); // Update specific template
                    } elseif ($method === 'DELETE') {
                        $controller->deleteTemplate($templateId); // Delete specific template
                    }
                }
                break;
                
            case 'smtp':
                // Handle SMTP configuration operations
                if ($method === 'GET') {
                    $controller->getSmtpConfig(); // Retrieve current SMTP configuration
                } elseif ($method === 'POST') {
                    $controller->updateSmtpConfig(); // Update SMTP configuration
                }
                break;
                
            case 'send':
                // Handle notification sending
                if ($method === 'POST') {
                    $controller->sendNotification(); // Send email notification
                }
                break;
                
            case 'history':
                // Handle notification history operations
                if ($method === 'GET') {
                    $controller->getHistory(); // Get notification history
                }
                break;
                
            default:
                // Handle unknown endpoints
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
        }
    } else {
        // Handle non-API requests
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Route not found']);
    }
} catch (Exception $e) {
    /**
     * Global Error Handler
     * @description Catches and handles any unhandled exceptions
     */
    error_log('Notification Service Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>