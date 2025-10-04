import { componentStyles } from '../styles/theme';

export interface HeroProps {
  className?: string;
  onLogin?: () => void;
  onSignup?: () => void;
}

export class Hero {
  private element: HTMLElement;
  private auroraElement: HTMLElement;
  private onLogin?: () => void;
  private onSignup?: () => void;

  constructor(props: HeroProps = {}) {
    this.onLogin = props.onLogin;
    this.onSignup = props.onSignup;
    this.element = this.createElement(props);
    this.auroraElement = this.createAuroraElement();
  }

  private createElement(props: HeroProps): HTMLElement {
    const section = document.createElement('section');
    section.id = 'hero';
    section.style.cssText = componentStyles.hero;
    if (props.className) {
      section.className = props.className;
    }

    const auroraContainer = document.createElement('div');
    auroraContainer.className = 'hero-aurora-container';
    auroraContainer.style.cssText = componentStyles.heroAuroraContainer;

    const aurora = document.createElement('div');
    aurora.className = 'hero-aurora';
    aurora.style.cssText = componentStyles.heroAurora;

    auroraContainer.appendChild(aurora);

    const container = document.createElement('div');
    container.className = 'container hero-content animate-on-scroll';

    const title = document.createElement('h1');
    title.style.cssText = componentStyles.heroTitle;
    title.textContent = 'Accounting, Simplified.';

    const subtitle = document.createElement('p');
    subtitle.className = 'subtitle';
    subtitle.textContent = 'Stop typing, start talking. The effortless way for Indian shopkeepers to manage their business using just their voice or a photo. It\'s not software, it\'s your loyal digital accountant.';

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'hero-buttons';
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    `;

    const signupBtn = document.createElement('button');
    signupBtn.className = 'btn btn-primary';
    signupBtn.textContent = 'Get Started Free';
    signupBtn.addEventListener('click', () => this.onSignup?.());

    const demoBtn = document.createElement('button');
    demoBtn.className = 'btn btn-secondary';
    demoBtn.textContent = 'Watch Demo';
    demoBtn.addEventListener('click', () => {
      // Scroll to features section
      const featuresSection = document.getElementById('features');
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
      }
    });

    buttonsContainer.appendChild(signupBtn);
    buttonsContainer.appendChild(demoBtn);

    container.appendChild(title);
    container.appendChild(subtitle);
    container.appendChild(buttonsContainer);

    section.appendChild(auroraContainer);
    section.appendChild(container);

    this.auroraElement = aurora;
    return section;
  }

  private createAuroraElement(): HTMLElement {
    return this.element.querySelector('.hero-aurora') as HTMLElement;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public render(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }

  public startAuroraAnimation(): void {
    if (this.auroraElement) {
      this.auroraElement.style.animation = 'rotateAurora 20s linear infinite';
    }
  }
}
