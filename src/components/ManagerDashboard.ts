import { AuthUser } from '../services/AuthService';

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
        { title: 'Pending Approvals', value: this.approvalStats.pending_count, color: '#f59e0b', icon: '⏳' },
        { title: 'Approved', value: this.approvalStats.approved_count, color: '#10b981', icon: '✅' },
        { title: 'Rejected', value: this.approvalStats.rejected_count, color: '#ef4444', icon: '❌' },
        { title: 'Total Processed', value: this.approvalStats.total_processed, color: '#6366f1', icon: '📊' }
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
      { title: 'View Team Expenses', description: 'See all team expense reports', icon: '👥', action: 'team-expenses' },
      { title: 'Approval History', description: 'Review past approvals', icon: '📜', action: 'approval-history' },
      { title: 'Create Approval Flow', description: 'Set up new approval workflows', icon: '⚙️', action: 'create-flow' }
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

  private createStatCard(title: string, value: number, color: string, icon: string): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      text-align: center;
      border-left: 4px solid ${color};
    `;

    const iconElement = document.createElement('div');
    iconElement.textContent = icon;
    iconElement.style.cssText = `
      font-size: 2rem;
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

  private createActionCard(title: string, description: string, icon: string, action: string): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = `
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    `;

    card.addEventListener('mouseenter', () => {
      card.style.borderColor = '#6366f1';
      card.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.borderColor = '#e5e7eb';
      card.style.boxShadow = 'none';
    });

    card.addEventListener('click', () => this.handleAction(action));

    const iconElement = document.createElement('div');
    iconElement.textContent = icon;
    iconElement.style.cssText = `
      font-size: 2rem;
      margin-bottom: 0.5rem;
    `;

    const titleElement = document.createElement('div');
    titleElement.textContent = title;
    titleElement.style.cssText = `
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.25rem;
    `;

    const descElement = document.createElement('div');
    descElement.textContent = description;
    descElement.style.cssText = `
      color: #6b7280;
      font-size: 0.875rem;
    `;

    card.appendChild(iconElement);
    card.appendChild(titleElement);
    card.appendChild(descElement);

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
      default:
        console.log('Unknown action:', action);
    }
  }

  private showTeamExpenses(): void {
    // TODO: Implement team expenses view
    alert('Team expenses view coming soon!');
  }

  private showApprovalHistory(): void {
    // TODO: Implement approval history view
    alert('Approval history view coming soon!');
  }

  private showCreateFlow(): void {
    // TODO: Implement create approval flow view
    alert('Create approval flow view coming soon!');
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
