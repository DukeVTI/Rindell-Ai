# 🚀 Quick Start Guide - Self-Hosted Rindell AI

## 🤔 First Time Here?

**Not sure what Rindell AI is or how it works?** Read [**HOW-IT-WORKS.md**](HOW-IT-WORKS.md) first for a complete, beginner-friendly explanation with diagrams!

---

## What You Need

1. **Groq API Key** (Free!)
   - Go to https://console.groq.com
   - Sign up and get your API key
   - It looks like: `gsk_...`

2. **Node.js installed** (v14 or higher)

## 5-Minute Setup

### Step 1: Get the Code
```bash
git clone https://github.com/DukeVTI/Rindell-Ai.git
cd Rindell-Ai
npm install
```

### Step 2: Configure
```bash
# Copy the example config
cp .env.example .env

# Edit .env and add your Groq API key
nano .env   # or use any text editor
```

In the `.env` file, set:
```env
GROQ_API_KEY=gsk_YOUR_ACTUAL_GROQ_API_KEY_HERE
```

### Step 3: Start Services

**Terminal 1 - API Server:**
```bash
npm run api
```

You should see:
```
✅ Server running on port 3000
🤖 Using Groq AI model: llama-3.1-70b-versatile
Ready to process documents! 📄
```

**Terminal 2 - WhatsApp Bot:**
```bash
npm start
```

Scan the QR code with WhatsApp.

### Step 4: Test It!

Send a PDF, Word, or text document to any WhatsApp contact.

The bot will:
1. ✅ Confirm receipt
2. ⏳ Process the document
3. 📊 Send you a summary
4. 🎉 Notify the sender

## Common Issues

### "GROQ_API_KEY environment variable is required"
- Make sure you created `.env` file
- Check that you added your API key
- Restart the API server

### "Port 3000 already in use"
- Change the port in `.env`:
  ```env
  API_PORT=3001
  API_SERVER_URL=http://localhost:3001/analyze
  ```

### Bot can't connect to API
- Make sure API server is running (Terminal 1)
- Check that URL in `.env` matches the port

## Production Deployment

### On Your VPS:

1. **Install dependencies:**
   ```bash
   npm install
   npm install -g pm2
   ```

2. **Start with PM2:**
   ```bash
   pm2 start api-server.js --name rindell-api
   pm2 start start.js --name rindell-bot
   pm2 save
   pm2 startup
   ```

3. **Monitor:**
   ```bash
   pm2 status
   pm2 logs
   ```

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run api` | Start API server |
| `npm start` | Start WhatsApp bot |
| `npm run test:api` | Test API server |
| `npm run api:dev` | API server with auto-reload |
| `npm run dev` | Bot with auto-reload |

## Cost Breakdown

- **VPS**: $3-10/month (if using remote server)
- **Groq API**: FREE for most usage
- **Total**: ~$5/month vs $29+ for Make.com

## Next Steps

✅ You're all set!

For more details:
- [SELF-HOSTED.md](SELF-HOSTED.md) - Complete guide
- [README.md](README.md) - Project overview
- [API.md](API.md) - API documentation

## Get Help

Having issues? Check:
1. API server is running (`npm run api`)
2. `.env` file has your Groq API key
3. WhatsApp bot is running (`npm start`)
4. You scanned the QR code

Still stuck? Open an issue on GitHub!

---

**Enjoy your cost-free document analysis!** 🎉
