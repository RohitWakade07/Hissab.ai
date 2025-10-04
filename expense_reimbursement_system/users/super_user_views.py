from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from companies.models import Company
from companies.serializers import CompanySerializer
from .serializers import UserSerializer
from .models import User
import uuid

User = get_user_model()

class SuperUserPermission:
    """Permission class for super users only"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'SUPER_USER'
        )

@api_view(['GET'])
@permission_classes([SuperUserPermission])
def super_user_companies(request):
    """Get all companies for super user"""
    try:
        companies = Company.objects.all().order_by('-created_at')
        
        # Add user count for each company
        companies_data = []
        for company in companies:
            company_data = CompanySerializer(company).data
            company_data['user_count'] = company.users.count()
            companies_data.append(company_data)
        
        return Response({
            'success': True,
            'companies': companies_data,
            'total_count': len(companies_data)
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([SuperUserPermission])
def super_user_create_company(request):
    """Create a new company with admin user"""
    try:
        data = request.data
        
        # Validate required fields
        required_fields = [
            'name', 'currency', 'country', 
            'admin_username', 'admin_email', 
            'admin_first_name', 'admin_last_name', 
            'admin_password'
        ]
        
        for field in required_fields:
            if not data.get(field):
                return Response({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if company name already exists
        if Company.objects.filter(name=data['name']).exists():
            return Response({
                'success': False,
                'error': 'Company with this name already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if admin username already exists
        if User.objects.filter(username=data['admin_username']).exists():
            return Response({
                'success': False,
                'error': 'Admin username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if admin email already exists
        if User.objects.filter(email=data['admin_email']).exists():
            return Response({
                'success': False,
                'error': 'Admin email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create company
        company = Company.objects.create(
            name=data['name'],
            description=data.get('description', ''),
            currency=data['currency'],
            country=data['country']
        )
        
        # Create admin user
        admin_user = User.objects.create_user(
            username=data['admin_username'],
            email=data['admin_email'],
            password=data['admin_password'],
            first_name=data['admin_first_name'],
            last_name=data['admin_last_name'],
            role='ADMIN',
            company=company,
            is_active=True
        )
        
        # Update company with admin user
        company.admin_user = admin_user
        company.save()
        
        return Response({
            'success': True,
            'message': 'Company and admin user created successfully',
            'company': CompanySerializer(company).data,
            'admin_user': UserSerializer(admin_user).data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([SuperUserPermission])
def super_user_system_users(request):
    """Get all users across all companies"""
    try:
        users = User.objects.select_related('company').all().order_by('-created_at')
        
        # Add company name to each user
        users_data = []
        for user in users:
            user_data = UserSerializer(user).data
            user_data['company_name'] = user.company.name if user.company else 'No Company'
            users_data.append(user_data)
        
        return Response({
            'success': True,
            'users': users_data,
            'total_count': len(users_data)
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([SuperUserPermission])
def super_user_system_analytics(request):
    """Get system-wide analytics"""
    try:
        # Get basic statistics
        total_companies = Company.objects.count()
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        
        # Get users by role
        users_by_role = {}
        for role, _ in User.ROLE_CHOICES:
            users_by_role[role] = User.objects.filter(role=role).count()
        
        # Get companies by currency
        companies_by_currency = {}
        for company in Company.objects.all():
            currency = company.currency
            companies_by_currency[currency] = companies_by_currency.get(currency, 0) + 1
        
        return Response({
            'success': True,
            'analytics': {
                'total_companies': total_companies,
                'total_users': total_users,
                'active_users': active_users,
                'inactive_users': total_users - active_users,
                'users_by_role': users_by_role,
                'companies_by_currency': companies_by_currency
            }
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
