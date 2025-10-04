from rest_framework import serializers
from .models import Expense, ExpenseCategory
from users.models import User
from companies.models import Company

class ExpenseCategorySerializer(serializers.ModelSerializer):
    """Serializer for expense categories"""
    
    class Meta:
        model = ExpenseCategory
        fields = ['id', 'name', 'description', 'is_active', 'created_at']

class ExpenseSerializer(serializers.ModelSerializer):
    """Serializer for expenses"""
    
    submitted_by_name = serializers.CharField(source='submitted_by.get_full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    current_approver_name = serializers.CharField(source='current_approver.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    can_be_edited = serializers.BooleanField(read_only=True)
    approval_history = serializers.SerializerMethodField()
    
    class Meta:
        model = Expense
        fields = [
            'id', 'submitted_by', 'submitted_by_name', 'company', 'company_name',
            'amount', 'currency', 'category', 'category_name', 'description',
            'expense_date', 'receipt_image', 'merchant_name',
            'ocr_amount', 'ocr_date', 'ocr_merchant', 'ocr_text',
            'status', 'status_display', 'current_approver', 'current_approver_name',
            'approval_flow', 'can_be_edited', 'approval_history',
            'created_at', 'updated_at', 'submitted_at', 'approved_at'
        ]
        read_only_fields = [
            'id', 'submitted_by', 'company', 'created_at', 'updated_at',
            'submitted_at', 'approved_at'
        ]
    
    def get_approval_history(self, obj):
        """Get approval history for the expense"""
        from approvals.serializers import ExpenseApprovalSerializer
        approvals = obj.get_approval_history()
        return ExpenseApprovalSerializer(approvals, many=True).data
    
    def create(self, validated_data):
        """Create expense with auto-assignment of company and submitted_by"""
        validated_data['submitted_by'] = self.context['request'].user
        validated_data['company'] = self.context['request'].user.company
        return super().create(validated_data)
    
    def validate_amount(self, value):
        """Validate expense amount"""
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0.")
        return value
    
    def validate_expense_date(self, value):
        """Validate expense date"""
        from django.utils import timezone
        if value > timezone.now().date():
            raise serializers.ValidationError("Expense date cannot be in the future.")
        return value

class ExpenseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating expenses"""
    
    class Meta:
        model = Expense
        fields = [
            'amount', 'currency', 'category', 'description',
            'expense_date', 'receipt_image', 'merchant_name'
        ]
    
    def create(self, validated_data):
        """Create expense with auto-assignment"""
        validated_data['submitted_by'] = self.context['request'].user
        validated_data['company'] = self.context['request'].user.company
        return super().create(validated_data)

class ExpenseUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating expenses"""
    
    class Meta:
        model = Expense
        fields = [
            'amount', 'currency', 'category', 'description',
            'expense_date', 'receipt_image', 'merchant_name'
        ]
    
    def validate(self, attrs):
        """Validate expense update"""
        if self.instance.status not in ['DRAFT', 'PENDING']:
            raise serializers.ValidationError("Cannot edit approved or rejected expenses.")
        return attrs

class ExpenseApprovalSerializer(serializers.Serializer):
    """Serializer for expense approval/rejection"""
    
    action = serializers.ChoiceField(choices=['approve', 'reject', 'escalate'])
    comments = serializers.CharField(required=False, allow_blank=True)
    
    def validate_action(self, value):
        """Validate approval action"""
        expense = self.context['expense']
        user = self.context['request'].user
        
        if not expense.can_be_approved_by(user):
            raise serializers.ValidationError("You cannot approve this expense.")
        
        return value

class ExpenseStatsSerializer(serializers.Serializer):
    """Serializer for expense statistics"""
    
    total_expenses = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    pending_expenses = serializers.IntegerField()
    approved_expenses = serializers.IntegerField()
    rejected_expenses = serializers.IntegerField()
    pending_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    approved_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    rejected_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    expenses_by_category = serializers.DictField()
    expenses_by_month = serializers.DictField()
