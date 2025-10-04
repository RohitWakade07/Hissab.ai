from django.urls import path
from . import views

app_name = 'approvals'

urlpatterns = [
    # Basic CRUD endpoints
    path('approval-rules/', views.ApprovalRuleListCreateView.as_view(), name='approval_rule_list_create'),
    path('approval-rules/<uuid:pk>/', views.ApprovalRuleDetailView.as_view(), name='approval_rule_detail'),
    path('approval-flows/', views.ApprovalFlowListCreateView.as_view(), name='approval_flow_list_create'),
    path('approval-flows/<uuid:pk>/', views.ApprovalFlowDetailView.as_view(), name='approval_flow_detail'),
    path('approval-steps/', views.ApprovalStepListCreateView.as_view(), name='approval_step_list_create'),
    path('approval-steps/<uuid:pk>/', views.ApprovalStepDetailView.as_view(), name='approval_step_detail'),
    
    # Manager/Admin Approval Workflow endpoints
    path('pending-approvals/', views.pending_approvals, name='pending_approvals'),
    path('approve-expense/<uuid:expense_id>/', views.approve_expense, name='approve_expense'),
    path('approval-statistics/', views.approval_statistics, name='approval_statistics'),
    path('team-expenses/', views.team_expenses, name='team_expenses'),
    path('create-approval-flow/', views.create_approval_flow, name='create_approval_flow'),
    path('approval-flows-list/', views.approval_flows, name='approval_flows'),
    path('approval-history/<uuid:expense_id>/', views.approval_history, name='approval_history'),
]
