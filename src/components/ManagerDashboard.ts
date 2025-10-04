import { AuthUser } from '../services/AuthService';
import { ConditionalApprovalManager } from './ConditionalApprovalManager';
import { IconUtils } from '../utils/icons';

export interface PendingExpense {
  id: string;
  amount: number;
  currency: string;
  category: {
    id: number;
    name: string;
  };
  description: string;
  expense_date: string;
  submitted_by: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  status: string;
  created_at: string;
}

export interface ApprovalStats {
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  total_processed: number;
}

export class ManagerDashboard {
  private user: AuthUser;
  private container: HTMLElement;
  private pendingExpenses: PendingExpense[] = [];
  private approvalStats: ApprovalStats | null = null;

  constructor(user: AuthUser, container: HTMLElement) {
    this.user = user;
    this.container = container;
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      await Promise.all([
        this.loadPendingApprovals(),
        this.loadApprovalStats()
      ]);
      this.render();
    } catch (error) {
      console.error('Error loading manager dashboard data:', error);
      this.showError('Failed to load dashboard data');
    }
  }

  private async loadPendingApprovals(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch('http://localhost:8000/api/pending-approvals/', {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      this.pendingExpenses = await response.json();
    } else {
      throw new Error('Failed to load pending approvals');
    }
  }

  private async loadApprovalStats(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch('http://localhost:8000/api/approval-statistics/', {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      this.approvalStats = await response.json();
    } else {
      throw new Error('Failed to load approval statistics');
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
    title.textContent = 'Manager Dashboard';
    title.style.cssText = `
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 600;
    `;

    const subtitle = document.createElement('p');
    subtitle.textContent = `Welcome back, ${this.user.first_name}! Manage your team's expense approvals.`;
    subtitle.style.cssText = `
      margin: 0;
      opacity: 0.9;
      font-size: 1.1rem;
    `;

    header.appendChild(title);
    header.appendChild(subtitle);

    // Stats Cards
    const statsSection = document.createElement('div');
    statsSection.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    `;

    if (this.approvalStats) {
    const statsCards = [
      { title: 'Pending Approvals', value: this.approvalStats.pending_count, color: '#f59e0b', icon: 'clock' },
      { title: 'Approved', value: this.approvalStats.approved_count, color: '#10b981', icon: 'check' },
      { title: 'Rejected', value: this.approvalStats.rejected_count, color: '#ef4444', icon: 'x' },
      { title: 'Total Processed', value: this.approvalStats.total_processed, color: '#6366f1', icon: 'barChart' }
    ];

      statsCards.forEach(stat => {
        const card = this.createStatCard(stat.title, stat.value, stat.color, stat.icon);
        statsSection.appendChild(card);
      });
    }

    // Pending Approvals Section
    const pendingSection = document.createElement('div');
    pendingSection.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    `;

    const pendingTitle = document.createElement('h2');
    pendingTitle.textContent = 'Pending Approvals';
    pendingTitle.style.cssText = `
      margin: 0 0 1rem 0;
      color: #1f2937;
      font-size: 1.5rem;
      font-weight: 600;
    `;

    const pendingList = document.createElement('div');
    pendingList.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 1rem;
    `;

    if (this.pendingExpenses.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.style.cssText = `
        text-align: center;
        padding: 2rem;
        color: #6b7280;
      `;
      emptyState.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
        <p>No pending approvals at the moment</p>
      `;
      pendingList.appendChild(emptyState);
    } else {
      this.pendingExpenses.forEach(expense => {
        const expenseCard = this.createExpenseCard(expense);
        pendingList.appendChild(expenseCard);
      });
    }

    pendingSection.appendChild(pendingTitle);
    pendingSection.appendChild(pendingList);

    // Quick Actions
    const actionsSection = document.createElement('div');
    actionsSection.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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
      { title: 'View Team Expenses', description: 'See all team expense reports', icon: 'users', action: 'team-expenses' },
      { title: 'Approval History', description: 'Review past approvals', icon: 'fileText', action: 'approval-history' },
      { title: 'Conditional Rules', description: 'View approval rules and thresholds', icon: 'zap', action: 'conditional-rules' },
      { title: 'Manage Employees', description: 'Add and manage employee accounts', icon: 'userPlus', action: 'manage-employees' },
      { title: 'Create Approval Flow', description: 'Set up new approval workflows', icon: 'settings', action: 'create-flow' }
    ];

    actions.forEach(action => {
      const actionCard = this.createActionCard(action.title, action.description, action.icon, action.action);
      actionsGrid.appendChild(actionCard);
    });

    actionsSection.appendChild(actionsTitle);
    actionsSection.appendChild(actionsGrid);

    this.container.appendChild(header);
    this.container.appendChild(statsSection);
    this.container.appendChild(pendingSection);
    this.container.appendChild(actionsSection);
  }

  private createStatCard(title: string, value: number, color: string, iconName: string): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      text-align: center;
      border-left: 4px solid ${color};
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    `;

    // Add hover effect
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 8px 25px -5px rgba(0, 0, 0, 0.1)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    });

    const iconElement = IconUtils.createIconElement(iconName as any, 32, color);
    iconElement.style.cssText = `
      margin-bottom: 0.5rem;
    `;

    const valueElement = document.createElement('div');
    valueElement.textContent = value.toString();
    valueElement.style.cssText = `
      font-size: 2rem;
      font-weight: 700;
      color: ${color};
      margin-bottom: 0.5rem;
    `;

    const titleElement = document.createElement('div');
    titleElement.textContent = title;
    titleElement.style.cssText = `
      color: #6b7280;
      font-size: 0.875rem;
      font-weight: 500;
    `;

    card.appendChild(iconElement);
    card.appendChild(valueElement);
    card.appendChild(titleElement);

    return card;
  }

  private createExpenseCard(expense: PendingExpense): HTMLElement {
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
            ${expense.submitted_by.first_name} ${expense.submitted_by.last_name}
          </div>
          <div style="color: #6b7280; font-size: 0.875rem;">
            ${expense.category.name} • ${expense.amount} ${expense.currency}
          </div>
        </div>
        <div style="color: #f59e0b; font-weight: 600; font-size: 0.875rem;">
          ${expense.status}
        </div>
      </div>
      <div style="color: #374151; margin-bottom: 1rem;">
        ${expense.description}
      </div>
      <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button class="approve-btn" data-expense-id="${expense.id}" style="
          background: #10b981;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        ">Approve</button>
        <button class="reject-btn" data-expense-id="${expense.id}" style="
          background: #ef4444;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        ">Reject</button>
      </div>
    `;

    // Add event listeners
    const approveBtn = card.querySelector('.approve-btn') as HTMLButtonElement;
    const rejectBtn = card.querySelector('.reject-btn') as HTMLButtonElement;

    approveBtn.addEventListener('click', () => this.handleApproval(expense.id, 'approve'));
    rejectBtn.addEventListener('click', () => this.handleApproval(expense.id, 'reject'));

    return card;
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

  private async handleApproval(expenseId: string, action: 'approve' | 'reject'): Promise<void> {
    const comments = prompt(`Add comments for ${action} (optional):`);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8000/api/approve-expense/${expenseId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: action,
          comments: comments || ''
        })
      });

      if (response.ok) {
        this.showSuccessMessage(`Expense ${action}d successfully!`);
        await this.loadData(); // Reload data
      } else {
        const error = await response.json();
        this.showErrorMessage(error.error || `Failed to ${action} expense`);
      }
    } catch (error) {
      console.error(`Error ${action}ing expense:`, error);
      this.showErrorMessage(`Failed to ${action} expense`);
    }
  }

  private handleAction(action: string): void {
    switch (action) {
      case 'team-expenses':
        this.showTeamExpenses();
        break;
      case 'approval-history':
        this.showApprovalHistory();
        break;
      case 'create-flow':
        this.showCreateFlow();
        break;
      case 'conditional-rules':
        this.showConditionalRules();
        break;
      case 'manage-employees':
        this.showEmployeeManagement();
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  private showTeamExpenses(): void {
    const modal = document.createElement('div');
    modal.className = 'team-expenses-modal';
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
    modalContent.className = 'team-expenses-modal-content';
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
    closeButton.addEventListener('click', () => modal.remove());

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Team Expenses';
    title.style.cssText = `
      color: var(--text-primary);
      margin: 0 0 1.5rem 0;
      font-size: 1.5rem;
      font-weight: 600;
    `;

    // Loading state
    const loadingDiv = document.createElement('div');
    loadingDiv.textContent = 'Loading team expenses...';
    loadingDiv.style.cssText = `
      text-align: center;
      color: var(--text-secondary);
      padding: 2rem;
    `;

    modalContent.appendChild(closeButton);
    modalContent.appendChild(title);
    modalContent.appendChild(loadingDiv);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Load team expenses
    this.loadTeamExpenses(modalContent);
  }

  private async loadTeamExpenses(container: HTMLElement): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/team-expenses/', {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (response.ok) {
        const expenses = await response.json();
        this.renderTeamExpenses(container, expenses);
      } else {
        this.showTeamExpensesError(container, 'Failed to load team expenses');
      }
    } catch (error) {
      console.error('Error loading team expenses:', error);
      this.showTeamExpensesError(container, 'Network error. Please try again.');
    }
  }

  private renderTeamExpenses(container: HTMLElement, expenses: any[]): void {
    // Remove loading div
    const loadingDiv = container.querySelector('div');
    if (loadingDiv && loadingDiv.textContent?.includes('Loading')) {
      loadingDiv.remove();
    }

    if (expenses.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.style.cssText = `
        text-align: center;
        color: var(--text-secondary);
        padding: 3rem;
      `;
      emptyState.innerHTML = `
        <div style="margin-bottom: 1rem;">${IconUtils.createIconElement('users', 48, '#d1d5db').outerHTML}</div>
        <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">No team expenses</h3>
        <p style="margin: 0;">No expenses found for your team.</p>
      `;
      container.appendChild(emptyState);
      return;
    }

    // Create expenses table
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

    const headers = ['Employee', 'Description', 'Date', 'Category', 'Amount', 'Status'];
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
    expenses.forEach(expense => {
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

      const cells = [
        `${expense.submitted_by?.first_name || 'Unknown'} ${expense.submitted_by?.last_name || ''}`,
        expense.description || 'N/A',
        new Date(expense.expense_date).toLocaleDateString(),
        expense.category?.name || 'N/A',
        `${expense.currency} ${parseFloat(expense.amount).toFixed(2)}`,
        expense.status || 'N/A'
      ];

      cells.forEach(cellText => {
        const td = document.createElement('td');
        td.textContent = cellText;
        td.style.cssText = `
          padding: 1rem;
          color: var(--text-primary);
        `;
        
        if (cells.indexOf(cellText) === 5) { // Status column
          const statusColor = this.getStatusColor(cellText);
          td.style.color = statusColor;
          td.style.fontWeight = '500';
        }
        
        row.appendChild(td);
      });

      table.appendChild(row);
    });

    container.appendChild(table);
  }

  private showTeamExpensesError(container: HTMLElement, message: string): void {
    // Remove loading div
    const loadingDiv = container.querySelector('div');
    if (loadingDiv && loadingDiv.textContent?.includes('Loading')) {
      loadingDiv.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      text-align: center;
      color: #e74c3c;
      padding: 2rem;
    `;
    errorDiv.innerHTML = `
      <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
      <h3 style="margin: 0 0 0.5rem 0;">Error</h3>
      <p style="margin: 0;">${message}</p>
    `;
    container.appendChild(errorDiv);
  }

  private showApprovalHistory(): void {
    const modal = document.createElement('div');
    modal.className = 'approval-history-modal';
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
    modalContent.className = 'approval-history-modal-content';
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
    closeButton.addEventListener('click', () => modal.remove());

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Approval History';
    title.style.cssText = `
      color: var(--text-primary);
      margin: 0 0 1.5rem 0;
      font-size: 1.5rem;
      font-weight: 600;
    `;

    // Loading state
    const loadingDiv = document.createElement('div');
    loadingDiv.textContent = 'Loading approval history...';
    loadingDiv.style.cssText = `
      text-align: center;
      color: var(--text-secondary);
      padding: 2rem;
    `;

    modalContent.appendChild(closeButton);
    modalContent.appendChild(title);
    modalContent.appendChild(loadingDiv);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Load approval history
    this.loadApprovalHistory(modalContent);
  }

  private async loadApprovalHistory(container: HTMLElement): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/general-approval-history/', {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (response.ok) {
        const history = await response.json();
        this.renderApprovalHistory(container, history);
      } else {
        this.showApprovalHistoryError(container, 'Failed to load approval history');
      }
    } catch (error) {
      console.error('Error loading approval history:', error);
      this.showApprovalHistoryError(container, 'Network error. Please try again.');
    }
  }

  private renderApprovalHistory(container: HTMLElement, history: any[]): void {
    // Remove loading div
    const loadingDiv = container.querySelector('div');
    if (loadingDiv && loadingDiv.textContent?.includes('Loading')) {
      loadingDiv.remove();
    }

    if (history.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.style.cssText = `
        text-align: center;
        color: var(--text-secondary);
        padding: 3rem;
      `;
      emptyState.innerHTML = `
        <div style="margin-bottom: 1rem;">${IconUtils.createIconElement('fileText', 48, '#d1d5db').outerHTML}</div>
        <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">No approval history</h3>
        <p style="margin: 0;">No approval history found.</p>
      `;
      container.appendChild(emptyState);
      return;
    }

    // Create history table
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

    const headers = ['Expense', 'Employee', 'Amount', 'Action', 'Date', 'Comments'];
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
    history.forEach(approval => {
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

      const cells = [
        approval.expense?.description || 'N/A',
        `${approval.expense?.submitted_by?.first_name || 'Unknown'} ${approval.expense?.submitted_by?.last_name || ''}`,
        `${approval.expense?.currency || 'USD'} ${parseFloat(approval.expense?.amount || 0).toFixed(2)}`,
        approval.action || 'N/A',
        new Date(approval.created_at).toLocaleDateString(),
        approval.comments || 'N/A'
      ];

      cells.forEach((cellText, index) => {
        const td = document.createElement('td');
        td.textContent = cellText;
        td.style.cssText = `
          padding: 1rem;
          color: var(--text-primary);
        `;
        
        if (index === 3) { // Action column
          const actionColor = cellText === 'APPROVED' ? '#10b981' : cellText === 'REJECTED' ? '#ef4444' : '#6b7280';
          td.style.color = actionColor;
          td.style.fontWeight = '500';
        }
        
        row.appendChild(td);
      });

      table.appendChild(row);
    });

    container.appendChild(table);
  }

  private showApprovalHistoryError(container: HTMLElement, message: string): void {
    // Remove loading div
    const loadingDiv = container.querySelector('div');
    if (loadingDiv && loadingDiv.textContent?.includes('Loading')) {
      loadingDiv.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      text-align: center;
      color: #e74c3c;
      padding: 2rem;
    `;
    errorDiv.innerHTML = `
      <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
      <h3 style="margin: 0 0 0.5rem 0;">Error</h3>
      <p style="margin: 0;">${message}</p>
    `;
    container.appendChild(errorDiv);
  }

  private getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'DRAFT': '#95a5a6',
      'PENDING': '#f39c12',
      'APPROVED': '#27ae60',
      'REJECTED': '#e74c3c',
      'PAID': '#3498db'
    };
    return colors[status] || '#95a5a6';
  }

  private showEmployeeManagement(): void {
    // Import and use the AdminEmployeeManagement component
    import('./AdminEmployeeManagement').then(({ AdminEmployeeManagement }) => {
      const employeeManagement = new AdminEmployeeManagement({
        onClose: () => {
          employeeManagement.destroy();
        },
        currentUser: this.user
      });
      
      employeeManagement.render(document.body);
    }).catch(error => {
      console.error('Failed to load AdminEmployeeManagement:', error);
      // Fallback to simple alert
      alert('Employee management feature is not available. Please contact system administrator.');
    });
  }

  private showCreateFlow(): void {
    // TODO: Implement create approval flow view
    alert('Create approval flow view coming soon!');
  }

  private showConditionalRules(): void {
    // Import and use the new ConditionalApprovalRules component
    import('./ConditionalApprovalRules').then(({ ConditionalApprovalRules }) => {
      const conditionalRules = new ConditionalApprovalRules({
        onClose: () => {
          conditionalRules.destroy();
        }
      });
      
      conditionalRules.render(document.body);
    }).catch(error => {
      console.error('Failed to load ConditionalApprovalRules:', error);
      // Fallback to simple alert
      alert('Conditional approval rules:\n\n' +
        '≤ ₹5,000: Auto approved\n' +
        '₹5,001 - ₹25,000: Department Manager\n' +
        '₹25,001 - ₹1,00,000: Finance Head\n' +
        '> ₹1,00,000: Managing Director\n\n' +
        'Escalation required for: personal, entertainment, unlisted vendor categories');
    });
  }

  private showSuccessMessage(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      font-weight: 500;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  }

  private showErrorMessage(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      font-weight: 500;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  }

  private showError(message: string): void {
    this.container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #ef4444;">
        <h2>Error</h2>
        <p>${message}</p>
        <button onclick="location.reload()" style="
          background: #6366f1;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 1rem;
        ">Retry</button>
      </div>
    `;
  }
}