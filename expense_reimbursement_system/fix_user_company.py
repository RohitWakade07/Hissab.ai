import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expense_system.settings')
django.setup()

from users.models import User
from companies.models import Company

# Get the test user
user = User.objects.get(username='testuser')
print(f'User company: {user.company}')

# Create or get a test company
company, created = Company.objects.get_or_create(
    name='Test Company',
    defaults={
        'description': 'Test company for demo',
        'currency': 'USD',
        'country': 'US'
    }
)
print(f'Company created: {created}')

# Assign company to user if not already assigned
if not user.company:
    user.company = company
    user.save()
    print(f'Company assigned: {user.company.name}')
else:
    print(f'User already has company: {user.company.name}')
