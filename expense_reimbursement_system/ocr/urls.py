from django.urls import path
from . import views

app_name = 'ocr'

urlpatterns = [
    path('ocr/scan-receipt/', views.scan_receipt, name='scan_receipt'),
    path('ocr/results/', views.OCRResultListView.as_view(), name='ocr_result_list'),
    path('ocr/results/<uuid:pk>/', views.OCRResultDetailView.as_view(), name='ocr_result_detail'),
]
