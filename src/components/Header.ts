import { componentStyles } from '../styles/theme';

export interface HeaderProps {
  className?: string;
  isAuthenticated?: boolean;
  user?: any;
  onLogin?: () => void;
  onSignup?: () => void;
  onLogout?: () => void;
}

export class Header {
  private element: HTMLElement;

  constructor(props: HeaderProps = {}) {
    this.element = this.createElement(props);
  }

  private createElement(props: HeaderProps): HTMLElement {
    const header = document.createElement('header');
    header.style.cssText = componentStyles.header;
    if (props.className) {
      header.className = props.className;
    }

    const container = document.createElement('div');
    container.className = 'container';

    const nav = document.createElement('nav');
    nav.style.cssText = componentStyles.nav;

    const logo = document.createElement('div');
    logo.className = 'logo';
    logo.style.cssText = componentStyles.logo;
    logo.textContent = 'Hisab Dost';

    const navLinks = document.createElement('div');
    navLinks.className = 'nav-links';
    navLinks.style.cssText = componentStyles.navLinks;

    // Navigation links (only show if not authenticated)
    if (!props.isAuthenticated) {
      const links = [
        { href: '#features', text: 'Features' },
        { href: '#how-it-works', text: 'How It Works' },
        { href: '#testimonials', text: 'Reviews' }
      ];

      links.forEach(link => {
        const anchor = document.createElement('a');
        anchor.href = link.href;
        anchor.textContent = link.text;
        anchor.style.cssText = componentStyles.navLink;
        anchor.addEventListener('mouseenter', () => {
          anchor.style.color = 'var(--text-primary)';
        });
        anchor.addEventListener('mouseleave', () => {
          anchor.style.color = 'var(--text-secondary)';
        });
        navLinks.appendChild(anchor);
      });
    }

    // Auth buttons
    const authButtons = document.createElement('div');
    authButtons.style.cssText = `
      display: flex;
      align-items: center;
      gap: 1rem;
    `;

    if (props.isAuthenticated && props.user) {
      // User info
      const userInfo = document.createElement('div');
      userInfo.style.cssText = `
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-secondary);
        margin-right: 1rem;
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
        font-size: 0.9rem;
      `;
      userAvatar.textContent = props.user.first_name.charAt(0).toUpperCase();

      const userName = document.createElement('span');
      userName.textContent = `${props.user.first_name} ${props.user.last_name}`;

      userInfo.appendChild(userAvatar);
      userInfo.appendChild(userName);

      const logoutButton = document.createElement('button');
      logoutButton.textContent = 'Logout';
      logoutButton.className = 'btn btn-secondary';
      logoutButton.style.cssText = `
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
      `;
      logoutButton.addEventListener('click', () => props.onLogout?.());

      authButtons.appendChild(userInfo);
      authButtons.appendChild(logoutButton);
    } else {
      // Login/Signup buttons
      const loginButton = document.createElement('button');
      loginButton.textContent = 'Login';
      loginButton.className = 'btn btn-secondary';
      loginButton.style.cssText = `
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
      `;
      loginButton.addEventListener('click', () => props.onLogin?.());

      const signupButton = document.createElement('button');
      signupButton.textContent = 'Sign Up';
      signupButton.className = 'btn btn-primary';
      signupButton.style.cssText = `
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
      `;
      signupButton.addEventListener('click', () => props.onSignup?.());

      authButtons.appendChild(loginButton);
      authButtons.appendChild(signupButton);
    }

    nav.appendChild(logo);
    nav.appendChild(navLinks);
    nav.appendChild(authButtons);
    container.appendChild(nav);
    header.appendChild(container);

    return header;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public render(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }
}
