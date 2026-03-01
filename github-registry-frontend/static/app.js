// API base URL
const API_BASE = 'api';

// State
let allPackages = [];
let allTags = [];
let allNamespaces = [];
let currentFilters = {
    query: '',
    type: '',
    tags: [],
    namespace: '',
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
    // Search input with autocomplete
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce((e) => {
        currentFilters.query = e.target.value;
        updateClearButton();
        showSuggestions(e.target.value);
        filterAndRenderPackages();
    }, 200));
    
    // Clear search button
    const clearSearch = document.getElementById('clearSearch');
    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        currentFilters.query = '';
        updateClearButton();
        hideSuggestions();
        filterAndRenderPackages();
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            hideSuggestions();
        }
    });
    
    // Type filters
    const typeFilters = document.querySelectorAll('#typeFilters .pill');
    typeFilters.forEach(pill => {
        pill.addEventListener('click', () => {
            typeFilters.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilters.type = pill.dataset.type;
            updateActiveFilters();
            filterAndRenderPackages();
        });
    });
    
    // Namespace select
    const namespaceSelect = document.getElementById('namespaceSelect');
    namespaceSelect.addEventListener('change', (e) => {
        currentFilters.namespace = e.target.value;
        updateActiveFilters();
        filterAndRenderPackages();
    });
    
    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.addEventListener('change', (e) => {
        currentFilters.sort = e.target.value;
        filterAndRenderPackages();
    });
    
    // Clear all filters
    const clearFilters = document.getElementById('clearFilters');
    clearFilters.addEventListener('click', () => {
        // Reset all filters
        currentFilters = {
            query: '',
            type: '',
            tags: [],
            namespace: '',
            sort: 'updated'
        };
        
        // Reset UI
        searchInput.value = '';
        typeFilters.forEach(p => p.classList.remove('active'));
        typeFilters[0].classList.add('active');
        namespaceSelect.value = '';
        sortSelect.value = 'updated';
        
        // Clear active tags
        document.querySelectorAll('#popularTags .pill').forEach(pill => {
            pill.classList.remove('active');
        });
        
        updateClearButton();
        updateActiveFilters();
        filterAndRenderPackages();
    });
}

// Load stats
async function loadStats() {
    try {
        const response = await fetch('api/stats.json');
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
        const response = await fetch('api/packages.json');
        const data = await response.json();
        allPackages = data.packages;
        
        // Extract tags and namespaces
        extractTagsAndNamespaces();
        populateFilters();
        
        filterAndRenderPackages();
    } catch (error) {
        console.error('Failed to load packages:', error);
        showEmptyState();
    } finally {
        loadingState.style.display = 'none';
    }
}

// Extract tags and namespaces from packages
function extractTagsAndNamespaces() {
    const tagsSet = new Set();
    const namespacesSet = new Set();
    
    allPackages.forEach(pkg => {
        pkg.tags.forEach(tag => tagsSet.add(tag));
        namespacesSet.add(pkg.namespace);
    });
    
    allTags = Array.from(tagsSet).sort();
    allNamespaces = Array.from(namespacesSet).sort();
}

// Populate filter dropdowns and tags
function populateFilters() {
    // Populate namespace select
    const namespaceSelect = document.getElementById('namespaceSelect');
    allNamespaces.forEach(ns => {
        const option = document.createElement('option');
        option.value = ns;
        option.textContent = ns;
        namespaceSelect.appendChild(option);
    });
    
    // Populate popular tags (top 10)
    const tagCounts = {};
    allPackages.forEach(pkg => {
        pkg.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });
    
    const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag);
    
    const popularTagsContainer = document.getElementById('popularTags');
    sortedTags.forEach(tag => {
        const pill = document.createElement('button');
        pill.className = 'pill';
        pill.textContent = tag;
        pill.dataset.tag = tag;
        pill.addEventListener('click', () => {
            pill.classList.toggle('active');
            toggleTagFilter(tag);
        });
        popularTagsContainer.appendChild(pill);
    });
}

// Toggle tag filter
function toggleTagFilter(tag) {
    const index = currentFilters.tags.indexOf(tag);
    if (index > -1) {
        currentFilters.tags.splice(index, 1);
    } else {
        currentFilters.tags.push(tag);
    }
    updateActiveFilters();
    filterAndRenderPackages();
}

// Show search suggestions
function showSuggestions(query) {
    if (!query || query.length < 2) {
        hideSuggestions();
        return;
    }
    
    const suggestionsEl = document.getElementById('searchSuggestions');
    const packageSuggestions = document.getElementById('packageSuggestions');
    const tagSuggestions = document.getElementById('tagSuggestions');
    const namespaceSuggestions = document.getElementById('namespaceSuggestions');
    
    const q = query.toLowerCase();
    
    // Find matching packages
    const matchingPackages = allPackages
        .filter(pkg => 
            pkg.name.toLowerCase().includes(q) ||
            pkg.description.toLowerCase().includes(q) ||
            pkg.namespace.toLowerCase().includes(q)
        )
        .slice(0, 5);
    
    // Find matching tags
    const matchingTags = allTags
        .filter(tag => tag.toLowerCase().includes(q))
        .slice(0, 5);
    
    // Find matching namespaces
    const matchingNamespaces = allNamespaces
        .filter(ns => ns.toLowerCase().includes(q))
        .slice(0, 5);
    
    // Render package suggestions
    if (matchingPackages.length > 0) {
        packageSuggestions.innerHTML = matchingPackages.map(pkg => `
            <div class="suggestion-item" onclick="goToPackage('${pkg.namespace}/${pkg.name}')">
                <span class="suggestion-icon">📦</span>
                <div class="suggestion-text">
                    <div class="suggestion-name">${escapeHtml(pkg.namespace)}/${escapeHtml(pkg.name)}</div>
                    <div class="suggestion-meta">${escapeHtml(pkg.description.substring(0, 60))}...</div>
                </div>
            </div>
        `).join('');
    } else {
        packageSuggestions.innerHTML = '<div style="padding: 8px; color: var(--text-secondary); font-size: 13px;">No packages found</div>';
    }
    
    // Render tag suggestions
    if (matchingTags.length > 0) {
        tagSuggestions.innerHTML = matchingTags.map(tag => `
            <span class="suggestion-tag" onclick="selectTagSuggestion('${escapeHtml(tag)}')">${escapeHtml(tag)}</span>
        `).join(' ');
    } else {
        tagSuggestions.innerHTML = '<div style="padding: 8px; color: var(--text-secondary); font-size: 13px;">No tags found</div>';
    }
    
    // Render namespace suggestions
    if (matchingNamespaces.length > 0) {
        namespaceSuggestions.innerHTML = matchingNamespaces.map(ns => `
            <div class="suggestion-item" onclick="selectNamespaceSuggestion('${escapeHtml(ns)}')">
                <span class="suggestion-icon">📁</span>
                <div class="suggestion-text">
                    <div class="suggestion-name">${escapeHtml(ns)}</div>
                </div>
            </div>
        `).join('');
    } else {
        namespaceSuggestions.innerHTML = '<div style="padding: 8px; color: var(--text-secondary); font-size: 13px;">No namespaces found</div>';
    }
    
    suggestionsEl.style.display = 'block';
}

// Hide suggestions
function hideSuggestions() {
    document.getElementById('searchSuggestions').style.display = 'none';
}

// Go to package detail
function goToPackage(fullName) {
    window.location.href = `package.html?pkg=${encodeURIComponent(fullName)}`;
}

// Select tag suggestion
function selectTagSuggestion(tag) {
    if (!currentFilters.tags.includes(tag)) {
        currentFilters.tags.push(tag);
        
        // Activate the pill if it exists
        const pill = document.querySelector(`#popularTags .pill[data-tag="${tag}"]`);
        if (pill) {
            pill.classList.add('active');
        }
        
        updateActiveFilters();
        filterAndRenderPackages();
    }
    hideSuggestions();
}

// Select namespace suggestion
function selectNamespaceSuggestion(namespace) {
    currentFilters.namespace = namespace;
    document.getElementById('namespaceSelect').value = namespace;
    updateActiveFilters();
    filterAndRenderPackages();
    hideSuggestions();
}

// Update clear button visibility
function updateClearButton() {
    const clearButton = document.getElementById('clearSearch');
    const searchInput = document.getElementById('searchInput');
    clearButton.style.display = searchInput.value ? 'flex' : 'none';
}

// Update active filters display
function updateActiveFilters() {
    const activeFiltersEl = document.getElementById('activeFilters');
    const activeFiltersListEl = document.getElementById('activeFiltersList');
    const clearFiltersBtn = document.getElementById('clearFilters');
    
    const activeFilters = [];
    
    if (currentFilters.type) {
        activeFilters.push({ type: 'type', value: currentFilters.type, label: currentFilters.type });
    }
    
    if (currentFilters.namespace) {
        activeFilters.push({ type: 'namespace', value: currentFilters.namespace, label: `namespace: ${currentFilters.namespace}` });
    }
    
    currentFilters.tags.forEach(tag => {
        activeFilters.push({ type: 'tag', value: tag, label: `tag: ${tag}` });
    });
    
    if (activeFilters.length > 0) {
        activeFiltersEl.style.display = 'flex';
        clearFiltersBtn.style.display = 'block';
        
        activeFiltersListEl.innerHTML = activeFilters.map(filter => `
            <div class="active-filter-tag">
                ${escapeHtml(filter.label)}
                <span class="active-filter-remove" onclick="removeFilter('${filter.type}', '${escapeHtml(filter.value)}')">✕</span>
            </div>
        `).join('');
    } else {
        activeFiltersEl.style.display = 'none';
        clearFiltersBtn.style.display = 'none';
    }
}

// Remove individual filter
function removeFilter(type, value) {
    if (type === 'type') {
        currentFilters.type = '';
        document.querySelectorAll('#typeFilters .pill').forEach(p => p.classList.remove('active'));
        document.querySelector('#typeFilters .pill[data-type=""]').classList.add('active');
    } else if (type === 'namespace') {
        currentFilters.namespace = '';
        document.getElementById('namespaceSelect').value = '';
    } else if (type === 'tag') {
        const index = currentFilters.tags.indexOf(value);
        if (index > -1) {
            currentFilters.tags.splice(index, 1);
        }
        const pill = document.querySelector(`#popularTags .pill[data-tag="${value}"]`);
        if (pill) {
            pill.classList.remove('active');
        }
    }
    
    updateActiveFilters();
    filterAndRenderPackages();
}

// Filter and render packages
function filterAndRenderPackages() {
    let filtered = [...allPackages];
    
    // Apply type filter
    if (currentFilters.type) {
        filtered = filtered.filter(pkg => pkg.type === currentFilters.type);
    }
    
    // Apply namespace filter
    if (currentFilters.namespace) {
        filtered = filtered.filter(pkg => pkg.namespace === currentFilters.namespace);
    }
    
    // Apply tag filters
    if (currentFilters.tags.length > 0) {
        filtered = filtered.filter(pkg => 
            currentFilters.tags.some(tag => pkg.tags.includes(tag))
        );
    }
    
    // Apply search query
    if (currentFilters.query) {
        const query = currentFilters.query.toLowerCase();
        filtered = filtered.filter(pkg => 
            pkg.name.toLowerCase().includes(query) ||
            pkg.description.toLowerCase().includes(query) ||
            pkg.namespace.toLowerCase().includes(query) ||
            pkg.tags.some(tag => tag.toLowerCase().includes(query))
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
