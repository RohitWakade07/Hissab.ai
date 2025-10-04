# Development Instructions

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   Navigate to `http://localhost:3000`

## Project Structure

- `src/` - Source code directory
- `src/components/` - TypeScript component classes
- `src/styles/` - Theme and styling system
- `src/utils/` - Utility functions and animations
- `src/App.ts` - Main application class
- `src/main.ts` - Entry point
- `src/index.html` - HTML template

## Key Features

- **TypeScript**: Full type safety
- **Component-based**: Modular architecture
- **Animations**: Scroll-triggered and interactive animations
- **Responsive**: Mobile-first design
- **Dark Theme**: Elegant color scheme

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Type Checking

```bash
npm run type-check
```

## Architecture Notes

- Each component is a TypeScript class that creates and manages DOM elements
- Styles are injected dynamically using CSS-in-JS approach
- Animations use Intersection Observer API for performance
- Font Awesome icons and Google Fonts are loaded dynamically
