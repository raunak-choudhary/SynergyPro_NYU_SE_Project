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
        
        # Try to get cached keywords
        cached_keywords = cache.get(cache_key)
        if cached_keywords:
            return json.loads(cached_keywords)
            
        # Get all keywords for this profile type
        all_keywords = list(ProfileKeywords.objects.filter(
            profile_type=profile_type
        ).values_list('keyword', flat=True))
        
        # Select 10 random keywords
        daily_keywords = random.sample(all_keywords, 10)
        
        # Cache the selection for 24 hours
        cache.set(cache_key, json.dumps(daily_keywords), 86400)
        
        return daily_keywords

    def fetch_medium_articles(self, profile_type):
        """Fetch articles for daily keywords"""
        print(f"Starting article fetch for profile: {profile_type}")
        
        today = datetime.now().date()
        cache_key = f'daily_articles_{profile_type}_{today}'

        cached_articles = cache.get(cache_key)
        if cached_articles:
            print("Found cached articles")
            return json.loads(cached_articles)

        keywords = self.get_daily_keywords(profile_type)
        print(f"Selected keywords: {keywords}")
        
        articles = []
        used_keywords = set()
        retries = 0
        max_retries = 30

        def get_publication_platform(feed_entry, feed_data):
            """Extract publication platform from feed"""
            if hasattr(feed_data, 'feed'):
                # Try to get publication from feed title
                if hasattr(feed_data.feed, 'title'):
                    feed_title = feed_data.feed.title
                    # Known Medium publications
                    known_publications = {
                        'Better Humans': ['better-humans', 'betterhumans'],
                        'Towards Data Science': ['towards-data-science', 'towardsdatascience'],
                        'The Startup': ['the-startup', 'swlh'],
                        'UX Collective': ['ux-collective', 'uxdesign'],
                        'Better Programming': ['better-programming', 'betterprogramming'],
                        'JavaScript in Plain English': ['javascript-in-plain-english'],
                        'Level Up Coding': ['level-up-coding'],
                        'Analytics Vidhya': ['analytics-vidhya'],
                        'Geek Culture': ['geek-culture'],
                        'The Writing Cooperative': ['the-writing-cooperative']
                    }
                    
                    # Check if it's a known publication
                    for pub_name, indicators in known_publications.items():
                        if any(ind in feed_title.lower() for ind in indicators):
                            return pub_name
                    
                    # If not known, clean up the feed title
                    for suffix in [' – Medium', ' - Medium', ' | Medium']:
                        if suffix in feed_title:
                            return feed_title.split(suffix)[0]
                            
            # Default publication names based on content type
            if hasattr(feed_entry, 'tags'):
                tags = [tag.term.lower() for tag in feed_entry.tags] if hasattr(feed_entry, 'tags') else []
                if 'programming' in tags or 'coding' in tags:
                    return 'Tech Blog'
                elif 'education' in tags or 'learning' in tags:
                    return 'Education Blog'
                elif 'productivity' in tags:
                    return 'Productivity Blog'
            
            return 'Medium Publication'

        while len(articles) < 10 and retries < max_retries:
            available_keywords = [k for k in keywords if k not in used_keywords]
            if not available_keywords:
                break
                    
            keyword = random.choice(available_keywords)
            used_keywords.add(keyword)
            
            try:
                print(f"Trying keyword: {keyword}")
                formatted_keyword = keyword.replace(' ', '-')
                feed_url = f"{self.medium_base_url.format(formatted_keyword)}"
                print(f"Feed URL: {feed_url}")
                
                feed = feedparser.parse(feed_url)
                print(f"Found {len(feed.entries)} entries")
                
                if feed.entries:
                    for entry in feed.entries[:3]:
                        if not self.is_english_content(entry):
                            print(f"Skipping non-English content for {keyword}")
                            continue

                        # Get formatted date using DateFormatter
                        formatted_date = self.date_formatter.format_date(entry)
                        if not formatted_date:
                            print(f"Could not format date for article, using current time")
                            formatted_date = datetime.now().strftime('%a, %d %b %Y %H:%M:%S GMT')

                        # Get publication platform
                        platform = get_publication_platform(entry, feed)
                        
                        article_data = {
                            'title': entry.title,
                            'url': entry.link,
                            'source': platform,
                            'published_date': formatted_date,
                            'category': keyword.upper(),
                            'highlight': self.summary_generator.get_article_summary(keyword, entry.title)
                        }
                        
                        print(f"Created article: {article_data['title']}")
                        print(f"Platform: {platform}")
                        print(f"Date: {formatted_date}")

                        try:
                            DailyArticleSelection.objects.create(
                                profile_type=profile_type,
                                date=today,
                                **article_data
                            )
                            articles.append(article_data)
                            print(f"Successfully added article for {keyword}")
                            break  # Found a good article for this keyword
                        except IntegrityError:
                            print(f"Duplicate article for {keyword}")
                            continue
                        
            except Exception as e:
                print(f"Error fetching articles for keyword {keyword}: {str(e)}")
            
            retries += 1

        # If we still don't have enough articles, fill with remaining keywords
        while len(articles) < 10:
            remaining_keywords = [k for k in keywords if k not in used_keywords]
            if not remaining_keywords:
                remaining_keywords = keywords
                    
            keyword = random.choice(remaining_keywords)
            current_time = datetime.now().strftime('%a, %d %b %Y %H:%M:%S GMT')
            article_data = {
                'title': f'Advanced Guide to {keyword.title()}',
                'url': f'https://medium.com/tag/{keyword.replace(" ", "-")}',
                'source': 'Medium Publication',
                'published_date': current_time,
                'category': keyword.upper(),
                'highlight': self.summary_generator.get_article_summary(keyword, '')
            }
            
            try:
                DailyArticleSelection.objects.create(
                    profile_type=profile_type,
                    date=today,
                    **article_data
                )
                articles.append(article_data)
                used_keywords.add(keyword)
            except IntegrityError:
                continue

        print(f"Total articles found: {len(articles)}")

        if articles:
            cache.set(cache_key, json.dumps(articles), 86400)
            print("Articles cached successfully")

        return articles[:10]
    
    def is_english_content(self, entry):
        """Check if content is in English"""
        if hasattr(entry, 'lang'):
            return entry.lang == 'en'
        title = entry.title.lower()
        english_indicators = ['the', 'and', 'or', 'to', 'a', 'in', 'that', 'for']
        return any(word in title for word in english_indicators)