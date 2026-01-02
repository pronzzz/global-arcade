import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  increment
} from 'firebase/firestore';
import {
  Gamepad2,
  Copy,
  Users,
  Trophy,
  RotateCcw,
  ChevronRight,
  Crown,
  Share2,
  Swords,
  Grid3X3,
  TrendingUp
} from 'lucide-react';

// --- Firebase Configuration & Init ---
const firebaseConfig = {
  apiKey: "AIzaSyDVAgo4XeGExu19OmdCBmtCsXNJyPdPcTs",
  authDomain: "global-arcade-app.firebaseapp.com",
  projectId: "global-arcade-app",
  storageBucket: "global-arcade-app.firebasestorage.app",
  messagingSenderId: "317082805440",
  appId: "1:317082805440:web:c434ce17117586bf06f925",
  measurementId: "G-ZEJ26MBE9G"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "global-arcade-game";

// --- Utility Functions ---
const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// --- Game Logic: Tic Tac Toe ---
const calculateWinner = (squares) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
};

// --- Game Logic: Chess (Simplified Valid Moves) ---
const initialChessBoard = () => {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  const pieces = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let i = 0; i < 8; i++) {
    board[0][i] = { type: pieces[i], color: 'b' }; // Black
    board[1][i] = { type: 'p', color: 'b' };       // Black Pawns
    board[6][i] = { type: 'p', color: 'w' };       // White Pawns
    board[7][i] = { type: pieces[i], color: 'w' }; // White
  }
  return board;
};

const getPieceIcon = (p) => {
  if (!p) return null;
  const map = {
    'k': p.color === 'w' ? '♔' : '♚',
    'q': p.color === 'w' ? '♕' : '♛',
    'r': p.color === 'w' ? '♖' : '♜',
    'b': p.color === 'w' ? '♗' : '♝',
    'n': p.color === 'w' ? '♘' : '♞',
    'p': p.color === 'w' ? '♙' : '♟'
  };
  return map[p.type];
};

const isValidMove = (board, from, to, turnColor) => {
  const piece = board[from.r][from.c];
  const target = board[to.r][to.c];

  if (!piece) return false;
  if (piece.color !== turnColor) return false;
  if (target && target.color === turnColor) return false; // Cannot capture own piece
  if (from.r === to.r && from.c === to.c) return false;

  const dr = to.r - from.r;
  const dc = to.c - from.c;
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);

  // Simplified logic for standard movement
  switch (piece.type) {
    case 'p': // Pawn
      const direction = piece.color === 'w' ? -1 : 1;
      const startRow = piece.color === 'w' ? 6 : 1;
      // Move forward 1
      if (dc === 0 && dr === direction && !target) return true;
      // Move forward 2
      if (dc === 0 && dr === direction * 2 && from.r === startRow && !target && !board[from.r + direction][from.c]) return true;
      // Capture
      if (absDc === 1 && dr === direction && target) return true;
      return false;
    case 'r': // Rook
      if (dr !== 0 && dc !== 0) return false;
      // Check path clear
      const stepR = dr === 0 ? 0 : dr > 0 ? 1 : -1;
      const stepC = dc === 0 ? 0 : dc > 0 ? 1 : -1;
      let curR = from.r + stepR;
      let curC = from.c + stepC;
      while (curR !== to.r || curC !== to.c) {
        if (board[curR][curC]) return false;
        curR += stepR;
        curC += stepC;
      }
      return true;
    case 'n': // Knight
      return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
    case 'b': // Bishop
      if (absDr !== absDc) return false;
      // Check path
      const bStepR = dr > 0 ? 1 : -1;
      const bStepC = dc > 0 ? 1 : -1;
      let bCurR = from.r + bStepR;
      let bCurC = from.c + bStepC;
      while (bCurR !== to.r) {
        if (board[bCurR][bCurC]) return false;
        bCurR += bStepR;
        bCurC += bStepC;
      }
      return true;
    case 'q': // Queen (Rook + Bishop)
      if (dr !== 0 && dc !== 0 && absDr !== absDc) return false;
      // Reuse logic? Just rewrite simple loop check to be safe
      const qStepR = dr === 0 ? 0 : dr > 0 ? 1 : -1;
      const qStepC = dc === 0 ? 0 : dc > 0 ? 1 : -1;
      let qCurR = from.r + qStepR;
      let qCurC = from.c + qStepC;
      while (qCurR !== to.r || qCurC !== to.c) {
        if (board[qCurR][qCurC]) return false;
        qCurR += qStepR;
        qCurC += qStepC;
      }
      return true;
    case 'k': // King
      return absDr <= 1 && absDc <= 1;
    default: return false;
  }
};

// --- Game Logic: Snakes and Ladders ---
const BOARD_SIZE = 100;
const SNAKES = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
const LADDERS = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };

const SnakesBoard = ({ players, currentPlayer }) => {
  const cells = [];
  let isReverse = false;
  for (let i = 100; i >= 1; i -= 10) {
    const row = [];
    for (let j = 0; j < 10; j++) {
      row.push(isReverse ? i - j : i - 9 + j);
    }
    cells.push(...row);
    isReverse = !isReverse;
  }

  return (
    <div className="grid grid-cols-10 gap-0.5 border-4 border-slate-800 bg-slate-800 p-1 rounded-lg shadow-xl w-full max-w-md aspect-square">
      {cells.map(num => {
        const hasSnake = SNAKES[num];
        const hasLadder = LADDERS[num];
        // Determine color based on checkerboard pattern for visibility
        // Grid logic is a bit flipped visually, so simple odd/even works well enough
        const isDark = num % 2 === 0;

        return (
          <div key={num} className={`relative flex items-center justify-center text-[10px] sm:text-xs font-bold rounded-sm
            ${isDark ? 'bg-indigo-100 text-indigo-900' : 'bg-white text-indigo-900'}
            ${hasSnake ? 'bg-red-100 ring-2 ring-inset ring-red-400' : ''}
            ${hasLadder ? 'bg-green-100 ring-2 ring-inset ring-green-400' : ''}
          `}>
            <span className="opacity-40 absolute top-0 left-1">{num}</span>

            {/* Icons for special tiles */}
            {hasSnake && <span className="text-red-500 absolute bottom-0.5 right-0.5 text-[10px]">🐍</span>}
            {hasLadder && <span className="text-green-600 absolute bottom-0.5 right-0.5 text-[10px]">🪜</span>}

            {/* Players */}
            <div className="flex gap-1 z-10">
              {players.host.pos === num && (
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-600 rounded-full border-2 border-white shadow-sm" title="Host" />
              )}
              {players.guest?.pos === num && (
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 rounded-full border-2 border-white shadow-sm" title="Guest" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};


// --- Main Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState(null);
  const [selectedGame, setSelectedGame] = useState('tictactoe');

  // Chess Selection State
  const [chessSelection, setChessSelection] = useState(null); // {r, c}

  // --- Auth & Init ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();

    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  // --- Check URL for Room ID ---
  useEffect(() => {
    if (!user || room) return;
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomIdInput(roomParam);
      // Auto join if param exists
      joinRoom(roomParam);
    }
  }, [user]);

  // --- Room Subscription ---
  useEffect(() => {
    if (!room || !user) return;

    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', room.id);
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setGameState(data);
        // If guest joins, update local room object
        if (!room.players.guest && data.players.guest) {
          setRoom(prev => ({ ...prev, players: data.players }));
        }
      }
    }, (error) => console.error("Snapshot error:", error));

    return () => unsubscribe();
  }, [room, user]);

  // --- Actions ---

  const createRoom = async () => {
    if (!user) return;
    const newRoomId = generateRoomId();
    const initialData = {
      id: newRoomId,
      gameType: selectedGame,
      players: { host: user.uid, guest: null },
      turn: user.uid, // Host starts
      status: 'waiting',
      createdAt: new Date().toISOString(),
      // Game specific init
      board: selectedGame === 'tictactoe' ? Array(9).fill(null)
        : selectedGame === 'chess' ? JSON.stringify(initialChessBoard())
          : { host: { pos: 1 }, guest: { pos: 1 } }, // Snakes positions
      lastMove: null,
      winner: null
    };

    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', newRoomId), initialData);
      setRoom({ id: newRoomId, isHost: true, players: initialData.players });
      setGameState(initialData);
    } catch (e) {
      console.error("Error creating room:", e);
      alert("Failed to create room. Please try again.");
    }
  };

  const joinRoom = async (idToJoin) => {
    if (!user) return;
    const targetId = idToJoin || roomIdInput;
    if (!targetId) return;

    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', targetId);
    try {
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        const data = snap.data();
        if (!data.players.guest && data.players.host !== user.uid) {
          // Join as guest
          await updateDoc(roomRef, {
            'players.guest': user.uid,
            status: 'playing'
          });
          setRoom({ id: targetId, isHost: false, players: { ...data.players, guest: user.uid } });
        } else if (data.players.host === user.uid || data.players.guest === user.uid) {
          // Rejoin
          setRoom({ id: targetId, isHost: data.players.host === user.uid, players: data.players });
        } else {
          alert("Room is full!");
          return;
        }
      } else {
        alert("Room not found!");
      }
    } catch (e) {
      console.error("Error joining:", e);
    }
  };

  const leaveRoom = () => {
    setRoom(null);
    setGameState(null);
    setChessSelection(null);
    window.history.pushState({}, document.title, window.location.pathname);
  };

  const copyInvite = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${room.id}`;
    navigator.clipboard.writeText(url).then(() => {
      // Could show a toast here
    });
    // Fallback for simple ID copy
    navigator.clipboard.writeText(url);
  };

  // --- Game Interactions ---

  const handleTicTacToeClick = async (index) => {
    if (!gameState || gameState.status !== 'playing' || gameState.winner) return;
    if (gameState.turn !== user.uid) return;
    if (gameState.board[index]) return;

    const newBoard = [...gameState.board];
    const symbol = gameState.players.host === user.uid ? 'X' : 'O';
    newBoard[index] = symbol;

    const winner = calculateWinner(newBoard);
    const isDraw = !newBoard.includes(null);

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', room.id), {
      board: newBoard,
      turn: gameState.players.host === user.uid ? gameState.players.guest : gameState.players.host,
      winner: winner ? user.uid : (isDraw ? 'draw' : null),
      status: (winner || isDraw) ? 'finished' : 'playing'
    });
  };

  const handleChessClick = async (r, c) => {
    if (!gameState || gameState.status !== 'playing' || gameState.winner) return;

    // Determine player color
    const isHost = gameState.players.host === user.uid;
    const myColor = isHost ? 'w' : 'b';

    // Check turn
    if (gameState.turn !== user.uid) return;

    const board = JSON.parse(gameState.board);
    const clickedPiece = board[r][c];

    // Select Piece
    if (clickedPiece && clickedPiece.color === myColor) {
      setChessSelection({ r, c });
      return;
    }

    // Move Piece
    if (chessSelection) {
      if (isValidMove(board, chessSelection, { r, c }, myColor)) {
        // Execute Move
        board[r][c] = board[chessSelection.r][chessSelection.c];
        board[chessSelection.r][chessSelection.c] = null;

        // Simple check for King capture (End Game)
        let whiteKing = false, blackKing = false;
        board.forEach(row => row.forEach(p => {
          if (p?.type === 'k' && p.color === 'w') whiteKing = true;
          if (p?.type === 'k' && p.color === 'b') blackKing = true;
        }));

        let winner = null;
        if (!whiteKing) winner = gameState.players.guest; // Black wins
        if (!blackKing) winner = gameState.players.host; // White wins

        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', room.id), {
          board: JSON.stringify(board),
          turn: isHost ? gameState.players.guest : gameState.players.host,
          winner: winner,
          status: winner ? 'finished' : 'playing'
        });
        setChessSelection(null);
      } else {
        // Invalid move, deselect
        setChessSelection(null);
      }
    }
  };

  const rollDice = async () => {
    if (!gameState || gameState.status !== 'playing' || gameState.winner) return;
    if (gameState.turn !== user.uid) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    const isHost = gameState.players.host === user.uid;
    const currentPlayerKey = isHost ? 'host' : 'guest';
    const currentPos = gameState.board[currentPlayerKey].pos;

    let newPos = currentPos + roll;
    if (newPos > 100) newPos = currentPos; // Bounce or stay? Standard rule: must land exactly or stay. Let's stay.

    // Snake or Ladder?
    if (SNAKES[newPos]) newPos = SNAKES[newPos];
    if (LADDERS[newPos]) newPos = LADDERS[newPos];

    let winner = null;
    if (newPos === 100) winner = user.uid;

    const newBoard = { ...gameState.board, [currentPlayerKey]: { pos: newPos, lastRoll: roll } };

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', room.id), {
      board: newBoard,
      turn: isHost ? gameState.players.guest : gameState.players.host,
      winner: winner,
      status: winner ? 'finished' : 'playing'
    });
  };

  const resetGame = async () => {
    if (!gameState) return;
    // Only host can reset usually, but let's allow either for simplicity or just host
    // Let's allow either to request reset (actually just force reset for now)
    const initialBoard = gameState.gameType === 'tictactoe' ? Array(9).fill(null)
      : gameState.gameType === 'chess' ? JSON.stringify(initialChessBoard())
        : { host: { pos: 1 }, guest: { pos: 1 } };

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', room.id), {
      board: initialBoard,
      turn: gameState.players.host,
      winner: null,
      status: 'playing'
    });
    setChessSelection(null);
  };


  // --- Render Helpers ---

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading Arcade...</div>;

  // LOBBY VIEW
  if (!room) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 font-sans selection:bg-purple-500 selection:text-white">
        <div className="max-w-4xl mx-auto pt-10">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Global Arcade
            </h1>
            <p className="text-slate-400 text-lg">Play classic games with anyone, anywhere.</p>
          </header>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Create Room */}
            <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-2xl backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6 text-purple-400">
                <Gamepad2 size={32} />
                <h2 className="text-2xl font-bold text-white">Create Room</h2>
              </div>

              <div className="space-y-4">
                <p className="text-slate-300 mb-4">Select a game to start:</p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedGame('tictactoe')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all
                      ${selectedGame === 'tictactoe' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'}`}
                  >
                    <Grid3X3 size={24} />
                    <span className="text-xs font-bold">Tic-Tac-Toe</span>
                  </button>
                  <button
                    onClick={() => setSelectedGame('chess')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all
                      ${selectedGame === 'chess' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'}`}
                  >
                    <Swords size={24} />
                    <span className="text-xs font-bold">Chess</span>
                  </button>
                  <button
                    onClick={() => setSelectedGame('snakes')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all
                      ${selectedGame === 'snakes' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'}`}
                  >
                    <TrendingUp size={24} />
                    <span className="text-xs font-bold">Snakes</span>
                  </button>
                </div>

                <button
                  onClick={createRoom}
                  className="w-full mt-6 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-purple-50 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                >
                  Start Game <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Join Room */}
            <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-2xl backdrop-blur-sm hover:border-pink-500/50 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6 text-pink-400">
                <Users size={32} />
                <h2 className="text-2xl font-bold text-white">Join Room</h2>
              </div>
              <p className="text-slate-300 mb-6">Enter a room code to join a friend.</p>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter Room Code (e.g. X7Y2Z)"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 tracking-widest text-center text-lg uppercase"
                />
                <button
                  onClick={() => joinRoom()}
                  disabled={!roomIdInput}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Join Game
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // GAME ROOM VIEW
  if (!gameState) return <div className="text-white">Loading game state...</div>;

  const isMyTurn = gameState.turn === user.uid;
  const isHost = room.isHost;
  const opponentJoined = !!gameState.players.guest;
  const gameStatus = gameState.winner ? (gameState.winner === 'draw' ? 'Game Drawn!' : (gameState.winner === user.uid ? 'You Won!' : 'Opponent Won!')) : (isMyTurn ? 'Your Turn' : "Opponent's Turn");

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Navbar */}
      <nav className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center shadow-lg z-20">
        <div className="flex items-center gap-3">
          <button onClick={leaveRoom} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
            <ChevronRight className="rotate-180" size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="font-bold text-lg leading-none capitalize">{gameState.gameType}</h1>
            <span className="text-xs text-slate-400 font-mono tracking-wider">ROOM: {room.id}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!opponentJoined && (
            <button onClick={copyInvite} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg text-sm font-semibold transition-colors animate-pulse">
              <Share2 size={16} /> <span className="hidden sm:inline">Invite Friend</span>
            </button>
          )}
          {gameState.winner && (
            <button onClick={resetGame} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              <RotateCcw size={16} /> Play Again
            </button>
          )}
        </div>
      </nav>

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">

        {/* Status Indicator */}
        <div className="mb-8 text-center z-10">
          {!opponentJoined ? (
            <div className="bg-yellow-500/20 text-yellow-300 px-6 py-3 rounded-full border border-yellow-500/50 backdrop-blur-md flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
              Waiting for opponent...
            </div>
          ) : (
            <div className={`px-8 py-4 rounded-2xl backdrop-blur-md border shadow-xl transition-all duration-500
              ${gameState.winner ? 'bg-slate-800 border-slate-600 scale-110' :
                isMyTurn ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'bg-red-500/10 border-red-500/30 text-slate-400'}
            `}>
              <h2 className="text-2xl font-black uppercase tracking-widest flex items-center gap-3 justify-center">
                {gameState.winner && <Trophy className={gameState.winner === user.uid ? "text-yellow-400" : "text-slate-500"} />}
                {gameStatus}
              </h2>
            </div>
          )}
        </div>

        {/* Game Boards */}
        <div className="relative z-10">

          {/* Tic Tac Toe Board */}
          {gameState.gameType === 'tictactoe' && (
            <div className="grid grid-cols-3 gap-3 bg-slate-800 p-4 rounded-xl shadow-2xl">
              {gameState.board.map((cell, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTicTacToeClick(idx)}
                  disabled={!isMyTurn || cell || !opponentJoined}
                  className={`w-20 h-20 sm:w-24 sm:h-24 bg-slate-700 rounded-lg flex items-center justify-center text-4xl sm:text-5xl font-black transition-all duration-200
                    ${!cell && isMyTurn && !gameState.winner && opponentJoined ? 'hover:bg-slate-600 hover:scale-105 active:scale-95' : ''}
                    ${cell === 'X' ? 'text-blue-400' : 'text-pink-400'}
                  `}
                >
                  {cell}
                </button>
              ))}
            </div>
          )}

          {/* Chess Board */}
          {gameState.gameType === 'chess' && (
            <div className="bg-slate-800 p-1 sm:p-3 rounded-lg shadow-2xl select-none">
              <div className="grid grid-cols-8 border-4 border-slate-600">
                {(() => {
                  const board = JSON.parse(gameState.board);
                  // Render from perspective of player (White at bottom for host, Black at bottom for guest)
                  // If host (white), rows 0-7. If guest (black), rows 7-0.
                  const rows = isHost ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

                  return rows.map((r) => (
                    rows.map((_, cIdx) => { // Use index to reconstruct columns properly if we want flip
                      // Actually, column flip isn't strictly necessary for casual play, usually just row flip.
                      // Let's keep columns L->R a-h for simplicity, but rows flipped.
                      const c = cIdx;
                      const piece = board[r][c];
                      const isSelected = chessSelection?.r === r && chessSelection?.c === c;
                      const isDark = (r + c) % 2 === 1;

                      // Valid move highlight logic (optional/advanced, skip for simplicity or adding simple indicator)
                      let isValidTarget = false;
                      if (chessSelection && isMyTurn) {
                        isValidTarget = isValidMove(board, chessSelection, { r, c }, isHost ? 'w' : 'b');
                      }

                      return (
                        <div
                          key={`${r}-${c}`}
                          onClick={() => handleChessClick(r, c)}
                          className={`w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center text-2xl sm:text-4xl cursor-pointer relative
                             ${isDark ? 'bg-slate-600' : 'bg-slate-400'}
                             ${isSelected ? 'ring-inset ring-4 ring-yellow-400' : ''}
                             ${isValidTarget ? 'after:content-[""] after:w-3 after:h-3 after:bg-green-500/50 after:rounded-full after:absolute' : ''}
                           `}
                        >
                          <span className={`drop-shadow-md ${piece?.color === 'w' ? 'text-white' : 'text-black'}`}>
                            {getPieceIcon(piece)}
                          </span>
                        </div>
                      );
                    })
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Snakes and Ladders Board */}
          {gameState.gameType === 'snakes' && (
            <div className="flex flex-col items-center gap-6">
              <SnakesBoard players={gameState.board} />

              <div className="flex items-center gap-8 w-full justify-between bg-slate-800 p-4 rounded-xl shadow-lg">
                <div className={`flex flex-col items-center ${gameState.turn === gameState.players.host ? 'opacity-100 scale-110' : 'opacity-50'}`}>
                  <div className="w-8 h-8 bg-blue-600 rounded-full border-2 border-white mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">Host</span>
                  <span className="text-xl font-mono">{gameState.board.host.pos}</span>
                </div>

                <button
                  onClick={rollDice}
                  disabled={!isMyTurn || gameState.winner || !opponentJoined}
                  className="px-6 py-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                >
                  {isMyTurn && !gameState.winner ? 'ROLL 🎲' : 'Wait'}
                </button>

                <div className={`flex flex-col items-center ${gameState.turn === gameState.players.guest ? 'opacity-100 scale-110' : 'opacity-50'}`}>
                  <div className="w-8 h-8 bg-orange-500 rounded-full border-2 border-white mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">Guest</span>
                  <span className="text-xl font-mono">{gameState.board.guest?.pos || 1}</span>
                </div>
              </div>
              {gameState.board[isHost ? 'host' : 'guest']?.lastRoll && (
                <div className="text-sm text-slate-400 animate-bounce">
                  Last roll: {gameState.board[gameState.turn === gameState.players.host ? 'guest' : 'host']?.lastRoll}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
