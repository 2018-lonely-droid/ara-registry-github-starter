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
        
        // Convert markdown to HTML (simple conversion)
        const html = convertMarkdownToHTML(markdown);
        
        docsContainer.innerHTML = html;
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

// Simple markdown to HTML converter
function convertMarkdownToHTML(markdown) {
    let html = markdown;
    
    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Paragraphs
    html = html.split('\n\n').map(para => {
        if (para.startsWith('<h') || para.startsWith('<pre') || para.startsWith('<ul') || para.startsWith('<ol')) {
            return para;
        }
        return `<p>${para}</p>`;
    }).join('\n');
    
    return html;
}
