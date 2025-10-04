from django.urls import path
from . import views

app_name = 'expenses'

urlpatterns = [
    # Expense endpoints
    path('expenses/', views.ExpenseListCreateView.as_view(), name='expense_list_create'),
    path('expenses/<uuid:pk>/', views.ExpenseDetailView.as_view(), name='expense_detail'),
    path('expenses/<uuid:expense_id>/submit/', views.submit_expense, name='submit_expense'),
    path('expenses/<uuid:expense_id>/approve/', views.approve_expense, name='approve_expense'),
    path('expenses/for-approval/', views.expenses_for_approval, name='expenses_for_approval'),
    path('expenses/stats/', views.expense_stats, name='expense_stats'),
    
    # Category endpoints
    path('categories/', views.ExpenseCategoryListCreateView.as_view(), name='category_list_create'),
    path('categories/<int:pk>/', views.ExpenseCategoryDetailView.as_view(), name='category_detail'),
]
