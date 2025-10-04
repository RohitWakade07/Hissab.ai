import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { HowItWorks } from './components/HowItWorks';
import { Testimonials } from './components/Testimonials';
import { FinalCta } from './components/FinalCta';
import { Footer } from './components/Footer';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { UserDashboard } from './components/UserDashboard';
import { AnimationManager, SmoothScroll, ButtonInteractions } from './utils/animations';
import { AuthService, AuthUser } from './services/AuthService';
import { globalStyles, keyframes } from './styles/theme';

export interface AppProps {
  containerId?: string;
}

export class App {
  private container: HTMLElement;
  private animationManager: AnimationManager;
  private authService: AuthService;
  private components: {
    header: Header;
    hero: Hero;
    features: Features;
    howItWorks: HowItWorks;
    testimonials: Testimonials;
    finalCta: FinalCta;
    footer: Footer;
  };
  private authComponents: {
    login?: Login;
    signup?: Signup;
    dashboard?: UserDashboard;
  } = {};
  private currentUser: AuthUser | null = null;
  private isAuthenticated: boolean = false;

  constructor(props: AppProps = {}) {
    this.container = this.getContainer(props.containerId);
    this.animationManager = new AnimationManager();
    this.authService = AuthService.getInstance();
    this.components = this.initializeComponents();
    this.setupStyles();
    this.checkAuthentication();
  }

  private getContainer(containerId?: string): HTMLElement {
    const id = containerId || 'app';
    let container = document.getElementById(id);
    
    if (!container) {
      container = document.createElement('div');
      container.id = id;
      document.body.appendChild(container);
    }
    
    // Ensure we have a valid HTMLElement
    if (!container) {
      throw new Error(`Failed to create or find container with id: ${id}`);
    }
    
    return container;
  }

  private checkAuthentication(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.currentUser = this.authService.getCurrentUser();
  }

  private initializeComponents() {
    return {
      header: new Header({
        isAuthenticated: this.isAuthenticated,
        user: this.currentUser,
        onLogin: () => this.showLogin(),
        onSignup: () => this.showSignup(),
        onLogout: () => this.handleLogout(),
      }),
      hero: new Hero({
        onLogin: () => this.showLogin(),
        onSignup: () => this.showSignup(),
      }),
      features: new Features(),
      howItWorks: new HowItWorks(),
      testimonials: new Testimonials(),
      finalCta: new FinalCta(),
      footer: new Footer()
    };
  }

  private setupStyles(): void {
    // Inject global styles
    const styleElement = document.createElement('style');
    styleElement.textContent = globalStyles + keyframes;
    document.head.appendChild(styleElement);

    // Add Font Awesome
    const fontAwesomeLink = document.createElement('link');
    fontAwesomeLink.rel = 'stylesheet';
    fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css';
    document.head.appendChild(fontAwesomeLink);

    // Add Google Fonts
    const googleFontsLink = document.createElement('link');
    googleFontsLink.rel = 'preconnect';
    googleFontsLink.href = 'https://fonts.googleapis.com';
    document.head.appendChild(googleFontsLink);

    const googleFontsLink2 = document.createElement('link');
    googleFontsLink2.rel = 'preconnect';
    googleFontsLink2.href = 'https://fonts.gstatic.com';
    googleFontsLink2.crossOrigin = 'anonymous';
    document.head.appendChild(googleFontsLink2);

    const googleFontsCSS = document.createElement('link');
    googleFontsCSS.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Sora:wght@600;700&display=swap';
    googleFontsCSS.rel = 'stylesheet';
    document.head.appendChild(googleFontsCSS);
  }

  private renderComponents(): void {
    // Ensure container exists and is valid
    if (!this.container) {
      throw new Error('Container is not initialized');
    }
    
    if (!(this.container instanceof HTMLElement)) {
      throw new Error('Container is not a valid HTMLElement');
    }

    // Clear container
    this.container.innerHTML = '';

    if (this.isAuthenticated && this.currentUser) {
      // Show dashboard for authenticated users
      this.authComponents.dashboard = new UserDashboard({
        user: this.currentUser,
        onLogout: () => this.handleLogout(),
      });
      this.authComponents.dashboard.render(this.container);
    } else {
      // Show landing page for non-authenticated users
      this.components.header.render(this.container);
      this.components.hero.render(this.container);
      this.components.features.render(this.container);
      this.components.howItWorks.render(this.container);
      this.components.testimonials.render(this.container);
      this.components.finalCta.render(this.container);
      this.components.footer.render(this.container);
    }
  }

  private initializeInteractions(): void {
    // Initialize animations
    this.animationManager.observeElements();

    // Initialize smooth scrolling
    SmoothScroll.init();

    // Initialize button interactions
    ButtonInteractions.init();

    // Start hero aurora animation (only if hero is rendered)
    if (!this.isAuthenticated) {
      this.components.hero.startAuroraAnimation();
    }
  }

  private showLogin(): void {
    this.authComponents.login = new Login({
      onSuccess: (user) => this.handleLoginSuccess(user),
      onSwitchToSignup: () => this.showSignup(),
      onClose: () => this.closeAuthModal(),
    });
    this.authComponents.login.render(document.body);
  }

  private showSignup(): void {
    this.authComponents.signup = new Signup({
      onSuccess: (user) => this.handleLoginSuccess(user),
      onSwitchToLogin: () => this.showLogin(),
      onClose: () => this.closeAuthModal(),
    });
    this.authComponents.signup.render(document.body);
  }

  private closeAuthModal(): void {
    if (this.authComponents.login) {
      this.authComponents.login.destroy();
      this.authComponents.login = undefined;
    }
    if (this.authComponents.signup) {
      this.authComponents.signup.destroy();
      this.authComponents.signup = undefined;
    }
  }

  private handleLoginSuccess(user: AuthUser): void {
    this.currentUser = user;
    this.isAuthenticated = true;
    this.closeAuthModal();
    this.render();
  }

  private async handleLogout(): Promise<void> {
    await this.authService.logout();
    this.currentUser = null;
    this.isAuthenticated = false;
    this.render();
  }

  public render(): void {
    this.renderComponents();
    this.initializeInteractions();
  }

  public destroy(): void {
    this.animationManager.destroy();
    this.container.innerHTML = '';
  }

  public getContainerElement(): HTMLElement {
    return this.container;
  }
}
