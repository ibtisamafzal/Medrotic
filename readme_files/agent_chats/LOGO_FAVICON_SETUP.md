# Logo and Favicon Setup Guide for Medrotic

## 📋 Quick Checklist

### Logo Files Needed:
- [ ] `public/images/logo/logo.svg` - Main logo (SVG format)
- [ ] `public/images/logo/logo-icon.svg` - Icon-only version (optional)

### Favicon Files Needed:
- [ ] `public/favicon.ico` - Combined 16x16 and 32x32
- [ ] `public/favicon-16x16.png`
- [ ] `public/favicon-32x32.png`
- [ ] `public/apple-touch-icon.png` (180x180)
- [ ] `public/android-chrome-192x192.png`
- [ ] `public/android-chrome-512x512.png`
- [ ] `public/favicon.svg` (optional, for modern browsers)

## 🎨 Exporting from Figma

### For Logo (SVG):
1. Select your logo design in Figma
2. Right-click → Export → SVG
3. Or use Export panel → Add export setting → SVG
4. Save as `logo.svg` to `public/images/logo/`

### For Favicon:
1. Create a square version of your logo (or use icon part)
2. Export at 512x512px as PNG
3. Use https://realfavicongenerator.net/ to generate all favicon sizes
4. Download the generated files and place in `public/` folder

## 📁 File Structure After Setup

```
public/
├── favicon.ico
├── favicon-16x16.png
├── favicon-32x32.png
├── apple-touch-icon.png
├── android-chrome-192x192.png
├── android-chrome-512x512.png
├── favicon.svg (optional)
└── images/
    └── logo/
        ├── logo.svg
        └── logo-icon.svg (optional)
```

## 🔧 Code Updates Required

After adding your logo files, you'll need to:

1. **Update `src/index.html`** - Add favicon links
2. **Update `src/app/common/header/header.html`** - Replace inline SVG with logo image
3. **Update `src/app/common/footer/footer.html`** - Replace inline SVG with logo image

## 📐 Recommended Dimensions

### Logo:
- **SVG**: Any size (scalable)
- **PNG fallback**: 400x400px (2x) or 600x600px (3x)

### Favicon:
- **favicon.ico**: 16x16 and 32x32 combined
- **PNG sizes**: 16x16, 32x32, 180x180, 192x192, 512x512
- **SVG favicon**: Any size (scalable, recommended)

## 🚀 Quick Steps

1. Export logo as SVG from Figma → Save to `public/images/logo/logo.svg`
2. Export square icon (512x512px PNG) from Figma
3. Go to https://realfavicongenerator.net/
4. Upload your 512x512px icon
5. Configure settings (colors, iOS settings, etc.)
6. Generate and download all favicon files
7. Place all favicon files in `public/` folder
8. Update HTML files (see code updates section)

## 💡 Tips

- **SVG is preferred** for logos - it's scalable and looks crisp at any size
- **Use PNG only** if your logo has complex effects that don't work in SVG
- **Test favicons** in different browsers and devices
- **Keep file sizes small** - optimize PNGs before uploading
- **Use transparent backgrounds** for favicons when possible
