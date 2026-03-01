# Getting Started with ARA Registry Frontend

## 🚀 Quick Start (2 minutes)

### Step 1: Test Locally

```bash
cd github-registry-frontend
./run.sh
```

Open http://localhost:8000 in your browser. You should see:
- Homepage with gradient hero
- Your existing packages from `registry/index.json`
- Search and filter functionality

### Step 2: Deploy to GitHub Pages

```bash
# From the repository root
git add .
git commit -m "Add ARA Registry frontend"
git push origin main
```

That's it! GitHub Actions will automatically:
1. Build the static site
2. Generate API JSON files
3. Deploy to GitHub Pages

Your site will be live at: `https://<username>.github.io/<repo-name>/`

## 📋 Prerequisites

### For Local Development
- Python 3.10 or higher
- pip (Python package manager)

### For GitHub Pages Deployment
- GitHub repository
- GitHub Actions enabled (default)
- GitHub Pages enabled in settings

## 🔧 Detailed Setup

### Local Development Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd github-registry-frontend
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   
   Or using a virtual environment (recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Start the development server:**
   ```bash
   uvicorn api.main:app --reload --port 8000
   ```
   
   Or use the convenience script:
   ```bash
   ./run.sh
   ```

4. **Open your browser:**
   Navigate to http://localhost:8000

### GitHub Pages Setup

1. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click "Settings"
   - Scroll to "Pages" section
   - Under "Build and deployment":
     - Source: Select "GitHub Actions"
   - Click "Save"

2. **Push your code:**
   ```bash
   git add .
   git commit -m "Add frontend"
   git push origin main
   ```

3. **Monitor deployment:**
   - Go to the "Actions" tab in your repository
   - Watch the "Deploy Frontend to GitHub Pages" workflow
   - Deployment takes 2-3 minutes

4. **Access your site:**
   - Once complete, visit: `https://<username>.github.io/<repo-name>/`
   - Example: `https://2018-lonely-droid.github.io/ara-registry-starter/`

## 🎨 Customization

### Change Colors

Edit `static/styles.css`:

```css
:root {
    --primary: #8b5cf6;        /* Main purple - change this */
    --secondary: #ec4899;      /* Pink accent - change this */
    --accent: #f59e0b;         /* Orange accent - change this */
}
```

### Change Site Title

Edit `static/index.html` and `static/package.html`:

```html
<title>Your Registry Name</title>
<h1 class="logo">🎯 Your Registry Name</h1>
```

### Add Your Logo

Replace the emoji in the header:

```html
<h1 class="logo">
    <img src="/logo.svg" alt="Your Registry" height="32">
    Your Registry
</h1>
```

### Modify Hero Text

Edit `static/index.html`:

```html
<h2 class="hero-title">Your Custom Title</h2>
<p class="hero-subtitle">Your custom subtitle</p>
```

## 🧪 Testing

### Test the Homepage

1. Open http://localhost:8000
2. Verify:
   - [ ] Stats show correct numbers
   - [ ] Packages are displayed
   - [ ] Search works
   - [ ] Filters work
   - [ ] Sort works
   - [ ] Cards are clickable

### Test Package Details

1. Click on any package card
2. Verify:
   - [ ] Package name displays
   - [ ] Description shows
   - [ ] Install command is correct
   - [ ] Copy button works
   - [ ] Tabs switch
   - [ ] Versions list shows
   - [ ] Metadata displays

### Test Responsive Design

1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test different screen sizes:
   - [ ] Mobile (375px)
   - [ ] Tablet (768px)
   - [ ] Desktop (1200px)

### Test API Endpoints

```bash
# Health check
curl http://localhost:8000/api/health

# Stats
curl http://localhost:8000/api/stats

# All packages
curl http://localhost:8000/api/packages

# Specific package
curl http://localhost:8000/api/packages/myname/my-agent

# With filters
curl "http://localhost:8000/api/packages?type=kiro-agent&sort=downloads"
```

## 🐛 Troubleshooting

### "Module not found: fastapi"

Install dependencies:
```bash
pip install -r requirements.txt
```

### "Port 8000 already in use"

Use a different port:
```bash
uvicorn api.main:app --reload --port 8080
```

### "No packages showing"

Check that `registry/index.json` exists and has data:
```bash
cat registry/index.json
```

### GitHub Pages shows 404

1. Check that Pages is enabled in settings
2. Verify the workflow completed successfully
3. Wait a few minutes for DNS propagation
4. Check the Actions tab for errors

### Styles not loading

Make sure you're accessing the site with the correct URL:
- ✅ `http://localhost:8000/`
- ❌ `file:///path/to/index.html`

### API returns empty data

Check file paths in `api/main.py`:
```python
REGISTRY_PATH = Path(__file__).parent.parent.parent / "registry"
```

Verify this points to your registry directory.

## 📱 Mobile Testing

### iOS Safari
1. Open Safari on iPhone
2. Navigate to your local IP: `http://192.168.x.x:8000`
3. Test touch interactions

### Android Chrome
1. Enable USB debugging
2. Use Chrome DevTools remote debugging
3. Test on real device

## 🔒 Security Notes

### CORS Configuration

For production, update `api/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Restrict to your domain
    allow_credentials=True,
    allow_methods=["GET"],  # Only allow GET
    allow_headers=["*"],
)
```

### HTTPS

Always use HTTPS in production:
- GitHub Pages: Automatic HTTPS
- Custom domain: Configure SSL certificate

## 📊 Monitoring

### Check Site Health

```bash
# Health endpoint
curl https://your-site.github.io/api/health

# Should return: {"status": "ok"}
```

### Monitor Performance

Use browser DevTools:
1. Open DevTools (F12)
2. Go to "Network" tab
3. Reload page
4. Check:
   - Total load time
   - Number of requests
   - Total size

Target metrics:
- Load time: <3 seconds
- Total size: <100KB
- Requests: <10

## 🚢 Deployment Checklist

Before deploying to production:

- [ ] Test all features locally
- [ ] Check responsive design
- [ ] Verify all links work
- [ ] Test on multiple browsers
- [ ] Check console for errors
- [ ] Verify API endpoints
- [ ] Test search functionality
- [ ] Test filters and sorting
- [ ] Review security settings
- [ ] Update CORS for production
- [ ] Add analytics (optional)
- [ ] Test on mobile devices
- [ ] Check accessibility
- [ ] Verify GitHub Actions workflow
- [ ] Test deployment process

## 🎯 Next Steps

### Immediate
1. ✅ Get it running locally
2. ✅ Deploy to GitHub Pages
3. ✅ Share the URL with your team

### Short Term
- Add your branding (logo, colors)
- Customize text and messaging
- Add analytics tracking
- Set up custom domain

### Long Term
- Add package icons
- Implement dark mode
- Add user ratings
- Create dependency graphs
- Add advanced search

## 📚 Additional Resources

- [README.md](README.md) - Technical documentation
- [QUICKSTART.md](QUICKSTART.md) - Quick reference
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment options
- [FEATURES.md](FEATURES.md) - Feature documentation
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [SUMMARY.md](SUMMARY.md) - Project overview

## 💬 Getting Help

### Common Issues

1. **Packages not showing**: Check `registry/index.json` exists
2. **Styles broken**: Verify file paths and server is running
3. **API errors**: Check Python dependencies installed
4. **Deployment fails**: Review GitHub Actions logs

### Debug Mode

Enable debug logging in `api/main.py`:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Browser Console

Check for JavaScript errors:
1. Open DevTools (F12)
2. Go to "Console" tab
3. Look for red error messages

## ✅ Success Criteria

You'll know it's working when:

1. ✅ Homepage loads with gradient background
2. ✅ Stats show correct numbers
3. ✅ Packages display in grid
4. ✅ Search filters results
5. ✅ Clicking a package shows details
6. ✅ Copy button copies install command
7. ✅ Site works on mobile
8. ✅ No console errors

## 🎉 You're Done!

Congratulations! You now have a beautiful, functional registry website.

Share it with your team and start publishing packages!

---

**Need help?** Check the other documentation files or open an issue on GitHub.
