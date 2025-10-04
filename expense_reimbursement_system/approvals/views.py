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
        approval_service.process_approval(expense, user, action, comments)
        
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
