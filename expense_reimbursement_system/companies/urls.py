from django.urls import path
from . import views

app_name = 'companies'

urlpatterns = [
    path('companies/', views.CompanyListCreateView.as_view(), name='company_list_create'),
    path('companies/<uuid:pk>/', views.CompanyDetailView.as_view(), name='company_detail'),
]
