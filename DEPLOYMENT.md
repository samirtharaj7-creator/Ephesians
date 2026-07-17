# Deployment

This project is prepared for GitHub Pages at `https://ephesians.mybibleexplorer.com`.

## One-time setup

1. Create or connect the GitHub repository and push this project to its `main` branch.
2. In the repository settings, choose **GitHub Actions** as the Pages source.
3. Add the DNS record `CNAME ephesians samirtharaj7-creator.github.io` with the DNS provider for `mybibleexplorer.com`.
4. In GitHub Pages settings, confirm the custom domain is `ephesians.mybibleexplorer.com` and enable HTTPS after DNS is active.

## Automatic deployment

Every push to `main` runs type checks, lint, the static production build, and deployment-artifact verification. GitHub Pages publishes only the generated `out/` directory.

The site intentionally targets the custom domain root. Previewing it under a GitHub project subpath such as `/Ephesians/` is not supported because the site uses root-relative URLs.
