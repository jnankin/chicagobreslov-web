# Weebly Archive → Local Static Site Migration Guide

This document describes every step required to take a raw Weebly site export and turn it into a fully self-contained static site that can be served locally or hosted on GitHub Pages.

---

## Prerequisites

- The exported Weebly archive (a zip or folder of `.html` files, `files/`, `uploads/`)
- The original site's live URL (e.g. `https://yoursite.weebly.com`) — needed to recover missing assets
- Python 3 (for downloading files)
- A text editor or scripting tool capable of bulk find-and-replace across files (e.g. `perl -i`)

---

## Step 1 — Fix Theme JS Paths

Weebly exports reference theme scripts at `files/theme/plugins.js` and `files/theme/custom.js`, but the actual files live one level deeper at `files/theme/files/`.

Run across all HTML files:

```bash
perl -i -pe '
  s|src="files/theme/plugins\.js"|src="files/theme/files/plugins.js"|g;
  s|src="files/theme/custom\.js"|src="files/theme/files/custom.js"|g;
' *.html
```

---

## Step 2 — Fix Absolute `/uploads/` Paths in Inline Styles

Section background images in Weebly exports are written as absolute paths inside HTML `style` attributes (HTML-encoded as `&quot;`). These need to be relative:

```bash
perl -i -pe 's|url\(&quot;/uploads/|url(\&quot;uploads/|g' *.html
```

---

## Step 3 — Strip Cache-Busting Query Strings

Weebly appends numeric timestamps to asset URLs (e.g. `?1771438535`). These break static file serving because the filesystem sees no match.

**From `<img src>`, `<link href>`, `<script src>` in HTML** — strip timestamps from `uploads/` paths and local file references:

```bash
# Strip ?timestamp from uploads/ image src attributes
perl -i -pe 's|(uploads/[^"'\''> )&]+)\?[0-9]+|$1|g' *.html

# Strip ?timestamp from CSS and JS file references
perl -i -pe '
  s|files/main_style\.css\?[0-9]+|files/main_style.css|g;
  s|files/templateArtifacts\.js\?[0-9]+|files/templateArtifacts.js|g;
' *.html
```

**From `url()` references inside `files/main_style.css`** — preserve `?#iefix` (IE compatibility hack) but strip numeric timestamps:

```bash
perl -i -pe '
  s|\?#iefix\?[0-9]+|?#iefix|g;
  s/\?[0-9]+//g;
' files/main_style.css
```

---

## Step 4 — Fix Font and Image Paths in `main_style.css`

The CSS references `theme/fonts/` and `theme/images/` but the actual files are at `theme/files/fonts/` and `theme/files/images/`:

```bash
perl -i -pe '
  s|theme/fonts/|theme/files/fonts/|g;
  s|theme/images/|theme/files/images/|g;
' files/main_style.css
```

---

## Step 5 — Create a `templateArtifacts.js` Placeholder (then replace it)

The Weebly export does not include `files/templateArtifacts.js`. First create a stub so the page doesn't 404 on load:

```bash
echo '// placeholder' > files/templateArtifacts.js
```

Then download the real file from the live site:

```python
import urllib.request
url = 'https://yoursite.weebly.com/files/templateArtifacts.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=15) as r:
    open('files/templateArtifacts.js', 'wb').write(r.read())
```

---

## Step 6 — Download and Localize CDN Assets

Weebly loads CSS, JS, and fonts from `cdn11.editmysite.com` and `cdn2.editmysite.com`. Download them all into a local `cdn/` directory.

### 6a. Download the files

```python
import urllib.request, os

assets = {
    'cdn/editmysite/css/sites.css':                          'http://cdn11.editmysite.com/css/sites.css',
    'cdn/editmysite/css/old/fancybox.css':                   'http://cdn11.editmysite.com/css/old/fancybox.css',
    'cdn/editmysite/css/social-icons.css':                   'http://cdn11.editmysite.com/css/social-icons.css',
    'cdn/editmysite/css/old/slideshow/slideshow.css':        'http://cdn11.editmysite.com/css/old/slideshow/slideshow.css',
    'cdn/editmysite/fonts/Montserrat/font.css':              'http://cdn2.editmysite.com/fonts/Montserrat/font.css',
    'cdn/editmysite/fonts/Folks_Light/font.css':             'http://cdn2.editmysite.com/fonts/Folks_Light/font.css',
    'cdn/editmysite/fonts/Questrial/font.css':               'http://cdn2.editmysite.com/fonts/Questrial/font.css',
    'cdn/editmysite/js/jquery-1.8.3.min.js':                 'https://cdn11.editmysite.com/js/jquery-1.8.3.min.js',
    'cdn/editmysite/js/lang/en/stl.js':                      'http://cdn2.editmysite.com/js/lang/en/stl.js',
    'cdn/editmysite/js/site/main.js':                        'http://cdn11.editmysite.com/js/site/main.js',
    'cdn/editmysite/js/old/slideshow-jq.js':                 'http://cdn11.editmysite.com/js/old/slideshow-jq.js',
    'cdn/editmysite/js/site/main-customer-accounts-site.js': 'http://cdn11.editmysite.com/js/site/main-customer-accounts-site.js',
    'cdn/mailchimp/embedcode/slim-10_7.css':                 'http://cdn-images.mailchimp.com/embedcode/slim-10_7.css',
}

for dest, url in assets.items():
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as r:
        open(dest, 'wb').write(r.read())
    print(f'OK: {dest}')
```

### 6b. Download font files referenced by the font CSS files

Each `font.css` references font files (`.eot`, `.woff2`, `.woff`, `.ttf`) using relative paths. Download them into the same directories:

```python
font_files = {
    'Montserrat': ['regular.eot', 'regular.woff2', 'regular.woff', 'regular.ttf',
                   'bold.eot', 'bold.woff2', 'bold.woff', 'bold.ttf'],
    'Folks_Light': ['regular.eot', 'regular.ttf'],
    'Questrial':  ['regular.eot', 'regular.woff2', 'regular.woff', 'regular.ttf'],
}

for family, files in font_files.items():
    for f in files:
        dest = f'cdn/editmysite/fonts/{family}/{f}'
        url  = f'http://cdn2.editmysite.com/fonts/{family}/{f}'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as r:
            open(dest, 'wb').write(r.read())
```

### 6c. Update HTML files to use local CDN paths

```bash
perl -i -pe '
  s|https?://cdn11\.editmysite\.com/css/sites\.css[^"'\'']*|cdn/editmysite/css/sites.css|g;
  s|https?://cdn11\.editmysite\.com/css/old/fancybox\.css[^"'\'']*|cdn/editmysite/css/old/fancybox.css|g;
  s|https?://cdn11\.editmysite\.com/css/social-icons\.css[^"'\'']*|cdn/editmysite/css/social-icons.css|g;
  s|https?://cdn11\.editmysite\.com/css/old/slideshow/slideshow\.css[^"'\'']*|cdn/editmysite/css/old/slideshow/slideshow.css|g;
  s|https?://cdn2\.editmysite\.com/fonts/Montserrat/font\.css[^"'\'']*|cdn/editmysite/fonts/Montserrat/font.css|g;
  s|https?://cdn2\.editmysite\.com/fonts/Folks_Light/font\.css[^"'\'']*|cdn/editmysite/fonts/Folks_Light/font.css|g;
  s|https?://cdn2\.editmysite\.com/fonts/Questrial/font\.css[^"'\'']*|cdn/editmysite/fonts/Questrial/font.css|g;
  s|https?://cdn11\.editmysite\.com/js/jquery-1\.8\.3\.min\.js[^"'\'']*|cdn/editmysite/js/jquery-1.8.3.min.js|g;
  s|https?://cdn2\.editmysite\.com/js/lang/en/stl\.js[^"'\'' ]*|cdn/editmysite/js/lang/en/stl.js|g;
  s|https?://cdn11\.editmysite\.com/js/site/main\.js[^"'\'']*|cdn/editmysite/js/site/main.js|g;
  s|https?://cdn11\.editmysite\.com/js/old/slideshow-jq\.js[^"'\'']*|cdn/editmysite/js/old/slideshow-jq.js|g;
  s|https?://cdn11\.editmysite\.com/js/site/main-customer-accounts-site\.js[^"'\'']*|cdn/editmysite/js/site/main-customer-accounts-site.js|g;
  s|https?://cdn-images\.mailchimp\.com/embedcode/slim-10_7\.css[^"'\'']*|cdn/mailchimp/embedcode/slim-10_7.css|g;
' *.html
```

---

## Step 7 — Fix Hardcoded `/uploads/` in Slideshow JS

`slideshow-jq.js` constructs image URLs by prepending `/uploads/` (absolute). Change it to relative:

```bash
perl -i -pe 's|e="/uploads/"|e="uploads/"|g' cdn/editmysite/js/old/slideshow-jq.js
```

---

## Step 8 — Download Missing Uploads from the Live Site

The Weebly export often omits images from `uploads/.../published/`, `uploads/.../editor/`, and `uploads/.../background-images/`. Identify and download them:

```python
import urllib.request, os

SITE = 'https://yoursite.weebly.com'
BASE = '.'  # root of the local site

# Collect all uploads/ paths referenced in HTML, strip query strings
import glob, re

referenced = set()
for html_file in glob.glob('*.html'):
    content = open(html_file).read()
    for match in re.findall(r'uploads/[^"\'> )&]+', content):
        path = re.sub(r'\?.*', '', match)
        referenced.add(path)

missing = [p for p in referenced if not os.path.exists(os.path.join(BASE, p))]

ok, fail = 0, 0
for path in sorted(missing):
    url = f'{SITE}/{path}'
    dest = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as r:
            open(dest, 'wb').write(r.read())
        ok += 1
        print(f'OK: {path}')
    except Exception as e:
        fail += 1
        print(f'FAIL: {path} — {e}')

print(f'\nDownloaded: {ok}  Failed: {fail}')
```

Any files that 404 on the live site are permanently deleted there too — nothing can be done about those.

---

## Summary of What Gets Fixed

| Problem | Fix |
|---|---|
| Theme JS at wrong path (`files/theme/*.js`) | Updated to `files/theme/files/*.js` |
| Background images use absolute `/uploads/` | Changed to relative `uploads/` |
| Cache-busting `?timestamp` on image `src` attrs | Stripped from all HTML files |
| Cache-busting `?timestamp` on CSS/JS refs | Stripped from all HTML files |
| Cache-busting `?timestamp` inside `main_style.css` url() | Stripped, preserving `?#iefix` |
| Font/image paths in CSS point to wrong subdirectory | `theme/fonts/` → `theme/files/fonts/`, `theme/images/` → `theme/files/images/` |
| `templateArtifacts.js` missing from export | Downloaded from live site |
| CDN assets loaded from `editmysite.com` | All downloaded to `cdn/` and references updated |
| Slideshow JS prepends `/uploads/` (absolute) | Patched to `uploads/` (relative) |
| Images in `published/`, `editor/`, `background-images/` missing | Downloaded from live site |
