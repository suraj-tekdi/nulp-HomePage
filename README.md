# NULP Home Page

A modern, responsive homepage for the National Urban Learning Platform built with Next.js, TypeScript, and Material-UI.

## 🚀 Features

- **Sticky Header**: Navigation header that stays fixed while scrolling
- **Responsive Design**: Optimized for all device sizes
- **BEM Methodology**: Clean, maintainable CSS using BEM naming convention
- **CSS Variables**: Consistent color scheme and spacing throughout
- **Material-UI Integration**: Modern UI components with custom theming
- **Inter Font**: Professional typography using Google Fonts
- **TypeScript**: Type-safe development experience

## 🛠 Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: CSS Modules with BEM methodology
- **UI Library**: Material-UI (MUI)
- **Font**: Inter (Google Fonts)

## 📁 Project Structure

```
nulp-home-page/
├── components/
│   ├── Header/
│   │   ├── Header.tsx           # Header component
│   │   ├── Header.module.css    # BEM-styled CSS module
│   │   └── index.ts            # Component export
│   └── index.ts                # Main components export
├── pages/
│   ├── _app.tsx                # App wrapper with MUI theme
│   ├── _document.tsx           # Document setup with fonts
│   └── index.tsx               # Homepage
├── styles/
│   └── globals.css             # Global styles and CSS variables
├── package.json                # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── next.config.js             # Next.js configuration
└── README.md                  # Project documentation
```

## 🎨 Color Scheme

The project uses a comprehensive color scheme defined in CSS variables:

### Primary Colors
- **Yellow**: `#ffbc01`
- **Teal**: `#0097b2`
- **Light Teal**: `#acdadd`
- **Dark Blue**: `#00557b`
- **Navy**: `#054365`
- **Light Blue**: `#01b1de`

### Secondary Colors
- **Blue**: `#018acf`
- **Dark Teal**: `#00b0cf`
- **Forest**: `#057184`
- **Light Yellow**: `#ffce6d`
- **Pale Yellow**: `#ffeda3`
- **Light Gray**: `#f4efe3`

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 🧩 Component Structure

### Header Component

The Header component (`components/Header/Header.tsx`) features:

- **Sticky positioning**: Remains at top while scrolling
- **Navigation links**: Home, Courses, Discussions, State Engagement, About Us, Contact Us
- **Search functionality**: Integrated search bar with MUI icons
- **Authentication button**: Log In/Sign Up button
- **Responsive design**: Mobile-friendly with breakpoints
- **BEM methodology**: Clean CSS class naming

#### Usage

```tsx
import { Header } from '@/components';

export default function Page() {
  return (
    <div>
      <Header />
      {/* Page content */}
    </div>
  );
}
```

## 🎯 BEM Methodology

The project follows BEM (Block Element Modifier) naming convention:

- **Block**: `.header`
- **Element**: `.header__nav`, `.header__search`, `.header__auth-button`
- **Modifier**: `.header__nav-link--active`

Example:
```css
.header {
  /* Block styles */
}

.header__nav {
  /* Element styles */
}

.header__nav-link--active {
  /* Modifier styles */
}
```

## 📱 Responsive Design

The header adapts to different screen sizes:

- **Desktop** (>1024px): Full navigation with search
- **Tablet** (768px-1024px): Compact navigation
- **Mobile** (<768px): Hidden navigation menu (hamburger menu can be added)
- **Small Mobile** (<480px): Stacked layout

## 🔧 Customization

### Updating Colors

Modify the CSS variables in `styles/globals.css`:

```css
:root {
  --color-primary-teal: #your-color;
  --color-primary-dark-blue: #your-color;
  /* ... other variables */
}
```

### Adding New Components

1. Create component folder in `components/`
2. Add `ComponentName.tsx` and `ComponentName.module.css`
3. Create `index.ts` for clean imports
4. Export from main `components/index.ts`

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

Please follow the established patterns:
- Use BEM methodology for CSS
- Implement responsive design
- Follow TypeScript best practices
- Use CSS variables for consistency
- Write clean, maintainable code 