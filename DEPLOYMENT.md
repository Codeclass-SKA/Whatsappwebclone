# Deployment Guide

This guide provides step-by-step instructions for deploying the WhatsApp Clone application to various hosting platforms.

## 🚀 Quick Start

### Prerequisites
- Git installed
- Node.js 18+ (for frontend)
- PHP 8.2+ (for backend)
- Composer (for PHP dependencies)
- Database (MySQL/PostgreSQL for production)

## 📦 Local Development Deployment

### 1. Clone Repository
```bash
git clone https://github.com/riskaabdullah/whatsapp-clone.git
cd whatsapp-clone
```

### 2. Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve --host=127.0.0.1 --port=8000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

### 4. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api

## 🌐 Production Deployment

### Option 1: VPS/Cloud Server

#### Backend Deployment (Laravel)

1. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install required packages
   sudo apt install nginx php8.2-fpm php8.2-mysql php8.2-xml php8.2-mbstring php8.2-curl composer git -y
   ```

2. **Clone Application**
   ```bash
   cd /var/www
   sudo git clone https://github.com/riskaabdullah/whatsapp-clone.git
   sudo chown -R www-data:www-data whatsapp-clone
   cd whatsapp-clone/backend
   ```

3. **Install Dependencies**
   ```bash
   composer install --optimize-autoloader --no-dev
   ```

4. **Environment Configuration**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Database Setup**
   ```bash
   # Configure database in .env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=whatsapp_clone
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   
   # Run migrations
   php artisan migrate --force
   php artisan db:seed --force
   ```

6. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/whatsapp-clone/backend/public;
       
       add_header X-Frame-Options "SAMEORIGIN";
       add_header X-Content-Type-Options "nosniff";
       
       index index.php;
       
       charset utf-8;
       
       location / {
           try_files $uri $uri/ /index.php?$query_string;
       }
       
       location = /favicon.ico { access_log off; log_not_found off; }
       location = /robots.txt  { access_log off; log_not_found off; }
       
       error_page 404 /index.php;
       
       location ~ \.php$ {
           fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
           fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
           include fastcgi_params;
       }
       
       location ~ /\.(?!well-known).* {
           deny all;
       }
   }
   ```

7. **SSL Certificate (Let's Encrypt)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

#### Frontend Deployment

1. **Build Production Assets**
   ```bash
   cd /var/www/whatsapp-clone/frontend
   npm install
   npm run build
   ```

2. **Configure Nginx for Frontend**
   ```nginx
   server {
       listen 80;
       server_name app.your-domain.com;
       root /var/www/whatsapp-clone/frontend/dist;
       
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

### Option 2: Heroku Deployment

#### Backend (Laravel)

1. **Create Heroku App**
   ```bash
   heroku create your-whatsapp-clone-api
   ```

2. **Add Buildpacks**
   ```bash
   heroku buildpacks:add heroku/php
   heroku buildpacks:add heroku/nodejs
   ```

3. **Configure Environment**
   ```bash
   heroku config:set APP_KEY=$(php artisan key:generate --show)
   heroku config:set APP_ENV=production
   heroku config:set DB_CONNECTION=postgresql
   ```

4. **Add Database**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

5. **Deploy**
   ```bash
   git push heroku main
   heroku run php artisan migrate
   heroku run php artisan db:seed
   ```

#### Frontend (React)

1. **Create Heroku App**
   ```bash
   heroku create your-whatsapp-clone-frontend
   ```

2. **Configure Build**
   ```bash
   # Add to package.json
   "scripts": {
     "build": "vite build",
     "start": "vite preview --host 0.0.0.0 --port $PORT"
   }
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

### Option 3: Vercel + Railway

#### Backend (Railway)

1. **Connect Repository**
   - Go to [Railway](https://railway.app)
   - Connect your GitHub repository
   - Select the `backend` directory

2. **Configure Environment**
   ```env
   APP_ENV=production
   APP_DEBUG=false
   DB_CONNECTION=postgresql
   ```

3. **Deploy**
   - Railway will automatically deploy on push

#### Frontend (Vercel)

1. **Connect Repository**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Set root directory to `frontend`

2. **Configure Build**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Environment Variables**
   ```env
   VITE_API_URL=https://your-railway-app.railway.app/api
   ```

4. **Deploy**
   - Vercel will automatically deploy on push

## 🔧 Environment Configuration

### Production Environment Variables

#### Backend (.env)
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=whatsapp_clone
DB_USERNAME=your_username
DB_PASSWORD=your_password

BROADCAST_DRIVER=pusher
PUSHER_APP_ID=your_pusher_app_id
PUSHER_APP_KEY=your_pusher_key
PUSHER_APP_SECRET=your_pusher_secret
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=your_cluster

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
```

#### Frontend (.env)
```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_PUSHER_APP_KEY=your_pusher_key
VITE_PUSHER_HOST=your_pusher_host
VITE_PUSHER_PORT=443
VITE_PUSHER_SCHEME=https
VITE_PUSHER_APP_CLUSTER=your_cluster
```

## 🔒 Security Considerations

### SSL/TLS
- Always use HTTPS in production
- Configure SSL certificates (Let's Encrypt recommended)
- Redirect HTTP to HTTPS

### Database Security
- Use strong database passwords
- Restrict database access to application server only
- Regular database backups

### Application Security
- Set `APP_DEBUG=false` in production
- Use strong `APP_KEY`
- Configure proper CORS settings
- Enable rate limiting

### File Permissions
```bash
# Set proper permissions
sudo chown -R www-data:www-data /var/www/whatsapp-clone
sudo chmod -R 755 /var/www/whatsapp-clone
sudo chmod -R 775 /var/www/whatsapp-clone/backend/storage
```

## 📊 Monitoring & Maintenance

### Log Monitoring
```bash
# Laravel logs
tail -f /var/www/whatsapp-clone/backend/storage/logs/laravel.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Performance Optimization
```bash
# Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Optimize Composer
composer install --optimize-autoloader --no-dev
```

### Database Maintenance
```bash
# Regular backups
mysqldump -u username -p whatsapp_clone > backup.sql

# Optimize tables
php artisan migrate:status
```

## 🚨 Troubleshooting

### Common Issues

1. **500 Internal Server Error**
   - Check Laravel logs: `tail -f storage/logs/laravel.log`
   - Verify file permissions
   - Check .env configuration

2. **Database Connection Issues**
   - Verify database credentials
   - Check database server status
   - Test connection manually

3. **Frontend Build Issues**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility
   - Verify environment variables

4. **WebSocket Issues**
   - Configure Pusher or alternative WebSocket service
   - Check firewall settings
   - Verify SSL certificates

### Support
For deployment issues, please:
1. Check the logs for error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Create an issue in the GitHub repository

---

**Author**: Riska Abdullah  
**Last Updated**: 2025-07-22 