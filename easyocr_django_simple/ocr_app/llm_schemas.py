# ocr_app/llm_schemas.py
from pydantic import BaseModel, Field
from typing import Optional
import datetime

class TravelDetails(BaseModel):
    travel_mode: Optional[str] = Field(None, description="e.g., Flight, Train, Taxi, Personal Car, Bus, Toll")
    travel_start_date: Optional[datetime.date] = Field(None, description="Start date of travel segment (YYYY-MM-DD)")
    travel_end_date: Optional[datetime.date] = Field(None, description="End date of travel segment (YYYY-MM-DD)")
    travel_origin: Optional[str] = Field(None, description="Starting point of the journey")
    travel_destination: Optional[str] = Field(None, description="End point of the journey")
    flight_number: Optional[str] = None
    train_number: Optional[str] = None
    airline: Optional[str] = None
    train_company: Optional[str] = None
    ticket_number: Optional[str] = None
    lodging_name: Optional[str] = None
    lodging_check_in: Optional[datetime.date] = None
    lodging_check_out: Optional[datetime.date] = None
    rental_car_company: Optional[str] = None
    rental_car_pickup: Optional[str] = None
    rental_car_dropoff: Optional[str] = None
    mileage: Optional[float] = Field(None, description="Distance traveled in km/miles for personal car")
    reason_for_travel: Optional[str] = None

class ExpenseLLMOutput(BaseModel): # Renamed to avoid clash with Django model
    date: Optional[datetime.date] = Field(None, description="Date of the transaction (YYYY-MM-DD)")
    time: Optional[datetime.time] = Field(None, description="Time of the transaction (HH:MM:SS)")
    payer_name: Optional[str] = Field(None, description="Name of the employee or company making the payment")
    receiver_name: Optional[str] = Field(None, description="Name of the vendor or merchant")
    amount: Optional[float] = Field(None, description="Total monetary value of the expense")
    currency: Optional[str] = Field(None, description="Currency of the amount (e.g., INR, USD, EUR)")
    type_of_expense: Optional[str] = Field(None, description="High-level classification (e.g., Food, Travel, Office Supplies, Fuel, Lodging)")
    mode_of_payment: Optional[str] = Field(None, description="How the payment was made (e.g., Credit Card, Debit Card, Cash, Bank Transfer, UPI)")
    money_used_for: Optional[str] = Field(None, description="Brief description/purpose of the expense")
    receipt_id: Optional[str] = Field(None, description="Unique identifier from the receipt/invoice")
    gst_no: Optional[str] = Field(None, description="GST number of the merchant")
    upi_transaction_id: Optional[str] = Field(None, description="UPI Transaction ID, if mode of payment is UPI")
    is_reimbursable: Optional[bool] = Field(True, description="True if the expense is eligible for reimbursement, False otherwise")
    project_code: Optional[str] = Field(None, description="Internal project code or department")
    location: Optional[str] = Field(None, description="City or location where the expense occurred")

    travel_details: Optional[TravelDetails] = Field(None, description="Specific details if type_of_expense is 'Travel'")