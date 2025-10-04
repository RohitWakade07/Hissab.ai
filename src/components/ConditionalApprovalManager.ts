import { AuthUser } from '../services/AuthService';
import { IconUtils } from '../utils/icons';

export interface ApprovalRule {
  id: string;
  name: string;
  description: string;
  rule_type: 'PERCENTAGE' | 'SPECIFIC_APPROVER' | 'HYBRID';
  percentage_threshold?: number;
  specific_approver?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  min_amount?: number;
  max_amount?: number;
  is_active: boolean;
}

export interface ApprovalFlow {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  steps: ApprovalStep[];
  rules: ApprovalRule[];
}

export interface ApprovalStep {
  id: string;
  step_number: number;
  approver: {
    id: string;
    first_name: string;
    last_name: string;
  };
  is_required: boolean;
  can_escalate: boolean;
}

export class ConditionalApprovalManager {
  private user: AuthUser;
  private container: HTMLElement;
  private approvalRules: ApprovalRule[] = [];
  private approvalFlows: ApprovalFlow[] = [];
  private companyUsers: any[] = [];

  constructor(user: AuthUser, container: HTMLElement) {
    this.user = user;
    this.container = container;
    // Initialize with user context
    this.initializeUserContext();
    this.loadData();
  }

  private initializeUserContext(): void {
    // Initialize user-specific context for approval management
    console.log(`Initializing approval manager for user: ${this.user.first_name} ${this.user.last_name}`);
  }

  private async loadData(): Promise<void> {
    try {
      await Promise.all([
        this.loadApprovalRules(),
        this.loadApprovalFlows(),
        this.loadCompanyUsers()
      ]);
      this.render();
    } catch (error) {
      console.error('Error loading conditional approval data:', error);
      this.showError('Failed to load conditional approval data');
    }
  }

  private async loadApprovalRules(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch('http://localhost:8000/api/conditional-approval-rules/', {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      this.approvalRules = await response.json();
    } else {
      throw new Error('Failed to load approval rules');
    }
  }

  private async loadApprovalFlows(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch('http://localhost:8000/api/approval-flows-list/', {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      this.approvalFlows = await response.json();
    } else {
      throw new Error('Failed to load approval flows');
    }
  }

  private async loadCompanyUsers(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch('http://localhost:8000/api/admin/users/', {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      this.companyUsers = data.users || [];
    } else {
      throw new Error('Failed to load company users');
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
    title.textContent = 'Conditional Approval Manager';
    title.style.cssText = `
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 600;
    `;

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Manage percentage rules, specific approver rules, and hybrid approval flows.';
    subtitle.style.cssText = `
      margin: 0;
      opacity: 0.9;
      font-size: 1.1rem;
    `;

    header.appendChild(title);
    header.appendChild(subtitle);

    // Tabs
    const tabsContainer = document.createElement('div');
    tabsContainer.style.cssText = `
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      border-bottom: 2px solid #e5e7eb;
    `;

    const tabs = [
      { id: 'rules', label: 'Approval Rules', active: true, icon: 'zap' },
      { id: 'flows', label: 'Approval Flows', active: false, icon: 'settings' },
      { id: 'create-rule', label: 'Create Rule', active: false, icon: 'plus' }
    ];

    tabs.forEach(tab => {
      const tabElement = document.createElement('button');
      tabElement.style.cssText = `
        padding: 0.75rem 1.5rem;
        border: none;
        background: ${tab.active ? '#6366f1' : 'transparent'};
        color: ${tab.active ? 'white' : '#6b7280'};
        border-radius: 8px 8px 0 0;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      `;

      const iconElement = IconUtils.createIconElement(tab.icon as any, 16, tab.active ? 'white' : '#6b7280');
      const labelElement = document.createElement('span');
      labelElement.textContent = tab.label;

      tabElement.appendChild(iconElement);
      tabElement.appendChild(labelElement);

      tabElement.addEventListener('click', () => this.switchTab(tab.id));
      tabsContainer.appendChild(tabElement);
    });

    // Content area
    const contentArea = document.createElement('div');
    contentArea.id = 'conditional-approval-content';
    contentArea.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    `;

    this.container.appendChild(header);
    this.container.appendChild(tabsContainer);
    this.container.appendChild(contentArea);

    // Render initial tab
    this.renderRulesTab();
  }

  private switchTab(tabId: string): void {
    const contentArea = document.getElementById('conditional-approval-content');
    if (!contentArea) return;

    // Update tab styles
    const tabs = this.container.querySelectorAll('button');
    tabs.forEach(tab => {
      tab.style.background = 'transparent';
      tab.style.color = '#6b7280';
    });

    const activeTab = Array.from(tabs).find(tab => tab.textContent?.includes(tabId.replace('-', ' ')));
    if (activeTab) {
      activeTab.style.background = '#6366f1';
      activeTab.style.color = 'white';
    }

    // Render tab content
    switch (tabId) {
      case 'rules':
        this.renderRulesTab();
        break;
      case 'flows':
        this.renderFlowsTab();
        break;
      case 'create-rule':
        this.renderCreateRuleTab();
        break;
    }
  }

  private renderRulesTab(): void {
    const contentArea = document.getElementById('conditional-approval-content');
    if (!contentArea) return;

    contentArea.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2 style="margin: 0; color: #1f2937;">Approval Rules</h2>
        <button id="create-rule-btn" style="
          background: #10b981;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        ">Create New Rule</button>
      </div>
    `;

    if (this.approvalRules.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.style.cssText = `
        text-align: center;
        padding: 3rem;
        color: #6b7280;
      `;
      
      const iconElement = IconUtils.createIconElement('zap', 48, '#d1d5db');
      iconElement.style.cssText = `
        margin-bottom: 1rem;
      `;
      
      const titleElement = document.createElement('p');
      titleElement.textContent = 'No approval rules created yet';
      titleElement.style.cssText = `
        font-size: 1.1rem;
        font-weight: 500;
        margin: 0 0 0.5rem 0;
        color: #374151;
      `;
      
      const descElement = document.createElement('p');
      descElement.textContent = 'Create your first conditional approval rule to get started';
      descElement.style.cssText = `
        margin: 0;
        color: #6b7280;
      `;
      
      emptyState.appendChild(iconElement);
      emptyState.appendChild(titleElement);
      emptyState.appendChild(descElement);
      
      contentArea.appendChild(emptyState);
    } else {
      const rulesGrid = document.createElement('div');
      rulesGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
      `;

      this.approvalRules.forEach(rule => {
        const ruleCard = this.createRuleCard(rule);
        rulesGrid.appendChild(ruleCard);
      });

      contentArea.appendChild(rulesGrid);
    }

    // Add event listener for create rule button
    const createBtn = document.getElementById('create-rule-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.switchTab('create-rule'));
    }
  }

  private createRuleCard(rule: ApprovalRule): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = `
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      transition: all 0.2s ease;
    `;

    const ruleTypeColor = {
      'PERCENTAGE': '#f59e0b',
      'SPECIFIC_APPROVER': '#10b981',
      'HYBRID': '#6366f1'
    };

    const ruleTypeIcon = {
      'PERCENTAGE': 'percent',
      'SPECIFIC_APPROVER': 'user',
      'HYBRID': 'zap'
    };

    // Create card content dynamically
    const cardContent = document.createElement('div');
    cardContent.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 1rem;
    `;

    const leftSection = document.createElement('div');
    const titleElement = document.createElement('div');
    titleElement.textContent = rule.name;
    titleElement.style.cssText = `
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.25rem;
    `;

    const typeElement = document.createElement('div');
    typeElement.style.cssText = `
      color: #6b7280;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    `;

    const typeIcon = IconUtils.createIconElement(ruleTypeIcon[rule.rule_type] as any, 14, '#6b7280');
    const typeText = document.createElement('span');
    typeText.textContent = rule.rule_type.replace('_', ' ');
    
    typeElement.appendChild(typeIcon);
    typeElement.appendChild(typeText);

    leftSection.appendChild(titleElement);
    leftSection.appendChild(typeElement);

    const badgeElement = document.createElement('div');
    badgeElement.textContent = rule.rule_type;
    badgeElement.style.cssText = `
      background: ${ruleTypeColor[rule.rule_type]};
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
    `;

    cardContent.appendChild(leftSection);
    cardContent.appendChild(badgeElement);

    // Description
    const descElement = document.createElement('div');
    descElement.textContent = rule.description || 'No description provided';
    descElement.style.cssText = `
      color: #374151;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    `;

    // Rule details
    const detailsElement = document.createElement('div');
    detailsElement.style.cssText = `
      margin-bottom: 1rem;
    `;
    detailsElement.innerHTML = this.getRuleDetails(rule);

    // Action buttons
    const actionsElement = document.createElement('div');
    actionsElement.style.cssText = `
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    `;

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'edit-rule-btn';
    editBtn.setAttribute('data-rule-id', rule.id);
    editBtn.style.cssText = `
      background: #6366f1;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    `;
    
    const editIcon = IconUtils.createIconElement('edit', 14, 'white');
    editBtn.insertBefore(editIcon, editBtn.firstChild);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-rule-btn';
    deleteBtn.setAttribute('data-rule-id', rule.id);
    deleteBtn.style.cssText = `
      background: #ef4444;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    `;
    
    const deleteIcon = IconUtils.createIconElement('trash', 14, 'white');
    deleteBtn.insertBefore(deleteIcon, deleteBtn.firstChild);

    actionsElement.appendChild(editBtn);
    actionsElement.appendChild(deleteBtn);

    // Assemble card
    card.appendChild(cardContent);
    card.appendChild(descElement);
    card.appendChild(detailsElement);
    card.appendChild(actionsElement);

    return card;
  }

  private getRuleDetails(rule: ApprovalRule): string {
    let details = '';

    if (rule.rule_type === 'PERCENTAGE' && rule.percentage_threshold) {
      details += `<div style="color: #6b7280; font-size: 0.875rem;">Requires ${rule.percentage_threshold}% of approvers to approve</div>`;
    }

    if (rule.rule_type === 'SPECIFIC_APPROVER' && rule.specific_approver) {
      details += `<div style="color: #6b7280; font-size: 0.875rem;">Auto-approves when ${rule.specific_approver.first_name} ${rule.specific_approver.last_name} approves</div>`;
    }

    if (rule.rule_type === 'HYBRID') {
      details += `<div style="color: #6b7280; font-size: 0.875rem;">Hybrid rule combining percentage and specific approver logic</div>`;
    }

    if (rule.min_amount || rule.max_amount) {
      const amountRange = [];
      if (rule.min_amount) amountRange.push(`$${rule.min_amount}+`);
      if (rule.max_amount) amountRange.push(`$${rule.max_amount}-`);
      details += `<div style="color: #6b7280; font-size: 0.875rem;">Amount range: ${amountRange.join(' to ')}</div>`;
    }

    return details;
  }

  private renderFlowsTab(): void {
    const contentArea = document.getElementById('conditional-approval-content');
    if (!contentArea) return;

    contentArea.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2 style="margin: 0; color: #1f2937;">Approval Flows</h2>
        <button id="create-flow-btn" style="
          background: #10b981;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        ">Create New Flow</button>
      </div>
    `;

    if (this.approvalFlows.length === 0) {
      contentArea.innerHTML += `
        <div style="text-align: center; padding: 3rem; color: #6b7280;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔄</div>
          <p>No approval flows created yet</p>
          <p>Create your first approval flow to get started</p>
        </div>
      `;
    } else {
      const flowsGrid = document.createElement('div');
      flowsGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
      `;

      this.approvalFlows.forEach(flow => {
        const flowCard = this.createFlowCard(flow);
        flowsGrid.appendChild(flowCard);
      });

      contentArea.appendChild(flowsGrid);
    }
  }

  private createFlowCard(flow: ApprovalFlow): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = `
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      transition: all 0.2s ease;
    `;

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
        <div>
          <div style="font-weight: 600; color: #1f2937; margin-bottom: 0.25rem;">
            ${flow.name}
          </div>
          <div style="color: #6b7280; font-size: 0.875rem;">
            ${flow.steps.length} steps • ${flow.rules.length} rules
          </div>
        </div>
        <div style="
          background: ${flow.is_active ? '#10b981' : '#6b7280'};
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
        ">
          ${flow.is_active ? 'ACTIVE' : 'INACTIVE'}
        </div>
      </div>
      
      <div style="color: #374151; margin-bottom: 1rem; font-size: 0.875rem;">
        ${flow.description || 'No description provided'}
      </div>
      
      <div style="margin-bottom: 1rem;">
        <div style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.5rem;">Steps:</div>
        ${flow.steps.map(step => `
          <div style="color: #374151; font-size: 0.875rem; margin-bottom: 0.25rem;">
            ${step.step_number}. ${step.approver.first_name} ${step.approver.last_name}
          </div>
        `).join('')}
      </div>
      
      <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button class="edit-flow-btn" data-flow-id="${flow.id}" style="
          background: #6366f1;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
        ">Edit</button>
        <button class="assign-rules-btn" data-flow-id="${flow.id}" style="
          background: #f59e0b;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
        ">Assign Rules</button>
      </div>
    `;

    return card;
  }

  private renderCreateRuleTab(): void {
    const contentArea = document.getElementById('conditional-approval-content');
    if (!contentArea) return;

    contentArea.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <h2 style="margin: 0 0 1rem 0; color: #1f2937;">Create Approval Rule</h2>
        <p style="color: #6b7280; margin: 0;">Create conditional approval rules to automate your approval process.</p>
      </div>
      
      <form id="create-rule-form" style="max-width: 600px;">
        <div style="margin-bottom: 1.5rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Rule Name</label>
          <input type="text" name="name" required style="
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 1rem;
          " placeholder="Enter rule name">
        </div>
        
        <div style="margin-bottom: 1.5rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Description</label>
          <textarea name="description" style="
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 1rem;
            min-height: 80px;
          " placeholder="Enter rule description"></textarea>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Rule Type</label>
          <select name="rule_type" required style="
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 1rem;
          ">
            <option value="">Select rule type</option>
            <option value="PERCENTAGE">Percentage Rule (e.g., 60% of approvers approve)</option>
            <option value="SPECIFIC_APPROVER">Specific Approver Rule (e.g., CFO approval)</option>
            <option value="HYBRID">Hybrid Rule (combine percentage and specific approver)</option>
          </select>
        </div>
        
        <div id="rule-specific-fields" style="display: none;">
          <!-- Dynamic fields will be added here -->
        </div>
        
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
          <button type="button" id="cancel-create-rule" style="
            background: #6b7280;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
          ">Cancel</button>
          <button type="submit" style="
            background: #10b981;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
          ">Create Rule</button>
        </div>
      </form>
    `;

    // Add event listeners
    const ruleTypeSelect = contentArea.querySelector('select[name="rule_type"]') as HTMLSelectElement;
    const ruleSpecificFields = document.getElementById('rule-specific-fields');
    const form = document.getElementById('create-rule-form') as HTMLFormElement;
    const cancelBtn = document.getElementById('cancel-create-rule');

    ruleTypeSelect.addEventListener('change', (e) => {
      const ruleType = (e.target as HTMLSelectElement).value;
      this.renderRuleSpecificFields(ruleType, ruleSpecificFields!);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateRule(form);
    });

    cancelBtn?.addEventListener('click', () => {
      this.switchTab('rules');
    });
  }

  private renderRuleSpecificFields(ruleType: string, container: HTMLElement): void {
    container.style.display = 'block';
    
    switch (ruleType) {
      case 'PERCENTAGE':
        container.innerHTML = `
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Percentage Threshold</label>
            <input type="number" name="percentage_threshold" min="1" max="100" required style="
              width: 100%;
              padding: 0.75rem;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              font-size: 1rem;
            " placeholder="Enter percentage (1-100)">
            <div style="color: #6b7280; font-size: 0.875rem; margin-top: 0.25rem;">
              Percentage of approvers that must approve (e.g., 60 for 60%)
            </div>
          </div>
        `;
        break;
        
      case 'SPECIFIC_APPROVER':
        container.innerHTML = `
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Specific Approver</label>
            <select name="specific_approver_id" required style="
              width: 100%;
              padding: 0.75rem;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              font-size: 1rem;
            ">
              <option value="">Select approver</option>
              ${this.companyUsers.map(user => `
                <option value="${user.id}">${user.first_name} ${user.last_name} (${user.role})</option>
              `).join('')}
            </select>
            <div style="color: #6b7280; font-size: 0.875rem; margin-top: 0.25rem;">
              When this person approves, the expense is automatically approved
            </div>
          </div>
        `;
        break;
        
      case 'HYBRID':
        container.innerHTML = `
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Percentage Threshold</label>
            <input type="number" name="percentage_threshold" min="1" max="100" style="
              width: 100%;
              padding: 0.75rem;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              font-size: 1rem;
            " placeholder="Enter percentage (1-100)">
          </div>
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Specific Approver</label>
            <select name="specific_approver_id" style="
              width: 100%;
              padding: 0.75rem;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              font-size: 1rem;
            ">
              <option value="">Select approver (optional)</option>
              ${this.companyUsers.map(user => `
                <option value="${user.id}">${user.first_name} ${user.last_name} (${user.role})</option>
              `).join('')}
            </select>
            <div style="color: #6b7280; font-size: 0.875rem; margin-top: 0.25rem;">
              Hybrid rule: Either the percentage threshold OR the specific approver must approve
            </div>
          </div>
        `;
        break;
        
      default:
        container.style.display = 'none';
    }
  }

  private async handleCreateRule(form: HTMLFormElement): Promise<void> {
    const formData = new FormData(form);
    const ruleData = {
      name: formData.get('name'),
      description: formData.get('description'),
      rule_type: formData.get('rule_type'),
      percentage_threshold: formData.get('percentage_threshold') ? parseInt(formData.get('percentage_threshold') as string) : null,
      specific_approver_id: formData.get('specific_approver_id') || null
    };

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/create-approval-rule/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ruleData)
      });

      if (response.ok) {
        this.showSuccessMessage('Approval rule created successfully!');
        await this.loadData();
        this.switchTab('rules');
      } else {
        const error = await response.json();
        this.showErrorMessage(error.error || 'Failed to create approval rule');
      }
    } catch (error) {
      console.error('Error creating approval rule:', error);
      this.showErrorMessage('Failed to create approval rule');
    }
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