import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Howl } from 'howler';

// ============================================================================
// TETRIS GAME - COMPLETE IMPLEMENTATION
// ============================================================================
// A production-ready Tetris game with all standard features:
// - Super Rotation System (SRS)
// - 7-bag randomizer
// - Multiple lockdown modes (Infinite, Extended, Classic)
// - Hold piece functionality
// - Ghost piece preview
// - Next pieces preview
// - Scoring system with levels
// - Full keyboard controls
// ============================================================================

// TETROMINO DEFINITIONS
// Each tetromino is defined by its shape matrix and color
const TETROMINOES = {
  I: {
    shape: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
    color: '#00f0f0' // Cyan
  },
  O: {
    shape: [[1,1], [1,1]],
    color: '#f0f000' // Yellow
  },
  T: {
    shape: [[0,1,0], [1,1,1], [0,0,0]],
    color: '#a000f0' // Purple/Magenta
  },
  S: {
    shape: [[0,1,1], [1,1,0], [0,0,0]],
    color: '#00f000' // Green
  },
  Z: {
    shape: [[1,1,0], [0,1,1], [0,0,0]],
    color: '#f00000' // Red
  },
  J: {
    shape: [[1,0,0], [1,1,1], [0,0,0]],
    color: '#0000f0' // Blue
  },
  L: {
    shape: [[0,0,1], [1,1,1], [0,0,0]],
    color: '#f0a000' // Orange
  }
};

// SRS WALL KICK DATA
// Super Rotation System kick tables for piece rotation
const WALL_KICKS = {
  JLSTZ: {
    '0->1': [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
    '1->0': [[0,0], [1,0], [1,-1], [0,2], [1,2]],
    '1->2': [[0,0], [1,0], [1,-1], [0,2], [1,2]],
    '2->1': [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
    '2->3': [[0,0], [1,0], [1,1], [0,-2], [1,-2]],
    '3->2': [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],
    '3->0': [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],
    '0->3': [[0,0], [1,0], [1,1], [0,-2], [1,-2]]
  },
  I: {
    '0->1': [[0,0], [-2,0], [1,0], [-2,-1], [1,2]],
    '1->0': [[0,0], [2,0], [-1,0], [2,1], [-1,-2]],
    '1->2': [[0,0], [-1,0], [2,0], [-1,2], [2,-1]],
    '2->1': [[0,0], [1,0], [-2,0], [1,-2], [-2,1]],
    '2->3': [[0,0], [2,0], [-1,0], [2,1], [-1,-2]],
    '3->2': [[0,0], [-2,0], [1,0], [-2,-1], [1,2]],
    '3->0': [[0,0], [1,0], [-2,0], [1,-2], [-2,1]],
    '0->3': [[0,0], [-1,0], [2,0], [-1,2], [2,-1]]
  }
};

// GAME CONSTANTS
const COLS = 10;
const ROWS = 20;
const BUFFER_ROWS = 20;
const TOTAL_ROWS = ROWS + BUFFER_ROWS;

// Scoring constants
const SCORE_VALUES = {
  SINGLE: 100,
  DOUBLE: 300,
  TRIPLE: 500,
  TETRIS: 800,
  SOFT_DROP: 1,
  HARD_DROP: 2
};

// Level speed (frames per cell fall)
const LEVEL_SPEEDS = [
  48, 43, 38, 33, 28, 23, 18, 13, 8, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Create empty board
const createEmptyBoard = () => 
  Array(TOTAL_ROWS).fill(null).map(() => Array(COLS).fill(0));

// Generate 7-bag randomizer
const generateBag = () => {
  const pieces = Object.keys(TETROMINOES);
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  return pieces;
};

// Rotate matrix 90 degrees clockwise
const rotateMatrix = (matrix) => {
  const n = matrix.length;
  const rotated = Array(n).fill(null).map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      rotated[j][n - 1 - i] = matrix[i][j];
    }
  }
  return rotated;
};

// Check collision
const checkCollision = (board, piece, position) => {
  for (let row = 0; row < piece.length; row++) {
    for (let col = 0; col < piece[row].length; col++) {
      if (piece[row][col]) {
        const newRow = position.row + row;
        const newCol = position.col + col;
        
        if (newCol < 0 || newCol >= COLS || newRow >= TOTAL_ROWS) {
          return true;
        }
        
        if (newRow >= 0 && board[newRow][newCol]) {
          return true;
        }
      }
    }
  }
  return false;
};

// Get ghost piece position
const getGhostPosition = (board, piece, position) => {
  let ghostRow = position.row;
  while (!checkCollision(board, piece, { ...position, row: ghostRow + 1 })) {
    ghostRow++;
  }
  return ghostRow;
};

// ============================================================================
// MAIN TETRIS COMPONENT
// ============================================================================

export default function TetrisGame() {
  // Game state
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [position, setPosition] = useState({ row: 0, col: 3 });
  const [rotation, setRotation] = useState(0);
  const [nextPieces, setNextPieces] = useState([]);
  const [holdPiece, setHoldPiece] = useState(null);
  const [canHold, setCanHold] = useState(true);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [lockdownMode, setLockdownMode] = useState('extended'); // 'infinite', 'extended', 'classic'
  const [musicPlaying, setMusicPlaying] = useState(false);

  // Refs for game loop
  const frameCount = useRef(0);
  const lockdownTimer = useRef(0);
  const lockdownMoves = useRef(0);
  const bag = useRef([]);
  const gameLoopRef = useRef(null);
  const musicRef = useRef(null);

  // Initialize music
  useEffect(() => {
    if (!musicRef.current) {
      console.log('Initializing music from /tetris-music.mp3');
      musicRef.current = new Howl({
        src: ['/tetris-music.mp3'],
        loop: true,
        volume: 0.3,
        html5: true, // Force HTML5 Audio for better compatibility
        onloaderror: (id, error) => {
          console.error('Music file failed to load:', error);
          console.error('Attempted path: /tetris-music.mp3');
          console.error('Make sure tetris-music.mp3 is in the public folder');
        },
        onload: () => {
          console.log('✅ Music loaded successfully!');
        }
      });
    }
  }, []);

  // Initialize game
  useEffect(() => {
    bag.current = [...generateBag(), ...generateBag()];
    const next = [];
    for (let i = 0; i < 6; i++) {
      next.push(bag.current.shift());
      if (bag.current.length < 7) {
        bag.current.push(...generateBag());
      }
    }
    const firstPiece = next.shift();
    setNextPieces(next);
    spawnNewPiece(firstPiece);
  }, []);

  // Control music playback
  useEffect(() => {
    if (musicRef.current) {
      if (musicPlaying && !gameOver && !paused) {
        musicRef.current.play();
      } else {
        musicRef.current.pause();
      }
    }
  }, [musicPlaying, gameOver, paused]);

  // Cleanup music on unmount
  useEffect(() => {
    return () => {
      if (musicRef.current) {
        musicRef.current.unload();
      }
    };
  }, []);

  // Spawn new piece
  const spawnNewPiece = useCallback((pieceType) => {
    if (!pieceType) return;
    
    const piece = TETROMINOES[pieceType];
    const startRow = pieceType === 'I' ? BUFFER_ROWS - 2 : BUFFER_ROWS - 1;
    const startCol = pieceType === 'O' ? 4 : 3;
    
    setCurrentPiece({ type: pieceType, shape: piece.shape, color: piece.color });
    setPosition({ row: startRow, col: startCol });
    setRotation(0);
    setCanHold(true);
    lockdownTimer.current = 0;
    lockdownMoves.current = 0;
    
    // Check if game over
    if (checkCollision(board, piece.shape, { row: startRow, col: startCol })) {
      setGameOver(true);
    }
  }, [board]);

  // Get next piece from queue
  const getNextPiece = useCallback(() => {
    const next = [...nextPieces];
    const newPiece = next.shift();
    
    next.push(bag.current.shift());
    if (bag.current.length < 7) {
      bag.current.push(...generateBag());
    }
    
    setNextPieces(next);
    return newPiece;
  }, [nextPieces]);

  // Lock piece to board
  const lockPiece = useCallback(() => {
    if (!currentPiece) return;
    
    const newBoard = board.map(row => [...row]);
    
    for (let row = 0; row < currentPiece.shape.length; row++) {
      for (let col = 0; col < currentPiece.shape[row].length; col++) {
        if (currentPiece.shape[row][col]) {
          const boardRow = position.row + row;
          const boardCol = position.col + col;
          if (boardRow >= 0 && boardRow < TOTAL_ROWS) {
            newBoard[boardRow][boardCol] = currentPiece.color;
          }
        }
      }
    }
    
    setBoard(newBoard);

    // Check for completed lines
    const completedLines = [];
    for (let row = 0; row < TOTAL_ROWS; row++) {
      if (newBoard[row].every(cell => cell !== 0)) {
        completedLines.push(row);
      }
    }
    
    if (completedLines.length > 0) {
      // Remove completed lines
      completedLines.forEach(lineRow => {
        newBoard.splice(lineRow, 1);
        newBoard.unshift(Array(COLS).fill(0));
      });
      setBoard(newBoard);

      // Update score
      const lineScores = [0, SCORE_VALUES.SINGLE, SCORE_VALUES.DOUBLE, 
                         SCORE_VALUES.TRIPLE, SCORE_VALUES.TETRIS];
      const points = lineScores[completedLines.length] * level;
      setScore(prev => prev + points);
      setLines(prev => {
        const newLines = prev + completedLines.length;
        setLevel(Math.floor(newLines / 10) + 1);
        return newLines;
      });
    }
    
    // Spawn next piece
    spawnNewPiece(getNextPiece());
  }, [board, currentPiece, position, level, spawnNewPiece, getNextPiece]);

  // Move piece
  const movePiece = useCallback((rowDelta, colDelta) => {
    if (!currentPiece || gameOver || paused) return false;
    
    const newPosition = {
      row: position.row + rowDelta,
      col: position.col + colDelta
    };
    
    if (!checkCollision(board, currentPiece.shape, newPosition)) {
      setPosition(newPosition);
      
      // Handle lockdown logic for horizontal moves
      if (rowDelta === 0) {
        // Check if piece is on the ground (can't move down)
        const isOnGround = checkCollision(board, currentPiece.shape, {
          row: newPosition.row + 1,
          col: newPosition.col
        });
        
        if (isOnGround) {
          lockdownMoves.current++;
          
          // Reset timer based on lockdown mode
          switch (lockdownMode) {
            case 'classic':
              // No reset in classic mode
              break;
            case 'extended':
              if (lockdownMoves.current < 15) {
                lockdownTimer.current = 0;
              }
              break;
            case 'infinite':
              lockdownTimer.current = 0;
              break;
          }
        }
      }
      
      return true;
    }
    
    return false;
  }, [currentPiece, position, board, gameOver, paused, lockdownMode]);

  // Rotate piece with SRS wall kicks
  const rotatePiece = useCallback((clockwise = true) => {
    if (!currentPiece || gameOver || paused) return;
    
    const newRotation = clockwise 
      ? (rotation + 1) % 4 
      : (rotation + 3) % 4;
    
    let rotatedShape = currentPiece.shape;
    const rotations = clockwise 
      ? ((newRotation - rotation + 4) % 4) 
      : ((rotation - newRotation + 4) % 4);
    
    for (let i = 0; i < rotations; i++) {
      rotatedShape = rotateMatrix(rotatedShape);
    }
    
    // Try wall kicks
    const kickTable = currentPiece.type === 'I' ? WALL_KICKS.I : WALL_KICKS.JLSTZ;
    const kickKey = currentPiece.type === 'O' ? null : `${rotation}->${newRotation}`;
    
    if (currentPiece.type === 'O') {
      // O piece doesn't rotate
      return;
    }
    
    const kicks = kickTable[kickKey] || [[0, 0]];
    
    for (const [kickX, kickY] of kicks) {
      const newPosition = {
        row: position.row - kickY,
        col: position.col + kickX
      };
      
      if (!checkCollision(board, rotatedShape, newPosition)) {
        setCurrentPiece({ ...currentPiece, shape: rotatedShape });
        setPosition(newPosition);
        setRotation(newRotation);
        
        // Reset lockdown timer only if piece is on ground
        if (lockdownMode !== 'classic') {
          const isOnGround = checkCollision(board, rotatedShape, {
            row: newPosition.row + 1,
            col: newPosition.col
          });
          
          if (isOnGround) {
            lockdownMoves.current++;
            if (lockdownMode === 'infinite' || 
               (lockdownMode === 'extended' && lockdownMoves.current < 15)) {
              lockdownTimer.current = 0;
            }
          }
        }
        
        return;
      }
    }
  }, [currentPiece, rotation, position, board, gameOver, paused, lockdownMode]);

  // Hard drop
  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || paused) return;

    const ghostRow = getGhostPosition(board, currentPiece.shape, position);
    const dropDistance = ghostRow - position.row;

    // Create a new board with the piece locked in place
    const newBoard = board.map(row => [...row]);
    for (let row = 0; row < currentPiece.shape.length; row++) {
      for (let col = 0; col < currentPiece.shape[row].length; col++) {
        if (currentPiece.shape[row][col]) {
          const boardRow = ghostRow + row;
          const boardCol = position.col + col;
          if (boardRow >= 0 && boardRow < TOTAL_ROWS) {
            newBoard[boardRow][boardCol] = currentPiece.color;
          }
        }
      }
    }

    // Check for completed lines
    const completedLines = [];
    for (let row = 0; row < TOTAL_ROWS; row++) {
      if (newBoard[row].every(cell => cell !== 0)) {
        completedLines.push(row);
      }
    }

    if (completedLines.length > 0) {
      // Remove completed lines
      completedLines.forEach(lineRow => {
        newBoard.splice(lineRow, 1);
        newBoard.unshift(Array(COLS).fill(0));
      });

      // Update score
      const lineScores = [0, SCORE_VALUES.SINGLE, SCORE_VALUES.DOUBLE,
                         SCORE_VALUES.TRIPLE, SCORE_VALUES.TETRIS];
      const points = lineScores[completedLines.length] * level;
      setScore(prev => prev + points + dropDistance * SCORE_VALUES.HARD_DROP);
      setLines(prev => {
        const newLines = prev + completedLines.length;
        setLevel(Math.floor(newLines / 10) + 1);
        return newLines;
      });
    } else {
      setScore(prev => prev + dropDistance * SCORE_VALUES.HARD_DROP);
    }

    setBoard(newBoard);
    spawnNewPiece(getNextPiece());

  }, [currentPiece, position, board, gameOver, paused, getNextPiece, spawnNewPiece, level]);

  // Hold piece
  const holdCurrentPiece = useCallback(() => {
    if (!currentPiece || !canHold || gameOver || paused) return;
    
    const pieceType = currentPiece.type;
    
    if (holdPiece === null) {
      setHoldPiece(pieceType);
      spawnNewPiece(getNextPiece());
    } else {
      setHoldPiece(pieceType);
      spawnNewPiece(holdPiece);
    }
    
    setCanHold(false);
  }, [currentPiece, holdPiece, canHold, gameOver, paused, spawnNewPiece, getNextPiece]);

  // Heuristic evaluation function for board positions
  const evaluatePosition = useCallback((testBoard, testPiece, testPosition) => {
    // Create a simulated board with the piece placed
    const simBoard = testBoard.map(row => [...row]);
    for (let row = 0; row < testPiece.length; row++) {
      for (let col = 0; col < testPiece[row].length; col++) {
        if (testPiece[row][col]) {
          const boardRow = testPosition.row + row;
          const boardCol = testPosition.col + col;
          if (boardRow >= 0 && boardRow < TOTAL_ROWS) {
            simBoard[boardRow][boardCol] = 1;
          }
        }
      }
    }

    let score = 0;

    // Calculate aggregate height
    let aggregateHeight = 0;
    let completeLines = 0;
    let holes = 0;
    let bumpiness = 0;

    const columnHeights = [];

    for (let col = 0; col < COLS; col++) {
      let height = 0;
      let foundBlock = false;
      let holesInColumn = 0;

      for (let row = 0; row < TOTAL_ROWS; row++) {
        if (simBoard[row][col]) {
          if (!foundBlock) {
            height = TOTAL_ROWS - row;
            foundBlock = true;
          }
        } else if (foundBlock) {
          holesInColumn++;
        }
      }

      columnHeights.push(height);
      aggregateHeight += height;
      holes += holesInColumn;
    }

    // Calculate bumpiness (difference between adjacent columns)
    for (let i = 0; i < COLS - 1; i++) {
      bumpiness += Math.abs(columnHeights[i] - columnHeights[i + 1]);
    }

    // Count complete lines
    for (let row = 0; row < TOTAL_ROWS; row++) {
      if (simBoard[row].every(cell => cell !== 0)) {
        completeLines++;
      }
    }

    // Weighted heuristic (tuned for good Tetris play)
    score -= aggregateHeight * 0.51;
    score += completeLines * 0.76;
    score -= holes * 0.36;
    score -= bumpiness * 0.18;

    return score;
  }, []);

  // Find best position for current piece
  const findBestMove = useCallback(() => {
    if (!currentPiece) return null;

    let bestScore = -Infinity;
    let bestMove = null;

    // Try all rotations
    for (let rot = 0; rot < 4; rot++) {
      if (currentPiece.type === 'O' && rot > 0) break; // O piece doesn't rotate

      // Get rotated shape
      let rotatedShape = currentPiece.shape;
      for (let i = 0; i < rot; i++) {
        rotatedShape = rotateMatrix(rotatedShape);
      }

      // Try all columns
      for (let col = -2; col < COLS + 2; col++) {
        // Find drop position for this column
        let testRow = position.row;
        const testPos = { row: testRow, col: col };

        // Skip if initial position is invalid
        if (checkCollision(board, rotatedShape, testPos)) {
          continue;
        }

        // Drop to find landing position
        while (!checkCollision(board, rotatedShape, { row: testRow + 1, col: col })) {
          testRow++;
        }

        const finalPos = { row: testRow, col: col };

        // Evaluate this position
        const score = evaluatePosition(board, rotatedShape, finalPos);

        if (score > bestScore) {
          bestScore = score;
          bestMove = {
            rotation: rot,
            column: col,
            shape: rotatedShape
          };
        }
      }
    }

    return bestMove;
  }, [currentPiece, board, position, evaluatePosition]);

  // Apply hint by moving piece to best position
  const applyHint = useCallback(() => {
    if (!currentPiece || gameOver || paused) return;

    const bestMove = findBestMove();
    if (!bestMove) return;

    // Apply rotations
    let rotatedShape = currentPiece.shape;
    for (let i = 0; i < bestMove.rotation; i++) {
      rotatedShape = rotateMatrix(rotatedShape);
    }

    // Calculate the new rotation state
    const newRotation = (rotation + bestMove.rotation) % 4;

    // Set the piece with the new rotation and position
    setCurrentPiece({ ...currentPiece, shape: rotatedShape });
    setRotation(newRotation);
    setPosition({ row: position.row, col: bestMove.column });

    // Reset lockdown counters
    lockdownTimer.current = 0;
    lockdownMoves.current = 0;
  }, [currentPiece, gameOver, paused, findBestMove, rotation, position]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver || showHelp) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          movePiece(0, -1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePiece(0, 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (movePiece(1, 0)) {
            setScore(prev => prev + SCORE_VALUES.SOFT_DROP);
          }
          break;
        case 'ArrowUp':
        case 'x':
        case 'X':
          e.preventDefault();
          rotatePiece(true);
          break;
        case 'z':
        case 'Z':
          e.preventDefault();
          rotatePiece(false);
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'c':
        case 'C':
        case 'Shift':
          e.preventDefault();
          holdCurrentPiece();
          break;
        case 'p':
        case 'P':
        case 'Escape':
          e.preventDefault();
          setPaused(prev => !prev);
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          applyHint();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePiece, rotatePiece, hardDrop, holdCurrentPiece, applyHint, gameOver, showHelp]);

  // Game loop
  useEffect(() => {
    if (gameOver || paused || !currentPiece) return;
    
    const speed = LEVEL_SPEEDS[Math.min(level - 1, LEVEL_SPEEDS.length - 1)];

    const gameLoop = () => {
      frameCount.current++;

      // Check if piece is on the ground and increment lockdown timer every frame
      const isOnGround = !checkCollision(board, currentPiece.shape, {
        row: position.row + 1,
        col: position.col
      }) === false;

      if (isOnGround) {
        lockdownTimer.current++;

        let shouldLock = false;

        switch (lockdownMode) {
          case 'classic':
            shouldLock = lockdownTimer.current >= 15; // 0.25 seconds (15 frames at 60fps)
            break;
          case 'extended':
            shouldLock = lockdownTimer.current >= 30 || lockdownMoves.current >= 15; // 0.5 seconds or 15 moves
            break;
          case 'infinite':
            shouldLock = lockdownTimer.current >= 90; // 1.5 seconds max even in infinite
            break;
        }

        if (shouldLock) {
          lockPiece();
          return; // Exit early to avoid further processing
        }
      }

      // Move piece down at normal speed
      if (frameCount.current >= speed) {
        frameCount.current = 0;

        if (!movePiece(1, 0)) {
          // Piece can't move down but not locking yet (lockdown timer handles it)
        } else {
          // Piece moved down successfully, reset lockdown
          lockdownTimer.current = 0;
          lockdownMoves.current = 0;
        }
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [currentPiece, level, movePiece, lockPiece, gameOver, paused, lockdownMode, board, position]);

  // Render board with current piece
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    // Add ghost piece
    if (currentPiece && !paused) {
      const ghostRow = getGhostPosition(board, currentPiece.shape, position);
      for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
          if (currentPiece.shape[row][col]) {
            const boardRow = ghostRow + row;
            const boardCol = position.col + col;
            if (boardRow >= 0 && boardRow < TOTAL_ROWS && !displayBoard[boardRow][boardCol]) {
              displayBoard[boardRow][boardCol] = 'ghost';
            }
          }
        }
      }
    }
    
    // Add current piece
    if (currentPiece && !paused) {
      for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
          if (currentPiece.shape[row][col]) {
            const boardRow = position.row + row;
            const boardCol = position.col + col;
            if (boardRow >= 0 && boardRow < TOTAL_ROWS) {
              displayBoard[boardRow][boardCol] = currentPiece.color;
            }
          }
        }
      }
    }
    
    // Only show visible rows
    return displayBoard.slice(BUFFER_ROWS);
  };

  // Render mini piece preview
  const renderMiniPiece = (pieceType) => {
    if (!pieceType) return null;
    const piece = TETROMINOES[pieceType];
    return (
      <div className="mini-piece">
        {piece.shape.map((row, i) => (
          <div key={i} className="mini-row">
            {row.map((cell, j) => (
              <div
                key={j}
                className="mini-cell"
                style={{ backgroundColor: cell ? piece.color : 'transparent' }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="tetris-container">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Courier New', monospace;
          background: linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 100%);
          color: #fff;
          overflow: hidden;
        }
        
        .tetris-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          background: 
            radial-gradient(circle at 20% 50%, rgba(138, 43, 226, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(0, 191, 255, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 100%);
        }
        
        .game-header {
          text-align: center;
          margin-bottom: 30px;
          animation: glow 2s ease-in-out infinite;
        }

        @keyframes glow {
          0%, 100% { text-shadow: 0 0 20px #ff00ff, 0 0 40px #ff00ff, 0 0 60px #ff00ff; }
          50% { text-shadow: 0 0 30px #00ffff, 0 0 60px #00ffff, 0 0 90px #00ffff; }
        }
        
        .tetris-logo {
          font-size: 3.5rem;
          font-weight: bold;
          letter-spacing: 8px;
          background: linear-gradient(45deg, #ff00ff, #00ffff, #ff00ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        
        .help-button {
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid #00ffff;
          color: #00ffff;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.9rem;
          margin-top: 10px;
          transition: all 0.3s;
        }
        
        .help-button:hover {
          background: rgba(0, 255, 255, 0.2);
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        }
        
        .game-content {
          display: flex;
          gap: 30px;
          align-items: flex-start;
        }
        
        .side-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .panel {
          background: rgba(10, 10, 30, 0.8);
          border: 2px solid #ff00ff;
          border-radius: 10px;
          padding: 15px;
          min-width: 150px;
          box-shadow: 0 0 30px rgba(255, 0, 255, 0.3);
        }
        
        .panel h3 {
          color: #00ffff;
          font-size: 1rem;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
          position: relative;
          cursor: help;
        }
        
        .panel h3 .tooltip {
          visibility: hidden;
          opacity: 0;
          position: absolute;
          bottom: 120%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.9);
          color: #fff;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          white-space: nowrap;
          z-index: 1000;
          border: 1px solid #444;
          transition: opacity 0.3s, visibility 0.3s;
        }
        
        .panel h3 .tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: rgba(0, 0, 0, 0.9);
        }
        
        .panel h3:hover .tooltip {
          visibility: visible;
          opacity: 1;
        }
        
        .score-value {
          font-size: 1.5rem;
          color: #ff00ff;
          font-weight: bold;
        }
        
        .next-pieces {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .mini-piece {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 5px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 5px;
        }
        
        .mini-row {
          display: flex;
          gap: 2px;
        }
        
        .mini-cell {
          width: 12px;
          height: 12px;
          border-radius: 2px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .board-container {
          position: relative;
        }
        
        .board {
          display: grid;
          grid-template-columns: repeat(${COLS}, 30px);
          gap: 1px;
          background: rgba(0, 0, 0, 0.5);
          padding: 2px;
          border: 3px solid #00ffff;
          border-radius: 5px;
          box-shadow: 
            0 0 40px rgba(0, 255, 255, 0.5),
            inset 0 0 20px rgba(0, 0, 0, 0.5);
        }
        
        .cell {
          width: 30px;
          height: 30px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
          transition: all 0.1s;
        }
        
        .cell.filled {
          border: 2px solid rgba(255, 255, 255, 0.3);
          box-shadow: 
            inset 0 0 10px rgba(255, 255, 255, 0.3),
            0 0 10px currentColor;
        }
        
        .cell.filled::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          right: 2px;
          bottom: 2px;
          background: linear-gradient(135deg, 
            rgba(255,255,255,0.3) 0%, 
            transparent 50%, 
            rgba(0,0,0,0.3) 100%);
          pointer-events: none;
        }
        
        .cell.ghost {
          background: transparent !important;
          border: 2px dashed rgba(255, 255, 255, 0.3);
          box-shadow: none;
        }
        
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 5px;
          z-index: 10;
        }
        
        .overlay-content {
          text-align: center;
          padding: 30px;
        }
        
        .overlay-content h2 {
          font-size: 2.5rem;
          margin-bottom: 20px;
          color: #ff00ff;
          text-shadow: 0 0 20px #ff00ff;
        }
        
        .overlay-content button {
          background: linear-gradient(45deg, #ff00ff, #00ffff);
          border: none;
          color: #fff;
          padding: 12px 30px;
          font-size: 1.1rem;
          border-radius: 25px;
          cursor: pointer;
          margin: 10px;
          font-weight: bold;
          transition: all 0.3s;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .overlay-content button:hover {
          transform: scale(1.05);
          box-shadow: 0 0 30px rgba(255, 0, 255, 0.8);
        }
        
        .controls-panel {
          max-width: 300px;
          line-height: 1.8;
        }
        
        .controls-panel p {
          color: #ccc;
          font-size: 0.9rem;
          margin: 5px 0;
        }
        
        .controls-panel strong {
          color: #00ffff;
        }
        
        .button-group {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }
        
        .mode-button {
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: #ccc;
          padding: 8px 12px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.3s;
          position: relative;
        }
        
        .mode-button:hover {
          border-color: rgba(255, 255, 255, 0.5);
          color: #fff;
        }
        
        .mode-button.active {
          background: ${lockdownMode === 'infinite' ? 'rgba(0, 255, 0, 0.3)' : lockdownMode === 'extended' ? 'rgba(255, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'};
          border-color: ${lockdownMode === 'infinite' ? '#00ff00' : lockdownMode === 'extended' ? '#ffff00' : '#ff0000'};
          color: #fff;
          box-shadow: 0 0 20px ${lockdownMode === 'infinite' ? '#00ff00' : lockdownMode === 'extended' ? '#ffff00' : '#ff0000'};
        }
        
        .mode-button {
          position: relative;
        }
        
        .mode-button .tooltip {
          visibility: hidden;
          opacity: 0;
          position: absolute;
          bottom: 120%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.9);
          color: #fff;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          white-space: nowrap;
          z-index: 1000;
          border: 1px solid #444;
          transition: opacity 0.3s, visibility 0.3s;
        }
        
        .mode-button .tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: rgba(0, 0, 0, 0.9);
        }
        
        .mode-button:hover .tooltip {
          visibility: visible;
          opacity: 1;
        }
        
        .lockdown-timer {
          margin-top: 10px;
          font-size: 0.8rem;
        }
        
        .timer-label {
          color: #ff6666;
          margin-bottom: 5px;
          text-align: center;
        }
        
        .timer-bar {
          width: 100%;
          height: 8px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid #ff6666;
        }
        
        .timer-fill {
          height: 100%;
          background: linear-gradient(90deg, #ff0000, #ff6666, #ffff00);
          transition: width 0.1s linear;
          border-radius: 3px;
        }
        
        .timer-text {
          text-align: center;
          margin-top: 3px;
          color: #ffff00;
          font-size: 0.7rem;
        }
        
        @media (max-width: 768px) {
          .game-content {
            flex-direction: column;
            align-items: center;
          }
          
          .tetris-logo {
            font-size: 2rem;
            letter-spacing: 4px;
          }
          
          .board {
            grid-template-columns: repeat(${COLS}, 25px);
          }
          
          .cell {
            width: 25px;
            height: 25px;
          }
        }
      `}</style>
      
      <div className="game-header">
        <h1 className="tetris-logo">TETRIS</h1>
        <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
          <button className="help-button" onClick={() => { setShowHelp(true); setPaused(true); }}>
            ❓ How to Play
          </button>
          <button className="help-button" onClick={() => setPaused(!paused)}>
            {paused ? '▶️ Resume' : '⏸️ Pause'}
          </button>
          <button className="help-button" onClick={() => setMusicPlaying(!musicPlaying)}>
            {musicPlaying ? '🔊 Music On' : '🔇 Music Off'}
          </button>
        </div>
      </div>
      
      <div className="game-content">
        <div className="side-panel">
          <div className="panel">
            <h3>Hold
              <span className="tooltip">Press C or Shift to hold piece</span>
            </h3>
            {holdPiece && renderMiniPiece(holdPiece)}
          </div>
          
          <div className="panel">
            <h3>Score</h3>
            <div className="score-value">{score.toLocaleString()}</div>
          </div>
          
          <div className="panel">
            <h3>Lines</h3>
            <div className="score-value">{lines}</div>
          </div>
          
          <div className="panel">
            <h3>Level</h3>
            <div className="score-value">{level}</div>
          </div>
          
          <div className="panel">
            <h3>Lockdown</h3>
            <div className="button-group">
              <button 
                className={`mode-button ${lockdownMode === 'infinite' ? 'active' : ''}`}
                onClick={() => setLockdownMode('infinite')}
              >
                ∞
                <span className="tooltip">Unlimited moves while on ground</span>
              </button>
              <button 
                className={`mode-button ${lockdownMode === 'extended' ? 'active' : ''}`}
                onClick={() => setLockdownMode('extended')}
              >
                EXT
                <span className="tooltip">Up to 15 moves before locking</span>
              </button>
              <button 
                className={`mode-button ${lockdownMode === 'classic' ? 'active' : ''}`}
                onClick={() => setLockdownMode('classic')}
              >
                CLS
                <span className="tooltip">No move resets - locks immediately</span>
              </button>
            </div>
            {lockdownTimer.current > 0 && (
              <div className="lockdown-timer">
                <div className="timer-label">Lock in:</div>
                <div className="timer-bar">
                  <div 
                    className="timer-fill"
                    style={{
                      width: `${Math.max(0, 100 - (lockdownTimer.current / (
                        lockdownMode === 'classic' ? 15 :
                        lockdownMode === 'extended' ? 30 :
                        90
                      )) * 100)}%`
                    }}
                  />
                </div>
                <div className="timer-text">
                  {lockdownMode === 'extended' && `${lockdownMoves.current}/15`}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="board-container">
          <div className="board">
            {renderBoard().map((row, i) => 
              row.map((cell, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`cell ${cell && cell !== 'ghost' ? 'filled' : ''} ${cell === 'ghost' ? 'ghost' : ''}`}
                  style={{
                    backgroundColor: cell && cell !== 'ghost' ? cell : 'rgba(0, 0, 0, 0.3)'
                  }}
                />
              ))
            )}
          </div>
          
          {(paused || gameOver) && (
            <div className="overlay">
              <div className="overlay-content">
                {gameOver ? (
                  <>
                    <h2>GAME OVER</h2>
                    <p style={{fontSize: '1.5rem', margin: '20px 0'}}>
                      Score: {score.toLocaleString()}
                    </p>
                    <button onClick={() => window.location.reload()}>
                      Play Again
                    </button>
                  </>
                ) : (
                  <>
                    <h2>PAUSED</h2>
                    <button onClick={() => setPaused(false)}>Resume</button>
                    <button onClick={() => setShowHelp(true)}>How to Play</button>
                    <button onClick={() => window.location.reload()}>START NEW GAME</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="side-panel">
          <div className="panel">
            <h3>Next</h3>
            <div className="next-pieces">
              {nextPieces.slice(0, 3).map((piece, i) => (
                <div key={i}>{renderMiniPiece(piece)}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {showHelp && (
        <div className="overlay" style={{position: 'fixed', zIndex: 1000}}>
          <div className="overlay-content controls-panel">
            <h2>HOW TO PLAY</h2>
            <p><strong>← →</strong> Move left/right</p>
            <p><strong>↓</strong> Soft drop</p>
            <p><strong>SPACE</strong> Hard drop</p>
            <p><strong>↑ / X</strong> Rotate clockwise</p>
            <p><strong>Z</strong> Rotate counter-clockwise</p>
            <p><strong>C / Shift</strong> Hold piece</p>
            <p><strong>P / ESC</strong> Pause</p>
            <hr style={{margin: '15px 0', border: '1px solid #444'}} />
            <p><strong>Scoring:</strong></p>
            <p>Single: 100 × Level</p>
            <p>Double: 300 × Level</p>
            <p>Triple: 500 × Level</p>
            <p>Tetris: 800 × Level</p>
            <hr style={{margin: '15px 0', border: '1px solid #444'}} />
            <p><strong>Lockdown Modes:</strong></p>
            <p>∞ Infinite: Unlimited moves</p>
            <p>EXT Extended: 15 moves max</p>
            <p>CLS Classic: No move resets</p>
            <button onClick={() => setShowHelp(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
