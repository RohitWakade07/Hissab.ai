from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from .models import ApprovalRule, ApprovalFlow, ApprovalStep, ExpenseApproval
from .serializers import ApprovalRuleSerializer, ApprovalFlowSerializer, ApprovalStepSerializer, ExpenseApprovalSerializer
from .services import ApprovalService
from expenses.models import Expense
from expenses.serializers import ExpenseSerializer


class ApprovalRuleListCreateView(generics.ListCreateAPIView):
    """
    List all approval rules or create a new approval rule.
    """
    queryset = ApprovalRule.objects.all()
    serializer_class = ApprovalRuleSerializer
    permission_classes = [permissions.IsAuthenticated]


class ApprovalRuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete an approval rule.
    """
    queryset = ApprovalRule.objects.all()
    serializer_class = ApprovalRuleSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'


class ApprovalFlowListCreateView(generics.ListCreateAPIView):
    """
    List all approval flows or create a new approval flow.
    """
    queryset = ApprovalFlow.objects.all()
    serializer_class = ApprovalFlowSerializer
    permission_classes = [permissions.IsAuthenticated]


class ApprovalFlowDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete an approval flow.
    """
    queryset = ApprovalFlow.objects.all()
    serializer_class = ApprovalFlowSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'


class ApprovalStepListCreateView(generics.ListCreateAPIView):
    """
    List all approval steps or create a new approval step.
    """
    queryset = ApprovalStep.objects.all()
    serializer_class = ApprovalStepSerializer
    permission_classes = [permissions.IsAuthenticated]


class ApprovalStepDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete an approval step.
    """
    queryset = ApprovalStep.objects.all()
    serializer_class = ApprovalStepSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

# Manager/Admin Approval Workflow Views

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def pending_approvals(request):
    """Get expenses waiting for current user's approval"""
    user = request.user
    
    if not user.can_approve_expenses():
        return Response(
            {'error': 'You do not have permission to approve expenses'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    approval_service = ApprovalService()
    expenses = approval_service.get_expenses_for_approval(user)
    
    serializer = ExpenseSerializer(expenses, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_expense(request, expense_id):
    """Approve, reject, or escalate an expense"""
    user = request.user
    
    if not user.can_approve_expenses():
        return Response(
            {'error': 'You do not have permission to approve expenses'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        expense = Expense.objects.get(id=expense_id)
        
        # Check if user is the current approver
        if expense.current_approver != user:
            return Response(
                {'error': 'This expense is not assigned to you for approval'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        action = request.data.get('action')
        comments = request.data.get('comments', '')
        
        if action not in ['approve', 'reject', 'escalate']:
            return Response(
                {'error': 'Invalid action. Must be approve, reject, or escalate'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        approval_service = ApprovalService()
        # Use conditional approval processing
        conditional_approved = approval_service.process_conditional_approval(expense, user, action, comments)
        
        # Return updated expense
        serializer = ExpenseSerializer(expense)
        return Response({
            'message': f'Expense {action}d successfully',
            'expense': serializer.data
        })
        
    except Expense.DoesNotExist:
        return Response(
            {'error': 'Expense not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def approval_statistics(request):
    """Get approval statistics for current user"""
    user = request.user
    
    if not user.can_approve_expenses():
        return Response(
            {'error': 'You do not have permission to view approval statistics'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    approval_service = ApprovalService()
    stats = approval_service.get_approval_statistics(user)
    
    return Response(stats)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def team_expenses(request):
    """Get expenses from user's team (for managers/admins)"""
    user = request.user
    
    if user.is_employee():
        return Response(
            {'error': 'Only managers and admins can view team expenses'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get expenses from subordinates
    if user.is_manager():
        subordinates = user.get_subordinates()
        expenses = Expense.objects.filter(
            submitted_by__in=subordinates
        ).select_related('submitted_by', 'category', 'current_approver')
    else:  # Admin
        expenses = Expense.objects.filter(
            company=user.company
        ).select_related('submitted_by', 'category', 'current_approver')
    
    # Apply filters
    status_filter = request.query_params.get('status')
    if status_filter:
        expenses = expenses.filter(status=status_filter)
    
    expenses = expenses.order_by('-created_at')
    
    serializer = ExpenseSerializer(expenses, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_approval_flow(request):
    """Create a new approval flow (Admin only)"""
    user = request.user
    
    if not user.is_admin():
        return Response(
            {'error': 'Only admins can create approval flows'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    name = request.data.get('name')
    steps_data = request.data.get('steps', [])
    
    if not name or not steps_data:
        return Response(
            {'error': 'Name and steps are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate steps data
    for i, step_data in enumerate(steps_data):
        if 'approver_id' not in step_data:
            return Response(
                {'error': f'Step {i+1} missing approver_id'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            approver = user.company.users.get(id=step_data['approver_id'])
            step_data['approver'] = approver
            step_data['step_number'] = i + 1
        except:
            return Response(
                {'error': f'Invalid approver for step {i+1}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    approval_service = ApprovalService()
    flow = approval_service.create_approval_flow(user.company, name, steps_data)
    
    serializer = ApprovalFlowSerializer(flow)
    return Response({
        'message': 'Approval flow created successfully',
        'flow': serializer.data
    }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def approval_flows(request):
    """Get approval flows for company (Admin only)"""
    user = request.user
    
    if not user.is_admin():
        return Response(
            {'error': 'Only admins can view approval flows'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    flows = ApprovalFlow.objects.filter(
        company=user.company,
        is_active=True
    ).prefetch_related('steps__approver')
    
    serializer = ApprovalFlowSerializer(flows, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def approval_history(request, expense_id):
    """Get approval history for an expense"""
    try:
        expense = Expense.objects.get(id=expense_id)
        
        # Check if user has permission to view this expense
        if not (expense.submitted_by == request.user or 
                request.user.can_approve_expenses() or 
                request.user.is_admin()):
            return Response(
                {'error': 'You do not have permission to view this expense'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        approvals = expense.approvals.all().order_by('created_at')
        serializer = ExpenseApprovalSerializer(approvals, many=True)
        
        return Response({
            'expense_id': expense_id,
            'approval_history': serializer.data
        })
        
    except Expense.DoesNotExist:
        return Response(
            {'error': 'Expense not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def general_approval_history(request):
    """Get general approval history for managers/admins"""
    user = request.user
    
    if not user.can_approve_expenses():
        return Response(
            {'error': 'You do not have permission to view approval history'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get all approvals made by this user or in their company
    approvals = ExpenseApproval.objects.filter(
        Q(approver=user) | Q(expense__company=user.company)
    ).select_related('expense', 'expense__submitted_by', 'approver').order_by('-created_at')
    
    # Limit to recent approvals (last 100)
    approvals = approvals[:100]
    
    serializer = ExpenseApprovalSerializer(approvals, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def conditional_approval_rules(request):
    """Get conditional approval rules and logic"""
    try:
        from .conditional_service import ConditionalApprovalService
        conditional_service = ConditionalApprovalService()
        rules_summary = conditional_service.get_approval_rules_summary()
        
        return Response({
            'success': True,
            'rules_summary': rules_summary,
            'message': 'Conditional approval rules loaded successfully'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': 'Failed to load conditional approval rules',
            'fallback_rules': {
                'auto_approve': '≤ ₹5,000',
                'department_manager': '₹5,001 - ₹25,000',
                'finance_head': '₹25,001 - ₹1,00,000',
                'managing_director': '> ₹1,00,000'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def test_conditional_approval(request):
    """Test conditional approval logic for a given expense"""
    try:
        from .conditional_service import ConditionalApprovalService
        from expenses.models import Expense
        
        expense_id = request.data.get('expense_id')
        if not expense_id:
            return Response(
                {'error': 'expense_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            expense = Expense.objects.get(id=expense_id)
        except Expense.DoesNotExist:
            return Response(
                {'error': 'Expense not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        conditional_service = ConditionalApprovalService()
        approval_info = conditional_service.determine_approval_requirements(expense)
        
        return Response({
            'success': True,
            'expense_id': expense_id,
            'approval_info': approval_info,
            'expense_details': {
                'amount': str(expense.amount),
                'currency': expense.currency,
                'category': expense.category.name if expense.category else 'No category',
                'description': expense.description,
                'merchant_name': expense.merchant_name
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Failed to test conditional approval: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_approval_rule(request):
    """Create a new conditional approval rule (Admin only)"""
    user = request.user
    
    if not user.is_admin():
        return Response(
            {'error': 'Only admins can create approval rules'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    rule_type = request.data.get('rule_type')
    name = request.data.get('name')
    
    if not rule_type or not name:
        return Response(
            {'error': 'Rule type and name are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if rule_type not in ['PERCENTAGE', 'SPECIFIC_APPROVER', 'HYBRID']:
        return Response(
            {'error': 'Invalid rule type'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    approval_service = ApprovalService()
    
    # Prepare rule data
    rule_data = {
        'name': name,
        'description': request.data.get('description', ''),
        'min_amount': request.data.get('min_amount'),
        'max_amount': request.data.get('max_amount'),
        'percentage_threshold': request.data.get('percentage_threshold'),
        'specific_approver_id': request.data.get('specific_approver_id')
    }
    
    # Validate specific approver if provided
    if rule_data['specific_approver_id']:
        try:
            specific_approver = user.company.users.get(id=rule_data['specific_approver_id'])
            rule_data['specific_approver'] = specific_approver
        except:
            return Response(
                {'error': 'Invalid specific approver'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Create the rule
    rule = approval_service.create_conditional_approval_rule(
        company=user.company,
        rule_type=rule_type,
        **rule_data
    )
    
    serializer = ApprovalRuleSerializer(rule)
    return Response({
        'message': 'Approval rule created successfully',
        'rule': serializer.data
    }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def approval_rule_statistics(request, expense_id):
    """Get approval rule statistics for an expense"""
    try:
        expense = Expense.objects.get(id=expense_id)
        
        # Check if user has permission to view this expense
        if not (expense.submitted_by == request.user or 
                request.user.can_approve_expenses() or 
                request.user.is_admin()):
            return Response(
                {'error': 'You do not have permission to view this expense'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        approval_service = ApprovalService()
        rule_stats = approval_service.get_approval_rule_statistics(expense)
        
        return Response({
            'expense_id': expense_id,
            'rule_statistics': rule_stats
        })
        
    except Expense.DoesNotExist:
        return Response(
            {'error': 'Expense not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def conditional_approval_rules(request):
    """Get conditional approval rules for company (Admin only)"""
    user = request.user
    
    if not user.is_admin():
        return Response(
            {'error': 'Only admins can view approval rules'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    rules = ApprovalRule.objects.filter(
        company=user.company
    ).prefetch_related('specific_approver')
    
    serializer = ApprovalRuleSerializer(rules, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def assign_rule_to_flow(request):
    """Assign approval rules to an approval flow (Admin only)"""
    user = request.user
    
    if not user.is_admin():
        return Response(
            {'error': 'Only admins can assign rules to flows'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    flow_id = request.data.get('flow_id')
    rule_ids = request.data.get('rule_ids', [])
    
    if not flow_id or not rule_ids:
        return Response(
            {'error': 'Flow ID and rule IDs are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        flow = ApprovalFlow.objects.get(id=flow_id, company=user.company)
        rules = ApprovalRule.objects.filter(
            id__in=rule_ids, 
            company=user.company
        )
        
        # Assign rules to flow
        flow.approval_rules.set(rules)
        
        return Response({
            'message': f'Assigned {rules.count()} rules to flow',
            'flow_id': flow_id,
            'rule_count': rules.count()
        })
        
    except ApprovalFlow.DoesNotExist:
        return Response(
            {'error': 'Approval flow not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_approval_rule(request):
    """Create a new conditional approval rule (Admin only)"""
    user = request.user
    
    if not user.is_admin():
        return Response(
            {'error': 'Only admins can create approval rules'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    rule_type = request.data.get('rule_type')
    name = request.data.get('name')
    
    if not rule_type or not name:
        return Response(
            {'error': 'Rule type and name are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if rule_type not in ['PERCENTAGE', 'SPECIFIC_APPROVER', 'HYBRID']:
        return Response(
            {'error': 'Invalid rule type'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    approval_service = ApprovalService()
    
    # Prepare rule data
    rule_data = {
        'name': name,
        'description': request.data.get('description', ''),
        'min_amount': request.data.get('min_amount'),
        'max_amount': request.data.get('max_amount'),
        'percentage_threshold': request.data.get('percentage_threshold'),
        'specific_approver_id': request.data.get('specific_approver_id')
    }
    
    # Validate specific approver if provided
    if rule_data['specific_approver_id']:
        try:
            specific_approver = user.company.users.get(id=rule_data['specific_approver_id'])
            rule_data['specific_approver'] = specific_approver
        except:
            return Response(
                {'error': 'Invalid specific approver'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Create the rule
    rule = approval_service.create_conditional_approval_rule(
        company=user.company,
        rule_type=rule_type,
        **rule_data
    )
    
    serializer = ApprovalRuleSerializer(rule)
    return Response({
        'message': 'Approval rule created successfully',
        'rule': serializer.data
    }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def approval_rule_statistics(request, expense_id):
    """Get approval rule statistics for an expense"""
    try:
        expense = Expense.objects.get(id=expense_id)
        
        # Check if user has permission to view this expense
        if not (expense.submitted_by == request.user or 
                request.user.can_approve_expenses() or 
                request.user.is_admin()):
            return Response(
                {'error': 'You do not have permission to view this expense'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        approval_service = ApprovalService()
        rule_stats = approval_service.get_approval_rule_statistics(expense)
        
        return Response({
            'expense_id': expense_id,
            'rule_statistics': rule_stats
        })
        
    except Expense.DoesNotExist:
        return Response(
            {'error': 'Expense not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def conditional_approval_rules(request):
    """Get conditional approval rules for company (Admin only)"""
    user = request.user
    
    if not user.is_admin():
        return Response(
            {'error': 'Only admins can view approval rules'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    rules = ApprovalRule.objects.filter(
        company=user.company
    ).prefetch_related('specific_approver')
    
    serializer = ApprovalRuleSerializer(rules, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def assign_rule_to_flow(request):
    """Assign approval rules to an approval flow (Admin only)"""
    user = request.user
    
    if not user.is_admin():
        return Response(
            {'error': 'Only admins can assign rules to flows'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    flow_id = request.data.get('flow_id')
    rule_ids = request.data.get('rule_ids', [])
    
    if not flow_id or not rule_ids:
        return Response(
            {'error': 'Flow ID and rule IDs are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        flow = ApprovalFlow.objects.get(id=flow_id, company=user.company)
        rules = ApprovalRule.objects.filter(
            id__in=rule_ids, 
            company=user.company
        )
        
        # Assign rules to flow
        flow.approval_rules.set(rules)
        
        return Response({
            'message': f'Assigned {rules.count()} rules to flow',
            'flow_id': flow_id,
            'rule_count': rules.count()
        })
        
    except ApprovalFlow.DoesNotExist:
        return Response(
            {'error': 'Approval flow not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
