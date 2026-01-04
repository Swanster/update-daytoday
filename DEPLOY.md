# Deployment Guide for Ubuntu Server

This guide describes how to deploy the Daily Activity Infrastructure Engineer application on an Ubuntu server using Node.js, MongoDB, PM2, and Nginx.

## Prerequisites

- Ubuntu Server (20.04 or newer)
- Root or sudo access
- Domain name (optional, but recommended)

## 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

## 2. Install MongoDB

Follow the official MongoDB installation guide for your specific Ubuntu version. For Ubuntu 22.04/24.04:

```bash
# Import Public Key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Create list file
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Reload local package database
sudo apt update

# Install MongoDB
sudo apt install -y mongodb-org

# Start and Enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### ⚠️ Troubleshooting: "signal=ILL" Error (Older CPUs)
If `mongod` fails with `Active: failed (Result: core-dump)... (code=dumped, signal=ILL)`, your CPU is likely missing **AVX instructions** required by MongoDB 5.0+.

**Solution: Install MongoDB 4.4 instead**
```bash
# Remove current mongodb
sudo apt remove -y mongodb-org && sudo apt purge -y mongodb-org && sudo apt autoremove -y
sudo rm /etc/apt/sources.list.d/mongodb-org-*.list

# Install MongoDB 4.4 (Supports older CPUs)
curl -fsSL https://www.mongodb.org/static/pgp/server-4.4.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-4.4.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-4.4.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
sudo apt update
sudo apt install -y mongodb-org
```

## 3. Install Node.js and Nginx

```bash
# Install Node.js (using NVM is recommended, but apt is fine for production if version is recent enough)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Verify installations
node -v
npm -v
nginx -v
```

## 4. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

## 5. Clone and Setup Application

```bash
# Clone repository (assuming you are in /var/www or similar)
cd /var/www
git clone <YOUR_GITHUB_REPO_URL> update-daytoday
cd update-daytoday

# ⚠️ IMPORTANT: Fix Permissions
# Ensure your current user owns the directory to avoid "EACCES: permission denied" errors
sudo chown -R $USER:$USER /var/www/update-daytoday

# Setup Backend
cd server
npm install
# Create .env file for production
echo "PORT=5000" > .env
echo "MONGODB_URI=mongodb://localhost:27017/project-tracker" >> .env
echo "JWT_SECRET=your_super_secure_random_string_here" >> .env

# Setup Frontend
cd ../client
npm install
npm run build
```

## 6. Start Backend with PM2

```bash
cd ../server
pm2 start index.js --name "project-tracker-api"
pm2 save
pm2 startup
```

## 7. Configure Nginx

Create a new Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/project-tracker
```

Add the following configuration (replace `your_domain_or_ip` with your actual domain or IP address):

```nginx
server {
    listen 80;
    server_name your_domain_or_ip;

    # Allow large file uploads (50MB max)
    client_max_body_size 50M;

    # Frontend (Serve Static Files)
    location / {
        root /path/to/project-01/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Uploaded files
    location /uploads {
        proxy_pass http://localhost:5000/uploads;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Backend API Proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout for large file uploads
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

Enable the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/project-tracker /etc/nginx/sites-enabled/
sudo nginx -t # Test configuration
sudo systemctl restart nginx
```

## 8. Firewall Setup (UFW)

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## 9. Create First Superuser

After deployment, accessing the site for the first time will allow you to register. The **first registered user** automatically becomes the **Superuser**.

1. Go to `http://your_domain_or_ip`
2. Register a new account
3. This account gets immediate Superuser access
4. Use this account to approve subsequent user registrations

## Troubleshooting

- **Check Backend Logs:** `pm2 logs project-tracker-api`
- **Check Nginx Logs:** `sudo tail -f /var/log/nginx/error.log`
- **Restart Nginx:** `sudo systemctl restart nginx`
- **Check Open Ports:** `sudo lsof -i -P -n | grep LISTEN` or `sudo ss -tulpn`

## 10. Updating the Application

When you need to update the application with the latest changes:

1.  **Pull the latest code:**
    ```bash
    cd /var/www/update-daytoday
    git pull origin main
    ```

2.  **Update Backend:**
    ```bash
    cd server
    npm install
    
    # Run database migration (Only needed for Carry Forward / Sequence Update)
    node fix-sequences.js
    
    # Restart Backend
    pm2 restart project-tracker-api
    ```

3.  **Update Frontend:**
    ```bash
    cd ../client
    npm install
    npm run build
    ```

4.  **Verify:**
    Check `pm2 logs project-tracker-api` to ensure the server started correctly.

## 12. Backup System

### Setting Up Automated Backups

1. **Create backup directory:**
   ```bash
   sudo mkdir -p /var/backups/mongodb/{daily,weekly,manual}
   sudo chown -R $USER:$USER /var/backups/mongodb
   ```

2. **Make backup scripts executable:**
   ```bash
   cd /var/www/update-daytoday/server
   chmod +x backup.sh restore.sh
   ```

3. **Test manual backup:**
   ```bash
   ./backup.sh manual
   ```

4. **Setup automated cron jobs:**
   ```bash
   # Edit crontab
   crontab -e
   
   # Add these lines:
   # Daily backup at 2 AM
   0 2 * * * /var/www/update-daytoday/server/backup.sh daily >> /var/log/mongodb-backup.log 2>&1
   
   # Weekly backup on Sunday at 3 AM
   0 3 * * 0 /var/www/update-daytoday/server/backup.sh weekly >> /var/log/mongodb-backup.log 2>&1
   ```

### Manual Backup Commands

```bash
# Create a manual backup
./backup.sh manual

# Create a daily backup
./backup.sh daily

# Create a weekly backup
./backup.sh weekly
```

### Restore from Backup

```bash
# List available backups
ls -la /var/backups/mongodb/*/*.tar.gz

# Restore from a backup file
./restore.sh /var/backups/mongodb/daily/backup_project-tracker_daily_20260104_020000.tar.gz
```

### Retention Policy
- **Daily backups:** Kept for 7 days
- **Weekly backups:** Kept for 30 days
- **Manual backups:** Kept for 90 days
