// import { componentStyles } from '../styles/theme';

export interface ExpenseSubmissionProps {
  onSuccess: (expense: any) => void;
  onCancel: () => void;
}

export interface ExpenseFormData {
  amount: string;
  currency: string;
  category: string;
  description: string;
  expense_date: string;
  merchant_name?: string;
  receipt_image?: File;
}

export class ExpenseSubmission {
  private element: HTMLElement;
  private onSubmit: (expense: any) => void;
  private onCancel: () => void;
  private categories: any[] = [];

  constructor(props: ExpenseSubmissionProps) {
    this.onSubmit = props.onSuccess;
    this.onCancel = props.onCancel;
    this.element = this.createElement();
    this.loadCategories();
  }

  private createElement(): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'expense-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;

    const modalContent = document.createElement('div');
    modalContent.className = 'expense-modal-content';
    modalContent.style.cssText = `
      background-color: var(--background-medium);
      border-radius: 12px;
      padding: 2rem;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      border: 1px solid var(--border-color);
      position: relative;
    `;

    // Close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: none;
      border: none;
      font-size: 1.5rem;
      color: var(--text-secondary);
      cursor: pointer;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s ease;
    `;
    closeButton.addEventListener('click', () => this.onCancel());
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.backgroundColor = 'var(--background-light)';
    });
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.backgroundColor = 'transparent';
    });

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Submit Expense Claim';
    title.style.cssText = `
      color: var(--text-primary);
      margin: 0 0 1.5rem 0;
      font-size: 1.5rem;
      font-weight: 600;
    `;

    // Form
    const form = document.createElement('form');
    form.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 1rem;
    `;

    // Create form fields
    const amountGroup = this.createInputGroup('amount', 'Amount *', 'number', true);
    const currencyGroup = this.createSelectGroup('currency', 'Currency *', [
      { value: 'USD', text: 'USD - US Dollar' },
      { value: 'CAD', text: 'CAD - Canadian Dollar' },
      { value: 'GBP', text: 'GBP - British Pound' },
      { value: 'AUD', text: 'AUD - Australian Dollar' },
      { value: 'EUR', text: 'EUR - Euro' },
      { value: 'INR', text: 'INR - Indian Rupee' },
      { value: 'JPY', text: 'JPY - Japanese Yen' }
    ], 'USD');
    const categoryGroup = this.createSelectGroup('category', 'Category *', [], '');
    const descriptionGroup = this.createTextAreaGroup('description', 'Description *', true);
    const dateGroup = this.createInputGroup('expense_date', 'Expense Date *', 'date', true);
    const merchantGroup = this.createInputGroup('merchant_name', 'Merchant Name', 'text', false);
    const receiptGroup = this.createFileGroup('receipt_image', 'Receipt Image', 'image/*');

    // Submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Submit Expense';
    submitButton.className = 'btn btn-primary';
    submitButton.style.cssText = `
      margin-top: 1rem;
      width: 100%;
    `;

    // Error message
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.style.cssText = `
      color: #ff6b6b;
      font-size: 0.9rem;
      margin-top: 0.5rem;
      display: none;
    `;

    form.appendChild(amountGroup);
    form.appendChild(currencyGroup);
    form.appendChild(categoryGroup);
    form.appendChild(descriptionGroup);
    form.appendChild(dateGroup);
    form.appendChild(merchantGroup);
    form.appendChild(receiptGroup);
    form.appendChild(submitButton);
    form.appendChild(errorMessage);

    modalContent.appendChild(closeButton);
    modalContent.appendChild(title);
    modalContent.appendChild(form);

    modal.appendChild(modalContent);

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit(form, errorMessage);
    });

    // Load categories after form is fully constructed
    setTimeout(() => {
      this.loadCategories(categoryGroup);
    }, 100);

    return modal;
  }

  private createInputGroup(name: string, label: string, type: string, required: boolean = false): HTMLElement {
    const group = document.createElement('div');
    group.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    `;

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.style.cssText = `
      color: var(--text-primary);
      font-weight: 500;
    `;

    const input = document.createElement('input');
    input.type = type;
    input.name = name;
    input.required = required;
    input.style.cssText = `
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background-color: var(--background-light);
      color: var(--text-primary);
      font-size: 1rem;
      transition: border-color 0.2s ease;
    `;

    if (type === 'number') {
      input.step = '0.01';
      input.min = '0.01';
    }

    input.addEventListener('focus', () => {
      input.style.borderColor = 'var(--accent-primary)';
    });

    input.addEventListener('blur', () => {
      input.style.borderColor = 'var(--border-color)';
    });

    group.appendChild(labelElement);
    group.appendChild(input);

    return group;
  }

  private createSelectGroup(name: string, label: string, options: Array<{value: string, text: string}>, defaultValue: string): HTMLElement {
    const group = document.createElement('div');
    group.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    `;

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.style.cssText = `
      color: var(--text-primary);
      font-weight: 500;
    `;

    const select = document.createElement('select');
    select.name = name;
    select.style.cssText = `
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background-color: var(--background-light);
      color: var(--text-primary);
      font-size: 1rem;
      transition: border-color 0.2s ease;
    `;

    // Add options
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.text;
      if (option.value === defaultValue) {
        optionElement.selected = true;
      }
      select.appendChild(optionElement);
    });

    select.addEventListener('focus', () => {
      select.style.borderColor = 'var(--accent-primary)';
    });

    select.addEventListener('blur', () => {
      select.style.borderColor = 'var(--border-color)';
    });

    group.appendChild(labelElement);
    group.appendChild(select);

    return group;
  }

  private createTextAreaGroup(name: string, label: string, required: boolean = false): HTMLElement {
    const group = document.createElement('div');
    group.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    `;

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.style.cssText = `
      color: var(--text-primary);
      font-weight: 500;
    `;

    const textarea = document.createElement('textarea');
    textarea.name = name;
    textarea.required = required;
    textarea.rows = 3;
    textarea.style.cssText = `
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background-color: var(--background-light);
      color: var(--text-primary);
      font-size: 1rem;
      font-family: inherit;
      resize: vertical;
      transition: border-color 0.2s ease;
    `;

    textarea.addEventListener('focus', () => {
      textarea.style.borderColor = 'var(--accent-primary)';
    });

    textarea.addEventListener('blur', () => {
      textarea.style.borderColor = 'var(--border-color)';
    });

    group.appendChild(labelElement);
    group.appendChild(textarea);

    return group;
  }

  private createFileGroup(name: string, label: string, accept: string): HTMLElement {
    const group = document.createElement('div');
    group.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    `;

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.style.cssText = `
      color: var(--text-primary);
      font-weight: 500;
    `;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.name = name;
    fileInput.accept = accept;
    fileInput.style.cssText = `
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background-color: var(--background-light);
      color: var(--text-primary);
      font-size: 1rem;
      transition: border-color 0.2s ease;
    `;

    fileInput.addEventListener('focus', () => {
      fileInput.style.borderColor = 'var(--accent-primary)';
    });

    fileInput.addEventListener('blur', () => {
      fileInput.style.borderColor = 'var(--border-color)';
    });

    group.appendChild(labelElement);
    group.appendChild(fileInput);

    return group;
  }

  private async loadCategories(): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/expense-categories/', {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (response.ok) {
        this.categories = await response.json();
        this.updateCategoryOptions();
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }

  private updateCategoryOptions(): void {
    const categorySelect = this.element.querySelector('select[name="category"]') as HTMLSelectElement;
    if (categorySelect) {
      // Clear existing options except the first one
      while (categorySelect.children.length > 0) {
        categorySelect.removeChild(categorySelect.firstChild!);
      }

      // Add default option
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Select a category';
      categorySelect.appendChild(defaultOption);

      // Add category options
      this.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
      });
    }
  }

  private async handleSubmit(form: HTMLFormElement, errorMessage: HTMLElement): Promise<void> {
    const formData = new FormData(form);
    
    // Validate required fields
    const amount = formData.get('amount') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const expenseDate = formData.get('expense_date') as string;
    
    if (!amount || !category || !description || !expenseDate) {
      this.showError(errorMessage, 'Please fill in all required fields');
      return;
    }

    // Validate amount
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      this.showError(errorMessage, 'Please enter a valid amount greater than 0');
      return;
    }

    // Validate date
    const expenseDateObj = new Date(expenseDate);
    const today = new Date();
    if (expenseDateObj > today) {
      this.showError(errorMessage, 'Expense date cannot be in the future');
      return;
    }

    // Validate category
    const categoryValue = parseInt(category);
    if (isNaN(categoryValue) || categoryValue <= 0) {
      this.showError(errorMessage, 'Please select a valid category');
      return;
    }

    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Submitting...';
    submitButton.disabled = true;

    try {
      const token = localStorage.getItem('auth_token');
      
      // Convert FormData to JSON
      const expenseData = {
        amount: amount,
        currency: 'USD',
        category: parseInt(category),
        description: description,
        expense_date: expenseDate,
        merchant_name: formData.get('merchant_name') as string || '',
      };
      
      // Debug logging
      console.log('Expense data being sent:', expenseData);
      console.log('Category value:', category, 'Parsed:', parseInt(category));
      
      const response = await fetch('http://localhost:8000/api/expenses/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError);
        this.showError(errorMessage, `Server error (${response.status}): Invalid response format`);
        return;
      }

      if (response.ok) {
        this.onSubmit(data);
      } else {
        console.error('Expense submission failed:', response.status, data);
        
        // Handle different types of error responses
        let errorMsg = 'Failed to submit expense';
        
        if (data.error) {
          errorMsg = data.error;
        } else if (data.detail) {
          errorMsg = data.detail;
        } else if (data.message) {
          errorMsg = data.message;
        } else if (typeof data === 'object') {
          // Handle validation errors (field-specific errors)
          const fieldErrors = [];
          for (const [field, errors] of Object.entries(data)) {
            if (Array.isArray(errors)) {
              fieldErrors.push(`${field}: ${errors.join(', ')}`);
            } else if (typeof errors === 'string') {
              fieldErrors.push(`${field}: ${errors}`);
            }
          }
          if (fieldErrors.length > 0) {
            errorMsg = fieldErrors.join('; ');
          }
        }
        
        this.showError(errorMessage, errorMsg);
      }
    } catch (error) {
      this.showError(errorMessage, 'Network error. Please try again.');
    } finally {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  }

  private async loadCategories(categoryGroup: HTMLElement): Promise<void> {
    try {
      // Validate categoryGroup parameter
      if (!categoryGroup) {
        console.error('CategoryGroup is undefined or null');
        return;
      }

      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch('http://localhost:8000/api/categories/', {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const categories = data.results || data; // Handle both paginated and non-paginated responses
        const select = categoryGroup.querySelector('select') as HTMLSelectElement;
        
        if (!select) {
          console.error('Select element not found in category group');
          return;
        }
        
        // Clear existing options
        select.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a category...';
        select.appendChild(defaultOption);
        
        // Add category options
        if (Array.isArray(categories)) {
          categories.forEach((category: any) => {
            const option = document.createElement('option');
            option.value = category.id.toString();
            option.textContent = category.name;
            select.appendChild(option);
          });
          console.log(`Loaded ${categories.length} categories successfully`);
        } else {
          console.error('Categories is not an array:', categories);
        }
      } else {
        console.error('Failed to load categories:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  private showError(errorElement: HTMLElement, message: string): void {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }

  public render(container: HTMLElement): void {
    container.appendChild(this.element);
  }

  public destroy(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
