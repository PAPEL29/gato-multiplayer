const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

let rooms = {}; // Almacena las salas y los jugadores

io.on("connection", (socket) => {
  console.log(`Jugador conectado: ${socket.id}`);

  // Unirse a una sala
  socket.on("joinRoom", (room) => {
    if (!rooms[room]) rooms[room] = { players: [], board: Array(9).fill(""), turn: "X" };

    if (rooms[room].players.length < 2) {
      rooms[room].players.push(socket.id);
      socket.join(room);
      console.log(`Jugador ${socket.id} se unió a la sala ${room}`);

      // Asignar símbolos
      const playerSymbol = rooms[room].players.length === 1 ? "X" : "O";
      socket.emit("assignSymbol", playerSymbol);

      io.to(room).emit("playerJoined", rooms[room].players);

      // Iniciar juego cuando hay 2 jugadores
      if (rooms[room].players.length === 2) {
        io.to(room).emit("startGame", "El juego ha comenzado. Turno de X");
      }
    } else {
      socket.emit("roomFull", "La sala ya está llena.");
    }
  });

  // Manejar movimientos
  socket.on("move", ({ room, index, symbol }) => {
    if (rooms[room] && rooms[room].board[index] === "" && rooms[room].turn === symbol) {
      rooms[room].board[index] = symbol;
      rooms[room].turn = symbol === "X" ? "O" : "X"; // Cambiar turno
      io.to(room).emit("updateBoard", { index, symbol, nextTurn: rooms[room].turn });

      // Verificar ganador
      checkWinner(room);
    }
  });

  // Reiniciar juego
  socket.on("restartGame", (room) => {
    if (rooms[room]) {
      rooms[room].board = Array(9).fill("");
      rooms[room].turn = "X";
      io.to(room).emit("resetBoard", "El juego ha sido reiniciado. Turno de X.");
    }
  });

  // Verificar desconexión y eliminar sala
  socket.on("disconnect", () => {
    for (const room in rooms) {
      rooms[room].players = rooms[room].players.filter((id) => id !== socket.id);
      if (rooms[room].players.length === 0) delete rooms[room]; // Eliminar sala vacía
    }
  });
});

// Verifica si hay un ganador
function checkWinner(room) {
  const board = rooms[room].board;
  const winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], 
    [0, 3, 6], [1, 4, 7], [2, 5, 8], 
    [0, 4, 8], [2, 4, 6]
  ];

  for (let combo of winningCombos) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      io.to(room).emit("gameOver", { winner: board[a] });
      return;
    }
  }

  if (!board.includes("")) io.to(room).emit("gameOver", { winner: "Empate" });
}

server.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
