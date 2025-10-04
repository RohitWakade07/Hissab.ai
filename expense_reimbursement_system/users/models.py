from django.contrib.auth.models import AbstractUser
from django.db import models
from companies.models import Company
import uuid

class User(AbstractUser):
    """Extended User model with company and role information"""
    
    ROLE_CHOICES = [
        ('SUPER_USER', 'Super User'),
        ('ADMIN', 'Admin'),
        ('MANAGER', 'Manager'),
        ('EMPLOYEE', 'Employee'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Company relationship
    company = models.ForeignKey(
        Company, 
        on_delete=models.CASCADE, 
        related_name='users',
        null=True, 
        blank=True
    )
    
    # Role and permissions
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='EMPLOYEE')
    
    # Manager relationship
    manager = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='subordinates'
    )
    
    # User profile information
    phone = models.CharField(max_length=20, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    employee_id = models.CharField(max_length=50, blank=True, null=True)
    
    # User settings
    is_manager_approver = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['first_name', 'last_name']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"
    
    def get_full_name(self):
        """Return the first_name plus the last_name, with a space in between."""
        full_name = f"{self.first_name} {self.last_name}"
        return full_name.strip() or self.username
    
    def is_super_user(self):
        """Check if user is a super user"""
        return self.role == 'SUPER_USER'
    
    def is_admin(self):
        """Check if user is an admin"""
        return self.role == 'ADMIN'
    
    def is_manager(self):
        """Check if user is a manager"""
        return self.role == 'MANAGER'
    
    def is_employee(self):
        """Check if user is an employee"""
        return self.role == 'EMPLOYEE'
    
    def can_approve_expenses(self):
        """Check if user can approve expenses"""
        return self.role in ['SUPER_USER', 'ADMIN', 'MANAGER']
    
    # ===== SUPER USER PERMISSIONS =====
    def can_create_company(self):
        """Super user can create companies"""
        return self.is_super_user()
    
    def can_manage_companies(self):
        """Super user can manage all companies"""
        return self.is_super_user()
    
    def can_manage_all_users(self):
        """Super user can manage users across all companies"""
        return self.is_super_user()
    
    def can_set_any_role(self):
        """Super user can set any role including SUPER_USER"""
        return self.is_super_user()
    
    # ===== ADMIN PERMISSIONS =====
    def can_manage_users(self):
        """Admin can manage users in their company"""
        return self.is_admin() or self.is_super_user()
    
    def can_set_roles(self):
        """Admin can set and change user roles (except SUPER_USER)"""
        return self.is_admin() or self.is_super_user()
    
    def can_configure_approval_rules(self):
        """Admin can configure approval rules and flows"""
        return self.is_admin() or self.is_super_user()
    
    def can_view_all_expenses(self):
        """Admin can view all expenses in the company"""
        return self.is_admin() or self.is_super_user()
    
    def can_override_approvals(self):
        """Admin can override any approval decision"""
        return self.is_admin()
    
    # ===== MANAGER PERMISSIONS =====
    def can_approve_reject_expenses(self):
        """Manager can approve/reject expenses"""
        return self.role in ['ADMIN', 'MANAGER'] and self.is_manager_approver
    
    def can_view_team_expenses(self):
        """Manager can view team expenses"""
        return self.role in ['ADMIN', 'MANAGER']
    
    def can_escalate_expenses(self):
        """Manager can escalate expenses as per rules"""
        return self.role in ['ADMIN', 'MANAGER']
    
    # ===== EMPLOYEE PERMISSIONS =====
    def can_submit_expenses(self):
        """Employee can submit expenses"""
        return self.role in ['ADMIN', 'MANAGER', 'EMPLOYEE']
    
    def can_view_own_expenses(self):
        """Employee can view their own expenses"""
        return self.role in ['ADMIN', 'MANAGER', 'EMPLOYEE']
    
    def can_check_approval_status(self):
        """Employee can check approval status of their expenses"""
        return self.role in ['ADMIN', 'MANAGER', 'EMPLOYEE']
    
    # ===== COMPREHENSIVE PERMISSION CHECKS =====
    def has_permission(self, permission_name):
        """Check if user has a specific permission"""
        permission_map = {
            # Admin permissions
            'create_company': self.can_create_company,
            'manage_users': self.can_manage_users,
            'set_roles': self.can_set_roles,
            'configure_approval_rules': self.can_configure_approval_rules,
            'view_all_expenses': self.can_view_all_expenses,
            'override_approvals': self.can_override_approvals,
            
            # Manager permissions
            'approve_reject_expenses': self.can_approve_reject_expenses,
            'view_team_expenses': self.can_view_team_expenses,
            'escalate_expenses': self.can_escalate_expenses,
            
            # Employee permissions
            'submit_expenses': self.can_submit_expenses,
            'view_own_expenses': self.can_view_own_expenses,
            'check_approval_status': self.can_check_approval_status,
        }
        
        if permission_name not in permission_map:
            return False
        
        return permission_map[permission_name]()
    
    def get_permissions(self):
        """Get all permissions for this user"""
        permissions = []
        
        if self.is_admin():
            permissions.extend([
                'create_company', 'manage_users', 'set_roles', 
                'configure_approval_rules', 'view_all_expenses', 
                'override_approvals', 'approve_reject_expenses', 
                'view_team_expenses', 'escalate_expenses', 
                'submit_expenses', 'view_own_expenses', 
                'check_approval_status'
            ])
        elif self.is_manager():
            permissions.extend([
                'approve_reject_expenses', 'view_team_expenses', 
                'escalate_expenses', 'submit_expenses', 
                'view_own_expenses', 'check_approval_status'
            ])
        elif self.is_employee():
            permissions.extend([
                'submit_expenses', 'view_own_expenses', 
                'check_approval_status'
            ])
        
        return permissions
    
    def can_access_expense(self, expense):
        """Check if user can access a specific expense"""
        from expenses.models import Expense
        
        # Admin can access all expenses
        if self.is_admin():
            return expense.company == self.company
        
        # Manager can access team expenses and their own
        if self.is_manager():
            return (expense.submitted_by in self.get_subordinates() or 
                   expense.submitted_by == self)
        
        # Employee can only access their own expenses
        if self.is_employee():
            return expense.submitted_by == self
        
        return False
    
    def can_approve_expense(self, expense):
        """Check if user can approve a specific expense"""
        # Admin can approve any expense
        if self.is_admin():
            return expense.company == self.company
        
        # Manager can approve if they are the current approver
        if self.is_manager() and self.is_manager_approver:
            return expense.current_approver == self
        
        return False
    
    def get_subordinates(self):
        """Get all subordinates of this user"""
        return User.objects.filter(manager=self, is_active=True)
    
    def get_expenses_for_approval(self):
        """Get expenses waiting for this user's approval"""
        from expenses.models import Expense
        return Expense.objects.filter(
            status='PENDING',
            current_approver=self
        )
    
    def get_team_expenses(self):
        """Get all expenses from user's team"""
        from expenses.models import Expense
        subordinates = self.get_subordinates()
        return Expense.objects.filter(
            submitted_by__in=subordinates
        ).order_by('-created_at')
    
    @classmethod
    def create_user(cls, username, email, password, first_name, last_name, company=None, role='EMPLOYEE', **extra_fields):
        """Create a new user with the given details"""
        if not username:
            raise ValueError('The username must be set')
        if not email:
            raise ValueError('The email must be set')
        if not password:
            raise ValueError('The password must be set')
        
        user = cls(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            company=company,
            role=role,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=cls._default_manager.db)
        return user
    
    def can_view_own_expenses(self):
        """Employee can view their own expenses"""
        return self.role in ['ADMIN', 'MANAGER', 'EMPLOYEE']
    
    def can_check_approval_status(self):
        """Employee can check approval status of their expenses"""
        return self.role in ['ADMIN', 'MANAGER', 'EMPLOYEE']
    
    # ===== COMPREHENSIVE PERMISSION CHECKS =====
    def has_permission(self, permission_name):
        """Check if user has a specific permission"""
        permission_map = {
            # Admin permissions
            'create_company': self.can_create_company,
            'manage_users': self.can_manage_users,
            'set_roles': self.can_set_roles,
            'configure_approval_rules': self.can_configure_approval_rules,
            'view_all_expenses': self.can_view_all_expenses,
            'override_approvals': self.can_override_approvals,
            
            # Manager permissions
            'approve_reject_expenses': self.can_approve_reject_expenses,
            'view_team_expenses': self.can_view_team_expenses,
            'escalate_expenses': self.can_escalate_expenses,
            
            # Employee permissions
            'submit_expenses': self.can_submit_expenses,
            'view_own_expenses': self.can_view_own_expenses,
            'check_approval_status': self.can_check_approval_status,
        }
        
        if permission_name not in permission_map:
            return False
        
        return permission_map[permission_name]()
    
    def get_permissions(self):
        """Get all permissions for this user"""
        permissions = []
        
        if self.is_admin():
            permissions.extend([
                'create_company', 'manage_users', 'set_roles', 
                'configure_approval_rules', 'view_all_expenses', 
                'override_approvals', 'approve_reject_expenses', 
                'view_team_expenses', 'escalate_expenses', 
                'submit_expenses', 'view_own_expenses', 
                'check_approval_status'
            ])
        elif self.is_manager():
            permissions.extend([
                'approve_reject_expenses', 'view_team_expenses', 
                'escalate_expenses', 'submit_expenses', 
                'view_own_expenses', 'check_approval_status'
            ])
        elif self.is_employee():
            permissions.extend([
                'submit_expenses', 'view_own_expenses', 
                'check_approval_status'
            ])
        
        return permissions
    
    def can_access_expense(self, expense):
        """Check if user can access a specific expense"""
        from expenses.models import Expense
        
        # Admin can access all expenses
        if self.is_admin():
            return expense.company == self.company
        
        # Manager can access team expenses and their own
        if self.is_manager():
            return (expense.submitted_by in self.get_subordinates() or 
                   expense.submitted_by == self)
        
        # Employee can only access their own expenses
        if self.is_employee():
            return expense.submitted_by == self
        
        return False
    
    def can_approve_expense(self, expense):
        """Check if user can approve a specific expense"""
        # Admin can approve any expense
        if self.is_admin():
            return expense.company == self.company
        
        # Manager can approve if they are the current approver
        if self.is_manager() and self.is_manager_approver:
            return expense.current_approver == self
        
        return False
    
    def get_subordinates(self):
        """Get all subordinates of this user"""
        return User.objects.filter(manager=self, is_active=True)
    
    def get_expenses_for_approval(self):
        """Get expenses waiting for this user's approval"""
        from expenses.models import Expense
        return Expense.objects.filter(
            status='PENDING',
            current_approver=self
        )
    
    def get_team_expenses(self):
        """Get all expenses from user's team"""
        from expenses.models import Expense
        subordinates = self.get_subordinates()
        return Expense.objects.filter(
            submitted_by__in=subordinates
        ).order_by('-created_at')
    
    @classmethod
    def create_user(cls, username, email, password, first_name, last_name, company=None, role='EMPLOYEE', **extra_fields):
        """Create a new user with the given details"""
        if not username:
            raise ValueError('The username must be set')
        if not email:
            raise ValueError('The email must be set')
        if not password:
            raise ValueError('The password must be set')
        
        user = cls(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            company=company,
            role=role,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=cls._default_manager.db)
        return user