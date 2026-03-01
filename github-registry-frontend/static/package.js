// Get package from URL
const urlParams = new URLSearchParams(window.location.search);
const packageName = urlParams.get('pkg');
const requestedVersion = urlParams.get('version');
let currentPackageData = null;

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
    currentPackageData = pkg;
    const fullName = `${pkg.namespace}/${pkg.name}`;
    
    // Use requested version if provided, otherwise use latest
    const displayVersion = requestedVersion && pkg.versions.includes(requestedVersion) 
        ? requestedVersion 
        : pkg.latest_version;
    
    // Header
    document.getElementById('packageName').textContent = fullName;
    document.getElementById('packageType').textContent = pkg.type;
    document.getElementById('packageVersion').textContent = `v${displayVersion}`;
    document.getElementById('packageDownloads').textContent = pkg.total_downloads.toLocaleString();
    
    // Owner link
    const ownerLink = document.getElementById('packageOwnerLink');
    const owner = pkg.owner || pkg.namespace;
    ownerLink.textContent = owner;
    ownerLink.href = `owner.html?owner=${encodeURIComponent(owner)}`;
    
    // Summary
    document.getElementById('packageDescription').textContent = pkg.description;
    
    // Tags
    const tagsHtml = pkg.tags.map(tag => 
        `<span class="tag">${escapeHtml(tag)}</span>`
    ).join('');
    document.getElementById('packageTags').innerHTML = tagsHtml;
    
    // Package contents
    renderPackageContents(pkg, displayVersion);
    
    // Install command
    const installCmd = `ara install ${fullName}`;
    document.getElementById('installCommand').textContent = installCmd;
    
    // Versions
    renderVersions(pkg.versions, displayVersion);
    
    // Metadata
    renderMetadata(pkg);
}

// Render package contents
function renderPackageContents(pkg, displayVersion) {
    const contentsEl = document.getElementById('contentsInfo');
    
    let html = '<div class="contents-list">';
    
    // Type-specific content description
    switch(pkg.type) {
        case 'kiro-agent':
            html += '<p>This package contains a Kiro custom agent configuration with prompts, tools, and behaviors.</p>';
            break;
        case 'mcp-server':
            html += '<p>This package contains a Model Context Protocol server that extends AI capabilities.</p>';
            break;
        case 'context':
            html += '<p>This package contains knowledge files, prompt templates, and reference materials.</p>';
            break;
        case 'skill':
            html += '<p>This package contains procedural knowledge via SKILL.md that agents load dynamically.</p>';
            break;
        case 'kiro-powers':
            html += '<p>This package contains MCP tools, steering files and hooks that give agents specialized knowledge.</p>';
            break;
        case 'kiro-steering':
            html += '<p>This package contains Kiro persistent knowledge about your projects.</p>';
            break;
        case 'agents-md':
            html += '<p>This package uses the AGENTS.md format for guiding coding agents.</p>';
            break;
    }
    
    html += `<ul class="package-info-list">`;
    html += `<li><strong>Package Type:</strong> ${escapeHtml(pkg.type)}</li>`;
    html += `<li><strong>Selected Version:</strong> v${escapeHtml(displayVersion)}</li>`;
    html += `<li><strong>Latest Version:</strong> v${escapeHtml(pkg.latest_version)}</li>`;
    html += `<li><strong>Total Versions:</strong> ${pkg.versions.length}</li>`;
    if (pkg.license) {
        html += `<li><strong>License:</strong> ${escapeHtml(pkg.license)}</li>`;
    }
    html += `</ul></div>`;
    
    contentsEl.innerHTML = html;
}

// Render versions list
function renderVersions(versions, currentVersion) {
    const versionsList = document.getElementById('versionsList');
    
    const versionsHtml = versions.map(version => {
        const isActive = version === currentVersion;
        return `
            <div class="version-item ${isActive ? 'version-active' : ''}" onclick="selectVersion('${escapeHtml(version)}')">
                <span class="version-number">v${escapeHtml(version)}</span>
                ${isActive ? '<span class="version-badge">Current</span>' : ''}
            </div>
        `;
    }).join('');
    
    versionsList.innerHTML = versionsHtml;
}

// Select a version
function selectVersion(version) {
    if (!currentPackageData) return;
    
    // Update URL with version parameter
    const [namespace, name] = packageName.split('/');
    const newUrl = `${window.location.pathname}?pkg=${encodeURIComponent(packageName)}&version=${encodeURIComponent(version)}`;
    window.history.pushState({}, '', newUrl);
    
    // Update the displayed version in header
    document.getElementById('packageVersion').textContent = `v${version}`;
    
    // Update package contents section with new version
    renderPackageContents(currentPackageData, version);
    
    // Update active version in sidebar
    document.querySelectorAll('.version-item').forEach(item => {
        item.classList.remove('version-active');
        const itemVersion = item.querySelector('.version-number').textContent.replace('v', '');
        if (itemVersion === version) {
            item.classList.add('version-active');
        }
    });
    
    console.log(`Switched to version ${version}`);
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
