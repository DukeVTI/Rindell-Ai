# 🚀 Rindell AI - Self-Hosted Setup Guide

## Overview

This guide explains how to use Rindell AI with a **self-hosted API server** instead of Make.com, saving you money on webhook credits. The new setup uses **Groq AI** for fast, cost-effective document analysis.

## Architecture

### Old Setup (Make.com)
```
WhatsApp Bot → Make.com Webhook → Claude AI → Summary
```

### New Setup (Self-Hosted)
```
WhatsApp Bot → Your VPS API Server → Groq AI → Summary
```

## Prerequisites

1. **VPS or Server** - Where you'll run the API server
2. **Groq API Key** - Free tier available at [groq.com](https://console.groq.com)
3. **Node.js v14+** - Installed on your server

## Step 1: Get Groq API Key

1. Visit [https://console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Go to API Keys section
4. Create a new API key
5. Copy your API key (starts with `gsk_...`)

## Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and set your values:

```env
# Your WhatsApp number for receiving summaries
ASSISTANT_NUMBER=1234567890@c.us

# API Server URL (use localhost for local, or your VPS IP/domain)
API_SERVER_URL=http://localhost:3000/analyze

# API Server Port
API_PORT=3000

# Your Groq API Key
GROQ_API_KEY=gsk_your_actual_groq_api_key_here

# Groq Model (default is recommended)
GROQ_MODEL=llama-3.1-70b-versatile
```

### Available Groq Models

- `llama-3.1-70b-versatile` (Recommended) - Best quality, good speed
- `llama-3.1-8b-instant` - Fastest, good for simple docs
- `mixtral-8x7b-32768` - Good for large documents
- `gemma-7b-it` - Lightweight option

## Step 3: Install Dependencies

```bash
npm install
```

This installs:
- `express` - API server framework
- `multer` - File upload handling
- `pdf-parse` - PDF text extraction
- `mammoth` - Word document processing
- `xlsx` - Excel spreadsheet processing
- `dotenv` - Environment variable management

## Step 4: Start the API Server

### Option A: Development Mode (with auto-restart)

```bash
npm run api:dev
```

### Option B: Production Mode

```bash
npm run api
```

You should see:

```
╔════════════════════════════════════════════════════════════╗
║        🤖 RINDELL AI DOCUMENT ANALYSIS API SERVER         ║
╚════════════════════════════════════════════════════════════╝

✅ Server running on port 3000
🤖 Using Groq AI model: llama-3.1-70b-versatile
📡 Endpoint: http://localhost:3000/analyze
💚 Health check: http://localhost:3000/health

────────────────────────────────────────────────────────────
Ready to process documents! 📄
```

## Step 5: Test the API Server

Test the health endpoint:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Rindell AI Document Analysis API",
  "groq_configured": true,
  "model": "llama-3.1-70b-versatile"
}
```

## Step 6: Start the WhatsApp Bot

In a new terminal:

```bash
npm start
```

The bot will now use your self-hosted API server instead of Make.com!

## Production Deployment on VPS

### Using PM2 (Recommended)

Install PM2:
```bash
npm install -g pm2
```

Start both services:
```bash
# Start API server
pm2 start api-server.js --name rindell-api

# Start WhatsApp bot
pm2 start start.js --name rindell-bot

# Save configuration
pm2 save

# Setup auto-start on reboot
pm2 startup
```

Monitor services:
```bash
pm2 status
pm2 logs rindell-api
pm2 logs rindell-bot
```

### Using systemd

Create `/etc/systemd/system/rindell-api.service`:

```ini
[Unit]
Description=Rindell AI API Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/Rindell-Ai
ExecStart=/usr/bin/node api-server.js
Restart=always
RestartSec=10
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/rindell-bot.service`:

```ini
[Unit]
Description=Rindell AI WhatsApp Bot
After=network.target rindell-api.service

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/Rindell-Ai
ExecStart=/usr/bin/node start.js
Restart=always
RestartSec=10
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable rindell-api rindell-bot
sudo systemctl start rindell-api rindell-bot
sudo systemctl status rindell-api rindell-bot
```

## Remote VPS Setup

If your API server is on a remote VPS:

### On Your VPS

1. Clone the repository
2. Create `.env` with your Groq API key
3. Install dependencies: `npm install`
4. Start API server: `npm run api` or use PM2
5. Note your server's IP address

### Configure Firewall

Allow incoming connections on port 3000:

```bash
# UFW (Ubuntu)
sudo ufw allow 3000/tcp

# iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

### Update Local Bot Configuration

On your local machine (where WhatsApp bot runs), update `.env`:

```env
API_SERVER_URL=http://YOUR_VPS_IP:3000/analyze
```

### Using HTTPS (Recommended for Production)

Use nginx as a reverse proxy with SSL:

1. Install nginx and certbot
2. Configure nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location /analyze {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 100M;
    }
    
    location /health {
        proxy_pass http://localhost:3000;
    }
}
```

Then update `.env`:
```env
API_SERVER_URL=https://your-domain.com/analyze
```

## Supported Document Types

The API server can extract text from:

- ✅ **PDF** (`.pdf`) - Using pdf-parse
- ✅ **Word** (`.docx`, `.doc`) - Using mammoth
- ✅ **Excel** (`.xlsx`) - Using xlsx library
- ✅ **PowerPoint** (`.pptx`) - Using mammoth
- ✅ **Text** (`.txt`) - Native support

## Cost Comparison

### Make.com
- Free tier: 1,000 operations/month
- Paid: $9-29/month for more operations
- Costs scale with usage

### Self-Hosted with Groq
- API server: FREE (runs on your VPS)
- Groq API: FREE tier with generous limits
- Paid Groq: ~$0.10 per 1M tokens (very affordable)
- Fixed VPS cost regardless of usage

**Estimated savings: 80-95% for high-volume usage**

## Troubleshooting

### API Server Won't Start

**Error: "GROQ_API_KEY environment variable is required"**
- Solution: Make sure `.env` file exists and contains `GROQ_API_KEY=your_key`

**Error: "Port 3000 already in use"**
- Solution: Change `API_PORT` in `.env` to another port (e.g., 3001)
- Update `API_SERVER_URL` accordingly

### Document Processing Fails

**Error: "PDF extraction failed"**
- Some PDFs with images/complex layouts may fail
- Try converting to plain text first

**Error: "Groq API error"**
- Check your API key is valid
- Verify you haven't exceeded rate limits
- Check Groq service status

### Connection Issues

**Bot can't reach API server**
- Verify API server is running: `curl http://localhost:3000/health`
- Check firewall settings on VPS
- Verify `API_SERVER_URL` in `.env` is correct

## Monitoring

### View API Logs

```bash
# If using PM2
pm2 logs rindell-api

# If using systemd
sudo journalctl -u rindell-api -f

# Direct run
# Logs appear in console
```

### Check API Health

```bash
curl http://localhost:3000/health
```

### Monitor Resource Usage

```bash
# If using PM2
pm2 monit

# Using system tools
top
htop
```

## Advanced Configuration

### Custom AI Prompts

Edit `api-server.js` to customize the AI prompt:

```javascript
const prompt = `Your custom instructions here...

Document: ${filename}
Content: ${truncatedText}`;
```

### Adjust Text Processing

Modify `CONFIG.MAX_TEXT_LENGTH` in `api-server.js`:

```javascript
const CONFIG = {
  MAX_TEXT_LENGTH: 50000, // Increase for larger documents
  // ...
};
```

### Add Authentication

Protect your API with a secret token:

```javascript
// In api-server.js, add middleware
app.use('/analyze', (req, res, next) => {
  const token = req.headers['x-api-token'];
  if (token !== process.env.API_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

Then add to `.env`:
```env
API_TOKEN=your_secret_token_here
```

And update bot's request in `index.js`:
```javascript
const response = await axios.post(CONFIG.WEBHOOK_URL, form, {
  headers: { 
    ...form.getHeaders(),
    'x-api-token': process.env.API_TOKEN
  },
  // ...
});
```

## Migration from Make.com

If you're currently using Make.com:

1. Keep Make.com setup active during testing
2. Set up self-hosted API server
3. Update `.env` with `API_SERVER_URL`
4. Test with a few documents
5. Once confirmed working, disable Make.com scenario

To switch back to Make.com temporarily:
```env
# Use Make.com
MAKE_WEBHOOK_URL=https://hook.eu2.make.com/your_webhook_id
# Comment out API_SERVER_URL or remove it
```

## Performance Tips

1. **Use SSD storage** on VPS for faster document processing
2. **Choose nearest VPS region** to reduce latency
3. **Use llama-3.1-8b-instant** model for faster responses
4. **Allocate sufficient RAM** (minimum 2GB recommended)
5. **Enable gzip compression** in nginx for better bandwidth usage

## Security Best Practices

1. ✅ Use HTTPS for production (not HTTP)
2. ✅ Keep `.env` file secure (never commit to git)
3. ✅ Use firewall to restrict API access
4. ✅ Add API authentication if exposing publicly
5. ✅ Regularly update dependencies: `npm update`
6. ✅ Monitor logs for suspicious activity
7. ✅ Rotate API keys periodically

## Support

For issues or questions:
- Check the logs first
- Verify configuration in `.env`
- Test API server independently
- Review this guide thoroughly

## Benefits of Self-Hosted Setup

✅ **Cost Savings** - No per-operation charges
✅ **Full Control** - Customize everything
✅ **Privacy** - Documents stay on your server
✅ **Fast Processing** - Groq is very fast
✅ **Scalability** - Handle high volumes
✅ **No Vendor Lock-in** - Own your infrastructure

---

**Congratulations!** 🎉 You're now running Rindell AI completely self-hosted without Make.com!
