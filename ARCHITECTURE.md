# 🏗️ Rindell AI - Architecture Documentation

## System Overview

Rindell AI is a WhatsApp-based document analysis assistant that integrates multiple services to provide intelligent document summaries. The system follows a pipeline architecture with clear separation of concerns.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      WhatsApp User                          │
│                  (Sends Document)                           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Document Message
                  │
┌─────────────────▼───────────────────────────────────────────┐
│              WhatsApp Web (Baileys)                         │
│           • QR Authentication                               │
│           • Message Reception                               │
│           • Media Download                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Document Buffer
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                Rindell AI Bot (Node.js)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Message Handler                            │  │
│  │  • Validates file type                               │  │
│  │  • Downloads media                                   │  │
│  │  • Saves to disk                                     │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                            │
│  ┌──────────────▼───────────────────────────────────────┐  │
│  │         File Manager                                 │  │
│  │  • MIME type validation                              │  │
│  │  • File storage                                      │  │
│  │  • Size formatting                                   │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                            │
│  ┌──────────────▼───────────────────────────────────────┐  │
│  │         Logger                                       │  │
│  │  • Console logging                                   │  │
│  │  • File logging                                      │  │
│  │  • Color formatting                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ HTTP POST (multipart/form-data)
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                  Make.com Webhook                           │
│           • Receives document                               │
│           • Extracts text/content                           │
│           • Routes to AI                                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ AI Request
                  │
┌─────────────────▼───────────────────────────────────────────┐
│               Claude AI (Anthropic)                         │
│           • Document analysis                               │
│           • Summary generation                              │
│           • Returns structured text                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Summary Response
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                  Make.com Webhook                           │
│           • Formats response                                │
│           • Returns to bot                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ JSON/Text Response
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                Rindell AI Bot (Node.js)                     │
│           • Extracts summary                                │
│           • Formats message                                 │
│           • Sends to admin                                  │
│           • Notifies user                                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Formatted Summary
                  │
┌─────────────────▼───────────────────────────────────────────┐
│              Admin WhatsApp Number                          │
│           (Receives Summary Report)                         │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Entry Point (start.js)

**Purpose**: Clean wrapper that filters verbose Baileys output

**Responsibilities**:
- Spawn child process for main bot
- Filter console output streams (stdout/stderr)
- Remove debugging noise from Baileys library
- Handle graceful shutdown

**Key Features**:
- Removes "Decrypted message", "Closing session", and other spam
- Maintains clean console for meaningful logs
- Preserves error messages and important information

### 2. Main Application (index.js)

#### 2.1 Logger Class

**Purpose**: Centralized logging with multiple output formats

**Capabilities**:
- Color-coded console output (8 log levels)
- Persistent file logging with timestamps
- Daily log rotation (auto-creates new files)
- Structured JSON data logging
- Visual headers and dividers

**Methods**:
- `success()` - Green checkmark for completed actions
- `info()` - Blue info icon for general information
- `warn()` - Yellow warning triangle
- `error()` - Red X for errors
- `processing()` - Cyan hourglass for in-progress
- `document()` - Magenta file icon
- `network()` - Blue globe for HTTP requests
- `ai()` - Cyan robot for AI operations

#### 2.2 FileManager Class

**Purpose**: Handle all file operations and validations

**Responsibilities**:
- Directory creation and management
- MIME type validation against supported types
- File type name resolution
- File size formatting (B, KB, MB)
- Local file storage
- WhatsApp media download handling

**Flow**:
1. Validate MIME type against supported list
2. Download media stream from WhatsApp
3. Convert stream to buffer
4. Save to local filesystem
5. Return file path for further processing

#### 2.3 MessageHandler Class

**Purpose**: Core message processing logic

**Message Flow**:
```
Receive Message
    ↓
Filter unwanted messages
    ↓
Extract document metadata
    ↓
Validate file type
    ↓
Send acknowledgment to user
    ↓
Download document
    ↓
Save locally
    ↓
Send to webhook
    ↓
Wait for AI response
    ↓
Extract summary
    ↓
Format report
    ↓
Send to admin & user
```

**Filtering Logic**:
- Ignores messages from bot itself (`msg.key.fromMe`)
- Ignores status broadcasts (`status@broadcast`)
- Ignores all broadcast messages
- Ignores stub messages (system messages)
- Only processes document messages

**Error Handling**:
- Try-catch around entire process
- Timeout protection on webhook calls
- Graceful fallback messages
- Admin notifications on failures

#### 2.4 ConnectionHandler Class

**Purpose**: Manage WhatsApp connection lifecycle

**States**:
1. **QR Display**: Shows QR code for initial authentication
2. **Connecting**: Connection in progress
3. **Open**: Successfully connected
4. **Close**: Connection lost

**Reconnection Strategy**:
```javascript
delay = min(5000 * attempts, 30000)  // Exponential backoff capped at 30s
```

**Session Management**:
- Saves credentials after each update
- Reuses saved sessions on restart
- Detects new vs. existing logins
- Handles logged-out state (requires manual restart)

### 3. WhatsApp Integration (Baileys)

**Configuration**:
- Multi-file auth state for persistence
- Silent logging (pino level: 'silent')
- Disabled sync full history (faster startup)
- Custom browser identifier: "Rindell AI"
- Disabled own event emissions (reduces spam)
- 60-second connection timeout
- 30-second keep-alive interval

**Event Handlers**:
- `creds.update` - Save authentication updates
- `connection.update` - Handle connection state
- `messages.upsert` - Process new messages
- Various ignored events (chats, contacts, groups, history)

### 4. External Services

#### 4.1 Make.com Webhook

**Request Format**:
```javascript
POST {MAKE_WEBHOOK_URL}
Content-Type: multipart/form-data

Fields:
- file: Buffer (document binary)
- filename: String
- mimeType: String
- source: String (WhatsApp ID)
- size: String (bytes)
```

**Expected Response**:
```javascript
// Option 1: Plain text
"Your summary text here..."

// Option 2: JSON object
{
  "summary": "Your summary text here...",
  // or "Body", "text", "content", "message", "result"
}
```

**Timeout**: 120 seconds (configurable)

#### 4.2 Claude AI (via Make.com)

**Processing**:
1. Make.com receives document
2. Extracts text/content from file
3. Sends to Claude API with prompt
4. Claude analyzes and generates summary
5. Returns to Make.com
6. Make.com returns to bot

## Data Flow

### Document Processing Pipeline

```
1. User Sends Document
   ├─ WhatsApp receives message
   ├─ Baileys downloads media
   └─ Bot receives message event

2. Initial Processing
   ├─ Validate message type (document)
   ├─ Check MIME type support
   ├─ Send acknowledgment to user
   └─ Extract metadata (name, size, type)

3. Download & Storage
   ├─ Download from WhatsApp servers
   ├─ Convert stream to buffer
   ├─ Save to uploads/ directory
   └─ Log file details

4. Webhook Transmission
   ├─ Create multipart form data
   ├─ Add file buffer
   ├─ Add metadata fields
   ├─ POST to Make.com
   └─ Wait for response (up to 120s)

5. AI Analysis (External)
   ├─ Make.com extracts document text
   ├─ Sends to Claude AI
   ├─ Claude analyzes content
   └─ Returns summary

6. Response Processing
   ├─ Receive webhook response
   ├─ Extract summary from response
   ├─ Validate summary exists
   └─ Format report

7. Delivery
   ├─ Send formatted report to admin
   ├─ Send completion message to user
   └─ Log success

8. Error Handling (if any step fails)
   ├─ Log error details
   ├─ Send error message to user
   ├─ Notify admin of failure
   └─ Continue listening for new messages
```

## State Management

### Authentication State
- Stored in: `auth/` directory
- Format: Multi-file (keys, identity, etc.)
- Persistence: Automatic via Baileys
- Lifecycle: Survives restarts

### Connection State
- `isConnected`: Boolean flag
- `reconnectAttempts`: Counter for backoff
- `sock`: Active socket instance

### File State
- Uploaded documents: `uploads/` directory
- Retention: Manual cleanup required
- Naming: Original filename or timestamp-based

### Logging State
- Daily log files: `logs/rindell-YYYY-MM-DD.log`
- Format: Timestamped JSON entries
- Rotation: Automatic by date

## Security Architecture

### Input Validation
- MIME type whitelist
- Message type filtering
- Broadcast message blocking
- Self-message filtering

### Authentication
- WhatsApp QR code authentication
- Session persistence in encrypted format
- No plaintext credentials in code

### Error Handling
- No sensitive data in user messages
- Admin-only detailed error reports
- Logged errors contain full context

### External Communication
- HTTPS webhooks recommended
- Timeout protection
- No credential exposure in requests

## Scalability Considerations

### Current Limitations
- Single WhatsApp account per instance
- Sequential message processing
- Local file storage
- Single admin recipient

### Potential Improvements
1. **Multi-tenancy**: Support multiple WhatsApp accounts
2. **Queue System**: Process documents asynchronously
3. **Cloud Storage**: Move uploads to S3/GCS
4. **Database**: Track processing history
5. **Load Balancing**: Distribute across instances
6. **Caching**: Cache frequent analysis results
7. **Rate Limiting**: Protect against spam

## Performance Characteristics

### Typical Processing Time
- Message reception: < 1s
- Document download: 1-5s (depends on size)
- Webhook transmission: 2-10s (depends on size)
- AI analysis: 10-60s (depends on document length)
- Total: 15-75s per document

### Resource Usage
- Memory: ~50-100 MB baseline
- CPU: Low (I/O bound)
- Network: High during downloads/uploads
- Disk: Grows with document storage

### Bottlenecks
1. WhatsApp media download speed
2. Make.com webhook latency
3. Claude AI processing time
4. Network connectivity

## Error Recovery

### Connection Loss
- Automatic reconnection with exponential backoff
- Session preservation across restarts
- QR re-authentication if logged out

### Processing Failures
- User notification of errors
- Admin notification with details
- Continue processing next messages
- No crash on single message failure

### Webhook Failures
- Timeout protection (120s)
- Error messages to user and admin
- Logged for debugging
- Graceful degradation

## Monitoring & Observability

### Logging
- Console: Real-time colored output
- Files: Persistent daily logs
- Format: Timestamp + Level + Message + Data

### Key Metrics to Track
- Messages processed per hour
- Success/failure rate
- Average processing time
- Webhook response times
- Connection uptime
- Error frequency by type

### Health Indicators
- Connection state (open/closed)
- Reconnection attempts
- Last successful message
- Webhook availability
- Disk space for uploads/logs

## Configuration Management

### Hardcoded (in index.js)
- Assistant WhatsApp number
- Make.com webhook URL
- Timeout values
- Supported MIME types

### Auto-Generated
- Directory paths
- Log files
- Authentication state

### Future: Environment Variables
Consider moving to `.env`:
```env
ASSISTANT_NUMBER=...
WEBHOOK_URL=...
WEBHOOK_TIMEOUT=120000
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js | JavaScript execution |
| WhatsApp | Baileys | WhatsApp Web API |
| HTTP Client | Axios | Webhook communication |
| Forms | form-data | Multipart uploads |
| QR Display | qrcode-terminal | Authentication QR |
| Logging | Pino + Custom | Structured logging |
| AI | Claude (Anthropic) | Document analysis |
| Orchestration | Make.com | Workflow automation |

## Future Architecture Considerations

### Microservices Approach
```
┌─────────────┐
│ WhatsApp    │
│ Gateway     │
└──────┬──────┘
       │
┌──────▼──────┐
│   Message   │
│   Queue     │  (Redis/RabbitMQ)
└──────┬──────┘
       │
┌──────▼──────┐
│  Document   │
│  Processor  │  (Multiple workers)
└──────┬──────┘
       │
┌──────▼──────┐
│     AI      │
│   Service   │  (Direct API)
└──────┬──────┘
       │
┌──────▼──────┐
│  Response   │
│   Handler   │
└─────────────┘
```

### Advantages
- Horizontal scaling
- Independent deployment
- Better fault isolation
- Easier maintenance
- Advanced monitoring

---

This architecture provides a solid foundation for document analysis via WhatsApp while maintaining simplicity and reliability.
