# 🌐 Rindell AI - Web Platform Guide

## Overview

Rindell AI is now a **complete web-based SaaS platform**! Users can visit a beautiful landing page, personalize their account, and connect their WhatsApp - all through their browser. No terminal, no technical knowledge needed!

## 🎯 What Changed?

### Before (CLI-Based)
- Users needed to run commands in terminal
- One user per installation
- Technical setup required
- Each user needed their own Groq API key

### After (Web-Based SaaS)
- Users visit a web page
- Beautiful landing page with 3-step wizard
- Multiple users on one installation
- Owner provides the Groq API key (users don't need it!)
- QR code shown in browser (not terminal)

## 🚀 Quick Start (Platform Owner)

### Step 1: Setup

```bash
# Clone and install
git clone https://github.com/DukeVTI/Rindell-Ai.git
cd Rindell-Ai
npm install

# Configure
cp .env.example .env
nano .env
```

In `.env`, set your Groq API key:
```env
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
WEB_PORT=8080
API_PORT=3000
```

### Step 2: Start Platform

```bash
npm run platform
```

You'll see:
```
╔════════════════════════════════════════════════════════════╗
║            ✅ RINDELL AI PLATFORM IS READY!               ║
╚════════════════════════════════════════════════════════════╝

📱 Web Dashboard: http://localhost:8080
📡 API Server:    http://localhost:3000

👥 Users can now visit the web dashboard to connect!
🎉 No terminal needed - everything through the browser!
```

### Step 3: Share with Users

Give users your URL:
- **Local**: `http://localhost:8080`
- **VPS**: `http://your-server-ip:8080`
- **Domain**: `http://your-domain.com`

That's it! Users can now sign up on their own.

## 👤 User Experience

### For End Users

1. **Visit the Landing Page**
   - Beautiful gradient design
   - Three clear feature highlights
   - Simple 3-step process

2. **Step 1: Get Started**
   - Enter name (required)
   - Enter WhatsApp number (optional)
   - Click "Continue"
   - System generates unique user ID

3. **Step 2: Connect WhatsApp**
   - QR code appears in browser
   - Scan with WhatsApp app:
     - Open WhatsApp
     - Go to Settings → Linked Devices
     - Tap "Link a Device"
     - Scan the QR code
   - Connection happens automatically

4. **Step 3: Dashboard**
   - See statistics (documents processed)
   - View connection status
   - Instructions on how to use
   - Personal user ID displayed

### How to Use Once Connected

Simply send any document to **any WhatsApp contact**:
- PDF files
- Word documents (.docx, .doc)
- Excel spreadsheets (.xlsx)
- PowerPoint presentations (.pptx)
- Text files (.txt)

Rindell AI automatically:
1. Detects the document
2. Extracts the text
3. Analyzes with AI
4. Sends summary back via WhatsApp

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   User's Browser                        │
│              (Beautiful Landing Page)                    │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP Requests
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Web Dashboard Server                        │
│              (Port 8080)                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Session Management                             │   │
│  │  • Create user accounts                         │   │
│  │  • Generate unique IDs                          │   │
│  │  • Store user data                              │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  WhatsApp Manager                               │   │
│  │  • One connection per user                      │   │
│  │  • QR code generation (browser-based)           │   │
│  │  • Message routing                              │   │
│  │  • Status tracking                              │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                API Server                                │
│                (Port 3000)                               │
│  • Document text extraction                             │
│  • Groq AI integration (owner's key)                    │
│  • Summary generation                                   │
└─────────────────────────────────────────────────────────┘
```

## 📁 File Structure

```
Rindell-Ai/
├── platform.js          # All-in-one launcher (NEW!)
├── web-dashboard.js     # Web server for users (NEW!)
├── api-server.js        # Document processing API
├── public/
│   └── index.html       # Beautiful landing page (NEW!)
├── user-data/           # Multi-user storage (NEW!)
│   ├── user1_id/
│   │   ├── session.json
│   │   └── auth/        # WhatsApp credentials
│   ├── user2_id/
│   │   ├── session.json
│   │   └── auth/
│   └── ...
├── package.json
└── .env                 # Configuration
```

## 🎨 Features

### Landing Page
- ✅ **Beautiful Design**: Gradient background, modern UI
- ✅ **Responsive**: Works on desktop and mobile
- ✅ **Real-time Updates**: QR code and status updates automatically
- ✅ **3-Step Wizard**: Clear progress indicator
- ✅ **Feature Highlights**: Shows key benefits upfront

### Multi-User Support
- ✅ **Unlimited Users**: One platform, many users
- ✅ **Isolated Sessions**: Each user has separate WhatsApp connection
- ✅ **Persistent Storage**: User data saved to filesystem
- ✅ **Auto-reconnection**: WhatsApp reconnects automatically if disconnected

### Admin Features
- ✅ **User Management**: API endpoint to list all users
- ✅ **Health Check**: Monitor platform status
- ✅ **Statistics**: Track documents processed per user

## 🔧 API Endpoints

### User Management

**Create User Session**
```http
POST /api/session/create
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+1234567890"
}

Response:
{
  "success": true,
  "userId": "abc123...",
  "session": { ... }
}
```

**Get User Session**
```http
GET /api/session/:userId

Response:
{
  "id": "abc123...",
  "name": "John Doe",
  "phone": "+1234567890",
  "createdAt": "2026-02-14T...",
  "whatsappConnected": true,
  "documentsProcessed": 5
}
```

### WhatsApp Management

**Connect WhatsApp**
```http
POST /api/whatsapp/connect/:userId

Response:
{
  "success": true,
  "message": "WhatsApp connection initiated"
}
```

**Get QR Code**
```http
GET /api/whatsapp/qr/:userId

Response:
{
  "qrCode": "2@abc123...",
  "connected": false
}
```

**Get Connection Status**
```http
GET /api/whatsapp/status/:userId

Response:
{
  "connected": true,
  "documentsProcessed": 5
}
```

### Admin

**List All Users**
```http
GET /api/admin/users

Response:
{
  "users": [...],
  "total": 10
}
```

## 🚀 Deployment

### Local Development

```bash
npm run platform
```

Access at `http://localhost:8080`

### Production VPS

#### Using PM2

```bash
npm install -g pm2

# Start platform
pm2 start platform.js --name rindell-platform

# Save configuration
pm2 save
pm2 startup

# Monitor
pm2 monit
pm2 logs rindell-platform
```

#### Using systemd

Create `/etc/systemd/system/rindell-platform.service`:

```ini
[Unit]
Description=Rindell AI Platform
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/Rindell-Ai
ExecStart=/usr/bin/node platform.js
Restart=always
RestartSec=10
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable rindell-platform
sudo systemctl start rindell-platform
sudo systemctl status rindell-platform
```

### With Domain Name

Use nginx as reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Web Dashboard
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API Server
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        client_max_body_size 100M;
    }
}
```

Then users visit: `http://your-domain.com`

## 💡 Pro Tips

### For Platform Owners

1. **Single Groq API Key**: You only need one key for all users
2. **Monitor Usage**: Check `/api/admin/users` for statistics
3. **Backup user-data/**: Contains all user sessions and WhatsApp credentials
4. **Use HTTPS**: Add SSL certificate for production (Let's Encrypt)
5. **Rate Limiting**: Consider adding rate limiting for API endpoints

### For Users

1. **Keep User ID**: Save your user ID for future reference
2. **WhatsApp Stays Connected**: No need to rescan QR code after initial setup
3. **Works Anywhere**: Send documents in any WhatsApp chat
4. **All File Types**: Supports PDF, Word, Excel, PowerPoint, text

## 🔒 Security

### Owner Responsibilities

- ✅ Secure your Groq API key in `.env`
- ✅ Use HTTPS in production
- ✅ Regular backups of `user-data/`
- ✅ Monitor for abuse
- ✅ Consider authentication for admin endpoints

### User Privacy

- ✅ Each user has isolated WhatsApp connection
- ✅ Documents are not stored permanently
- ✅ User data stored locally on your server
- ✅ No data sent to third parties (except Groq for AI)

## 🎯 Next Steps

1. **Start the platform**: `npm run platform`
2. **Test locally**: Visit `http://localhost:8080`
3. **Create your account** and scan QR code
4. **Send a test document** via WhatsApp
5. **Deploy to VPS** for public access
6. **Share the URL** with users

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:8080/health
```

Response:
```json
{
  "status": "healthy",
  "service": "Rindell AI Web Dashboard",
  "users": 10,
  "connections": 8
}
```

### API Server Health

```bash
curl http://localhost:3000/health
```

### View Logs

```bash
# If using PM2
pm2 logs rindell-platform

# If using systemd
sudo journalctl -u rindell-platform -f
```

## 🐛 Troubleshooting

### Platform won't start

**Error**: "GROQ_API_KEY environment variable is required"
- Solution: Add your Groq API key to `.env`

### QR code doesn't appear

- Check web dashboard is running: `http://localhost:8080`
- Check browser console for errors
- Refresh the page

### WhatsApp won't connect

- Make sure you're scanning with WhatsApp (not another app)
- Try deleting `user-data/{userId}/auth` and rescanning
- Check internet connection

### Can't access from other devices

- Open firewall port: `sudo ufw allow 8080`
- Use your server's IP address: `http://192.168.1.100:8080`
- Consider using nginx with domain name

## 🎉 Success!

You now have a complete web-based SaaS platform for WhatsApp document analysis!

Users can:
- ✅ Visit a beautiful landing page
- ✅ Create their account in seconds
- ✅ Scan QR code in browser (no terminal!)
- ✅ Start using immediately
- ✅ No technical knowledge needed
- ✅ No API keys required

As the owner, you:
- ✅ Provide one Groq API key for everyone
- ✅ Host on your VPS or cloud
- ✅ Support unlimited users
- ✅ Have full control and visibility

---

**Ready to launch your platform!** 🚀
