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
    
    # User management endpoints
    path('users/', views.UserListCreateView.as_view(), name='user_list_create'),
    path('users/<uuid:pk>/', views.UserDetailView.as_view(), name='user_detail'),
    path('users/<uuid:user_id>/assign-manager/', views.assign_manager, name='assign_manager'),
    path('subordinates/', views.subordinates, name='subordinates'),
    
    # Admin management endpoints
    path('admin/users/', views.admin_list_users, name='admin_list_users'),
    path('admin/users/create/', views.admin_create_user, name='admin_create_user'),
    path('admin/users/<uuid:user_id>/update/', views.admin_update_user, name='admin_update_user'),
    path('admin/users/<uuid:user_id>/assign-manager/', views.admin_assign_manager, name='admin_assign_manager'),
    path('admin/users/<uuid:user_id>/change-role/', views.admin_change_role, name='admin_change_role'),
    path('admin/managers/', views.admin_get_managers, name='admin_get_managers'),
]
