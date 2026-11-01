package com.example.mentalhealthchatbot.Service;

import com.example.mentalhealthchatbot.model.MoodEntry;
import com.example.mentalhealthchatbot.model.User;
import com.example.mentalhealthchatbot.repository.MoodEntryRepository;
import com.example.mentalhealthchatbot.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WeeklyReportService {

    @Autowired
    private MoodEntryRepository moodEntryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private GeminiService geminiService;

    
   
    public void sendWeeklyReports() {
        List<User> allUsers = userRepository.findAll();

        for (User user : allUsers) {
            try {
                LocalDateTime oneWeekAgo = LocalDateTime.now().minusDays(7);
                List<MoodEntry> entries = moodEntryRepository
                    .findByUserIdAndTimestampAfter(user.getEmail(), oneWeekAgo);

               if (entries.isEmpty()) {
    // Check if user has any mood history at all (not a new user)
    LocalDateTime oneMonthAgo = LocalDateTime.now().minusDays(30);
    List<MoodEntry> previousEntries = moodEntryRepository
        .findByUserIdAndTimestampAfter(user.getEmail(), oneMonthAgo);

    if (!previousEntries.isEmpty()) {
        // User has history but went silent 
         LocalDateTime lastMoodEntry = previousEntries.stream()
            .map(MoodEntry::getTimestamp)
            .max(LocalDateTime::compareTo)
            .orElse(null);

    if (user.getLastMissedYouEmailSent() == null ||
            user.getLastMissedYouEmailSent().isBefore(lastMoodEntry)) {
        String missedPrompt = "You are Sera, a warm and compassionate AI wellness companion. " +
            "Write a short, gentle email to " + user.getName() + " who hasn't checked in this week. " +
            "Don't make them feel guilty. " +
            "Acknowledge that life gets busy and that's okay. " +
            "Remind them that Sera is always here whenever they're ready. " +
            "Make them feel genuinely cared for and missed, not pressured. " +
            "End with something warm and hopeful that makes them smile. " +
            "Under 100 words. No subject line. No sign off.";


       String missedBody = geminiService.getAIResponseStrict(missedPrompt, new ArrayList<>());
        emailService.sendWeeklyReport(user.getEmail(), user.getName(), missedBody);
         user.setLastMissedYouEmailSent(LocalDateTime.now());
         userRepository.save(user);
    }
}
    continue;
}

                // Find dominant mood
                Map<String, Long> moodCount = entries.stream()
                    .collect(Collectors.groupingBy(MoodEntry::getMood, Collectors.counting()));

                String dominantMood = moodCount.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("mixed");

                int checkInCount = entries.size();

                // Generate email content via AI
                String prompt = "You are Sera, a warm and compassionate AI wellness companion. " +
                    "Write a short, heartfelt weekly check-in email for a user named " + user.getName() + ". " +
                    "This week they checked in " + checkInCount + " times and felt " + dominantMood + " most often. " +
                    "Acknowledge their feelings with empathy first. Then give one specific, practical coping technique for feeling " + dominantMood + ". " +
                    "End with a warm, hopeful message encouraging them to keep showing up for themselves. " +
                    "Do not use clinical language. Write like a caring friend who understands mental health. " +
                    "Keep it under 200 words. Do not include a subject line.";

              String emailBody = geminiService.getAIResponseStrict(prompt, new ArrayList<>());

                emailService.sendWeeklyReport(user.getEmail(), user.getName(), emailBody);

            } catch (Exception e) {
                System.err.println("Failed to send report to " + user.getEmail() + ": " + e.getMessage());
            }
        }
    }
}
