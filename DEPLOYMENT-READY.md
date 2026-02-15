# 🚀 DEPLOYMENT READY - Quick Start Guide

> Your Rindell AI MVP is 100% complete and ready to deploy on your VPS!

## ⚡ Quick Deployment (5 Minutes)

Based on your Azure VPS setup with existing services, here's the fastest path to deployment:

### Prerequisites Check

```bash
# Check if you have these installed
node --version    # Need v16+
psql --version    # Need v12+
redis-cli --version  # Need v6+
pm2 --version     # If not: sudo npm install -g pm2
```

### Step 1: Update Code (1 minute)

```bash
cd ~/rindell/Rindell-Ai
git pull origin copilot/na

# Install dependencies (IMPORTANT!)
npm install

# Verify dependencies installed
ls node_modules | grep express
# Should show: express
```

### Step 2: Setup Database (1 minute)

```bash
# Create database
sudo -u postgres psql << EOF
CREATE DATABASE rindell;
CREATE USER rindell WITH PASSWORD 'YourSecurePassword123!';
GRANT ALL PRIVILEGES ON DATABASE rindell TO rindell;
EOF

# Initialize schema
npm run db:init
```

### Step 3: Configure Environment (2 minutes)

```bash
cp .env.example .env
nano .env
```

**Edit these required values:**

```bash
# Database
DB_PASSWORD=YourSecurePassword123!

# Groq AI (get from https://console.groq.com/keys)
GROQ_API_KEY=your_groq_api_key_here

# Security (generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your_random_64_character_hex_secret_here

# Ports (these work with your multi-service VPS)
API_PORT=3000
WEB_PORT=8080
```

Save and exit (Ctrl+X, Y, Enter)

### Step 4: Deploy with PM2 (1 minute)

```bash
# Run pre-flight check to verify everything is ready
npm run preflight

# Should show all ✅ checks passed
# If any errors, fix them before proceeding

# Start application
pm2 start ecosystem.config.js

# Save configuration
pm2 save

# Setup auto-start on boot
pm2 startup
# Run the command it outputs (will be something like: sudo env PATH=...)

# Open firewall ports
sudo ufw allow 3000/tcp
sudo ufw allow 8080/tcp
```

### Step 5: Verify Deployment (30 seconds)

```bash
# Check status
pm2 status

# Should show:
# ┌─────┬───────────────┬─────────┬──────┬────────┐
# │ id  │ name          │ status  │ cpu  │ memory │
# ├─────┼───────────────┼─────────┼──────┼────────┤
# │ 0   │ rindell-mvp   │ online  │ 0%   │ 50MB   │
# └─────┴───────────────┴─────────┴──────┴────────┘

# View logs
pm2 logs rindell-mvp --lines 20
```

### Step 6: Access Your Application

**Dashboard:** `http://YOUR-VPS-IP:8080/dashboard.html`  
**API:** `http://YOUR-VPS-IP:3000`

---

## 🆘 URGENT FIX: Already Started PM2 Without Dependencies?

**If you already ran `pm2 start` and got module errors, here's the fix:**

```bash
# 1. Stop the failed process
pm2 stop rindell-mvp

# 2. Navigate to project directory
cd ~/rindell/Rindell-Ai

# 3. Install dependencies (THIS IS THE KEY STEP!)
npm install

# 4. Run pre-flight check
npm run preflight

# 5. Restart with PM2
pm2 restart rindell-mvp

# 6. Verify it's working
pm2 logs rindell-mvp --lines 20
```

**Expected output after restart:**
```
╔════════════════════════════════════════════════════════╗
║         RINDELL MVP - INITIALIZING SERVER...          ║
╚════════════════════════════════════════════════════════╝

✅ Configuration validated
✅ Database connected successfully
✅ Queue service initialized
✅ WhatsApp sessions restored
✅ Server started on port 3000
```

If you see this, your application is running correctly! ✅

---

## 🎯 First Time Setup

### 1. Register Your Account

1. Open dashboard: `http://YOUR-VPS-IP:8080/dashboard.html`
2. Click "Register"
3. Fill in:
   - Full Name: Your name
   - Email: your@email.com
   - Phone: Your WhatsApp number (with country code, e.g., +1234567890)
   - Password: Choose a secure password
4. Click "Register"

### 2. Connect WhatsApp

1. Click "WhatsApp" tab
2. Click "Connect WhatsApp"
3. Scan QR code with WhatsApp mobile app:
   - Open WhatsApp on phone
   - Tap Menu (⋮) → Linked Devices
   - Tap "Link a Device"
   - Scan the QR code
4. Status should change to "Connected" ✅

### 3. Test Document Processing

1. Send a PDF document to your WhatsApp number (the one you connected)
2. System will:
   - Detect document ✓
   - Extract text ✓
   - Generate AI summary ✓
   - Send summary back via WhatsApp ✓
3. Check "Documents" tab to see processing history

---

## 📊 Management Commands

### PM2 Commands

```bash
# View status
pm2 status

# View logs (real-time)
pm2 logs rindell-mvp

# Restart application
pm2 restart rindell-mvp

# Stop application
pm2 stop rindell-mvp

# Start application
pm2 start rindell-mvp

# Monitor resources
pm2 monit
```

### Database Commands

```bash
# Connect to database
psql -U rindell -d rindell

# List tables
\dt

# View users
SELECT * FROM users;

# View documents
SELECT * FROM documents ORDER BY created_at DESC LIMIT 10;

# Exit
\q
```

### Check Services

```bash
# Check all services
pm2 status                          # Application
sudo systemctl status postgresql    # Database
sudo systemctl status redis-server  # Queue
```

---

## 🔍 Troubleshooting

### Application Won't Start

**Check logs:**
```bash
pm2 logs rindell-mvp --lines 50
```

**Common issues:**

#### 1. Missing Dependencies (Error: Cannot find module 'express')

**Symptom:** PM2 logs show `Error: Cannot find module 'express'` or similar module errors

**Cause:** Dependencies were not installed before starting the application

**Solution:**
```bash
cd ~/rindell/Rindell-Ai
npm install
pm2 restart rindell-mvp
pm2 logs rindell-mvp
```

**Prevention:** Always run `npm install` after pulling code updates!

#### 2. Missing Environment Variables

**Symptom:** Application crashes with config errors

**Solution:** Check `.env` file exists and has all required values:
```bash
cat .env | grep -E "DB_PASSWORD|GROQ_API_KEY|JWT_SECRET"
```

#### 3. Database Not Initialized

**Symptom:** Database connection errors or table not found errors

**Solution:**
```bash
npm run db:init
pm2 restart rindell-mvp
```

#### 4. Redis Not Running

**Symptom:** Queue connection errors

**Solution:**
```bash
sudo systemctl start redis-server
sudo systemctl enable redis-server
pm2 restart rindell-mvp
```

#### 5. Port Already in Use

**Symptom:** Error: listen EADDRINUSE :::3000

**Solution:** Change ports in `.env` file or stop conflicting service

### WhatsApp Won't Connect

**Solution:**
```bash
# Clear old sessions
rm -rf user-data/*/auth
pm2 restart rindell-mvp
# Try scanning QR again
```

### Can't Access Dashboard

**Check:**
1. Firewall allows port 8080: `sudo ufw status | grep 8080`
2. Application is running: `pm2 status`
3. Try from VPS itself: `curl http://localhost:8080/dashboard.html`

### Database Connection Failed

**Solution:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# If not running
sudo systemctl start postgresql

# Verify database exists
sudo -u postgres psql -l | grep rindell
```

---

## 🔄 Updating the Application

```bash
# Navigate to project
cd ~/rindell/Rindell-Ai

# Pull latest changes
git pull origin copilot/na

# Install new dependencies
npm install

# Restart application
pm2 restart rindell-mvp

# Verify
pm2 status
pm2 logs rindell-mvp
```

---

## 📈 Monitoring

### Check Processing Metrics

Visit: `http://YOUR-VPS-IP:3000/api/metrics/system`

Shows:
- Average processing time
- Total documents processed
- Detection accuracy
- Queue statistics
- Success metrics validation

### View Logs

```bash
# Application logs
pm2 logs rindell-mvp

# Database logs
sudo tail -f /var/log/postgresql/*.log

# Redis logs
sudo journalctl -u redis-server -f
```

---

## 🔒 Security Checklist

- [ ] Changed default database password
- [ ] Generated random JWT secret
- [ ] Configured firewall (UFW)
- [ ] Only necessary ports opened (22, 3000, 8080)
- [ ] Redis password set (optional but recommended)
- [ ] Regular system updates scheduled

---

## 📞 Support Resources

**Documentation:**
- `MVP-README.md` - Complete usage guide
- `MVP-STATUS.md` - Technical details
- `FINAL-MVP-SUMMARY.md` - Architecture overview
- `ecosystem.config.js` - PM2 configuration
- `.env.example` - Environment template

**Quick Links:**
- Groq API: https://console.groq.com/keys
- PM2 Documentation: https://pm2.keymetrics.io/
- PostgreSQL Docs: https://www.postgresql.org/docs/

---

## 🎉 You're All Set!

Your Rindell AI MVP is now:
- ✅ Running on your VPS
- ✅ Accessible via custom ports (3000, 8080)
- ✅ Working alongside your existing services
- ✅ Auto-restarting on crash
- ✅ Persisting data in PostgreSQL
- ✅ Processing documents via queue
- ✅ Ready for production use

**Next steps:**
1. Register your account
2. Connect WhatsApp
3. Send a test document
4. Monitor processing in dashboard
5. Enjoy automated document summarization! 🚀

---

**Questions?** Check the documentation files listed above or review PM2 logs for detailed information.
