# Logo Setup Guide

This guide explains how to add and configure a logo for the RRCompanion
application.

## Logo File Placement

### Directory Structure

```
apps/web/
├── public/
│   └── images/
│       └── logo.png          # Your logo file goes here
├── src/
│   └── components/
│       └── Logo.tsx          # Logo component
```

### File Location

Place your logo file at: `apps/web/public/images/logo.png`

## Recommended Logo Sizes

### Primary Logo Sizes

- **32x32px** - Favicon and small icons
- **64x64px** - Medium icons and navigation
- **128x128px** - Standard logo size (recommended)
- **256x256px** - High-resolution displays
- **512x512px** - Large displays and print

### Format Requirements

- **Format**: PNG (recommended) or SVG
- **Background**: Transparent or white background
- **Aspect Ratio**: Square (1:1) or rectangular (max 2:1 width to height)
- **File Size**: Under 100KB for web performance

## Implementation

### 1. Add Your Logo File

```bash
# Create the images directory if it doesn't exist
mkdir -p apps/web/public/images

# Copy your logo file
cp your-logo.png apps/web/public/images/logo.png
```

### 2. Logo Component Usage

The application includes a reusable `Logo` component that automatically handles:

- Responsive sizing
- Fallback text if logo fails to load
- Consistent styling

#### Basic Usage

```tsx
import Logo from '@/components/Logo';

// Default size (md = 32x32px)
<Logo />

// Small size (24x24px)
<Logo size="sm" />

// Large size (48x48px)
<Logo size="lg" />

// Extra large size (64x64px)
<Logo size="xl" />

// Logo only (no text)
<Logo showText={false} />

// Custom styling
<Logo className="my-custom-class" />
```

#### Size Options

- `sm` - 24x24px (h-6 w-6)
- `md` - 32x32px (h-8 w-8) - **Default**
- `lg` - 48x48px (h-12 w-12)
- `xl` - 64x64px (h-16 w-16)

### 3. Current Usage Locations

The logo is currently used in:

- **Dashboard** (`apps/web/src/pages/Dashboard.tsx`) - Navigation header
- **Privacy Page** (`apps/web/src/pages/Privacy.tsx`) - Navigation header
- **Terms Page** (`apps/web/src/pages/Terms.tsx`) - Navigation header

### 4. Favicon Setup

To use your logo as a favicon:

1. Create a 32x32px version of your logo
2. Replace the existing favicon:

```bash
# Replace the default Vite favicon
cp apps/web/public/images/logo.png apps/web/public/vite.svg
```

Or update the HTML to reference your logo:

```html
<!-- In apps/web/index.html -->
<link rel="icon" type="image/png" href="/images/logo.png" />
```

## Design Guidelines

### Logo Design Best Practices

1. **Simplicity** - Clean, recognizable design
2. **Scalability** - Should work well at small sizes
3. **Contrast** - Ensure visibility on light backgrounds
4. **Consistency** - Match your brand colors and style
5. **Uniqueness** - Distinctive and memorable

### Color Considerations

- **Primary**: Use your brand's primary color
- **Contrast**: Ensure good contrast against white/gray backgrounds
- **Accessibility**: Consider color-blind users
- **Versatility**: Should work in both light and dark themes

### File Optimization

- **Compression**: Use tools like TinyPNG or ImageOptim
- **Format**: PNG for logos with transparency, SVG for scalable graphics
- **Size**: Keep under 100KB for web performance
- **Resolution**: Provide 2x resolution for high-DPI displays

## Troubleshooting

### Common Issues

1. **Logo not displaying**
   - Check file path: `apps/web/public/images/logo.png`
   - Verify file permissions
   - Check browser console for errors

2. **Logo appears blurry**
   - Use higher resolution source file
   - Ensure PNG format for better quality
   - Consider using SVG for scalability

3. **Logo too large/small**
   - Adjust the `size` prop in the Logo component
   - Use CSS classes for custom sizing

4. **Logo not loading in production**
   - Ensure file is in the `public` directory
   - Check build process includes the file
   - Verify file path in production environment

### Testing

```bash
# Test logo display locally
cd apps/web
npm run dev

# Check logo in different sizes
# Visit: http://localhost:3000
```

## Example Implementation

Here's how the logo is currently implemented in the Dashboard:

```tsx
import Logo from "@/components/Logo";

// In the navigation header
<div className="flex items-center">
  <Link to="/dashboard">
    <Logo size="md" />
  </Link>
</div>;
```

This creates a clickable logo that links back to the dashboard and displays at
the medium size (32x32px) with the "RRCompanion" text next to it.
