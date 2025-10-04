from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    
    # User profile endpoints
    path('profile/', views.user_profile, name='profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('profile/change-password/', views.change_password, name='change_password'),
    path('permissions/', views.user_permissions, name='user_permissions'),
    
    # User management endpoints
    path('users/', views.UserListCreateView.as_view(), name='user_list_create'),
    path('users/<uuid:pk>/', views.UserDetailView.as_view(), name='user_detail'),
    path('users/<uuid:user_id>/assign-manager/', views.assign_manager, name='assign_manager'),
    path('subordinates/', views.subordinates, name='subordinates'),
    
    # Admin management endpoints
    path('admin/users/', views.admin_users, name='admin_users'),
    path('admin/users/create/', views.admin_create_user, name='admin_create_user'),
    path('admin/users/<uuid:user_id>/update/', views.admin_update_user, name='admin_update_user'),
    path('admin/users/<uuid:user_id>/delete/', views.admin_delete_user, name='admin_delete_user'),
    path('admin/users/<uuid:user_id>/set-role/', views.set_user_role, name='set_user_role'),
    path('admin/users/<uuid:user_id>/set-approver/', views.set_manager_approver, name='set_manager_approver'),
    path('admin/users/<uuid:user_id>/assign-manager/', views.assign_manager, name='assign_manager'),
    
    # Manager endpoints
    path('manager/team-users/', views.manager_team_users, name='manager_team_users'),
]