from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, Count
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Expense, ExpenseCategory
from .serializers import (
    ExpenseSerializer, 
    ExpenseCreateSerializer, 
    ExpenseUpdateSerializer,
    ExpenseApprovalSerializer,
    ExpenseCategorySerializer,
    ExpenseStatsSerializer
)
from approvals.models import ExpenseApproval

class ExpenseListCreateView(generics.ListCreateAPIView):
    """List and create expenses"""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'category', 'currency']
    search_fields = ['description', 'merchant_name']
    ordering_fields = ['created_at', 'expense_date', 'amount']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ExpenseCreateSerializer
        return ExpenseSerializer
    
    def get_queryset(self):
        """Filter expenses based on user role"""
        user = self.request.user
        queryset = Expense.objects.filter(company=user.company)
        
        if user.is_employee():
            # Employees can only see their own expenses
            queryset = queryset.filter(submitted_by=user)
        elif user.is_manager():
            # Managers can see their team's expenses
            subordinates = user.get_subordinates()
            queryset = queryset.filter(
                Q(submitted_by=user) | Q(submitted_by__in=subordinates)
            )
        # Admins can see all company expenses
        
        return queryset.select_related('submitted_by', 'category', 'current_approver')

class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete expense"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ExpenseUpdateSerializer
        return ExpenseSerializer
    
    def get_queryset(self):
        """Filter expenses based on user role"""
        user = self.request.user
        queryset = Expense.objects.filter(company=user.company)
        
        if user.is_employee():
            queryset = queryset.filter(submitted_by=user)
        elif user.is_manager():
            subordinates = user.get_subordinates()
            queryset = queryset.filter(
                Q(submitted_by=user) | Q(submitted_by__in=subordinates)
            )
        
        return queryset.select_related('submitted_by', 'category', 'current_approver')
    
    def perform_destroy(self, instance):
        """Only allow deletion of draft expenses"""
        if instance.status != 'DRAFT':
            raise PermissionError("Cannot delete non-draft expenses.")
        instance.delete()

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_expense(request, expense_id):
    """Submit expense for approval"""
    try:
        expense = Expense.objects.get(id=expense_id, submitted_by=request.user)
        
        if expense.status != 'DRAFT':
            return Response(
                {'error': 'Expense is already submitted or processed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set status to pending and submitted timestamp
        expense.status = 'PENDING'
        expense.submitted_at = timezone.now()
        
        # Determine approval flow and set current approver
        from approvals.services import ApprovalService
        approval_service = ApprovalService()
        approval_flow = approval_service.get_approval_flow_for_expense(expense)
        
        if approval_flow:
            expense.approval_flow = approval_flow
            first_step = approval_flow.get_steps().first()
            if first_step:
                expense.current_approver = first_step.approver
        
        expense.save()
        
        # Create initial approval record
        if expense.current_approver:
            ExpenseApproval.objects.create(
                expense=expense,
                approver=expense.current_approver,
                status='PENDING'
            )
        
        return Response({
            'message': 'Expense submitted for approval',
            'expense': ExpenseSerializer(expense).data
        })
        
    except Expense.DoesNotExist:
        return Response(
            {'error': 'Expense not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_expense(request, expense_id):
    """Approve, reject, or escalate expense"""
    try:
        expense = Expense.objects.get(id=expense_id)
        
        if not expense.can_be_approved_by(request.user):
            return Response(
                {'error': 'You cannot approve this expense'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ExpenseApprovalSerializer(
            data=request.data, 
            context={'expense': expense, 'request': request}
        )
        
        if serializer.is_valid():
            action = serializer.validated_data['action']
            comments = serializer.validated_data.get('comments', '')
            
            # Get or create approval record
            approval, created = ExpenseApproval.objects.get_or_create(
                expense=expense,
                approver=request.user,
                defaults={'status': 'PENDING'}
            )
            
            if action == 'approve':
                approval.approve(comments)
                
                # Move to next approver or mark as approved
                expense.move_to_next_approver()
                
                return Response({
                    'message': 'Expense approved',
                    'expense': ExpenseSerializer(expense).data
                })
                
            elif action == 'reject':
                approval.reject(comments)
                expense.status = 'REJECTED'
                expense.current_approver = None
                expense.save()
                
                return Response({
                    'message': 'Expense rejected',
                    'expense': ExpenseSerializer(expense).data
                })
                
            elif action == 'escalate':
                approval.escalate(comments)
                # Escalation logic can be implemented here
                
                return Response({
                    'message': 'Expense escalated',
                    'expense': ExpenseSerializer(expense).data
                })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Expense.DoesNotExist:
        return Response(
            {'error': 'Expense not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def expenses_for_approval(request):
    """Get expenses waiting for user's approval"""
    user = request.user
    expenses = user.get_expenses_for_approval()
    serializer = ExpenseSerializer(expenses, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def expense_stats(request):
    """Get expense statistics"""
    user = request.user
    
    # Base queryset
    if user.is_employee():
        queryset = Expense.objects.filter(submitted_by=user)
    elif user.is_manager():
        subordinates = user.get_subordinates()
        queryset = Expense.objects.filter(
            Q(submitted_by=user) | Q(submitted_by__in=subordinates)
        )
    else:  # Admin
        queryset = Expense.objects.filter(company=user.company)
    
    # Calculate statistics
    total_expenses = queryset.count()
    total_amount = queryset.aggregate(total=Sum('amount'))['total'] or 0
    
    pending_expenses = queryset.filter(status='PENDING').count()
    approved_expenses = queryset.filter(status='APPROVED').count()
    rejected_expenses = queryset.filter(status='REJECTED').count()
    
    pending_amount = queryset.filter(status='PENDING').aggregate(total=Sum('amount'))['total'] or 0
    approved_amount = queryset.filter(status='APPROVED').aggregate(total=Sum('amount'))['total'] or 0
    rejected_amount = queryset.filter(status='REJECTED').aggregate(total=Sum('amount'))['total'] or 0
    
    # Expenses by category
    expenses_by_category = {}
    for expense in queryset.select_related('category'):
        category_name = expense.category.name
        if category_name not in expenses_by_category:
            expenses_by_category[category_name] = {'count': 0, 'amount': 0}
        expenses_by_category[category_name]['count'] += 1
        expenses_by_category[category_name]['amount'] += float(expense.amount)
    
    # Expenses by month (last 12 months)
    expenses_by_month = {}
    for i in range(12):
        month_date = timezone.now().date().replace(day=1) - timedelta(days=30*i)
        month_expenses = queryset.filter(
            expense_date__year=month_date.year,
            expense_date__month=month_date.month
        )
        month_key = month_date.strftime('%Y-%m')
        expenses_by_month[month_key] = {
            'count': month_expenses.count(),
            'amount': float(month_expenses.aggregate(total=Sum('amount'))['total'] or 0)
        }
    
    stats_data = {
        'total_expenses': total_expenses,
        'total_amount': total_amount,
        'pending_expenses': pending_expenses,
        'approved_expenses': approved_expenses,
        'rejected_expenses': rejected_expenses,
        'pending_amount': pending_amount,
        'approved_amount': approved_amount,
        'rejected_amount': rejected_amount,
        'expenses_by_category': expenses_by_category,
        'expenses_by_month': expenses_by_month,
    }
    
    serializer = ExpenseStatsSerializer(stats_data)
    return Response(serializer.data)

class ExpenseCategoryListCreateView(generics.ListCreateAPIView):
    """List and create expense categories"""
    queryset = ExpenseCategory.objects.filter(is_active=True)
    serializer_class = ExpenseCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter categories by company"""
        user = self.request.user
        return ExpenseCategory.objects.filter(is_active=True)

class ExpenseCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete expense category"""
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

# Employee-specific endpoints

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_expenses(request):
    """Get current user's expenses with filtering"""
    user = request.user
    
    # Get query parameters for filtering
    status_filter = request.query_params.get('status')
    category_filter = request.query_params.get('category')
    currency_filter = request.query_params.get('currency')
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    # Base queryset - only user's own expenses
    queryset = Expense.objects.filter(submitted_by=user).select_related('category', 'current_approver')
    
    # Apply filters
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    if category_filter:
        queryset = queryset.filter(category_id=category_filter)
    if currency_filter:
        queryset = queryset.filter(currency=currency_filter)
    if start_date:
        queryset = queryset.filter(expense_date__gte=start_date)
    if end_date:
        queryset = queryset.filter(expense_date__lte=end_date)
    
    # Order by creation date (newest first)
    queryset = queryset.order_by('-created_at')
    
    serializer = ExpenseSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_expense_history(request):
    """Get current user's expense history with status breakdown"""
    user = request.user
    
    # Get all user's expenses
    all_expenses = Expense.objects.filter(submitted_by=user).select_related('category', 'current_approver')
    
    # Group by status
    status_groups = {
        'DRAFT': all_expenses.filter(status='DRAFT'),
        'PENDING': all_expenses.filter(status='PENDING'),
        'APPROVED': all_expenses.filter(status='APPROVED'),
        'REJECTED': all_expenses.filter(status='REJECTED'),
        'PAID': all_expenses.filter(status='PAID'),
    }
    
    # Calculate totals for each status
    result = {}
    for status, expenses in status_groups.items():
        expenses_list = expenses.order_by('-created_at')
        total_amount = sum(float(exp.amount) for exp in expenses_list)
        
        result[status.lower()] = {
            'count': expenses_list.count(),
            'total_amount': total_amount,
            'expenses': ExpenseSerializer(expenses_list, many=True).data
        }
    
    # Add overall statistics
    result['summary'] = {
        'total_expenses': all_expenses.count(),
        'total_amount': sum(float(exp.amount) for exp in all_expenses),
        'pending_count': status_groups['PENDING'].count(),
        'approved_count': status_groups['APPROVED'].count(),
        'rejected_count': status_groups['REJECTED'].count(),
    }
    
    return Response(result)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_expense_for_approval(request, expense_id):
    """Submit a draft expense for approval"""
    try:
        expense = Expense.objects.get(id=expense_id, submitted_by=request.user)
        
        if expense.status != 'DRAFT':
            return Response(
                {'error': 'Only draft expenses can be submitted for approval'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate required fields
        if not expense.amount or not expense.category or not expense.description or not expense.expense_date:
            return Response(
                {'error': 'Please fill in all required fields before submitting'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set status to pending and submitted timestamp
        expense.status = 'PENDING'
        expense.submitted_at = timezone.now()
        
        # Use approval service to determine flow and assign approver
        from approvals.services import ApprovalService
        approval_service = ApprovalService()
        
        # Get or create approval flow for this expense
        approval_flow = approval_service.get_approval_flow_for_expense(expense)
        expense.approval_flow = approval_flow
        
        # Determine first approver based on IS_MANAGER_APPROVER field
        first_approver = None
        
        # Check if user has a manager and manager can approve expenses
        if request.user.manager and request.user.manager.can_approve_expenses():
            first_approver = request.user.manager
        else:
            # If no manager or manager can't approve, assign to company admin
            admin_users = User.objects.filter(company=request.user.company, role='ADMIN', is_active=True)
            if admin_users.exists():
                first_approver = admin_users.first()
        
        # Assign expense to first approver
        if first_approver:
            approval_service.assign_expense_to_approver(expense, first_approver)
        
        return Response({
            'message': 'Expense submitted for approval successfully',
            'expense': ExpenseSerializer(expense).data
        })
        
    except Expense.DoesNotExist:
        return Response(
            {'error': 'Expense not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def expense_categories(request):
    """Get available expense categories"""
    categories = ExpenseCategory.objects.filter(is_active=True).order_by('name')
    serializer = ExpenseCategorySerializer(categories, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_expense_stats(request):
    """Get current user's expense statistics"""
    user = request.user
    expenses = Expense.objects.filter(submitted_by=user)
    
    # Calculate statistics
    total_expenses = expenses.count()
    total_amount = sum(float(exp.amount) for exp in expenses)
    
    # Status breakdown
    status_counts = {}
    status_amounts = {}
    for status, _ in Expense.STATUS_CHOICES:
        status_expenses = expenses.filter(status=status)
        status_counts[status] = status_expenses.count()
        status_amounts[status] = sum(float(exp.amount) for exp in status_expenses)
    
    # Category breakdown
    category_breakdown = {}
    for expense in expenses.select_related('category'):
        category_name = expense.category.name
        if category_name not in category_breakdown:
            category_breakdown[category_name] = {'count': 0, 'amount': 0}
        category_breakdown[category_name]['count'] += 1
        category_breakdown[category_name]['amount'] += float(expense.amount)
    
    # Monthly breakdown (last 6 months)
    monthly_breakdown = {}
    for i in range(6):
        month_date = timezone.now().date().replace(day=1) - timedelta(days=30*i)
        month_expenses = expenses.filter(
            expense_date__year=month_date.year,
            expense_date__month=month_date.month
        )
        month_key = month_date.strftime('%Y-%m')
        monthly_breakdown[month_key] = {
            'count': month_expenses.count(),
            'amount': sum(float(exp.amount) for exp in month_expenses)
        }
    
    return Response({
        'total_expenses': total_expenses,
        'total_amount': total_amount,
        'status_breakdown': {
            'counts': status_counts,
            'amounts': status_amounts
        },
        'category_breakdown': category_breakdown,
        'monthly_breakdown': monthly_breakdown
    })