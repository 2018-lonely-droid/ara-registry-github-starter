// Get owner from URL
const urlParams = new URLSearchParams(window.location.search);
const ownerName = urlParams.get('owner');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!ownerName) {
        window.location.href = 'index.html';
        return;
    }
    
    loadOwnerPackages();
});

// Load owner packages
async function loadOwnerPackages() {
    const loadingState = document.getElementById('loadingState');
    const packagesGrid = document.getElementById('packagesGrid');
    
    console.log('Loading packages for owner:', ownerName);
    
    loadingState.style.display = 'block';
    packagesGrid.style.display = 'none';
    
    try {
        console.log('Fetching api/packages.json');
        const response = await fetch('api/packages.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Loaded packages:', data.packages.length);
        console.log('All packages:', data.packages);
        
        // Filter packages by owner/namespace
        const ownerPackages = data.packages.filter(pkg => {
            const matches = pkg.namespace === ownerName || (pkg.owner && pkg.owner === ownerName);
            console.log(`Package ${pkg.namespace}/${pkg.name}: namespace=${pkg.namespace}, owner=${pkg.owner}, matches=${matches}`);
            return matches;
        });
        
        console.log('Owner packages found:', ownerPackages.length);
        
        if (ownerPackages.length === 0) {
            showEmptyState();
            return;
        }
        
        // Update header
        document.getElementById('ownerName').textContent = ownerName;
        const totalDownloads = ownerPackages.reduce((sum, pkg) => sum + pkg.total_downloads, 0);
        document.getElementById('ownerStats').textContent = 
            `${ownerPackages.length} package${ownerPackages.length !== 1 ? 's' : ''} · ${totalDownloads} total downloads`;
        
        renderPackages(ownerPackages);
    } catch (error) {
        console.error('Failed to load packages:', error);
        showEmptyState();
    } finally {
        loadingState.style.display = 'none';
    }
}

// Render packages
function renderPackages(packages) {
    const packagesGrid = document.getElementById('packagesGrid');
    const emptyState = document.getElementById('emptyState');
    
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
    const loadingState = document.getElementById('loadingState');
    
    loadingState.style.display = 'none';
    packagesGrid.style.display = 'none';
    emptyState.style.display = 'block';
    
    // Update header with owner name even if no packages
    document.getElementById('ownerName').textContent = ownerName;
    document.getElementById('ownerStats').textContent = 'No packages found';
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
