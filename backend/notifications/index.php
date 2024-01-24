<?php
/**
 * Notification Service API Entry Point
 * Core PHP service for email notifications with template management
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Service-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'controllers/NotificationController.php';

$path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$segments = explode('/', $path);
$method = $_SERVER['REQUEST_METHOD'];

$controller = new NotificationController();

try {
    if ($path === 'health' && $method === 'GET') {
        $controller->healthCheck();
    } elseif (count($segments) >= 3 && $segments[0] === 'api' && $segments[1] === 'v1') {
        $endpoint = $segments[2];
        
        switch ($endpoint) {
            case 'templates':
                if (count($segments) === 3) {
                    if ($method === 'GET') $controller->getTemplates();
                    elseif ($method === 'POST') $controller->createTemplate();
                } elseif (count($segments) === 4) {
                    if ($method === 'GET') $controller->getTemplate($segments[3]);
                    elseif ($method === 'PUT') $controller->updateTemplate($segments[3]);
                    elseif ($method === 'DELETE') $controller->deleteTemplate($segments[3]);
                }
                break;
                
            case 'smtp':
                if ($method === 'GET') $controller->getSmtpConfig();
                elseif ($method === 'POST') $controller->updateSmtpConfig();
                break;
                
            case 'send':
                if ($method === 'POST') $controller->sendNotification();
                break;
                
            case 'history':
                if ($method === 'GET') $controller->getHistory();
                break;
                
            default:
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
        }
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Route not found']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>