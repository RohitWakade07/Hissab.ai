import { componentStyles } from '../styles/theme';

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface FeaturesProps {
  className?: string;
}

export class Features {
  private element: HTMLElement;
  private features: Feature[] = [
    {
      icon: 'fa-solid fa-microphone-lines',
      title: 'Voice-First Entry',
      description: 'Record sales, purchases, and expenses by simply speaking. The app understands multiple Indian languages.'
    },
    {
      icon: 'fa-solid fa-camera',
      title: 'Smart Bill Scanning',
      description: 'Take a photo of any bill. Our AI automatically extracts all important details, saving you time and effort.'
    },
    {
      icon: 'fa-solid fa-chart-pie',
      title: 'Instant Reports',
      description: 'Get immediate insights on your profit, GST, stock levels, and top suppliers, all in one clear dashboard.'
    }
  ];

  constructor(props: FeaturesProps = {}) {
    this.element = this.createElement(props);
  }

  private createElement(props: FeaturesProps): HTMLElement {
    const section = document.createElement('section');
    section.id = 'features';
    if (props.className) {
      section.className = props.className;
    }

    const container = document.createElement('div');
    container.className = 'container';

    const title = document.createElement('h2');
    title.className = 'animate-on-scroll';
    title.textContent = 'Designed for Simplicity, Built for Growth';

    const grid = document.createElement('div');
    grid.className = 'features-grid';
    grid.style.cssText = componentStyles.featuresGrid;

    this.features.forEach((feature, index) => {
      const card = this.createFeatureCard(feature, index);
      grid.appendChild(card);
    });

    container.appendChild(title);
    container.appendChild(grid);
    section.appendChild(container);

    return section;
  }

  private createFeatureCard(feature: Feature, index: number): HTMLElement {
    const card = document.createElement('div');
    card.className = 'feature-card animate-on-scroll';
    card.style.cssText = componentStyles.featureCard;
    card.style.transitionDelay = `${0.1 + index * 0.1}s`;

    const icon = document.createElement('i');
    icon.className = feature.icon;
    icon.style.cssText = componentStyles.featureIcon;

    const title = document.createElement('h3');
    title.textContent = feature.title;

    const description = document.createElement('p');
    description.textContent = feature.description;

    card.appendChild(icon);
    card.appendChild(title);
    card.appendChild(description);

    // Add interactive glow effect
    this.addGlowEffect(card);

    return card;
  }

  private addGlowEffect(card: HTMLElement): void {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });

    card.addEventListener('mouseenter', () => {
      card.style.borderColor = 'var(--accent-primary)';
      card.style.transform = 'translateY(-5px)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.borderColor = 'var(--border-color)';
      card.style.transform = 'translateY(0)';
    });
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public render(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }
}
