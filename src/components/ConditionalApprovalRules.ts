import { IconUtils } from '../utils/icons';

export interface ConditionalRule {
  amount: string;
  approver: string;
  description: string;
}

export interface ConditionalRulesData {
  rules: {
    auto_approve: ConditionalRule;
    department_manager: ConditionalRule;
    finance_head: ConditionalRule;
    managing_director: ConditionalRule;
  };
  escalation_categories: string[];
  required_documents: string[];
  currency_rates: { [key: string]: number };
}

export class ConditionalApprovalRules {
  private element: HTMLElement;
  private onClose: () => void;
  private rulesData: ConditionalRulesData | null = null;

  constructor(props: { onClose: () => void }) {
    this.onClose = props.onClose;
    this.element = this.createElement();
    this.loadRules();
  }

  private createElement(): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'conditional-rules-modal';
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
    modalContent.className = 'conditional-rules-modal-content';
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

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Conditional Approval Rules';
    title.style.cssText = `
      color: var(--text-primary);
      margin: 0 0 1.5rem 0;
      font-size: 1.5rem;
      font-weight: 600;
    `;

    // Loading state
    const loadingDiv = document.createElement('div');
    loadingDiv.textContent = 'Loading approval rules...';
    loadingDiv.style.cssText = `
      text-align: center;
      color: var(--text-secondary);
      padding: 2rem;
    `;

    modalContent.appendChild(closeButton);
    modalContent.appendChild(title);
    modalContent.appendChild(loadingDiv);
    modal.appendChild(modalContent);

    return modal;
  }

  private async loadRules(): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/conditional-approval-rules/', {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.rulesData = data.rules_summary;
          this.renderRules();
        } else {
          this.showError('Failed to load conditional approval rules');
        }
      } else {
        this.showError('Failed to load conditional approval rules');
      }
    } catch (error) {
      console.error('Error loading rules:', error);
      this.showError('Network error. Please try again.');
    }
  }

  private renderRules(): void {
    if (!this.rulesData) return;

    const modalContent = this.element.querySelector('.conditional-rules-modal-content') as HTMLElement;
    
    // Remove loading div
    const loadingDiv = modalContent.querySelector('div');
    if (loadingDiv && loadingDiv.textContent?.includes('Loading')) {
      loadingDiv.remove();
    }

    // Create rules section
    const rulesSection = document.createElement('div');
    rulesSection.style.cssText = `
      margin-bottom: 2rem;
    `;

    const rulesTitle = document.createElement('h3');
    rulesTitle.textContent = 'Approval Thresholds';
    rulesTitle.style.cssText = `
      color: var(--text-primary);
      margin: 0 0 1rem 0;
      font-size: 1.2rem;
      font-weight: 600;
    `;

    const rulesGrid = document.createElement('div');
    rulesGrid.style.cssText = `
      display: grid;
      gap: 1rem;
      margin-bottom: 1.5rem;
    `;

    // Render each rule
    const ruleKeys = ['auto_approve', 'department_manager', 'finance_head', 'managing_director'];
    const ruleColors = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

    ruleKeys.forEach((key, index) => {
      const rule = this.rulesData!.rules[key as keyof typeof this.rulesData.rules];
      const ruleCard = this.createRuleCard(rule, ruleColors[index]);
      rulesGrid.appendChild(ruleCard);
    });

    rulesSection.appendChild(rulesTitle);
    rulesSection.appendChild(rulesGrid);

    // Create escalation section
    const escalationSection = document.createElement('div');
    escalationSection.style.cssText = `
      margin-bottom: 2rem;
    `;

    const escalationTitle = document.createElement('h3');
    escalationTitle.textContent = 'Escalation Categories';
    escalationTitle.style.cssText = `
      color: var(--text-primary);
      margin: 0 0 1rem 0;
      font-size: 1.2rem;
      font-weight: 600;
    `;

    const escalationList = document.createElement('div');
    escalationList.style.cssText = `
      background-color: var(--background-light);
      border-radius: 8px;
      padding: 1rem;
      border-left: 4px solid #ef4444;
    `;

    this.rulesData.escalation_categories.forEach(category => {
      const categoryItem = document.createElement('div');
      categoryItem.textContent = `• ${category.charAt(0).toUpperCase() + category.slice(1)}`;
      categoryItem.style.cssText = `
        color: var(--text-primary);
        margin-bottom: 0.5rem;
        font-weight: 500;
      `;
      escalationList.appendChild(categoryItem);
    });

    escalationSection.appendChild(escalationTitle);
    escalationSection.appendChild(escalationList);

    // Create documents section
    const documentsSection = document.createElement('div');
    documentsSection.style.cssText = `
      margin-bottom: 2rem;
    `;

    const documentsTitle = document.createElement('h3');
    documentsTitle.textContent = 'Required Documents';
    documentsTitle.style.cssText = `
      color: var(--text-primary);
      margin: 0 0 1rem 0;
      font-size: 1.2rem;
      font-weight: 600;
    `;

    const documentsList = document.createElement('div');
    documentsList.style.cssText = `
      background-color: var(--background-light);
      border-radius: 8px;
      padding: 1rem;
      border-left: 4px solid #3b82f6;
    `;

    this.rulesData.required_documents.forEach(doc => {
      const docItem = document.createElement('div');
      docItem.textContent = `• ${doc.charAt(0).toUpperCase() + doc.slice(1)}`;
      docItem.style.cssText = `
        color: var(--text-primary);
        margin-bottom: 0.5rem;
        font-weight: 500;
      `;
      documentsList.appendChild(docItem);
    });

    documentsSection.appendChild(documentsTitle);
    documentsSection.appendChild(documentsList);

    // Add all sections to modal
    modalContent.appendChild(rulesSection);
    modalContent.appendChild(escalationSection);
    modalContent.appendChild(documentsSection);
  }

  private createRuleCard(rule: ConditionalRule, color: string): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = `
      background-color: var(--background-light);
      border-radius: 8px;
      padding: 1.5rem;
      border-left: 4px solid ${color};
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    `;

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = 'none';
    });

    const amount = document.createElement('div');
    amount.textContent = rule.amount;
    amount.style.cssText = `
      font-size: 1.1rem;
      font-weight: 600;
      color: ${color};
      margin-bottom: 0.5rem;
    `;

    const approver = document.createElement('div');
    approver.textContent = rule.approver;
    approver.style.cssText = `
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    `;

    const description = document.createElement('div');
    description.textContent = rule.description;
    description.style.cssText = `
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.4;
    `;

    card.appendChild(amount);
    card.appendChild(approver);
    card.appendChild(description);

    return card;
  }

  private showError(message: string): void {
    const modalContent = this.element.querySelector('.conditional-rules-modal-content') as HTMLElement;
    
    // Remove loading div
    const loadingDiv = modalContent.querySelector('div');
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
    modalContent.appendChild(errorDiv);
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
