<?php
/**
 * EmailSender Utility Class
 * Handles email sending with templates and SMTP configuration
 * 
 * @package NotificationService
 * @class EmailSender
 * @description Manages email composition, template processing, SMTP configuration,
 * and delivery tracking with comprehensive error handling and logging
 */

require_once '../models/NotificationTemplate.php';
require_once '../models/SmtpConfig.php';
require_once '../models/EmailHistory.php';

class EmailSender {
    /** @var PDO $db Database connection */
    private $db;
    
    /** @var NotificationTemplate $template_model Template management model */
    private $template_model;
    
    /** @var SmtpConfig $smtp_model SMTP configuration model */
    private $smtp_model;
    
    /** @var EmailHistory $history_model Email history tracking model */
    private $history_model;

    /**
     * Initialize EmailSender with database connection
     * 
     * @param PDO $db Database connection
     */
    public function __construct($db) {
        $this->db = $db;
        $this->template_model = new NotificationTemplate($db);
        $this->smtp_model = new SmtpConfig($db);
        $this->history_model = new EmailHistory($db);
    }

    /**
     * Send email using template with variable substitution
     * 
     * @method sendTemplateEmail
     * @param string $template_name Template identifier
     * @param string $recipient_email Recipient email address
     * @param array $variables Template variables for substitution
     * @param string $recipient_name Optional recipient name
     * @return array Result array with success status and message
     * @throws Exception SMTP configuration or sending errors
     */
    public function sendEmail($templateCode, $recipientEmail, $recipientName = '', $data = []) {
        try {
            $template = $this->getTemplate($templateCode);
            if (!$template) {
                return ['success' => false, 'message' => 'Template not found'];
            }

            $smtpConfig = $this->getSmtpConfig();
            if (!$smtpConfig) {
                return ['success' => false, 'message' => 'SMTP configuration not found'];
            }

            $processedContent = $this->processTemplate($template, $data);
            $historyId = $this->createHistoryRecord($templateCode, $recipientEmail, $recipientName, $processedContent, $data);

            $result = $this->sendEmailViaSmtp(
                $smtpConfig,
                $recipientEmail,
                $recipientName,
                $processedContent['subject'],
                $processedContent['body_html'],
                $processedContent['body_text']
            );

            $this->updateHistoryStatus($historyId, $result['success'] ? 'sent' : 'failed', $result['message'] ?? null);

            return $result;

        } catch (Exception $e) {
            if (isset($historyId)) {
                $this->updateHistoryStatus($historyId, 'failed', $e->getMessage());
            }
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Get email template by code
     */
    private function getTemplate($code) {
        if ($this->template_model->getByCode($code)) {
            return $this->template_model->toArray();
        }
        return null;
    }

    /**
     * Get active SMTP configuration
     */
    private function getSmtpConfig() {
        return $this->smtp_model->getActive();
    }

    /**
     * Process template with data variables
     */
    private function processTemplate($template, $data) {
        $subject = $this->replaceVariables($template['subject'], $data);
        $bodyHtml = $this->replaceVariables($template['body_html'], $data);
        $bodyText = $this->replaceVariables($template['body_text'], $data);

        return [
            'subject' => $subject,
            'body_html' => $bodyHtml,
            'body_text' => $bodyText
        ];
    }

    /**
     * Replace template variables with actual data
     */
    private function replaceVariables($content, $data) {
        if (!$content) return $content;

        foreach ($data as $key => $value) {
            $placeholder = '{{' . $key . '}}';
            $content = str_replace($placeholder, $value, $content);
        }

        $content = str_replace('{{current_year}}', date('Y'), $content);
        $content = str_replace('{{current_date}}', date('Y-m-d'), $content);
        $content = str_replace('{{current_datetime}}', date('Y-m-d H:i:s'), $content);

        return $content;
    }

    /**
     * Create email history record
     */
    private function createHistoryRecord($templateCode, $recipientEmail, $recipientName, $content, $data) {
        $this->history_model->template_code = $templateCode;
        $this->history_model->recipient_email = $recipientEmail;
        $this->history_model->recipient_name = $recipientName;
        $this->history_model->subject = $content['subject'];
        $this->history_model->body_html = $content['body_html'];
        $this->history_model->body_text = $content['body_text'];
        $this->history_model->variables = json_encode($data);
        $this->history_model->status = 'pending';
        $this->history_model->sent_at = null;
        $this->history_model->error_message = null;

        return $this->history_model->create();
    }

    /**
     * Update email history status
     */
    private function updateHistoryStatus($historyId, $status, $errorMessage = null) {
        $this->history_model->updateStatus($historyId, $status, $errorMessage);
    }

    /**
     * Send email via SMTP
     */
    private function sendEmailViaSmtp($smtpConfig, $recipientEmail, $recipientName, $subject, $bodyHtml, $bodyText) {
        try {
            if (function_exists('mail')) {
                return $this->sendViaPhpMail($smtpConfig, $recipientEmail, $recipientName, $subject, $bodyHtml, $bodyText);
            } else {
                return $this->sendViaSocket($smtpConfig, $recipientEmail, $recipientName, $subject, $bodyHtml, $bodyText);
            }
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'SMTP Error: ' . $e->getMessage()];
        }
    }

    /**
     * Send email using PHP mail() function
     */
    private function sendViaPhpMail($smtpConfig, $recipientEmail, $recipientName, $subject, $bodyHtml, $bodyText) {
        $to = $recipientName ? "$recipientName <$recipientEmail>" : $recipientEmail;
        $from = $smtpConfig['from_name'] ? $smtpConfig['from_name'] . ' <' . $smtpConfig['from_email'] . '>' : $smtpConfig['from_email'];

        $headers = [
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . $from,
            'Reply-To: ' . $smtpConfig['from_email'],
            'X-Mailer: PHP/' . phpversion()
        ];

        $body = $bodyHtml ?: $bodyText;

        if (mail($to, $subject, $body, implode("\r\n", $headers))) {
            return ['success' => true, 'message' => 'Email sent successfully'];
        } else {
            return ['success' => false, 'message' => 'Failed to send email via PHP mail()'];
        }
    }

    /**
     * Send email via socket connection (fallback method)
     */
    private function sendViaSocket($smtpConfig, $recipientEmail, $recipientName, $subject, $bodyHtml, $bodyText) {
        $socket = fsockopen($smtpConfig['host'], $smtpConfig['port'], $errno, $errstr, 30);
        
        if (!$socket) {
            return ['success' => false, 'message' => "Cannot connect to SMTP server: $errstr ($errno)"];
        }

        $response = fgets($socket, 1024);
        if (substr($response, 0, 3) !== '220') {
            fclose($socket);
            return ['success' => false, 'message' => 'SMTP server not ready: ' . trim($response)];
        }

        $boundary = md5(uniqid(time()));
        $from = $smtpConfig['from_email'];
        $fromName = $smtpConfig['from_name'];

        $commands = [
            "EHLO localhost\r\n",
        ];

        if ($smtpConfig['encryption'] === 'tls') {
            $commands[] = "STARTTLS\r\n";
        }

        if ($smtpConfig['username'] && $smtpConfig['password']) {
            $commands[] = "AUTH LOGIN\r\n";
            $commands[] = base64_encode($smtpConfig['username']) . "\r\n";
            $commands[] = base64_encode($smtpConfig['password']) . "\r\n";
        }

        $commands = array_merge($commands, [
            "MAIL FROM: <$from>\r\n",
            "RCPT TO: <$recipientEmail>\r\n",
            "DATA\r\n"
        ]);

        foreach ($commands as $command) {
            fputs($socket, $command);
            $response = fgets($socket, 1024);
            
            if (!in_array(substr($response, 0, 3), ['220', '221', '250', '334', '354'])) {
                fclose($socket);
                return ['success' => false, 'message' => 'SMTP Error: ' . trim($response)];
            }
        }

        $emailData = "From: $fromName <$from>\r\n";
        $emailData .= "To: $recipientEmail\r\n";
        $emailData .= "Subject: $subject\r\n";
        $emailData .= "MIME-Version: 1.0\r\n";
        $emailData .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n\r\n";

        if ($bodyText) {
            $emailData .= "--$boundary\r\n";
            $emailData .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
            $emailData .= $bodyText . "\r\n\r\n";
        }

        if ($bodyHtml) {
            $emailData .= "--$boundary\r\n";
            $emailData .= "Content-Type: text/html; charset=UTF-8\r\n\r\n";
            $emailData .= $bodyHtml . "\r\n\r\n";
        }

        $emailData .= "--$boundary--\r\n";
        $emailData .= ".\r\n";

        fputs($socket, $emailData);
        $response = fgets($socket, 1024);

        fputs($socket, "QUIT\r\n");
        fclose($socket);

        if (substr($response, 0, 3) === '250') {
            return ['success' => true, 'message' => 'Email sent successfully'];
        } else {
            return ['success' => false, 'message' => 'Failed to send email: ' . trim($response)];
        }
    }

    /**
     * Bulk send emails
     */
    public function bulkSend($templateCode, $recipients, $commonData = []) {
        $results = [];
        
        foreach ($recipients as $recipient) {
            $email = $recipient['email'];
            $name = $recipient['name'] ?? '';
            $data = array_merge($commonData, $recipient['data'] ?? []);
            
            $result = $this->sendEmail($templateCode, $email, $name, $data);
            $results[] = [
                'email' => $email,
                'success' => $result['success'],
                'message' => $result['message']
            ];
        }
        
        return $results;
    }

    /**
     * Validate email address
     */
    private function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
}
?>