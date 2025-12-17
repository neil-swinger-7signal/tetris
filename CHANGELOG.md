# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- Git configuration files (.gitignore, .gitattributes, .editorconfig, .npmrc)
- GitHub workflows for CI/CD (build and deploy)
- Issue and PR templates
- Contributing guidelines
- MIT License
- Changelog
- Deployment documentation for GitHub Pages and other hosting platforms

### Changed
- Moved MUSIC_SETUP.md from public/ to root directory for better documentation organization
- Added base path configuration to vite.config.js for GitHub Pages deployment

### Fixed
- Removed package-lock.json from .gitignore to enable proper CI/CD deployment
- Package lock file is now tracked for reproducible builds in GitHub Actions
- Fixed music file path to use Vite's BASE_URL for GitHub Pages compatibility
- Music now correctly loads at /tetris/tetris-music.mp3 when deployed

## [1.0.0] - 2025-12-17

### Added
- Complete Tetris game implementation with React
- Super Rotation System (SRS) with full wall kick support
- 7-bag randomizer for piece distribution
- Multiple lockdown modes (Infinite, Extended, Classic)
- Hold piece functionality
- Next pieces preview (3 pieces)
- Ghost piece showing landing position
- Complete scoring system with level progression
- Background music with Howler.js
- Retro-futuristic UI with neon glow effects
- Animated Tetris logo
- Help/Instructions modal
- Pause menu
- Responsive design for desktop and mobile
- Full keyboard controls
- Standalone HTML version
- Vite build configuration
- Production-ready build output

### Game Features
- 10×20 playing field with 20-row hidden buffer
- Standard Tetris colors for all 7 tetrominoes
- Soft drop and hard drop mechanics
- Clockwise and counter-clockwise rotation
- Line clearing with animations
- Progressive difficulty scaling

### Documentation
- Comprehensive README with feature list
- Controls documentation
- Scoring system details
- Installation and setup instructions
- Music setup guide

[Unreleased]: https://github.com/yourusername/tetris/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/tetris/releases/tag/v1.0.0

