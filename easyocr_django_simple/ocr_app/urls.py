# ocr_app/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.upload_image, name='upload_image'),
    path('receipt/<uuid:receipt_id>/', views.receipt_detail, name='receipt_detail'),
    path('cleanup/<uuid:receipt_id>/', views.cleanup_image, name='cleanup_image'),
]