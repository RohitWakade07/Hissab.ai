from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = get_user_model()

class ApprovalRule(models.Model):
    """Rules for conditional approval flows"""
    
    RULE_TYPE_CHOICES = [
        ('PERCENTAGE', 'Percentage Rule'),
        ('SPECIFIC_APPROVER', 'Specific Approver Rule'),
        ('HYBRID', 'Hybrid Rule'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        'companies.Company', 
        on_delete=models.CASCADE, 
        related_name='approval_rules'
    )
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    rule_type = models.CharField(max_length=20, choices=RULE_TYPE_CHOICES)
    
    # Percentage rule settings
    percentage_threshold = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        null=True, 
        blank=True,
        help_text="Percentage of approvers needed (1-100)"
    )
    
    # Specific approver rule settings
    specific_approver = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='specific_approval_rules'
    )
    
    # Amount thresholds
    min_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Minimum amount for this rule to apply"
    )
    max_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Maximum amount for this rule to apply"
    )
    
    # Category restrictions
    categories = models.ManyToManyField(
        'expenses.ExpenseCategory', 
        blank=True,
        help_text="Categories this rule applies to (empty = all categories)"
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_rule_type_display()})"
    
    def applies_to_amount(self, amount):
        """Check if rule applies to given amount"""
        if self.min_amount and amount < self.min_amount:
            return False
        if self.max_amount and amount > self.max_amount:
            return False
        return True
    
    def applies_to_category(self, category):
        """Check if rule applies to given category"""
        if not self.categories.exists():
            return True
        return category in self.categories.all()

class ApprovalFlow(models.Model):
    """Multi-level approval flow configuration"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        'companies.Company', 
        on_delete=models.CASCADE, 
        related_name='approval_flows'
    )
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    
    # Amount thresholds
    min_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    max_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    
    # Category restrictions
    categories = models.ManyToManyField(
        'expenses.ExpenseCategory', 
        blank=True
    )
    
    # Conditional approval rules
    approval_rules = models.ManyToManyField(
        ApprovalRule, 
        blank=True,
        related_name='flows'
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.company.name})"
    
    def applies_to_amount(self, amount):
        """Check if flow applies to given amount"""
        if self.min_amount and amount < self.min_amount:
            return False
        if self.max_amount and amount > self.max_amount:
            return False
        return True
    
    def applies_to_category(self, category):
        """Check if flow applies to given category"""
        if not self.categories.exists():
            return True
        return category in self.categories.all()
    
    def get_steps(self):
        """Get approval steps in order"""
        return self.steps.all().order_by('step_number')

class ApprovalStep(models.Model):
    """Individual step in approval flow"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    flow = models.ForeignKey(
        ApprovalFlow, 
        on_delete=models.CASCADE, 
        related_name='steps'
    )
    
    step_number = models.PositiveIntegerField()
    approver = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='approval_steps'
    )
    
    # Step settings
    is_required = models.BooleanField(default=True)
    can_escalate = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['flow', 'step_number']
        ordering = ['step_number']
    
    def __str__(self):
        return f"{self.flow.name} - Step {self.step_number}: {self.approver.get_full_name()}"

class ExpenseApproval(models.Model):
    """Individual approval record for expenses"""
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('ESCALATED', 'Escalated'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    expense = models.ForeignKey(
        'expenses.Expense', 
        on_delete=models.CASCADE, 
        related_name='approvals'
    )
    approver = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='expense_approvals'
    )
    step = models.ForeignKey(
        ApprovalStep, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    comments = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['expense', 'approver']
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.expense} - {self.approver.get_full_name()} ({self.get_status_display()})"
    
    def approve(self, comments=None):
        """Approve the expense"""
        self.status = 'APPROVED'
        self.comments = comments
        self.approved_at = models.DateTimeField(auto_now=True)
        self.save()
    
    def reject(self, comments=None):
        """Reject the expense"""
        self.status = 'REJECTED'
        self.comments = comments
        self.save()
    
    def escalate(self, comments=None):
        """Escalate the expense"""
        self.status = 'ESCALATED'
        self.comments = comments
        self.save()