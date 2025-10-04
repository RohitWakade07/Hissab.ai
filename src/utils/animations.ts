export class AnimationManager {
  private observer: IntersectionObserver;
  private animatedElements: Set<Element> = new Set();

  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
            entry.target.classList.add('animated');
            this.animatedElements.add(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );
  }

  public observeElements(): void {
    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(el => {
      if (!this.animatedElements.has(el)) {
        this.observer.observe(el);
      }
    });
  }

  public addGlowEffect(element: HTMLElement): void {
    element.addEventListener('mousemove', (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      element.style.setProperty('--mouse-x', `${x}px`);
      element.style.setProperty('--mouse-y', `${y}px`);
    });

    element.addEventListener('mouseenter', () => {
      element.style.borderColor = 'var(--accent-primary)';
      element.style.transform = 'translateY(-5px)';
    });

    element.addEventListener('mouseleave', () => {
      element.style.borderColor = 'var(--border-color)';
      element.style.transform = 'translateY(0)';
    });
  }

  public destroy(): void {
    this.observer.disconnect();
    this.animatedElements.clear();
  }
}

export class SmoothScroll {
  public static init(): void {
    // Smooth scroll for anchor links
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const targetId = target.getAttribute('href')?.substring(1);
        const targetElement = document.getElementById(targetId!);
        
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  }
}

export class ButtonInteractions {
  public static init(): void {
    // Add hover effects to all buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
      const htmlButton = button as HTMLElement;
      htmlButton.addEventListener('mouseenter', () => {
        htmlButton.style.transform = 'translateY(-3px)';
      });
      
      htmlButton.addEventListener('mouseleave', () => {
        htmlButton.style.transform = 'translateY(0)';
      });
    });
  }
}
