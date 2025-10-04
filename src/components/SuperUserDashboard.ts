import { AuthUser } from '../services/AuthService';
import { IconUtils } from '../utils/icons';

export interface Company {
  id: string;
  name: string;
  description: string;
  currency: string;
  country: string;
  admin_user: string;
  created_at: string;
  user_count: number;
}

export interface CreateCompanyData {
  name: string;
  description: string;
  currency: string;
  country: string;
  admin_username: string;
  admin_email: string;
  admin_first_name: string;
  admin_last_name: string;
  admin_password: string;
}

export class SuperUserDashboard {
  private user: AuthUser;
  private container: HTMLElement;
  private companies: Company[] = [];

  constructor(user: AuthUser, container: HTMLElement) {
    this.user = user;
    this.container = container;
    this.loadCompanies();
  }

  private async loadCompanies(): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/super-user/companies/', {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.companies = data.companies || [];
        this.render();
      } else {
        this.showError('Failed to load companies');
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      this.showError('Network error. Please try again.');
    }
  }

  private render(): void {
    this.container.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      text-align: center;
    `;

    const title = document.createElement('h1');
    title.textContent = 'Super User Dashboard';
    title.style.cssText = `
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 600;
    `;

    const subtitle = document.createElement('p');
    subtitle.textContent = `Welcome back, ${this.user.first_name}! Manage companies and users across the system.`;
    subtitle.style.cssText = `
      margin: 0;
      opacity: 0.9;
      font-size: 1.1rem;
    `;

    header.appendChild(title);
    header.appendChild(subtitle);

    // Company ID Display
    const companyIdSection = document.createElement('div');
    companyIdSection.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
      border-left: 4px solid #8b5cf6;
    `;

    const companyIdTitle = document.createElement('h3');
    companyIdTitle.textContent = 'Your Company ID';
    companyIdTitle.style.cssText = `
      margin: 0 0 1rem 0;
      color: #1f2937;
      font-size: 1.2rem;
      font-weight: 600;
    `;

    const companyIdDisplay = document.createElement('div');
    companyIdDisplay.style.cssText = `
      background: #f3f4f6;
      padding: 1rem;
      border-radius: 8px;
      font-family: monospace;
      font-size: 1rem;
      color: #374151;
      word-break: break-all;
      border: 1px solid #d1d5db;
    `;
    companyIdDisplay.textContent = this.user.company || 'No company assigned';

    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy Company ID';
    copyButton.style.cssText = `
      background: #8b5cf6;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      margin-top: 1rem;
      transition: background-color 0.2s ease;
    `;
    copyButton.addEventListener('click', () => {
      if (this.user.company) {
        navigator.clipboard.writeText(this.user.company);
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
          copyButton.textContent = 'Copy Company ID';
        }, 2000);
      }
    });

    companyIdSection.appendChild(companyIdTitle);
    companyIdSection.appendChild(companyIdDisplay);
    companyIdSection.appendChild(copyButton);

    // Quick Actions
    const actionsSection = document.createElement('div');
    actionsSection.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    `;

    const actionsTitle = document.createElement('h2');
    actionsTitle.textContent = 'Quick Actions';
    actionsTitle.style.cssText = `
      margin: 0 0 1rem 0;
      color: #1f2937;
      font-size: 1.5rem;
      font-weight: 600;
    `;

    const actionsGrid = document.createElement('div');
    actionsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    `;

    const actions = [
      { title: 'Create Company', description: 'Add a new company with admin', icon: 'building', action: 'create-company' },
      { title: 'Manage Companies', description: 'View and manage all companies', icon: 'building2', action: 'manage-companies' },
      { title: 'System Users', description: 'Manage users across all companies', icon: 'users', action: 'system-users' },
      { title: 'System Analytics', description: 'View system-wide analytics', icon: 'barChart', action: 'system-analytics' }
    ];

    actions.forEach(action => {
      const actionCard = this.createActionCard(action.title, action.description, action.icon, action.action);
      actionsGrid.appendChild(actionCard);
    });

    actionsSection.appendChild(actionsTitle);
    actionsSection.appendChild(actionsGrid);

    // Companies List
    const companiesSection = document.createElement('div');
    companiesSection.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    `;

    const companiesTitle = document.createElement('h2');
    companiesTitle.textContent = 'Companies';
    companiesTitle.style.cssText = `
      margin: 0 0 1rem 0;
      color: #1f2937;
      font-size: 1.5rem;
      font-weight: 600;
    `;

    const companiesList = document.createElement('div');
    companiesList.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 1rem;
    `;

    if (this.companies.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.style.cssText = `
        text-align: center;
        padding: 2rem;
        color: #6b7280;
      `;
      emptyState.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem;">🏢</div>
        <p>No companies found</p>
      `;
      companiesList.appendChild(emptyState);
    } else {
      this.companies.forEach(company => {
        const companyCard = this.createCompanyCard(company);
        companiesList.appendChild(companyCard);
      });
    }

    companiesSection.appendChild(companiesTitle);
    companiesSection.appendChild(companiesList);

    this.container.appendChild(header);
    this.container.appendChild(companyIdSection);
    this.container.appendChild(actionsSection);
    this.container.appendChild(companiesSection);
  }

  private createActionCard(title: string, description: string, iconName: string, action: string): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = `
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
      position: relative;
      overflow: hidden;
    `;

    // Add gradient overlay on hover
    const gradientOverlay = document.createElement('div');
    gradientOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 1;
    `;

    card.addEventListener('mouseenter', () => {
      card.style.borderColor = '#6366f1';
      card.style.boxShadow = '0 8px 25px -5px rgba(0, 0, 0, 0.1)';
      card.style.transform = 'translateY(-4px)';
      gradientOverlay.style.opacity = '0.1';
    });

    card.addEventListener('mouseleave', () => {
      card.style.borderColor = '#e5e7eb';
      card.style.boxShadow = 'none';
      card.style.transform = 'translateY(0)';
      gradientOverlay.style.opacity = '0';
    });

    card.addEventListener('click', () => this.handleAction(action));

    const content = document.createElement('div');
    content.style.cssText = `
      position: relative;
      z-index: 2;
    `;

    const iconElement = IconUtils.createIconElement(iconName as any, 40, '#6366f1');
    iconElement.style.cssText = `
      margin-bottom: 1rem;
      transition: color 0.3s ease;
    `;

    const titleElement = document.createElement('div');
    titleElement.textContent = title;
    titleElement.style.cssText = `
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.5rem;
      font-size: 1.1rem;
    `;

    const descElement = document.createElement('div');
    descElement.textContent = description;
    descElement.style.cssText = `
      color: #6b7280;
      font-size: 0.875rem;
      line-height: 1.4;
    `;

    content.appendChild(iconElement);
    content.appendChild(titleElement);
    content.appendChild(descElement);

    card.appendChild(gradientOverlay);
    card.appendChild(content);

    return card;
  }

  private createCompanyCard(company: Company): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = `
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1rem;
      transition: all 0.2s ease;
    `;

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
        <div>
          <div style="font-weight: 600; color: #1f2937; margin-bottom: 0.25rem;">
            ${company.name}
          </div>
          <div style="color: #6b7280; font-size: 0.875rem;">
            ${company.user_count} users • ${company.currency} • ${company.country}
          </div>
        </div>
        <div style="color: #8b5cf6; font-weight: 600; font-size: 0.875rem;">
          ID: ${company.id.substring(0, 8)}...
        </div>
      </div>
      <div style="color: #374151; margin-bottom: 1rem; font-size: 0.9rem;">
        ${company.description || 'No description'}
      </div>
      <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button class="view-company-btn" data-company-id="${company.id}" style="
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        ">View Details</button>
        <button class="manage-company-btn" data-company-id="${company.id}" style="
          background: #8b5cf6;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        ">Manage</button>
      </div>
    `;

    // Add event listeners
    const viewBtn = card.querySelector('.view-company-btn') as HTMLButtonElement;
    const manageBtn = card.querySelector('.manage-company-btn') as HTMLButtonElement;

    viewBtn.addEventListener('click', () => this.viewCompany(company));
    manageBtn.addEventListener('click', () => this.manageCompany(company));

    return card;
  }

  private handleAction(action: string): void {
    switch (action) {
      case 'create-company':
        this.showCreateCompanyForm();
        break;
      case 'manage-companies':
        this.showCompaniesManagement();
        break;
      case 'system-users':
        this.showSystemUsers();
        break;
      case 'system-analytics':
        this.showSystemAnalytics();
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  private showCreateCompanyForm(): void {
    const form = document.createElement('div');
    form.className = 'create-company-form';
    form.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1100;
    `;

    const formContent = document.createElement('div');
    formContent.style.cssText = `
      background-color: var(--background-medium);
      border-radius: 12px;
      padding: 2rem;
      width: 90%;
      max-width: 600px;
      border: 1px solid var(--border-color);
      max-height: 90vh;
      overflow-y: auto;
    `;

    formContent.innerHTML = `
      <h3 style="color: var(--text-primary); margin: 0 0 1.5rem 0;">Create New Company</h3>
      <form id="create-company-form">
        <div style="margin-bottom: 1rem;">
          <label style="display: block; color: var(--text-primary); margin-bottom: 0.5rem;">Company Name *</label>
          <input type="text" name="name" required style="
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            background-color: var(--background-dark);
            color: var(--text-primary);
          ">
        </div>
        
        <div style="margin-bottom: 1rem;">
          <label style="display: block; color: var(--text-primary); margin-bottom: 0.5rem;">Description</label>
          <textarea name="description" rows="3" style="
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            background-color: var(--background-dark);
            color: var(--text-primary);
            resize: vertical;
          "></textarea>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <label style="display: block; color: var(--text-primary); margin-bottom: 0.5rem;">Currency *</label>
            <select name="currency" required style="
              width: 100%;
              padding: 0.75rem;
              border: 1px solid var(--border-color);
              border-radius: 6px;
              background-color: var(--background-dark);
              color: var(--text-primary);
            ">
              <option value="USD">USD</option>
              <option value="INR">INR</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div>
            <label style="display: block; color: var(--text-primary); margin-bottom: 0.5rem;">Country *</label>
            <input type="text" name="country" required value="US" style="
              width: 100%;
              padding: 0.75rem;
              border: 1px solid var(--border-color);
              border-radius: 6px;
              background-color: var(--background-dark);
              color: var(--text-primary);
            ">
          </div>
        </div>
        
        <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid var(--border-color);">
        <h4 style="color: var(--text-primary); margin: 0 0 1rem 0;">Admin User Details</h4>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <label style="display: block; color: var(--text-primary); margin-bottom: 0.5rem;">First Name *</label>
            <input type="text" name="admin_first_name" required style="
              width: 100%;
              padding: 0.75rem;
              border: 1px solid var(--border-color);
              border-radius: 6px;
              background-color: var(--background-dark);
              color: var(--text-primary);
            ">
          </div>
          <div>
            <label style="display: block; color: var(--text-primary); margin-bottom: 0.5rem;">Last Name *</label>
            <input type="text" name="admin_last_name" required style="
              width: 100%;
              padding: 0.75rem;
              border: 1px solid var(--border-color);
              border-radius: 6px;
              background-color: var(--background-dark);
              color: var(--text-primary);
            ">
          </div>
        </div>
        
        <div style="margin-bottom: 1rem;">
          <label style="display: block; color: var(--text-primary); margin-bottom: 0.5rem;">Email *</label>
          <input type="email" name="admin_email" required style="
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            background-color: var(--background-dark);
            color: var(--text-primary);
          ">
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
          <div>
            <label style="display: block; color: var(--text-primary); margin-bottom: 0.5rem;">Username *</label>
            <input type="text" name="admin_username" required style="
              width: 100%;
              padding: 0.75rem;
              border: 1px solid var(--border-color);
              border-radius: 6px;
              background-color: var(--background-dark);
              color: var(--text-primary);
            ">
          </div>
          <div>
            <label style="display: block; color: var(--text-primary); margin-bottom: 0.5rem;">Password *</label>
            <input type="password" name="admin_password" required style="
              width: 100%;
              padding: 0.75rem;
              border: 1px solid var(--border-color);
              border-radius: 6px;
              background-color: var(--background-dark);
              color: var(--text-primary);
            ">
          </div>
        </div>
        
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
          <button type="button" class="cancel-btn" style="
            background: var(--background-light);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
          ">Cancel</button>
          <button type="submit" style="
            background: var(--accent-primary);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
          ">Create Company</button>
        </div>
      </form>
    `;

    // Add event listeners
    const cancelBtn = formContent.querySelector('.cancel-btn') as HTMLButtonElement;
    const companyForm = formContent.querySelector('#create-company-form') as HTMLFormElement;

    cancelBtn.addEventListener('click', () => form.remove());
    companyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateCompany(companyForm, form);
    });

    form.appendChild(formContent);
    document.body.appendChild(form);
  }

  private async handleCreateCompany(form: HTMLFormElement, modal: HTMLElement): Promise<void> {
    const formData = new FormData(form);
    const companyData: CreateCompanyData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      currency: formData.get('currency') as string,
      country: formData.get('country') as string,
      admin_username: formData.get('admin_username') as string,
      admin_email: formData.get('admin_email') as string,
      admin_first_name: formData.get('admin_first_name') as string,
      admin_last_name: formData.get('admin_last_name') as string,
      admin_password: formData.get('admin_password') as string,
    };

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/super-user/companies/create/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });

      if (response.ok) {
        modal.remove();
        await this.loadCompanies(); // Reload the list
        this.showSuccessMessage('Company created successfully!');
      } else {
        let errorMessage = 'Failed to create company';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || 'Unknown error';
        } catch (jsonError) {
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        this.showError(errorMessage);
      }
    } catch (error) {
      console.error('Error creating company:', error);
      this.showError('Network error. Please try again.');
    }
  }

  private viewCompany(company: Company): void {
    alert(`View company: ${company.name}\nID: ${company.id}\nUsers: ${company.user_count}`);
  }

  private manageCompany(company: Company): void {
    alert(`Manage company: ${company.name}`);
  }

  private showCompaniesManagement(): void {
    alert('Companies management feature coming soon!');
  }

  private showSystemUsers(): void {
    alert('System users management feature coming soon!');
  }

  private showSystemAnalytics(): void {
    alert('System analytics feature coming soon!');
  }

  private showError(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      background-color: #fee2e2;
      color: #dc2626;
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      border: 1px solid #fecaca;
      position: fixed;
      top: 2rem;
      right: 2rem;
      z-index: 1200;
      max-width: 400px;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
  }

  private showSuccessMessage(message: string): void {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
      background-color: #d1fae5;
      color: #059669;
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      border: 1px solid #a7f3d0;
      position: fixed;
      top: 2rem;
      right: 2rem;
      z-index: 1200;
      max-width: 400px;
    `;
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.remove();
      }
    }, 5000);
  }
}
