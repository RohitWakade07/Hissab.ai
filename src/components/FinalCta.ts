import { componentStyles } from '../styles/theme';

export interface FinalCtaProps {
  className?: string;
}

export class FinalCta {
  private element: HTMLElement;

  constructor(props: FinalCtaProps = {}) {
    this.element = this.createElement(props);
  }

  private createElement(props: FinalCtaProps): HTMLElement {
    const section = document.createElement('section');
    section.id = 'final-cta-container';
    if (props.className) {
      section.className = props.className;
    }

    const container = document.createElement('div');
    container.className = 'container';

    const ctaDiv = document.createElement('div');
    ctaDiv.id = 'final-cta';
    ctaDiv.className = 'animate-on-scroll';
    ctaDiv.style.cssText = componentStyles.finalCta;

    const title = document.createElement('h2');
    title.style.fontSize = '2.2rem';
    title.textContent = 'Ready to Simplify Your Business?';

    const subtitle = document.createElement('p');
    subtitle.className = 'subtitle';
    subtitle.textContent = 'Stop worrying about bookkeeping and focus on what you do best—serving your customers. Download Hisab Dost today and feel the difference.';

    const button = document.createElement('a');
    button.href = '#';
    button.className = 'btn btn-primary';
    button.textContent = 'Get Started for Free';

    ctaDiv.appendChild(title);
    ctaDiv.appendChild(subtitle);
    ctaDiv.appendChild(button);

    container.appendChild(ctaDiv);
    section.appendChild(container);

    return section;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public render(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }
}
