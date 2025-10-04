# ocr_app/models.py
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal

# Model to store OCR Result details (renamed from OCRResult to avoid confusion)
class ProcessedReceipt(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('processed', 'Processed'),
        ('error', 'Error'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # The raw text from OCR before LLM processing
    original_ocr_text = models.TextField(help_text="Raw OCR text extracted from the receipt")
    # Path to the actual uploaded image (if you decide to store it for auditing)
    receipt_image = models.ImageField(
        upload_to='receipt_images/%Y/%m/%d/', 
        null=True, 
        blank=True,
        help_text="Uploaded receipt image"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    # Status to track processing progress
    status = models.CharField(
        max_length=50, 
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Current processing status"
    )
    # A generic field for LLM output (e.g., JSON string) before parsing into ExpenseEntry
    llm_output_raw = models.TextField(
        null=True, 
        blank=True,
        help_text="Raw LLM response before parsing"
    )
    # Any error messages from LLM parsing
    llm_error_message = models.TextField(
        null=True, 
        blank=True,
        help_text="Error message if processing failed"
    )
    # Processing timestamps
    processed_at = models.DateTimeField(null=True, blank=True)
    processing_time_seconds = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = "Processed Receipt"
        verbose_name_plural = "Processed Receipts"

    def __str__(self):
        return f"Receipt {self.id} - {self.status}"

# Model to store the structured expense data from the LLM
class ExpenseEntry(models.Model):
    EXPENSE_TYPE_CHOICES = [
        ('travel', 'Travel'),
        ('meals', 'Meals'),
        ('accommodation', 'Accommodation'),
        ('transport', 'Transport'),
        ('office_supplies', 'Office Supplies'),
        ('utilities', 'Utilities'),
        ('other', 'Other'),
    ]
    
    PAYMENT_MODE_CHOICES = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('upi', 'UPI'),
        ('net_banking', 'Net Banking'),
        ('cheque', 'Cheque'),
        ('other', 'Other'),
    ]
    
    TRAVEL_MODE_CHOICES = [
        ('flight', 'Flight'),
        ('train', 'Train'),
        ('bus', 'Bus'),
        ('taxi', 'Taxi'),
        ('car_rental', 'Car Rental'),
        ('personal_vehicle', 'Personal Vehicle'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Link back to the original processed receipt for auditing
    receipt = models.OneToOneField(
        ProcessedReceipt, 
        on_delete=models.CASCADE, 
        related_name='expense_entry', 
        null=True, 
        blank=True,
        help_text="Associated processed receipt"
    )

    # Core Expense Parameters
    date = models.DateField(null=True, blank=True, help_text="Expense date")
    time = models.TimeField(null=True, blank=True, help_text="Expense time")
    payer_name = models.CharField(max_length=255, null=True, blank=True, help_text="Person who paid")
    receiver_name = models.CharField(max_length=255, null=True, blank=True, help_text="Vendor/merchant name")
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Expense amount"
    )
    currency = models.CharField(
        max_length=3, 
        null=True, 
        blank=True,
        default='INR',
        help_text="Currency code (e.g., INR, USD)"
    )
    type_of_expense = models.CharField(
        max_length=100, 
        choices=EXPENSE_TYPE_CHOICES,
        null=True, 
        blank=True,
        help_text="Category of expense"
    )
    mode_of_payment = models.CharField(
        max_length=100, 
        choices=PAYMENT_MODE_CHOICES,
        null=True, 
        blank=True,
        help_text="Payment method used"
    )
    money_used_for = models.TextField(null=True, blank=True, help_text="Description of expense")
    receipt_number = models.CharField(max_length=255, null=True, blank=True, help_text="Receipt/invoice number")
    gst_no = models.CharField(max_length=255, null=True, blank=True, help_text="GST number")
    upi_transaction_id = models.CharField(max_length=255, null=True, blank=True, help_text="UPI transaction ID")
    is_reimbursable = models.BooleanField(default=True, help_text="Whether this expense is reimbursable")
    project_code = models.CharField(max_length=100, null=True, blank=True, help_text="Project code if applicable")
    location = models.CharField(max_length=255, null=True, blank=True, help_text="Location where expense occurred")

    # Travel-specific fields
    travel_mode = models.CharField(
        max_length=100, 
        choices=TRAVEL_MODE_CHOICES,
        null=True, 
        blank=True,
        help_text="Mode of travel"
    )
    travel_start_date = models.DateField(null=True, blank=True, help_text="Travel start date")
    travel_end_date = models.DateField(null=True, blank=True, help_text="Travel end date")
    travel_origin = models.CharField(max_length=255, null=True, blank=True, help_text="Travel origin")
    travel_destination = models.CharField(max_length=255, null=True, blank=True, help_text="Travel destination")
    flight_number = models.CharField(max_length=50, null=True, blank=True, help_text="Flight number")
    train_number = models.CharField(max_length=50, null=True, blank=True, help_text="Train number")
    airline = models.CharField(max_length=100, null=True, blank=True, help_text="Airline name")
    train_company = models.CharField(max_length=100, null=True, blank=True, help_text="Train company")
    ticket_number = models.CharField(max_length=255, null=True, blank=True, help_text="Ticket number")
    lodging_name = models.CharField(max_length=255, null=True, blank=True, help_text="Hotel/lodging name")
    lodging_check_in = models.DateField(null=True, blank=True, help_text="Check-in date")
    lodging_check_out = models.DateField(null=True, blank=True, help_text="Check-out date")
    rental_car_company = models.CharField(max_length=255, null=True, blank=True, help_text="Car rental company")
    rental_car_pickup = models.TextField(null=True, blank=True, help_text="Car pickup location")
    rental_car_dropoff = models.TextField(null=True, blank=True, help_text="Car dropoff location")
    mileage = models.FloatField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(0.0)],
        help_text="Mileage in kilometers"
    )
    reason_for_travel = models.TextField(null=True, blank=True, help_text="Purpose of travel")

    # Audit fields
    uploaded_by_employee_id = models.CharField(
        max_length=255, 
        null=True, 
        blank=True,
        help_text="Employee ID who uploaded the receipt"
    )
    processed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-processed_at']
        verbose_name = "Expense Entry"
        verbose_name_plural = "Expense Entries"

    def __str__(self):
        return f"{self.payer_name} - {self.amount} {self.currency} for {self.type_of_expense} on {self.date}"