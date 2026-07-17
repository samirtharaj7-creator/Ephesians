# Ephesians Commentary

A static My Bible Explorer study of Ephesians with the complete King James text, verse-by-verse commentary, an introduction, and an articles page.

## Local development

Requires Node.js 20.9 or newer.

```bash
npm ci
npm run dev
```

## Production check

```bash
npm run deploy:check
```

The production build is exported to `out/`. Pushes to `main` are deployed to GitHub Pages by the included workflow. See [DEPLOYMENT.md](./DEPLOYMENT.md) for the one-time repository, Pages, and DNS setup.
