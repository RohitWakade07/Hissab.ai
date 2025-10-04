from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from expenses.models import Expense
from users.models import User
from .models import ApprovalRule, ApprovalFlow, ApprovalStep


class ConditionalApprovalService:
    """
    Service to handle conditional approval logic based on expense amount and other criteria.
    """
    
    # Hardcoded approval rules as fallback
    HARDCODED_RULES = {
        'amount_thresholds': {
            'auto_approve': Decimal('5000.00'),  # ≤ ₹5,000
            'department_manager': Decimal('25000.00'),  # ≤ ₹25,000
            'finance_head': Decimal('100000.00'),  # ≤ ₹1,00,000
            'managing_director': Decimal('999999999.00')  # > ₹1,00,000
        },
        'escalation_categories': [
            'personal',
            'entertainment',
            'unlisted_vendor'
        ],
        'required_documents': [
            'invoice',
            'receipt',
            'approval_notes'
        ]
    }
    
    def __init__(self):
        self.currency_conversion = {
            'INR': 1.0,
            'USD': 83.0,  # Approximate conversion rate
            'EUR': 90.0,
            'GBP': 105.0,
            'JPY': 0.55,
            'AUD': 54.0
        }
    
    def determine_approval_requirements(self, expense: Expense) -> Dict:
        """
        Determine approval requirements based on expense criteria.
        
        Returns:
            Dict containing approval requirements and escalation info
        """
        try:
            # Convert amount to INR for consistent comparison
            amount_inr = self._convert_to_inr(expense.amount, expense.currency)
            
            # Check for document validation
            document_status = self._validate_documents(expense)
            if not document_status['valid']:
                return {
                    'status': 'REJECTED',
                    'reason': 'Missing or invalid supporting documents',
                    'required_documents': document_status['missing'],
                    'approver_required': None,
                    'escalation_needed': False
                }
            
            # Check for escalation categories
            escalation_needed = self._check_escalation_categories(expense)
            if escalation_needed:
                return {
                    'status': 'ESCALATED',
                    'reason': 'Expense category requires finance review',
                    'required_documents': document_status['present'],
                    'approver_required': 'FINANCE_HEAD',
                    'escalation_needed': True
                }
            
            # Determine approver based on amount
            approver_info = self._determine_approver_by_amount(amount_inr)
            
            return {
                'status': 'PENDING_APPROVAL',
                'reason': f'Requires {approver_info["role"]} approval',
                'required_documents': document_status['present'],
                'approver_required': approver_info['role'],
                'escalation_needed': False,
                'amount_inr': float(amount_inr),
                'threshold_met': approver_info['threshold']
            }
            
        except Exception as e:
            # Fallback to hardcoded rules if backend logic fails
            return self._fallback_approval_logic(expense)
    
    def _convert_to_inr(self, amount: Decimal, currency: str) -> Decimal:
        """Convert amount to INR for consistent comparison."""
        try:
            if currency == 'INR':
                return amount
            
            conversion_rate = self.currency_conversion.get(currency, 1.0)
            return amount * Decimal(str(conversion_rate))
        except:
            # Fallback: assume INR if conversion fails
            return amount
    
    def _validate_documents(self, expense: Expense) -> Dict:
        """Validate if required documents are present."""
        try:
            # Check if expense has receipt image
            has_receipt = bool(expense.receipt_image)
            
            # For now, we'll assume basic validation
            # In a real system, you'd check for actual document presence
            required_docs = self.HARDCODED_RULES['required_documents']
            
            present_docs = []
            missing_docs = []
            
            # Check receipt (basic validation)
            if has_receipt:
                present_docs.append('receipt')
            else:
                missing_docs.append('receipt')
            
            # For demo purposes, assume invoice and approval notes are present
            # if description contains certain keywords
            description_lower = expense.description.lower() if expense.description else ''
            
            if any(keyword in description_lower for keyword in ['invoice', 'bill', 'receipt']):
                present_docs.append('invoice')
            else:
                missing_docs.append('invoice')
            
            # Assume approval notes are present for expenses > 10,000
            if expense.amount > Decimal('10000.00'):
                present_docs.append('approval_notes')
            else:
                missing_docs.append('approval_notes')
            
            return {
                'valid': len(missing_docs) == 0,
                'present': present_docs,
                'missing': missing_docs
            }
            
        except Exception as e:
            # Fallback: assume documents are valid
            return {
                'valid': True,
                'present': ['receipt', 'invoice', 'approval_notes'],
                'missing': []
            }
    
    def _check_escalation_categories(self, expense: Expense) -> bool:
        """Check if expense category requires escalation."""
        try:
            if not expense.category:
                return True  # No category = escalation needed
            
            category_name = expense.category.name.lower()
            escalation_categories = self.HARDCODED_RULES['escalation_categories']
            
            # Check if category matches escalation criteria
            for esc_category in escalation_categories:
                if esc_category in category_name:
                    return True
            
            # Check if merchant name suggests personal/entertainment
            if expense.merchant_name:
                merchant_lower = expense.merchant_name.lower()
                personal_keywords = ['personal', 'entertainment', 'movie', 'restaurant', 'bar', 'club']
                if any(keyword in merchant_lower for keyword in personal_keywords):
                    return True
            
            return False
            
        except Exception as e:
            # Fallback: no escalation
            return False
    
    def _determine_approver_by_amount(self, amount_inr: Decimal) -> Dict:
        """Determine required approver based on amount."""
        thresholds = self.HARDCODED_RULES['amount_thresholds']
        
        if amount_inr <= thresholds['auto_approve']:
            return {
                'role': 'AUTO_APPROVED',
                'threshold': f'≤ ₹{thresholds["auto_approve"]:,.2f}'
            }
        elif amount_inr <= thresholds['department_manager']:
            return {
                'role': 'DEPARTMENT_MANAGER',
                'threshold': f'₹{thresholds["auto_approve"] + 1:,.2f} - ₹{thresholds["department_manager"]:,.2f}'
            }
        elif amount_inr <= thresholds['finance_head']:
            return {
                'role': 'FINANCE_HEAD',
                'threshold': f'₹{thresholds["department_manager"] + 1:,.2f} - ₹{thresholds["finance_head"]:,.2f}'
            }
        else:
            return {
                'role': 'MANAGING_DIRECTOR',
                'threshold': f'> ₹{thresholds["finance_head"]:,.2f}'
            }
    
    def _fallback_approval_logic(self, expense: Expense) -> Dict:
        """Fallback approval logic when main system fails."""
        try:
            # Simple fallback based on amount
            amount_inr = float(expense.amount) if expense.currency == 'INR' else float(expense.amount) * 83
            
            if amount_inr <= 5000:
                return {
                    'status': 'AUTO_APPROVED',
                    'reason': 'Amount ≤ ₹5,000 - Auto approved',
                    'approver_required': 'AUTO',
                    'escalation_needed': False,
                    'amount_inr': amount_inr,
                    'fallback': True
                }
            elif amount_inr <= 25000:
                return {
                    'status': 'PENDING_APPROVAL',
                    'reason': 'Requires Department Manager approval',
                    'approver_required': 'DEPARTMENT_MANAGER',
                    'escalation_needed': False,
                    'amount_inr': amount_inr,
                    'fallback': True
                }
            elif amount_inr <= 100000:
                return {
                    'status': 'PENDING_APPROVAL',
                    'reason': 'Requires Finance Head approval',
                    'approver_required': 'FINANCE_HEAD',
                    'escalation_needed': False,
                    'amount_inr': amount_inr,
                    'fallback': True
                }
            else:
                return {
                    'status': 'PENDING_APPROVAL',
                    'reason': 'Requires Managing Director approval',
                    'approver_required': 'MANAGING_DIRECTOR',
                    'escalation_needed': False,
                    'amount_inr': amount_inr,
                    'fallback': True
                }
        except:
            # Ultimate fallback
            return {
                'status': 'PENDING_APPROVAL',
                'reason': 'Requires manual review',
                'approver_required': 'MANAGER',
                'escalation_needed': True,
                'fallback': True
            }
    
    def get_approval_rules_summary(self) -> Dict:
        """Get summary of approval rules for display."""
        return {
            'rules': {
                'auto_approve': {
                    'amount': f"≤ ₹{self.HARDCODED_RULES['amount_thresholds']['auto_approve']:,.2f}",
                    'approver': 'Automatic',
                    'description': 'No manager approval needed'
                },
                'department_manager': {
                    'amount': f"₹{self.HARDCODED_RULES['amount_thresholds']['auto_approve'] + 1:,.2f} - ₹{self.HARDCODED_RULES['amount_thresholds']['department_manager']:,.2f}",
                    'approver': 'Department Manager',
                    'description': 'Department level approval required'
                },
                'finance_head': {
                    'amount': f"₹{self.HARDCODED_RULES['amount_thresholds']['department_manager'] + 1:,.2f} - ₹{self.HARDCODED_RULES['amount_thresholds']['finance_head']:,.2f}",
                    'approver': 'Finance Head',
                    'description': 'Finance department approval required'
                },
                'managing_director': {
                    'amount': f"> ₹{self.HARDCODED_RULES['amount_thresholds']['finance_head']:,.2f}",
                    'approver': 'Managing Director (MD)',
                    'description': 'Top level approval required'
                }
            },
            'escalation_categories': self.HARDCODED_RULES['escalation_categories'],
            'required_documents': self.HARDCODED_RULES['required_documents'],
            'currency_rates': self.currency_conversion
        }
