// import { componentStyles } from '../styles/theme';
import { AuthService, LoginFormData } from '../services/AuthService';

export interface LoginProps {
  onSuccess: (user: any) => void;
  onSwitchToSignup: () => void;
  onClose: () => void;
}

export class Login {
  private element: HTMLElement;
  private authService: AuthService;
  private onSubmit: (user: any) => void;
  private onSwitchToSignup: () => void;
  private onClose: () => void;

  constructor(props: LoginProps) {
    this.authService = AuthService.getInstance();
    this.onSubmit = props.onSuccess;
    this.onSwitchToSignup = props.onSwitchToSignup;
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
      max-width: 400px;
      border: 1px solid var(--border-color);
      position: relative;
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
    title.textContent = 'Welcome Back';
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

    // Username field
    const usernameGroup = this.createInputGroup('username', 'Username', 'text', true);
    const passwordGroup = this.createInputGroup('password', 'Password', 'password', true);

    // Submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Sign In';
    submitButton.className = 'btn btn-primary';
    submitButton.style.cssText = `
      margin-top: 1rem;
      width: 100%;
    `;

    // Switch to signup
    const switchText = document.createElement('p');
    switchText.style.cssText = `
      text-align: center;
      color: var(--text-secondary);
      margin-top: 1rem;
    `;
    switchText.innerHTML = "Don't have an account? ";

    const switchLink = document.createElement('button');
    switchLink.textContent = 'Sign Up';
    switchLink.style.cssText = `
      background: none;
      border: none;
      color: var(--accent-primary);
      cursor: pointer;
      text-decoration: underline;
    `;
    switchLink.addEventListener('click', () => this.onSwitchToSignup());

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
    form.appendChild(passwordGroup);
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
    const loginData: LoginFormData = {
      username: formData.get('username') as string,
      password: formData.get('password') as string,
    };

    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Signing In...';
    submitButton.disabled = true;

    try {
      const result = await this.authService.login(loginData);
      
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
