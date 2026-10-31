export default function Privacy() {
  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 16px", lineHeight: 1.6 }}>
      <h1>Privacy Policy for Sera</h1>
      <p><em>Last updated: October 31, 2026</em></p>
      <p>Sera is a student project: an AI wellness companion that lets you log your mood, chat, and receive weekly check-in emails.</p>

      <h2>1. Information we collect</h2>
      <p>Your name, email address, a password (stored in hashed form), your mood check-ins, and your chat messages.</p>

      <h2>2. How we use it</h2>
      <p>To provide chat and mood tracking, and to send weekly check-in emails, "we missed you" emails, and password reset emails. We do not sell your data or use it for advertising.</p>

      <h2>3. Third-party services</h2>
      <p>Google Gemini API generates Sera's replies and email text from your messages and mood summary. MongoDB Atlas stores account and mood data. Render and Vercel host the app. Emails are sent from seramentalwellness@gmail.com using the Gmail API with the gmail.send permission only. The app uses this solely to send emails to you. It does not read, access, or store anyone's Gmail inbox or contacts.</p>

      <h2>4. Data retention and deletion</h2>
      <p>Your data is kept while your account exists. To request deletion, email seramentalwellness@gmail.com.</p>

      <h2>5. Security</h2>
      <p>We use HTTPS and token-based authentication. No system is perfectly secure.</p>

      <h2>6. Not medical advice</h2>
      <p>Sera is an AI companion, not a substitute for professional mental health care. If you are in crisis or at risk of harming yourself, contact local emergency services or a crisis helpline immediately.</p>

      <h2>7. Children</h2>
      <p>Sera is not intended for users under 18.</p>

      <h2>8. Contact</h2>
      <p>seramentalwellness@gmail.com</p>
    </div>
  );
}
