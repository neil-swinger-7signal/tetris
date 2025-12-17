# Deployment Guide

## GitHub Pages Deployment

### Prerequisites
- GitHub account
- Repository pushed to GitHub
- GitHub Actions enabled (enabled by default)

### Setup Steps

1. **Configure GitHub Pages**:
   - Go to: `Settings` → `Pages`
   - Under "Build and deployment" → "Source"
   - Select: **GitHub Actions**

2. **Verify Base Path**:
   - Check `vite.config.js` → `base` property
   - Should match your repository name: `base: '/tetris/'`
   - If your repo is named differently, update to: `base: '/your-repo-name/'`

3. **Push to Main Branch**:
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

4. **Monitor Deployment**:
   - Go to: `Actions` tab in your repository
   - Watch the "Deploy to GitHub Pages" workflow
   - Once complete (green checkmark), your site is live!

5. **Access Your Game**:
   - URL: `https://your-username.github.io/tetris/`
   - Replace `your-username` with your GitHub username

### Troubleshooting

#### Assets Not Loading (404 Errors)
**Problem**: CSS, JS, or images return 404 errors.

**Solution**: Verify the `base` path in `vite.config.js` matches your repository name.

```javascript
// If repo is: github.com/username/my-tetris-game
export default defineConfig({
  base: '/my-tetris-game/', // Must match repo name
  // ...
})
```

#### Workflow Fails on Build
**Problem**: GitHub Actions workflow shows red X.

**Solution**: 
1. Click on the failed workflow
2. Check the error message
3. Common fixes:
   - Ensure `package-lock.json` is committed (NOT in .gitignore)
   - Verify all dependencies are in `package.json`
   - Check Node version compatibility (workflow uses Node 20.x)

#### Missing Lock File Error
**Problem**: "Dependencies lock file is not found" error in workflow

**Solution**:
```bash
# Ensure package-lock.json is NOT in .gitignore
# Then commit it:
git add package-lock.json
git commit -m "Add package-lock.json for CI/CD"
git push origin main
```

The workflow uses `npm ci` which requires a lock file for reproducible builds.

#### Music or Assets Not Loading (404 on GitHub Pages)
**Problem**: Music file or other assets return 404 when deployed to GitHub Pages

**Solution**: Use Vite's `import.meta.env.BASE_URL` to resolve paths correctly with the base path.

**How it works:**
```javascript
// Automatically works with base path from vite.config.js
const musicPath = import.meta.env.BASE_URL + 'tetris-music.mp3';
// Local: /tetris-music.mp3
// Deployed: /tetris/tetris-music.mp3
```

If you encounter this:
1. Verify the asset is in the `public/` folder
2. Check the browser console for the attempted path
3. Ensure `vite.config.js` has the correct `base` setting
4. Use `import.meta.env.BASE_URL` prefix for all public assets

#### Pages Not Enabled
**Problem**: No Pages settings or "GitHub Pages is currently disabled"

**Solution**:
1. Make sure repository is public (or you have GitHub Pro/Team)
2. Enable Pages in Settings → Pages
3. Select "GitHub Actions" as source

#### Custom Domain Not Working
**Problem**: Custom domain doesn't resolve

**Solution**:
1. Add DNS records with your domain provider
2. Add `CNAME` file to `public/` folder with your domain
3. Update `base` in `vite.config.js` to `'/'`

### Alternative Hosting Platforms

#### Netlify
```bash
npm run build
# Drag and drop the 'dist' folder to Netlify
```

Settings:
- Build command: `npm run build`
- Publish directory: `dist`
- Base: Update to `'/'` in `vite.config.js`

#### Vercel
```bash
npm install -g vercel
vercel --prod
```

Settings:
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Base: Update to `'/'` in `vite.config.js`

#### Cloudflare Pages
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set build output: `dist`
4. Update base to `'/'` in `vite.config.js`

## Local Testing of Production Build

Before deploying, test the production build locally:

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

This starts a local server at `http://localhost:4173` serving the production build.

## Continuous Deployment

The workflow automatically deploys on every push to `main`. To deploy:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Deployment happens automatically!
```

## Manual Deployment

If you prefer manual deployment:

1. **Disable automatic deployment**:
   - Delete or disable `.github/workflows/deploy.yml`

2. **Build manually**:
   ```bash
   npm run build
   ```

3. **Deploy the `dist/` folder** to your hosting provider

## Environment Variables

For environment-specific configuration:

1. Create `.env` file (not committed):
   ```
   VITE_API_URL=https://api.example.com
   ```

2. Access in code:
   ```javascript
   const apiUrl = import.meta.env.VITE_API_URL
   ```

3. For GitHub Pages, add secrets in:
   `Settings` → `Secrets and variables` → `Actions`

## Notes

- The `dist/` folder is git-ignored and generated on each build
- Music file (`tetris-music.mp3`) is included in the build automatically
- All assets in `public/` are copied to `dist/` during build
- Source maps are excluded in production builds (`.map` files in `.gitignore`)

