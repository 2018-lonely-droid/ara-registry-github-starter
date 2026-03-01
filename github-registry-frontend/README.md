# ARA Registry Frontend

A modern web interface for browsing and discovering ARA packages, inspired by PartyRock's playful design.

## Features

- 🔍 Real-time search across packages
- 🏷️ Filter by package type and tags
- 📊 Live statistics dashboard
- 📦 Detailed package information
- 🎨 Vibrant, gradient-based design
- 📱 Fully responsive layout

## Development

### Prerequisites

- Python 3.10+
- pip or uv

### Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Run the development server:

```bash
uvicorn api.main:app --reload --port 8000
```

3. Open your browser to `http://localhost:8000`

### Project Structure

```
github-registry-frontend/
├── api/
│   └── main.py          # FastAPI backend
├── static/
│   ├── index.html       # Homepage
│   ├── package.html     # Package detail page
│   ├── styles.css       # Styles
│   ├── app.js          # Homepage JavaScript
│   └── package.js      # Package detail JavaScript
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## API Endpoints

### `GET /api/health`
Health check endpoint.

### `GET /api/stats`
Get registry statistics (total packages, downloads, namespaces).

### `GET /api/packages`
List and search packages.

Query parameters:
- `q`: Search query
- `type`: Filter by package type
- `namespace`: Filter by namespace
- `tags`: Filter by tags (comma-separated)
- `sort`: Sort by (updated, created, downloads, name)
- `limit`: Results per page (default: 100)
- `offset`: Pagination offset (default: 0)

### `GET /api/packages/{namespace}/{name}`
Get detailed package information.

### `GET /api/namespaces`
List all namespaces with package counts.

### `GET /api/tags`
List all tags with usage counts.

## Deployment

### GitHub Pages (Static)

For a static deployment, you can pre-render the data:

1. Generate static JSON files from the registry
2. Deploy the `static/` folder to GitHub Pages
3. Update JavaScript to fetch from static JSON files

### Vercel/Netlify (Full Stack)

Deploy the FastAPI backend with serverless functions:

1. Configure `vercel.json` or `netlify.toml`
2. Deploy the entire project
3. The API will run as serverless functions

### Docker

```bash
docker build -t ara-registry-frontend .
docker run -p 8000:8000 ara-registry-frontend
```

## Design

The design is inspired by PartyRock's vibrant, playful aesthetic:

- **Colors**: Purple/pink gradients, bright accents
- **Typography**: Clean, modern sans-serif
- **Layout**: Card-based grid system
- **Interactions**: Smooth hover effects and transitions
- **Accessibility**: High contrast, semantic HTML

## Contributing

Contributions welcome! Please ensure:

- Code follows existing style
- All features are responsive
- Accessibility standards are met
- API changes are documented

## License

Apache-2.0
