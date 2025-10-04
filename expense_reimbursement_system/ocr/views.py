from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import OCRResult
from .serializers import OCRResultSerializer


class OCRResultListView(generics.ListCreateAPIView):
    """
    List all OCR results or create a new OCR result.
    """
    queryset = OCRResult.objects.all()
    serializer_class = OCRResultSerializer
    permission_classes = [permissions.IsAuthenticated]


class OCRResultDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete an OCR result.
    """
    queryset = OCRResult.objects.all()
    serializer_class = OCRResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def scan_receipt(request):
    """
    Scan a receipt image using OCR.
    """
    if 'image' not in request.FILES:
        return Response(
            {'error': 'No image file provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # For now, return a placeholder response
    # In a real implementation, you would use pytesseract or similar OCR library
    return Response({
        'message': 'OCR functionality not yet implemented',
        'extracted_text': 'Placeholder text',
        'extracted_amount': 0.00,
        'extracted_merchant': 'Placeholder merchant',
        'extracted_date': None,
        'confidence_score': 0.0
    }, status=status.HTTP_200_OK)
