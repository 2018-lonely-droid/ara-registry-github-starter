# Deployment Guide

## Overview

The ARA Registry Frontend can be deployed in two ways:

1. **Static Site (GitHub Pages)** - Pre-generated JSON files, no backend needed
2. **Full Stack (Vercel/Railway/etc)** - FastAPI backend with dynamic data

## Option 1: GitHub Pages (Recommended)

### Advantages
- Free hosting
- Automatic deployments
- Fast CDN delivery
- No server maintenance

### Setup

1. **Enable GitHub Pages in your repository:**
   - Go to Settings → Pages
   - Source: GitHub Actions
   - Save

2. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Add frontend"
   git push origin main
   ```

3. **Wait for deployment:**
   - Check the Actions tab
   - Deployment takes ~2-3 minutes
   - Site will be at: `https://<username>.github.io/<repo-name>/`

### How It Works

The GitHub Actions workflow:
1. Reads `registry/index.json` and `registry/ownership.json`
2. Generates static JSON files in `static/api/`
3. Updates JavaScript to use static files
4. Deploys to GitHub Pages

### Custom Domain

To use a custom domain:

1. Add a `CNAME` file to `github-registry-frontend/static/`:
   ```
   registry.yourdomain.com
   ```

2. Configure DNS:
   - Add a CNAME record pointing to `<username>.github.io`

3. Enable HTTPS in repository settings

## Option 2: Full Stack Deployment

### Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Create `vercel.json`:**
   ```json
   {
     "builds": [
       {
         "src": "github-registry-frontend/api/main.py",
         "use": "@vercel/python"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "github-registry-frontend/api/main.py"
       },
       {
         "src": "/(.*)",
         "dest": "github-registry-frontend/static/$1"
       }
     ]
   }
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

### Railway

1. **Create `railway.toml`:**
   ```toml
   [build]
   builder = "nixpacks"
   buildCommand = "pip install -r github-registry-frontend/requirements.txt"
   
   [deploy]
   startCommand = "uvicorn github-registry-frontend.api.main:app --host 0.0.0.0 --port $PORT"
   ```

2. **Deploy:**
   - Connect your GitHub repository
   - Railway auto-deploys on push

### Docker (Self-hosted)

1. **Build the image:**
   ```bash
   docker build -t ara-registry-frontend github-registry-frontend/
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     -p 8000:8000 \
     -v $(pwd)/registry:/app/registry:ro \
     --name ara-registry \
     ara-registry-frontend
   ```

3. **Use Docker Compose:**
   ```yaml
   version: '3.8'
   services:
     frontend:
       build: ./github-registry-frontend
       ports:
         - "8000:8000"
       volumes:
         - ./registry:/app/registry:ro
       restart: unless-stopped
   ```

### Fly.io

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Create `fly.toml`:**
   ```toml
   app = "ara-registry"
   
   [build]
     dockerfile = "github-registry-frontend/Dockerfile"
   
   [[services]]
     internal_port = 8000
     protocol = "tcp"
   
     [[services.ports]]
       port = 80
       handlers = ["http"]
   
     [[services.ports]]
       port = 443
       handlers = ["tls", "http"]
   ```

3. **Deploy:**
   ```bash
   fly launch
   fly deploy
   ```

## Performance Optimization

### Caching

Add caching headers in `api/main.py`:

```python
from fastapi.responses import JSONResponse

@app.get("/api/packages")
async def list_packages(...):
    # ... existing code ...
    return JSONResponse(
        content=result,
        headers={"Cache-Control": "public, max-age=300"}
    )
```

### CDN

For static deployments, use a CDN:
- Cloudflare Pages
- Netlify
- AWS CloudFront

### Compression

Enable gzip compression:

```python
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

## Monitoring

### Health Checks

The `/api/health` endpoint can be used for monitoring:

```bash
curl https://your-domain.com/api/health
```

### Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- StatusCake

### Analytics

Add analytics to `static/index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## Security

### HTTPS

Always use HTTPS in production. Most platforms provide free SSL:
- GitHub Pages: Automatic
- Vercel: Automatic
- Railway: Automatic
- Fly.io: Automatic

### CORS

For production, restrict CORS in `api/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)
```

### Rate Limiting

Add rate limiting for API endpoints:

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/api/packages")
@limiter.limit("100/minute")
async def list_packages(...):
    # ... existing code ...
```

## Troubleshooting

### Build Fails

Check the Actions logs for errors:
1. Go to Actions tab
2. Click on the failed workflow
3. Review the error messages

Common issues:
- Missing dependencies
- Invalid JSON in registry files
- Path issues

### 404 Errors

For GitHub Pages:
- Ensure the workflow completed successfully
- Check that Pages is enabled in settings
- Verify the correct branch is selected

### API Not Working

For full stack deployments:
- Check server logs
- Verify environment variables
- Test endpoints with curl
- Check CORS settings

## Updating

### Update Registry Data

The frontend automatically updates when registry files change:

1. Update `registry/index.json` or `registry/ownership.json`
2. Commit and push
3. GitHub Actions rebuilds and deploys

### Update Frontend Code

1. Make changes to files in `github-registry-frontend/`
2. Test locally
3. Commit and push
4. Automatic deployment

## Rollback

To rollback a deployment:

1. Go to Actions tab
2. Find the previous successful deployment
3. Click "Re-run jobs"

Or revert the commit:

```bash
git revert HEAD
git push origin main
```

## Support

For issues:
- Check the [QUICKSTART.md](QUICKSTART.md) guide
- Review [README.md](README.md) for API documentation
- Open an issue on GitHub
