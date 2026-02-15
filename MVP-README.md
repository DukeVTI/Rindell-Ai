# 🚀 Rindell AI - MVP Documentation

## Quick Start Guide

### Prerequisites

1. **Node.js** (v16 or higher)
2. **PostgreSQL** (v12 or higher)
3. **Redis** (v6 or higher)
4. **Groq API Key** - Get from [console.groq.com](https://console.groq.com)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 3. Setup PostgreSQL
sudo apt-get install postgresql postgresql-contrib
sudo -u postgres psql
  CREATE DATABASE rindell;
  CREATE USER rindell WITH PASSWORD 'your_password';
  GRANT ALL PRIVILEGES ON DATABASE rindell TO rindell;
  \q

# 4. Initialize database
npm run db:init

# 5. Setup Redis
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis

# 6. Run tests
node src/tests/basic.test.js

# 7. Start server
npm start
```

### Environment Configuration

Edit `.env` file with these required values:

```env
# Database
DB_PASSWORD=your_database_password

# Security (generate random secret)
JWT_SECRET=your_random_jwt_secret_here

# AI
GROQ_API_KEY=gsk_your_groq_api_key
```

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  WhatsApp   │────▶│   Queue     │────▶│  Processor  │
│  (Baileys)  │     │   (Redis)   │     │  Pipeline   │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                         ┌────────────────────────────────┐
                         │  1. Extract Text (PDF/DOCX)    │
                         │  2. Process with AI (Groq)     │
                         │  3. Store in Database (PG)     │
                         │  4. Send to WhatsApp           │
                         └────────────────────────────────┘
```

### Module Structure

```
src/
├── config/          # Configuration management
├── database/        # PostgreSQL connection & schema
├── services/
│   ├── queue/      # Redis + Bull queue
│   ├── ai/         # Groq AI service
│   ├── document/   # Text extraction
│   └── whatsapp/   # WhatsApp integration
├── api/            # Express API routes
├── utils/          # Helper functions
└── tests/          # Test suites
```

## API Endpoints

### Authentication

#### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "password": "secure_password"
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure_password"
}
```

### Documents

#### List Documents
```bash
GET /api/documents/:userId
Authorization: Bearer <token>
```

#### Get Document Details
```bash
GET /api/documents/:userId/:documentId
Authorization: Bearer <token>
```

### Metrics

#### System Metrics (Success Criteria Validation)
```bash
GET /api/metrics/system
```

Response includes:
- Average processing time vs 30s target
- Compliance rate
- Detection accuracy vs 95% target
- Queue statistics

#### Health Check
```bash
GET /api/metrics/health
```

## Success Metrics

The MVP is tested against these **non-negotiable** requirements:

| Metric | Target | How to Verify |
|--------|--------|---------------|
| **Processing Time** | ≤ 30 seconds for <20 pages | GET /api/metrics/system |
| **Detection Accuracy** | ≥ 95% document detection | GET /api/metrics/system |
| **Session Persistence** | Survives server restart | Restart server, check connection |
| **Async Processing** | Queue-based, non-blocking | Queue stats in metrics |
| **Output Format** | 100% compliance | All AI responses validated |
| **Error Handling** | Clear error messages | Send unsupported file |

## Document Processing Pipeline

### 1. Supported Formats

- **PDF** (.pdf) - Using pdf-parse
- **Word** (.docx, .doc) - Using mammoth
- **Text** (.txt) - Raw text
- **Images** (.png, .jpg, .jpeg) - Using Tesseract OCR

### 2. Processing Stages

```
1. DETECTION     - Identify document type
2. DOWNLOAD      - Get file from WhatsApp
3. EXTRACTION    - Extract text (format-specific)
4. AI PROCESSING - Generate structured summary
5. STORAGE       - Save to database
6. RESPONSE      - Send formatted message
```

### 3. AI Output Format (STRICT)

Every summary includes:

```json
{
  "title": "Document Title",
  "executiveSummary": "2-3 paragraph comprehensive summary",
  "keyPoints": [
    "Key point 1",
    "Key point 2",
    "..."
  ],
  "importantFacts": [
    "Fact 1",
    "Fact 2",
    "..."
  ],
  "insights": "Analysis and implications",
  "tldr": "One-sentence ultra-concise summary"
}
```

## Testing

### Basic Tests

```bash
node src/tests/basic.test.js
```

Tests:
- ✅ Configuration validation
- ✅ Document text extraction
- ✅ AI service format compliance

### Manual Test

```bash
# 1. Start server
npm start

# 2. Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phoneNumber": "+1234567890",
    "password": "testpass123"
  }'

# 3. Test document processing
curl -X POST http://localhost:3000/api/test/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "text": "Your test document text here...",
    "filename": "test.txt"
  }'

# 4. Check metrics
curl http://localhost:3000/api/metrics/system
```

## Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check credentials in .env
# Verify database exists
sudo -u postgres psql -c "\l"
```

### Redis Connection Failed

```bash
# Check Redis is running
sudo systemctl status redis

# Test connection
redis-cli ping
# Should return: PONG
```

### AI Service Fails

```bash
# Verify Groq API key
echo $GROQ_API_KEY

# Test API key
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"
```

### Queue Not Processing

```bash
# Check queue stats
curl http://localhost:3000/api/metrics/system | jq '.metrics.queue'

# Check Redis
redis-cli
> KEYS *
> EXIT
```

## Development

### Project Structure

```
/home/runner/work/Rindell-Ai/Rindell-Ai/
├── server.js                 # Main entry point
├── package.json              # Dependencies
├── .env.example              # Environment template
├── MVP-REBUILD-PLAN.md       # Implementation plan
├── src/
│   ├── config/               # Configuration
│   │   └── index.js
│   ├── database/             # Database
│   │   ├── index.js         # Connection & queries
│   │   ├── schema.sql       # Schema definition
│   │   └── init.js          # Initialization script
│   ├── services/             # Core services
│   │   ├── queue/           # Redis queue
│   │   ├── ai/              # Groq AI
│   │   ├── document/        # Text extraction
│   │   └── whatsapp/        # WhatsApp (to implement)
│   ├── api/                  # API routes
│   │   ├── auth.js          # Authentication
│   │   ├── documents.js     # Document endpoints
│   │   ├── metrics.js       # Metrics endpoints
│   │   └── middleware.js    # Auth middleware
│   ├── utils/                # Utilities
│   │   └── index.js         # Helper functions
│   └── tests/                # Tests
│       └── basic.test.js    # Basic functionality tests
└── legacy/                   # Old implementation (for reference)
    ├── index.js
    ├── platform.js
    └── web-dashboard.js
```

### NPM Scripts

```json
{
  "start": "node server.js",          // Start server
  "dev": "nodemon server.js",         // Dev mode with auto-reload
  "test": "jest --coverage",          // Run all tests
  "test:watch": "jest --watch",       // Watch mode
  "test:metrics": "node src/tests/metrics.test.js",  // Metrics tests
  "db:init": "node src/database/init.js"  // Initialize database
}
```

## Next Steps

### Phase 4: WhatsApp Integration

- [ ] Refactor WhatsApp service from legacy code
- [ ] Message listener for documents
- [ ] QR code generation for user linking
- [ ] Session persistence implementation
- [ ] Connect to queue system

### Phase 5: Testing Suite

- [ ] Unit tests for all services
- [ ] Integration tests for pipeline
- [ ] Metrics validation tests
- [ ] Performance tests

### Phase 6: Frontend

- [ ] React dashboard
- [ ] User registration/login
- [ ] QR code display
- [ ] Document history
- [ ] Processing status

### Phase 7: Deployment

- [ ] Docker setup
- [ ] PM2 configuration
- [ ] NGINX reverse proxy
- [ ] SSL certificates
- [ ] Production checklist

## Success Criteria (Definition of Done)

MVP is complete when:

- [x] Modular architecture implemented
- [x] Database schema created
- [x] Queue system working
- [x] Document extraction (PDF, DOCX, TXT, images)
- [x] AI service with STRICT format
- [x] API routes with authentication
- [x] Metrics tracking
- [ ] WhatsApp integration
- [ ] User can register
- [ ] User connects WhatsApp via QR
- [ ] Document auto-detection
- [ ] Summary returned to WhatsApp
- [ ] All tests pass
- [ ] All metrics meet targets

## Support

For issues or questions:
1. Check `MVP-REBUILD-PLAN.md` for implementation details
2. Review `QR-CODE-FIX-GUIDE.md` for WhatsApp issues
3. Check logs: `pm2 logs rindell-ai`

## License

See LICENSE file for details.
