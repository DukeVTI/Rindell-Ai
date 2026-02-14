# 🤝 Contributing to Rindell AI

Thank you for your interest in contributing to Rindell AI Assistant! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Issue Guidelines](#issue-guidelines)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js v14+ installed
- Git installed
- Basic understanding of JavaScript/Node.js
- WhatsApp account for testing
- Make.com account (optional for development)

### First Time Setup

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Rindell-Ai.git
   cd Rindell-Ai
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/DukeVTI/Rindell-Ai.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Environment Configuration

For development, you may want to use different configuration:

```javascript
// Development config
const CONFIG = {
  ASSISTANT_NUMBER: 'YOUR_TEST_NUMBER@c.us',
  MAKE_WEBHOOK_URL: 'http://localhost:3000/webhook', // Local testing
  WEBHOOK_TIMEOUT: 30000, // Shorter timeout for testing
  // ... other settings
};
```

### Running Locally

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start

# Direct mode (with debug output)
npm run direct
```

### Local Webhook Testing

For testing without Make.com, create a simple webhook server:

```javascript
// test-webhook.js
const express = require('express');
const multer = require('multer');
const app = express();
const upload = multer();

app.post('/webhook', upload.single('file'), (req, res) => {
  console.log('Received file:', req.file.originalname);
  console.log('Metadata:', req.body);
  
  // Return mock summary
  res.json({
    summary: `This is a test summary for ${req.file.originalname}`
  });
});

app.listen(3000, () => {
  console.log('Test webhook running on http://localhost:3000');
});
```

## Project Structure

```
Rindell-Ai/
├── index.js              # Main application logic
│   ├── Logger            # Logging utilities
│   ├── FileManager       # File operations
│   ├── MessageHandler    # Message processing
│   └── ConnectionHandler # WhatsApp connection
├── start.js              # Clean startup wrapper
├── package.json          # Dependencies and scripts
├── README.md             # Project overview
├── ARCHITECTURE.md       # System design
├── SETUP.md              # Installation guide
├── API.md                # API documentation
└── CONTRIBUTING.md       # This file
```

### Key Components

- **Logger**: Console and file logging with colors
- **FileManager**: File validation, download, and storage
- **MessageHandler**: Core message processing logic
- **ConnectionHandler**: WhatsApp connection management

## Coding Standards

### JavaScript Style

We follow standard JavaScript conventions:

```javascript
// ✅ Good
const fileName = doc.fileName || `document_${Date.now()}`;

// ❌ Bad
const file_name=doc.fileName||"document_"+Date.now()

// ✅ Good: Clear variable names
const webhookResponse = await axios.post(url, data);

// ❌ Bad: Unclear abbreviations
const res = await axios.post(url, data);

// ✅ Good: Comments for complex logic
// Extract summary from various possible response fields
const summary = response.data.summary || 
                response.data.Body || 
                response.data.text;

// ❌ Bad: No comments for non-obvious code
const s = r.d.s || r.d.B || r.d.t;
```

### Code Organization

- Keep functions small and focused (< 50 lines)
- Use clear, descriptive names
- Separate concerns into classes
- Add comments for complex logic
- Use async/await over callbacks

### Error Handling

```javascript
// ✅ Good: Specific error handling
try {
  const buffer = await FileManager.downloadMedia(doc, 'document');
} catch (error) {
  Logger.error('Media download failed', { error: error.message });
  // Handle error gracefully
}

// ❌ Bad: Silent failures
try {
  const buffer = await FileManager.downloadMedia(doc, 'document');
} catch (error) {
  // Empty catch
}
```

### Logging

Use appropriate log levels:

```javascript
Logger.success('Document processed');        // Completed actions
Logger.info('Starting connection');          // General info
Logger.warn('Large file detected');          // Warnings
Logger.error('Failed to connect', { error }); // Errors
Logger.processing('Downloading file');       // In-progress
Logger.document('New PDF received');         // Document operations
Logger.network('Webhook request sent');      // Network operations
Logger.ai('AI analysis complete');           // AI operations
```

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting)
- **refactor**: Code refactoring
- **test**: Adding tests
- **chore**: Maintenance tasks

### Examples

```bash
# Good commit messages
feat(logger): add color-coded console output
fix(webhook): handle timeout errors gracefully
docs(readme): update installation instructions
refactor(handler): extract validation logic to separate function

# Bad commit messages
update code
fixed bug
changes
wip
```

### Commit Best Practices

- Write clear, concise commit messages
- Keep commits focused on a single change
- Reference issue numbers when applicable
- Use present tense ("add feature" not "added feature")

## Pull Request Process

### Before Submitting

1. **Update your branch** with latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Test your changes**:
   ```bash
   npm start
   # Test with real WhatsApp messages
   ```

3. **Check code style**:
   - No console.log statements (use Logger)
   - No commented-out code
   - Consistent formatting

4. **Update documentation** if needed:
   - Update README.md for new features
   - Update API.md for API changes
   - Add comments for complex logic

### Submitting PR

1. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request** on GitHub

3. **Fill out PR template**:
   - Clear description of changes
   - Link related issues
   - Screenshots (if UI changes)
   - Testing performed

4. **Wait for review**:
   - Address reviewer feedback
   - Make requested changes
   - Update PR as needed

### PR Title Format

```
feat: Add support for image analysis
fix: Resolve webhook timeout issue
docs: Improve setup instructions
```

## Testing

### Manual Testing

Since this is a WhatsApp bot, testing is primarily manual:

1. **Start the bot**:
   ```bash
   npm start
   ```

2. **Authenticate with WhatsApp**:
   - Scan QR code
   - Wait for connection

3. **Test scenarios**:
   - Send supported document (PDF)
   - Send unsupported document
   - Send large file (> 50 MB)
   - Test error cases
   - Verify logs are correct

4. **Check outputs**:
   - User receives acknowledgment
   - Admin receives summary
   - User receives completion message
   - Logs show all steps

### Testing Checklist

- [ ] Bot connects successfully
- [ ] QR code displays correctly
- [ ] Receives documents properly
- [ ] Validates file types
- [ ] Downloads files successfully
- [ ] Sends to webhook correctly
- [ ] Receives and parses response
- [ ] Formats summary correctly
- [ ] Sends messages to correct recipients
- [ ] Handles errors gracefully
- [ ] Logs all actions
- [ ] Reconnects after disconnect

### Test Cases

Create test files for each supported type:
- `test.pdf` - Sample PDF
- `test.docx` - Sample Word document
- `test.txt` - Sample text file
- `test.xlsx` - Sample Excel file
- `large.pdf` - Large file (> 50 MB)

## Documentation

### What to Document

- **New Features**: Update README.md and API.md
- **Configuration**: Update SETUP.md
- **Architecture Changes**: Update ARCHITECTURE.md
- **Breaking Changes**: Highlight in PR and update docs
- **Code Comments**: Add for complex logic

### Documentation Style

- Use clear, concise language
- Include code examples
- Add diagrams where helpful
- Keep formatting consistent
- Test all commands/examples

## Issue Guidelines

### Reporting Bugs

Use the bug report template:

```markdown
**Describe the bug**
A clear description of the bug.

**To Reproduce**
Steps to reproduce:
1. Start bot
2. Send PDF file
3. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Logs**
```
[Paste relevant logs]
```

**Environment**
- OS: [e.g., Ubuntu 20.04]
- Node.js version: [e.g., v16.14.0]
- Bot version: [e.g., 1.0.0]
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features.

**Additional context**
Any other context, screenshots, or examples.
```

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `question` - Further information requested

## Areas for Contribution

### Priority Areas

1. **Testing Framework**: Add automated tests
2. **Error Handling**: Improve error messages
3. **Performance**: Optimize file handling
4. **Documentation**: Improve guides and examples
5. **Features**: See Issues for feature requests

### Easy Contributions

- Fix typos in documentation
- Improve error messages
- Add code comments
- Create examples
- Write tutorials

### Advanced Contributions

- Add support for new file types
- Implement batch processing
- Add retry logic for webhooks
- Create monitoring dashboard
- Build plugin system

## Questions?

- **GitHub Issues**: For bugs and features
- **GitHub Discussions**: For questions and ideas
- **Email**: Contact repository owner

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes for significant contributions
- README.md acknowledgments section

---

Thank you for contributing to Rindell AI! 🎉
