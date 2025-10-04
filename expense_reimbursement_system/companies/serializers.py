from rest_framework import serializers
from .models import Company


class CompanySerializer(serializers.ModelSerializer):
    """
    Serializer for Company model.
    """
    admin_user_name = serializers.CharField(source='admin_user.get_full_name', read_only=True)
    admin_user_email = serializers.CharField(source='admin_user.email', read_only=True)
    
    class Meta:
        model = Company
        fields = [
            'id',
            'name',
            'description',
            'currency',
            'address',
            'phone',
            'email',
            'website',
            'admin_user',
            'admin_user_name',
            'admin_user_email',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'admin_user']
