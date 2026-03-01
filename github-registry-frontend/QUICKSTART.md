# Quick Start Guide

## Local Development

### Option 1: Using the run script (easiest)

```bash
cd github-registry-frontend
./run.sh
```

Then open http://localhost:8000 in your browser.

### Option 2: Manual setup

```bash
cd github-registry-frontend

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn api.main:app --reload --port 8000
```

### Option 3: Using Docker

```bash
cd github-registry-frontend

# Build the image
docker build -t ara-registry-frontend .

# Run the container
docker run -p 8000:8000 ara-registry-frontend
```

## GitHub Pages Deployment

The frontend automatically deploys to GitHub Pages when you push changes to the `main` branch.

### Setup GitHub Pages

1. Go to your repository settings
2. Navigate to "Pages" section
3. Under "Build and deployment":
   - Source: GitHub Actions
4. Push changes to trigger deployment

The site will be available at: `https://<username>.github.io/<repo-name>/`

### Manual Deployment

You can also trigger deployment manually:

1. Go to the "Actions" tab in your repository
2. Select "Deploy Frontend to GitHub Pages"
3. Click "Run workflow"

## Testing Locally

### Test the API

```bash
# Health check
curl http://localhost:8000/api/health

# Get stats
curl http://localhost:8000/api/stats

# List packages
curl http://localhost:8000/api/packages

# Get specific package
curl http://localhost:8000/api/packages/myname/my-agent
```

### Test the Frontend

1. Open http://localhost:8000
2. Try searching for packages
3. Click on a package to view details
4. Test the filters and sorting

## Customization

### Change Colors

Edit `static/styles.css` and modify the CSS variables:

```css
:root {
    --primary: #8b5cf6;        /* Main purple */
    --secondary: #ec4899;      /* Pink accent */
    --accent: #f59e0b;         /* Orange accent */
}
```

### Add Custom Pages

1. Create a new HTML file in `static/`
2. Add corresponding JavaScript file
3. Link from the navigation

### Modify API Endpoints

Edit `api/main.py` to add new endpoints or modify existing ones.

## Troubleshooting

### Port already in use

If port 8000 is already in use, specify a different port:

```bash
uvicorn api.main:app --reload --port 8080
```

### CORS errors

The API is configured to allow all origins in development. For production, update the CORS settings in `api/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    ...
)
```

### Static files not loading

Make sure you're running the server from the `github-registry-frontend` directory, not the root.

## Production Deployment

### Environment Variables

For production, consider setting:

- `REGISTRY_PATH`: Path to registry data (default: `../registry`)
- `PORT`: Server port (default: 8000)

### Performance

For better performance in production:

1. Use a production ASGI server like Gunicorn:
   ```bash
   pip install gunicorn
   gunicorn api.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

2. Enable caching for static files
3. Use a CDN for assets
4. Consider pre-generating static JSON files

## Next Steps

- Customize the design to match your brand
- Add authentication for publishing
- Implement package ratings/reviews
- Add package dependency visualization
- Create a CLI integration guide page
