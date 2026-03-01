# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │ index.html │  │package.html│  │     styles.css       │  │
│  │  (Search)  │  │  (Details) │  │  (PartyRock Style)   │  │
│  └─────┬──────┘  └─────┬──────┘  └──────────────────────┘  │
│        │               │                                     │
│  ┌─────▼──────┐  ┌─────▼──────┐                            │
│  │   app.js   │  │ package.js │                            │
│  │ (Homepage) │  │  (Detail)  │                            │
│  └─────┬──────┘  └─────┬──────┘                            │
└────────┼────────────────┼──────────────────────────────────┘
         │                │
         │  HTTP Requests │
         ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    api/main.py                        │  │
│  │                                                        │  │
│  │  Endpoints:                                           │  │
│  │  • GET /api/health                                    │  │
│  │  • GET /api/stats                                     │  │
│  │  • GET /api/packages                                  │  │
│  │  • GET /api/packages/{namespace}/{name}              │  │
│  │  • GET /api/namespaces                               │  │
│  │  • GET /api/tags                                     │  │
│  └────────────────────┬─────────────────────────────────┘  │
└─────────────────────────┼──────────────────────────────────┘
                          │
                          │ Reads JSON
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Registry Data                             │
│  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │ index.json       │  │ ownership.json                │   │
│  │                  │  │                                │   │
│  │ • Packages list  │  │ • Namespace owners            │   │
│  │ • Metadata       │  │ • Package owners              │   │
│  │ • Versions       │  │                                │   │
│  │ • Tags           │  │                                │   │
│  │ • Downloads      │  │                                │   │
│  └──────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Homepage Load
```
1. User visits site
   ↓
2. Browser loads index.html
   ↓
3. app.js executes
   ↓
4. Fetch /api/stats → Display animated counters
   ↓
5. Fetch /api/packages → Render package cards
   ↓
6. User sees homepage with all packages
```

### Search & Filter
```
1. User types in search box
   ↓
2. app.js filters packages client-side (no API call)
   ↓
3. Re-render filtered results
   ↓
4. Instant feedback (no loading)
```

### Package Detail
```
1. User clicks package card
   ↓
2. Navigate to package.html?pkg=namespace/name
   ↓
3. package.js parses URL
   ↓
4. Fetch /api/packages/{namespace}/{name}
   ↓
5. Render package details, versions, metadata
```

## Component Breakdown

### Frontend Components

#### index.html
- Hero section with gradient
- Search input
- Stats dashboard (3 cards)
- Filter pills (package types)
- Sort dropdown
- Package grid (responsive)
- Footer

#### package.html
- Package header (name, type, description)
- Metadata row (version, owner, downloads)
- Tags display
- Install command with copy button
- Tabs (Versions, Metadata)
- Tab content areas

#### styles.css
- CSS variables for theming
- Responsive grid layouts
- Card styles with hover effects
- Animation keyframes
- Mobile breakpoints
- Accessibility styles

#### app.js
- State management (filters, sort)
- API calls (stats, packages)
- Search filtering logic
- Package card rendering
- Event listeners
- Utility functions

#### package.js
- URL parameter parsing
- Package detail API call
- Tab switching logic
- Copy to clipboard
- Metadata rendering
- Version list rendering

### Backend Components

#### api/main.py
- FastAPI app initialization
- CORS middleware
- Static file serving
- API endpoints
- JSON file reading
- Data filtering/sorting
- Error handling

## Deployment Architectures

### Option 1: GitHub Pages (Static)

```
┌──────────────┐
│ GitHub Repo  │
│              │
│ • Push code  │
└──────┬───────┘
       │
       │ Triggers
       ▼
┌──────────────────┐
│ GitHub Actions   │
│                  │
│ 1. Read registry │
│ 2. Generate JSON │
│ 3. Build static  │
│ 4. Deploy Pages  │
└──────┬───────────┘
       │
       │ Deploys to
       ▼
┌──────────────────┐
│ GitHub Pages CDN │
│                  │
│ • Static HTML    │
│ • Static JSON    │
│ • No backend     │
└──────────────────┘
       │
       │ Serves to
       ▼
┌──────────────────┐
│   User Browser   │
└──────────────────┘
```

### Option 2: Full Stack (Vercel/Railway)

```
┌──────────────┐
│ GitHub Repo  │
│              │
│ • Push code  │
└──────┬───────┘
       │
       │ Auto-deploy
       ▼
┌──────────────────┐
│ Hosting Platform │
│                  │
│ • FastAPI server │
│ • Static files   │
│ • Registry data  │
└──────┬───────────┘
       │
       │ Serves to
       ▼
┌──────────────────┐
│   User Browser   │
└──────────────────┘
```

### Option 3: Docker (Self-hosted)

```
┌──────────────┐
│ Docker Image │
│              │
│ • Python     │
│ • FastAPI    │
│ • Static     │
└──────┬───────┘
       │
       │ Runs on
       ▼
┌──────────────────┐
│  Your Server     │
│                  │
│ • Port 8000      │
│ • Volume mount   │
└──────┬───────────┘
       │
       │ Serves to
       ▼
┌──────────────────┐
│   User Browser   │
└──────────────────┘
```

## State Management

### Client-Side State (app.js)

```javascript
{
  allPackages: [],        // All packages from API
  currentFilters: {
    query: '',            // Search text
    type: '',             // Package type filter
    sort: 'updated'       // Sort method
  }
}
```

### No Server-Side State
- Backend is stateless
- All data from JSON files
- No database
- No sessions
- No authentication (read-only)

## API Response Formats

### GET /api/stats
```json
{
  "total_packages": 42,
  "total_downloads": 1337,
  "total_namespaces": 10,
  "package_types": {
    "kiro-agent": 20,
    "mcp-server": 15,
    "context": 7
  }
}
```

### GET /api/packages
```json
{
  "packages": [
    {
      "namespace": "acme",
      "name": "weather-agent",
      "description": "Weather forecasting agent",
      "type": "kiro-agent",
      "latest_version": "1.0.0",
      "versions": ["1.0.0", "0.9.0"],
      "tags": ["weather", "api"],
      "total_downloads": 42,
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-02-01T00:00:00Z"
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

### GET /api/packages/{namespace}/{name}
```json
{
  "namespace": "acme",
  "name": "weather-agent",
  "description": "Weather forecasting agent",
  "type": "kiro-agent",
  "latest_version": "1.0.0",
  "versions": ["1.0.0", "0.9.0"],
  "tags": ["weather", "api"],
  "total_downloads": 42,
  "author": "dev@example.com",
  "license": "MIT",
  "homepage": "https://example.com",
  "repository": "https://github.com/acme/weather-agent",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-02-01T00:00:00Z",
  "owner": "acme-user"
}
```

## Performance Characteristics

### Initial Load
- HTML: ~5KB
- CSS: ~15KB
- JavaScript: ~10KB
- API calls: 2 (stats + packages)
- Total: ~30KB + JSON data
- Time: <2 seconds

### Search/Filter
- No API calls (client-side)
- Re-render: <50ms
- Feels instant

### Navigation
- Package detail: 1 API call
- Time: <500ms

## Security Considerations

### Read-Only API
- No write operations
- No authentication needed
- No user data stored
- No cookies/sessions

### CORS
- Configured for all origins in dev
- Should be restricted in production

### Input Validation
- URL parameters sanitized
- HTML escaped in rendering
- No SQL injection risk (no database)
- No XSS risk (proper escaping)

## Scalability

### Current Limits
- ~500 packages: Excellent performance
- ~5,000 packages: Good performance
- ~50,000 packages: Need pagination/virtualization

### Optimization Strategies
1. Client-side caching
2. Service worker
3. Virtual scrolling
4. Lazy loading
5. CDN for static assets

## Monitoring Points

### Health Checks
- `/api/health` endpoint
- Response time
- Error rate

### Metrics to Track
- Page load time
- API response time
- Search performance
- User interactions
- Error logs

## Error Handling

### Frontend
- Network errors → Show error state
- 404s → "Package not found"
- Timeouts → Retry logic
- Empty results → "No packages found"

### Backend
- File not found → Return empty array
- Invalid JSON → Log error, return empty
- Invalid parameters → 400 Bad Request
- Server errors → 500 Internal Server Error

## Future Architecture Enhancements

### Potential Additions
1. **Redis Cache**: Cache API responses
2. **Search Index**: Elasticsearch for advanced search
3. **CDN**: CloudFront/Cloudflare for assets
4. **Analytics**: Track usage patterns
5. **Rate Limiting**: Prevent abuse
6. **Authentication**: For write operations
7. **WebSocket**: Real-time updates
8. **GraphQL**: More flexible queries

### Scaling Strategy
1. Start with GitHub Pages (static)
2. Move to serverless (Vercel/Netlify)
3. Add caching layer (Redis)
4. Implement CDN
5. Consider microservices if needed

## Development Workflow

```
1. Edit code locally
   ↓
2. Test with ./run.sh
   ↓
3. Verify in browser
   ↓
4. Commit changes
   ↓
5. Push to GitHub
   ↓
6. GitHub Actions deploys
   ↓
7. Live in production
```

## Technology Choices Rationale

### Why FastAPI?
- Fast, modern Python framework
- Automatic API documentation
- Type hints for safety
- Easy to deploy

### Why Vanilla JavaScript?
- No build step needed
- Faster load times
- Easier to understand
- No framework lock-in

### Why GitHub Pages?
- Free hosting
- Automatic deployments
- CDN included
- Custom domains supported

### Why No Database?
- Simple architecture
- No maintenance
- Fast reads
- Version controlled data
