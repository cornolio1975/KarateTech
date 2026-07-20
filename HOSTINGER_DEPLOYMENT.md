# Hostinger Deployment Guide

This guide explains how to deploy the KarateTech application to Hostinger (slategray-monkey-804118.hostingersite.com).

## Prerequisites

- Hostinger account with FTP/SFTP access or File Manager
- The production build completed (contents of `/out` folder)
- .htaccess file configured for SPA routing

## Build Process

The app has already been built for Hostinger deployment with these settings:

```bash
NEXT_PUBLIC_BASE_PATH=""  # Empty for root deployment
```

This creates a production-ready build in the `/out` folder.

## Deployment Steps

### Option 1: Using Hostinger File Manager (Recommended)

1. **Access Hostinger Control Panel**
   - Login to https://www.hostinger.com/
   - Go to **Hosting → File Manager**

2. **Navigate to public_html**
   - Locate the `public_html` folder
   - This is your website root directory

3. **Clear existing files** (if any)
   - Delete old files from `public_html` to avoid conflicts
   - Keep the `.htaccess` file (important!)

4. **Upload production files**
   - Upload ALL contents from the local `/out` folder
   - Include the `.htaccess` file from `/public/.htaccess`
   - Ensure the folder structure matches:
     ```
     public_html/
     ├── index.html          (root file)
     ├── .htaccess           (routing configuration)
     ├── _next/              (Next.js assets)
     ├── admin/
     ├── bouts/
     ├── participants/
     └── ... (other route folders)
     ```

5. **Verify file permissions**
   - `.htaccess`: 644
   - HTML/CSS/JS files: 644
   - Folders: 755

### Option 2: Using FTP/SFTP Client

1. **Get FTP credentials from Hostinger**
   - Go to Hosting → FTP Accounts
   - Create or retrieve FTP credentials

2. **Connect via FTP**
   - Use FileZilla, WinSCP, or similar
   - Server: Your FTP hostname
   - Username: FTP username
   - Password: FTP password
   - Port: 21 (FTP) or 22 (SFTP)

3. **Upload to public_html**
   ```
   Local: C:\Users\svana\KarateTech\out\*
   Remote: public_html/
   ```

4. **Upload .htaccess**
   ```
   Local: C:\Users\svana\KarateTech\public\.htaccess
   Remote: public_html/.htaccess
   ```

## .htaccess Configuration

The `.htaccess` file handles SPA routing and is critical for the app to work. It should be in the root (`public_html/`) with these key rules:

```apache
# Enable mod_rewrite
RewriteEngine On

# Serve static files directly
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

# Serve directories directly
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Route to index.html with trailing slash
RewriteCond %{REQUEST_FILENAME}/index.html -f
RewriteRule ^(.*?)/?$ /$1/index.html [L]

# Fallback for SPA routing
RewriteRule ^ /index.html [L]
```

## Troubleshooting

### Issue: Still getting 404 errors

**Solution 1:** Verify .htaccess is present
- Check that `.htaccess` exists in `public_html/`
- File permissions should be 644

**Solution 2:** Check mod_rewrite is enabled
- Contact Hostinger support to enable `mod_rewrite`
- Most shared hosting plans have it enabled by default

**Solution 3:** Clear browser cache
- Hard refresh: `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- Or open in incognito/private mode

**Solution 4:** Verify file upload
- Check that `index.html` exists in `public_html/`
- Verify `_next/` folder is present with assets

### Issue: CSS/JS not loading

**Solution:**
- Ensure all files in `/out/_next/` are uploaded
- Check that MIME types are correct (handled by .htaccess)
- Verify browser isn't caching old files

### Issue: Images not showing

**Solution:**
- Check that `/public/` folder is uploaded
- Verify image file names and paths
- Ensure trailing slashes in URLs (configured in Next.js)

## Build for Deployment

To rebuild for Hostinger at any time:

```bash
# Ensure environment is set for root deployment
set NEXT_PUBLIC_BASE_PATH=

# Build for production
npm run build

# Output goes to /out folder
```

Or use the convenience script:

```bash
npm run build:hostinger
```

## Environment Variables

For Hostinger deployment, create/update `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BASE_PATH=
```

The `NEXT_PUBLIC_BASE_PATH=` (empty) is critical for root domain deployment.

## After Deployment

1. **Test the site**
   - Visit https://slategray-monkey-804118.hostingersite.com/
   - Check that homepage loads
   - Test navigation to different pages

2. **Monitor logs**
   - Hostinger File Manager shows error logs
   - Check `error_log` in `public_html/`

3. **Verify database connection**
   - If using Supabase, confirm NEXT_PUBLIC_SUPABASE_URL and key are correct
   - Check browser console for API errors (F12 → Console)

## Support

- Hostinger Support: https://support.hostinger.com/
- Next.js Export Docs: https://nextjs.org/docs/advanced-features/static-html-export
- Apache .htaccess Reference: https://httpd.apache.org/docs/current/mod/mod_rewrite.html

---

**Last Updated:** 2026-07-21
**Application:** KarateTech v0.1.0
**Deployment Target:** Hostinger Shared Hosting
