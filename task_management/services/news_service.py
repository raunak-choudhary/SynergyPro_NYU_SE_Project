from django.db import IntegrityError
from datetime import datetime, timedelta
from django.core.cache import cache
import feedparser
import random
import json
from .date_formatter import DateFormatter
from .article_summaries import ArticleSummaryGenerator
from ..models.help_center_models import ProfileKeywords, DailyArticleSelection

class NewsService:
    def __init__(self):
        self.medium_base_url = "https://medium.com/feed/tag/{}"
        self.date_formatter = DateFormatter()
        self.summary_generator = ArticleSummaryGenerator()

    def get_daily_keywords(self, profile_type):
        """Get or set cached daily keywords"""
        cache_key = f'daily_keywords_{profile_type}_{datetime.now().date()}'
        
        cached_keywords = cache.get(cache_key)
        if cached_keywords:
            return json.loads(cached_keywords)
            
        all_keywords = list(ProfileKeywords.objects.filter(
            profile_type=profile_type
        ).values_list('keyword', flat=True))
        
        daily_keywords = random.sample(all_keywords, 10)
        cache.set(cache_key, json.dumps(daily_keywords), 86400)
        
        return daily_keywords

    def get_claps_count(self, entry):
        """Extract and format claps count from Medium entry"""
        try:
            # Try to get claps from different possible Medium feed formats
            if hasattr(entry, 'objectID'):
                return int(entry.get('claps', 0))
            elif hasattr(entry, 'value'):
                return int(entry.get('recommends', 0))
            else:
                # Generate random claps for testing (remove in production)
                return random.randint(50, 5000)
        except (AttributeError, ValueError):
            return 0

    def fetch_medium_articles(self, profile_type):
        """Fetch articles for daily keywords with article pools"""
        print(f"Starting article fetch for profile: {profile_type}")
        
        today = datetime.now().date()
        cache_key = f'daily_articles_{profile_type}_{today}'

        cached_articles = cache.get(cache_key)
        if cached_articles:
            print("Found cached articles")
            cached_data = json.loads(cached_articles)
            # Return just the selected articles for initial display
            return cached_data['selected']

        # Get all keywords for the profile type
        all_keywords = self.get_daily_keywords(profile_type)
        # Randomly select 10 keywords if we have more than 10
        keywords = random.sample(all_keywords, min(10, len(all_keywords)))
        print(f"Selected keywords: {keywords}")
        
        articles_by_category = {}  # Store up to 10 articles per category
        
        for keyword in keywords:
            try:
                print(f"Fetching articles for keyword: {keyword}")
                formatted_keyword = keyword.replace(' ', '-')
                feed_url = f"{self.medium_base_url.format(formatted_keyword)}"
                
                feed = feedparser.parse(feed_url)
                category_articles = []
                
                # Get up to 10 articles per category
                for entry in feed.entries[:10]:  # Limit to 10 articles per category
                    if not self.is_english_content(entry):
                        continue

                    formatted_date = self.date_formatter.format_date(entry)
                    if not formatted_date:
                        formatted_date = datetime.now().strftime('%a, %d %b %Y %H:%M:%S GMT')

                    claps_count = self.get_claps_count(entry)
                    
                    article_data = {
                        'title': entry.title,
                        'url': entry.link,
                        'claps_count': claps_count,
                        'published_date': formatted_date,
                        'category': keyword.upper(),
                        'highlight': self.summary_generator.get_article_summary(keyword, entry.title)
                    }
                    
                    try:
                        DailyArticleSelection.objects.create(
                            profile_type=profile_type,
                            date=today,
                            **article_data
                        )
                        category_articles.append(article_data)
                        print(f"Added article: {article_data['title']} with {claps_count} claps")
                    except IntegrityError:
                        print(f"Duplicate article skipped")
                        continue

                if category_articles:
                    # Ensure we have exactly 10 articles per category (or less if not enough found)
                    articles_by_category[keyword] = category_articles[:10]
                    
            except Exception as e:
                print(f"Error fetching articles for keyword {keyword}: {str(e)}")
                continue

        # Select one initial article from each category's pool
        selected_articles = []
        for keyword in keywords:
            if keyword in articles_by_category and articles_by_category[keyword]:
                # Take the first article from each category's pool
                selected_articles.append(articles_by_category[keyword][0])
            else:
                # Fallback article if none found
                fallback_data = {
                    'title': f'Latest Insights on {keyword.title()}',
                    'url': f'https://medium.com/tag/{keyword.replace(" ", "-")}',
                    'claps_count': random.randint(50, 500),
                    'published_date': datetime.now().strftime('%a, %d %b %Y %H:%M:%S GMT'),
                    'category': keyword.upper(),
                    'highlight': self.summary_generator.get_article_summary(keyword, '')
                }
                
                try:
                    DailyArticleSelection.objects.create(
                        profile_type=profile_type,
                        date=today,
                        **fallback_data
                    )
                    selected_articles.append(fallback_data)
                    # Also add fallback to the category pool
                    articles_by_category[keyword] = [fallback_data]
                except IntegrityError:
                    continue

        # Prepare cache data structure
        cache_data = {
            'selected': selected_articles[:10],  # Initial articles for display
            'pools': articles_by_category        # Full pools for article rotation
        }
        
        # Cache both selected articles and pools
        cache.set(cache_key, json.dumps(cache_data), 86400)  # Cache for 24 hours
        print(f"Cached {len(selected_articles)} articles with their pools")

        print("\n=== Article Pools Summary ===")
        for keyword, articles in articles_by_category.items():
            print(f"\nCategory: {keyword.upper()}")
            print(f"Number of articles: {len(articles)}")
            for idx, article in enumerate(articles, 1):
                print(f"{idx}. {article['title']} ({article['claps_count']} claps)")
        print("\n=========================\n")

        # Add logging before caching
        print("\n=== Cache Data Summary ===")
        print(f"Total categories: {len(articles_by_category)}")
        for keyword, articles in articles_by_category.items():
            print(f"{keyword}: {len(articles)} articles")
        print("=========================\n")

        # Return just the selected articles for initial display
        return selected_articles[:10]
    
    def is_english_content(self, entry):
        """Check if content is in English"""
        if hasattr(entry, 'lang'):
            return entry.lang == 'en'
        title = entry.title.lower()
        english_indicators = ['the', 'and', 'or', 'to', 'a', 'in', 'that', 'for']
        return any(word in title for word in english_indicators)