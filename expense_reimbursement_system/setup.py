#!/usr/bin/env python
"""
Setup script for Expense Reimbursement System
Run this script to set up the Django project with initial data
"""

import os
import sys
import django
from django.core.management import execute_from_command_line

def setup_project():
    """Set up the Django project"""
    
    # Set Django settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expense_system.settings')
    django.setup()
    
    print("🚀 Setting up Expense Reimbursement System...")
    
    # Create migrations
    print("📝 Creating database migrations...")
    execute_from_command_line(['manage.py', 'makemigrations'])
    
    # Run migrations
    print("🗄️ Running database migrations...")
    execute_from_command_line(['manage.py', 'migrate'])
    
    # Create superuser
    print("👤 Creating superuser...")
    execute_from_command_line(['manage.py', 'createsuperuser'])
    
    # Create initial data
    print("📊 Creating initial data...")
    create_initial_data()
    
    print("✅ Setup complete!")
    print("\n🎉 Your Expense Reimbursement System is ready!")
    print("📖 Run 'python manage.py runserver' to start the development server")
    print("🌐 Access the admin panel at http://localhost:8000/admin/")
    print("📚 API documentation available at http://localhost:8000/api/")

def create_initial_data():
    """Create initial expense categories"""
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
            print(f"  ✅ Created category: {category.name}")

if __name__ == '__main__':
    setup_project()
