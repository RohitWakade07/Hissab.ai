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

@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_profile(request):
    """Update current user profile"""
    serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({
            'user': UserSerializer(request.user).data,
            'message': 'Profile updated successfully'
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change user password"""
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password changed successfully'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserListCreateView(generics.ListCreateAPIView):
    """List and create users (Admin only)"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter users by company"""
        user = self.request.user
        if user.is_admin():
            return User.objects.filter(company=user.company)
        elif user.is_manager():
            return User.objects.filter(company=user.company, manager=user)
        else:
            return User.objects.filter(id=user.id)
    
    def perform_create(self, serializer):
        """Set company for new user"""
        serializer.save(company=self.request.user.company)

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete user"""
    queryset = User.objects.all()
    serializer_class = UserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter users by company"""
        user = self.request.user
        if user.is_admin():
            return User.objects.filter(company=user.company)
        elif user.is_manager():
            return User.objects.filter(company=user.company, manager=user)
        else:
            return User.objects.filter(id=user.id)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def assign_manager(request, user_id):
    """Assign manager to user (Admin only)"""
    if not request.user.is_admin():
        return Response(
            {'error': 'Only admins can assign managers'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        user = User.objects.get(id=user_id, company=request.user.company)
        manager_id = request.data.get('manager_id')
        
        if manager_id:
            manager = User.objects.get(id=manager_id, company=request.user.company)
            if manager.role not in ['ADMIN', 'MANAGER']:
                return Response(
                    {'error': 'Manager must be an Admin or Manager'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.manager = manager
        else:
            user.manager = None
        
        user.save()
        return Response({
            'message': 'Manager assigned successfully',
            'user': UserSerializer(user).data
        })
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def subordinates(request):
    """Get user's subordinates"""
    user = request.user
    subordinates = user.get_subordinates()
    serializer = UserSerializer(subordinates, many=True)
    return Response(serializer.data)

# Admin Management Views

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_create_user(request):
    """Admin endpoint to create new users"""
    if not request.user.is_admin():
        return Response(
            {'error': 'Only admins can create users'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = AdminCreateUserSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'user': UserSerializer(user).data,
            'message': 'User created successfully'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def admin_update_user(request, user_id):
    """Admin endpoint to update user details"""
    if not request.user.is_admin():
        return Response(
            {'error': 'Only admins can update users'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        user = User.objects.get(id=user_id, company=request.user.company)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = AdminUpdateUserSerializer(user, data=request.data, context={'request': request})
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'user': UserSerializer(user).data,
            'message': 'User updated successfully'
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_list_users(request):
    """Admin endpoint to list all company users"""
    if not request.user.is_admin():
        return Response(
            {'error': 'Only admins can list users'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    users = User.objects.filter(company=request.user.company).order_by('first_name', 'last_name')
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_get_managers(request):
    """Get list of potential managers (Admins and Managers)"""
    if not request.user.is_admin():
        return Response(
            {'error': 'Only admins can access this endpoint'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    managers = User.objects.filter(
        company=request.user.company,
        role__in=['ADMIN', 'MANAGER'],
        is_active=True
    ).order_by('first_name', 'last_name')
    
    serializer = UserSerializer(managers, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_assign_manager(request, user_id):
    """Admin endpoint to assign/change manager for a user"""
    if not request.user.is_admin():
        return Response(
            {'error': 'Only admins can assign managers'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        user = User.objects.get(id=user_id, company=request.user.company)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    manager_id = request.data.get('manager_id')
    
    if manager_id:
        try:
            manager = User.objects.get(id=manager_id, company=request.user.company)
            if manager.role not in ['ADMIN', 'MANAGER']:
                return Response(
                    {'error': 'Manager must be an Admin or Manager'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.manager = manager
        except User.DoesNotExist:
            return Response(
                {'error': 'Manager not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    else:
        user.manager = None
    
    user.save()
    return Response({
        'message': 'Manager assigned successfully',
        'user': UserSerializer(user).data
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_change_role(request, user_id):
    """Admin endpoint to change user role"""
    if not request.user.is_admin():
        return Response(
            {'error': 'Only admins can change roles'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        user = User.objects.get(id=user_id, company=request.user.company)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    new_role = request.data.get('role')
    if new_role not in ['ADMIN', 'MANAGER', 'EMPLOYEE']:
        return Response(
            {'error': 'Invalid role'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user.role = new_role
    user.save()
    
    return Response({
        'message': 'Role changed successfully',
        'user': UserSerializer(user).data
    })