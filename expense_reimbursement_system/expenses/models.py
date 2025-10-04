from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from decimal import Decimal
import uuid

User = get_user_model()

class ExpenseCategory(models.Model):
    """Categories for expenses"""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Expense Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Expense(models.Model):
    """Expense model for managing expense claims"""
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('PAID', 'Paid'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Basic expense information
    submitted_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='submitted_expenses'
    )
    company = models.ForeignKey(
        'companies.Company', 
        on_delete=models.CASCADE, 
        related_name='expenses'
    )
    
    # Expense details
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    currency = models.CharField(max_length=3, default='USD')
    category = models.ForeignKey(
        ExpenseCategory, 
        on_delete=models.PROTECT,
        related_name='expenses'
    )
    description = models.TextField()
    expense_date = models.DateField()
    
    # Receipt information
    receipt_image = models.ImageField(
        upload_to='receipts/%Y/%m/%d/', 
        blank=True, 
        null=True
    )
    merchant_name = models.CharField(max_length=200, blank=True, null=True)
    
    # OCR extracted data
    ocr_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    ocr_date = models.DateField(null=True, blank=True)
    ocr_merchant = models.CharField(max_length=200, blank=True, null=True)
    ocr_text = models.TextField(blank=True, null=True)
    
    # Approval workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    current_approver = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='expenses_to_approve'
    )
    approval_flow = models.ForeignKey(
        'approvals.ApprovalFlow', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.submitted_by.get_full_name()} - {self.amount} {self.currency} - {self.category.name}"
    
    def save(self, *args, **kwargs):
        # Auto-set company from submitted_by user
        if not self.company and self.submitted_by and self.submitted_by.company:
            self.company = self.submitted_by.company
        super().save(*args, **kwargs)
    
    def get_status_display_color(self):
        """Get color for status display"""
        colors = {
            'DRAFT': 'gray',
            'PENDING': 'yellow',
            'APPROVED': 'green',
            'REJECTED': 'red',
            'PAID': 'blue',
        }
        return colors.get(self.status, 'gray')
    
    def can_be_edited(self):
        """Check if expense can be edited"""
        return self.status in ['DRAFT', 'PENDING']
    
    def can_be_approved_by(self, user):
        """Check if user can approve this expense"""
        if not user.can_approve_expenses():
            return False
        return self.current_approver == user
    
    def get_approval_history(self):
        """Get approval history for this expense"""
        return self.approvals.all().order_by('created_at')
    
    def get_next_approver(self):
        """Get the next approver in the flow"""
        if not self.approval_flow:
            return None
        
        # Get current approval step
        current_step = self.approvals.filter(
            status='APPROVED'
        ).count()
        
        # Get next step
        next_step = self.approval_flow.steps.filter(
            step_number=current_step + 1
        ).first()
        
        return next_step.approver if next_step else None
    
    def move_to_next_approver(self):
        """Move expense to next approver"""
        from django.utils import timezone
        next_approver = self.get_next_approver()
        if next_approver:
            self.current_approver = next_approver
            self.save()
        else:
            # No more approvers, mark as approved
            self.status = 'APPROVED'
            self.approved_at = timezone.now()
            self.current_approver = None
            self.save()