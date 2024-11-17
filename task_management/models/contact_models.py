from django.db import models

class ContactQuery(models.Model):
    subject = models.CharField(max_length=200)
    description = models.TextField()
    
    def __str__(self):
        return self.subject

    class Meta:
        db_table = 'contact_queries'