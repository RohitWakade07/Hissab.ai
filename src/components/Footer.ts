import { componentStyles } from '../styles/theme';

export interface FooterProps {
  className?: string;
}

export class Footer {
  private element: HTMLElement;

  constructor(props: FooterProps = {}) {
    this.element = this.createElement(props);
  }

  private createElement(props: FooterProps): HTMLElement {
    const footer = document.createElement('footer');
    footer.style.cssText = componentStyles.footer;
    if (props.className) {
      footer.className = props.className;
    }

    const container = document.createElement('div');
    container.className = 'container';

    const copyright = document.createElement('p');
    copyright.style.cssText = `
      color: var(--text-secondary);
    `;
    copyright.textContent = '© 2025 Hisab Dost. Made with ❤️ for the heart of Indian commerce.';

    container.appendChild(copyright);
    footer.appendChild(container);

    return footer;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public render(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }
}
