import { componentStyles } from '../styles/theme';
import { AuthService, SignupFormData } from '../services/AuthService';

export interface SignupProps {
  onSuccess: (user: any) => void;
  onSwitchToLogin: () => void;
  onClose: () => void;
}

export class Signup {
  private element: HTMLElement;
  private authService: AuthService;
  private onSubmit: (user: any) => void;
  private onSwitchToLogin: () => void;
  private onClose: () => void;

  constructor(props: SignupProps) {
    this.authService = AuthService.getInstance();
    this.onSubmit = props.onSuccess;
    this.onSwitchToLogin = props.onSwitchToLogin;
    this.onClose = props.onClose;
    this.element = this.createElement();
  }

  private createElement(): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
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
    modalContent.className = 'auth-modal-content';
    modalContent.style.cssText = `
      background-color: var(--background-medium);
      border-radius: 12px;
      padding: 2rem;
      width: 90%;
      max-width: 450px;
      border: 1px solid var(--border-color);
      position: relative;
      max-height: 90vh;
      overflow-y: auto;
    `;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.5rem;
    `;
    closeButton.addEventListener('click', () => this.onClose());

    const title = document.createElement('h2');
    title.textContent = 'Join Hisab Dost';
    title.style.cssText = `
      color: var(--text-primary);
      margin-bottom: 1.5rem;
      text-align: center;
    `;

    const form = document.createElement('form');
    form.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 1rem;
    `;

    // Create form fields
    const usernameGroup = this.createInputGroup('username', 'Username', 'text', true);
    const emailGroup = this.createInputGroup('email', 'Email', 'email', true);
    const firstNameGroup = this.createInputGroup('first_name', 'First Name', 'text', true);
    const lastNameGroup = this.createInputGroup('last_name', 'Last Name', 'text', true);
    const passwordGroup = this.createInputGroup('password', 'Password', 'password', true);
    const passwordConfirmGroup = this.createInputGroup('password_confirm', 'Confirm Password', 'password', true);
    const companyGroup = this.createInputGroup('company_name', 'Company Name (Optional)', 'text', false);
    const phoneGroup = this.createInputGroup('phone', 'Phone (Optional)', 'tel', false);
    const departmentGroup = this.createInputGroup('department', 'Department (Optional)', 'text', false);

    // Submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Create Account';
    submitButton.className = 'btn btn-primary';
    submitButton.style.cssText = `
      margin-top: 1rem;
      width: 100%;
    `;

    // Switch to login
    const switchText = document.createElement('p');
    switchText.style.cssText = `
      text-align: center;
      color: var(--text-secondary);
      margin-top: 1rem;
    `;
    switchText.innerHTML = "Already have an account? ";

    const switchLink = document.createElement('button');
    switchLink.textContent = 'Sign In';
    switchLink.style.cssText = `
      background: none;
      border: none;
      color: var(--accent-primary);
      cursor: pointer;
      text-decoration: underline;
    `;
    switchLink.addEventListener('click', () => this.onSwitchToLogin());

    switchText.appendChild(switchLink);

    // Error message
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.style.cssText = `
      color: #ff6b6b;
      font-size: 0.9rem;
      margin-top: 0.5rem;
      display: none;
    `;

    form.appendChild(usernameGroup);
    form.appendChild(emailGroup);
    form.appendChild(firstNameGroup);
    form.appendChild(lastNameGroup);
    form.appendChild(passwordGroup);
    form.appendChild(passwordConfirmGroup);
    form.appendChild(companyGroup);
    form.appendChild(phoneGroup);
    form.appendChild(departmentGroup);
    form.appendChild(submitButton);
    form.appendChild(errorMessage);

    modalContent.appendChild(closeButton);
    modalContent.appendChild(title);
    modalContent.appendChild(form);
    modalContent.appendChild(switchText);

    modal.appendChild(modalContent);

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit(form, errorMessage);
    });

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
      background-color: var(--background-dark);
      color: var(--text-primary);
      font-size: 1rem;
    `;

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

  private async handleSubmit(form: HTMLFormElement, errorMessage: HTMLElement): Promise<void> {
    const formData = new FormData(form);
    
    // Validate passwords match
    const password = formData.get('password') as string;
    const passwordConfirm = formData.get('password_confirm') as string;
    
    if (password !== passwordConfirm) {
      this.showError(errorMessage, 'Passwords do not match');
      return;
    }

    const signupData: SignupFormData = {
      username: formData.get('username') as string,
      email: formData.get('email') as string,
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      password: password,
      password_confirm: passwordConfirm,
      company_name: formData.get('company_name') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      department: formData.get('department') as string || undefined,
    };

    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Creating Account...';
    submitButton.disabled = true;

    try {
      const result = await this.authService.signup(signupData);
      
      if (result.success) {
        this.onSubmit(result.user);
        this.onClose();
      } else {
        this.showError(errorMessage, result.message);
      }
    } catch (error) {
      this.showError(errorMessage, 'An unexpected error occurred');
    } finally {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  }

  private showError(errorElement: HTMLElement, message: string): void {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public render(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }

  public destroy(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
