import { componentStyles } from '../styles/theme';

export interface Step {
  number: number;
  title: string;
  description: string;
}

export interface HowItWorksProps {
  className?: string;
}

export class HowItWorks {
  private element: HTMLElement;
  private steps: Step[] = [
    {
      number: 1,
      title: 'Speak or Scan',
      description: 'Press the button and describe your transaction, or just snap a photo of your bill.'
    },
    {
      number: 2,
      title: 'AI Processes',
      description: 'Our intelligent system securely records and categorizes everything for you in real-time.'
    },
    {
      number: 3,
      title: 'View Your Reports',
      description: 'Instantly see updated reports on your sales, profit, and stock, ready anytime you need them.'
    }
  ];

  constructor(props: HowItWorksProps = {}) {
    this.element = this.createElement(props);
  }

  private createElement(props: HowItWorksProps): HTMLElement {
    const section = document.createElement('section');
    section.id = 'how-it-works';
    section.style.backgroundColor = 'var(--background-dark)';
    if (props.className) {
      section.className = props.className;
    }

    const container = document.createElement('div');
    container.className = 'container';

    const title = document.createElement('h2');
    title.className = 'animate-on-scroll';
    title.textContent = 'Get Started in Seconds';

    const stepsContainer = document.createElement('div');
    stepsContainer.className = 'steps-container';
    stepsContainer.style.cssText = componentStyles.stepsContainer;

    this.steps.forEach((step, index) => {
      const stepElement = this.createStepElement(step, index);
      stepsContainer.appendChild(stepElement);
    });

    container.appendChild(title);
    container.appendChild(stepsContainer);
    section.appendChild(container);

    return section;
  }

  private createStepElement(step: Step, index: number): HTMLElement {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'step animate-on-scroll';
    stepDiv.style.cssText = componentStyles.step;
    stepDiv.style.transitionDelay = `${0.1 + index * 0.1}s`;

    const icon = document.createElement('div');
    icon.className = 'step-icon';
    icon.style.cssText = componentStyles.stepIcon;
    icon.textContent = step.number.toString();

    const title = document.createElement('h3');
    title.textContent = step.title;

    const description = document.createElement('p');
    description.textContent = step.description;

    stepDiv.appendChild(icon);
    stepDiv.appendChild(title);
    stepDiv.appendChild(description);

    return stepDiv;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public render(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }
}
