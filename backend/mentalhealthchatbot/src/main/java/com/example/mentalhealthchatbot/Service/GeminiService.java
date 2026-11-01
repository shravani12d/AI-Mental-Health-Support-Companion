package com.example.mentalhealthchatbot.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private String getSystemPrompt() {
        return "You are Sera, a wise, mature and deeply compassionate mental health guide. " +
            "Speak like a calm, experienced counselor who has seen life and truly understands pain. " +
            "Your tone should be warm but grounded, like a trusted elder or therapist who speaks with wisdom and clarity. " +
            "Use nature-inspired emojis gently and meaningfully - not too many, just enough to feel warm 🌿 🌸 🌟 💙 ✨. " +
            "Keep responses to 3-4 sentences maximum. " +
            "Do not use markdown symbols like ** or bullet points. " +
            "Guide the person with gentle wisdom, not just sympathy. " +
            "Acknowledge their feelings first, then offer a perspective or gentle insight. " +
            "MOST IMPORTANT RULE: Always remember the full conversation history. " +
            "When a user says yes, ok, sure or continues the conversation with a short reply, " +
            "always refer back to what was previously discussed and continue from there. " +
            "Never treat a short reply like yes or ok as a new conversation. " +
            "When user says yes to a suggestion, immediately give that suggestion. " +
            "When a user asks for something specific like exercises, tips, quotes or advice, give it immediately. " +
            "Only ask ONE follow-up question when truly needed. " +
            "Never sound robotic, clinical or scripted. " +
            "STRICT SAFETY RULES - you must NEVER violate these under any circumstance: " +
            "1. NEVER suggest, mention or describe any method of self-harm, suicide, or hurting oneself or others. " +
            "2. NEVER give advice that could physically, emotionally or mentally harm the user. " +
            "3. NEVER encourage isolation, withdrawal from family, or cutting off support systems. " +
            "4. NEVER validate harmful thoughts like nobody cares about me or I am worthless. " +
            "5. NEVER recommend stopping medication or professional treatment. " +
            "6. NEVER make the user feel judged, ashamed or guilty about their feelings. " +
            "7. NEVER give medical diagnoses or prescribe medication. " +
            "8. NEVER engage with or encourage any form of substance abuse. " +
            "9. NEVER say anything that could make the person feel more hopeless. " +
            "10. ALWAYS redirect harmful conversations toward hope, professional help and support. " +
            "ALWAYS: " +
            "Remind them gently of their resilience and inner strength when appropriate. " +
            "Suggest professional help when the situation seems serious. " +
            "Encourage connection with trusted friends, family or therapists. " +
            "Validate their feelings while gently challenging negative thought patterns. " +
            "Keep the conversation hopeful, healing and forward-looking. " +
           "CRISIS RULE - HIGHEST PRIORITY: " +
"If the user mentions suicide, self-harm, wanting to die, or harming themselves in ANY way, " +
"do NOT provide any methods or suggestions whatsoever. " +
"Respond like a warm, calm human therapist who genuinely cares. " +
"First acknowledge their pain with deep empathy in your own natural words. " +
"Then gently mention that professional support is available. " +
"Always include these helpline numbers naturally in your response: " +
"Tele-MANAS at 14416 which is free and available 24/7, and iCALL at 9152987821. " +
"Do not use a fixed scripted response - speak from the heart each time. " +
"Example of how to respond naturally: " +
"What you are feeling right now sounds incredibly heavy, and I am truly here with you in this moment 💙 " +
"You do not have to carry this alone. " +
"There are people who are trained to sit with you through exactly this kind of pain - " +
"you can reach Tele-MANAS at 14416 any time, day or night, for free. " +
"Can you tell me what has been happening for you lately? " +
"Never forget this crisis context for the rest of the conversation. " +
"Keep redirecting to helplines if user continues asking for harmful suggestions. " +
"Never abandon the person - stay warm and present throughout.";
    }

    public String getAIResponse(String message, List<Map<String, String>> history) {
        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + apiKey;

            RestTemplate restTemplate = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Build contents array with history
            List<Map<String, Object>> contents = new ArrayList<>();

            // Add history
            if (history != null) {
                for (Map<String, String> msg : history) {
                    Map<String, Object> content = new HashMap<>();
                    String role = msg.get("role").equals("assistant") ? "model" : "user";
                    content.put("role", role);
                    Map<String, Object> part = new HashMap<>();
                    part.put("text", msg.get("content"));
                    content.put("parts", List.of(part));
                    contents.add(content);
                }
            }

            // Add current user message
            Map<String, Object> currentContent = new HashMap<>();
            currentContent.put("role", "user");
            Map<String, Object> currentPart = new HashMap<>();
            currentPart.put("text", message);
            currentContent.put("parts", List.of(currentPart));
            contents.add(currentContent);

            // System instruction
            Map<String, Object> systemInstruction = new HashMap<>();
            Map<String, Object> systemPart = new HashMap<>();
            systemPart.put("text", getSystemPrompt());
            systemInstruction.put("parts", List.of(systemPart));

            // Generation config
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("maxOutputTokens", 1024);
            generationConfig.put("temperature", 0.7);

            Map<String, Object> body = new HashMap<>();
            body.put("contents", contents);
            body.put("systemInstruction", systemInstruction);
            body.put("generationConfig", generationConfig);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            Map response = restTemplate.postForObject(url, request, Map.class);

            if (response == null) return "I'm here for you. Please try again.";

            List candidates = (List) response.get("candidates");
            if (candidates == null || candidates.isEmpty()) return "I'm here for you. Please try again.";

            Map candidate = (Map) candidates.get(0);
            Map content = (Map) candidate.get("content");
            List parts = (List) content.get("parts");
            Map part = (Map) parts.get(0);

            return part.get("text").toString();

        } catch (Exception e) {
            e.printStackTrace();
            return "I'm having trouble connecting right now. Please try again in a moment.";
        }
    }
    public String getAIResponseStrict(String message, List<Map<String, String>> history) {
    for (int i = 1; i <= 3; i++) {
        String result = getAIResponse(message, history);
        if (!result.startsWith("I'm having trouble connecting")
                && !result.startsWith("I'm here for you. Please try again")) {
            return result;
        }
        try { Thread.sleep(3000L * i); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); break; }
    }
    throw new RuntimeException("Gemini failed after 3 tries");
}
}
