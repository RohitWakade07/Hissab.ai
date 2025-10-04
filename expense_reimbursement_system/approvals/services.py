from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q, Count
from .models import ApprovalFlow, ApprovalStep, ExpenseApproval, ApprovalRule
from expenses.models import Expense

User = get_user_model()

class ApprovalService:
    """Service for managing approval workflows"""
    
    def get_approval_flow_for_expense(self, expense):
        """Determine the appropriate approval flow for an expense"""
        # For now, return a simple flow based on amount
        # In a real system, this would be more complex
        
        # Check if there's a specific flow for this amount/category
        flows = ApprovalFlow.objects.filter(
            company=expense.company,
            is_active=True
        ).order_by('min_amount')
        
        for flow in flows:
            if flow.applies_to_amount(expense.amount) and flow.applies_to_category(expense.category):
                return flow
        
        # If no specific flow found, create a default one
        return self.create_default_approval_flow(expense)
    
    def create_default_approval_flow(self, expense):
        """Create a default approval flow for an expense"""
        # Create a simple flow: Manager -> Admin (if no specific flow exists)
        flow, created = ApprovalFlow.objects.get_or_create(
            company=expense.company,
            name="Default Approval Flow",
            defaults={
                'description': 'Default approval flow for expenses',
                'is_active': True
            }
        )
        
        if created:
            # Add manager as first step if user has a manager and manager can approve
            if expense.submitted_by.manager and expense.submitted_by.manager.can_approve_expenses():
                ApprovalStep.objects.create(
                    flow=flow,
                    step_number=1,
                    approver=expense.submitted_by.manager,
                    is_required=True
                )
            
            # Add company admin as final step
            admin_users = User.objects.filter(
                company=expense.company,
                role='ADMIN',
                is_active=True
            )
            if admin_users.exists():
                step_number = 2 if expense.submitted_by.manager and expense.submitted_by.manager.can_approve_expenses() else 1
                ApprovalStep.objects.create(
                    flow=flow,
                    step_number=step_number,
                    approver=admin_users.first(),
                    is_required=True
                )
        
        return flow
    
    def assign_expense_to_approver(self, expense, approver):
        """Assign expense to a specific approver"""
        expense.current_approver = approver
        expense.status = 'PENDING'
        expense.submitted_at = timezone.now()
        expense.save()
        
        # Create approval record
        ExpenseApproval.objects.get_or_create(
            expense=expense,
            approver=approver,
            defaults={'status': 'PENDING'}
        )
    
    def process_approval(self, expense, approver, action, comments=None):
        """Process an approval action (approve/reject/escalate)"""
        with transaction.atomic():
            # Get or create approval record
            approval, created = ExpenseApproval.objects.get_or_create(
                expense=expense,
                approver=approver,
                defaults={'status': 'PENDING'}
            )
            
            if action == 'approve':
                approval.approve(comments)
                
                # Move to next approver or mark as approved
                next_approver = self.get_next_approver(expense)
                if next_approver:
                    self.assign_expense_to_approver(expense, next_approver)
                else:
                    # No more approvers, mark as approved
                    expense.status = 'APPROVED'
                    expense.approved_at = timezone.now()
                    expense.current_approver = None
                    expense.save()
                    
            elif action == 'reject':
                approval.reject(comments)
                expense.status = 'REJECTED'
                expense.current_approver = None
                expense.save()
                
            elif action == 'escalate':
                approval.escalate(comments)
                # Escalation logic can be implemented here
                # For now, just mark as escalated
                expense.status = 'ESCALATED'
                expense.save()
    
    def get_next_approver(self, expense):
        """Get the next approver in the flow"""
        if not expense.approval_flow:
            return None
        
        # Get current approval step
        current_step_number = expense.approvals.filter(
            status='APPROVED'
        ).count() + 1
        
        # Get next step
        next_step = ApprovalStep.objects.filter(
            flow=expense.approval_flow,
            step_number=current_step_number
        ).first()
        
        return next_step.approver if next_step else None
    
    def get_expenses_for_approval(self, user):
        """Get expenses waiting for user's approval"""
        return Expense.objects.filter(
            current_approver=user,
            status='PENDING'
        ).select_related('submitted_by', 'category', 'company')
    
    def create_approval_flow(self, company, name, steps_data):
        """Create a new approval flow with steps"""
        with transaction.atomic():
            flow = ApprovalFlow.objects.create(
                company=company,
                name=name,
                description=f"Approval flow: {name}",
                is_active=True
            )
            
            for step_data in steps_data:
                ApprovalStep.objects.create(
                    flow=flow,
                    step_number=step_data['step_number'],
                    approver=step_data['approver'],
                    is_required=step_data.get('is_required', True),
                    can_escalate=step_data.get('can_escalate', False)
                )
            
            return flow
    
    def get_approval_statistics(self, user):
        """Get approval statistics for a user"""
        pending_count = self.get_expenses_for_approval(user).count()
        
        approved_count = ExpenseApproval.objects.filter(
            approver=user,
            status='APPROVED'
        ).count()
        
        rejected_count = ExpenseApproval.objects.filter(
            approver=user,
            status='REJECTED'
        ).count()
        
        return {
            'pending_count': pending_count,
            'approved_count': approved_count,
            'rejected_count': rejected_count,
            'total_processed': approved_count + rejected_count
        }
    
    def evaluate_conditional_approval(self, expense):
        """Evaluate conditional approval rules for an expense"""
        if not expense.approval_flow:
            return False
        
        # Get all approval rules for this flow
        rules = expense.approval_flow.approval_rules.all()
        
        for rule in rules:
            if self.evaluate_approval_rule(expense, rule):
                return True
        
        return False
    
    def evaluate_approval_rule(self, expense, rule):
        """Evaluate a specific approval rule"""
        if rule.rule_type == 'PERCENTAGE':
            return self.evaluate_percentage_rule(expense, rule)
        elif rule.rule_type == 'SPECIFIC_APPROVER':
            return self.evaluate_specific_approver_rule(expense, rule)
        elif rule.rule_type == 'HYBRID':
            return self.evaluate_hybrid_rule(expense, rule)
        
        return False
    
    def evaluate_percentage_rule(self, expense, rule):
        """Evaluate percentage-based approval rule"""
        if not rule.percentage_threshold:
            return False
        
        # Get all approvers for this expense
        approvers = expense.approval_flow.steps.all().values_list('approver', flat=True)
        
        # Get approval counts
        total_approvers = len(approvers)
        approved_count = ExpenseApproval.objects.filter(
            expense=expense,
            approver__in=approvers,
            status='APPROVED'
        ).count()
        
        # Calculate percentage
        if total_approvers == 0:
            return False
        
        approval_percentage = (approved_count / total_approvers) * 100
        
        return approval_percentage >= rule.percentage_threshold
    
    def evaluate_specific_approver_rule(self, expense, rule):
        """Evaluate specific approver rule (e.g., CFO approval)"""
        if not rule.specific_approver:
            return False
        
        # Check if the specific approver has approved
        specific_approval = ExpenseApproval.objects.filter(
            expense=expense,
            approver=rule.specific_approver,
            status='APPROVED'
        ).first()
        
        return specific_approval is not None
    
    def evaluate_hybrid_rule(self, expense, rule):
        """Evaluate hybrid rule (percentage OR specific approver)"""
        percentage_met = False
        specific_approver_met = False
        
        # Check percentage rule
        if rule.percentage_threshold:
            percentage_met = self.evaluate_percentage_rule(expense, rule)
        
        # Check specific approver rule
        if rule.specific_approver:
            specific_approver_met = self.evaluate_specific_approver_rule(expense, rule)
        
        # Hybrid rule: either percentage OR specific approver
        return percentage_met or specific_approver_met
    
    def process_conditional_approval(self, expense, approver, action, comments=None):
        """Process approval with conditional rule evaluation"""
        with transaction.atomic():
            # Get or create approval record
            approval, created = ExpenseApproval.objects.get_or_create(
                expense=expense,
                approver=approver,
                defaults={'status': 'PENDING'}
            )
            
            if action == 'approve':
                approval.approve(comments)
                
                # Check if conditional approval rules are met
                if self.evaluate_conditional_approval(expense):
                    # Conditional approval met - mark as approved
                    expense.status = 'APPROVED'
                    expense.approved_at = timezone.now()
                    expense.current_approver = None
                    expense.save()
                    return True
                else:
                    # Move to next approver
                    next_approver = self.get_next_approver(expense)
                    if next_approver:
                        self.assign_expense_to_approver(expense, next_approver)
                    else:
                        # No more approvers, mark as approved
                        expense.status = 'APPROVED'
                        expense.approved_at = timezone.now()
                        expense.current_approver = None
                        expense.save()
                    return False
                    
            elif action == 'reject':
                approval.reject(comments)
                expense.status = 'REJECTED'
                expense.current_approver = None
                expense.save()
                return True
                
            elif action == 'escalate':
                approval.escalate(comments)
                expense.status = 'ESCALATED'
                expense.save()
                return True
        
        return False
    
    def create_conditional_approval_rule(self, company, name, rule_type, **kwargs):
        """Create a conditional approval rule"""
        rule = ApprovalRule.objects.create(
            company=company,
            name=name,
            rule_type=rule_type,
            **kwargs
        )
        return rule
    
    def get_approval_rule_statistics(self, expense):
        """Get statistics for approval rules on an expense"""
        if not expense.approval_flow:
            return {}
        
        rules = expense.approval_flow.approval_rules.all()
        stats = {}
        
        for rule in rules:
            rule_stats = {
                'rule_name': rule.name,
                'rule_type': rule.rule_type,
                'is_met': self.evaluate_approval_rule(expense, rule)
            }
            
            if rule.rule_type == 'PERCENTAGE':
                approvers = expense.approval_flow.steps.all().values_list('approver', flat=True)
                total_approvers = len(approvers)
                approved_count = ExpenseApproval.objects.filter(
                    expense=expense,
                    approver__in=approvers,
                    status='APPROVED'
                ).count()
                
                rule_stats.update({
                    'total_approvers': total_approvers,
                    'approved_count': approved_count,
                    'percentage_threshold': rule.percentage_threshold,
                    'current_percentage': (approved_count / total_approvers * 100) if total_approvers > 0 else 0
                })
            
            elif rule.rule_type == 'SPECIFIC_APPROVER':
                specific_approval = ExpenseApproval.objects.filter(
                    expense=expense,
                    approver=rule.specific_approver,
                    status='APPROVED'
                ).first()
                
                rule_stats.update({
                    'specific_approver': rule.specific_approver.get_full_name(),
                    'has_approved': specific_approval is not None
                })
            
            stats[rule.id] = rule_stats
        
        return stats

    
    def evaluate_conditional_approval(self, expense):
        """Evaluate conditional approval rules for an expense"""
        if not expense.approval_flow:
            return False
        
        # Get all approval rules for this flow
        rules = expense.approval_flow.approval_rules.all()
        
        for rule in rules:
            if self.evaluate_approval_rule(expense, rule):
                return True
        
        return False
    
    def evaluate_approval_rule(self, expense, rule):
        """Evaluate a specific approval rule"""
        if rule.rule_type == 'PERCENTAGE':
            return self.evaluate_percentage_rule(expense, rule)
        elif rule.rule_type == 'SPECIFIC_APPROVER':
            return self.evaluate_specific_approver_rule(expense, rule)
        elif rule.rule_type == 'HYBRID':
            return self.evaluate_hybrid_rule(expense, rule)
        
        return False
    
    def evaluate_percentage_rule(self, expense, rule):
        """Evaluate percentage-based approval rule"""
        if not rule.percentage_threshold:
            return False
        
        # Get all approvers for this expense
        approvers = expense.approval_flow.steps.all().values_list('approver', flat=True)
        
        # Get approval counts
        total_approvers = len(approvers)
        approved_count = ExpenseApproval.objects.filter(
            expense=expense,
            approver__in=approvers,
            status='APPROVED'
        ).count()
        
        # Calculate percentage
        if total_approvers == 0:
            return False
        
        approval_percentage = (approved_count / total_approvers) * 100
        
        return approval_percentage >= rule.percentage_threshold
    
    def evaluate_specific_approver_rule(self, expense, rule):
        """Evaluate specific approver rule (e.g., CFO approval)"""
        if not rule.specific_approver:
            return False
        
        # Check if the specific approver has approved
        specific_approval = ExpenseApproval.objects.filter(
            expense=expense,
            approver=rule.specific_approver,
            status='APPROVED'
        ).first()
        
        return specific_approval is not None
    
    def evaluate_hybrid_rule(self, expense, rule):
        """Evaluate hybrid rule (percentage OR specific approver)"""
        percentage_met = False
        specific_approver_met = False
        
        # Check percentage rule
        if rule.percentage_threshold:
            percentage_met = self.evaluate_percentage_rule(expense, rule)
        
        # Check specific approver rule
        if rule.specific_approver:
            specific_approver_met = self.evaluate_specific_approver_rule(expense, rule)
        
        # Hybrid rule: either percentage OR specific approver
        return percentage_met or specific_approver_met
    
    def process_conditional_approval(self, expense, approver, action, comments=None):
        """Process approval with conditional rule evaluation"""
        with transaction.atomic():
            # Get or create approval record
            approval, created = ExpenseApproval.objects.get_or_create(
                expense=expense,
                approver=approver,
                defaults={'status': 'PENDING'}
            )
            
            if action == 'approve':
                approval.approve(comments)
                
                # Check if conditional approval rules are met
                if self.evaluate_conditional_approval(expense):
                    # Conditional approval met - mark as approved
                    expense.status = 'APPROVED'
                    expense.approved_at = timezone.now()
                    expense.current_approver = None
                    expense.save()
                    return True
                else:
                    # Move to next approver
                    next_approver = self.get_next_approver(expense)
                    if next_approver:
                        self.assign_expense_to_approver(expense, next_approver)
                    else:
                        # No more approvers, mark as approved
                        expense.status = 'APPROVED'
                        expense.approved_at = timezone.now()
                        expense.current_approver = None
                        expense.save()
                    return False
                    
            elif action == 'reject':
                approval.reject(comments)
                expense.status = 'REJECTED'
                expense.current_approver = None
                expense.save()
                return True
                
            elif action == 'escalate':
                approval.escalate(comments)
                expense.status = 'ESCALATED'
                expense.save()
                return True
        
        return False
    
    def create_conditional_approval_rule(self, company, name, rule_type, **kwargs):
        """Create a conditional approval rule"""
        rule = ApprovalRule.objects.create(
            company=company,
            name=name,
            rule_type=rule_type,
            **kwargs
        )
        return rule
    
    def get_approval_rule_statistics(self, expense):
        """Get statistics for approval rules on an expense"""
        if not expense.approval_flow:
            return {}
        
        rules = expense.approval_flow.approval_rules.all()
        stats = {}
        
        for rule in rules:
            rule_stats = {
                'rule_name': rule.name,
                'rule_type': rule.rule_type,
                'is_met': self.evaluate_approval_rule(expense, rule)
            }
            
            if rule.rule_type == 'PERCENTAGE':
                approvers = expense.approval_flow.steps.all().values_list('approver', flat=True)
                total_approvers = len(approvers)
                approved_count = ExpenseApproval.objects.filter(
                    expense=expense,
                    approver__in=approvers,
                    status='APPROVED'
                ).count()
                
                rule_stats.update({
                    'total_approvers': total_approvers,
                    'approved_count': approved_count,
                    'percentage_threshold': rule.percentage_threshold,
                    'current_percentage': (approved_count / total_approvers * 100) if total_approvers > 0 else 0
                })
            
            elif rule.rule_type == 'SPECIFIC_APPROVER':
                specific_approval = ExpenseApproval.objects.filter(
                    expense=expense,
                    approver=rule.specific_approver,
                    status='APPROVED'
                ).first()
                
                rule_stats.update({
                    'specific_approver': rule.specific_approver.get_full_name(),
                    'has_approved': specific_approval is not None
                })
            
            stats[rule.id] = rule_stats
        
        return stats
