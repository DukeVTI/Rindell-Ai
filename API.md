# 📡 Rindell AI - API Documentation

## Overview

This document describes the integration points and API contracts for Rindell AI Assistant, specifically focusing on the Make.com webhook integration.

## Webhook Integration

### Endpoint

The bot sends document data to a configured webhook endpoint:

```
POST {MAKE_WEBHOOK_URL}
Content-Type: multipart/form-data
```

### Request Format

#### Headers

```
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
```

#### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | Buffer | Yes | The document binary data |
| `filename` | String | Yes | Original filename from WhatsApp |
| `mimeType` | String | Yes | MIME type of the document |
| `source` | String | Yes | WhatsApp ID of the sender (format: `1234567890@c.us`) |
| `size` | String | Yes | File size in bytes |

#### Example Request

```javascript
// Using form-data library
const FormData = require('form-data');
const form = new FormData();

form.append('file', buffer, {
  filename: 'document.pdf',
  contentType: 'application/pdf'
});
form.append('filename', 'document.pdf');
form.append('mimeType', 'application/pdf');
form.append('source', '1234567890@c.us');
form.append('size', '145678');

axios.post(webhookUrl, form, {
  headers: form.getHeaders(),
  timeout: 120000
});
```

#### Sample cURL Request

```bash
curl -X POST https://hook.eu2.make.com/YOUR_WEBHOOK_ID \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/document.pdf" \
  -F "filename=document.pdf" \
  -F "mimeType=application/pdf" \
  -F "source=1234567890@c.us" \
  -F "size=145678"
```

### Response Format

The webhook should return a response containing the AI-generated summary. The bot supports multiple response formats:

#### Option 1: Plain Text (Recommended)

```
Your detailed document summary here...
This can be multiple lines.
```

**Response Type**: `text/plain` or `text/html`

#### Option 2: JSON Object

```json
{
  "summary": "Your detailed document summary here..."
}
```

**Alternative JSON Fields** (checked in order):
- `summary`
- `Body`
- `text`
- `content`
- `message`
- `result`

**Response Type**: `application/json`

#### Response Handling Logic

```javascript
if (typeof response.data === 'string') {
  summary = response.data;
} else if (response.data && typeof response.data === 'object') {
  summary = response.data.summary || 
            response.data.Body || 
            response.data.text || 
            response.data.content ||
            response.data.message ||
            response.data.result;
}
```

### Response Requirements

- **Minimum Length**: 10 characters (shorter responses are rejected)
- **Format**: Plain text or JSON with known field
- **Encoding**: UTF-8
- **Timeout**: Must respond within 120 seconds

### Error Responses

If your webhook encounters an error, return:

**Status Code**: 200 (for graceful handling)

**Body**:
```json
{
  "error": "Description of the error",
  "summary": "Could not process this document due to: [reason]"
}
```

The bot will still deliver this message to the admin.

## Supported MIME Types

The bot validates incoming documents against this whitelist:

| MIME Type | Description | Extensions |
|-----------|-------------|------------|
| `application/pdf` | PDF Document | .pdf |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | Word Document | .docx |
| `application/msword` | Word Document (Legacy) | .doc |
| `application/vnd.openxmlformats-officedocument.presentationml.presentation` | PowerPoint | .pptx |
| `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | Excel Spreadsheet | .xlsx |
| `text/plain` | Text File | .txt |

### Adding New MIME Types

Edit `CONFIG.SUPPORTED_TYPES` in `index.js`:

```javascript
SUPPORTED_TYPES: {
  // Existing types...
  'image/jpeg': 'JPEG Image',
  'image/png': 'PNG Image',
  'application/zip': 'ZIP Archive'
}
```

## WhatsApp Message Flow

### 1. Document Reception

**Trigger**: User sends document via WhatsApp

**Bot Action**: Receives `messages.upsert` event

**Event Structure**:
```javascript
{
  messages: [
    {
      key: {
        remoteJid: '1234567890@c.us',  // Sender
        fromMe: false,
        id: 'MESSAGE_ID'
      },
      message: {
        documentMessage: {
          fileName: 'document.pdf',
          mimetype: 'application/pdf',
          fileSha256: Buffer,
          fileLength: 145678,
          mediaKey: Buffer,
          // ... other fields
        }
      },
      messageTimestamp: 1234567890
    }
  ],
  type: 'notify'
}
```

### 2. Acknowledgment Message

**Sent To**: Document sender

**Format**:
```
✅ *Rindell successfully received your document!*

📄 {filename}

⏳ Processing with AI...
Please wait, this may take a moment.
```

### 3. Processing

**Steps**:
1. Download document from WhatsApp servers
2. Save to local filesystem
3. Send to webhook
4. Wait for AI response

### 4. Summary Delivery

**Sent To**: Configured admin number (`CONFIG.ASSISTANT_NUMBER`)

**Format**:
```
╔═══════════════════════════════════════╗
║     📚 RINDELL AI ANALYSIS REPORT     ║
╚═══════════════════════════════════════╝

📄 *File Details*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Name: {filename}
- Size: {fileSize}
- From: {senderNumber}
- Status: Analyzed
- Time: {timestamp}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{AI Summary Content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *Powered by Rindell AI*
🤖 Analysis by Claude via Make.com
```

### 5. Completion Message

**Sent To**: Document sender

**Format**:
```
✅ *Analysis Complete!*

📄 {filename}

Your document has been analyzed by Rindell AI.
The summary has been delivered! 🎉
```

## Error Messages

### Unsupported File Type

**Sent To**: Document sender

**Format**:
```
⚠️ Sorry, this file type is not supported yet.

Supported types:
• PDF Documents
• Word Documents (.docx, .doc)
• PowerPoint Presentations
• Excel Spreadsheets
```

### Processing Error

**Sent To**: Document sender

**Format**:
```
❌ *Processing Error*

Sorry, there was an error analyzing your document.
Please try again in a moment.
```

**Sent To**: Admin

**Format**:
```
❌ *Processing Error*

📄 {filename}
👤 From: {senderNumber}
⚠️ Error: {errorMessage}
```

### Summary Extraction Failed

**Sent To**: Document sender

**Format**:
```
⚠️ Analysis completed but summary extraction failed.
Please try again or contact support.
```

**Sent To**: Admin (with debugging info)

## WhatsApp API (Baileys)

### Sending Messages

```javascript
await sock.sendMessage(recipientJid, {
  text: 'Your message here'
});
```

**Parameters**:
- `recipientJid`: WhatsApp ID in format `1234567890@c.us`
- `message`: Object with message content

### Downloading Media

```javascript
const stream = await downloadContentFromMessage(
  documentMessage,
  'document'
);

// Convert stream to buffer
let buffer = Buffer.from([]);
for await (const chunk of stream) {
  buffer = Buffer.concat([buffer, chunk]);
}
```

### Message Types

Supported message types:
- `documentMessage` - Documents (PDF, Word, etc.)
- `imageMessage` - Images (future)
- `videoMessage` - Videos (future)
- `audioMessage` - Audio files (future)

## Configuration API

### CONFIG Object

Located in `index.js`:

```javascript
const CONFIG = {
  // Required: Admin WhatsApp number
  ASSISTANT_NUMBER: '1234567890@c.us',
  
  // Required: Make.com webhook URL
  MAKE_WEBHOOK_URL: 'https://hook.eu2.make.com/...',
  
  // Optional: Webhook timeout in milliseconds
  WEBHOOK_TIMEOUT: 120000,
  
  // Optional: Custom directories
  UPLOADS_DIR: path.join(__dirname, 'uploads'),
  AUTH_DIR: path.join(__dirname, 'auth'),
  LOGS_DIR: path.join(__dirname, 'logs'),
  
  // Optional: Supported file types
  SUPPORTED_TYPES: {
    'application/pdf': 'PDF',
    // ... more types
  }
}
```

## Logging API

### Logger Methods

```javascript
// Success message (green checkmark)
Logger.success('Operation completed', { data });

// Information message (blue info icon)
Logger.info('Status update', { data });

// Warning message (yellow warning icon)
Logger.warn('Potential issue', { data });

// Error message (red X)
Logger.error('Operation failed', { data });

// Processing message (cyan hourglass)
Logger.processing('Working on it', { data });

// Document message (magenta file icon)
Logger.document('File operation', { data });

// Network message (blue globe)
Logger.network('HTTP request', { data });

// AI message (cyan robot)
Logger.ai('AI processing', { data });
```

### Console Output

**Format**: `[HH:MM:SS] 🔶 Message {data}`

**Colors**:
- Green: Success
- Blue: Info
- Yellow: Warning
- Red: Error
- Cyan: Processing/AI
- Magenta: Documents
- Dim: Timestamps

### File Logging

**Location**: `logs/rindell-YYYY-MM-DD.log`

**Format**: 
```
[2026-02-14T10:30:45.123Z] ✅ Document received {"filename":"test.pdf"}
```

## Integration Examples

### Make.com Scenario

**Step 1: Webhook**
- Module: Webhooks → Custom Webhook
- Method: POST
- Data structure: Auto-detect from first request

**Step 2: Text Extraction**
- Module: Tools → Parse File
- Input: File from webhook
- Output: Extracted text content

**Step 3: AI Analysis**
- Module: Anthropic → Create Message
- Model: Claude 3 Sonnet
- System Prompt: "You are a document analysis assistant..."
- User Message: Extracted text from Step 2

**Step 4: Response**
- Module: Webhook → Webhook Response
- Status: 200
- Body: 
  ```json
  {
    "summary": "{{step3.content}}"
  }
  ```

### Alternative: Direct API Integration

Instead of Make.com, you could integrate directly with Claude API by modifying the bot:

```javascript
// Replace webhook call with direct API call
const response = await axios.post('https://api.anthropic.com/v1/messages', {
  model: 'claude-3-sonnet-20240229',
  max_tokens: 1024,
  messages: [
    {
      role: 'user',
      content: `Analyze this document: ${extractedText}`
    }
  ]
}, {
  headers: {
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json'
  }
});

const summary = response.data.content[0].text;
```

## Rate Limits

### WhatsApp (Baileys)
- No official rate limits
- Recommend: Max 50 messages per minute
- Avoid: Bulk messaging or spam behavior

### Make.com
- Free: 1,000 operations/month
- Paid: Varies by plan
- Execution time: Max 40 minutes per operation

### Claude AI (via Anthropic)
- Depends on API tier
- Rate limits enforced at API level
- Monitor usage in Anthropic console

## Security Considerations

### Webhook Security

**Recommended**:
1. Use HTTPS webhooks only
2. Implement webhook authentication
3. Validate request signatures
4. Rate limit incoming requests

**Example with secret token**:
```javascript
// In your webhook handler
if (request.headers['x-webhook-secret'] !== process.env.WEBHOOK_SECRET) {
  return res.status(403).json({ error: 'Unauthorized' });
}
```

### Data Privacy

**User Data**:
- WhatsApp numbers are logged
- Documents are temporarily stored
- Summaries are delivered to admin

**Recommendations**:
1. Implement data retention policies
2. Auto-delete old documents
3. Encrypt sensitive logs
4. Comply with GDPR/privacy laws

### Authentication

**WhatsApp Auth**:
- Stored in `auth/` directory
- Multi-file format (encrypted by Baileys)
- Never commit to version control

**API Keys**:
- Use environment variables
- Never hardcode in source
- Rotate regularly

## Monitoring

### Key Metrics

- **Messages processed**: Total documents handled
- **Success rate**: Successful vs. failed
- **Processing time**: Average webhook response time
- **Error rate**: Failures per hour
- **File types**: Distribution of document types

### Health Checks

**Connection Status**:
```javascript
const isHealthy = isConnected && sock && !reconnectAttempts;
```

**Webhook Status**:
```javascript
// Test webhook periodically
const testWebhook = async () => {
  const response = await axios.post(webhookUrl, testData, {
    timeout: 10000
  });
  return response.status === 200;
};
```

### Alerting

Consider adding alerts for:
- Connection drops
- High error rates (> 10%)
- Slow processing (> 2 minutes)
- Webhook failures
- Disk space issues

## Future API Enhancements

### Planned Features

1. **Batch Processing**: Handle multiple documents
2. **Callback URLs**: Support custom webhooks
3. **Custom Prompts**: Per-user AI instructions
4. **File Management API**: List/delete uploaded files
5. **Status API**: Query processing status
6. **Analytics API**: Usage statistics

### Extension Points

**Custom Message Handlers**:
```javascript
// Add to index.js
class CustomHandler {
  static async handleImage(sock, msg) {
    // Process images
  }
  
  static async handleVideo(sock, msg) {
    // Process videos
  }
}
```

**Plugin System**:
```javascript
// Future: plugins/my-plugin.js
module.exports = {
  name: 'my-plugin',
  handler: async (context) => {
    // Custom processing
  }
};
```

---

For more information, see:
- [README.md](README.md) - General overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [SETUP.md](SETUP.md) - Installation guide
