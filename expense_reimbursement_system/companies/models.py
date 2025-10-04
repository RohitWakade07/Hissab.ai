from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

class Company(models.Model):
    """Company model for managing organizations"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True, null=True)
    currency = models.CharField(max_length=3, default='USD')  # ISO currency code
    country = models.CharField(max_length=100, default='US')
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    
    # Company settings
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Admin user (auto-created on company creation)
    admin_user = models.OneToOneField(
        'users.User', 
        on_delete=models.CASCADE, 
        related_name='admin_company',
        null=True, 
        blank=True
    )
    
    class Meta:
        verbose_name_plural = "Companies"
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def get_employees(self):
        """Get all employees of this company"""
        return self.users.filter(is_active=True)
    
    def get_managers(self):
        """Get all managers of this company"""
        return self.users.filter(role='MANAGER', is_active=True)
    
    def get_admins(self):
        """Get all admins of this company"""
        return self.users.filter(role='ADMIN', is_active=True)