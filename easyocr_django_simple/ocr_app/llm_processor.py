# ocr_app/llm_processor.py
import os
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import ValidationError
from django.conf import settings

from .llm_schemas import ExpenseLLMOutput # Import your Pydantic model

class ExpenseLLMProcessor:
    _instance = None
    _reader_initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ExpenseLLMProcessor, cls).__new__(cls)
            cls._instance._initialize_llm()
        return cls._instance

    def _initialize_llm(self):
        # Initialize LLM only once
        if not self._reader_initialized:
            # Ensure OPENAI_API_KEY is available
            api_key = settings.OPENAI_API_KEY
            if not api_key:
                print("Warning: OPENAI_API_KEY not found in Django settings. LLM processing will be disabled.")
                self._reader_initialized = True
                return

            # Define Parser
            self.parser = PydanticOutputParser(pydantic_object=ExpenseLLMOutput)

            # Define LLM (using gpt-3.5-turbo for current compatibility)
            self.llm = ChatOpenAI(
                model_name="gpt-3.5-turbo",
                temperature=0,
                openai_api_key=api_key
            )

            # Define Prompt Template
            self.prompt_template = ChatPromptTemplate(
                messages=[
                    SystemMessagePromptTemplate.from_template(
                        "You are an AI assistant designed to extract structured expense data from OCR text from receipts or invoices."
                        "Strictly follow the output JSON format provided below. "
                        "Infer values where possible based on common expense patterns, "
                        "but if a parameter is not explicitly present or cannot be reliably inferred, return null for optional fields."
                        "For 'payer_name', if not explicitly mentioned, you can infer it as 'Employee' or leave null."
                        "For 'is_reimbursable', default to True unless context strongly suggests otherwise (e.g., personal shopping)."
                        "Ensure dates are in YYYY-MM-DD format and times in HH:MM:SS."
                        "If the expense is clearly related to travel (e.g., flight, train, hotel, car rental, fuel for a trip), "
                        "populate the 'travel_details' nested object, otherwise leave it null."
                        "Amounts should be extracted as numbers (float)."
                        "UPI Transaction IDs are typically long alphanumeric strings. Extract if found with 'UPI' payment mode."
                        "\n{format_instructions}\n"
                    ),
                    HumanMessagePromptTemplate.from_template("Extract expense details from the following OCR text:\n```\n{text}\n```")
                ],
                input_variables=["text"],
                partial_variables={"format_instructions": self.parser.get_format_instructions()},
            )

            # Create the LangChain chain
            self.chain = self.prompt_template | self.llm | self.parser
            self._reader_initialized = True

    def process_ocr_text_with_llm(self, ocr_text: str) -> dict:
        """
        Processes OCR text using the LLM to extract structured expense data.
        Returns a dictionary of extracted data or an error message.
        """
        if not ocr_text:
            return {"error": "OCR text is empty."}

        # Check if LLM is properly initialized
        if not hasattr(self, 'chain') or not self.chain:
            return {"success": False, "error": "LLM not initialized. Please add OPENAI_API_KEY to .env file.", "raw_llm_output": "LLM not available"}

        try:
            # Invoke the chain
            llm_output_pydantic = self.chain.invoke({"text": ocr_text})
            # Convert Pydantic object to dictionary, excluding None values
            # and handling the nested travel_details
            expense_dict = llm_output_pydantic.model_dump(exclude_none=True)

            # Separate travel details if they exist
            travel_details_dict = expense_dict.pop('travel_details', {})
            # Merge top-level and travel details for flat storage in Django model
            final_data = {**expense_dict, **travel_details_dict}

            return {"success": True, "data": final_data, "raw_llm_output": llm_output_pydantic.model_dump_json(indent=2)}

        except ValidationError as e:
            return {"success": False, "error": f"LLM output validation failed: {e}", "raw_llm_output": str(e)}
        except Exception as e:
            error_str = str(e)
            # Check for quota exceeded error
            if "quota" in error_str.lower() or "insufficient_quota" in error_str.lower():
                return {
                    "success": False, 
                    "error": "OpenAI API quota exceeded. Please check your billing or try a different API key. OCR text extraction is still available.",
                    "raw_llm_output": error_str,
                    "quota_exceeded": True
                }
            return {"success": False, "error": f"An unexpected LLM processing error occurred: {e}", "raw_llm_output": str(e)}

# Singleton instance for easy access and ensuring LLM is initialized once
# Initialize lazily to avoid Django settings issues at import time
expense_llm_processor = None

def get_llm_processor():
    global expense_llm_processor
    if expense_llm_processor is None:
        expense_llm_processor = ExpenseLLMProcessor()
    return expense_llm_processor