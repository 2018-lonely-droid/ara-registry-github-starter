// State
let allNamespaces = [];
let currentSort = 'name';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Namespaces page loaded');
    loadNamespaces();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderNamespaces();
        });
    }
}

// Load namespaces
async function loadNamespaces() {
    const loadingState = document.getElementById('loadingState');
    const namespacesGrid = document.getElementById('namespacesGrid');
    
    console.log('Loading namespaces...');
    
    if (loadingState) loadingState.style.display = 'block';
    if (namespacesGrid) namespacesGrid.style.display = 'none';
    
    try {
        console.log('Fetching api/packages.json');
        const response = await fetch('api/packages.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Loaded packages:', data.packages.length);
        
        // Group packages by namespace
        const namespaceMap = {};
        data.packages.forEach(pkg => {
            if (!namespaceMap[pkg.namespace]) {
                namespaceMap[pkg.namespace] = {
                    namespace: pkg.namespace,
                    packages: [],
                    totalDownloads: 0
                };
            }
            namespaceMap[pkg.namespace].packages.push(pkg);
            namespaceMap[pkg.namespace].totalDownloads += pkg.total_downloads;
        });
        
        allNamespaces = Object.values(namespaceMap);
        console.log('Namespaces:', allNamespaces.length);
        renderNamespaces();
    } catch (error) {
        console.error('Failed to load namespaces:', error);
        showEmptyState();
    } finally {
        if (loadingState) loadingState.style.display = 'none';
    }
}

// Render namespaces
function renderNamespaces() {
    const namespacesGrid = document.getElementById('namespacesGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (allNamespaces.length === 0) {
        namespacesGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    // Sort
    const sorted = [...allNamespaces].sort((a, b) => {
        if (currentSort === 'name') {
            return a.namespace.localeCompare(b.namespace);
        } else {
            return b.packages.length - a.packages.length;
        }
    });
    
    namespacesGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    namespacesGrid.innerHTML = sorted.map(ns => createNamespaceCard(ns)).join('');
}

// Create namespace card
function createNamespaceCard(ns) {
    return `
        <a href="owner.html?owner=${encodeURIComponent(ns.namespace)}" class="namespace-card">
            <div class="namespace-header">
                <h3 class="namespace-name">${escapeHtml(ns.namespace)}</h3>
            </div>
            <div class="namespace-stats">
                <span class="namespace-stat">📦 ${ns.packages.length} package${ns.packages.length !== 1 ? 's' : ''}</span>
                <span class="namespace-stat">📥 ${ns.totalDownloads} downloads</span>
            </div>
            <div class="namespace-packages">
                ${ns.packages.slice(0, 3).map(pkg => 
                    `<span class="namespace-package-tag">${escapeHtml(pkg.name)}</span>`
                ).join('')}
                ${ns.packages.length > 3 ? `<span class="namespace-package-tag">+${ns.packages.length - 3} more</span>` : ''}
            </div>
        </a>
    `;
}

// Show empty state
function showEmptyState() {
    const namespacesGrid = document.getElementById('namespacesGrid');
    const emptyState = document.getElementById('emptyState');
    
    namespacesGrid.style.display = 'none';
    emptyState.style.display = 'block';
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
