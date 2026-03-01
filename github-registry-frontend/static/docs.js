// Fetch and render documentation
document.addEventListener('DOMContentLoaded', async () => {
    const docsContainer = document.getElementById('docsMarkdown');
    
    try {
        // Fetch the README from GitHub
        const response = await fetch('https://raw.githubusercontent.com/2018-lonely-droid/ara-registry-github-starter/main/github-registry/README.md');
        
        if (!response.ok) {
            throw new Error('Failed to load documentation');
        }
        
        const markdown = await response.text();
        
        // Wait for marked.js to load
        if (typeof marked === 'undefined') {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
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
                <p>Failed to load documentation.</p>
                <p><a href="https://github.com/2018-lonely-droid/ara-registry-github-starter/blob/main/github-registry/README.md" target="_blank">View on GitHub</a></p>
            </div>
        `;
    }
});
