package com.example.mentalhealthchatbot.Controller;

import com.example.mentalhealthchatbot.Service.WeeklyReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private WeeklyReportService weeklyReportService;

    @Value("${admin.trigger.secret}")
    private String triggerSecret;

  @PostMapping("/trigger-weekly-report")
public ResponseEntity<?> triggerWeeklyReport(@RequestHeader("X-Trigger-Secret") String secret) {
    if (!triggerSecret.equals(secret)) {
        return ResponseEntity.status(403).body("Forbidden");
    }
    new Thread(() -> weeklyReportService.sendWeeklyReports()).start();
    return ResponseEntity.ok("Weekly report job started");
}
}
