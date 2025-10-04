from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User
from companies.models import Company

class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    company_name = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'password', 'password_confirm', 'phone', 'department',
            'employee_id', 'company_name'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs
    
    def create(self, validated_data):
        """Create user and company"""
        password = validated_data.pop('password')
        password_confirm = validated_data.pop('password_confirm')
        company_name = validated_data.pop('company_name', None)
        
        # Create or get company
        company = None
        if company_name:
            company, created = Company.objects.get_or_create(
                name=company_name,
                defaults={
                    'description': f'Company created for {validated_data["first_name"]} {validated_data["last_name"]}',
                    'currency': 'USD',  # Default currency
                    'country': 'US',    # Default country
                }
            )
        
        # Create user
        user = User.objects.create_user(
            password=password,
            company=company,
            role='ADMIN' if company_name else 'EMPLOYEE',
            **validated_data
        )
        
        # Set company admin if this is the first user
        if company and not company.admin_user:
            company.admin_user = user
            company.save()
        
        return user

class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        """Validate user credentials"""
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials.')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include username and password.')
        
        return attrs

class UserSerializer(serializers.ModelSerializer):
    """Serializer for user details"""
    
    company_name = serializers.CharField(source='company.name', read_only=True)
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    subordinates_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'department', 'employee_id',
            'is_manager_approver', 'is_active', 'company', 'company_name',
            'manager', 'manager_name', 'subordinates_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_subordinates_count(self, obj):
        """Get count of subordinates"""
        return obj.get_subordinates().count()

class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user details"""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'phone',
            'department', 'employee_id', 'role', 'manager',
            'is_manager_approver', 'is_active'
        ]
    
    def validate_manager(self, value):
        """Validate manager assignment"""
        if value and value.role not in ['ADMIN', 'MANAGER']:
            raise serializers.ValidationError('Manager must be an Admin or Manager.')
        return value
    
    def validate_role(self, value):
        """Validate role assignment"""
        if value not in ['ADMIN', 'MANAGER', 'EMPLOYEE']:
            raise serializers.ValidationError('Invalid role.')
        return value

class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password"""
    
    old_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()
    
    def validate(self, attrs):
        """Validate password change"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match.")
        return attrs
    
    def validate_old_password(self, value):
        """Validate old password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value
