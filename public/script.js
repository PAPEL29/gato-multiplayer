const socket = io();
let room = "";
let playerSymbol = "";
let myTurn = false;

function joinGame() {
    room = document.getElementById("roomInput").value;
    if (room) socket.emit("joinRoom", room);
}

socket.on("assignSymbol", (symbol) => {
    playerSymbol = symbol;
    myTurn = symbol === "X";
    document.getElementById("status").innerText = `Eres ${playerSymbol}`;
});

socket.on("startGame", (message) => {
    alert(message);
});

socket.on("playerJoined", (players) => {
    document.getElementById("status").innerText = `Jugadores en sala: ${players.length}`;
});

socket.on("roomFull", (message) => alert(message));

function makeMove(index) {
    if (myTurn && document.getElementsByClassName("cell")[index].innerText === "") {
        socket.emit("move", { room, index, symbol: playerSymbol });
    }
}

socket.on("updateBoard", ({ index, symbol, nextTurn }) => {
    document.getElementsByClassName("cell")[index].innerText = symbol;
    myTurn = nextTurn === playerSymbol;
    document.getElementById("status").innerText = `Turno de ${nextTurn}`;
});

socket.on("gameOver", ({ winner }) => {
    alert(winner === "Empate" ? "¡Es un empate!" : `¡Ganó ${winner}!`);
    myTurn = false;
});

socket.on("resetBoard", (message) => {
    document.querySelectorAll(".cell").forEach(cell => cell.innerText = "");
    document.getElementById("status").innerText = message;
});

function restartGame() {
    socket.emit("restartGame", room);
}
