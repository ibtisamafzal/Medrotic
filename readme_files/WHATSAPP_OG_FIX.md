# WhatsApp OpenGraph Image Fix

## Changes Made

### 1. Enhanced Meta Tags (`src/index.html`)
Added WhatsApp-specific OpenGraph meta tags:
- `og:image:secure_url` - Required by WhatsApp for HTTPS images
- `og:image:type` - Specifies image format (image/png)
- `og:site_name` - Site identification
- `og:locale` - Locale specification
- `Access-Control-Allow-Origin` header for CORS

### 2. Fixed Vercel Configuration (`vercel.json`)
- Added headers configuration for `/og-image.png` to ensure proper content-type and caching
- Updated rewrite rules to exclude static files (images, fonts, etc.) so they're served directly
- Added CORS header to allow WhatsApp to fetch the image

## Important: WhatsApp Cache

**WhatsApp aggressively caches OpenGraph meta tags.** Even after fixing the code, WhatsApp may still show old previews because of caching.

### To Clear WhatsApp Cache:

1. **Use Facebook Sharing Debugger** (WhatsApp uses Facebook's crawler):
   - Go to: https://developers.facebook.com/tools/debug/
   - Enter your URL: `https://medrotic.com/`
   - Click "Scrape Again" to force Facebook/WhatsApp to refresh the cache
   - Repeat 2-3 times if needed

2. **Verify Image Accessibility**:
   - Open `https://medrotic.com/og-image.png` directly in a browser
   - Ensure it loads correctly (should show your OpenGraph image)
   - Check that it's served over HTTPS

3. **Test the Preview**:
   - After clearing cache, send your URL in WhatsApp
   - The preview should now show the image

## Verification Checklist

- [ ] Image exists at `public/og-image.png`
- [ ] Image is accessible at `https://medrotic.com/og-image.png`
- [ ] Meta tags are in `src/index.html` (already done)
- [ ] Deployed to Vercel with updated `vercel.json`
- [ ] Cleared Facebook/WhatsApp cache using debugger tool
- [ ] Tested link preview in WhatsApp

## Image Requirements for WhatsApp

- ✅ Format: PNG or JPG
- ✅ Size: Minimum 300x200px (yours is 1200x630px - perfect!)
- ✅ File size: Less than 5MB
- ✅ HTTPS: Must be served over HTTPS
- ✅ Public: No authentication required
- ✅ Absolute URL: Must be full URL (already configured)

## Troubleshooting

If the image still doesn't show:

1. **Check image URL**: Visit `https://medrotic.com/og-image.png` directly
2. **Verify meta tags**: View page source and check `<head>` section
3. **Use debugger**: Facebook Sharing Debugger will show any errors
4. **Wait**: Sometimes WhatsApp cache takes 24-48 hours to clear naturally
5. **Check file location**: Ensure `og-image.png` is in the `public` folder
