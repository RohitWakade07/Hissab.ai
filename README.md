# Hisab Dost - TypeScript App

A modern TypeScript-based web application for Hisab Dost, an elegant accounting solution designed for Indian shopkeepers. This app features voice-first entry, smart bill scanning, and instant reporting capabilities.

## Features

- **Voice-First Entry**: Record transactions using voice commands in multiple Indian languages
- **Smart Bill Scanning**: AI-powered bill scanning and data extraction
- **Instant Reports**: Real-time insights on profit, GST, stock levels, and suppliers
- **Modern UI**: Elegant dark theme with smooth animations
- **Responsive Design**: Works seamlessly across all devices

## Tech Stack

- **TypeScript**: Type-safe JavaScript development
- **Vite**: Fast build tool and development server
- **CSS-in-JS**: Component-based styling system
- **Intersection Observer API**: Smooth scroll animations
- **Font Awesome**: Icon library
- **Google Fonts**: Inter and Sora font families

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.ts
│   ├── Hero.ts
│   ├── Features.ts
│   ├── HowItWorks.ts
│   ├── Testimonials.ts
│   ├── FinalCta.ts
│   └── Footer.ts
├── styles/              # Theme and styling
│   └── theme.ts
├── utils/               # Utility functions
│   └── animations.ts
├── App.ts              # Main application class
├── main.ts             # Application entry point
└── index.html          # HTML template
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hisab-dost-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking

## Component Architecture

The application follows a component-based architecture where each UI section is a separate TypeScript class:

### Header Component
- Navigation bar with logo and menu links
- Responsive design with mobile-friendly navigation

### Hero Component
- Main landing section with animated background
- Call-to-action buttons
- Aurora animation effect

### Features Component
- Grid layout showcasing key features
- Interactive hover effects
- Icon-based feature presentation

### How It Works Component
- Step-by-step process explanation
- Numbered step indicators
- Clean, centered layout

### Testimonials Component
- Customer testimonial display
- Styled quote presentation
- Author attribution

### Final CTA Component
- Final call-to-action section
- Prominent action button
- Compelling messaging

### Footer Component
- Copyright information
- Brand messaging

## Animation System

The app includes a sophisticated animation system:

- **Scroll Animations**: Elements animate into view as you scroll
- **Hover Effects**: Interactive elements respond to mouse interactions
- **Smooth Scrolling**: Anchor links scroll smoothly to sections
- **Aurora Background**: Rotating gradient background animation

## Styling System

The app uses a CSS-in-JS approach with:

- **Theme Variables**: Centralized color and font definitions
- **Component Styles**: Scoped styles for each component
- **Responsive Design**: Mobile-first approach with breakpoints
- **Dark Theme**: Elegant dark color scheme optimized for readability

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run type checking: `npm run type-check`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please contact the Hisab Dost team.
