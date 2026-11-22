# Happy 18th, Anushka

A small, hand-made birthday corner of the internet — built as a single static page.

## What's inside

```
.
├── index.html            # The page itself (markup + inline SVG icons)
└── assets/
    ├── css/styles.css    # All styling
    ├── js/main.js        # Interactions and small animations
    ├── fonts/            # Self-hosted Fraunces, Manrope, Caveat (woff2)
    └── favicon.svg       # Site icon
```

## Running it locally

No build step and no dependencies — just open `index.html` in a browser.

If you'd rather serve it over HTTP:

```bash
python -m http.server 8000
```

Then visit <http://localhost:8000>.

## Notes

- Fonts are self-hosted and preloaded, so the page works fully offline.
- Everything is plain HTML, CSS and JavaScript.
