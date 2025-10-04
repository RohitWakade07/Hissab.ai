@echo off
echo 🚀 Setting up Django backend for Windows...

cd expense_reimbursement_system

echo 📦 Installing minimal requirements...
pip install -r requirements-minimal.txt

if %errorlevel% neq 0 (
    echo ❌ Failed to install requirements. Trying alternative approach...
    pip install Django==4.2.7 djangorestframework==3.14.0 django-cors-headers==4.3.1 python-decouple==3.8
)

echo 📝 Creating database migrations...
python manage.py makemigrations

echo 🗄️ Running database migrations...
python manage.py migrate

echo 👤 Creating initial expense categories...
python -c "
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
        print(f'  ✅ Created category: {category.name}')
"

echo ✅ Backend setup complete!
echo.
echo 🎉 Your Django backend is ready!
echo 📖 Run 'python manage.py runserver' to start the backend server
echo 🌐 Backend will be available at http://localhost:8000/
echo 📚 API endpoints available at http://localhost:8000/api/
echo.
echo 💡 To create a superuser, run: python manage.py createsuperuser

pause
