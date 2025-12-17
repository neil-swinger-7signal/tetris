# Music Setup Instructions

## Adding Music to Your Tetris Game

The game is configured to play background music using Howler.js. To enable music:

### Option 1: Add Your Own Music File

1. Find a royalty-free Tetris theme or chiptune music file (MP3 format recommended)
2. Name it `tetris-music.mp3`
3. Place it in this `public` folder
4. The music will automatically play when you toggle the music button

### Option 2: Use a Different Music File

If you want to use a different filename or format, edit `src/TetrisGame.jsx`:

```javascript
musicRef.current = new Howl({
  src: ['/your-music-filename.mp3'], // Change this line
  loop: true,
  volume: 0.3,
  onloaderror: () => {
    console.warn('Music file not found.');
  }
});
```

### Recommended Free Music Sources

- **FreePD**: https://freepd.com (Public domain music)
- **Incompetech**: https://incompetech.com/music/royalty-free/
- **OpenGameArt**: https://opengameart.org/
- **YouTube Audio Library**: Free music for content creators

### Adjusting Volume

To change the music volume, modify the `volume` property in the Howl configuration:

```javascript
volume: 0.3, // Range: 0.0 (silent) to 1.0 (full volume)
```

### Music Controls

- Click the 🔊/🔇 button in the game header to toggle music on/off
- Music automatically pauses when the game is paused
- Music stops when game is over

## File Format Support

Howler.js supports multiple audio formats:
- MP3 (recommended for compatibility)
- OGG
- WAV
- WebM
- AAC
- M4A
- FLAC

For best browser compatibility, use MP3.

