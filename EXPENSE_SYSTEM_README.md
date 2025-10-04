# Expense Reimbursement System - Django Backend

## Project Setup

This Django project implements a comprehensive expense reimbursement system with:
- Multi-level approval workflows
- Conditional approval rules
- OCR receipt scanning
- Role-based permissions
- Currency support

## Features

### Core Features
- **Authentication & User Management**: Auto-create company and admin on signup
- **Expense Submission**: Submit expenses with amount, category, description, date
- **Approval Workflow**: Multi-level approvals with configurable sequences
- **Conditional Approval**: Percentage rules, specific approver rules, hybrid rules
- **OCR Integration**: Auto-extract data from receipt images
- **Role Permissions**: Admin, Manager, Employee roles with specific permissions

### Technical Stack
- **Backend**: Django 4.2+ with Django REST Framework
- **Database**: PostgreSQL (recommended) or SQLite for development
- **OCR**: Tesseract OCR with Python wrapper
- **Authentication**: Django's built-in authentication with JWT tokens
- **API**: RESTful API with comprehensive documentation

## Installation

1. **Create virtual environment:**
```bash
python -m venv expense_env
source expense_env/bin/activate  # On Windows: expense_env\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install django djangorestframework django-cors-headers pillow pytesseract python-decouple psycopg2-binary
```

3. **Run migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

4. **Create superuser:**
```bash
python manage.py createsuperuser
```

5. **Run development server:**
```bash
python manage.py runserver
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout

### Company Management
- `GET /api/companies/` - List companies (Admin only)
- `POST /api/companies/` - Create company
- `PUT /api/companies/{id}/` - Update company

### User Management
- `GET /api/users/` - List users
- `POST /api/users/` - Create user
- `PUT /api/users/{id}/` - Update user
- `POST /api/users/{id}/assign-manager/` - Assign manager

### Expense Management
- `GET /api/expenses/` - List expenses
- `POST /api/expenses/` - Submit expense
- `PUT /api/expenses/{id}/` - Update expense
- `POST /api/expenses/{id}/approve/` - Approve expense
- `POST /api/expenses/{id}/reject/` - Reject expense

### OCR Integration
- `POST /api/ocr/scan-receipt/` - Scan receipt image

### Approval Rules
- `GET /api/approval-rules/` - List approval rules
- `POST /api/approval-rules/` - Create approval rule
- `PUT /api/approval-rules/{id}/` - Update approval rule

## Database Schema

### Core Models
- **Company**: Company information and currency settings
- **User**: Extended user model with roles and manager relationships
- **Expense**: Expense claims with status tracking
- **ExpenseApproval**: Approval records for each expense
- **ApprovalRule**: Configurable approval rules
- **ApprovalFlow**: Multi-level approval sequences

## Role Permissions

### Admin
- Create and manage companies
- Create and manage users
- Set roles and manager relationships
- Configure approval rules
- View all expenses
- Override approvals

### Manager
- Approve/reject expenses
- View team expenses
- Escalate expenses
- View approval history

### Employee
- Submit expenses
- View own expenses
- Check approval status
- Upload receipt images

## Approval Workflow

1. **Employee submits expense**
2. **System determines approval flow** based on rules
3. **Sequential approvals** through defined approvers
4. **Conditional rules** applied (percentage, specific approver)
5. **Final approval** and reimbursement processing

## OCR Features

- **Receipt scanning** with automatic data extraction
- **Amount detection** in multiple currencies
- **Date parsing** from receipt text
- **Merchant name** extraction
- **Category suggestion** based on merchant type

## Configuration

Create a `.env` file:
```
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=postgresql://user:password@localhost/expense_db
OCR_LANGUAGE=eng
ALLOWED_HOSTS=localhost,127.0.0.1
```

## Testing

Run tests:
```bash
python manage.py test
```

## Deployment

For production deployment:
1. Set `DEBUG=False`
2. Configure proper database
3. Set up static file serving
4. Configure email settings for notifications
5. Set up OCR server
6. Configure CORS settings
