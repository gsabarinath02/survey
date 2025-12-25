# Nurse Survey - Deployment Guide

## Quick Start (Docker - Recommended)

### Prerequisites
- Docker and Docker Compose installed
- Server with 512MB+ RAM

### 1. Set Environment Variables

Create a `.env` file in the project root:

```env
ADMIN_PASSWORD=your_secure_password_here
TOKEN_SECRET=your_random_secret_key_here
```

### 2. Build and Run

```bash
# Build and start the container
docker-compose up -d --build

# Check if it's running
docker-compose ps

# View logs
docker-compose logs -f nurse-survey
```

### 3. Access the Application

- **Survey**: http://your-server:3000
- **Admin Dashboard**: http://your-server:3000/admin

---

## Hosting Options

### Option A: VPS/Cloud Server (DigitalOcean, AWS EC2, etc.)

1. **Create a server** with Ubuntu 22.04
2. **Install Docker**:
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```
3. **Clone your project** to the server
4. **Run with Docker Compose** (see Quick Start above)
5. **Set up a domain** (optional but recommended)

### Option B: Railway/Render (Free tier available)

1. Push code to GitHub
2. Connect your repo to Railway or Render
3. Set environment variables in dashboard
4. Deploy automatically

### Option C: Manual Node.js Deployment

```bash
# Install dependencies
npm ci --legacy-peer-deps

# Build for production
npm run build

# Run the server
npm start
```

---

## Production Checklist

| Step | Command/Action |
|------|---------------|
| ✅ Change admin password | Set `ADMIN_PASSWORD` env var |
| ✅ Set secure token secret | Set `TOKEN_SECRET` env var |
| ✅ Initialize database | `npx prisma migrate deploy` |
| ✅ Seed questions (if needed) | Run your seed script |
| ✅ Set up SSL/HTTPS | Use Nginx or Cloudflare |
| ✅ Configure domain | Point DNS to server |

---

## Adding SSL with Nginx (Recommended)

Install Nginx and Certbot:

```bash
sudo apt install nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/nurse-survey`:

```nginx
server {
    server_name survey.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and get SSL:

```bash
sudo ln -s /etc/nginx/sites-available/nurse-survey /etc/nginx/sites-enabled/
sudo certbot --nginx -d survey.yourdomain.com
sudo systemctl restart nginx
```

---

## Monitoring & Maintenance

```bash
# Check container health
docker-compose ps

# View real-time logs
docker-compose logs -f

# Restart the app
docker-compose restart

# Update and redeploy
git pull
docker-compose up -d --build

# Backup database
docker cp nurse-survey-app:/app/data/survey.db ./backup-$(date +%Y%m%d).db
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Container won't start | Check logs: `docker-compose logs` |
| Database errors | Ensure `/app/data` volume is mounted |
| Can't login to admin | Check `ADMIN_PASSWORD` env var |
| Port already in use | Change port in `docker-compose.yml` |
