from django.urls import path
from . import views

app_name = 'approvals'

urlpatterns = [
    path('approval-rules/', views.ApprovalRuleListCreateView.as_view(), name='approval_rule_list_create'),
    path('approval-rules/<uuid:pk>/', views.ApprovalRuleDetailView.as_view(), name='approval_rule_detail'),
    path('approval-flows/', views.ApprovalFlowListCreateView.as_view(), name='approval_flow_list_create'),
    path('approval-flows/<uuid:pk>/', views.ApprovalFlowDetailView.as_view(), name='approval_flow_detail'),
    path('approval-steps/', views.ApprovalStepListCreateView.as_view(), name='approval_step_list_create'),
    path('approval-steps/<uuid:pk>/', views.ApprovalStepDetailView.as_view(), name='approval_step_detail'),
]
