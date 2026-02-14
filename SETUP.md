# 🚀 Rindell AI - Setup Guide

This guide will help you set up and run Rindell AI Assistant on your local machine or server.

## Prerequisites

### Required Software
- **Node.js**: v14.0.0 or higher
- **npm**: v6.0.0 or higher (comes with Node.js)
- **Git**: For cloning the repository

### Required Accounts
1. **WhatsApp Account**: A phone number with WhatsApp installed
2. **Make.com Account**: Free or paid account for webhook automation
3. **Claude AI Access**: Via Anthropic API through Make.com

### System Requirements
- **OS**: Linux, macOS, or Windows (WSL recommended for Windows)
- **Memory**: Minimum 512 MB RAM
- **Disk Space**: At least 500 MB free
- **Network**: Stable internet connection required

## Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/DukeVTI/Rindell-Ai.git
cd Rindell-Ai
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- `@whiskeysockets/baileys` - WhatsApp integration
- `axios` - HTTP requests
- `form-data` - File uploads
- `qrcode-terminal` - QR code display
- `pino` - Logging
- `@hapi/boom` - Error handling

### Step 3: Configure Make.com Webhook

#### 3.1 Create a Make.com Scenario

1. Log in to [Make.com](https://make.com)
2. Create a new scenario
3. Add a **Webhook** module as the trigger
   - Type: Custom webhook
   - Copy the webhook URL

#### 3.2 Add Claude AI Integration

1. Add a **HTTP** module or **Anthropic** module
2. Configure to send document to Claude API
3. Set up prompt for document analysis
4. Return summary in response

Example Make.com scenario flow:
```
Webhook Trigger → Extract Document → 
Send to Claude → Format Response → 
Webhook Response
```

#### 3.3 Sample Prompt for Claude

```
You are a document analysis assistant. Analyze the following document 
and provide a comprehensive summary including:

1. Document type and purpose
2. Key points and main content
3. Important data or findings
4. Recommendations or conclusions (if applicable)

Format the summary clearly and concisely.

[Document content here]
```

### Step 4: Configure the Bot

Edit `index.js` and update the `CONFIG` object:

```javascript
const CONFIG = {
  // Replace with your WhatsApp number in format: 1234567890@c.us
  ASSISTANT_NUMBER: '2349167066476@c.us',
  
  // Replace with your Make.com webhook URL
  MAKE_WEBHOOK_URL: 'https://hook.eu2.make.com/YOUR_WEBHOOK_ID',
  
  // Adjust timeout if needed (in milliseconds)
  WEBHOOK_TIMEOUT: 120000,  // 2 minutes
  
  // Leave these as default
  UPLOADS_DIR: path.join(__dirname, 'uploads'),
  AUTH_DIR: path.join(__dirname, 'auth'),
  LOGS_DIR: path.join(__dirname, 'logs'),
  
  // Add or remove supported file types if needed
  SUPPORTED_TYPES: {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    // ... other types
  }
}
```

### Step 5: Get Your WhatsApp Number ID

To find your WhatsApp number in the correct format:

1. Send a message from your WhatsApp to any number
2. In the bot logs, you'll see messages with format `1234567890@c.us`
3. Use this format in `ASSISTANT_NUMBER`

Alternative method:
```javascript
// Temporarily add this in the message handler to see your number
console.log('Your number:', msg.key.remoteJid);
```

## Running the Bot

### Development Mode (with auto-restart)

```bash
npm run dev
```

Uses `nodemon` for automatic restart on file changes. Install nodemon globally if needed:
```bash
npm install -g nodemon
```

### Production Mode (recommended)

```bash
npm start
```

This uses the `start.js` wrapper which:
- Filters out Baileys spam messages
- Provides clean console output
- Handles graceful shutdown

### Direct Mode (without wrapper)

```bash
npm run direct
```

Runs `index.js` directly. You'll see all Baileys debug messages.

## Initial Setup

### 1. Start the Bot

```bash
npm start
```

### 2. Scan QR Code

When you start the bot for the first time, you'll see:

```
╔════════════════════════════════════════════════════════════╗
║                 🤖 RINDELL AI ASSISTANT v1.0               ║
╚════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════╗
║               SCAN QR CODE WITH WHATSAPP                   ║
╚════════════════════════════════════════════════════════════╝

[QR CODE APPEARS HERE]
```

### 3. Link Your Device

1. Open WhatsApp on your phone
2. Go to Settings > Linked Devices
3. Tap "Link a Device"
4. Scan the QR code in your terminal

### 4. Wait for Connection

```
⏳ Connecting to WhatsApp...

╔════════════════════════════════════════════════════════════╗
║            RINDELL AI ASSISTANT READY                      ║
╚════════════════════════════════════════════════════════════╝
✅ WhatsApp connected successfully
```

### 5. Test the Bot

Send a test document to any WhatsApp number. The bot will:
1. Receive the document
2. Validate the file type
3. Send an acknowledgment
4. Process through AI
5. Send summary to your configured admin number
6. Notify the sender of completion

## Testing

### Test Document Processing

1. **Send a PDF file** to any WhatsApp number
2. **Check the logs** for processing steps
3. **Verify acknowledgment** is sent to sender
4. **Check admin number** for summary

### Sample Test Files

Create test documents:
- Small PDF (< 1 MB) for quick testing
- Word document (.docx)
- Text file (.txt)

### Verify Webhook

Test your Make.com webhook separately:
```bash
curl -X POST https://hook.eu2.make.com/YOUR_WEBHOOK_ID \
  -F "file=@test.pdf" \
  -F "filename=test.pdf" \
  -F "mimeType=application/pdf"
```

## Configuration Options

### Adjust Timeout

If Claude takes longer to process:
```javascript
WEBHOOK_TIMEOUT: 300000,  // 5 minutes
```

### Add More File Types

```javascript
SUPPORTED_TYPES: {
  // Existing types...
  'image/jpeg': 'JPEG Image',
  'image/png': 'PNG Image',
  'application/zip': 'ZIP Archive'
}
```

### Change Upload Directory

```javascript
UPLOADS_DIR: '/var/rindell/uploads',  // Absolute path
```

### Enable More Logging

In `index.js`, change the Pino logger level:
```javascript
const logger = pino({ level: 'info' })  // or 'debug'
```

## Production Deployment

### Using PM2 (Recommended)

PM2 is a process manager for Node.js applications:

```bash
# Install PM2
npm install -g pm2

# Start the bot
pm2 start start.js --name rindell-ai

# Configure auto-restart on reboot
pm2 startup
pm2 save

# Monitor the bot
pm2 monit

# View logs
pm2 logs rindell-ai

# Restart the bot
pm2 restart rindell-ai

# Stop the bot
pm2 stop rindell-ai
```

### Using systemd (Linux)

Create `/etc/systemd/system/rindell-ai.service`:

```ini
[Unit]
Description=Rindell AI WhatsApp Bot
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/Rindell-Ai
ExecStart=/usr/bin/node /path/to/Rindell-Ai/start.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable rindell-ai
sudo systemctl start rindell-ai
sudo systemctl status rindell-ai
```

### Using Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t rindell-ai .
docker run -d --name rindell-ai \
  -v $(pwd)/auth:/app/auth \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/logs:/app/logs \
  rindell-ai
```

## Troubleshooting

### QR Code Issues

**Problem**: QR code doesn't appear or is garbled

**Solutions**:
1. Increase terminal width (minimum 80 characters)
2. Use a terminal with Unicode support
3. Try a different terminal emulator

### Authentication Fails

**Problem**: "Connection closed - Logged out"

**Solutions**:
1. Delete the `auth/` directory
2. Restart the bot
3. Scan a fresh QR code
4. Ensure WhatsApp Web is enabled on your account

### Connection Drops

**Problem**: Bot disconnects frequently

**Solutions**:
1. Check internet connection stability
2. Increase timeout values in config
3. Check if WhatsApp account is being used elsewhere
4. Verify no IP blocks or rate limits

### Webhook Timeouts

**Problem**: "Make.com webhook failed - timeout"

**Solutions**:
1. Increase `WEBHOOK_TIMEOUT` value
2. Optimize Make.com scenario
3. Check Make.com execution logs
4. Verify Claude API is responding

### No Summary Received

**Problem**: Document processed but no summary

**Solutions**:
1. Check Make.com scenario logs
2. Verify Claude API integration
3. Check response format matches expected structure
4. Test webhook independently

### High Memory Usage

**Problem**: Bot uses too much RAM

**Solutions**:
1. Clean up `uploads/` directory regularly
2. Limit concurrent processing
3. Reduce log retention
4. Consider adding file size limits

### File Upload Fails

**Problem**: "Media download failed"

**Solutions**:
1. Check file size (< 100 MB recommended)
2. Verify internet connection
3. Check file format is supported
4. Retry with smaller test file

## Maintenance

### Log Management

Logs grow daily. Set up rotation:

```bash
# Add to crontab for daily cleanup
0 0 * * * find /path/to/Rindell-Ai/logs -name "*.log" -mtime +30 -delete
```

### Upload Cleanup

Clean old uploaded files:

```bash
# Add to crontab for weekly cleanup
0 0 * * 0 find /path/to/Rindell-Ai/uploads -type f -mtime +7 -delete
```

### Session Refresh

If bot becomes unstable:

1. Stop the bot
2. Delete `auth/` directory
3. Restart and re-authenticate
4. Test with a sample document

### Update Dependencies

Regularly update packages:

```bash
npm update
npm audit fix
```

### Backup

Important directories to backup:
- `auth/` - Authentication state
- `logs/` - Historical logs (optional)

## Security Best Practices

1. **Never commit `auth/` directory** - Contains sensitive credentials
2. **Use environment variables** for sensitive config
3. **Restrict file permissions** on auth directory
4. **Use HTTPS webhooks** with authentication
5. **Monitor logs** for suspicious activity
6. **Limit file sizes** to prevent abuse
7. **Validate webhook responses** before processing
8. **Keep dependencies updated** for security patches

## Next Steps

After successful setup:

1. ✅ Send test documents
2. ✅ Monitor logs for errors
3. ✅ Customize response format
4. ✅ Add error monitoring
5. ✅ Set up automatic backups
6. ✅ Configure log rotation
7. ✅ Document your Make.com scenario
8. ✅ Set up monitoring/alerts

## Getting Help

- **Check logs**: `logs/rindell-YYYY-MM-DD.log`
- **GitHub Issues**: Report bugs or ask questions
- **Make.com Support**: For webhook issues
- **Baileys Documentation**: For WhatsApp integration questions

---

**Congratulations!** 🎉 Your Rindell AI Assistant is now set up and ready to analyze documents via WhatsApp.
