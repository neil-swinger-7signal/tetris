# Pre-Deployment Checklist

Use this checklist before deploying to GitHub Pages:

## ✅ Configuration Check

- [ ] **Repository Name Match**
  - Open `vite.config.js`
  - Verify `base: '/tetris/'` matches your GitHub repo name
  - If repo is named differently, update this value

- [ ] **Build Test**
  ```bash
  npm run build
  ```
  - Should complete without errors
  - Should create `dist/` folder with assets

- [ ] **Preview Test**
  ```bash
  npm run preview
  ```
  - Visit `http://localhost:4173/tetris/`
  - Test game functionality
  - Verify music loads (if configured)
  - Check all controls work

## ✅ GitHub Repository Setup

- [ ] **Create GitHub Repository**
  - Repository name: `tetris` (or update vite.config.js to match)
  - Public repository (or GitHub Pro for private)
  - Don't initialize with README (you already have one)

- [ ] **Initial Commit**
  ```bash
  git add .
  git commit -m "Initial commit with deployment setup"
  git branch -M main
  git remote add origin https://github.com/YOUR_USERNAME/tetris.git
  git push -u origin main
  ```

## ✅ GitHub Pages Setup

- [ ] **Enable GitHub Pages**
  1. Go to repository Settings
  2. Navigate to Pages (left sidebar)
  3. Under "Build and deployment" → "Source"
  4. Select: **GitHub Actions**
  5. Save

- [ ] **Wait for Deployment**
  1. Go to Actions tab
  2. Watch "Deploy to GitHub Pages" workflow
  3. Wait for green checkmark (usually 1-2 minutes)

- [ ] **Verify Deployment**
  - Visit: `https://YOUR_USERNAME.github.io/tetris/`
  - Test game loads correctly
  - Verify all assets load (no 404 errors in console)
  - Test gameplay

## ✅ Common Issues

### Issue: Assets return 404 errors
**Fix**: Update `base` in `vite.config.js` to match repository name exactly

### Issue: Workflow fails
**Fix**: Check Actions tab for error message
- Ensure `package.json` has all dependencies
- Verify `package-lock.json` is committed
- Check Node version compatibility

### Issue: Pages deployment not available
**Fix**: 
- Ensure repository is public (or you have GitHub Pro/Team)
- Enable Pages in Settings → Pages
- Select "GitHub Actions" as source

### Issue: Game loads but doesn't work
**Fix**:
- Check browser console for errors
- Verify base path in vite.config.js
- Test locally with `npm run preview`

## ✅ After Deployment

- [ ] **Test the Live Site**
  - Open `https://YOUR_USERNAME.github.io/tetris/`
  - Play a game
  - Test all controls
  - Verify music works (if configured)

- [ ] **Update README**
  - Add live demo link
  - Add screenshots if desired
  - Update any repository-specific URLs

- [ ] **Share Your Game**
  - Add topics/tags to GitHub repo
  - Share on social media
  - Submit to game directories

## 🎉 Deployment Complete!

Once all items are checked, your Tetris game is live and ready to play!

### Continuous Deployment

From now on, every push to `main` will automatically deploy:

```bash
git add .
git commit -m "Update game"
git push origin main
# Automatic deployment happens!
```

### Need Help?

- Check `DEPLOYMENT.md` for detailed instructions
- Check `SETUP_COMPLETE.md` for configuration summary
- Open an issue on GitHub for support

