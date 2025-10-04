import { componentStyles } from '../styles/theme';
import { AuthUser } from '../services/AuthService';
import { ExpenseSubmission } from './ExpenseSubmission';
import { ExpenseHistory } from './ExpenseHistory';
import { ManagerDashboard } from './ManagerDashboard';

export interface UserDashboardProps {
  user: AuthUser;
  onLogout: () => void;
}

export class UserDashboard {
  private element: HTMLElement;
  private user: AuthUser;
  private onLogout: () => void;

  constructor(props: UserDashboardProps) {
    this.user = props.user;
    this.onLogout = props.onLogout;
    this.element = this.createElement();
  }

  private createElement(): HTMLElement {
    const dashboard = document.createElement('div');
    dashboard.className = 'user-dashboard';
    dashboard.style.cssText = `
      min-height: 100vh;
      background-color: var(--background-dark);
      color: var(--text-primary);
    `;

    // Header
    const header = document.createElement('header');
    header.style.cssText = componentStyles.header;

    const container = document.createElement('div');
    container.className = 'container';

    const nav = document.createElement('nav');
    nav.style.cssText = componentStyles.nav;

    const logo = document.createElement('div');
    logo.className = 'logo';
    logo.style.cssText = componentStyles.logo;
    logo.textContent = 'Hisab Dost';

    const navRight = document.createElement('div');
    navRight.style.cssText = `
      display: flex;
      align-items: center;
      gap: 1rem;
    `;

    const userInfo = document.createElement('div');
    userInfo.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
    `;

    const userAvatar = document.createElement('div');
    userAvatar.style.cssText = `
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: var(--accent-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--background-dark);
      font-weight: bold;
    `;
    userAvatar.textContent = this.user.first_name.charAt(0).toUpperCase();

    const userName = document.createElement('span');
    userName.textContent = `${this.user.first_name} ${this.user.last_name}`;

    const logoutButton = document.createElement('button');
    logoutButton.textContent = 'Logout';
    logoutButton.className = 'btn btn-secondary';
    logoutButton.style.cssText = `
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    `;
    logoutButton.addEventListener('click', () => this.onLogout());

    userInfo.appendChild(userAvatar);
    userInfo.appendChild(userName);
    navRight.appendChild(userInfo);
    navRight.appendChild(logoutButton);

    nav.appendChild(logo);
    nav.appendChild(navRight);
    container.appendChild(nav);
    header.appendChild(container);

    // Main content
    const main = document.createElement('main');
    main.style.cssText = `
      padding: 2rem 0;
    `;

    const mainContainer = document.createElement('div');
    mainContainer.className = 'container';

    // Check if user is manager or admin - show ManagerDashboard
    if (this.user.role === 'MANAGER' || this.user.role === 'ADMIN') {
      new ManagerDashboard(this.user, mainContainer);
      main.appendChild(mainContainer);
    } else {
      // Regular employee dashboard
      // Welcome section
      const welcomeSection = document.createElement('section');
      welcomeSection.style.cssText = `
        text-align: center;
        margin-bottom: 3rem;
      `;

      const welcomeTitle = document.createElement('h1');
      welcomeTitle.textContent = `Welcome back, ${this.user.first_name}!`;
      welcomeTitle.style.cssText = `
        color: var(--text-primary);
        margin-bottom: 1rem;
      `;

      const welcomeSubtitle = document.createElement('p');
      welcomeSubtitle.textContent = `You're logged in as ${this.user.get_role_display()} at ${this.user.company_name}`;
      welcomeSubtitle.style.cssText = `
        color: var(--text-secondary);
        font-size: 1.1rem;
      `;

      welcomeSection.appendChild(welcomeTitle);
      welcomeSection.appendChild(welcomeSubtitle);

      // Dashboard cards
      const cardsSection = document.createElement('section');
      cardsSection.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
        margin-bottom: 3rem;
      `;

      // Quick actions card
      const quickActionsCard = this.createCard('Quick Actions', [
        { title: 'Submit Expense', description: 'Create a new expense claim', icon: '📝', action: 'submit-expense' },
        { title: 'View Expenses', description: 'Check your expense history', icon: '📊', action: 'view-expenses' },
        { title: 'Upload Receipt', description: 'Scan receipt with OCR', icon: '📷', action: 'upload-receipt' },
      ]);

      // Company info card
      const companyCard = this.createCard('Company Information', [
        { title: 'Company', description: this.user.company_name, icon: '🏢' },
        { title: 'Role', description: this.user.get_role_display(), icon: '👤' },
      ]);

      cardsSection.appendChild(quickActionsCard);
      cardsSection.appendChild(companyCard);

      mainContainer.appendChild(welcomeSection);
      mainContainer.appendChild(cardsSection);
      main.appendChild(mainContainer);
    }

    dashboard.appendChild(header);
    dashboard.appendChild(main);

    return dashboard;
  }

  private createCard(title: string, items: Array<{ title: string; description: string; icon: string; action?: string }>): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = `
      background-color: var(--background-medium);
      border-radius: 12px;
      padding: 2rem;
      border: 1px solid var(--border-color);
      transition: transform 0.3s ease, border-color 0.3s ease;
    `;

    const cardTitle = document.createElement('h3');
    cardTitle.textContent = title;
    cardTitle.style.cssText = `
      color: var(--text-primary);
      margin-bottom: 1.5rem;
      font-size: 1.3rem;
    `;

    const itemsList = document.createElement('div');
    itemsList.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 1rem;
    `;

    items.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.style.cssText = `
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background-color: var(--background-dark);
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.3s ease;
      `;

      itemDiv.addEventListener('mouseenter', () => {
        itemDiv.style.backgroundColor = 'var(--accent-glow)';
      });

      itemDiv.addEventListener('mouseleave', () => {
        itemDiv.style.backgroundColor = 'var(--background-dark)';
      });

      // Add click handler for actions
      if (item.action) {
        itemDiv.addEventListener('click', () => this.handleAction(item.action!));
      }

      const icon = document.createElement('span');
      icon.textContent = item.icon;
      icon.style.cssText = `
        font-size: 1.5rem;
      `;

      const content = document.createElement('div');
      content.style.cssText = `
        flex: 1;
      `;

      const itemTitle = document.createElement('div');
      itemTitle.textContent = item.title;
      itemTitle.style.cssText = `
        color: var(--text-primary);
        font-weight: 600;
        margin-bottom: 0.25rem;
      `;

      const itemDescription = document.createElement('div');
      itemDescription.textContent = item.description;
      itemDescription.style.cssText = `
        color: var(--text-secondary);
        font-size: 0.9rem;
      `;

      content.appendChild(itemTitle);
      content.appendChild(itemDescription);

      itemDiv.appendChild(icon);
      itemDiv.appendChild(content);

      itemsList.appendChild(itemDiv);
    });

    card.appendChild(cardTitle);
    card.appendChild(itemsList);

    return card;
  }

  private handleAction(action: string): void {
    switch (action) {
      case 'submit-expense':
        this.showExpenseSubmission();
        break;
      case 'view-expenses':
        this.showExpenseHistory();
        break;
      case 'upload-receipt':
        this.showReceiptUpload();
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  private showExpenseSubmission(): void {
    const expenseSubmission = new ExpenseSubmission({
      onSuccess: (expense) => {
        console.log('Expense submitted successfully:', expense);
        expenseSubmission.destroy();
        // Show success message or refresh dashboard
        this.showSuccessMessage('Expense submitted successfully!');
      },
      onCancel: () => {
        expenseSubmission.destroy();
      }
    });

    expenseSubmission.render(document.body);
  }

  private showExpenseHistory(): void {
    const expenseHistory = new ExpenseHistory({
      onClose: () => {
        expenseHistory.destroy();
      }
    });

    expenseHistory.render(document.body);
  }

  private showReceiptUpload(): void {
    // For now, just show a placeholder message
    this.showSuccessMessage('Receipt upload feature coming soon!');
  }

  private showSuccessMessage(message: string): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: var(--accent-primary);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 3000);
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
