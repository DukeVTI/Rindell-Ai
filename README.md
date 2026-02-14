# 🤖 Rindell AI Assistant

> An intelligent WhatsApp bot that automatically analyzes documents using AI and delivers summaries back to users.

## 📋 Overview

Rindell AI Assistant is a sophisticated WhatsApp bot built with Node.js that receives documents from users and processes them through an AI analysis pipeline. It's designed to handle document analysis workflows seamlessly through WhatsApp messaging.

### Key Features

- ✅ **Multi-Format Support**: Handles PDF, Word (.docx/.doc), PowerPoint, Excel, and text files
- 🤖 **AI-Powered Analysis**: Uses Groq AI for fast, cost-effective document analysis
- 💰 **Cost-Effective**: Self-hosted option eliminates per-operation charges
- 📱 **WhatsApp Integration**: Built on Baileys library for robust WhatsApp Web connectivity
- 🔄 **Automatic Reconnection**: Smart reconnection logic with exponential backoff
- 📊 **Comprehensive Logging**: Color-coded console logs and persistent file logging
- 🛡️ **Error Handling**: Graceful error recovery and user-friendly error messages
- 🧹 **Spam Filter**: Filters out verbose Baileys library output for clean logs
- 💾 **File Management**: Organized storage for uploads, authentication, and logs

## 🏗️ Architecture

### Self-Hosted Setup (Recommended)
```
User sends document → WhatsApp (Baileys) → Bot receives → 
Downloads & saves → Your VPS API Server → Groq AI → 
Receives summary → Sends to admin & user
```

### Legacy Setup (Make.com)
```
User sends document → WhatsApp (Baileys) → Bot receives → 
Downloads & saves → Make.com webhook → Claude AI → 
Receives summary → Sends to admin & user
```

### Components

1. **index.js** - Main bot logic with message handling and processing
2. **start.js** - Wrapper script that filters Baileys spam output
3. **api-server.js** - Self-hosted API server for document analysis (NEW!)
4. **package.json** - Dependencies and scripts configuration

### Directory Structure

```
Rindell-Ai/
├── index.js           # Main bot application
├── start.js           # Clean startup wrapper
├── api-server.js      # Self-hosted API server (NEW!)
├── package.json       # Project dependencies
├── .env.example       # Environment variables template
├── auth/              # WhatsApp authentication data (gitignored)
├── uploads/           # Received documents (gitignored)
└── logs/              # Daily log files (gitignored)
```

## 🚀 Getting Started

> **💡 New!** We now offer a **self-hosted option** that eliminates Make.com costs!  
> See [SELF-HOSTED.md](SELF-HOSTED.md) for the complete guide.

### Prerequisites

**Option 1: Self-Hosted (Recommended)**
- Node.js (v14 or higher)
- WhatsApp account for bot
- Groq API key (free at [groq.com](https://console.groq.com))
- VPS or server (optional, can run locally)

**Option 2: Make.com (Legacy)**
- Node.js (v14 or higher)
- WhatsApp account for bot
- Make.com account with webhook configured
- Claude AI access via Make.com

### Quick Start (Self-Hosted)

1. **Clone and install**
   ```bash
   git clone https://github.com/DukeVTI/Rindell-Ai.git
   cd Rindell-Ai
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your Groq API key
   ```

3. **Start API server** (in one terminal)
   ```bash
   npm run api
   ```

4. **Start WhatsApp bot** (in another terminal)
   ```bash
   npm start
   ```

5. **Scan QR code** with WhatsApp and start sending documents!

📖 **Full guide:** See [SELF-HOSTED.md](SELF-HOSTED.md) for detailed setup instructions.

### Installation (Legacy Make.com)

1. **Clone the repository**
   ```bash
   git clone https://github.com/DukeVTI/Rindell-Ai.git
   cd Rindell-Ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the bot**
   
   Create `.env` file or edit `CONFIG` object in `index.js`:
   ```javascript
   const CONFIG = {
     ASSISTANT_NUMBER: 'YOUR_WHATSAPP_NUMBER@c.us',  // Where summaries are sent
     WEBHOOK_URL: 'YOUR_MAKE_WEBHOOK_URL',           // Your Make.com webhook
     WEBHOOK_TIMEOUT: 120000,                         // Timeout in milliseconds
     // ... other settings
   }
   ```

4. **Start the bot**
   ```bash
   npm start
   ```

5. **Scan QR Code**
   
   A QR code will appear in your terminal. Scan it with WhatsApp to authenticate.

### Running Options

**Bot Commands:**
- `npm start` - Start WhatsApp bot (production mode with spam filtering)
- `npm run dev` - Start bot in development mode with auto-restart
- `npm run direct` - Run bot directly without spam filter wrapper

**API Server Commands:**
- `npm run api` - Start self-hosted API server
- `npm run api:dev` - Start API server in development mode
- `npm run test:api` - Test API server functionality

## 💰 Cost Comparison

| Feature | Self-Hosted (Groq) | Make.com (Claude) |
|---------|-------------------|-------------------|
| **Monthly Cost** | ~$0-5 (VPS only) | $9-29+ |
| **Per-Operation** | FREE | Consumes credits |
| **Scalability** | Unlimited | Limited by plan |
| **Setup Time** | 10 minutes | 20 minutes |
| **Speed** | Very Fast (Groq) | Fast |
| **Control** | Full control | Limited |
| **Privacy** | Your server | Third-party |

**Savings: 80-95% for high-volume usage!**

## 📚 Supported File Types

| File Type | MIME Type | Extension |
|-----------|-----------|-----------|
| PDF | `application/pdf` | .pdf |
| Word | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | .docx |
| Word (Legacy) | `application/msword` | .doc |
| PowerPoint | `application/vnd.openxmlformats-officedocument.presentationml.presentation` | .pptx |
| Excel | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | .xlsx |
| Text | `text/plain` | .txt |

## 🔄 Workflow

### 1. Document Reception
- User sends a document via WhatsApp
- Bot validates file type and size
- Sends acknowledgment message to user

### 2. Processing
- Downloads document from WhatsApp servers
- Saves locally to `uploads/` directory
- Sends file to Make.com webhook with metadata

### 3. AI Analysis
- Make.com receives the document
- Routes to Claude AI for analysis
- Returns summary in response

### 4. Delivery
- Bot receives AI-generated summary
- Formats summary with document metadata
- Sends to configured assistant number
- Notifies user of completion

## 🛠️ Technical Details

### Core Dependencies

- **@whiskeysockets/baileys**: WhatsApp Web API library
- **axios**: HTTP client for webhook communication
- **form-data**: Multipart form data for file uploads
- **qrcode-terminal**: QR code display for authentication
- **pino**: Fast logging library

### Features Implementation

#### Smart Logging System
- Color-coded console output for different log levels
- Persistent daily log files with timestamps
- Filters Baileys internal spam messages
- Structured JSON logging for debugging

#### Connection Management
- Multi-file authentication state persistence
- Automatic reconnection with exponential backoff
- Graceful handling of network interruptions
- Session management across restarts

#### Error Handling
- Try-catch blocks around all async operations
- User-friendly error messages
- Admin notifications for failures
- Timeout protection for long-running operations

#### Security Features
- Ignores broadcast messages and status updates
- Filters messages from the bot itself
- Validates file types before processing
- Secure authentication state storage

## 📝 Configuration Options

### CONFIG Object

```javascript
{
  ASSISTANT_NUMBER: '2349167066476@c.us',           // Admin WhatsApp number
  MAKE_WEBHOOK_URL: 'https://hook.eu2.make.com/...', // Make.com webhook URL
  WEBHOOK_TIMEOUT: 120000,                           // 2 minutes timeout
  UPLOADS_DIR: './uploads',                          // Document storage
  AUTH_DIR: './auth',                                // Authentication data
  LOGS_DIR: './logs',                                // Log files
  SUPPORTED_TYPES: { /* ... */ }                     // MIME type mappings
}
```

### Environment Setup

The bot expects these directories (auto-created if missing):
- `uploads/` - Temporary document storage
- `auth/` - WhatsApp authentication credentials
- `logs/` - Daily log files

## 🔒 Security Considerations

1. **Authentication**: WhatsApp credentials stored in `auth/` directory (gitignored)
2. **File Handling**: Documents temporarily stored and can be cleaned up
3. **Webhook Security**: Use HTTPS webhooks and consider authentication
4. **Error Messages**: No sensitive data exposed in user-facing messages
5. **Log Files**: May contain phone numbers; secure appropriately

## 🐛 Troubleshooting

### QR Code Won't Scan
- Ensure QR code is fully visible in terminal
- Try refreshing by restarting the bot
- Clear `auth/` directory and restart

### Connection Drops Frequently
- Check internet connection stability
- Verify WhatsApp Web is allowed on your account
- Increase `connectTimeoutMs` in socket config

### Webhook Timeouts
- Increase `WEBHOOK_TIMEOUT` value
- Check Make.com scenario execution time
- Verify webhook URL is correct and accessible

### No Summary Received
- Check Make.com logs for errors
- Verify Claude AI integration is working
- Check response format from webhook

## 📊 Logging

Logs are stored in:
- Console: Color-coded real-time logs
- Files: `logs/rindell-YYYY-MM-DD.log`

Log Levels:
- ✅ Success (green)
- ℹ️ Info (blue)
- ⚠️ Warning (yellow)
- ❌ Error (red)
- ⏳ Processing (cyan)
- 📄 Document (magenta)
- 🌐 Network (blue)
- 🤖 AI (cyan)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is for educational and internal use. Please ensure compliance with WhatsApp's Terms of Service when deploying.

## 🙏 Acknowledgments

- Built with [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- AI powered by Claude (Anthropic)
- Automation via [Make.com](https://make.com)

## 📞 Support

For issues or questions, please open an issue on GitHub or contact the maintainer.

---

**Version**: 1.0.0  
**Status**: Active Development  
**Last Updated**: February 2026
