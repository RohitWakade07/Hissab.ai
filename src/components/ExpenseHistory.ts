// import { componentStyles } from '../styles/theme';
import { IconUtils } from '../utils/icons';

export interface ExpenseHistoryProps {
  onClose: () => void;
}

export interface Expense {
  id: string;
  amount: string;
  currency: string;
  category_name: string;
  description: string;
  expense_date: string;
  status: string;
  status_display: string;
  merchant_name?: string;
  submitted_at?: string;
  approved_at?: string;
  current_approver_name?: string;
  approval_history: any[];
}

export interface ExpenseHistoryData {
  draft: { count: number; total_amount: number; expenses: Expense[] };
  pending: { count: number; total_amount: number; expenses: Expense[] };
  approved: { count: number; total_amount: number; expenses: Expense[] };
  rejected: { count: number; total_amount: number; expenses: Expense[] };
  paid: { count: number; total_amount: number; expenses: Expense[] };
  summary: {
    total_expenses: number;
    total_amount: number;
    pending_count: number;
    approved_count: number;
    rejected_count: number;
  };
}

export class ExpenseHistory {
  private element: HTMLElement;
  private onClose: () => void;
  private historyData: ExpenseHistoryData | null = null;

  constructor(props: ExpenseHistoryProps) {
    this.onClose = props.onClose;
    this.element = this.createElement();
    this.loadHistory();
  }

  private createElement(): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'expense-history-modal';
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
    modalContent.className = 'expense-history-modal-content';
    modalContent.style.cssText = `
      background-color: var(--background-medium);
      border-radius: 12px;
      padding: 2rem;
      width: 90%;
      max-width: 1000px;
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
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.backgroundColor = 'var(--background-light)';
    });
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.backgroundColor = 'transparent';
    });

    // Title
    const title = document.createElement('h2');
    title.textContent = 'My Expense History';
    title.style.cssText = `
      color: var(--text-primary);
      margin: 0 0 1.5rem 0;
      font-size: 1.5rem;
      font-weight: 600;
    `;

    // Summary cards
    const summaryContainer = document.createElement('div');
    summaryContainer.className = 'summary-cards';
    summaryContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    `;

    // Status tabs
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'status-tabs';
    tabsContainer.style.cssText = `
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    `;

    const statusTabs = [
      { key: 'all', label: 'All', count: 0 },
      { key: 'draft', label: 'Draft', count: 0 },
      { key: 'pending', label: 'Pending', count: 0 },
      { key: 'approved', label: 'Approved', count: 0 },
      { key: 'rejected', label: 'Rejected', count: 0 },
      { key: 'paid', label: 'Paid', count: 0 }
    ];

    statusTabs.forEach(tab => {
      const tabButton = document.createElement('button');
      tabButton.textContent = `${tab.label} (${tab.count})`;
      tabButton.dataset.status = tab.key;
      tabButton.className = 'status-tab';
      tabButton.style.cssText = `
        padding: 0.75rem 1rem;
        border: none;
        background: none;
        color: var(--text-secondary);
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
        font-size: 0.9rem;
      `;
      
      tabButton.addEventListener('click', () => this.switchTab(tab.key));
      tabButton.addEventListener('mouseenter', () => {
        if (!tabButton.classList.contains('active')) {
          tabButton.style.color = 'var(--text-primary)';
        }
      });
      tabButton.addEventListener('mouseleave', () => {
        if (!tabButton.classList.contains('active')) {
          tabButton.style.color = 'var(--text-secondary)';
        }
      });

      tabsContainer.appendChild(tabButton);
    });

    // Expenses container
    const expensesContainer = document.createElement('div');
    expensesContainer.className = 'expenses-container';
    expensesContainer.style.cssText = `
      min-height: 200px;
    `;

    // Loading state
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.textContent = 'Loading expense history...';
    loadingDiv.style.cssText = `
      text-align: center;
      color: var(--text-secondary);
      padding: 2rem;
    `;

    expensesContainer.appendChild(loadingDiv);

    modalContent.appendChild(closeButton);
    modalContent.appendChild(title);
    modalContent.appendChild(summaryContainer);
    modalContent.appendChild(tabsContainer);
    modalContent.appendChild(expensesContainer);

    modal.appendChild(modalContent);

    return modal;
  }

  private async loadHistory(): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/my-expense-history/', {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (response.ok) {
        this.historyData = await response.json();
        this.renderSummary();
        this.updateTabCounts();
        this.renderExpenses('all');
      } else {
        this.showError('Failed to load expense history');
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      this.showError('Network error. Please try again.');
    }
  }

  private renderSummary(): void {
    if (!this.historyData) return;

    const summaryContainer = this.element.querySelector('.summary-cards') as HTMLElement;
    summaryContainer.innerHTML = '';

    const summary = this.historyData.summary;
    const cards = [
      { title: 'Total Expenses', value: summary.total_expenses, color: 'var(--accent-primary)' },
      { title: 'Total Amount', value: `$${summary.total_amount.toFixed(2)}`, color: 'var(--accent-secondary)' },
      { title: 'Pending', value: summary.pending_count, color: '#f39c12' },
      { title: 'Approved', value: summary.approved_count, color: '#27ae60' },
      { title: 'Rejected', value: summary.rejected_count, color: '#e74c3c' }
    ];

    cards.forEach(card => {
      const cardElement = document.createElement('div');
      cardElement.className = 'summary-card';
      cardElement.style.cssText = `
        background-color: var(--background-light);
        border-radius: 8px;
        padding: 1.5rem;
        text-align: center;
        border: 1px solid var(--border-color);
      `;

      const title = document.createElement('h3');
      title.textContent = card.title;
      title.style.cssText = `
        margin: 0 0 0.5rem 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
        font-weight: 500;
      `;

      const value = document.createElement('div');
      value.textContent = card.value.toString();
      value.style.cssText = `
        font-size: 1.5rem;
        font-weight: 600;
        color: ${card.color};
      `;

      cardElement.appendChild(title);
      cardElement.appendChild(value);
      summaryContainer.appendChild(cardElement);
    });
  }

  private updateTabCounts(): void {
    if (!this.historyData) return;

    const tabs = this.element.querySelectorAll('.status-tab') as NodeListOf<HTMLButtonElement>;
    tabs.forEach(tab => {
      const status = tab.dataset.status!;
      let count = 0;

      if (status === 'all') {
        count = this.historyData!.summary.total_expenses;
      } else if (status in this.historyData! && status !== 'summary') {
        const statusData = this.historyData![status as keyof ExpenseHistoryData] as { count: number; total_amount: number; expenses: Expense[] };
        count = statusData.count;
      }

      tab.textContent = `${tab.textContent!.split(' (')[0]} (${count})`;
    });
  }

  private switchTab(status: string): void {
    // Update active tab
    const tabs = this.element.querySelectorAll('.status-tab') as NodeListOf<HTMLButtonElement>;
    tabs.forEach(tab => {
      tab.classList.remove('active');
      tab.style.cssText = tab.style.cssText.replace('color: var(--accent-primary)', 'color: var(--text-secondary)');
      tab.style.cssText = tab.style.cssText.replace('border-bottom-color: var(--accent-primary)', 'border-bottom-color: transparent');
    });

    const activeTab = this.element.querySelector(`[data-status="${status}"]`) as HTMLButtonElement;
    activeTab.classList.add('active');
    activeTab.style.color = 'var(--accent-primary)';
    activeTab.style.borderBottomColor = 'var(--accent-primary)';

    this.renderExpenses(status);
  }

  private renderExpenses(status: string): void {
    if (!this.historyData) return;

    const container = this.element.querySelector('.expenses-container') as HTMLElement;
    container.innerHTML = '';

    let expenses: Expense[] = [];

    if (status === 'all') {
      expenses = [
        ...this.historyData.draft.expenses,
        ...this.historyData.pending.expenses,
        ...this.historyData.approved.expenses,
        ...this.historyData.rejected.expenses,
        ...this.historyData.paid.expenses
      ];
    } else if (status in this.historyData && status !== 'summary') {
      const statusData = this.historyData[status as keyof ExpenseHistoryData] as { count: number; total_amount: number; expenses: Expense[] };
      expenses = statusData.expenses;
    }

    if (expenses.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.style.cssText = `
        text-align: center;
        color: var(--text-secondary);
        padding: 3rem;
      `;
      emptyState.innerHTML = `
        <div style="margin-bottom: 1rem;">${IconUtils.createIconElement('fileText', 48, '#d1d5db').outerHTML}</div>
        <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">No expenses found</h3>
        <p style="margin: 0;">No expenses match the selected status.</p>
      `;
      container.appendChild(emptyState);
      return;
    }

    expenses.forEach(expense => {
      const expenseCard = this.createExpenseCard(expense);
      container.appendChild(expenseCard);
    });
  }

  private createExpenseCard(expense: Expense): HTMLElement {
    const card = document.createElement('div');
    card.className = 'expense-card';
    card.style.cssText = `
      background-color: var(--background-light);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1rem;
      border: 1px solid var(--border-color);
      transition: box-shadow 0.2s ease;
    `;

    card.addEventListener('mouseenter', () => {
      card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.boxShadow = 'none';
    });

    const statusColor = this.getStatusColor(expense.status);
    const statusIcon = this.getStatusIcon(expense.status);

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
        <div>
          <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-size: 1.1rem;">
            ${expense.description}
          </h3>
          <div style="display: flex; gap: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
            <span>${expense.category_name}</span>
            <span>•</span>
            <span>${expense.expense_date}</span>
            ${expense.merchant_name ? `<span>•</span><span>${expense.merchant_name}</span>` : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 1.2rem; font-weight: 600; color: var(--text-primary);">
            ${expense.currency} ${parseFloat(expense.amount).toFixed(2)}
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
            <div style="display: flex; align-items: center;">${IconUtils.createIconElement(statusIcon as any, 16, statusColor).outerHTML}</div>
            <span style="color: ${statusColor}; font-weight: 500; font-size: 0.9rem;">
              ${expense.status_display}
            </span>
          </div>
        </div>
      </div>
      
      ${expense.approval_history.length > 0 ? `
        <div style="border-top: 1px solid var(--border-color); padding-top: 1rem;">
          <h4 style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-size: 0.9rem;">Approval History</h4>
          ${expense.approval_history.map(approval => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--background-medium);">
              <div>
                <span style="color: var(--text-primary); font-weight: 500;">${approval.approver_name}</span>
                ${approval.comments ? `<div style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 0.25rem;">${approval.comments}</div>` : ''}
              </div>
              <div style="text-align: right;">
                <span style="color: ${this.getStatusColor(approval.status)}; font-size: 0.8rem; font-weight: 500;">
                  ${approval.status}
                </span>
                <div style="color: var(--text-secondary); font-size: 0.8rem;">
                  ${new Date(approval.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;

    return card;
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

  private getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'DRAFT': 'edit',
      'PENDING': 'clock',
      'APPROVED': 'check',
      'REJECTED': 'x',
      'PAID': 'dollarSign'
    };
    return icons[status] || 'fileText';
  }

  private showError(message: string): void {
    const container = this.element.querySelector('.expenses-container') as HTMLElement;
    container.innerHTML = `
      <div style="text-align: center; color: #e74c3c; padding: 2rem;">
        <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
        <h3 style="margin: 0 0 0.5rem 0;">Error</h3>
        <p style="margin: 0;">${message}</p>
      </div>
    `;
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

