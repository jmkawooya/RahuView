# RahuView

An interactive 3D web application visualizing lunar nodes and orbital mechanics using Three.js.

## Overview

RahuView displays a symbolic 3D model of Earth at the center, the ecliptic plane, the Moon's orbital plane, and the lunar nodes at their intersection. The app features accurate relative motion speeds and adjustable playback controls.

## Features

- 3D visualization of Earth, Moon, and orbital planes
- Interactive lunar nodes (North and South Node) display
- Adjustable orbital inclination and animation speed
- Mobile-friendly controls with touch support
- Starfield background for realistic space feel
- CSS2D labels for astronomical objects

## Tech Stack

- **TypeScript** - Type-safe development
- **Three.js** - 3D graphics and WebGL rendering
- **Vite** - Fast build tool and dev server
- **ESLint & Prettier** - Code linting and formatting

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Development

The project follows this structure:

```
/src
  main.ts           # Application entry point
  scene/            # Three.js scene components
  ui/               # User interface controls
  utils/            # Math helpers and constants
```

## Controls

- **Mouse/Touch**: Rotate and zoom camera around Earth
- **Inclination**: Adjust lunar orbital plane tilt (0-10 degrees)
- **Speed**: Control animation playback rate
- **Time Scrub**: Manual timeline control
- **Toggles**: Show/hide planes, labels, and trails

## Astronomical Accuracy

While the visualization is symbolic rather than to scale, it maintains realistic relative speeds:
- Sidereal year: 365.25 days
- Sidereal lunar period: 27.321661 days
- Default lunar inclination: 5.145 degrees

## License

MIT License
