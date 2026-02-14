# 🚀 Rindell AI - Port-Based VPS Deployment Guide

> Deploy Rindell AI on a VPS with other services using custom ports and IP-based access

## 📋 Overview

This guide is for deploying Rindell AI when:
- ✅ Your VPS already has other services running
- ✅ You want to use specific ports for Rindell AI
- ✅ You'll access via IP address (no domain needed initially)
- ✅ You need to avoid port conflicts with existing services

**See [VPS-DEPLOYMENT.md](VPS-DEPLOYMENT.md) for domain-based deployment with SSL.**

---

## 🎯 Deployment Options

Choose the option that best fits your needs:

### Option 1: Direct Port Access (Simplest) ⭐ Recommended for Quick Start

**Access:** `http://YOUR-VPS-IP:5000`

- App runs directly on custom ports
- No NGINX configuration needed
- Fastest to set up
- Perfect for testing or single-user

### Option 2: NGINX Proxy with Custom Port

**Access:** `http://YOUR-VPS-IP:9000`

- NGINX on custom port proxies to app
- Better performance and security
- Professional setup
- Can add SSL later

### Option 3: Path-Based Routing (If Port 80/443 Available)

**Access:** `http://YOUR-VPS-IP/rindell`

- Share standard web ports with other services
- Works alongside other apps on port 80/443
- Most professional appearance
- Easy to add domain later

---

## 🔧 Option 1: Direct Port Access (Quick Start)

### Step 1: Choose Your Ports

Pick ports that aren't in use on your VPS:

```bash
# Check which ports are in use
sudo netstat -tlnp | grep LISTEN

# Or using ss command
sudo ss -tlnp | grep LISTEN
```

**Suggested ports for Rindell AI:**
- Web Dashboard: `5000` (or any available port like 5100, 8081, etc.)
- API Server: `5001` (or any available port like 5101, 8082, etc.)

### Step 2: Install Application

```bash
# Connect to your VPS
ssh username@YOUR-VPS-IP

# Navigate to desired directory
cd ~

# Clone repository
git clone https://github.com/DukeVTI/Rindell-Ai.git
cd Rindell-Ai

# Install dependencies
npm install
```

### Step 3: Configure Ports

```bash
# Copy environment file
cp .env.example .env

# Edit configuration
nano .env
```

**Update these settings:**

```env
# Set your custom ports
API_PORT=5001          # Choose your API port
WEB_PORT=5000          # Choose your web port

# Update API URL to match your setup
API_SERVER_URL=http://localhost:5001/analyze

# Add your Groq API key
GROQ_API_KEY=your_groq_api_key_here
```

Save and exit (`Ctrl+X`, `Y`, `Enter`)

### Step 4: Configure Firewall

```bash
# Allow your custom ports
sudo ufw allow 5000/tcp comment 'Rindell Web Dashboard'
sudo ufw allow 5001/tcp comment 'Rindell API Server'

# Allow SSH (if not already allowed)
sudo ufw allow 22/tcp

# Enable firewall (if not already enabled)
sudo ufw enable

# Check firewall status
sudo ufw status
```

### Step 5: Install PM2 and Start Application

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the application
pm2 start platform.js --name rindell-ai

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Copy and run the command shown

# Check status
pm2 status
pm2 logs rindell-ai
```

### Step 6: Test Access

Open your browser and visit:
```
http://YOUR-VPS-IP:5000
```

**Example:**
```
http://123.45.67.89:5000
```

You should see the Rindell AI landing page!

### Step 7: Test API Server

```bash
# Test API endpoint
curl http://YOUR-VPS-IP:5001/health

# Or from another machine
curl http://123.45.67.89:5001/health
```

---

## 🔧 Option 2: NGINX Proxy with Custom Port

Use this when you want NGINX benefits (caching, security) but on a custom port.

### Step 1: Install Application

Follow Steps 1-3 from Option 1 above, but use **internal ports** that won't be exposed:

```env
API_PORT=3000          # Internal port (not exposed)
WEB_PORT=8080          # Internal port (not exposed)
API_SERVER_URL=http://localhost:3000/analyze
GROQ_API_KEY=your_groq_api_key_here
```

### Step 2: Install NGINX

```bash
# Install NGINX
sudo apt install -y nginx

# Start NGINX
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 3: Choose Public Port for NGINX

Pick a port for public access (e.g., `9000`, `5000`, `8090`, etc.)

```bash
# Check port availability
sudo netstat -tlnp | grep :9000

# If nothing returns, port 9000 is available
```

### Step 4: Create NGINX Configuration

```bash
# Create config file
sudo nano /etc/nginx/sites-available/rindell-ai-ports
```

**Add this configuration (replace `9000` with your chosen port):**

```nginx
# Rindell AI - Port-Based Configuration
server {
    listen 9000;  # Your chosen public port
    server_name YOUR-VPS-IP;  # Replace with your actual IP

    # Increase buffer sizes for large documents
    client_max_body_size 50M;
    client_body_buffer_size 10M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Web Dashboard (proxied from internal port 8080)
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

    # API Server (proxied from internal port 3000)
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

    # Logs
    access_log /var/log/nginx/rindell-ai-ports.access.log;
    error_log /var/log/nginx/rindell-ai-ports.error.log;
}
```

Save and exit (`Ctrl+X`, `Y`, `Enter`)

### Step 5: Enable Configuration

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/rindell-ai-ports /etc/nginx/sites-enabled/

# Test NGINX configuration
sudo nginx -t

# If test passes, reload NGINX
sudo systemctl reload nginx
```

### Step 6: Configure Firewall

```bash
# Allow your NGINX port
sudo ufw allow 9000/tcp comment 'Rindell AI via NGINX'

# Check firewall status
sudo ufw status
```

### Step 7: Start Application with PM2

```bash
cd ~/Rindell-Ai

# Start application
pm2 start platform.js --name rindell-ai
pm2 save
pm2 startup
```

### Step 8: Test Access

Visit in browser:
```
http://YOUR-VPS-IP:9000
```

Example: `http://123.45.67.89:9000`

---

## 🔧 Option 3: Path-Based Routing

Use this when port 80 or 443 is available and you want to share it with other services.

### Step 1: Install Application

Follow Steps 1-3 from Option 1, using internal ports:

```env
API_PORT=3000
WEB_PORT=8080
API_SERVER_URL=http://localhost:3000/analyze
GROQ_API_KEY=your_groq_api_key_here
```

### Step 2: Configure NGINX for Path-Based Access

```bash
# Edit main NGINX config or your existing site config
sudo nano /etc/nginx/sites-available/default
```

**Add this location block to your existing server configuration:**

```nginx
# Inside your existing server { } block

# Rindell AI on /rindell path
location /rindell/ {
    proxy_pass http://localhost:8080/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # Timeouts
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    
    # Increase buffer sizes
    client_max_body_size 50M;
}

# Rindell AI API on /rindell-api path
location /rindell-api/ {
    proxy_pass http://localhost:3000/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Longer timeouts for document processing
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
}
```

### Step 3: Update Application Configuration

Since the app will be accessed via `/rindell` path, you may need to update the API URL in web-dashboard.js if it uses absolute paths.

```bash
# Test NGINX configuration
sudo nginx -t

# Reload NGINX
sudo systemctl reload nginx
```

### Step 4: Start Application

```bash
cd ~/Rindell-Ai
pm2 start platform.js --name rindell-ai
pm2 save
```

### Step 5: Test Access

Visit:
```
http://YOUR-VPS-IP/rindell
```

Example: `http://123.45.67.89/rindell`

---

## 🔍 Port Selection Guide

### How to Choose Ports

**Avoid these common ports (likely in use):**
- `80` - HTTP (usually taken by web server)
- `443` - HTTPS (usually taken by web server)
- `22` - SSH (system access)
- `3306` - MySQL
- `5432` - PostgreSQL
- `6379` - Redis
- `27017` - MongoDB

**Good port ranges to use:**
- `5000-5999` - User-space applications
- `8000-8999` - Alternative HTTP servers
- `9000-9999` - Application servers

### Check Port Availability

```bash
# Method 1: Using netstat
sudo netstat -tlnp | grep :5000

# Method 2: Using ss (faster)
sudo ss -tlnp | grep :5000

# Method 3: Using lsof
sudo lsof -i :5000

# Method 4: Try to bind to the port
nc -l 5000
# If it starts listening, the port is free (Ctrl+C to exit)
```

### Recommended Port Combinations

**Option A: 5000 series**
- Web: `5000`
- API: `5001`

**Option B: 8000 series**
- Web: `8090`
- API: `8091`

**Option C: 9000 series**
- NGINX: `9000` (proxying to internal ports 8080 and 3000)

---

## 🛡️ Security Considerations

### Firewall Rules

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp          # SSH
sudo ufw allow 5000/tcp        # Your web port
sudo ufw allow 5001/tcp        # Your API port

# Deny all other incoming by default
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status numbered
```

### Rate Limiting with NGINX (Option 2/3)

Add to your NGINX config:

```nginx
# Add to http block in /etc/nginx/nginx.conf
limit_req_zone $binary_remote_addr zone=rindell:10m rate=10r/s;

# Add to location blocks in your site config
location / {
    limit_req zone=rindell burst=20 nodelay;
    # ... rest of config
}
```

### Access Control by IP (Optional)

If you only want specific IPs to access:

```nginx
# In your NGINX location block
location / {
    allow 1.2.3.4;      # Your office IP
    allow 5.6.7.8;      # Your home IP
    deny all;
    
    proxy_pass http://localhost:8080;
    # ... rest of config
}
```

---

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Find what's using the port
sudo lsof -i :5000

# Or
sudo netstat -tlnp | grep :5000

# Kill the process if needed (use PID from above)
sudo kill <PID>

# Or choose a different port
```

### Can't Access from Browser

**1. Check if app is running:**
```bash
pm2 status
pm2 logs rindell-ai
```

**2. Check if port is listening:**
```bash
sudo netstat -tlnp | grep :5000
# Should show node process listening
```

**3. Check firewall:**
```bash
sudo ufw status
# Verify your port is allowed
```

**4. Test locally on VPS:**
```bash
curl http://localhost:5000
# Should return HTML
```

**5. Test from external:**
```bash
# From your local machine
curl http://YOUR-VPS-IP:5000
```

**6. Check VPS provider firewall:**
- DigitalOcean, AWS, etc. have their own firewalls
- Ensure port is allowed in provider's security group/firewall

### NGINX Issues

**Test configuration:**
```bash
sudo nginx -t
```

**Check NGINX logs:**
```bash
sudo tail -f /var/log/nginx/rindell-ai-ports.error.log
sudo tail -f /var/log/nginx/rindell-ai-ports.access.log
```

**Restart NGINX:**
```bash
sudo systemctl restart nginx
sudo systemctl status nginx
```

### Application Errors

**View logs:**
```bash
pm2 logs rindell-ai --lines 100
```

**Restart app:**
```bash
pm2 restart rindell-ai
```

**Check environment variables:**
```bash
cd ~/Rindell-Ai
cat .env
# Verify all settings are correct
```

### WhatsApp Connection Issues

**Symptom: Infinite reconnection loop in logs**
```
[WEB] 🔄 Reconnecting WhatsApp for user: UserName
[WEB] 🔄 Reconnecting WhatsApp for user: UserName
...
```

**Solution:**
The system now has built-in protection against infinite loops (added in v1.1):
- Max 10 reconnection attempts
- Exponential backoff delays
- Automatic cleanup of old connections

If you see this:
1. **Wait for system to stop** (after 10 attempts, ~5 minutes)
2. **Check logs for the reason:**
   ```bash
   pm2 logs rindell-ai --lines 50
   ```
3. **Common causes:**
   - WhatsApp servers temporarily unavailable
   - Network connectivity issues
   - Authentication credentials corrupted

**Recovery steps:**
```bash
# 1. Stop the application
pm2 stop rindell-ai

# 2. Clear the user's WhatsApp authentication
rm -rf ~/Rindell-Ai/user-data/USER_ID/auth

# 3. Restart the application
pm2 start rindell-ai

# 4. User should refresh the page and scan QR code again
```

**Symptom: Page stuck on QR code screen**

**Solution:**
1. Check if max reconnection attempts reached:
   ```bash
   pm2 logs rindell-ai | grep "Max reconnection"
   ```
2. If yes, the page will show "Connection Failed" message
3. User should refresh the page to restart connection
4. If issue persists, follow recovery steps above

**Prevent issues:**
- Ensure stable internet connection on VPS
- Don't scan QR code with multiple devices
- Wait for full connection before closing WhatsApp
- Keep WhatsApp app updated on your phone

---

## 📝 Quick Reference

### Starting the Application

```bash
# Start
pm2 start platform.js --name rindell-ai

# Stop
pm2 stop rindell-ai

# Restart
pm2 restart rindell-ai

# View logs
pm2 logs rindell-ai

# View status
pm2 status
```

### Checking Services

```bash
# Check if app is running
pm2 status

# Check ports in use
sudo netstat -tlnp

# Check firewall
sudo ufw status

# Check NGINX (if using)
sudo systemctl status nginx
sudo nginx -t
```

### Updating Configuration

```bash
cd ~/Rindell-Ai

# Edit environment
nano .env

# Restart app to apply changes
pm2 restart rindell-ai
```

---

## 🚀 Next Steps

### After Setup Works

1. **Add Monitoring:**
   ```bash
   pm2 install pm2-logrotate
   ```

2. **Set up Backups:**
   ```bash
   # Backup user data
   tar -czf backup-$(date +%Y%m%d).tar.gz ~/Rindell-Ai/user-data
   ```

3. **Add Domain (Optional):**
   - Point domain to your VPS
   - Update NGINX config with domain name
   - Add SSL certificate (Let's Encrypt)
   - See [VPS-DEPLOYMENT.md](VPS-DEPLOYMENT.md) for SSL setup

4. **Monitor Resources:**
   ```bash
   pm2 monit
   htop
   ```

---

## 📊 Example Scenarios

### Scenario 1: VPS with Web Server on Port 80

**Current Setup:**
- Port 80: Apache/NGINX serving website
- Port 443: HTTPS for website
- Port 3306: MySQL

**Rindell AI Setup:**
- Use Option 1 (Direct Port Access)
- Web Dashboard: Port 5000
- API Server: Port 5001
- Access: `http://YOUR-IP:5000`

### Scenario 2: VPS with Multiple Node Apps

**Current Setup:**
- Port 80: NGINX
- Port 3000: Another Node.js app
- Port 4000: Yet another Node.js app

**Rindell AI Setup:**
- Use Option 2 (NGINX with Custom Port)
- Internal Ports: 8080, 8081
- NGINX Port: 9000
- Access: `http://YOUR-IP:9000`

### Scenario 3: Shared VPS with Path-Based Apps

**Current Setup:**
- Port 80: NGINX serving multiple apps
- `/app1` - First application
- `/app2` - Second application

**Rindell AI Setup:**
- Use Option 3 (Path-Based)
- Add `/rindell` path
- Access: `http://YOUR-IP/rindell`

---

## ✅ Deployment Checklist

- [ ] Chose deployment option (1, 2, or 3)
- [ ] Checked port availability
- [ ] Cloned repository
- [ ] Installed dependencies (`npm install`)
- [ ] Configured `.env` file with ports
- [ ] Added Groq API key
- [ ] Configured firewall rules
- [ ] Installed PM2
- [ ] Started application with PM2
- [ ] Saved PM2 configuration
- [ ] Set up PM2 startup script
- [ ] Tested access from browser
- [ ] Checked application logs
- [ ] (If using NGINX) Configured and tested NGINX
- [ ] Documented your port numbers
- [ ] Tested document upload and processing

---

## 💡 Tips

1. **Document Your Ports:** Keep a list of which ports you're using for what service

2. **Use Environment Variables:** Never hardcode ports in your application code

3. **Test Locally First:** Test port changes locally before deploying

4. **Monitor Logs:** Always check logs when troubleshooting: `pm2 logs rindell-ai`

5. **Incremental Changes:** Change one thing at a time, test, then move to the next

6. **Backup Before Changes:** Backup your `.env` file before making changes

7. **Provider Firewall:** Remember your VPS provider may have additional firewall rules

---

## 🔗 Related Documentation

- **[VPS-DEPLOYMENT.md](VPS-DEPLOYMENT.md)** - Full production deployment with domain and SSL
- **[HOW-IT-WORKS.md](HOW-IT-WORKS.md)** - Understanding the system architecture
- **[QUICKSTART.md](QUICKSTART.md)** - Quick local development setup
- **[README.md](README.md)** - Main project documentation

---

## ❓ Need Help?

**Common Questions:**

**Q: Which option should I choose?**
A: Start with Option 1 (Direct Port Access). It's simplest and you can always upgrade to NGINX later.

**Q: Can I change ports later?**
A: Yes! Just update `.env`, restart with `pm2 restart rindell-ai`, and update firewall rules.

**Q: Do I need NGINX?**
A: Not required, but recommended for production. NGINX provides better performance, security, and allows easy SSL addition later.

**Q: Can I use ports below 1024?**
A: Ports below 1024 require root privileges. Use higher ports (1024+) and run as regular user for security.

**Q: How do I add SSL/HTTPS later?**
A: See [VPS-DEPLOYMENT.md](VPS-DEPLOYMENT.md) for SSL setup. You'll need a domain name for SSL certificates.

---

**Ready to deploy? Choose your option above and follow the steps!** 🚀
