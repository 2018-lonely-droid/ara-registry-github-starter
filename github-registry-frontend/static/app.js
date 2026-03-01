// API base URL
const API_BASE = '/api';

// State
let allPackages = [];
let currentFilters = {
    query: '',
    type: '',
    sort: 'updated'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadPackages();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce((e) => {
        currentFilters.query = e.target.value;
        filterAndRenderPackages();
    }, 300));
    
    // Type filters
    const typeFilters = document.querySelectorAll('#typeFilters .pill');
    typeFilters.forEach(pill => {
        pill.addEventListener('click', () => {
            typeFilters.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilters.type = pill.dataset.type;
            filterAndRenderPackages();
        });
    });
    
    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.addEventListener('change', (e) => {
        currentFilters.sort = e.target.value;
        filterAndRenderPackages();
    });
}

// Load stats
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const data = await response.json();
        
        animateCounter('totalPackages', data.total_packages);
        animateCounter('totalDownloads', data.total_downloads);
        animateCounter('totalNamespaces', data.total_namespaces);
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Load packages
async function loadPackages() {
    const loadingState = document.getElementById('loadingState');
    const packagesGrid = document.getElementById('packagesGrid');
    
    loadingState.style.display = 'block';
    packagesGrid.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE}/packages?limit=500`);
        const data = await response.json();
        allPackages = data.packages;
        
        filterAndRenderPackages();
    } catch (error) {
        console.error('Failed to load packages:', error);
        showEmptyState();
    } finally {
        loadingState.style.display = 'none';
    }
}

// Filter and render packages
function filterAndRenderPackages() {
    let filtered = [...allPackages];
    
    // Apply type filter
    if (currentFilters.type) {
        filtered = filtered.filter(pkg => pkg.type === currentFilters.type);
    }
    
    // Apply search query
    if (currentFilters.query) {
        const query = currentFilters.query.toLowerCase();
        filtered = filtered.filter(pkg => 
            pkg.name.toLowerCase().includes(query) ||
            pkg.description.toLowerCase().includes(query) ||
            pkg.namespace.toLowerCase().includes(query)
        );
    }
    
    // Apply sort
    filtered.sort((a, b) => {
        switch (currentFilters.sort) {
            case 'updated':
                return new Date(b.updated_at) - new Date(a.updated_at);
            case 'created':
                return new Date(b.created_at) - new Date(a.created_at);
            case 'downloads':
                return b.total_downloads - a.total_downloads;
            case 'name':
                return `${a.namespace}/${a.name}`.localeCompare(`${b.namespace}/${b.name}`);
            default:
                return 0;
        }
    });
    
    renderPackages(filtered);
}

// Render packages
function renderPackages(packages) {
    const packagesGrid = document.getElementById('packagesGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (packages.length === 0) {
        packagesGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    packagesGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    packagesGrid.innerHTML = packages.map(pkg => createPackageCard(pkg)).join('');
}

// Create package card HTML
function createPackageCard(pkg) {
    const fullName = `${pkg.namespace}/${pkg.name}`;
    const tags = pkg.tags.slice(0, 3).map(tag => 
        `<span class="tag">${escapeHtml(tag)}</span>`
    ).join('');
    
    const moreTagsCount = pkg.tags.length > 3 ? pkg.tags.length - 3 : 0;
    const moreTags = moreTagsCount > 0 ? `<span class="tag">+${moreTagsCount} more</span>` : '';
    
    return `
        <a href="/package.html?pkg=${encodeURIComponent(fullName)}" class="package-card">
            <div class="package-card-header">
                <div>
                    <div class="package-name">${escapeHtml(fullName)}</div>
                    <div class="package-version">v${escapeHtml(pkg.latest_version)}</div>
                </div>
                <span class="package-type">${escapeHtml(pkg.type)}</span>
            </div>
            <p class="package-description">${escapeHtml(pkg.description)}</p>
            <div class="package-tags">
                ${tags}
                ${moreTags}
            </div>
            <div class="package-footer">
                <span>📥 ${pkg.total_downloads} downloads</span>
                <span>${formatDate(pkg.updated_at)}</span>
            </div>
        </a>
    `;
}

// Show empty state
function showEmptyState() {
    const packagesGrid = document.getElementById('packagesGrid');
    const emptyState = document.getElementById('emptyState');
    
    packagesGrid.style.display = 'none';
    emptyState.style.display = 'block';
}

// Animate counter
function animateCounter(elementId, target) {
    const element = document.getElementById(elementId);
    const duration = 1000;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, duration / steps);
}

// Utility: Debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Utility: Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
