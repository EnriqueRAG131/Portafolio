(() => {
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const speedEl = document.getElementById('speed');
  const lbEl = document.getElementById('leaderboard');
  const modal = document.getElementById('gameOverModal');
  const finalScoreEl = document.getElementById('finalScore');
  const nameInput = document.getElementById('playerName');
  const form = document.getElementById('saveForm');
  const btnStart = document.getElementById('btnStart');
  const btnPause = document.getElementById('btnPause');
  const btnReset = document.getElementById('btnReset');

  const CELDA = 22;
  const COLS = Math.floor(canvas.width / CELDA);
  const FILAS = Math.floor(canvas.height / CELDA);
  const VELOCIDAD_BASE = 120;
  const PASO_VELOCIDAD = 3;
  const VELOCIDAD_MIN = 50;

  let serpiente, dir, dirPendiente, comida, puntaje, mejor, temporizador, velocidad, jugando;
  let top = JSON.parse(localStorage.getItem("snake_top10") || "[]");

  function iniciar() {
    serpiente = [{ x: Math.floor(COLS / 2), y: Math.floor(FILAS / 2) }];
    dir = { x: 1, y: 0 };
    dirPendiente = null;
    nuevaComida();
    puntaje = 0; actualizarPuntaje();
    mejor = Number(localStorage.getItem('best_snake') || 0); actualizarMejor(mejor);
    velocidad = VELOCIDAD_BASE; actualizarVelocidad();
    jugando = false; dibujar();
  }

  function comenzar() { if (jugando) return; jugando = true; bucle(); }
  function pausar() { jugando = false; if (temporizador) clearTimeout(temporizador); }
  function reiniciar() { pausar(); iniciar(); }

  function bucle() {
    if (!jugando) return;
    temporizador = setTimeout(() => { tick(); bucle(); }, velocidad);
  }

  function tick() {
    if (dirPendiente) { dir = dirPendiente; dirPendiente = null; }
    const cabeza = { x: serpiente[0].x + dir.x, y: serpiente[0].y + dir.y };
    if (cabeza.x < 0 || cabeza.y < 0 || cabeza.x >= COLS || cabeza.y >= FILAS) return finJuego();
    if (serpiente.some((s, i) => i !== 0 && s.x === cabeza.x && s.y === cabeza.y)) return finJuego();
    serpiente.unshift(cabeza);
    if (cabeza.x === comida.x && cabeza.y === comida.y) {
      puntaje += 10; actualizarPuntaje();
      velocidad = Math.max(VELOCIDAD_MIN, velocidad - PASO_VELOCIDAD); actualizarVelocidad();
      nuevaComida();
    } else serpiente.pop();
    dibujar();
  }

  function dibujar() {
    ctx.fillStyle = '#090f20'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0f1a37';
    for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELDA + .5, 0); ctx.lineTo(x * CELDA + .5, canvas.height); ctx.stroke(); }
    for (let y = 0; y <= FILAS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELDA + .5); ctx.lineTo(canvas.width, y * CELDA + .5); ctx.stroke(); }
    dibujarCelda(comida.x, comida.y, '#ef4444');
    serpiente.forEach((p, i) => dibujarCelda(p.x, p.y, i ? '#16a34a' : '#22c55e'));
  }

  function dibujarCelda(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * CELDA + 2, y * CELDA + 2, CELDA - 4, CELDA - 4);
  }

  function nuevaComida() {
    let x, y;
    do { x = Math.floor(Math.random() * COLS); y = Math.floor(Math.random() * FILAS); }
    while (serpiente.some(s => s.x === x && s.y === y));
    comida = { x, y };
  }

  function actualizarPuntaje() { scoreEl.textContent = puntaje; }
  function actualizarMejor(v) { bestEl.textContent = v; }
  function actualizarVelocidad() { speedEl.textContent = (VELOCIDAD_BASE / velocidad).toFixed(2) + 'x'; }

  function intentarDireccion(nx, ny) {
    if (serpiente.length > 1 && (nx === -dir.x && ny === -dir.y)) return;
    dirPendiente = { x: nx, y: ny };
  }

  window.addEventListener('keydown', e => {
    switch (e.key.toLowerCase()) {
      case 'arrowup': case 'w': intentarDireccion(0, -1); break;
      case 'arrowdown': case 's': intentarDireccion(0, 1); break;
      case 'arrowleft': case 'a': intentarDireccion(-1, 0); break;
      case 'arrowright': case 'd': intentarDireccion(1, 0); break;
      case ' ': jugando ? pausar() : comenzar(); break;
    }
  });

  btnStart.addEventListener('click', comenzar);
  btnPause.addEventListener('click', pausar);
  btnReset.addEventListener('click', reiniciar);

  function finJuego() {
    pausar();
    finalScoreEl.textContent = puntaje;
    if (puntaje > mejor) { mejor = puntaje; localStorage.setItem('best_snake', mejor); actualizarMejor(mejor); }
    if (typeof modal.showModal === 'function') { nameInput.value = ''; modal.showModal(); nameInput.focus(); }
    else alert('Perdiste. Puntaje: ' + puntaje);
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const nombre = nameInput.value.trim();
    if (nombre.length < 3 || nombre.length > 12) return;
    top.push({ name: nombre, score: puntaje });
    top.sort((a, b) => b.score - a.score);
    top = top.slice(0, 10);
    localStorage.setItem("snake_top10", JSON.stringify(top));
    renderTop();
    modal.close();
    reiniciar();
  });

  function renderTop() {
    lbEl.innerHTML = '';
    top.forEach(r => {
      const li = document.createElement('li');
      const n = document.createElement('span'); n.textContent = r.name;
      const s = document.createElement('span'); s.textContent = r.score;
      li.append(n, s);
      lbEl.append(li);
    });
  }

  iniciar();
  renderTop();
})();
