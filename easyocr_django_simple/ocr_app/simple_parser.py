# ocr_app/simple_parser.py
import re
from datetime import datetime
from decimal import Decimal

def parse_invoice_text(ocr_text):
    """
    Simple rule-based parser for invoice/receipt text.
    No external API calls, no rate limits!
    """
    if not ocr_text:
        return {"success": False, "error": "No OCR text provided"}
    
    # Initialize result with defaults (only valid model fields)
    result = {
        "success": True,
        "data": {
            "payer_name": None,
            "receiver_name": None,
            "amount": None,
            "currency": "USD",  # Default currency
            "type_of_expense": "other",
            "mode_of_payment": None,
            "money_used_for": ocr_text[:200] + ("..." if len(ocr_text) > 200 else ""),
            "receipt_number": None,
            "gst_no": None,
            "upi_transaction_id": None,
            "location": None,
            "date": None,
            "time": None,
            "is_reimbursable": True,
            "project_code": None,
            "travel_mode": None,
            "travel_start_date": None,
            "travel_end_date": None,
            "travel_origin": None,
            "travel_destination": None,
            "flight_number": None,
            "train_number": None,
            "lodging_name": None,  # Fixed: was hotel_name
            "mileage": None,
        }
    }
    
    try:
        # Extract amount (look for currency patterns)
        amount_patterns = [
            r'[\$£€¥₹]\s*(\d+(?:\.\d{2})?)',  # $100.00, £50.00, etc.
            r'(\d+(?:\.\d{2})?)\s*[\$£€¥₹]',  # 100.00$, 50.00£, etc.
            r'TOTAL[:\s]*[\$£€¥₹]?\s*(\d+(?:\.\d{2})?)',  # TOTAL: $100.00
            r'AMOUNT[:\s]*[\$£€¥₹]?\s*(\d+(?:\.\d{2})?)',  # AMOUNT: $100.00
            r'DUE[:\s]*[\$£€¥₹]?\s*(\d+(?:\.\d{2})?)',  # DUE: $100.00
        ]
        
        for pattern in amount_patterns:
            match = re.search(pattern, ocr_text, re.IGNORECASE)
            if match:
                try:
                    result["data"]["amount"] = Decimal(match.group(1))
                    break
                except:
                    continue
        
        # Extract currency
        currency_patterns = [
            (r'[\$]', 'USD'),
            (r'[£]', 'GBP'),
            (r'[€]', 'EUR'),
            (r'[¥]', 'JPY'),
            (r'[₹]', 'INR'),
            (r'GBP', 'GBP'),
            (r'USD', 'USD'),
            (r'EUR', 'EUR'),
        ]
        
        for pattern, currency in currency_patterns:
            if re.search(pattern, ocr_text):
                result["data"]["currency"] = currency
                break
        
        # Extract invoice/receipt number
        invoice_patterns = [
            r'INVOICE[:\s#]*(\w+)',
            r'RECEIPT[:\s#]*(\w+)',
            r'BILL[:\s#]*(\w+)',
            r'NO[:\s]*(\w+)',
            r'NUMBER[:\s]*(\w+)',
        ]
        
        for pattern in invoice_patterns:
            match = re.search(pattern, ocr_text, re.IGNORECASE)
            if match:
                result["data"]["receipt_number"] = match.group(1)
                break
        
        # Extract dates
        date_patterns = [
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',  # MM/DD/YYYY or DD/MM/YYYY
            r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})',    # YYYY/MM/DD
            r'(\d{1,2}\s+\w+\s+\d{4})',          # DD Month YYYY
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, ocr_text)
            if match:
                try:
                    date_str = match.group(1)
                    # Try different date formats
                    for fmt in ['%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d', '%d %B %Y', '%d %b %Y']:
                        try:
                            parsed_date = datetime.strptime(date_str, fmt)
                            result["data"]["date"] = parsed_date.date()
                            break
                        except:
                            continue
                    if result["data"]["date"]:
                        break
                except:
                    continue
        
        # Extract company/vendor names (look for common business patterns)
        company_patterns = [
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:LTD|LLC|INC|CORP|COMPANY)',
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:WOOD|DECOR|SERVICES|SOLUTIONS)',
        ]
        
        for pattern in company_patterns:
            match = re.search(pattern, ocr_text)
            if match:
                result["data"]["receiver_name"] = match.group(1)
                break
        
        # Extract UPI transaction ID
        upi_pattern = r'UPI[:\s]*([A-Z0-9]+)'
        match = re.search(upi_pattern, ocr_text, re.IGNORECASE)
        if match:
            result["data"]["upi_transaction_id"] = match.group(1)
        
        # Determine expense type based on keywords
        travel_keywords = ['flight', 'hotel', 'taxi', 'uber', 'train', 'travel', 'trip']
        meal_keywords = ['restaurant', 'food', 'meal', 'dining', 'cafe']
        fuel_keywords = ['fuel', 'gas', 'petrol', 'diesel']
        
        text_lower = ocr_text.lower()
        if any(keyword in text_lower for keyword in travel_keywords):
            result["data"]["type_of_expense"] = "travel"
        elif any(keyword in text_lower for keyword in meal_keywords):
            result["data"]["type_of_expense"] = "meals"
        elif any(keyword in text_lower for keyword in fuel_keywords):
            result["data"]["type_of_expense"] = "fuel"
        else:
            result["data"]["type_of_expense"] = "other"
        
        # Extract location (look for addresses or city names)
        location_patterns = [
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})',  # City, State
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+PE\d+',        # UK postcode pattern
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, ocr_text)
            if match:
                result["data"]["location"] = match.group(0)
                break
        
        return result
        
    except Exception as e:
        return {
            "success": False, 
            "error": f"Parsing error: {str(e)}",
            "data": result["data"]  # Return partial data
        }
