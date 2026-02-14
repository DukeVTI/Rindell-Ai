# 🚀 Rindell AI - Production VPS Deployment Guide

> Complete step-by-step guide to deploy Rindell AI on a VPS for production use

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Application Installation](#application-installation)
4. [Domain & DNS Configuration](#domain--dns-configuration)
5. [NGINX Web Server Setup](#nginx-web-server-setup)
6. [SSL Certificate (HTTPS)](#ssl-certificate-https)
7. [Process Management with PM2](#process-management-with-pm2)
8. [Security Hardening](#security-hardening)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### What You Need

✅ **VPS Server**
- Ubuntu 20.04 LTS or 22.04 LTS (recommended)
- Minimum: 1GB RAM, 1 CPU, 10GB disk
- Recommended: 2GB RAM, 2 CPU, 20GB disk
- Root or sudo access

✅ **Domain Name** (optional but recommended)
- Example: `rindell-ai.yourdomain.com`
- DNS access to configure A records

✅ **API Keys**
- Groq API key from [console.groq.com](https://console.groq.com)

✅ **Local Machine**
- SSH client (Terminal on Mac/Linux, PuTTY on Windows)
- Basic command line knowledge

### Recommended VPS Providers

| Provider | Starting Price | Notes |
|----------|---------------|-------|
| **DigitalOcean** | $6/month | Easy to use, great docs |
| **Linode** | $5/month | Reliable, good support |
| **Vultr** | $5/month | Fast, global locations |
| **Hetzner** | €4/month | Best value in Europe |
| **AWS Lightsail** | $5/month | Good for AWS users |

---

## Server Setup

### Step 1: Connect to Your VPS

```bash
# SSH into your server (replace with your server IP)
ssh root@your-server-ip

# Or if you have a user account
ssh username@your-server-ip
```

### Step 2: Update System

```bash
# Update package lists
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential
```

### Step 3: Create Application User

For security, run the application as a non-root user:

```bash
# Create user
sudo adduser rindell-ai

# Add to sudo group (if needed for management)
sudo usermod -aG sudo rindell-ai

# Switch to the new user
su - rindell-ai
```

### Step 4: Install Node.js

```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

---

## Application Installation

### Step 1: Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone the repository
git clone https://github.com/DukeVTI/Rindell-Ai.git

# Enter directory
cd Rindell-Ai
```

### Step 2: Install Dependencies

```bash
# Install all required packages
npm install

# This will install:
# - WhatsApp (Baileys) integration
# - Express web server
# - Document processing libraries
# - And all other dependencies
```

### Step 3: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit the configuration
nano .env
```

**Configure the following in `.env`:**

```env
# ═══════════════════════════════════════════════════════════
# GROQ AI CONFIGURATION (REQUIRED)
# ═══════════════════════════════════════════════════════════
GROQ_API_KEY=gsk_your_actual_groq_api_key_here

# ═══════════════════════════════════════════════════════════
# SERVER PORTS
# ═══════════════════════════════════════════════════════════
API_PORT=3000          # Internal API server port
WEB_PORT=8080          # Internal web dashboard port

# ═══════════════════════════════════════════════════════════
# API CONFIGURATION
# ═══════════════════════════════════════════════════════════
API_SERVER_URL=http://localhost:3000/analyze

# ═══════════════════════════════════════════════════════════
# OPTIONAL: ASSISTANT CONFIGURATION
# ═══════════════════════════════════════════════════════════
# If using CLI mode, set your admin WhatsApp number
# ASSISTANT_NUMBER=1234567890@c.us
```

**Save and exit:**
- Press `Ctrl+X`
- Press `Y` to confirm
- Press `Enter` to save

### Step 4: Test Installation

```bash
# Test if application starts correctly
npm run platform

# You should see:
# ✅ API Server running on port 3000
# ✅ Web Dashboard running on port 8080

# Press Ctrl+C to stop after confirming it works
```

---

## Domain & DNS Configuration

### Step 1: Point Domain to Server

Log into your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):

1. Go to DNS settings
2. Add an **A Record**:
   - **Name/Host**: `@` (for root domain) or `rindell` (for subdomain)
   - **Value/Points to**: Your VPS IP address
   - **TTL**: 3600 (or automatic)

**Example:**
```
Type: A
Name: rindell-ai
Value: 123.45.67.89
TTL: 3600
```

3. Save and wait 5-60 minutes for DNS propagation

### Step 2: Verify DNS

```bash
# Check if domain resolves to your server
ping rindell-ai.yourdomain.com

# Should show your server IP
```

---

## NGINX Web Server Setup

NGINX will act as a reverse proxy, forwarding public traffic to your Node.js application.

### Step 1: Install NGINX

```bash
# Install NGINX
sudo apt install -y nginx

# Start and enable NGINX
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### Step 2: Configure Firewall

```bash
# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow NGINX
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Step 3: Create NGINX Configuration

```bash
# Create configuration file
sudo nano /etc/nginx/sites-available/rindell-ai
```

**Add this configuration:**

```nginx
# Rindell AI - NGINX Configuration
server {
    listen 80;
    server_name rindell-ai.yourdomain.com;  # Replace with your domain

    # Increase buffer sizes for large documents
    client_max_body_size 50M;
    client_body_buffer_size 10M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Web Dashboard (port 8080)
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for long-running requests
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # API Server (port 3000)
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Longer timeouts for document processing
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Static files and uploads (optional)
    location /uploads/ {
        alias /home/rindell-ai/Rindell-Ai/uploads/;
        access_log off;
    }

    # Logs
    access_log /var/log/nginx/rindell-ai.access.log;
    error_log /var/log/nginx/rindell-ai.error.log;
}
```

**Save and exit** (`Ctrl+X`, `Y`, `Enter`)

### Step 4: Enable Configuration

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/rindell-ai /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test NGINX configuration
sudo nginx -t

# Should show: "syntax is ok" and "test is successful"

# Reload NGINX
sudo systemctl reload nginx
```

---

## SSL Certificate (HTTPS)

Use Let's Encrypt for free SSL certificates.

### Step 1: Install Certbot

```bash
# Install Certbot and NGINX plugin
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Obtain Certificate

```bash
# Get certificate (replace with your domain)
sudo certbot --nginx -d rindell-ai.yourdomain.com

# Follow the prompts:
# 1. Enter your email address
# 2. Agree to Terms of Service
# 3. Choose whether to share email (optional)
# 4. Select option 2: Redirect HTTP to HTTPS (recommended)
```

### Step 3: Verify Auto-Renewal

```bash
# Test renewal process
sudo certbot renew --dry-run

# Should show: "Congratulations, all simulated renewals succeeded"

# Certbot will automatically renew certificates before expiry
```

### Step 4: Test HTTPS

Visit your domain in a browser:
```
https://rindell-ai.yourdomain.com
```

You should see:
- 🔒 Secure padlock in browser
- Your Rindell AI landing page
- No certificate warnings

---

## Process Management with PM2

PM2 keeps your application running 24/7, automatically restarts on crashes, and restarts on server reboot.

### Step 1: Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### Step 2: Start Application with PM2

```bash
# Navigate to application directory
cd ~/Rindell-Ai

# Start the platform with PM2
pm2 start platform.js --name rindell-ai-platform

# Or start services separately:
# pm2 start api-server.js --name rindell-api
# pm2 start web-dashboard.js --name rindell-web
```

### Step 3: Configure PM2

```bash
# Save current PM2 process list
pm2 save

# Generate startup script (auto-start on server reboot)
pm2 startup

# Copy and run the command shown in the output
# It will look something like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u rindell-ai --hp /home/rindell-ai
```

### Step 4: PM2 Commands Reference

```bash
# View running processes
pm2 list

# View logs (real-time)
pm2 logs rindell-ai-platform

# View logs for specific service
pm2 logs rindell-api
pm2 logs rindell-web

# Monitor resources
pm2 monit

# Restart application
pm2 restart rindell-ai-platform

# Stop application
pm2 stop rindell-ai-platform

# Delete from PM2
pm2 delete rindell-ai-platform

# View detailed info
pm2 show rindell-ai-platform
```

---

## Security Hardening

### Step 1: Update Regularly

```bash
# Create update script
cat > ~/update-system.sh << 'EOF'
#!/bin/bash
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
EOF

chmod +x ~/update-system.sh

# Run weekly
sudo crontab -e
# Add: 0 3 * * 0 /home/rindell-ai/update-system.sh
```

### Step 2: Configure Firewall

```bash
# Check current rules
sudo ufw status verbose

# Should show:
# - 22/tcp (SSH) - ALLOW
# - 80/tcp (HTTP) - ALLOW
# - 443/tcp (HTTPS) - ALLOW
# - Deny all other incoming
```

### Step 3: Secure SSH

```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Recommended changes:
# PermitRootLogin no
# PasswordAuthentication no  # After setting up SSH keys
# Port 2222                  # Optional: change default port

# Restart SSH
sudo systemctl restart ssh
```

### Step 4: Install Fail2Ban

```bash
# Install Fail2Ban (protects against brute force)
sudo apt install -y fail2ban

# Start and enable
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
```

### Step 5: Secure .env File

```bash
# Restrict access to environment file
chmod 600 ~/Rindell-Ai/.env

# Verify
ls -la ~/Rindell-Ai/.env
# Should show: -rw------- (only owner can read/write)
```

---

## Monitoring & Maintenance

### Daily Monitoring

```bash
# Check PM2 status
pm2 status

# Check logs for errors
pm2 logs --lines 50

# Check system resources
htop  # or: top

# Check disk space
df -h

# Check memory usage
free -h
```

### Log Management

```bash
# View NGINX access logs
sudo tail -f /var/log/nginx/rindell-ai.access.log

# View NGINX error logs
sudo tail -f /var/log/nginx/rindell-ai.error.log

# View application logs
pm2 logs rindell-ai-platform

# Rotate PM2 logs (prevents large log files)
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 10
```

### Backup Strategy

```bash
# Create backup script
cat > ~/backup-rindell.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p $BACKUP_DIR

# Backup user data and configuration
tar -czf $BACKUP_DIR/rindell-backup-$DATE.tar.gz \
  ~/Rindell-Ai/.env \
  ~/Rindell-Ai/user-data \
  ~/Rindell-Ai/uploads

# Keep only last 7 backups
ls -t $BACKUP_DIR/rindell-backup-*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup completed: rindell-backup-$DATE.tar.gz"
EOF

chmod +x ~/backup-rindell.sh

# Run daily at 2 AM
crontab -e
# Add: 0 2 * * * /home/rindell-ai/backup-rindell.sh
```

### Update Application

```bash
# Navigate to application directory
cd ~/Rindell-Ai

# Pull latest changes
git pull origin main

# Install new dependencies (if any)
npm install

# Restart with PM2
pm2 restart rindell-ai-platform

# Check logs to ensure restart was successful
pm2 logs rindell-ai-platform --lines 20
```

---

## Troubleshooting

### Issue: Application Won't Start

**Check logs:**
```bash
pm2 logs rindell-ai-platform --lines 100
```

**Common causes:**
1. **Missing Groq API key**
   ```bash
   grep GROQ_API_KEY ~/Rindell-Ai/.env
   # Should show your API key
   ```

2. **Port already in use**
   ```bash
   sudo lsof -i :3000  # Check API port
   sudo lsof -i :8080  # Check web port
   ```

3. **Missing dependencies**
   ```bash
   cd ~/Rindell-Ai
   npm install
   ```

### Issue: Can't Access Website

**Check NGINX:**
```bash
# Check if NGINX is running
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/rindell-ai.error.log
```

**Check DNS:**
```bash
# Verify domain points to server
ping rindell-ai.yourdomain.com
```

**Check firewall:**
```bash
sudo ufw status
# Should show ports 80 and 443 as ALLOWED
```

### Issue: SSL Certificate Problems

**Renew certificate manually:**
```bash
sudo certbot renew --force-renewal
```

**Check certificate status:**
```bash
sudo certbot certificates
```

### Issue: High Memory Usage

**Check PM2 processes:**
```bash
pm2 status
pm2 monit
```

**Restart application:**
```bash
pm2 restart rindell-ai-platform
```

**Increase swap (if needed):**
```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Issue: WhatsApp Connection Problems

**Clear WhatsApp session:**
```bash
cd ~/Rindell-Ai
rm -rf user-data/*/auth
rm -rf auth
```

**Restart application:**
```bash
pm2 restart rindell-ai-platform
```

**Check API logs:**
```bash
pm2 logs rindell-api --lines 100
```

### Issue: Slow Document Processing

**Check Groq API status:**
- Visit: https://status.groq.com

**Increase server resources:**
- Upgrade VPS to more RAM/CPU

**Check API timeout settings:**
```bash
grep timeout ~/Rindell-Ai/api-server.js
```

---

## Performance Optimization

### Enable GZIP Compression

```bash
sudo nano /etc/nginx/nginx.conf
```

Add inside `http` block:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
```

### Enable Caching

Add to NGINX site config:
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### Monitor with Uptime Monitoring

Consider using:
- **UptimeRobot** (free) - https://uptimerobot.com
- **Pingdom** - https://www.pingdom.com
- **StatusCake** - https://www.statuscake.com

---

## Quick Reference

### Essential Commands

| Task | Command |
|------|---------|
| Start platform | `pm2 start platform.js --name rindell-ai-platform` |
| Stop platform | `pm2 stop rindell-ai-platform` |
| Restart platform | `pm2 restart rindell-ai-platform` |
| View logs | `pm2 logs rindell-ai-platform` |
| Monitor resources | `pm2 monit` |
| Reload NGINX | `sudo systemctl reload nginx` |
| Test NGINX config | `sudo nginx -t` |
| Renew SSL | `sudo certbot renew` |
| Check firewall | `sudo ufw status` |

### Important File Locations

| File | Location |
|------|----------|
| Application | `/home/rindell-ai/Rindell-Ai/` |
| Environment config | `/home/rindell-ai/Rindell-Ai/.env` |
| User data | `/home/rindell-ai/Rindell-Ai/user-data/` |
| NGINX config | `/etc/nginx/sites-available/rindell-ai` |
| NGINX logs | `/var/log/nginx/rindell-ai.*.log` |
| SSL certificates | `/etc/letsencrypt/live/your-domain/` |

---

## Post-Deployment Checklist

- [ ] Server configured with latest updates
- [ ] Node.js installed (v18.x)
- [ ] Application cloned and dependencies installed
- [ ] `.env` file configured with Groq API key
- [ ] Domain DNS points to server IP
- [ ] NGINX installed and configured
- [ ] SSL certificate installed (HTTPS working)
- [ ] PM2 managing application processes
- [ ] PM2 configured to start on reboot
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] Fail2Ban installed
- [ ] Backup script created and scheduled
- [ ] Log rotation configured
- [ ] Monitoring service configured
- [ ] Application tested and accessible via domain
- [ ] WhatsApp connection tested
- [ ] Document processing tested

---

## Need Help?

### Support Resources

- **Documentation**: Check README.md and other guides
- **GitHub Issues**: https://github.com/DukeVTI/Rindell-Ai/issues
- **Groq Support**: https://console.groq.com/docs

### Common Questions

**Q: How much does it cost to run?**
A: VPS ($5-20/month) + Groq API (mostly free) = ~$5-25/month total

**Q: Can I use a different domain?**
A: Yes! Just update the `server_name` in NGINX config and get a new SSL certificate

**Q: How many users can it handle?**
A: With 2GB RAM VPS: 50-100 concurrent users. Scale up as needed.

**Q: Can I use Docker?**
A: Yes! Docker support can be added. Create an issue if you need this.

---

## Success! 🎉

Your Rindell AI platform is now running in production!

**Next Steps:**
1. Share your platform URL with users
2. Monitor logs for first few days
3. Set up backups and monitoring
4. Consider adding custom domain email
5. Plan for scaling if needed

**Your platform is accessible at:**
```
https://rindell-ai.yourdomain.com
```

Enjoy your production Rindell AI platform! 🚀
