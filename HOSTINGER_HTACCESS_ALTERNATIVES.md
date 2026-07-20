# Alternative .htaccess Files for Hostinger

If the current `.htaccess` (in `public/`) doesn't work, try one of these alternatives.

## Current .htaccess (public/.htaccess)
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  RewriteRule ^.*$ /index.html [L]
</IfModule>

<IfModule mod_mime.c>
  AddType application/javascript .js
  AddType text/css .css
  AddType application/json .json
  AddCharset UTF-8 .js .css .html .json .svg .txt
</IfModule>
```

---

## ✅ Fallback 1: Ultra-Minimal (Try if current fails)

Copy this to `public_html/.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ /index.html [QSA,L]
</IfModule>
```

---

## ✅ Fallback 2: With DirectoryIndex (Try if Fallback 1 fails)

```apache
DirectoryIndex index.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ /index.html [L]
</IfModule>
```

---

## ✅ Fallback 3: Apache 2.4+ Syntax

If Hostinger uses modern Apache:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Don't rewrite existing files or folders
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  
  # Route everything else to index.html
  RewriteRule ^(.+)$ /index.html [L]
</IfModule>
```

---

## How to Use

1. **Current .htaccess not working?**
   - Try **Fallback 1** (ultra-minimal)

2. **Fallback 1 not working?**
   - Try **Fallback 2** (with DirectoryIndex)

3. **Still not working?**
   - Try **Fallback 3** (Apache 2.4+ syntax)

4. **None of these work?**
   - Contact Hostinger: ask if mod_rewrite is enabled
   - Ask them for their Apache version
   - They may have .htaccess disabled in your hosting plan

---

## To Apply Alternative

1. Hostinger File Manager → `public_html/`
2. Right-click `.htaccess` → **Edit**
3. Delete all content
4. Paste one of the alternatives above
5. Click **Save**
6. Wait 1-2 minutes
7. Hard refresh: `Ctrl+Shift+Delete`
8. Test: https://slategray-monkey-804118.hostingersite.com/

---

## Testing Order

Test these in this order:
1. Current version (should already be uploaded)
2. Fallback 1 (minimal)
3. Fallback 2 (with DirectoryIndex)
4. Fallback 3 (Apache 2.4+)

Report which one works and I'll update the main .htaccess for you.
