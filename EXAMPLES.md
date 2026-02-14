# 📖 Rindell AI - Usage Examples

This document provides practical examples and use cases for Rindell AI Assistant.

## Table of Contents

- [Basic Usage](#basic-usage)
- [User Interactions](#user-interactions)
- [Admin Workflows](#admin-workflows)
- [Common Scenarios](#common-scenarios)
- [Troubleshooting Examples](#troubleshooting-examples)
- [Advanced Usage](#advanced-usage)

## Basic Usage

### Starting the Bot

```bash
# Method 1: Production start (recommended)
npm start

# Method 2: Development with auto-reload
npm run dev

# Method 3: Direct execution
npm run direct
```

### Expected Output

```
╔════════════════════════════════════════════════════════════╗
║                 🤖 RINDELL AI ASSISTANT v1.0               ║
╚════════════════════════════════════════════════════════════╝

Starting bot with spam filter...

╔════════════════════════════════════════════════════════════╗
║              🤖 RINDELL AI ASSISTANT v1.0                  ║
╚════════════════════════════════════════════════════════════╝
[10:30:15] ℹ️  Initializing WhatsApp Document Analysis Bot...
────────────────────────────────────────────────────────────
╔════════════════════════════════════════════════════════════╗
║               SCAN QR CODE WITH WHATSAPP                   ║
╚════════════════════════════════════════════════════════════╝

[QR CODE DISPLAYED HERE]

[10:30:18] ℹ️  QR code expires in 30 seconds
[10:30:22] ⏳ Connecting to WhatsApp...
╔════════════════════════════════════════════════════════════╗
║            RINDELL AI ASSISTANT READY                      ║
╚════════════════════════════════════════════════════════════╝
[10:30:25] ✅ WhatsApp connected successfully
[10:30:25] ℹ️  Reconnected using saved session
────────────────────────────────────────────────────────────
[10:30:25] ℹ️  Supported file types: [Array of types]
[10:30:25] ℹ️  Summaries will be sent to: 2349167066476@c.us
────────────────────────────────────────────────────────────
[10:30:25] ✅ Bot is now listening for documents...
────────────────────────────────────────────────────────────
```

## User Interactions

### Scenario 1: User Sends PDF Document

**User Action**: Sends `report.pdf` via WhatsApp

**Bot Response to User**:
```
✅ Rindell successfully received your document!

📄 report.pdf

⏳ Processing with AI...
Please wait, this may take a moment.
```

**Bot Console Output**:
```
────────────────────────────────────────────────────────────
[10:32:15] 📄 NEW DOCUMENT RECEIVED
   {
     "fileName": "report.pdf",
     "from": "1234567890@c.us",
     "type": "PDF"
   }
[10:32:15] ⏳ Sending acknowledgment to user
[10:32:16] ✅ Acknowledgment sent
[10:32:16] ⏳ Downloading document
[10:32:18] ✅ Downloaded: 2.3 MB
[10:32:18] ⏳ Saving file locally
[10:32:18] ✅ Saved to: /path/to/uploads/report.pdf
[10:32:18] 🌐 Sending to Make.com webhook
[10:32:45] ✅ Make.com responded in 27.2s
[10:32:45] ℹ️  Extracting summary from response...
[10:32:45] ℹ️  Format: JSON object
[10:32:45] 🤖 AI analysis received
[10:32:45] ✅ Summary length: 847 characters
[10:32:45] ⏳ Sending summary to your WhatsApp
[10:32:46] ✅ Summary sent to you
[10:32:46] ⏳ Sending completion message to user
[10:32:47] ✅ Completion message sent
────────────────────────────────────────────────────────────
```

**Admin Receives**:
```
╔═══════════════════════════════════════╗
║     📚 RINDELL AI ANALYSIS REPORT     ║
╚═══════════════════════════════════════╝

📄 *File Details*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Name: report.pdf
- Size: 2.3 MB
- From: 1234567890@c.us
- Status: Analyzed
- Time: 2/14/2026, 10:32:45 AM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[AI-Generated Summary Content]

This report presents quarterly financial results...
[Full summary content here]
...showing growth across all sectors.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *Powered by Rindell AI*
🤖 Analysis by Claude via Make.com
```

**User Receives Completion**:
```
✅ *Analysis Complete!*

📄 report.pdf

Your document has been analyzed by Rindell AI.
The summary has been delivered! 🎉
```

### Scenario 2: User Sends Unsupported File

**User Action**: Sends `image.jpg` or `video.mp4`

**Bot Response to User**:
```
⚠️ Sorry, this file type is not supported yet.

Supported types:
• PDF Documents
• Word Documents (.docx, .doc)
• PowerPoint Presentations
• Excel Spreadsheets
```

**Bot Console Output**:
```
────────────────────────────────────────────────────────────
[10:35:20] 📄 NEW DOCUMENT RECEIVED
   {
     "fileName": "image.jpg",
     "from": "1234567890@c.us",
     "type": "Unknown File Type"
   }
[10:35:20] ⚠️  Unsupported file type
   {
     "mimeType": "image/jpeg"
   }
────────────────────────────────────────────────────────────
```

### Scenario 3: Processing Error

**User Action**: Sends valid document but webhook fails

**Bot Response to User**:
```
❌ *Processing Error*

Sorry, there was an error analyzing your document.
Please try again in a moment.
```

**Admin Receives**:
```
❌ *Processing Error*

📄 document.pdf
👤 From: 1234567890@c.us
⚠️ Error: Request timeout after 120000ms
```

**Bot Console Output**:
```
[10:40:15] 🌐 Sending to Make.com webhook
[10:42:15] ❌ Make.com webhook failed
   {
     "error": "Request timeout",
     "timeout": true
   }
────────────────────────────────────────────────────────────
```

## Admin Workflows

### Monitoring Active Session

**View Logs in Real-Time**:
```bash
# Terminal 1: Run the bot
npm start

# Terminal 2: Tail logs
tail -f logs/rindell-$(date +%Y-%m-%d).log
```

### Checking Today's Activity

```bash
# View today's log file
cat logs/rindell-2026-02-14.log

# Count successful documents processed
grep "✅ Summary sent" logs/rindell-2026-02-14.log | wc -l

# Find any errors
grep "❌" logs/rindell-2026-02-14.log
```

### Manual Cleanup

```bash
# Clean uploads older than 7 days
find uploads/ -type f -mtime +7 -delete

# Clean logs older than 30 days
find logs/ -name "*.log" -mtime +30 -delete

# Check disk usage
du -sh uploads/ logs/ auth/
```

### Restart After Configuration Change

```bash
# If using PM2
pm2 restart rindell-ai

# If using systemd
sudo systemctl restart rindell-ai

# If running directly
# Ctrl+C to stop, then:
npm start
```

## Common Scenarios

### Multiple Documents in Succession

**Scenario**: User sends 3 documents quickly

**Bot Behavior**: Processes each sequentially

```
[10:50:00] 📄 NEW DOCUMENT RECEIVED - report1.pdf
[10:50:05] ✅ Summary sent to you
[10:50:06] 📄 NEW DOCUMENT RECEIVED - report2.pdf
[10:50:12] ✅ Summary sent to you
[10:50:13] 📄 NEW DOCUMENT RECEIVED - report3.pdf
[10:50:18] ✅ Summary sent to you
```

Each document is handled independently, allowing concurrent processing.

### Large Document Processing

**Scenario**: 50 MB PDF document

**Timeline**:
```
[11:00:00] 📄 NEW DOCUMENT RECEIVED
[11:00:05] ✅ Downloaded: 50.2 MB (5s)
[11:00:06] ✅ Saved to disk (1s)
[11:00:06] 🌐 Sending to webhook
[11:01:30] ✅ Make.com responded (84s)
[11:01:31] ✅ Summary sent
```

Total time: ~90 seconds

### Connection Recovery

**Scenario**: Internet drops during active session

**Bot Console Output**:
```
[11:10:00] ⚠️  Connection closed
   {
     "code": 408,
     "willReconnect": true
   }
[11:10:00] ⏳ Reconnecting in 5s... (Attempt 1)
[11:10:05] ⏳ Connecting to WhatsApp...
[11:10:08] ✅ WhatsApp connected successfully
[11:10:08] ℹ️  Reconnected using saved session
```

Bot automatically reconnects without needing QR code.

### Session Expiry

**Scenario**: WhatsApp session becomes invalid

**Bot Console Output**:
```
[11:15:00] ⚠️  Connection closed
   {
     "code": 401,
     "willReconnect": false
   }
[11:15:00] ❌ Logged out - Manual restart required
[11:15:00] ℹ️  Delete auth/ folder and restart to reconnect
```

**Admin Action Required**:
```bash
# Stop the bot
pkill -f "node.*index.js"

# Delete authentication
rm -rf auth/

# Restart bot
npm start

# Scan new QR code
```

## Troubleshooting Examples

### Issue: Webhook Not Responding

**Symptoms**:
- All documents timeout
- No summaries received
- Error: "Request timeout after 120000ms"

**Debug Steps**:

1. **Test webhook directly**:
```bash
curl -X POST https://hook.eu2.make.com/YOUR_WEBHOOK \
  -F "file=@test.pdf" \
  -F "filename=test.pdf" \
  -F "mimeType=application/pdf"
```

2. **Check Make.com logs**:
   - Log into Make.com
   - View scenario execution history
   - Look for errors or slow operations

3. **Increase timeout**:
```javascript
// In index.js
WEBHOOK_TIMEOUT: 300000,  // 5 minutes instead of 2
```

### Issue: Summary Not Extracted

**Symptoms**:
- Webhook responds successfully
- But no summary sent to admin
- Warning: "No valid summary found in response"

**Debug Steps**:

1. **Check webhook response format**:
```javascript
// Add temporary logging in index.js
console.log('Full response:', JSON.stringify(response.data, null, 2));
```

2. **Adjust extraction logic**:
```javascript
// Add your custom field
summary = response.data.summary || 
          response.data.Body || 
          response.data.text ||
          response.data.YOUR_FIELD;  // Add this
```

### Issue: Files Not Downloading

**Symptoms**:
- Error: "Media download failed"
- Documents received but can't download

**Debug Steps**:

1. **Check disk space**:
```bash
df -h
```

2. **Check permissions**:
```bash
ls -la uploads/
chmod 755 uploads/
```

3. **Test with small file** (< 1 MB)

4. **Check Baileys version**:
```bash
npm list @whiskeysockets/baileys
npm update @whiskeysockets/baileys
```

## Advanced Usage

### Custom Message Templates

**Modify acknowledgment message**:

```javascript
// In MessageHandler.process(), find:
await sock.sendMessage(from, {
  text: `✅ *Document Received*\n\n` +
        `📄 ${fileName}\n\n` +
        `Processing... Please wait.`
});
```

**Add custom branding**:

```javascript
await sock.sendMessage(from, {
  text: `✨ *Your Company Name*\n\n` +
        `✅ Document received: ${fileName}\n` +
        `⏳ AI analysis in progress...\n\n` +
        `_Powered by Rindell AI_`
});
```

### Filter Documents by Sender

**Only process from specific numbers**:

```javascript
// In MessageHandler.process(), add:
const ALLOWED_SENDERS = [
  '1234567890@c.us',
  '0987654321@c.us'
];

if (!ALLOWED_SENDERS.includes(from)) {
  Logger.warn('Ignoring document from unauthorized sender', { from });
  return;
}
```

### Add File Size Limits

**Reject files over 25 MB**:

```javascript
// In MessageHandler.process(), after downloading:
const MAX_SIZE = 25 * 1024 * 1024; // 25 MB

if (buffer.length > MAX_SIZE) {
  await sock.sendMessage(from, {
    text: '⚠️ File too large!\n\n' +
          'Maximum size: 25 MB\n' +
          `Your file: ${FileManager.formatSize(buffer.length)}`
  });
  return;
}
```

### Send to Multiple Admins

**Notify multiple people**:

```javascript
// Replace single admin with array
const ADMIN_NUMBERS = [
  '1111111111@c.us',
  '2222222222@c.us',
  '3333333333@c.us'
];

// Send to all admins
for (const admin of ADMIN_NUMBERS) {
  await sock.sendMessage(admin, {
    text: formattedSummary
  });
}
```

### Log to External Service

**Send logs to Slack/Discord**:

```javascript
// Add to Logger.error()
static async error(message, data) {
  this.log('❌', 'red', message, data);
  
  // Also send to Slack
  await axios.post(process.env.SLACK_WEBHOOK, {
    text: `🚨 Error: ${message}\n\`\`\`${JSON.stringify(data)}\`\`\``
  }).catch(() => {});
}
```

### Custom AI Prompts per File Type

**Different prompts for different files**:

```javascript
// In webhook payload, add:
form.append('promptType', this.getPromptType(mimeType));

static getPromptType(mimeType) {
  switch (mimeType) {
    case 'application/pdf':
      return 'detailed_analysis';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'document_summary';
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return 'data_analysis';
    default:
      return 'general';
  }
}
```

Then in Make.com, use different Claude prompts based on `promptType`.

### Database Integration

**Store document metadata**:

```javascript
// After successful processing
await database.insert({
  filename: fileName,
  sender: from,
  mimeType: mimeType,
  size: buffer.length,
  processed_at: new Date(),
  summary_length: summary.length,
  processing_time: processingTime
});
```

## Performance Tips

### Optimize for High Volume

```javascript
// Process documents in parallel (if needed)
const queue = [];
const MAX_CONCURRENT = 3;

// Add document to queue
queue.push(processDocument(msg));

// Limit concurrent processing
if (queue.length >= MAX_CONCURRENT) {
  await Promise.race(queue);
}
```

### Reduce Memory Usage

```javascript
// Delete file after processing
fs.unlinkSync(filePath);

// Or cleanup periodically
setInterval(() => {
  const files = fs.readdirSync(CONFIG.UPLOADS_DIR);
  const now = Date.now();
  
  files.forEach(file => {
    const stats = fs.statSync(path.join(CONFIG.UPLOADS_DIR, file));
    const age = now - stats.mtimeMs;
    
    // Delete files older than 1 hour
    if (age > 3600000) {
      fs.unlinkSync(path.join(CONFIG.UPLOADS_DIR, file));
    }
  });
}, 600000); // Run every 10 minutes
```

---

For more information:
- [README.md](README.md) - Project overview
- [SETUP.md](SETUP.md) - Installation guide
- [API.md](API.md) - API documentation
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
