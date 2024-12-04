class ArticleSummaryGenerator:
    @staticmethod
    def get_article_summary(keyword, title):
        """Get predefined summary based on keyword and title"""
        summaries = {
            # Student-related summaries
            'time management': "Learn effective time management techniques that help balance study, personal life, and extracurricular activities. Discover proven methods to maximize your productivity during study sessions.",
            'study planning': "Master strategic study planning approaches that help you prepare for exams and assignments systematically. Learn to create realistic study schedules that adapt to your learning style.",
            'task prioritization': "Understand how to prioritize academic tasks effectively, ensuring important deadlines are met while maintaining work quality. Learn the art of balancing urgent vs important tasks.",
            'deadline management': "Master techniques for managing multiple academic deadlines without feeling overwhelmed. Learn to create buffer times and handle multiple assignments efficiently.",
            'project organization': "Discover effective ways to organize group projects and individual assignments. Learn tools and techniques for keeping track of project milestones and deliverables.",
            'study motivation': "Find your inner drive for academic success with proven motivation techniques. Learn how to stay focused and motivated throughout your academic journey.",
            'learning efficiency': "Optimize your learning process with scientifically-proven study techniques. Learn how to absorb and retain information more effectively in less time.",
            'academic focus': "Develop stronger concentration skills for better academic performance. Learn techniques to minimize distractions and maintain focus during study sessions.",
            'student productivity': "Maximize your academic output with smart productivity strategies. Learn how to achieve more in your studies while maintaining work-life balance.",
            'assignment planning': "Master the art of breaking down complex assignments into manageable tasks. Learn to create realistic timelines for assignment completion.",
            'exam preparation': "Develop effective exam preparation strategies that reduce stress and improve performance. Learn systematic approaches to review and practice.",
            'study schedule': "Create and maintain effective study schedules that adapt to your energy levels and commitments. Learn to optimize your study time allocation.",
            'group collaboration': "Master the skills needed for effective group work and team projects. Learn how to contribute effectively and manage team dynamics.",
            'online learning': "Optimize your online learning experience with digital tools and strategies. Learn to stay engaged and productive in virtual learning environments.",
            'academic balance': "Find the right balance between academic demands and personal well-being. Learn to maintain high academic standards without burning out.",
            'stress management': "Develop healthy strategies to manage academic stress and pressure. Learn techniques to maintain calm during high-pressure academic periods.",
            'note taking': "Master effective note-taking techniques that improve comprehension and retention. Learn to create notes that become valuable study resources.",
            'research skills': "Develop strong research skills essential for academic success. Learn to find, evaluate, and use information effectively in your studies.",
            'memory techniques': "Master memory enhancement techniques that improve information retention. Learn methods to remember complex information more easily.",
            'concentration tips': "Improve your focus and concentration during study sessions. Learn techniques to maintain attention and avoid common distractions.",
            'student workflow': "Optimize your daily academic routine for maximum efficiency. Learn to create smooth transitions between different study tasks.",
            'academic goals': "Set and achieve meaningful academic goals with strategic planning. Learn to break down long-term goals into actionable steps.",
            'study environment': "Create an optimal study environment that enhances focus and productivity. Learn how to set up your space for maximum learning efficiency.",
            'learning strategy': "Develop personalized learning strategies that match your learning style. Learn to adapt your approach for different subjects and tasks.",
            'knowledge retention': "Master techniques for long-term knowledge retention and recall. Learn how to move information from short-term to long-term memory.",
            'student mindset': "Develop a growth mindset that supports academic success. Learn to view challenges as opportunities for learning and growth.",
            'academic tracking': "Monitor and evaluate your academic progress effectively. Learn to track your performance and make timely adjustments to your study approach.",
            'study routine': "Establish effective study routines that become beneficial habits. Learn to create sustainable study patterns that support long-term success.",
            'student organization': "Master organizational skills essential for academic success. Learn to manage your academic materials, time, and resources effectively.",
            'learning productivity': "Optimize your learning process for maximum productivity. Learn to achieve better results while studying smarter, not harder.",
            
            # Freelancer-related summaries
            'project management': "Explore project management strategies tailored for freelancers, helping you deliver quality work while meeting deadlines.",
            'client communication': "Master the art of professional client communication, building strong relationships while maintaining clear boundaries.",
            'time tracking': "Learn efficient time tracking methods to improve your productivity and ensure accurate client billing.",
            
            # Teacher-related summaries
            'classroom management': "Discover effective classroom management techniques that create an engaging learning environment.",
            'lesson planning': "Learn innovative approaches to lesson planning that keep students engaged while meeting educational objectives.",
            'student assessment': "Explore modern assessment methods that accurately measure student progress and inform teaching strategies.",
            
            # HR-related summaries
            'employee management': "Master comprehensive employee management strategies that foster a positive workplace environment.",
            'recruitment tracking': "Learn efficient recruitment tracking methods to streamline your hiring process and find the best talent.",
            'performance tracking': "Discover effective ways to monitor and improve employee performance while maintaining motivation.",
            
            # Professional-related summaries
            'work productivity': "Explore cutting-edge productivity techniques that help professionals excel in their roles.",
            'team collaboration': "Learn proven strategies for enhancing team collaboration and achieving better results together.",
            'workflow optimization': "Master methods for optimizing your workflow and maximizing efficiency in your professional life."
        }
        
        try:
            return summaries.get(keyword.lower(), "Hey!! This Article is for your betterment. Kindly give it a read and do take care of yourself!!")
        except Exception:
            return "Hey!! This Article is for your betterment. Kindly give it a read and do take care of yourself!!"