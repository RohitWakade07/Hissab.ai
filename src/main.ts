import { App } from './App';

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('DOM loaded, initializing app...');
    
    // Ensure the app container exists
    let appContainer = document.getElementById('app');
    if (!appContainer) {
      console.log('App container not found, creating one...');
      appContainer = document.createElement('div');
      appContainer.id = 'app';
      document.body.appendChild(appContainer);
    }
    
    const app = new App();
    app.render();
    
    console.log('App initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
});

// Export for potential external usage
export { App };
