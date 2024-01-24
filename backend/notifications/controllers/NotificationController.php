<?php
/**
 * Notification Controller
 * Handles email notifications, templates, and SMTP configuration
 */

require_once '../config/database.php';
require_once '../models/NotificationTemplate.php';
require_once '../models/SmtpConfig.php';
require_once '../models/EmailHistory.php';
require_once '../utils/EmailSender.php';

class NotificationController {
    private $db;
    private $template;
    private $smtp_config;
    private $email_history;
    private $email_sender;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $database->createTables();
        
        $this->template = new NotificationTemplate($this->db);
        $this->smtp_config = new SmtpConfig($this->db);
        $this->email_history = new EmailHistory($this->db);
        $this->email_sender = new EmailSender($this->db);
    }

    /**
     * Send notification
     */
    public function sendNotification() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            $templateCode = $input['template'] ?? null;
            $recipientEmail = $input['recipient_email'] ?? null;
            $recipientName = $input['recipient_name'] ?? '';
            $data = $input['data'] ?? [];
            
            if (!$templateCode || !$recipientEmail) {
                $this->sendResponse(400, false, 'Template and recipient email are required');
                return;
            }

            $result = $this->email_sender->sendEmail($templateCode, $recipientEmail, $recipientName, $data);
            
            if ($result['success']) {
                $this->sendResponse(200, true, 'Email sent successfully', $result);
            } else {
                $this->sendResponse(400, false, $result['message']);
            }

        } catch (Exception $e) {
            $this->sendResponse(500, false, $e->getMessage());
        }
    }

    /**
     * Get all templates
     */
    public function getTemplates() {
        try {
            $templates = $this->template->getAll();
            $this->sendResponse(200, true, 'Templates retrieved successfully', $templates);
        } catch (Exception $e) {
            $this->sendResponse(500, false, $e->getMessage());
        }
    }

    /**
     * Create template
     */
    public function createTemplate() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            $this->template->name = $input['name'] ?? null;
            $this->template->code = $input['code'] ?? null;
            $this->template->subject = $input['subject'] ?? null;
            $this->template->body_html = $input['body_html'] ?? null;
            $this->template->body_text = $input['body_text'] ?? null;
            $this->template->variables = json_encode($input['variables'] ?? []);
            $this->template->is_active = $input['is_active'] ?? 1;

            $id = $this->template->create();
            
            if ($id) {
                $this->template->getById($id);
                $this->sendResponse(201, true, 'Template created successfully', $this->template->toArray());
            } else {
                $this->sendResponse(500, false, 'Failed to create template');
            }

        } catch (Exception $e) {
            $this->sendResponse(500, false, $e->getMessage());
        }
    }

    /**
     * Get SMTP configuration
     */
    public function getSmtpConfig() {
        try {
            $config = $this->smtp_config->getActive();
            if ($config) {
                // Hide password in response
                unset($config['password']);
                $this->sendResponse(200, true, 'SMTP config retrieved', $config);
            } else {
                $this->sendResponse(404, false, 'No SMTP configuration found');
            }
        } catch (Exception $e) {
            $this->sendResponse(500, false, $e->getMessage());
        }
    }

    /**
     * Update SMTP configuration
     */
    public function updateSmtpConfig() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            $this->smtp_config->host = $input['host'] ?? null;
            $this->smtp_config->port = $input['port'] ?? 587;
            $this->smtp_config->username = $input['username'] ?? null;
            $this->smtp_config->password = $input['password'] ?? null;
            $this->smtp_config->encryption = $input['encryption'] ?? 'tls';
            $this->smtp_config->from_email = $input['from_email'] ?? null;
            $this->smtp_config->from_name = $input['from_name'] ?? 'System';
            $this->smtp_config->is_active = 1;

            $result = $this->smtp_config->createOrUpdate();
            
            if ($result) {
                $this->sendResponse(200, true, 'SMTP configuration updated successfully');
            } else {
                $this->sendResponse(500, false, 'Failed to update SMTP configuration');
            }

        } catch (Exception $e) {
            $this->sendResponse(500, false, $e->getMessage());
        }
    }

    /**
     * Get email history
     */
    public function getHistory() {
        try {
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
            
            $history = $this->email_history->getAll($page, $limit);
            $total = $this->email_history->getTotalCount();
            
            $this->sendResponse(200, true, 'Email history retrieved', [
                'history' => $history,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ]);
        } catch (Exception $e) {
            $this->sendResponse(500, false, $e->getMessage());
        }
    }

    /**
     * Health check
     */
    public function healthCheck() {
        $this->sendResponse(200, true, 'Notification service is healthy', [
            'service' => 'notification-service',
            'timestamp' => date('c'),
            'database' => $this->db ? 'connected' : 'disconnected'
        ]);
    }

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