package com.example.mentalhealthchatbot.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // ===== PUBLIC METHODS =====

    public void sendPasswordResetEmail(String toEmail, String token) {

        String resetLink = buildResetLink(token);

        String subject = "Sera - Reset Your Password";

        String body = "Hi,\n\n"
                + "Click the link below to reset your password:\n\n"
                + resetLink + "\n\n"
                + "This link expires in 1 hour.\n\n"
                + "If you didn't request this, ignore this email.";

        sendEmail(toEmail, subject, body);
    }

    public void sendWeeklyReport(String toEmail, String name, String emailBody) {

        String subject = "Your weekly check-in with Sera 🌿";

        String body = emailBody + "\n\n— Sera 💙";

        sendEmail(toEmail, subject, body);
    }

    // ===== CORE EMAIL SENDER =====

    private void sendEmail(String toEmail, String subject, String body) {

        validateConfig();

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, false);

            mailSender.send(message);

            System.out.println("Email sent successfully to " + toEmail);

        } catch (MessagingException ex) {
            throw new RuntimeException("Email sending failed", ex);
        }
    }

    // ===== HELPERS =====

    private void validateConfig() {
        if (fromEmail == null || fromEmail.isBlank()) {
            throw new RuntimeException("Missing spring.mail.username in environment");
        }
        if (frontendUrl == null || frontendUrl.isBlank()) {
            throw new RuntimeException("Missing app.frontend.url in environment");
        }
    }

    private String buildResetLink(String token) {
        String base = frontendUrl.endsWith("/")
                ? frontendUrl.substring(0, frontendUrl.length() - 1)
                : frontendUrl;
        return base + "/reset-password?token=" + token;
    }
}
