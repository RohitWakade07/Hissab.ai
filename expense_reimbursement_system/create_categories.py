import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expense_system.settings')
django.setup()

from expenses.models import ExpenseCategory

categories = [
    {'name': 'Travel', 'description': 'Business travel expenses'},
    {'name': 'Meals', 'description': 'Food and dining expenses'},
    {'name': 'Transportation', 'description': 'Transportation costs'},
    {'name': 'Office Supplies', 'description': 'Office materials and supplies'},
    {'name': 'Communication', 'description': 'Phone, internet, and communication costs'},
    {'name': 'Training', 'description': 'Training and education expenses'},
    {'name': 'Equipment', 'description': 'Equipment and hardware purchases'},
    {'name': 'Software', 'description': 'Software licenses and subscriptions'},
    {'name': 'Marketing', 'description': 'Marketing and advertising expenses'},
    {'name': 'Other', 'description': 'Other business expenses'},
]

for category_data in categories:
    category, created = ExpenseCategory.objects.get_or_create(
        name=category_data['name'],
        defaults={'description': category_data['description']}
    )
    if created:
        print(f'Created category: {category.name}')
    else:
        print(f'Category already exists: {category.name}')

print('Initial data setup complete!')
