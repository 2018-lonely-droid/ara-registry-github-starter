// Fetch and render documentation
document.addEventListener('DOMContentLoaded', async () => {
    const docsContainer = document.getElementById('docsMarkdown');
    
    // Show loading state
    docsContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">Loading documentation...</p>';
    
    try {
        // Wait for marked.js to load
        let attempts = 0;
        while (typeof marked === 'undefined' && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof marked === 'undefined') {
            throw new Error('Markdown parser failed to load');
        }
        
        // Fetch the README from GitHub
        const response = await fetch('https://raw.githubusercontent.com/2018-lonely-droid/ara-registry-github-starter/main/github-registry/README.md');
        
        if (!response.ok) {
            throw new Error(`Failed to load documentation: ${response.status}`);
        }
        
        const markdown = await response.text();
        
        // Convert markdown to HTML using marked.js
        const html = marked.parse(markdown);
        
        docsContainer.innerHTML = html;
        
        // Add syntax highlighting class to code blocks
        docsContainer.querySelectorAll('pre code').forEach(block => {
            block.classList.add('code-block');
        });
        
    } catch (error) {
        console.error('Error loading docs:', error);
        docsContainer.innerHTML = `
            <div class="error-message">
                <p>Failed to load documentation: ${error.message}</p>
                <p><a href="https://github.com/2018-lonely-droid/ara-registry-github-starter/blob/main/github-registry/README.md" target="_blank">View on GitHub</a></p>
            </div>
        `;
    }
});
