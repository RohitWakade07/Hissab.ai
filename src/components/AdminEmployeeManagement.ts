import { IconUtils } from '../utils/icons';
import { AuthUser } from '../services/AuthService';

export interface Employee {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'SUPER_USER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  phone?: string;
  department?: string;
  employee_id?: string;
  is_manager_approver: boolean;
  is_active: boolean;
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
}

export interface CreateEmployeeData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  phone?: string;
  department?: string;
  employee_id?: string;
  role: 'MANAGER' | 'EMPLOYEE';
  manager_id?: string;
  is_manager_approver: boolean;
}

export class AdminEmployeeManagement {
  private element: HTMLElement;
  private onClose: () => void;
  private employees: Employee[] = [];
  private managers: Employee[] = [];
  private currentUser: AuthUser;

  constructor(props: { onClose: () => void; currentUser: AuthUser }) {
    this.onClose = props.onClose;
    this.currentUser = props.currentUser;
    this.element = this.createElement();
    this.loadEmployees();
  }

  private createAddEmployeeFormHTML(): string {
    const isManager = this.currentUser.role === 'MANAGER';
    const managerField = isManager ? '' : `
        <div style="margin-bottom: 1rem;">
          <label style="display: block; color: var(--text-primary); margin-bottom: 0.5rem;">Manager</label>
          <select name="manager_id" style="
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            background-color: var(--background-dark);
            color: var(--text-primary);
          ">
            <option value="">No Manager</option>
          </select>
        </div>
    `;

    return `
      <h3 style="color: var(--text-primary); margin: 0 0 1.5rem 0;">Add New Employee</h3>
      <form id="add-employee-form">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <label style="display: block; color: var(--text-primary); margin-bottom: 0.5rem;">First Name *</label>
            <input type="text" name="first_name" required style="
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
            <input type="text" name="last_name" required style="
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
          <input type="email" name="email" required style="
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            background-color: var(--background-dark);
            color: var(--text-primary);
          ">
        </div>
        
        <div style="margin-bottom: 1rem;">
          <label style="display: block; color: var(--text-primary); margin-bottom: 0.5rem;">Username *</label>
          <input type="text" name="username" required style="
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            background-color: var(--background-dark);
            color: var(--text-primary);
          ">
        </div>
        
        <div style="margin-bottom: 1rem;">
          <label style="display: block; color: var(--text-primary); margin-bottom: 0.5rem;">Password *</label>
          <input type="password" name="password" required style="
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            background-color: var(--background-dark);
            color: var(--text-primary);
          ">
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <label style="display: block; color: var(--text-primary); margin-bottom: 0.5rem;">Role *</label>
            <select name="role" required style="
              width: 100%;
              padding: 0.75rem;
              border: 1px solid var(--border-color);
              border-radius: 6px;
              background-color: var(--background-dark);
              color: var(--text-primary);
            ">
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_USER">Super User</option>
            </select>
          </div>
          <div>
            <label style="display: block; color: var(--text-primary); margin-bottom: 0.5rem;">Department</label>
            <input type="text" name="department" style="
              width: 100%;
              padding: 0.75rem;
              border: 1px solid var(--border-color);
              border-radius: 6px;
              background-color: var(--background-dark);
              color: var(--text-primary);
            ">
          </div>
        </div>
        
        ${managerField}
        
        <div style="margin-bottom: 1.5rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-primary);">
            <input type="checkbox" name="is_manager_approver" style="margin: 0;">
            Can approve expenses as manager
          </label>
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
          ">Add Employee</button>
        </div>
      </form>
    `;
  }

  private createElement(): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'admin-employee-modal';
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
    modalContent.className = 'admin-employee-modal-content';
    modalContent.style.cssText = `
      background-color: var(--background-medium);
      border-radius: 12px;
      padding: 2rem;
      width: 90%;
      max-width: 1200px;
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
    closeButton.addEventListener('click', () => this.onClose());

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Employee Management';
    title.style.cssText = `
      color: var(--text-primary);
      margin: 0 0 1.5rem 0;
      font-size: 1.5rem;
      font-weight: 600;
    `;

    // Add Employee button
    const addButton = document.createElement('button');
    addButton.textContent = 'Add Employee';
    addButton.style.cssText = `
      background: var(--accent-primary);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `;
    addButton.innerHTML = '&#43; Add Employee';
    addButton.addEventListener('click', () => this.showAddEmployeeForm());

    // Loading state
    const loadingDiv = document.createElement('div');
    loadingDiv.textContent = 'Loading employees...';
    loadingDiv.style.cssText = `
      text-align: center;
      color: var(--text-secondary);
      padding: 2rem;
    `;

    modalContent.appendChild(closeButton);
    modalContent.appendChild(title);
    modalContent.appendChild(addButton);
    modalContent.appendChild(loadingDiv);
    modal.appendChild(modalContent);

    return modal;
  }

  private async loadEmployees(): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/admin/users/', {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.employees = data.users || [];
        this.managers = this.employees.filter(emp => emp.role === 'MANAGER' || emp.role === 'ADMIN');
        this.renderEmployees();
      } else {
        this.showError('Failed to load employees');
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      this.showError('Network error. Please try again.');
    }
  }

  private renderEmployees(): void {
    const modalContent = this.element.querySelector('.admin-employee-modal-content') as HTMLElement;
    
    // Remove loading div
    const loadingDiv = modalContent.querySelector('div');
    if (loadingDiv && loadingDiv.textContent?.includes('Loading')) {
      loadingDiv.remove();
    }

    // Create employees table
    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    `;

    // Table header
    const headerRow = document.createElement('tr');
    headerRow.style.cssText = `
      background-color: var(--background-light);
      border-bottom: 2px solid var(--border-color);
    `;

    const headers = ['Name', 'Email', 'Role', 'Department', 'Manager', 'Status', 'Actions'];
    headers.forEach(headerText => {
      const th = document.createElement('th');
      th.textContent = headerText;
      th.style.cssText = `
        padding: 1rem;
        text-align: left;
        font-weight: 600;
        color: var(--text-primary);
      `;
      headerRow.appendChild(th);
    });

    table.appendChild(headerRow);

    // Table rows
    this.employees.forEach(employee => {
      const row = document.createElement('tr');
      row.style.cssText = `
        border-bottom: 1px solid var(--border-color);
        transition: background-color 0.2s ease;
      `;

      row.addEventListener('mouseenter', () => {
        row.style.backgroundColor = 'var(--background-light)';
      });

      row.addEventListener('mouseleave', () => {
        row.style.backgroundColor = 'transparent';
      });

      const roleColor = this.getRoleColor(employee.role);
      const statusColor = employee.is_active ? '#10b981' : '#ef4444';

      row.innerHTML = `
        <td style="padding: 1rem; color: var(--text-primary);">
          <div style="font-weight: 500;">${employee.first_name} ${employee.last_name}</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">@${employee.username}</div>
        </td>
        <td style="padding: 1rem; color: var(--text-primary);">${employee.email}</td>
        <td style="padding: 1rem; color: ${roleColor}; font-weight: 500;">${employee.role}</td>
        <td style="padding: 1rem; color: var(--text-primary);">${employee.department || 'N/A'}</td>
        <td style="padding: 1rem; color: var(--text-primary);">
          ${employee.manager ? `${employee.manager.first_name} ${employee.manager.last_name}` : 'N/A'}
        </td>
        <td style="padding: 1rem; color: ${statusColor}; font-weight: 500;">
          ${employee.is_active ? 'Active' : 'Inactive'}
        </td>
        <td style="padding: 1rem;">
          <button class="edit-employee-btn" data-employee-id="${employee.id}" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            cursor: pointer;
            margin-right: 0.5rem;
          ">Edit</button>
          <button class="toggle-status-btn" data-employee-id="${employee.id}" style="
            background: ${employee.is_active ? '#ef4444' : '#10b981'};
            color: white;
            border: none;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            cursor: pointer;
          ">${employee.is_active ? 'Deactivate' : 'Activate'}</button>
        </td>
      `;

      // Add event listeners
      const editBtn = row.querySelector('.edit-employee-btn') as HTMLButtonElement;
      const toggleBtn = row.querySelector('.toggle-status-btn') as HTMLButtonElement;

      editBtn.addEventListener('click', () => this.editEmployee(employee));
      toggleBtn.addEventListener('click', () => this.toggleEmployeeStatus(employee));

      table.appendChild(row);
    });

    modalContent.appendChild(table);
  }

  private getRoleColor(role: string): string {
    const colors: { [key: string]: string } = {
      'ADMIN': '#8b5cf6',
      'MANAGER': '#f59e0b',
      'EMPLOYEE': '#6b7280'
    };
    return colors[role] || '#6b7280';
  }

  private showAddEmployeeForm(): void {
    const form = document.createElement('div');
    form.className = 'add-employee-form';
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
      max-width: 500px;
      border: 1px solid var(--border-color);
    `;

    formContent.innerHTML = this.createAddEmployeeFormHTML();

    // Populate manager dropdown (only if manager field exists)
    const managerSelect = formContent.querySelector('select[name="manager_id"]') as HTMLSelectElement;
    if (managerSelect) {
      this.managers.forEach(manager => {
        const option = document.createElement('option');
        option.value = manager.id;
        option.textContent = `${manager.first_name} ${manager.last_name}`;
        managerSelect.appendChild(option);
      });
    }

    // Add event listeners
    const cancelBtn = formContent.querySelector('.cancel-btn') as HTMLButtonElement;
    const employeeForm = formContent.querySelector('#add-employee-form') as HTMLFormElement;

    cancelBtn.addEventListener('click', () => form.remove());
    employeeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddEmployee(employeeForm, form);
    });

    form.appendChild(formContent);
    document.body.appendChild(form);
  }

  private async handleAddEmployee(form: HTMLFormElement, modal: HTMLElement): Promise<void> {
    const formData = new FormData(form);
    
    // If current user is a manager, automatically set them as the manager
    let managerId = formData.get('manager_id') as string || undefined;
    if (this.currentUser.role === 'MANAGER') {
      managerId = this.currentUser.id;
    }
    
    const employeeData: CreateEmployeeData = {
      username: formData.get('username') as string,
      email: formData.get('email') as string,
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      password: formData.get('password') as string,
      phone: formData.get('phone') as string || '',
      department: formData.get('department') as string || '',
      employee_id: formData.get('employee_id') as string || '',
      role: formData.get('role') as 'MANAGER' | 'EMPLOYEE',
      manager_id: managerId,
      is_manager_approver: formData.get('is_manager_approver') === 'on'
    };

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/admin/users/create/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });

      if (response.ok) {
        modal.remove();
        await this.loadEmployees(); // Reload the list
        this.showSuccessMessage('Employee added successfully!');
      } else {
        let errorMessage = 'Failed to add employee';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || 'Unknown error';
        } catch (jsonError) {
          // If response is not JSON (e.g., HTML error page)
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        this.showError(errorMessage);
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      this.showError('Network error. Please try again.');
    }
  }

  private editEmployee(employee: Employee): void {
    // TODO: Implement edit functionality
    alert(`Edit employee: ${employee.first_name} ${employee.last_name}`);
  }

  private async toggleEmployeeStatus(employee: Employee): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8000/api/admin/users/${employee.id}/update/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !employee.is_active
        }),
      });

      if (response.ok) {
        await this.loadEmployees(); // Reload the list
        this.showSuccessMessage(`Employee ${employee.is_active ? 'deactivated' : 'activated'} successfully!`);
      } else {
        let errorMessage = 'Failed to update employee';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || 'Unknown error';
        } catch (jsonError) {
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        this.showError(errorMessage);
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      this.showError('Network error. Please try again.');
    }
  }

  private showError(message: string): void {
    const modalContent = this.element.querySelector('.admin-employee-modal-content') as HTMLElement;
    
    // Remove existing error messages
    const existingError = modalContent.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
      background-color: #fee2e2;
      color: #dc2626;
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      border: 1px solid #fecaca;
    `;
    errorDiv.textContent = message;
    
    modalContent.insertBefore(errorDiv, modalContent.firstChild);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
  }

  private showSuccessMessage(message: string): void {
    const modalContent = this.element.querySelector('.admin-employee-modal-content') as HTMLElement;
    
    // Remove existing success messages
    const existingSuccess = modalContent.querySelector('.success-message');
    if (existingSuccess) {
      existingSuccess.remove();
    }

    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
      background-color: #d1fae5;
      color: #059669;
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      border: 1px solid #a7f3d0;
    `;
    successDiv.textContent = message;
    
    modalContent.insertBefore(successDiv, modalContent.firstChild);
    
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.remove();
      }
    }, 5000);
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
