from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class OCRResult(models.Model):
    """OCR processing results for receipt images"""
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Image information
    image = models.ImageField(upload_to='ocr_images/%Y/%m/%d/')
    uploaded_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='ocr_results'
    )
    
    # OCR processing status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Extracted data
    raw_text = models.TextField(blank=True, null=True)
    extracted_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    extracted_currency = models.CharField(max_length=3, blank=True, null=True)
    extracted_date = models.DateField(null=True, blank=True)
    extracted_merchant = models.CharField(max_length=200, blank=True, null=True)
    
    # Confidence scores
    amount_confidence = models.FloatField(null=True, blank=True)
    date_confidence = models.FloatField(null=True, blank=True)
    merchant_confidence = models.FloatField(null=True, blank=True)
    
    # Processing information
    processing_time = models.FloatField(null=True, blank=True)  # in seconds
    error_message = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"OCR Result {self.id} - {self.get_status_display()}"
    
    def is_successful(self):
        """Check if OCR processing was successful"""
        return self.status == 'COMPLETED' and self.extracted_amount is not None
    
    def get_confidence_score(self):
        """Get overall confidence score"""
        scores = [
            self.amount_confidence,
            self.date_confidence,
            self.merchant_confidence
        ]
        valid_scores = [s for s in scores if s is not None]
        return sum(valid_scores) / len(valid_scores) if valid_scores else 0
    
    def to_expense_data(self):
        """Convert OCR result to expense data dictionary"""
        return {
            'amount': self.extracted_amount,
            'currency': self.extracted_currency,
            'expense_date': self.extracted_date,
            'merchant_name': self.extracted_merchant,
            'description': f"Receipt from {self.extracted_merchant or 'Unknown merchant'}",
            'ocr_text': self.raw_text,
            'ocr_amount': self.extracted_amount,
            'ocr_date': self.extracted_date,
            'ocr_merchant': self.extracted_merchant,
        }