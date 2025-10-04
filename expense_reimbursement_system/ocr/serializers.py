from rest_framework import serializers
from .models import OCRResult


class OCRResultSerializer(serializers.ModelSerializer):
    """
    Serializer for OCRResult model.
    """
    class Meta:
        model = OCRResult
        fields = [
            'id',
            'expense',
            'image_file',
            'extracted_text',
            'extracted_amount',
            'extracted_merchant',
            'extracted_date',
            'confidence_score',
            'processing_status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
