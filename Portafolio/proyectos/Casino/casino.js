// ==========================================
// 1. CONFIGURACIÓN Y VARIABLES GLOBALES
// ==========================================
let CASINO_STATE = {
    coins: 1000,
    currentPlayerName: "Jugador Invitado",
    currentGame: null,
    currentTableId: null,
};

const GAMES = {
    MEMORAMA: { title: "Memorama", minPlayers: 1, maxPlayers: 2, tablePrefix: "M" },
    TEXAS_HOLDEM: { title: "Texas Hold'em", minPlayers: 2, maxPlayers: 10, tablePrefix: "T" },
    OMAHA: { title: "Omaha", minPlayers: 2, maxPlayers: 10, tablePrefix: "O" },
    MINIGAME: { title: "Bloque de Monedas", minPlayers: 1, maxPlayers: 1, tablePrefix: "B" }
};

// **NUEVAS VARIABLES GLOBALES PARA EL PÓKER**
let pokerDeck = []; // Baraja de 52 cartas
const SUIT_SYMBOL_MAP = {'C': '♣️', 'D': '♦️', 'H': '♥️', 'S': '♠️'};
const RANKS = { 14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: '10', 9: '9', 8: '8', 7: '7', 6: '6', 5: '5', 4: '4', 3: '3', 2: '2' };


const $ = selector => document.querySelector(selector);
const $lobbyScreen = $('#lobby-screen');
const $tableSelectionScreen = $('#table-selection-screen');
const $gameScreen = $('#game-screen');
const $coinDisplay = $('#player-coins');
const $luigiSprite = $('#luigi-sprite'); 
const $luigiMovingSprite = $('#luigi-moving-sprite'); 
const $tableList = $('#table-list');
const $currentGameTitle = $('#current-game-title');
const $currentTableInfo = $('#current-table-info');
const $gameInterface = $('#game-interface');


// ==========================================
// 2. PERSISTENCIA Y UI
// ==========================================

/** Carga el estado del jugador desde localStorage. */
function loadState() {
    const savedState = localStorage.getItem('luigiCasinoState');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        CASINO_STATE = { ...CASINO_STATE, ...parsedState };
        CASINO_STATE.coins = Math.max(0, CASINO_STATE.coins);
    }
}

/** Guarda el estado del jugador en localStorage. */
function saveState() {
    localStorage.setItem('luigiCasinoState', JSON.stringify(CASINO_STATE));
}

/** Actualiza la cantidad de monedas en la UI y guarda el estado. */
function updateCoinDisplay() {
    $coinDisplay.textContent = CASINO_STATE.coins;
    saveState(); 
}

/** Cambia la pantalla visible y oculta las demás. */
function changeScreen(targetScreen) {
    [$lobbyScreen, $tableSelectionScreen, $gameScreen].forEach(screen => {
        screen.classList.remove('active-screen');
        screen.classList.add('hidden-screen');
    });

    targetScreen.classList.remove('hidden-screen');
    targetScreen.classList.add('active-screen');
}

// ==========================================
// 3. LÓGICA DE ANIMACIÓN DE LUIGI
// ==========================================

/** Controla las animaciones de Luigi. */
function animateLuigi(action) {
    $luigiSprite.className = '';
    $luigiMovingSprite.className = '';

    switch (action) {
        case 'walk':
            $luigiMovingSprite.classList.add('sprite-walk');
            $luigiSprite.classList.add('sprite-idle');
            
            setTimeout(() => {
                changeScreen($tableSelectionScreen); 
                $luigiMovingSprite.classList.remove('sprite-walk'); 
            }, 1500); 
            break;
        case 'deal':
            $luigiSprite.classList.add('sprite-deal');
            setTimeout(() => $luigiSprite.classList.remove('sprite-deal'), 2000);
            break;
        case 'win':
            $luigiSprite.classList.add('sprite-win');
            setTimeout(() => $luigiSprite.classList.remove('sprite-win'), 3000);
            break;
        case 'lose':
            $luigiSprite.classList.add('sprite-lose');
            setTimeout(() => $luigiSprite.classList.remove('sprite-lose'), 3000);
            break;
        case 'hit':
             $luigiSprite.classList.add('sprite-hit');
             setTimeout(() => $luigiSprite.classList.remove('sprite-hit'), 500);
             break;
        default: 
            $luigiSprite.classList.add('sprite-idle');
            break;
    }
}

/** Genera la lista de mesas simuladas para el juego seleccionado. */
function generateTableList(gameKey) {
    $tableList.innerHTML = ''; 
    $currentGameTitle.textContent = GAMES[gameKey].title;
    
    for (let i = 1; i <= 5; i++) {
        const gameData = GAMES[gameKey];
        let players;
        
        // Para el minijuego, NUNCA llenar las mesas (siempre disponible)
        if (gameKey === 'MINIGAME') {
            players = 0; // Mostrar como vacía
        } else {
            // Para otros juegos: dejar algunos espacios libres
            players = Math.floor(Math.random() * (gameData.maxPlayers - 1)) + gameData.minPlayers;
        }
        
        const tableDiv = document.createElement('div');
        tableDiv.classList.add('game-table');
        tableDiv.dataset.tableId = `${gameData.tablePrefix}-${i}`;
        tableDiv.innerHTML = `
            Mesa #${i} - ${players}/${gameData.maxPlayers} Jugadores
            <span class="table-status">${players === gameData.maxPlayers ? 'LLENA' : 'DISPONIBLE'}</span>
        `;
        $tableList.appendChild(tableDiv);
    }
}

// ==========================================
// 4. MANEJO DE EVENTOS DEL LOBBY Y NAVEGACIÓN
// ==========================================

// Listener para la selección de juego (Lobby)
$('#game-selection').addEventListener('click', (event) => {
    const card = event.target.closest('.game-card');
    if (!card) return;

    const gameKey = card.dataset.game.toUpperCase().replace('-', '_');
    CASINO_STATE.currentGame = gameKey;

    animateLuigi('walk'); 
    generateTableList(gameKey);
});

// Listener para la selección de mesa
$tableList.addEventListener('click', (event) => {
    const table = event.target.closest('.game-table');
    if (!table) return;

    const isFull = table.querySelector('.table-status').textContent === 'LLENA';
    const isMinigame = CASINO_STATE.currentGame === 'MINIGAME';

    if (isFull && !isMinigame) {
        alert("¡Esa mesa está llena! Elige otra.");
        return; 
    }
    
    CASINO_STATE.currentTableId = table.dataset.tableId;
    
    changeScreen($gameScreen);
    $currentTableInfo.textContent = `Jugando ${GAMES[CASINO_STATE.currentGame].title} en Mesa #${CASINO_STATE.currentTableId}`;
    
    initializeGame(CASINO_STATE.currentGame);
});


// Listeners de navegación para Volver y Salir
$('#back-to-lobby-btn').addEventListener('click', () => {
    changeScreen($lobbyScreen);
    CASINO_STATE.currentGame = null;
    animateLuigi('idle');
});

$('#exit-game-btn').addEventListener('click', () => {
    $gameInterface.innerHTML = '';
    changeScreen($lobbyScreen);
    CASINO_STATE.currentGame = null;
    CASINO_STATE.currentTableId = null;
    animateLuigi('idle');
});

// ==========================================
// 5. INICIALIZACIÓN DE JUEGOS ESPECÍFICOS
// ==========================================

/** Prepara la interfaz y la lógica para el juego seleccionado. */
function initializeGame(gameKey) {
    $gameInterface.innerHTML = ''; 
    animateLuigi('idle'); 

    switch (gameKey) {
        case 'MEMORAMA':
            initMemorama(); 
            break;
        case 'TEXAS_HOLDEM':
        case 'OMAHA':
            initPokerGame(gameKey); 
            break;
        case 'MINIGAME':
            initCoinBlockMinigame(); 
            break;
    }
}

// ==========================================
// 6. LÓGICA DEL MINIJUEGO (BLOQUE DE MONEDAS)
// ==========================================

function initCoinBlockMinigame() {
    $gameInterface.innerHTML = `
        <div class="minigame-wrapper">
            <h3>¡Golpea el Bloque!</h3>
            <div id="coin-block" style="width: 120px; height: 120px; background: linear-gradient(135deg, #ffeb3b 0%, #fbbf24 100%); border: 4px solid #ffc107; border-radius: 8px; font-size: 3.5em; font-weight: 900; color: #78350f; cursor: pointer; display: flex; justify-content: center; align-items: center; margin: 25px 0; box-shadow: 0 4px 16px rgba(0,0,0,0.10); text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);">?</div>
            <p id="minigame-message" style="color: white; font-size: 1.1em; margin-top: 20px; font-weight: 500;">Presiona el bloque (5 golpes restantes).</p>
        </div>
    `;
    
    const $coinBlock = $('#coin-block');
    let hitsRemaining = 5; 

    $coinBlock.addEventListener('click', () => {
        if (hitsRemaining <= 0) {
            $('#minigame-message').textContent = "Bloque agotado. ¡Vuelve a la mesa principal!";
            return;
        }

        const earnedCoins = Math.floor(Math.random() * 10) + 1; 
        CASINO_STATE.coins += earnedCoins;
        hitsRemaining--;

        $coinBlock.style.transform = 'scale(0.92)';
        setTimeout(() => {
            $coinBlock.style.transform = 'scale(1)';
            if (hitsRemaining === 0) {
                $coinBlock.textContent = 'X';
                $coinBlock.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                $coinBlock.style.borderColor = '#991b1b';
            }
        }, 300);

        animateLuigi('hit'); 
        if (earnedCoins > 8) animateLuigi('win');

        updateCoinDisplay();
        $('#minigame-message').textContent = `¡Has ganado ${earnedCoins} monedas! ${hitsRemaining > 0 ? `Quedan ${hitsRemaining} golpes.` : 'Bloque roto!'}`;
    });
}


// ==========================================
// 7. LÓGICA DEL MEMORAMA (PUNTUACIÓN Y REINICIO)
// ==========================================

const MEMORAMA_ASSETS = [
    { name: 'coin', image: 'c:\\Users\\ENRIQUE\\Desktop\\Casino\\coin.png' },
    { name: 'flower', image: 'c:\\Users\\ENRIQUE\\Desktop\\Casino\\flower.png' },
    { name: 'goomba', image: 'c:\\Users\\ENRIQUE\\Desktop\\Casino\\goomba.png' },
    { name: 'star', image: 'c:\\Users\\ENRIQUE\\Desktop\\Casino\\star.png' },
    { name: 'yoshi', image: 'c:\\Users\\ENRIQUE\\Desktop\\Casino\\yooshi.png' },
    { name: 'boo', image: 'c:\\Users\\ENRIQUE\\Desktop\\Casino\\boo.png' },
    { name: 'mushroom', image: 'c:\\Users\\ENRIQUE\\Desktop\\Casino\\mushroom.png' },
    { name: 'shell', image: 'c:\\Users\\ENRIQUE\\Desktop\\Casino\\shell.png' }
];
let memoramaBoard = [];
let cardsFlipped = [];
let cardsMatched = 0;
let lockBoard = false; 
let memoramaTurns = 0; 

/** Inicializa el tablero del Memorama. */
function initMemorama(players = 1) {
    const totalPairs = MEMORAMA_ASSETS.length;
    const assetsForGame = MEMORAMA_ASSETS.slice(0, totalPairs);
    
    memoramaBoard = [...assetsForGame, ...assetsForGame]
        .map((asset, index) => ({ id: index, asset: asset.name, image: asset.image, flipped: false, matched: false }));
    
    shuffleArray(memoramaBoard);

    const $board = document.createElement('div');
    $board.id = 'memorama-board';
    $board.classList.add('memorama-grid'); 

    memoramaBoard.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('memorama-card', 'face-down');
        cardElement.dataset.asset = card.asset;
        cardElement.dataset.id = card.id;
        
        cardElement.innerHTML = `<div class="card-face back">?</div><div class="card-face front"><img src="${card.image}" alt="${card.asset}" style="width: 70px; height: 70px; object-fit: contain;"></div>`;
        
        cardElement.addEventListener('click', () => flipCard(cardElement, card));
        $board.appendChild(cardElement);
    });
    
    $gameInterface.innerHTML = `
        <h2>¡Preparando el Memorama!</h2>
        <p id="memorama-status">Turnos: 0 | Pares encontrados: 0/${totalPairs}</p>
        <div id="memorama-board"></div>
        <button id="reset-memorama-btn">Reiniciar Juego</button>
    `;
    
    $('#memorama-board').replaceWith($board);
    $('#reset-memorama-btn').addEventListener('click', () => initMemorama(players));
    
    cardsFlipped = [];
    cardsMatched = 0;
    lockBoard = false;
    memoramaTurns = 0; 
    
    animateLuigi('deal');
}

/** Lógica al hacer clic en una carta. */
function flipCard(element, cardObject) {
    if (lockBoard || cardObject.matched || cardObject.flipped) return;

    element.classList.remove('face-down');
    element.classList.add('face-up');
    cardObject.flipped = true;
    cardsFlipped.push(element);

    if (cardsFlipped.length === 2) {
        memoramaTurns++; 
        document.getElementById('memorama-status').textContent = `Turnos: ${memoramaTurns} | Pares encontrados: ${cardsMatched}/8`;

        lockBoard = true;
        checkForMatch();
    }
}

/** Comprueba si las dos cartas volteadas son un par. */
function checkForMatch() {
    const [card1Element, card2Element] = cardsFlipped;
    const isMatch = card1Element.dataset.asset === card2Element.dataset.asset;

    if (isMatch) {
        handleMatch(card1Element, card2Element);
    } else {
        handleNoMatch(card1Element, card2Element);
    }
}

function handleMatch(card1Element, card2Element) {
    cardsMatched++;
    const totalPairs = MEMORAMA_ASSETS.length;
    document.getElementById('memorama-status').textContent = `Turnos: ${memoramaTurns} | Pares encontrados: ${cardsMatched}/${totalPairs}`;
    
    card1Element.classList.add('matched', 'face-up');
    card2Element.classList.add('matched', 'face-up');

    animateLuigi('win'); 

    if (cardsMatched === totalPairs) {
        let reward = 100 - (memoramaTurns * 2); 
        reward = Math.max(20, reward); 
        
        CASINO_STATE.coins += reward; 
        updateCoinDisplay();
        
        setTimeout(() => alert(`¡Ganaste el Memorama en ${memoramaTurns} turnos! Has ganado ${reward} monedas.`), 500);
    }

    resetTurn();
}

function handleNoMatch(card1Element, card2Element) {
    animateLuigi('lose'); 
    
    const card1Obj = memoramaBoard.find(c => c.id == card1Element.dataset.id);
    const card2Obj = memoramaBoard.find(c => c.id == card2Element.dataset.id);
    
    setTimeout(() => {
        card1Element.classList.remove('face-up');
        card1Element.classList.add('face-down');
        card2Element.classList.remove('face-up');
        card2Element.classList.add('face-down');
        
        if (card1Obj) card1Obj.flipped = false;
        if (card2Obj) card2Obj.flipped = false;

        resetTurn();
    }, 1000);
}

function resetTurn() {
    cardsFlipped = [];
    lockBoard = false;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


// ==========================================
// 8. LÓGICA DEL PÓKER (CON BARJA ÚNICA CORREGIDA)
// ==========================================

/** * Crea un array de 52 cartas únicas (el mazo).
 */
function createUniqueDeck() {
    const deck = [];
    const suits = ['C', 'D', 'H', 'S']; // Clubs, Diamonds, Hearts, Spades
    const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]; // 11=J, 12=Q, 13=K, 14=A

    for (const suit of suits) {
        for (const rank of ranks) {
            const rankName = RANKS[rank];
            deck.push({
                symbol: `${rankName}-${suit}`,
                rank: rank,
                suit: suit
            });
        }
    }
    shuffleArray(deck); // Barajar inmediatamente después de crear
    return deck;
}

/** Obtiene la siguiente carta del mazo (elimina el duplicado). */
function dealCard() {
    // Si la baraja está vacía, la reseteamos (esto solo debería pasar en manos muy largas)
    if (pokerDeck.length === 0) {
        pokerDeck = createUniqueDeck();
    }
    // Retorna y elimina la última carta del array
    return pokerDeck.pop();
}


/** Simula el inicio de un juego de póker (Texas u Omaha). */
function initPokerGame(gameType) {
    // Creamos/reseteamos la baraja global para la nueva partida
    pokerDeck = createUniqueDeck(); 

    const pokerTemplate = `
        <h2>Mesa de ${GAMES[gameType].title} Lista.</h2>
        <div id="poker-table">
            <div id="dealer-area">
                <p>Luigi (Crupier)</p>
            </div>
            <div id="community-cards" class="card-area"></div>
            <div id="player-hand" class="card-area"></div>
            <div id="hand-evaluation-display"></div>
        </div>
        <div id="poker-controls">
            <p id="poker-status">¡Simulación! Apuestas iniciales: 50 monedas.</p>
            <button id="deal-hand-btn">Repartir Primera Mano</button>
            <button id="simulate-flop-btn" disabled>Flop (Simular)</button>
            <button id="simulate-turn-btn" disabled>Turn (Simular)</button>
            <button id="simulate-river-btn" disabled>River (Simular)</button>
        </div>
    `;
    
    function resetPokerInterface() {
        $gameInterface.innerHTML = pokerTemplate;
        
        CASINO_STATE.coins -= 50; 
        updateCoinDisplay();

        $('#deal-hand-btn').addEventListener('click', () => simulateDeal(gameType));
        $('#simulate-flop-btn').addEventListener('click', () => simulateBettingRound(3, 'Flop'));
        $('#simulate-turn-btn').addEventListener('click', () => simulateBettingRound(1, 'Turn'));
        $('#simulate-river-btn').addEventListener('click', () => simulateBettingRound(1, 'River'));

        $('#simulate-flop-btn').disabled = true;
        $('#simulate-turn-btn').disabled = true;
        $('#simulate-river-btn').disabled = true;
        
        // Resetear la baraja para la nueva mano
        pokerDeck = createUniqueDeck();
    }
    
    resetPokerInterface(); 
}

/** Simula el reparto de cartas y actualiza la UI. */
function simulateDeal(gameType) {
    const cardsPerPlayer = gameType === 'TEXAS_HOLDEM' ? 2 : 4;
    
    // Usamos dealCard() para asegurar cartas ÚNICAS
    const handObjects = Array.from({ length: cardsPerPlayer }, () => dealCard());
    
    const highestRank = handObjects.reduce((max, card) => Math.max(max, card.rank), 0);
    const highestCard = handObjects.find(card => card.rank === highestRank);
    
    // Renderizado de mano
    $('#player-hand').innerHTML = `
        <h3>Tu Mano (${cardsPerPlayer} cartas):</h3>
        ${handObjects.map(card => `
            <span class="card" 
                  data-rank-symbol="${RANKS[card.rank]}" 
                  data-suit-symbol="${SUIT_SYMBOL_MAP[card.suit]}">
                  <span style="color:${card.suit === 'H' || card.suit === 'D' ? 'red' : 'black'};">
                    ${RANKS[card.rank]} ${SUIT_SYMBOL_MAP[card.suit]}
                  </span>
            </span>
        `).join('')}
    `;
    
    $('#hand-evaluation-display').innerHTML = `<p>Tu mejor carta: **${highestCard.symbol}** (Valor: ${highestCard.rank})</p>`;
    
    $('#poker-status').textContent = "Manos repartidas. ¡Ronda de apuestas!";
    $('#deal-hand-btn').disabled = true;
    $('#simulate-flop-btn').disabled = false;
    
    $('#community-cards').innerHTML = ''; 
    animateLuigi('deal');
}

/** Simula una ronda de apuestas o la revelación de cartas. */
function simulateBettingRound(numCards, roundName) {
    const $community = $('#community-cards');
    
    // Usamos dealCard() para obtener las cartas comunitarias ÚNICAS
    const communityCards = Array.from({ length: numCards }, () => dealCard());
    
    // Agregar los símbolos de texto alusivos al HTML
    const cardElements = communityCards.map(card => `
        <span class="card" 
              data-rank-symbol="${RANKS[card.rank]}" 
              data-suit-symbol="${SUIT_SYMBOL_MAP[card.suit]}">
              <span style="color:${card.suit === 'H' || card.suit === 'D' ? 'red' : 'black'};">
                ${RANKS[card.rank]} ${SUIT_SYMBOL_MAP[card.suit]}
              </span>
        </span>
    `);
    $community.innerHTML += cardElements.join('');

    $('#poker-status').textContent = `${roundName} revelado. ¡Ronda de apuestas!`;
    
    // Control de botones de ronda
    if (roundName === 'Flop') {
        $('#simulate-flop-btn').disabled = true;
        $('#simulate-turn-btn').disabled = false;
    } else if (roundName === 'Turn') {
        $('#simulate-turn-btn').disabled = true;
        $('#simulate-river-btn').disabled = false;
    } else if (roundName === 'River') {
        $('#simulate-river-btn').disabled = true;
        
        // Simular el resultado final
        const didWin = Math.random() > 0.5;
        setTimeout(() => {
            didWin ? animateLuigi('win') : animateLuigi('lose');
            const coinChange = didWin ? 400 : -100; 
            
            $('#poker-status').textContent = `Resultado: ${didWin ? "¡Ganaste!" : "¡Perdiste!"} (Mano simulada: ${coinChange > 0 ? '+' : ''}${coinChange} monedas) | ¡Pulsa Repartir para otra mano!`;
            CASINO_STATE.coins += coinChange;
            updateCoinDisplay();
            
            $('#deal-hand-btn').disabled = false;
        }, 3000);
    }
}


// ==========================================
// 9. INICIALIZACIÓN GLOBAL
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    loadState(); 
    updateCoinDisplay(); 
    animateLuigi('idle'); 
    changeScreen($lobbyScreen); 
});