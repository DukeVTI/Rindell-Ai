# RINDELL MVP REBUILD - IMPLEMENTATION PLAN

## Executive Summary

This document outlines the complete rebuild of Rindell from a monolithic prototype into a production-ready modular MVP that meets all specified requirements and success metrics.

## Current Status: FOUNDATION CREATED

### ✅ Completed
1. **Project Structure** - Modular architecture created
   - `src/config/` - Configuration management
   - `src/database/` - PostgreSQL schema and connection
   - `src/services/` - Service modules (whatsapp, document, ai, queue)
   - `src/api/` - Express API routes
   - `src/utils/` - Shared utilities
   - `src/tests/` - Test suites

2. **Configuration** - `src/config/index.js`
   - All environment variables defined
   - Validation logic implemented
   - Success metrics embedded

3. **Database Schema** - `src/database/schema.sql`
   - Users table (authentication)
   - WhatsApp sessions table
   - Documents table (processing tracking)
   - Summaries table (AI output)
   - Processing metrics table
   - System metrics table

4. **Database Connection** - `src/database/index.js`
   - PostgreSQL pool management
   - Query helpers
   - Transaction support
   - All CRUD operations

5. **Dependencies** - package.json updated
   - PostgreSQL (pg)
   - Redis & Bull (queue system)
   - bcrypt & JWT (authentication)
   - Tesseract.js (OCR for images)
   - Jest (testing framework)

## Remaining Work (Estimated 10-12 hours)

### Phase 1: Core Services (3-4 hours)

#### 1.1 Queue Service (`src/services/queue/index.js`)
- Redis connection
- Bull queue setup
- Job processors for document processing
- Error handling and retry logic
- **Success Metric**: Async processing must not block API

#### 1.2 WhatsApp Service (`src/services/whatsapp/index.js`)
- Refactor from web-dashboard.js
- Modular connection management
- QR code generation
- Session persistence
- Message listener
- Document detection (≥95% accuracy required)
- **Success Metric**: Session persists across restarts

#### 1.3 Document Service (`src/services/document/index.js`)
- File download from WhatsApp
- Format detection (PDF, DOCX, TXT, images)
- Text extraction:
  - PDF: pdf-parse
  - DOCX: mammoth
  - TXT: fs.readFile
  - Images: Tesseract.js (OCR)
- Text cleaning
- **Success Metric**: ≤30s processing for 20-page PDF

#### 1.4 AI Service (`src/services/ai/index.js`)
- Groq API integration
- **STRICT OUTPUT FORMAT** implementation:
  ```json
  {
    "title": "Document Title",
    "executiveSummary": "...",
    "keyPoints": ["point1", "point2", ...],
    "importantFacts": ["fact1", "fact2", ...],
    "insights": "...",
    "tldr": "..."
  }
  ```
- Prompt engineering for consistency
- Response validation
- **Success Metric**: 100% format compliance

### Phase 2: API Layer (2 hours)

#### 2.1 Authentication Routes (`src/api/auth.js`)
- POST /api/auth/register
  - Full name, email, phone validation
  - Password hashing (bcrypt)
  - JWT token generation
- POST /api/auth/login
- GET /api/auth/me (verify token)

#### 2.2 WhatsApp Routes (`src/api/whatsapp.js`)
- POST /api/whatsapp/connect/:userId
  - Generate QR code
  - Link WhatsApp account
- GET /api/whatsapp/status/:userId
  - Connection status
- GET /api/whatsapp/qr/:userId
  - Get current QR code

#### 2.3 Document Routes (`src/api/documents.js`)
- GET /api/documents/:userId
  - List user's documents
- GET /api/documents/:userId/:documentId
  - Get specific document and summary
- GET /api/metrics
  - System metrics for testing

### Phase 3: Main Server (1 hour)

#### 3.1 Server Setup (`server.js`)
- Express app initialization
- Middleware setup (CORS, body-parser, auth)
- Route mounting
- Database connection
- Redis connection
- Error handling
- Graceful shutdown

### Phase 4: Processing Pipeline (2 hours)

#### 4.1 Message Processor (`src/services/whatsapp/messageProcessor.js`)
- Document message detection
- Queue job creation
- Error handling

#### 4.2 Document Processor (`src/services/queue/documentProcessor.js`)
- Job handler
- Pipeline orchestration:
  1. Download file
  2. Extract text
  3. Process with AI
  4. Save to database
  5. Send WhatsApp response
- Metrics tracking
- Error recovery

### Phase 5: Testing Suite (2-3 hours)

#### 5.1 Unit Tests
- `src/tests/services/*.test.js`
- Test each service in isolation
- Mock external dependencies

#### 5.2 Integration Tests
- `src/tests/integration/*.test.js`
- Test end-to-end flows
- Database integration
- Queue integration

#### 5.3 Metrics Tests (`src/tests/metrics.test.js`)
- **CRITICAL**: Validate success metrics
- Processing time ≤ 30s for 20-page PDF
- Detection accuracy ≥ 95%
- Session persistence verification
- Output format consistency

#### 5.4 Performance Tests
- Load testing
- Concurrent user handling
- Queue performance

### Phase 6: Frontend (React) (2 hours)

#### 6.1 Setup
- Create React app in `src/frontend/`
- Setup routing
- API client

#### 6.2 Components
- Registration form
- Login form
- Dashboard
- QR code display
- Document list
- Processing status

### Phase 7: Documentation (1 hour)

#### 7.1 API Documentation
- OpenAPI/Swagger spec
- Example requests/responses

#### 7.2 Architecture Documentation
- System diagram
- Data flow
- Service interactions

#### 7.3 Deployment Guide
- Environment setup
- PostgreSQL installation
- Redis installation
- PM2 configuration

## Critical Success Metrics (Testing Requirements)

All tests must validate these metrics:

### 1. Processing Time
- **Target**: ≤ 30 seconds for documents < 20 pages
- **Test**: Load test with sample PDFs of varying sizes
- **Implementation**: Track in `processing_metrics` table

### 2. Detection Accuracy
- **Target**: ≥ 95% document detection rate
- **Test**: Send 100 messages (50 documents, 50 non-documents)
- **Implementation**: Log all detections, calculate accuracy

### 3. Session Persistence
- **Target**: Session survives server restart
- **Test**: Connect WhatsApp, restart server, verify still connected
- **Implementation**: Store session in database + filesystem

### 4. Async Processing
- **Target**: Queue-based, non-blocking
- **Test**: Send document, verify API returns immediately
- **Implementation**: Bull queue with Redis

### 5. Output Consistency
- **Target**: 100% format compliance
- **Test**: Process 50 documents, validate all outputs match schema
- **Implementation**: JSON schema validation

### 6. Error Handling
- **Target**: Clear error messages for unsupported files
- **Test**: Send unsupported file, verify WhatsApp message
- **Implementation**: Error handling in document service

## Acceptance Criteria

MVP is ONLY complete when ALL of the following work:

- [ ] User can register with name, email, phone
- [ ] User receives JWT token
- [ ] User can connect WhatsApp via QR code
- [ ] QR code is generated and displayed
- [ ] User scans QR and connects successfully
- [ ] Session persists in database
- [ ] User sends PDF via WhatsApp
- [ ] System detects document message
- [ ] Document is downloaded and queued
- [ ] Text is extracted from PDF
- [ ] AI processes text with STRICT format
- [ ] Summary is sent back to WhatsApp
- [ ] Processing completes in ≤ 30 seconds
- [ ] All metrics are recorded
- [ ] All tests pass
- [ ] Detection accuracy ≥ 95%
- [ ] Output format is consistent
- [ ] Error handling works correctly

## Next Steps for Developer

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup PostgreSQL**
   ```bash
   # Install PostgreSQL
   sudo apt-get install postgresql postgresql-contrib
   
   # Create database and user
   sudo -u postgres psql
   CREATE DATABASE rindell;
   CREATE USER rindell WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE rindell TO rindell;
   \q
   
   # Initialize schema
   npm run db:init
   ```

3. **Setup Redis**
   ```bash
   # Install Redis
   sudo apt-get install redis-server
   sudo systemctl start redis
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values:
   # - GROQ_API_KEY
   # - DB_PASSWORD
   # - JWT_SECRET
   ```

5. **Implement Remaining Services**
   - Start with `src/services/queue/index.js`
   - Then `src/services/whatsapp/index.js`
   - Then `src/services/document/index.js`
   - Then `src/services/ai/index.js`

6. **Create Main Server**
   - Implement `server.js`
   - Mount all routes
   - Connect services

7. **Write Tests**
   - Unit tests for each service
   - Integration tests for pipeline
   - Metrics validation tests

8. **Run Tests**
   ```bash
   npm test
   npm run test:metrics
   ```

9. **Deploy**
   - Follow VPS deployment guide
   - Setup PM2 for process management
   - Configure NGINX reverse proxy

## Estimated Timeline

- **Phase 1 (Core Services)**: 3-4 hours
- **Phase 2 (API Layer)**: 2 hours
- **Phase 3 (Main Server)**: 1 hour
- **Phase 4 (Processing Pipeline)**: 2 hours
- **Phase 5 (Testing)**: 2-3 hours
- **Phase 6 (Frontend)**: 2 hours
- **Phase 7 (Documentation)**: 1 hour

**Total**: 13-15 hours of focused development

## Notes

- This is a COMPLETE REBUILD, not patches to existing code
- Old files (index.js, web-dashboard.js, etc.) are kept for reference but NOT used
- New architecture is modular, scalable, and testable
- All success metrics are embedded and testable
- Focus on clarity and clean code
- This MVP is production-ready when all acceptance criteria are met

## Contact

For questions or clarification on requirements, refer back to original problem statement.
