let duckNames = [];
let playerNames = [];
let ducks = [];
let raceIntervals = [];
let troubleInterval;
let lastCheerTime = 0;

const cheers = [
  "Cố lên {name}!",
  "{name} sắp thắng rồi!",
  "Nhanh nữa nào {name}!",
  "Cổ vũ {name} nào lớp ơi!",
];

const randomNames = ["Vịt Sấm", "Vịt Turbo", "Vịt Vàng", "Vịt Bay", "Vịt Lốc", "Vịt Đen", "Vịt Mũi Tên"];
const duckIcons = ["🦆", "🐥", "🐤", "🪿"];

function autoFillNames() {
  const count = parseInt(document.getElementById("duckCount").value);
  for (let i = 0; i < count; i++) {
    const duckInput = document.getElementById(`duckName${i}`);
    const playerInput = document.getElementById(`playerName${i}`);
    if (duckInput && playerInput) {
      duckInput.value = randomNames[Math.floor(Math.random() * randomNames.length)] + ` ${i + 1}`;
      playerInput.value = `Người chơi ${i + 1}`;
    }
  }
}

function createNameInputs() {
  const count = parseInt(document.getElementById("duckCount").value);
  const container = document.getElementById("nameInputs");
  if (!container) return;

  container.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const wrapper = document.createElement("div");
    wrapper.style.marginBottom = "10px";

    const duckInput = document.createElement("input");
    duckInput.type = "text";
    duckInput.placeholder = `Tên vịt ${i + 1}`;
    duckInput.id = `duckName${i}`;

    const playerInput = document.createElement("input");
    playerInput.type = "text";
    playerInput.placeholder = `Người chơi ${i + 1}`;
    playerInput.id = `playerName${i}`;

    wrapper.appendChild(duckInput);
    wrapper.appendChild(playerInput);
    container.appendChild(wrapper);
  }
}

function setupRace() {
  const count = parseInt(document.getElementById("duckCount").value);
  duckNames = [];
  playerNames = [];
  ducks = [];
  raceIntervals.forEach(clearInterval);
  raceIntervals = [];

  const raceArea = document.getElementById("raceArea");
  raceArea.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const duckName = (document.getElementById(`duckName${i}`)?.value || `Vịt ${i + 1}`).trim();
    const playerName = (document.getElementById(`playerName${i}`)?.value || `Người chơi ${i + 1}`).trim();

    duckNames.push(duckName);
    playerNames.push(playerName);

    const track = document.createElement("div");
    track.className = "track";

    const duck = document.createElement("div");
    duck.className = "duck";
    duck.id = `duck${i}`;
    duck.innerText = `${duckIcons[i % duckIcons.length]} ${duckName}`;
    duck.dataset.paused = "false";
    duck.style.left = "0px";

    track.appendChild(duck);
    raceArea.appendChild(track);
    ducks.push(duck);
  }

  document.getElementById("winner").innerText = "";
  document.getElementById("cheer").style.display = "none";
}

function startRace() {
  const startBtn = document.getElementById("startBtn");
  if (startBtn) startBtn.disabled = true;

  const tracks = document.querySelectorAll(".track");
  if (!tracks.length) return;

  const trackWidth = tracks[0].clientWidth;
  let finished = false;

  ducks.forEach((duck, i) => {
    duck.style.left = "0px";
    duck.dataset.paused = "false";

    const interval = setInterval(() => {
      if (duck.dataset.paused === "true") return;

      let currentLeft = parseFloat(duck.style.left) || 0;
      let move = Math.random() * 10;
      duck.style.left = (currentLeft + move) + "px";

      updateProgressTable();
      updateLeaderboard();
      maybeCheer(duckNames[i]);

      if (!finished && currentLeft + move >= trackWidth - 100) {
        finished = true;
        stopAllDucks();
        clearInterval(troubleInterval);

        const winnerName = duckNames[i];
        const playerName = playerNames[i];

        document.getElementById("winner").innerText = `🏆 ${winnerName} (của ${playerName}) thắng cuộc!`;

        Swal.fire({
          title: "🎉 Vịt chiến thắng!",
          text: `Vịt "${winnerName}" của người chơi "${playerName}" đã về đích đầu tiên!`,
          icon: "success",
          confirmButtonText: "👏 Tuyệt vời!",
          backdrop: `
            rgba(0,0,123,0.3)
            url("https://media.giphy.com/media/fxsqOYnIMEefC/giphy.gif")
            center top no-repeat
          `
        });

        if (startBtn) startBtn.disabled = false;
      }
    }, 100);

    raceIntervals.push(interval);
  });

  troubleInterval = setInterval(() => {
    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
    createTroubleDuck(randomTrack);
  }, 5000);
}

function stopAllDucks() {
  raceIntervals.forEach(clearInterval);
  raceIntervals = [];
}

function maybeCheer(name) {
  const now = Date.now();
  if (now - lastCheerTime > 2000 && Math.random() < 0.15) {
    const text = cheers[Math.floor(Math.random() * cheers.length)].replace("{name}", name);
    showCheer(text);
    lastCheerTime = now;
  }
}

function showCheer(message) {
  const cheerEl = document.getElementById("cheer");
  if (!cheerEl) return;

  cheerEl.innerText = `💬 ${message}`;
  cheerEl.style.display = "block";

  setTimeout(() => {
    cheerEl.style.display = "none";
  }, 2000);
}

function updateLeaderboard() {
  const leaderboard = document.getElementById("leaderboard");
  if (!leaderboard) return;

  const positions = ducks.map((duck, index) => ({
    name: duckNames[index],
    player: playerNames[index],
    distance: parseFloat(duck.style.left) || 0
  }));

  positions.sort((a, b) => b.distance - a.distance);

  leaderboard.innerHTML = "";
  positions.forEach((item, idx) => {
    const li = document.createElement("li");
    li.textContent = `${idx + 1}. ${item.name} (của ${item.player})`;
    leaderboard.appendChild(li);
  });
}

function updateProgressTable() {
  const tableBody = document.querySelector("#progressTable tbody");
  const trackWidth = document.querySelector(".track")?.clientWidth || 800;

  if (!tableBody) return;

  let rows = ducks.map((duck, index) => {
    const left = parseFloat(duck.style.left) || 0;
    const percent = Math.min(((left / (trackWidth - 100)) * 100), 100).toFixed(1);
    return `<tr>
              <td>${duckNames[index]}</td>
              <td>${playerNames[index]}</td>
              <td>${percent}%</td>
            </tr>`;
  });

  tableBody.innerHTML = rows.join("");
}

function createTroubleDuck(trackElement) {
  const troubleDuck = document.createElement("div");
  troubleDuck.className = "trouble-duck";
  troubleDuck.innerText = "😈";
  Object.assign(troubleDuck.style, {
    position: "absolute",
    left: "-50px",
    top: "5px",
    fontSize: "28px",
    zIndex: 10
  });

  trackElement.appendChild(troubleDuck);

  let pos = -50;
  const interval = setInterval(() => {
    pos += 5;
    troubleDuck.style.left = pos + "px";

    const duck = trackElement.querySelector(".duck");
    if (duck) {
      const duckLeft = parseFloat(duck.style.left) || 0;
      if (Math.abs(pos - duckLeft) < 30 && duck.dataset.paused !== "true") {
        duck.dataset.paused = "true";
        setTimeout(() => duck.dataset.paused = "false", 2000);
      }
    }

    if (pos > trackElement.offsetWidth + 50) {
      troubleDuck.remove();
      clearInterval(interval);
    }
  }, 50);
}
