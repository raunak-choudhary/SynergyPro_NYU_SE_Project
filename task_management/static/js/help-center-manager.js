class HelpCenterManager {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.initializeSearch();
        this.articlePools = new Map();
        this.currentPositions = new Map();
        this.isAnimating = false;
    }

    initializeElements() {
        // Search elements
        this.searchInput = document.querySelector('.help-search-input');
        this.learningPaths = document.querySelectorAll('.learning-path-card');
        this.articles = document.querySelectorAll('.article-card');
        this.tools = document.querySelectorAll('.tool-card');

        // Category filters
        this.categories = new Set();
        document.querySelectorAll('.article-category').forEach(category => {
            this.categories.add(category.textContent);
        });

        // Progress elements
        this.progressBars = document.querySelectorAll('.progress-bar');

        this.nextButtons = document.querySelectorAll('.next-article-btn');
        this.initializeArticlePools();
        this.initializeClapsTooltips();
    }

    attachEventListeners() {
        // Search functionality
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Article link tracking
        document.querySelectorAll('.article-link').forEach(link => {
            link.addEventListener('click', (e) => this.trackArticleClick(e));
        });

        // Tool download tracking
        document.querySelectorAll('.tool-download').forEach(link => {
            link.addEventListener('click', (e) => this.trackToolDownload(e));
        });

        // Next Article Button
        this.nextButtons.forEach(button => {
            button.disabled = true;  // Disable initially
            button.addEventListener('click', (e) => {
                if (!this.isAnimating && this.articlePools.size > 0) {
                    this.handleNextArticle(e);
                }
            });
        });

        fetch('/api/help-center/get-article-pools/')
        .then(response => response.json())
        .then(() => {
            this.nextButtons.forEach(button => {
                button.disabled = false;
            });
        });
    }

    initializeSearch() {
        // Initialize search index with null checks
        this.searchIndex = {
            articles: Array.from(this.articles).map(article => {
                const title = article.querySelector('h3')?.textContent || '';
                const description = article.querySelector('p')?.textContent || '';
                const category = article.querySelector('.article-category')?.textContent || '';
                
                return {
                    element: article,
                    title: title.toLowerCase(),
                    description: description.toLowerCase(),
                    category: category.toLowerCase()
                };
            }),
            // Similar pattern for other elements
            learningPaths: Array.from(this.learningPaths).map(path => ({
                element: path,
                title: path.querySelector('h3')?.textContent || '',
                description: path.querySelector('p')?.textContent || ''
            })),
            tools: Array.from(this.tools).map(tool => ({
                element: tool,
                title: tool.querySelector('h3')?.textContent || '',
                description: tool.querySelector('p')?.textContent || ''
            }))
        };
    }

    handleSearch(query) {
        query = query.toLowerCase();

        // Search in articles
        this.searchIndex.articles.forEach(item => {
            const matches = item.title.includes(query) || 
                        item.description.includes(query) || 
                        item.category.includes(query);
            item.element.style.display = matches ? 'block' : 'none';
        });

        // Search in learning paths
        this.searchIndex.learningPaths.forEach(item => {
            const matches = item.title.includes(query) || 
                        item.description.includes(query);
            item.element.style.display = matches ? 'block' : 'none';
        });

        // Search in tools
        this.searchIndex.tools.forEach(item => {
            const matches = item.title.includes(query) || 
                        item.description.includes(query);
            item.element.style.display = matches ? 'block' : 'none';
        });

        // Update sections visibility
        this.updateSectionsVisibility();
    }

    updateSectionsVisibility() {
        ['learning-paths-section', 'articles-section', 'tools-section'].forEach(sectionClass => {
            const section = document.querySelector(`.${sectionClass}`);
            const visibleItems = section.querySelectorAll('[style="display: block"]').length;
            section.style.display = visibleItems ? 'block' : 'none';
        });
    }

    initializeArticlePools() {
        console.log('Initializing article pools...');
        this.articlePools = new Map();
        this.currentPositions = new Map();
        
        fetch('/api/help-center/get-article-pools/')
            .then(response => response.json())
            .then(data => {
                console.log('Received pools data:', data);
                if (data && data.pools) {
                    Object.entries(data.pools).forEach(([category, articles]) => {
                        if (articles && Array.isArray(articles)) {
                            console.log(`Setting up pool for category: '${category}' with ${articles.length} articles`);
                            this.articlePools.set(category, articles);
                            this.currentPositions.set(category, 0);
                        }
                    });
                    console.log('Available categories after setup:', Array.from(this.articlePools.keys()));
                }
            })
            .catch(error => {
                console.error('Error fetching article pools:', error);
            });
    }

    handleNextArticle(event) {
        const button = event.currentTarget;
        const articleCard = button.closest('.article-card');
        const cardContainer = articleCard.parentElement;
        const category = articleCard.querySelector('.article-category').textContent.trim().toLowerCase();
        const isRightPanel = cardContainer.nextElementSibling !== null;

         // Debug logs
        console.log('Button clicked:', {
            button,
            articleCard,
            cardContainer,
            category,
            isRightPanel,
            pools: this.articlePools,
            hasCategory: this.articlePools.has(category),
            availableCategories: Array.from(this.articlePools.keys())
        });

        const matchingCategory = Array.from(this.articlePools.keys()).find(
            key => key.toLowerCase() === category
        );
    
        if (!this.articlePools || !matchingCategory) {
            console.error('Article pools not yet loaded or category not found:', category);
            console.log('Available categories:', Array.from(this.articlePools.keys()));
            return;
        }

        if (!this.articlePools || !this.articlePools.has(category)) {
            console.error('Article pools not yet loaded or category not found:', category);
            return;
        }
    
        if (this.isAnimating) {
            console.log('Animation in progress, skipping');
            return;
        }
    
        this.isAnimating = true;
        button.disabled = true;
    
        const pool = this.articlePools.get(matchingCategory);
        if (!pool || !pool.length) {
            console.error('No articles in pool for category:', matchingCategory);
            this.isAnimating = false;
            button.disabled = false;
            return;
        }
    
        let currentPos = this.currentPositions.get(category) || 0;
        currentPos = (currentPos + 1) % pool.length;
        this.currentPositions.set(category, currentPos);
        const nextArticle = pool[currentPos];
    
        // Create a clone of the current article card for animation
        const clone = articleCard.cloneNode(true);
        cardContainer.appendChild(clone);
    
        // Position the clone
        clone.style.position = 'absolute';
        clone.style.top = '0';
        clone.style.left = '0';
        clone.style.width = '100%';
        clone.style.zIndex = '1';
    
        // Prepare the original card with new content but hidden
        articleCard.querySelector('h3').textContent = nextArticle.title;
        articleCard.querySelector('.article-highlight').textContent = nextArticle.highlight;
        articleCard.querySelector('.article-link').href = nextArticle.url;
        
        // Update claps display
        const formattedClaps = this.formatClapsCount(nextArticle.claps_count);
        const clapsIcon = articleCard.querySelector('.clap-icon');
        const tooltip = articleCard.querySelector('.claps-tooltip');
        if (clapsIcon && tooltip) {
            clapsIcon.dataset.claps = nextArticle.claps_count;
            tooltip.textContent = `${formattedClaps} claps`;
        }
        
        articleCard.querySelector('.article-date').textContent = nextArticle.published_date;
        
        // Animate the clone out
        const slideOutAnimation = clone.animate([
            { transform: 'translateX(0)', opacity: 1 },
            { transform: `translateX(${isRightPanel ? '' : '-'}100%)`, opacity: 0 }
        ], {
            duration: 300,
            easing: 'ease-out'
        });
    
        // Animate the original card in
        const slideInAnimation = articleCard.animate([
            { transform: `translateX(${isRightPanel ? '-' : ''}100%)`, opacity: 0 },
            { transform: 'translateX(0)', opacity: 1 }
        ], {
            duration: 300,
            easing: 'ease-out'
        });
    
        slideOutAnimation.onfinish = () => {
            clone.remove();
            button.disabled = false;
            this.isAnimating = false;
        };
    }

    formatClapsCount(count) {
        count = parseInt(count) || 0;
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    }

    initializeClapsTooltips() {
        document.querySelectorAll('.claps-container').forEach(container => {
            const clapsIcon = container.querySelector('.clap-icon');
            if (clapsIcon) {
                const clapsCount = parseInt(clapsIcon.dataset.claps) || 0;
                const formattedCount = this.formatClapsCount(clapsCount);
                const tooltip = container.querySelector('.claps-tooltip');
                if (tooltip) {
                    tooltip.textContent = `${formattedCount} claps`;
                }
            }
        });
    }

    trackArticleClick(event) {
        const article = event.target.closest('.article-card');
        const articleTitle = article.querySelector('h3').textContent;
        
        this.sendAnalytics('article_click', {
            title: articleTitle,
            timestamp: new Date().toISOString()
        });
    }

    trackToolDownload(event) {
        const tool = event.target.closest('.tool-card');
        const toolTitle = tool.querySelector('h3').textContent;
        
        this.sendAnalytics('tool_download', {
            title: toolTitle,
            timestamp: new Date().toISOString()
        });
    }

    sendAnalytics(action, data) {
        fetch('/api/help-center/analytics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCsrfToken()
            },
            body: JSON.stringify({
                action,
                data
            })
        }).catch(error => console.error('Analytics error:', error));
    }

    getCsrfToken() {
        return document.cookie.split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
    }

    animateProgressBars() {
        this.progressBars.forEach(bar => {
            const targetWidth = bar.getAttribute('aria-valuenow');
            let width = 0;
            const interval = setInterval(() => {
                if (width >= targetWidth) {
                    clearInterval(interval);
                } else {
                    width++;
                    bar.style.width = width + '%';
                }
            }, 10);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new HelpCenterManager();
});