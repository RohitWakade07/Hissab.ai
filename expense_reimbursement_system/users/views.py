from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from django.contrib.auth.models import User as DjangoUser
from .models import User
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
    AdminCreateUserSerializer,
    AdminUpdateUserSerializer
)
from .permissions import (
    AdminPermission, ManagerPermission, EmployeePermission,
    permission_required, Permissions, Roles
)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    """User registration endpoint"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """User login endpoint"""
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """User logout endpoint"""
    try:
        request.user.auth_token.delete()
    except:
        pass
    logout(request)
    return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request):
    """Get current user profile"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([ManagerPermission])
def admin_users(request):
    """Get all users in company (Admin and Manager)"""
    users = User.objects.filter(company=request.user.company, is_active=True)
    serializer = UserSerializer(users, many=True)
    return Response({
        'users': serializer.data,
        'total_count': users.count()
    })

@api_view(['POST'])
@permission_classes([ManagerPermission])
def admin_create_user(request):
    """Create new user (Admin and Manager)"""
    serializer = AdminCreateUserSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        # Ensure the new user belongs to the same company
        user_data = serializer.validated_data
        user_data['company'] = request.user.company
        
        user = User.objects.create_user(**user_data)
        
        return Response({
            'message': 'User created successfully',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT', 'PATCH'])
@permission_classes([ManagerPermission])
def admin_update_user(request, user_id):
    """Update user (Admin and Manager)"""
    try:
        user = User.objects.get(id=user_id, company=request.user.company)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = AdminUpdateUserSerializer(user, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message': 'User updated successfully',
            'user': UserSerializer(user).data
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([AdminPermission])
def admin_delete_user(request, user_id):
    """Delete user (Admin only)"""
    try:
        user = User.objects.get(id=user_id, company=request.user.company)
        
        # Prevent admin from deleting themselves
        if user == request.user:
            return Response(
                {'error': 'Cannot delete your own account'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.is_active = False
        user.save()
        
        return Response({'message': 'User deactivated successfully'})
    
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([ManagerPermission])
def manager_team_users(request):
    """Get team users (Manager/Admin only)"""
    if request.user.is_admin():
        # Admin can see all users in company
        users = User.objects.filter(company=request.user.company, is_active=True)
    else:
        # Manager can see their subordinates
        users = request.user.get_subordinates()
    
    serializer = UserSerializer(users, many=True)
    return Response({
        'users': serializer.data,
        'total_count': users.count()
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_permissions(request):
    """Get current user permissions"""
    permissions = request.user.get_permissions()
    return Response({
        'permissions': permissions,
        'role': request.user.role,
        'can_approve_expenses': request.user.can_approve_expenses(),
        'is_manager_approver': request.user.is_manager_approver
    })

@api_view(['POST'])
@permission_classes([AdminPermission])
def set_user_role(request, user_id):
    """Set user role (Admin only)"""
    try:
        user = User.objects.get(id=user_id, company=request.user.company)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    new_role = request.data.get('role')
    if new_role not in ['ADMIN', 'MANAGER', 'EMPLOYEE']:
        return Response(
            {'error': 'Invalid role. Must be ADMIN, MANAGER, or EMPLOYEE'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Prevent changing own role
    if user == request.user:
        return Response(
            {'error': 'Cannot change your own role'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user.role = new_role
    user.save()
    
    return Response({
        'message': f'User role updated to {new_role}',
        'user': UserSerializer(user).data
    })

@api_view(['POST'])
@permission_classes([AdminPermission])
def set_manager_approver(request, user_id):
    """Set manager approver status (Admin only)"""
    try:
        user = User.objects.get(id=user_id, company=request.user.company)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    is_approver = request.data.get('is_manager_approver', False)
    user.is_manager_approver = is_approver
    user.save()
    
    return Response({
        'message': f'Manager approver status set to {is_approver}',
        'user': UserSerializer(user).data
    })

@api_view(['POST'])
@permission_classes([AdminPermission])
def assign_manager(request, user_id):
    """Assign manager to user (Admin only)"""
    try:
        user = User.objects.get(id=user_id, company=request.user.company)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    manager_id = request.data.get('manager_id')
    if manager_id:
        try:
            manager = User.objects.get(id=manager_id, company=request.user.company)
            user.manager = manager
        except User.DoesNotExist:
            return Response({'error': 'Manager not found'}, status=status.HTTP_404_NOT_FOUND)
    else:
        user.manager = None
    
    user.save()
    
    return Response({
        'message': 'Manager assigned successfully',
        'user': UserSerializer(user).data
    })

@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_profile(request):
    """Update current user profile"""
    serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message': 'Profile updated successfully',
            'user': UserSerializer(request.user).data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change user password"""
    serializer = ChangePasswordSerializer(data=request.data)
    if serializer.is_valid():
        user = request.user
        if user.check_password(serializer.validated_data['old_password']):
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Password changed successfully'})
        else:
            return Response(
                {'error': 'Old password is incorrect'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def subordinates(request):
    """Get user's subordinates"""
    subordinates = request.user.get_subordinates()
    serializer = UserSerializer(subordinates, many=True)
    return Response({
        'subordinates': serializer.data,
        'count': subordinates.count()
    })

# Generic Views
class UserListCreateView(generics.ListCreateAPIView):
    """List and create users"""
    permission_classes = [AdminPermission]
    serializer_class = UserSerializer
    
    def get_queryset(self):
        return User.objects.filter(company=self.request.user.company, is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a user"""
    permission_classes = [AdminPermission]
    serializer_class = UserSerializer
    
    def get_queryset(self):
        return User.objects.filter(company=self.request.user.company, is_active=True)