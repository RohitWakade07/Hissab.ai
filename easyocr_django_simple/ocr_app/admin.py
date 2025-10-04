from django.contrib import admin
from .models import ProcessedReceipt, ExpenseEntry

@admin.register(ProcessedReceipt)
class ProcessedReceiptAdmin(admin.ModelAdmin):
    list_display = ['id', 'status', 'uploaded_at', 'processed_at']
    list_filter = ['status', 'uploaded_at']
    search_fields = ['id', 'original_ocr_text']
    readonly_fields = ['id', 'uploaded_at', 'processed_at', 'processing_time_seconds']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'status', 'uploaded_at', 'processed_at', 'processing_time_seconds')
        }),
        ('Receipt Data', {
            'fields': ('receipt_image', 'original_ocr_text')
        }),
        ('Processing Results', {
            'fields': ('llm_output_raw', 'llm_error_message'),
            'classes': ('collapse',)
        }),
    )

@admin.register(ExpenseEntry)
class ExpenseEntryAdmin(admin.ModelAdmin):
    list_display = ['id', 'payer_name', 'amount', 'currency', 'type_of_expense', 'date', 'is_reimbursable']
    list_filter = ['type_of_expense', 'mode_of_payment', 'is_reimbursable', 'date', 'processed_at']
    search_fields = ['payer_name', 'receiver_name', 'receipt_number', 'upi_transaction_id']
    readonly_fields = ['id', 'processed_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'receipt', 'date', 'time', 'processed_at')
        }),
        ('Expense Details', {
            'fields': ('payer_name', 'receiver_name', 'amount', 'currency', 'type_of_expense', 'mode_of_payment', 'money_used_for')
        }),
        ('Receipt Information', {
            'fields': ('receipt_number', 'gst_no', 'upi_transaction_id', 'location')
        }),
        ('Business Details', {
            'fields': ('is_reimbursable', 'project_code', 'uploaded_by_employee_id')
        }),
        ('Travel Information', {
            'fields': ('travel_mode', 'travel_start_date', 'travel_end_date', 'travel_origin', 'travel_destination', 'reason_for_travel'),
            'classes': ('collapse',)
        }),
        ('Transportation Details', {
            'fields': ('flight_number', 'train_number', 'airline', 'train_company', 'ticket_number'),
            'classes': ('collapse',)
        }),
        ('Accommodation Details', {
            'fields': ('lodging_name', 'lodging_check_in', 'lodging_check_out'),
            'classes': ('collapse',)
        }),
        ('Vehicle Details', {
            'fields': ('rental_car_company', 'rental_car_pickup', 'rental_car_dropoff', 'mileage'),
            'classes': ('collapse',)
        }),
    )
