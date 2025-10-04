from rest_framework import serializers
from .models import ApprovalRule, ApprovalFlow, ApprovalStep, ExpenseApproval


class ApprovalRuleSerializer(serializers.ModelSerializer):
    """
    Serializer for ApprovalRule model.
    """
    class Meta:
        model = ApprovalRule
        fields = [
            'id',
            'name',
            'description',
            'rule_type',
            'percentage_threshold',
            'specific_approvers',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ApprovalStepSerializer(serializers.ModelSerializer):
    """
    Serializer for ApprovalStep model.
    """
    approver_name = serializers.CharField(source='approver.get_full_name', read_only=True)
    approver_email = serializers.CharField(source='approver.email', read_only=True)
    
    class Meta:
        model = ApprovalStep
        fields = [
            'id',
            'approval_flow',
            'step_order',
            'approver',
            'approver_name',
            'approver_email',
            'is_required',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ApprovalFlowSerializer(serializers.ModelSerializer):
    """
    Serializer for ApprovalFlow model.
    """
    steps = ApprovalStepSerializer(many=True, read_only=True)
    
    class Meta:
        model = ApprovalFlow
        fields = [
            'id',
            'name',
            'description',
            'company',
            'is_active',
            'steps',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ExpenseApprovalSerializer(serializers.ModelSerializer):
    """
    Serializer for ExpenseApproval model.
    """
    approver_name = serializers.CharField(source='approver.get_full_name', read_only=True)
    approver_email = serializers.CharField(source='approver.email', read_only=True)
    
    class Meta:
        model = ExpenseApproval
        fields = [
            'id',
            'expense',
            'approver',
            'approver_name',
            'approver_email',
            'status',
            'comments',
            'approved_at',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'approved_at']
