from datetime import datetime

class DateFormatter:
    @staticmethod
    def format_date(entry):
        """Format the publication date correctly"""
        try:
            # Try different date formats
            date_str = entry.get('published', '')
            for fmt in ['%a, %d %b %Y %H:%M:%S %z', '%Y-%m-%dT%H:%M:%S%z']:
                try:
                    pub_date = datetime.strptime(date_str, fmt)
                    return pub_date.strftime('%a, %d %b %Y %H:%M:%S GMT')
                except ValueError:
                    continue
            
            # If no format matches, return the original string
            return date_str
        except:
            return datetime.now().strftime('%a, %d %b %Y %H:%M:%S GMT')