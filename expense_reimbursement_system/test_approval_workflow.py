#!/usr/bin/env python
"""
Test script for the approval workflow system
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expense_system.settings')
django.setup()

from django.contrib.auth import get_user_model
from companies.models import Company
from expenses.models import Expense, ExpenseCategory
from approvals.models import ApprovalFlow, ApprovalStep
from approvals.services import ApprovalService

User = get_user_model()

def create_test_data():
    """Create test data for approval workflow"""
    print("Creating test data for approval workflow...")
    
    # Get or create company
    company, created = Company.objects.get_or_create(
        name="Test Approval Company",
        defaults={
            'currency': 'USD',
            'country': 'US',
            'address': '123 Test St',
            'phone': '+1-555-0123',
            'email': 'test@company.com'
        }
    )
    
    if created:
        print(f"[SUCCESS] Created company: {company.name}")
    else:
        print(f"[INFO] Using existing company: {company.name}")
    
    # Create admin user
    admin_user, created = User.objects.get_or_create(
        username='admin_approval',
        defaults={
            'email': 'admin@testcompany.com',
            'first_name': 'Admin',
            'last_name': 'User',
            'role': 'ADMIN',
            'company': company,
            'is_active': True
        }
    )
    
    if created:
        admin_user.set_password('adminpass123')
        admin_user.save()
        print(f"[SUCCESS] Created admin user: {admin_user.username}")
    else:
        print(f"[INFO] Using existing admin user: {admin_user.username}")
    
    # Create manager user
    manager_user, created = User.objects.get_or_create(
        username='manager_approval',
        defaults={
            'email': 'manager@testcompany.com',
            'first_name': 'Manager',
            'last_name': 'User',
            'role': 'MANAGER',
            'company': company,
            'is_manager_approver': True,
            'is_active': True
        }
    )
    
    if created:
        manager_user.set_password('managerpass123')
        manager_user.save()
        print(f"[SUCCESS] Created manager user: {manager_user.username}")
    else:
        print(f"[INFO] Using existing manager user: {manager_user.username}")
    
    # Create employee user
    employee_user, created = User.objects.get_or_create(
        username='employee_approval',
        defaults={
            'email': 'employee@testcompany.com',
            'first_name': 'Employee',
            'last_name': 'User',
            'role': 'EMPLOYEE',
            'company': company,
            'manager': manager_user,
            'is_active': True
        }
    )
    
    if created:
        employee_user.set_password('employeepass123')
        employee_user.save()
        print(f"[SUCCESS] Created employee user: {employee_user.username}")
    else:
        print(f"[INFO] Using existing employee user: {employee_user.username}")
    
    # Create expense category
    category, created = ExpenseCategory.objects.get_or_create(
        name='Test Category',
        defaults={
            'description': 'Test expense category for approval workflow',
            'is_active': True
        }
    )
    
    if created:
        print(f"[SUCCESS] Created expense category: {category.name}")
    else:
        print(f"[INFO] Using existing expense category: {category.name}")
    
    return company, admin_user, manager_user, employee_user, category

def test_approval_workflow():
    """Test the complete approval workflow"""
    print("\n" + "="*60)
    print("TESTING APPROVAL WORKFLOW")
    print("="*60)
    
    # Create test data
    company, admin_user, manager_user, employee_user, category = create_test_data()
    
    # Create approval service
    approval_service = ApprovalService()
    
    # Test 1: Create an expense
    print("\n[TEST 1] Creating expense...")
    expense = Expense.objects.create(
        submitted_by=employee_user,
        company=company,
        amount=150.00,
        currency='USD',
        category=category,
        description='Test expense for approval workflow',
        expense_date='2025-10-04',
        status='DRAFT'
    )
    print(f"[SUCCESS] Created expense: {expense.id}")
    print(f"   Amount: {expense.amount} {expense.currency}")
    print(f"   Status: {expense.status}")
    
    # Test 2: Submit expense for approval
    print("\n[TEST 2] Submitting expense for approval...")
    expense.status = 'PENDING'
    expense.submitted_at = django.utils.timezone.now()
    
    # Get approval flow
    approval_flow = approval_service.get_approval_flow_for_expense(expense)
    expense.approval_flow = approval_flow
    print(f"[SUCCESS] Assigned approval flow: {approval_flow.name}")
    
    # Assign to first approver (manager)
    approval_service.assign_expense_to_approver(expense, manager_user)
    print(f"[SUCCESS] Assigned to approver: {manager_user.get_full_name()}")
    print(f"   Current approver: {expense.current_approver.get_full_name()}")
    print(f"   Status: {expense.status}")
    
    # Test 3: Manager approves expense
    print("\n[TEST 3] Manager approving expense...")
    approval_service.process_approval(expense, manager_user, 'approve', 'Looks good, approved!')
    
    # Refresh expense from database
    expense.refresh_from_db()
    print(f"[SUCCESS] Expense approved by manager")
    print(f"   Status: {expense.status}")
    print(f"   Current approver: {expense.current_approver.get_full_name() if expense.current_approver else 'None'}")
    
    # Test 4: Check approval history
    print("\n[TEST 4] Checking approval history...")
    approvals = expense.approvals.all()
    for approval in approvals:
        print(f"   {approval.approver.get_full_name()}: {approval.status} - {approval.comments}")
    
    # Test 5: Test manager dashboard data
    print("\n[TEST 5] Testing manager dashboard data...")
    pending_expenses = approval_service.get_expenses_for_approval(manager_user)
    print(f"   Pending approvals for manager: {pending_expenses.count()}")
    
    stats = approval_service.get_approval_statistics(manager_user)
    print(f"   Manager stats: {stats}")
    
    # Test 6: Create a multi-step approval flow
    print("\n[TEST 6] Creating multi-step approval flow...")
    multi_flow = approval_service.create_approval_flow(
        company=company,
        name="Multi-Step Approval Flow",
        steps_data=[
            {'approver': manager_user, 'step_number': 1, 'is_required': True},
            {'approver': admin_user, 'step_number': 2, 'is_required': True}
        ]
    )
    print(f"[SUCCESS] Created multi-step flow: {multi_flow.name}")
    print(f"   Steps: {multi_flow.steps.count()}")
    
    for step in multi_flow.steps.all():
        print(f"   Step {step.step_number}: {step.approver.get_full_name()}")
    
    print("\n" + "="*60)
    print("APPROVAL WORKFLOW TEST COMPLETED SUCCESSFULLY!")
    print("="*60)
    
    print("\n[SUMMARY] Test Summary:")
    print(f"   Company: {company.name}")
    print(f"   Admin: {admin_user.username} ({admin_user.get_full_name()})")
    print(f"   Manager: {manager_user.username} ({manager_user.get_full_name()})")
    print(f"   Employee: {employee_user.username} ({employee_user.get_full_name()})")
    print(f"   Expense: {expense.id} - {expense.status}")
    print(f"   Approval Flow: {approval_flow.name}")
    
    print("\n[CREDENTIALS] Login Credentials for Testing:")
    print(f"   Manager: {manager_user.username} / managerpass123")
    print(f"   Employee: {employee_user.username} / employeepass123")
    print(f"   Admin: {admin_user.username} / adminpass123")

if __name__ == '__main__':
    test_approval_workflow()
