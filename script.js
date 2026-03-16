// ============================================
// BeatWave Music Website — script.js
// ============================================

// ============================================
// TERA ORIGINAL CODE — AS IT IS
// ============================================
let song = document.getElementById("song");
let btn = document.getElementById("playPause");

btn.addEventListener("click", function () {
  if (song.paused) {
    song.play().catch(() => {});
    btn.innerText = "Pause";
  } else {
    song.pause();
    btn.innerText = "Play";
  }
});

// ============================================
// WEBSITE VARIABLES
// ============================================
let allSongs = [];
let filteredSongs = [];
let curIdx = -1;
let isShuf = false;
let isRep = false;
let favs = new Set();
let pint = null;
let showFavs = false;

song.volume = 0.8;

// Helper: get element by id
const $ = (id) => document.getElementById(id);

// Helper: format seconds to mm:ss
const fmt = (s) => {
  s = Math.floor(s || 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// ============================================
// STATUS BAR
// ============================================
function setStatus(msg, type = "") {
  const el = $("status-bar");
  el.textContent = msg;
  el.className = type;
}

// ============================================
// UPDATE HERO STATS
// ============================================
function updateStats() {
  const artists = new Set(allSongs.map((s) => s.artistName)).size;
  $("stat-songs").textContent = allSongs.length;
  $("stat-artists").textContent = artists;
  $("stat-favs").textContent = favs.size;
}

// ============================================
// VISUALIZER & COVER RING
// ============================================
function setBars(on) {
  document.querySelectorAll(".vb").forEach((b) => b.classList.toggle("on", on));
}

function setRing(on) {
  $("cover-ring").classList.toggle("on", on);
}

// ============================================
// RENDER MAIN SONG LIST
// ============================================
function renderList() {
  const list = $("song-list");
  const display = showFavs
    ? filteredSongs.filter((_, i) => favs.has(allSongs.indexOf(filteredSongs[i])))
    : filteredSongs;

  if (display.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div>${showFavs ? "💔" : "🎵"}</div>
        ${showFavs ? "No favorites yet. Click ♥ to add songs." : "No songs found."}
      </div>`;
    return;
  }

  $("section-count").textContent = display.length + " songs";

  list.innerHTML = display
    .map((s, fi) => {
      const i = allSongs.indexOf(s);
      const art = s.artworkUrl60 || "";
      const dur = fmt((s.trackTimeMillis || 0) / 1000);
      return `
        <div class="song-row ${i === curIdx ? "active" : ""}" 
             data-i="${i}" 
             onclick="handleRowClick(event, ${i})">
          <div class="song-num">${i === curIdx ? "▶" : fi + 1}</div>
          <div class="song-art">
            ${art ? `<img src="${art}" loading="lazy" onerror="this.parentElement.textContent='🎵'">` : "🎵"}
          </div>
          <div class="song-meta">
            <div class="song-title">${s.trackName}</div>
            <div class="song-artist">${s.artistName}</div>
          </div>
          <span class="song-genre">${s.primaryGenreName || "Music"}</span>
          <span class="song-dur">${dur}</span>
          <button class="fav-btn ${favs.has(i) ? "on" : ""}" data-fi="${i}">♥</button>
        </div>`;
    })
    .join("");
}

// ============================================
// HANDLE SONG ROW CLICK
// ============================================
function handleRowClick(e, i) {
  if (e.target.classList.contains("fav-btn")) {
    toggleFav(+e.target.dataset.fi);
    return;
  }
  playSong(i);
}

// ============================================
// TOGGLE FAVORITE
// ============================================
function toggleFav(i) {
  favs.has(i) ? favs.delete(i) : favs.add(i);
  updateStats();
  renderList();
  renderSidebar();
}

// ============================================
// RENDER SIDEBAR MINI LIST
// ============================================
function renderSidebar() {
  const el = $("sidebar-list");
  el.innerHTML = allSongs
    .map(
      (s, i) => `
      <div class="mini-item ${i === curIdx ? "active" : ""}" 
           data-i="${i}" 
           onclick="playSong(${i})">
        <div class="mini-art">
          ${s.artworkUrl60 ? `<img src="${s.artworkUrl60}" loading="lazy" onerror="this.parentElement.textContent='🎵'">` : "🎵"}
        </div>
        <div class="mini-info">
          <div class="mini-t">${s.trackName}</div>
          <div class="mini-a">${s.artistName}</div>
        </div>
      </div>`
    )
    .join("");
}

// ============================================
// PLAY A SONG
// ============================================
function playSong(i) {
  const s = allSongs[i];
  if (!s || !s.previewUrl) {
    setStatus("No preview available", "err");
    return;
  }

  curIdx = i;
  song.pause();
  song.src = s.previewUrl;
  song.volume = $("vol-slider").value / 100;

  // Update now playing UI
  const art = s.artworkUrl100 || s.artworkUrl60 || "";
  $("cover").innerHTML = art
    ? `<img src="${art}" onerror="this.parentElement.textContent='🎵'">`
    : "🎵";
  $("np-title").textContent = s.trackName;
  $("np-artist").textContent = s.artistName;
  $("np-album").textContent = s.collectionName || "";

  renderList();
  renderSidebar();

  // Scroll active item into view
  const activeEl = document.querySelector(".mini-item.active");
  if (activeEl) activeEl.scrollIntoView({ block: "nearest" });

  setStatus(`Loading: ${s.trackName}`, "loading");

  song.play()
    .then(() => {
      btn.innerText = "Pause"; // tera original code sync
      setRing(true);
      setBars(true);
      setStatus(`▶ ${s.trackName} — ${s.artistName}`, "ok");
      startProg();
    })
    .catch(() => {
      setStatus("Playback error. Try another song.", "err");
    });
}

// ============================================
// PROGRESS BAR LOOP
// ============================================
function startProg() {
  clearInterval(pint);
  pint = setInterval(() => {
    if (!song.duration) return;
    $("prog-fill").style.width =
      ((song.currentTime / song.duration) * 100) + "%";
    $("t-cur").textContent = fmt(song.currentTime);
    $("t-dur").textContent = fmt(song.duration);
  }, 200);
}

// ============================================
// NEXT / PREV SONG
// ============================================
function nextSong() {
  if (!allSongs.length) return;
  const next = isShuf
    ? Math.floor(Math.random() * allSongs.length)
    : (curIdx + 1) % allSongs.length;
  playSong(next);
}

function prevSong() {
  if (!allSongs.length) return;
  if (song.currentTime > 3) {
    song.currentTime = 0;
    return;
  }
  playSong((curIdx - 1 + allSongs.length) % allSongs.length);
}

// ============================================
// AUDIO EVENT LISTENERS
// ============================================
song.addEventListener("pause", () => { setRing(false); setBars(false); });
song.addEventListener("play",  () => { setRing(true);  setBars(true);  });
song.addEventListener("ended", () => {
  if (isRep) {
    song.currentTime = 0;
    song.play();
    return;
  }
  nextSong();
});

// ============================================
// CONTROL BUTTONS
// ============================================
$("prog-bar").addEventListener("click", function (e) {
  if (!song.duration) return;
  const r = this.getBoundingClientRect();
  song.currentTime = ((e.clientX - r.left) / r.width) * song.duration;
});

$("next-btn").addEventListener("click", nextSong);
$("prev-btn").addEventListener("click", prevSong);

$("shuf-btn").addEventListener("click", function () {
  isShuf = !isShuf;
  this.classList.toggle("on", isShuf);
});

$("rep-btn").addEventListener("click", function () {
  isRep = !isRep;
  this.classList.toggle("on", isRep);
});

$("vol-slider").addEventListener("input", function () {
  song.volume = this.value / 100;
  $("vol-label").textContent = this.value;
});

// ============================================
// GENRE TABS
// ============================================
document.querySelectorAll(".genre-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".genre-btn").forEach((b) => b.classList.remove("active"));
    this.classList.add("active");
    $("section-title").textContent = this.textContent.replace(/^[^\w]+/, "").toUpperCase();
    fetchSongs(this.dataset.q);
  });
});

// ============================================
// SEARCH
// ============================================
$("search-btn").addEventListener("click", () => {
  const q = $("search-input").value.trim();
  if (q) {
    $("section-title").textContent = q.toUpperCase();
    fetchSongs(q);
  }
});

$("search-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("search-btn").click();
});

// ============================================
// FAVORITES FILTER
// ============================================
function filterFav(fav, btnEl) {
  showFavs = fav;
  document.querySelectorAll(".nav-links button").forEach((b) => b.classList.remove("active"));
  btnEl.classList.add("active");
  renderList();
}

// ============================================
// THEME TOGGLE (Dark / Light)
// ============================================
$("theme-btn").addEventListener("click", function () {
  document.body.classList.toggle("light");
  this.textContent = document.body.classList.contains("light")
    ? "☽ Dark"
    : "☀ Light";
});

// ============================================
// SKELETON LOADER
// ============================================
function showSkeletons(n = 8) {
  $("song-list").innerHTML = Array(n).fill('<div class="skeleton"></div>').join("");
  $("section-count").textContent = "Loading...";
}

// ============================================
// FETCH SONGS FROM ITUNES API
// ============================================
async function fetchSongs(query = "top hits 2024") {
  showSkeletons();
  setStatus("Fetching from iTunes API...", "loading");

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=30&country=in`;
    const res = await fetch(url);
    const data = await res.json();

    allSongs = (data.results || []).filter((s) => s.previewUrl);

    if (allSongs.length === 0) {
      setStatus("No songs found", "err");
      $("song-list").innerHTML =
        '<div class="empty-state"><div>🔍</div>No results. Try another search.</div>';
      return;
    }

    filteredSongs = [...allSongs];
    renderList();
    renderSidebar();
    updateStats();
    setStatus(`${allSongs.length} songs loaded ✓`, "ok");

  } catch (e) {
    setStatus("Network error. Check connection.", "err");
    $("song-list").innerHTML =
      '<div class="empty-state"><div>📡</div>Could not load songs. Check your internet.</div>';
  }
}

// ============================================
// INIT — Load songs on page open
// ============================================
fetchSongs("top hits 2024");
