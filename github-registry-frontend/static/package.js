// API base URL
const API_BASE = 'api';

// Get package from URL
const urlParams = new URLSearchParams(window.location.search);
const packageName = urlParams.get('pkg');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!packageName) {
        showError();
        return;
    }
    
    const [namespace, name] = packageName.split('/');
    if (!namespace || !name) {
        showError();
        return;
    }
    
    loadPackage(namespace, name);
    setupTabs();
});

// Setup tabs
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active pane
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            document.getElementById(`${tabName}Tab`).classList.add('active');
        });
    });
}

// Load package details
async function loadPackage(namespace, name) {
    const loadingState = document.getElementById('loadingState');
    const packageContent = document.getElementById('packageContent');
    const errorState = document.getElementById('errorState');
    
    loadingState.style.display = 'block';
    packageContent.style.display = 'none';
    errorState.style.display = 'none';
    
    try {
        const response = await fetch(`api/packages/${namespace}/${name}.json`);
        
        if (!response.ok) {
            throw new Error('Package not found');
        }
        
        const pkg = await response.json();
        renderPackage(pkg);
        
        loadingState.style.display = 'none';
        packageContent.style.display = 'block';
    } catch (error) {
        console.error('Failed to load package:', error);
        showError();
    }
}

// Render package details
function renderPackage(pkg) {
    const fullName = `${pkg.namespace}/${pkg.name}`;
    
    // Header
    document.getElementById('packageName').textContent = fullName;
    document.getElementById('packageType').textContent = pkg.type;
    document.getElementById('packageDescription').textContent = pkg.description;
    document.getElementById('packageVersion').textContent = `v${pkg.latest_version}`;
    document.getElementById('packageOwner').textContent = pkg.owner || pkg.namespace;
    document.getElementById('packageDownloads').textContent = pkg.total_downloads.toLocaleString();
    
    // Tags
    const tagsHtml = pkg.tags.map(tag => 
        `<span class="tag">${escapeHtml(tag)}</span>`
    ).join('');
    document.getElementById('packageTags').innerHTML = tagsHtml;
    
    // Install command
    const installCmd = `ara install ${fullName}`;
    document.getElementById('installCommand').textContent = installCmd;
    
    // Versions
    renderVersions(pkg.versions);
    
    // Metadata
    renderMetadata(pkg);
}

// Render versions list
function renderVersions(versions) {
    const versionsList = document.getElementById('versionsList');
    
    const versionsHtml = versions.map(version => `
        <div class="version-item">
            <span class="version-number">v${escapeHtml(version)}</span>
        </div>
    `).join('');
    
    versionsList.innerHTML = versionsHtml;
}

// Render metadata
function renderMetadata(pkg) {
    document.getElementById('metaAuthor').textContent = pkg.author || 'N/A';
    document.getElementById('metaLicense').textContent = pkg.license || 'N/A';
    
    // Homepage
    const homepageEl = document.getElementById('metaHomepage');
    if (pkg.homepage) {
        homepageEl.innerHTML = `<a href="${escapeHtml(pkg.homepage)}" target="_blank">${escapeHtml(pkg.homepage)}</a>`;
    } else {
        homepageEl.textContent = 'N/A';
    }
    
    // Repository
    const repoEl = document.getElementById('metaRepository');
    if (pkg.repository) {
        repoEl.innerHTML = `<a href="${escapeHtml(pkg.repository)}" target="_blank">${escapeHtml(pkg.repository)}</a>`;
    } else {
        repoEl.textContent = 'N/A';
    }
    
    // Dates
    document.getElementById('metaCreated').textContent = formatDate(pkg.created_at);
    document.getElementById('metaUpdated').textContent = formatDate(pkg.updated_at);
}

// Copy install command
function copyInstallCommand() {
    const command = document.getElementById('installCommand').textContent;
    navigator.clipboard.writeText(command).then(() => {
        const button = document.querySelector('.copy-button');
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    });
}

// Show error state
function showError() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('packageContent').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
}

// Utility: Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
