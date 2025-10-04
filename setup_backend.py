#!/usr/bin/env python
"""
Quick Django Backend Setup for Testing
This script sets up a minimal Django backend for testing the frontend authentication
"""

import os
import sys
import django
from django.core.management import execute_from_command_line

def setup_minimal_backend():
    """Set up minimal Django backend for testing"""
    
    print("🚀 Setting up minimal Django backend for testing...")
    
    # Change to the expense system directory
    expense_dir = os.path.join(os.path.dirname(__file__), 'expense_reimbursement_system')
    
    if not os.path.exists(expense_dir):
        print("❌ Expense reimbursement system directory not found!")
        print("Please run this from the project root directory.")
        return
    
    os.chdir(expense_dir)
    
    # Set Django settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expense_system.settings')
    django.setup()
    
    print("📝 Creating database migrations...")
    execute_from_command_line(['manage.py', 'makemigrations'])
    
    print("🗄️ Running database migrations...")
    execute_from_command_line(['manage.py', 'migrate'])
    
    print("👤 Creating initial expense categories...")
    create_initial_categories()
    
    print("✅ Backend setup complete!")
    print("\n🎉 Your Django backend is ready!")
    print("📖 Run 'python manage.py runserver' to start the backend server")
    print("🌐 Backend will be available at http://localhost:8000/")
    print("📚 API endpoints available at http://localhost:8000/api/")

def create_initial_categories():
    """Create initial expense categories"""
    try:
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
        
    except Exception as e:
        print(f"⚠️ Could not create categories: {e}")

if __name__ == '__main__':
    setup_minimal_backend()
