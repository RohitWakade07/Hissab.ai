import { componentStyles } from '../styles/theme';

export interface Testimonial {
  text: string;
  author: string;
  role: string;
}

export interface TestimonialsProps {
  className?: string;
}

export class Testimonials {
  private element: HTMLElement;
  private testimonial: Testimonial = {
    text: "This is the simplest accounting tool I have ever used. The voice feature is magical. It has saved me hours every week and helped me understand my business better.",
    author: "Sunil Kumar",
    role: "Kirana Store Owner, Lucknow"
  };

  constructor(props: TestimonialsProps = {}) {
    this.element = this.createElement(props);
  }

  private createElement(props: TestimonialsProps): HTMLElement {
    const section = document.createElement('section');
    section.id = 'testimonials';
    if (props.className) {
      section.className = props.className;
    }

    const container = document.createElement('div');
    container.className = 'container';

    const title = document.createElement('h2');
    title.className = 'animate-on-scroll';
    title.textContent = 'Trusted by Shopkeepers Across India';

    const testimonialCard = document.createElement('div');
    testimonialCard.className = 'testimonial-card animate-on-scroll';
    testimonialCard.style.cssText = componentStyles.testimonialCard;

    const testimonialText = document.createElement('p');
    testimonialText.style.cssText = `
      font-size: 1.2rem;
      color: var(--text-primary);
      line-height: 1.8;
      margin-bottom: 1.5rem;
    `;
    testimonialText.textContent = this.testimonial.text;

    const authorDiv = document.createElement('div');
    authorDiv.className = 'author';
    authorDiv.style.cssText = `
      font-weight: 600;
      color: var(--text-secondary);
    `;

    const authorSpan = document.createElement('span');
    authorSpan.style.color = 'var(--accent-primary)';
    authorSpan.textContent = this.testimonial.author;

    authorDiv.appendChild(authorSpan);
    authorDiv.appendChild(document.createTextNode(` – ${this.testimonial.role}`));

    testimonialCard.appendChild(testimonialText);
    testimonialCard.appendChild(authorDiv);

    container.appendChild(title);
    container.appendChild(testimonialCard);
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
