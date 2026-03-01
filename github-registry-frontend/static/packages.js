// State
let allPackages = [];
let currentFilters = {
    type: '',
    sort: 'updated'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadPackages();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.addEventListener('change', (e) => {
        currentFilters.sort = e.target.value;
        filterAndRenderPackages();
    });
}

// Load packages
async function loadPackages() {
    const loadingState = document.getElementById('loadingState');
    const packagesGrid = document.getElementById('packagesGrid');
    
    loadingState.style.display = 'block';
    packagesGrid.style.display = 'none';
    
    try {
        const response = await fetch('api/packages.json');
        const data = await response.json();
        allPackages = data.packages;
        
        populateTypeFilters();
        filterAndRenderPackages();
    } catch (error) {
        console.error('Failed to load packages:', error);
        showEmptyState();
    } finally {
        loadingState.style.display = 'none';
    }
}

// Populate type filters
function populateTypeFilters() {
    const typeFiltersContainer = document.getElementById('typeFilters');
    const types = ['all', 'kiro-agent', 'mcp-server', 'context', 'skill', 'kiro-powers', 'kiro-steering', 'agents-md'];
    
    types.forEach(type => {
        const pill = document.createElement('button');
        pill.className = 'pill' + (type === 'all' ? ' active' : '');
        pill.textContent = type === 'all' ? 'All Types' : type;
        pill.dataset.type = type === 'all' ? '' : type;
        pill.addEventListener('click', () => {
            document.querySelectorAll('#typeFilters .pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilters.type = pill.dataset.type;
            filterAndRenderPackages();
        });
        typeFiltersContainer.appendChild(pill);
    });
}

// Filter and render packages
function filterAndRenderPackages() {
    let filtered = [...allPackages];
    
    // Apply type filter
    if (currentFilters.type) {
        filtered = filtered.filter(pkg => pkg.type === currentFilters.type);
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
        <a href="package.html?pkg=${encodeURIComponent(fullName)}" class="package-card">
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
