"""
Comprehensive Role-Based Access Control (RBAC) System
"""
from functools import wraps
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.response import Response

User = get_user_model()

class PermissionDenied(Exception):
    """Custom exception for permission denied"""
    pass

def require_permission(permission_name):
    """
    Decorator to check if user has a specific permission
    
    Usage:
    @require_permission('manage_users')
    def create_user(request):
        pass
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse(
                    {'error': 'Authentication required'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            if not request.user.has_permission(permission_name):
                return JsonResponse(
                    {'error': f'Permission denied. Required: {permission_name}'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator

def require_role(*roles):
    """
    Decorator to check if user has a specific role
    
    Usage:
    @require_role('ADMIN', 'MANAGER')
    def admin_or_manager_view(request):
        pass
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse(
                    {'error': 'Authentication required'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            if request.user.role not in roles:
                return JsonResponse(
                    {'error': f'Access denied. Required roles: {", ".join(roles)}'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator

def admin_required(view_func):
    """Decorator to require admin role"""
    return require_role('ADMIN')(view_func)

def manager_required(view_func):
    """Decorator to require manager role"""
    return require_role('ADMIN', 'MANAGER')(view_func)

def employee_required(view_func):
    """Decorator to require employee role or higher"""
    return require_role('ADMIN', 'MANAGER', 'EMPLOYEE')(view_func)

class PermissionChecker:
    """Utility class for permission checking"""
    
    @staticmethod
    def check_user_management_permission(user, target_user=None):
        """Check if user can manage another user"""
        if not user.has_permission('manage_users'):
            return False
        
        # Admin can manage any user in their company
        if user.is_admin():
            if target_user:
                return target_user.company == user.company
            return True
        
        return False
    
    @staticmethod
    def check_expense_access_permission(user, expense):
        """Check if user can access an expense"""
        if not user.is_authenticated:
            return False
        
        return user.can_access_expense(expense)
    
    @staticmethod
    def check_approval_permission(user, expense):
        """Check if user can approve an expense"""
        if not user.is_authenticated:
            return False
        
        return user.can_approve_expense(expense)
    
    @staticmethod
    def check_company_access_permission(user, company):
        """Check if user can access company data"""
        if not user.is_authenticated:
            return False
        
        # Admin can access their company
        if user.is_admin():
            return user.company == company
        
        # Manager and Employee can access their company
        return user.company == company

def permission_required(permission_name):
    """
    DRF permission class for API views
    
    Usage:
    class MyView(APIView):
        permission_classes = [permission_required('manage_users')]
    """
    class PermissionRequired:
        def has_permission(self, request, view):
            if not request.user.is_authenticated:
                return False
            
            return request.user.has_permission(permission_name)
        
        def has_object_permission(self, request, view, obj):
            return self.has_permission(request, view)
    
    return PermissionRequired

# Specific permission classes for common use cases
class AdminPermission:
    """Requires admin role"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin()
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)

class ManagerPermission:
    """Requires manager role or higher"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'MANAGER']
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)

class EmployeePermission:
    """Requires employee role or higher"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'MANAGER', 'EMPLOYEE']
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)

class ExpenseAccessPermission:
    """Check if user can access specific expense"""
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        return request.user.can_access_expense(obj)

class ApprovalPermission:
    """Check if user can approve specific expense"""
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        return request.user.can_approve_expense(obj)

# Permission constants for easy reference
class Permissions:
    # Admin permissions
    CREATE_COMPANY = 'create_company'
    MANAGE_USERS = 'manage_users'
    SET_ROLES = 'set_roles'
    CONFIGURE_APPROVAL_RULES = 'configure_approval_rules'
    VIEW_ALL_EXPENSES = 'view_all_expenses'
    OVERRIDE_APPROVALS = 'override_approvals'
    
    # Manager permissions
    APPROVE_REJECT_EXPENSES = 'approve_reject_expenses'
    VIEW_TEAM_EXPENSES = 'view_team_expenses'
    ESCALATE_EXPENSES = 'escalate_expenses'
    
    # Employee permissions
    SUBMIT_EXPENSES = 'submit_expenses'
    VIEW_OWN_EXPENSES = 'view_own_expenses'
    CHECK_APPROVAL_STATUS = 'check_approval_status'

# Role constants
class Roles:
    ADMIN = 'ADMIN'
    MANAGER = 'MANAGER'
    EMPLOYEE = 'EMPLOYEE'

def get_user_permissions(user):
    """Get all permissions for a user"""
    if not user.is_authenticated:
        return []
    
    return user.get_permissions()

def check_permission(user, permission_name):
    """Check if user has a specific permission"""
    if not user.is_authenticated:
        return False
    
    return user.has_permission(permission_name)

def get_role_permissions(role):
    """Get permissions for a specific role"""
    role_permissions = {
        'ADMIN': [
            'create_company', 'manage_users', 'set_roles', 
            'configure_approval_rules', 'view_all_expenses', 
            'override_approvals', 'approve_reject_expenses', 
            'view_team_expenses', 'escalate_expenses', 
            'submit_expenses', 'view_own_expenses', 
            'check_approval_status'
        ],
        'MANAGER': [
            'approve_reject_expenses', 'view_team_expenses', 
            'escalate_expenses', 'submit_expenses', 
            'view_own_expenses', 'check_approval_status'
        ],
        'EMPLOYEE': [
            'submit_expenses', 'view_own_expenses', 
            'check_approval_status'
        ]
    }
    
    return role_permissions.get(role, [])


