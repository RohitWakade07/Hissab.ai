from django.contrib.auth.models import AbstractUser
from django.db import models
from companies.models import Company
import uuid

class User(AbstractUser):
    """Extended User model with company and role information"""
    
    ROLE_CHOICES = [
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
        return self.role in ['ADMIN', 'MANAGER']
    
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