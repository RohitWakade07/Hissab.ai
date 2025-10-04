// Theme configuration and CSS variables
export const theme = {
  colors: {
    backgroundDark: '#0D1117',
    backgroundMedium: '#161B22',
    borderColor: '#30363D',
    textPrimary: '#E6EDF3',
    textSecondary: '#8B949E',
    accentPrimary: '#22D3EE',
    accentGlow: 'rgba(34, 211, 238, 0.2)',
  },
  fonts: {
    heading: "'Sora', sans-serif",
    body: "'Inter', sans-serif",
  },
  breakpoints: {
    mobile: '768px',
  },
} as const;

// CSS-in-JS styles
export const globalStyles = `
  /* --- THEME & GLOBAL STYLES --- */
  :root {
    --background-dark: ${theme.colors.backgroundDark};
    --background-medium: ${theme.colors.backgroundMedium};
    --border-color: ${theme.colors.borderColor};
    --text-primary: ${theme.colors.textPrimary};
    --text-secondary: ${theme.colors.textSecondary};
    --accent-primary: ${theme.colors.accentPrimary};
    --accent-glow: ${theme.colors.accentGlow};
    --font-heading: ${theme.fonts.heading};
    --font-body: ${theme.fonts.body};
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html { 
    scroll-behavior: smooth; 
  }

  body {
    font-family: var(--font-body);
    background-color: var(--background-dark);
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* --- TYPOGRAPHY --- */
  h1, h2, h3 {
    font-family: var(--font-heading);
    font-weight: 700;
    line-height: 1.2;
    color: var(--text-primary);
  }
  
  h1 { 
    font-size: 3.5rem; 
    text-align: center; 
  }
  
  h2 { 
    font-size: 2.5rem; 
    text-align: center; 
    margin-bottom: 4rem; 
  }
  
  h3 { 
    font-size: 1.5rem; 
    margin-bottom: 0.75rem; 
  }
  
  p { 
    color: var(--text-secondary); 
    line-height: 1.7; 
  }
  
  .subtitle { 
    font-size: 1.25rem; 
    color: var(--text-secondary); 
    text-align: center; 
    max-width: 700px; 
    margin: 1.5rem auto 2.5rem; 
  }
  
  /* --- LAYOUT & HELPERS --- */
  section { 
    padding: 100px 20px; 
    overflow: hidden; 
  }
  
  .container { 
    max-width: 1100px; 
    margin: 0 auto; 
  }

  /* --- Animation Utilities --- */
  .animate-on-scroll {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s cubic-bezier(0.165, 0.84, 0.44, 1), transform 0.8s cubic-bezier(0.165, 0.84, 0.44, 1);
  }
  
  .animated {
    opacity: 1;
    transform: translateY(0);
  }

  /* --- BUTTONS --- */
  .btn {
    display: inline-block;
    font-family: var(--font-heading);
    font-weight: 600;
    text-decoration: none;
    padding: 0.9rem 2rem;
    border-radius: 8px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  
  .btn-primary {
    background-color: var(--accent-primary);
    color: var(--background-dark);
    box-shadow: 0 0 20px var(--accent-glow);
  }
  
  .btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 0 30px var(--accent-glow);
  }
  
  .btn-secondary {
    background-color: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }
  
  .btn-secondary:hover {
    background-color: var(--background-medium);
    border-color: var(--accent-primary);
    color: var(--accent-primary);
  }

  /* --- Responsive Design --- */
  @media (max-width: ${theme.breakpoints.mobile}) {
    h1 { font-size: 2.5rem; }
    h2 { font-size: 2rem; }
    .nav-links { display: none; }
    .steps-container { flex-direction: column; }
    .hero-aurora-container { width: 120vw; height: 120vw; }
  }
`;

// Component-specific styles
export const componentStyles = {
  header: `
    width: 100%;
    padding: 1.5rem 0;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100;
  `,
  
  nav: `
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,
  
  logo: `
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
  `,
  
  navLinks: `
    display: flex;
    gap: 2.5rem;
  `,
  
  navLink: `
    font-weight: 500;
    text-decoration: none;
    color: var(--text-secondary);
    transition: color 0.3s ease;
  `,
  
  hero: `
    min-height: 80vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    position: relative;
  `,
  
  heroAuroraContainer: `
    position: absolute;
    top: 50%; 
    left: 50%;
    transform: translate(-50%, -50%);
    width: 800px;
    height: 800px;
    z-index: 0;
    overflow: hidden;
  `,
  
  heroAurora: `
    position: absolute;
    width: 100%; 
    height: 100%;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.15;
    background-image: conic-gradient(from 90deg at 50% 50%, var(--accent-primary), #6D28D9, #1D4ED8, var(--accent-primary));
    animation: rotateAurora 20s linear infinite;
  `,
  
  heroContent: `
    position: relative; 
    z-index: 1;
  `,
  
  heroTitle: `
    background: linear-gradient(90deg, var(--text-primary), #A7C5E8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 1.5rem;
  `,
  
  featuresGrid: `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  `,
  
  featureCard: `
    background-color: var(--background-medium);
    padding: 2.5rem;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease, border-color 0.3s ease;
  `,
  
  featureIcon: `
    font-size: 2rem;
    color: var(--accent-primary);
    margin-bottom: 1.5rem;
    background-color: #1f2a38;
    padding: 12px;
    border-radius: 8px;
    display: inline-block;
  `,
  
  stepsContainer: `
    display: flex;
    justify-content: space-between;
    gap: 3rem;
    text-align: center;
  `,
  
  step: `
    flex: 1;
  `,
  
  stepIcon: `
    font-size: 1.5rem;
    width: 70px;
    height: 70px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    background-color: var(--background-medium);
    border: 1px solid var(--border-color);
    color: var(--accent-primary);
  `,
  
  testimonialCard: `
    background-color: var(--background-medium);
    padding: 2.5rem;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    text-align: center;
    max-width: 700px;
    margin: 0 auto;
  `,
  
  finalCta: `
    background-color: var(--background-medium);
    border-radius: 20px;
    padding: 5rem 2rem;
    text-align: center;
  `,
  
  footer: `
    padding: 3rem 0;
    text-align: center;
    border-top: 1px solid var(--border-color);
  `,
} as const;

// Keyframes
export const keyframes = `
  @keyframes rotateAurora {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
