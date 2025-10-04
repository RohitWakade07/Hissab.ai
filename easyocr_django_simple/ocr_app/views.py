# ocr_app/views.py
import easyocr
import os
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.core.files.storage import FileSystemStorage
from django.conf import settings
from decimal import Decimal # For handling monetary values

from .forms import ImageUploadForm
from .models import ProcessedReceipt, ExpenseEntry # Import new models
# Import simple parser (no external API calls, no rate limits!)
from .simple_parser import parse_invoice_text

# Initialize EasyOCR reader (do this once)
reader = easyocr.Reader(['en'])

def upload_image(request):
    if request.method == 'POST':
        form = ImageUploadForm(request.POST, request.FILES)
        if form.is_valid():
            uploaded_file = request.FILES['image']
            fs = FileSystemStorage(location=settings.MEDIA_ROOT)
            filename = fs.save(uploaded_file.name, uploaded_file)
            filepath = os.path.join(settings.MEDIA_ROOT, filename)

            ocr_text = "No text extracted."
            llm_processing_status = "Not processed."
            llm_processed_data = None
            llm_error = None
            raw_llm_output = None

            # 1. Store the uploaded receipt info (before OCR for robustness)
            receipt_instance = ProcessedReceipt.objects.create(
                receipt_image=filename # Store just the filename, not the full URL
                # You might want to rename the file to something unique before saving it permanently
                # For this prototype, we'll delete it later, so just store its temp path.
            )
            receipt_instance.status = 'ocr_pending'
            receipt_instance.save()

            try:
                # --- OCR Processing ---
                if not os.path.exists(filepath):
                    raise FileNotFoundError(f"Uploaded file not found at {filepath}")

                results = reader.readtext(filepath)
                if results:
                    ocr_text = "\n".join([result[1] for result in results])
                else:
                    ocr_text = "No text could be extracted from the image by OCR."

                receipt_instance.original_ocr_text = ocr_text
                receipt_instance.status = 'llm_pending'
                receipt_instance.save()

                # --- Simple Parser Processing (No API calls, no rate limits!) ---
                parse_result = parse_invoice_text(ocr_text)
                
                if parse_result["success"]:
                    parsed_data = parse_result["data"]
                    llm_processing_status = "Processed by simple parser successfully."
                    receipt_instance.status = 'processed'
                    receipt_instance.llm_output_raw = '{"message": "Processed using simple rule-based parser - no external API calls required!"}'

                    # Create and save ExpenseEntry
                    expense_entry = ExpenseEntry.objects.create(
                        receipt=receipt_instance,
                        **parsed_data
                    )
                    expense_entry.save()
                    receipt_instance.save() # Save status after expense entry created

                else:
                    llm_processing_status = "Simple parser failed."
                    llm_error = parse_result["error"]
                    receipt_instance.status = 'processed'  # Still mark as processed since OCR worked
                    receipt_instance.llm_error_message = llm_error
                    receipt_instance.llm_output_raw = '{"message": "Simple parser failed - showing basic OCR text only."}'
                    receipt_instance.save()
                    
                    # Create a basic expense entry even when parsing fails
                    basic_expense_data = {
                        'money_used_for': f"OCR Text: {ocr_text[:200]}{'...' if len(ocr_text) > 200 else ''}",
                        'type_of_expense': 'other',
                        'is_reimbursable': True,
                    }
                    expense_entry = ExpenseEntry.objects.create(
                        receipt=receipt_instance,
                        **basic_expense_data
                    )


            except FileNotFoundError as e:
                ocr_text = f"Error: Uploaded file not found. ({e})"
                receipt_instance.status = 'file_error'
                receipt_instance.llm_error_message = str(e)
                receipt_instance.save()
            except Exception as e:
                ocr_text = f"An unexpected error occurred during OCR/LLM processing: {e}"
                receipt_instance.status = 'processing_error'
                receipt_instance.llm_error_message = str(e)
                receipt_instance.save()
            # Schedule file cleanup after a delay to allow viewing
            # The file will be cleaned up when the receipt detail page is accessed

            # Redirect to a details page for the ProcessedReceipt
            return redirect('receipt_detail', receipt_id=receipt_instance.id)

        else: # Form is not valid
            return render(request, 'ocr_app/upload.html', {'form': form})
    else: # GET request
        form = ImageUploadForm()
    return render(request, 'ocr_app/upload.html', {'form': form})

def receipt_detail(request, receipt_id):
    receipt_instance = get_object_or_404(ProcessedReceipt, id=receipt_id)
    expense_entry = None
    if receipt_instance.status == 'processed':
        try:
            expense_entry = receipt_instance.expense_entry
        except ExpenseEntry.DoesNotExist:
            pass # Should not happen if status is 'processed' but good to handle

    # Check if the image file still exists
    image_available = False
    if receipt_instance.receipt_image:
        filepath = os.path.join(settings.MEDIA_ROOT, receipt_instance.receipt_image.name)
        image_available = os.path.exists(filepath)
    
    context = {
        'receipt': receipt_instance,
        'expense_entry': expense_entry,
        'image_available': image_available,
    }
    
    return render(request, 'ocr_app/receipt_detail.html', context)

@require_POST
def cleanup_image(request, receipt_id):
    """
    Clean up the uploaded image file after it has been viewed.
    """
    receipt_instance = get_object_or_404(ProcessedReceipt, id=receipt_id)
    
    if receipt_instance.receipt_image:
        filepath = os.path.join(settings.MEDIA_ROOT, receipt_instance.receipt_image.name)
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
                print(f"Successfully deleted temporary file via cleanup endpoint: {filepath}")
                return JsonResponse({'status': 'success', 'message': 'Image cleaned up successfully'})
            except Exception as e:
                print(f"Error deleting temporary file {filepath}: {e}")
                return JsonResponse({'status': 'error', 'message': str(e)})
        else:
            return JsonResponse({'status': 'info', 'message': 'File already cleaned up'})
    else:
        return JsonResponse({'status': 'info', 'message': 'No image to clean up'})