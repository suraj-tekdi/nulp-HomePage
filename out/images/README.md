# Images Directory

This directory contains all image assets for the NULP Home Page project.

## Folder Structure

```
public/images/
├── banner/          # Banner section images and backgrounds
├── icons/           # Icons and small graphics
├── logos/           # Company/brand logos
├── sections/        # Images for different page sections
└── README.md        # This file
```

## Usage

### Banner Images
Place banner-related images in the `banner/` folder:
- Background images
- Hero section graphics
- Decorative elements

Example usage in components:
```tsx
import Image from 'next/image';

<Image 
  src="/images/banner/hero-bg.jpg" 
  alt="Hero Background"
  width={1200}
  height={600}
/>
```

### Supported Formats
- `.jpg`, `.jpeg` - Photographs and complex images
- `.png` - Images with transparency
- `.svg` - Vector graphics and icons
- `.webp` - Modern web format (recommended)

## Naming Convention

Use descriptive, lowercase names with hyphens:
- ✅ `hero-background.jpg`
- ✅ `stats-icon.svg`
- ✅ `company-logo.png`
- ❌ `IMG_001.jpg`
- ❌ `Background Image.png`

## Optimization Tips

1. Compress images before adding them
2. Use appropriate formats (WebP when possible)
3. Consider using Next.js Image component for automatic optimization
4. Keep file sizes reasonable for web performance 