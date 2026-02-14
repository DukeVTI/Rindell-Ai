# 🔧 Port Configuration Quick Reference

> Quick reference for configuring Rindell AI ports on your VPS

## 🎯 Choose Your Scenario

### Scenario 1: Fresh VPS (No Other Services)

**Use:** [VPS-DEPLOYMENT.md](VPS-DEPLOYMENT.md) - Standard deployment

```env
API_PORT=3000
WEB_PORT=8080
```

Access via domain after NGINX setup: `https://yourdomain.com`

---

### Scenario 2: VPS with Other Services (Ports 3000, 8080 Taken)

**Use:** [VPS-DEPLOYMENT-PORTS.md](VPS-DEPLOYMENT-PORTS.md) - Option 1 (Direct Port Access)

**Check available ports:**
```bash
sudo netstat -tlnp | grep LISTEN
```

**Configure Rindell:**
```env
API_PORT=5001
WEB_PORT=5000
API_SERVER_URL=http://localhost:5001/analyze
```

**Firewall:**
```bash
sudo ufw allow 5000/tcp
sudo ufw allow 5001/tcp
```

**Access:** `http://YOUR-VPS-IP:5000`

---

### Scenario 3: Professional Setup with NGINX on Custom Port

**Use:** [VPS-DEPLOYMENT-PORTS.md](VPS-DEPLOYMENT-PORTS.md) - Option 2 (NGINX Proxy)

**Rindell (internal):**
```env
API_PORT=3000
WEB_PORT=8080
API_SERVER_URL=http://localhost:3000/analyze
```

**NGINX (external):**
- Listen on port: `9000` (or any available)
- Proxy to internal ports

**Firewall:**
```bash
sudo ufw allow 9000/tcp
```

**Access:** `http://YOUR-VPS-IP:9000`

---

### Scenario 4: Sharing Port 80 with Other Services

**Use:** [VPS-DEPLOYMENT-PORTS.md](VPS-DEPLOYMENT-PORTS.md) - Option 3 (Path-Based)

**Rindell (internal):**
```env
API_PORT=3000
WEB_PORT=8080
API_SERVER_URL=http://localhost:3000/analyze
```

**NGINX Path:** `/rindell`

**Access:** `http://YOUR-VPS-IP/rindell`

---

## 🔍 Port Checking Commands

```bash
# Check if port is in use
sudo netstat -tlnp | grep :5000
sudo ss -tlnp | grep :5000
sudo lsof -i :5000

# List all listening ports
sudo netstat -tlnp | grep LISTEN

# Check firewall rules
sudo ufw status numbered

# Test port from local machine
curl http://localhost:5000
```

---

## 🛠️ Common Port Ranges

| Range | Purpose | Examples |
|-------|---------|----------|
| 1-1023 | System/Well-known | 22 (SSH), 80 (HTTP), 443 (HTTPS) |
| 1024-49151 | Registered | 3000 (Node), 3306 (MySQL), 5432 (PostgreSQL) |
| 49152-65535 | Dynamic/Private | Any available |

**Good ports for Rindell:**
- 5000-5999 (User applications)
- 8000-8999 (Alternative web servers)
- 9000-9999 (Application servers)

---

## 🚀 Quick Setup Commands

### Option 1: Direct Access (Ports 5000, 5001)

```bash
# 1. Edit environment
cd ~/Rindell-Ai
nano .env
# Set: API_PORT=5001, WEB_PORT=5000

# 2. Configure firewall
sudo ufw allow 5000/tcp
sudo ufw allow 5001/tcp

# 3. Start application
pm2 start platform.js --name rindell-ai
pm2 save

# 4. Test
curl http://localhost:5000
```

---

### Option 2: NGINX Proxy (Port 9000)

```bash
# 1. Keep internal ports (3000, 8080)
cd ~/Rindell-Ai
# .env: API_PORT=3000, WEB_PORT=8080

# 2. Configure NGINX for port 9000
sudo nano /etc/nginx/sites-available/rindell-ai-ports
# Add config (see VPS-DEPLOYMENT-PORTS.md)

# 3. Enable and test
sudo ln -s /etc/nginx/sites-available/rindell-ai-ports /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 4. Configure firewall
sudo ufw allow 9000/tcp

# 5. Start application
pm2 start platform.js --name rindell-ai
pm2 save

# 6. Test
curl http://localhost:9000
```

---

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Find what's using it
sudo lsof -i :5000

# Kill process (use PID from above)
sudo kill <PID>

# Or choose different port
```

### Can't Access from Browser

```bash
# 1. Check app is running
pm2 status

# 2. Check port is listening
sudo netstat -tlnp | grep :5000

# 3. Check firewall
sudo ufw status

# 4. Check VPS provider firewall
# (DigitalOcean, AWS, etc. have additional firewalls)
```

### NGINX Not Working

```bash
# Test config
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log

# Restart NGINX
sudo systemctl restart nginx
```

---

## 📱 Testing Access

### From VPS (Local Test)

```bash
curl http://localhost:5000
curl http://localhost:5001/health
```

### From Your Computer

```bash
# Replace with your VPS IP
curl http://123.45.67.89:5000
```

### In Browser

```
http://YOUR-VPS-IP:5000
```

Example: `http://123.45.67.89:5000`

---

## 💡 Pro Tips

1. **Document Your Ports:** Keep a list of which service uses which port

2. **Use Non-Standard Ports:** Avoid common ports (3000, 8000, 8080) that might be taken

3. **Test Locally First:** Use `curl http://localhost:PORT` before testing externally

4. **Check VPS Provider Firewall:** Many providers have additional security groups

5. **Use PM2:** Always run with PM2 for auto-restart: `pm2 start platform.js`

6. **Monitor Logs:** Check logs when troubleshooting: `pm2 logs rindell-ai`

---

## 📚 Full Documentation

- **[VPS-DEPLOYMENT-PORTS.md](VPS-DEPLOYMENT-PORTS.md)** - Complete port-based deployment guide
- **[VPS-DEPLOYMENT.md](VPS-DEPLOYMENT.md)** - Full production deployment with domain
- **[README.md](README.md)** - Main project documentation

---

**Need help? See the troubleshooting section in [VPS-DEPLOYMENT-PORTS.md](VPS-DEPLOYMENT-PORTS.md)**
