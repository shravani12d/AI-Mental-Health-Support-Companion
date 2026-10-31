package com.example.mentalhealthchatbot.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.Message;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.Properties;

@Service
public class EmailService {

    @Value("${GMAIL_CLIENT_ID}")
    private String clientId;

    @Value("${GMAIL_CLIENT_SECRET}")
    private String clientSecret;

    @Value("${GMAIL_REFRESH_TOKEN}")
    private String refreshToken;

    @Value("${GMAIL_FROM}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    private final HttpClient http = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    public void sendPasswordResetEmail(String toEmail, String token) {
        String body = "Hi,\n\n"
                + "Click the link below to reset your password:\n\n"
                + buildResetLink(token) + "\n\n"
                + "This link expires in 1 hour.\n\n"
                + "If you didn't request this, ignore this email.";
        sendEmail(toEmail, "Sera - Reset Your Password", body);
    }

    public void sendWeeklyReport(String toEmail, String name, String emailBody) {
        sendEmail(toEmail, "Your weekly check-in with Sera 🌿", emailBody + "\n\n— Sera 💙");
    }

    private void sendEmail(String toEmail, String subject, String body) {
        try {
            String accessToken = getAccessToken();

            MimeMessage msg = new MimeMessage(Session.getInstance(new Properties()));
            msg.setFrom(new InternetAddress(fromEmail, "Sera"));
            msg.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
            msg.setSubject(subject, "UTF-8");
            msg.setText(body, "UTF-8");

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            msg.writeTo(out);
            String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(out.toByteArray());

            String json = mapper.writeValueAsString(Map.of("raw", raw));

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("https://gmail.googleapis.com/gmail/v1/users/me/messages/send"))
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            System.out.println("Gmail API status: " + res.statusCode());

            if (res.statusCode() >= 400) {
                throw new RuntimeException("Gmail API failed: " + res.body());
            }
            System.out.println("Email sent successfully to " + toEmail);

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Email sending failed", e);
        }
    }

    private String getAccessToken() throws Exception {
        String form = "client_id=" + enc(clientId)
                + "&client_secret=" + enc(clientSecret)
                + "&refresh_token=" + enc(refreshToken)
                + "&grant_type=refresh_token";

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("https://oauth2.googleapis.com/token"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form))
                .build();

        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() >= 400) {
            throw new RuntimeException("Token refresh failed: " + res.body());
        }
        return mapper.readTree(res.body()).get("access_token").asText();
    }

    private String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }

    private String buildResetLink(String token) {
        String base = frontendUrl.endsWith("/")
                ? frontendUrl.substring(0, frontendUrl.length() - 1)
                : frontendUrl;
        return base + "/reset-password?token=" + token;
    }
}
