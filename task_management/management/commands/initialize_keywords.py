from django.core.management.base import BaseCommand
from task_management.models.help_center_models import ProfileKeywords
from django.db import IntegrityError

PROFILE_KEYWORDS = {
    'student': [
        'time management', 'study planning', 'task prioritization',
        'deadline management', 'project organization', 'study motivation',
        'learning efficiency', 'academic focus', 'student productivity',
        'assignment planning', 'exam preparation', 'study schedule',
        'group collaboration', 'online learning', 'academic balance',
        'stress management', 'note taking', 'research skills',
        'memory techniques', 'concentration tips', 'student workflow',
        'academic goals', 'study environment', 'learning strategy',
        'knowledge retention', 'student mindset', 'academic tracking',
        'study routine', 'student organization', 'learning productivity'
    ],
    'freelancer': [
        'project management', 'client communication', 'time tracking',
        'remote work', 'freelance productivity', 'task automation',
        'work organization', 'business planning', 'deadline tracking',
        'client management', 'workflow optimization', 'freelance tools',
        'productivity systems', 'work life balance', 'self management',
        'freelance organization', 'project tracking', 'remote collaboration',
        'business efficiency', 'workload management', 'freelance routine',
        'productivity habits', 'task scheduling', 'project coordination',
        'business workflow', 'remote productivity', 'client projects',
        'work planning', 'freelance success', 'business organization'
    ],
    'teacher': [
        'lesson planning', 'classroom management', 'teaching organization',
        'educational planning', 'academic tracking', 'student assessment',
        'curriculum planning', 'teaching schedule', 'class preparation',
        'educational workflow', 'teaching efficiency', 'academic planning',
        'student progress', 'course management', 'teaching productivity',
        'education tracking', 'classroom workflow', 'lesson preparation',
        'teaching schedule', 'academic organization', 'class management',
        'student coordination', 'curriculum tracking', 'teaching routine',
        'education planning', 'classroom efficiency', 'academic workflow',
        'teaching strategy', 'education management', 'class organization'
    ],
    'professional': [
        'work productivity', 'task management', 'project coordination',
        'meeting planning', 'workflow optimization', 'time efficiency',
        'team collaboration', 'work organization', 'deadline management',
        'professional goals', 'productivity system', 'task prioritization',
        'work scheduling', 'business planning', 'team management',
        'project tracking', 'work efficiency', 'professional development',
        'time management', 'workplace productivity', 'business workflow',
        'team coordination', 'work routine', 'professional organization',
        'productivity habits', 'workplace efficiency', 'project planning',
        'business strategy', 'work tracking', 'professional workflow'
    ],
    'hr': [
        'employee management', 'recruitment tracking', 'onboarding process',
        'hr documentation', 'performance tracking', 'employee engagement',
        'policy management', 'training coordination', 'hr scheduling',
        'talent management', 'compliance tracking', 'employee relations',
        'benefits administration', 'workforce planning', 'hr analytics',
        'personnel tracking', 'hr organization', 'employee development',
        'team building', 'workplace culture', 'career development',
        'hr productivity', 'staff management', 'employee assessment',
        'hr planning', 'workplace management', 'employee satisfaction',
        'hr efficiency', 'recruitment planning', 'workplace coordination'
    ]
}

class Command(BaseCommand):
    help = 'Initialize predefined keywords for different profile types'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting keyword initialization...')
        
        # First, clear existing keywords
        ProfileKeywords.objects.all().delete()
        self.stdout.write('Cleared existing keywords')
        
        # Initialize keywords for each profile type
        for profile_type, keywords in PROFILE_KEYWORDS.items():
            for keyword in keywords:
                try:
                    ProfileKeywords.objects.create(
                        profile_type=profile_type,
                        keyword=keyword
                    )
                except IntegrityError:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Keyword "{keyword}" already exists for {profile_type}'
                        )
                    )
                    continue
            
            count = ProfileKeywords.objects.filter(profile_type=profile_type).count()
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully initialized {count} keywords for {profile_type}'
                )
            )
        
        total_count = ProfileKeywords.objects.count()
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully initialized {total_count} keywords in total'
            )
        )