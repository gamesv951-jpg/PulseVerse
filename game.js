// ============================================
// PULSVERSE DELUXE - MAIN GAME ENGINE
// ============================================

class PulseVerse {
  constructor() {
    this.gameState = {
      playerName: '',
      level: 1,
      xp: 0,
      xpMax: 100,
      energy: 100,
      energyMax: 100,
      coins: 0,
      gold: 500,
      body: 'humanoid',
      skinColor: '#fdbcb4',
      hairStyle: 'short',
      hairColor: '#2c2c2c',
      currentRoom: 'bedroom',
      rooms: {
        bedroom: { name: 'Quarto', emoji: '🛏️', width: 600, height: 400, bg: '#1a1a2e' },
        office: { name: 'Escritório', emoji: '🏢', width: 600, height: 400, bg: '#2c2c54' },
        lounge: { name: 'Lounge', emoji: '🛋️', width: 600, height: 400, bg: '#16213e' }
      },
      inventory: [],
      friends: [],
      quests: [],
      nobility: 'Novato',
      onboardingComplete: false
    };

    this.players = new Map(); // Jogadores online (simulado)
    this.chatHistory = [];
    this.maxChatHistory = 30;
    this.roomPlayers = new Map(); // Jogadores por sala
    this.currentScale = 1;
    this.minScale = 0.5;
    this.maxScale = 2;
    this.decorMode = false;

    this.init();
  }

  init() {
    this.loadGameState();
    this.setupEventListeners();
    this.renderOnboarding();
  }

  // ============================================
  // ONBOARDING SYSTEM
  // ============================================

  renderOnboarding() {
    const onboarding = document.getElementById('onboarding');
    const step = document.querySelector('.ob-step.active');
    const stepIndex = Array.from(document.querySelectorAll('.ob-step')).indexOf(step);

    // Update dots
    document.querySelectorAll('.ob-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === stepIndex);
    });

    // Preview avatar
    this.drawAvatarPreview();
  }

  setupOnboardingListeners() {
    // Name input
    document.getElementById('ob-name').addEventListener('input', (e) => {
      this.gameState.playerName = e.target.value;
    });

    // Body selection
    document.querySelectorAll('.body-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.body-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.gameState.body = card.dataset.body;
        this.drawAvatarPreview();
      });
    });

    // Skin color
    document.querySelectorAll('.swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        this.gameState.skinColor = swatch.dataset.color;
        this.drawAvatarPreview();
      });
    });

    // Hair style
    document.querySelectorAll('.hair-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.hair-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.gameState.hairStyle = card.dataset.hair;
        this.drawAvatarPreview();
      });
    });

    // Hair color
    const hairColorSwatches = document.querySelectorAll('.swatch-row')[1]?.querySelectorAll('.swatch') || [];
    hairColorSwatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        hairColorSwatches.forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        this.gameState.hairColor = swatch.dataset.haircolor;
        this.drawAvatarPreview();
      });
    });

    // Room selection
    document.querySelectorAll('.room-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.room-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.gameState.currentRoom = card.dataset.room;
      });
    });

    // Next button
    document.getElementById('ob-next').addEventListener('click', () => {
      this.nextOnboardingStep();
    });
  }

  nextOnboardingStep() {
    const steps = document.querySelectorAll('.ob-step');
    const currentStep = document.querySelector('.ob-step.active');
    const currentIndex = Array.from(steps).indexOf(currentStep);

    if (currentIndex < steps.length - 1) {
      currentStep.classList.remove('active');
      steps[currentIndex + 1].classList.add('active');
      this.renderOnboarding();
    } else {
      this.completeOnboarding();
    }
  }

  completeOnboarding() {
    if (!this.gameState.playerName.trim()) {
      alert('Por favor, insira um nome!');
      return;
    }

    this.gameState.onboardingComplete = true;
    this.saveGameState();
    this.startGame();
  }

  drawAvatarPreview() {
    const canvas = document.getElementById('ob-avatar-preview');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Draw body
    ctx.fillStyle = this.gameState.skinColor;
    ctx.fillRect(centerX - 15, centerY - 10, 30, 30);

    // Draw head
    ctx.fillStyle = this.gameState.skinColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY - 25, 12, 0, Math.PI * 2);
    ctx.fill();

    // Draw hair
    ctx.fillStyle = this.gameState.hairColor;
    if (this.gameState.hairStyle === 'short') {
      ctx.fillRect(centerX - 12, centerY - 35, 24, 10);
    } else if (this.gameState.hairStyle === 'medium') {
      ctx.fillRect(centerX - 13, centerY - 37, 26, 15);
    } else if (this.gameState.hairStyle === 'long') {
      ctx.fillRect(centerX - 14, centerY - 40, 28, 20);
    } else if (this.gameState.hairStyle === 'afro') {
      ctx.beginPath();
      ctx.arc(centerX, centerY - 28, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(centerX - 6, centerY - 28, 3, 3);
    ctx.fillRect(centerX + 3, centerY - 28, 3, 3);

    // Draw accessories if android
    if (this.gameState.body === 'android') {
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.strokeRect(centerX - 18, centerY - 12, 36, 32);
    }
  }

  // ============================================
  // GAME SYSTEM
  // ============================================

  startGame() {
    document.getElementById('onboarding').style.display = 'none';
    document.getElementById('game').classList.add('active');
    
    this.updateHUD();
    this.setupGameListeners();
    this.createRoom(this.gameState.currentRoom);
    this.loadInventory();
    this.loadQuests();
    this.simulateOnlinePlayers();
  }

  setupGameListeners() {
    // Chat
    document.getElementById('chat-send').addEventListener('click', () => this.sendMessage());
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    // Emotes
    document.querySelectorAll('.em-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.showEmote(btn.dataset.emote);
        this.broadcastMessage(`${this.gameState.playerName} usou ${btn.dataset.emote}`);
      });
    });

    // Sidebar buttons
    document.querySelectorAll('.sb-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        this.openModal(section);
      });
    });

    // Zoom controls
    document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
    document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());

    // Room popup
    document.getElementById('sidebar').addEventListener('click', (e) => {
      if (e.target.closest('#sb-nobility')) {
        this.toggleRoomPopup();
      }
    });
  }

  // ============================================
  // ROOM SYSTEM
  // ============================================

  createRoom(roomName) {
    const worldInner = document.getElementById('world-inner');
    worldInner.innerHTML = '';

    const roomData = this.gameState.rooms[roomName];
    if (!roomData) return;

    const room = document.createElement('div');
    room.className = 'room';
    room.style.cssText = `
      width: ${roomData.width}px;
      height: ${roomData.height}px;
      background: ${roomData.bg};
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    `;

    // Add floor
    const floor = document.createElement('div');
    floor.className = 'room-floor';
    floor.style.cssText = `
      height: 80px;
      background: linear-gradient(180deg, transparent, rgba(0,0,0,0.3));
    `;
    room.appendChild(floor);

    // Add wall
    const wall = document.createElement('div');
    wall.className = 'room-wall';
    wall.style.cssText = `
      height: 200px;
      background: linear-gradient(180deg, ${roomData.bg}, transparent);
    `;
    room.appendChild(wall);

    worldInner.appendChild(room);

    // Posicionar player
    this.positionPlayer();

    // Simular outros jogadores
    this.spawnOtherPlayers(roomData);
  }

  positionPlayer() {
    const canvas = document.createElement('canvas');
    canvas.width = 30;
    canvas.height = 40;
    this.drawPlayerAvatar(canvas, this.gameState);

    const wrap = document.createElement('div');
    wrap.className = 'player-canvas-wrap';
    wrap.style.cssText = `
      left: 280px;
      bottom: 80px;
      z-index: 40;
    `;
    wrap.appendChild(canvas);

    const nametag = document.createElement('div');
    nametag.className = 'av-nametag';
    nametag.textContent = this.gameState.playerName;
    wrap.appendChild(nametag);

    const room = document.querySelector('.room');
    if (room) room.appendChild(wrap);

    // Update HUD avatar
    const hudCanvas = document.getElementById('hud-avatar');
    this.drawPlayerAvatar(hudCanvas, this.gameState, true);
  }

  drawPlayerAvatar(canvas, playerData, isSmall = false) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const scale = isSmall ? 0.8 : 1;
    const centerX = w / 2;
    const centerY = h / 2;

    // Body
    ctx.fillStyle = playerData.skinColor;
    ctx.fillRect(centerX - 7 * scale, centerY - 5 * scale, 14 * scale, 15 * scale);

    // Head
    ctx.beginPath();
    ctx.arc(centerX, centerY - 12 * scale, 6 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = playerData.hairColor;
    if (playerData.hairStyle === 'short') {
      ctx.fillRect(centerX - 6 * scale, centerY - 18 * scale, 12 * scale, 5 * scale);
    } else if (playerData.hairStyle === 'medium') {
      ctx.fillRect(centerX - 7 * scale, centerY - 19 * scale, 14 * scale, 8 * scale);
    } else if (playerData.hairStyle === 'long') {
      ctx.fillRect(centerX - 7 * scale, centerY - 20 * scale, 14 * scale, 12 * scale);
    } else if (playerData.hairStyle === 'afro') {
      ctx.beginPath();
      ctx.arc(centerX, centerY - 14 * scale, 8 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(centerX - 3 * scale, centerY - 14 * scale, 1.5 * scale, 1.5 * scale);
    ctx.fillRect(centerX + 1.5 * scale, centerY - 14 * scale, 1.5 * scale, 1.5 * scale);
  }

  spawnOtherPlayers(roomData) {
    const onlinePlayers = Math.floor(Math.random() * 3) + 1;
    const room = document.querySelector('.room');
    if (!room) return;

    for (let i = 0; i < onlinePlayers; i++) {
      const otherPlayer = {
        name: `Jogador${Math.floor(Math.random() * 1000)}`,
        body: ['humanoid', 'android', 'alien'][Math.floor(Math.random() * 3)],
        skinColor: ['#fdbcb4', '#f0a383', '#80d5ff', '#ff6bb6'][Math.floor(Math.random() * 4)],
        hairStyle: ['short', 'medium', 'long', 'afro'][Math.floor(Math.random() * 4)],
        hairColor: ['#2c2c2c', '#8b4513', '#ff6b35'][Math.floor(Math.random() * 3)]
      };

      const canvas = document.createElement('canvas');
      canvas.width = 30;
      canvas.height = 40;
      this.drawPlayerAvatar(canvas, otherPlayer);

      const wrap = document.createElement('div');
      wrap.className = 'player-canvas-wrap';
      wrap.style.cssText = `
        left: ${100 + i * 120}px;
        bottom: 80px;
        z-index: ${30 + i};
      `;
      wrap.appendChild(canvas);

      const nametag = document.createElement('div');
      nametag.className = 'av-nametag';
      nametag.textContent = otherPlayer.name;
      wrap.appendChild(nametag);

      room.appendChild(wrap);

      this.players.set(otherPlayer.name, otherPlayer);
    }
  }

  // ============================================
  // CHAT SYSTEM
  // ============================================

  sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    this.broadcastMessage(message);
    input.value = '';

    // Consume energy
    this.gameState.energy = Math.max(0, this.gameState.energy - 2);
    this.updateHUD();

    // Regenerate after 5s
    setTimeout(() => {
      this.gameState.energy = Math.min(this.gameState.energyMax, this.gameState.energy + 5);
      this.updateHUD();
    }, 5000);
  }

  broadcastMessage(message) {
    this.chatHistory.push({
      user: this.gameState.playerName,
      text: message,
      timestamp: new Date()
    });

    if (this.chatHistory.length > this.maxChatHistory) {
      this.chatHistory.shift();
    }

    this.showChatMessage(this.gameState.playerName, message);

    // Show speech bubble
    const playerWrap = document.querySelector('.player-canvas-wrap');
    if (playerWrap) {
      const bubble = document.createElement('div');
      bubble.className = 'av-speech-bubble';
      bubble.textContent = message;
      playerWrap.appendChild(bubble);

      setTimeout(() => bubble.remove(), 3000);
    }
  }

  showChatMessage(user, text) {
    const history = document.getElementById('chat-history');
    const line = document.createElement('div');
    line.className = 'chat-hist-line';
    line.innerHTML = `<span class="ch-user">${user}:</span> ${text}`;
    history.appendChild(line);
    history.scrollTop = history.scrollHeight;

    // Remove oldest if too many
    if (history.children.length > this.maxChatHistory) {
      history.removeChild(history.firstChild);
    }
  }

  // ============================================
  // MODAL SYSTEM
  // ============================================

  openModal(section) {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');

    content.innerHTML = '';

    switch(section) {
      case 'profile':
        content.innerHTML = this.getProfileHTML();
        break;
      case 'inventory':
        content.innerHTML = this.getInventoryHTML();
        break;
      case 'shop':
        content.innerHTML = this.getShopHTML();
        break;
      case 'rooms':
        content.innerHTML = this.getRoomsHTML();
        break;
      case 'decor':
        content.innerHTML = this.getDecorHTML();
        break;
      case 'quests':
        content.innerHTML = this.getQuestsHTML();
        break;
      case 'friends':
        content.innerHTML = this.getFriendsHTML();
        break;
      case 'settings':
        content.innerHTML = this.getSettingsHTML();
        break;
    }

    modal.classList.add('open');
    this.setupModalListeners();
  }

  closeModal() {
    document.getElementById('modal').classList.remove('open');
  }

  setupModalListeners() {
    document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
    document.getElementById('modal').addEventListener('click', (e) => {
      if (e.target.id === 'modal') this.closeModal();
    });
  }

  getProfileHTML() {
    const nobility = ['Novato', 'Aspirante', 'Elite', 'Lendário'];
    return `
      <h3>👤 Meu Perfil</h3>
      <div class="stat-row">
        <div class="stat-box">
          <div class="stat-val">${this.gameState.level}</div>
          <div class="stat-lbl">Nível</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">${this.gameState.xp}</div>
          <div class="stat-lbl">XP</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">${this.gameState.coins}</div>
          <div class="stat-lbl">Moedas</div>
        </div>
      </div>
      <div style="background:var(--surface2);border-radius:12px;padding:12px;margin:10px 0;">
        <div style="font-size:12px;font-weight:700;margin-bottom:8px;">Nobreza: ${this.gameState.nobility}</div>
        <div style="font-size:11px;color:var(--text2);">Seu status na comunidade PulseVerse</div>
      </div>
      <button class="btn btn-primary" style="width:100%;margin-top:10px;">Editar Perfil</button>
    `;
  }

  getInventoryHTML() {
    const items = [
      { id: 1, name: 'Chapéu Brilhante', icon: '🎩', type: 'Acessório', qty: 1 },
      { id: 2, name: 'Jaqueta Neon', icon: '🧥', type: 'Roupa', qty: 1 },
      { id: 3, name: 'Óculos Futurista', icon: '🕶️', type: 'Acessório', qty: 2 }
    ];

    let html = `<h3>🎒 Inventário</h3>`;
    html += `<div class="inv-grid">`;

    items.forEach(item => {
      html += `
        <div class="inv-card">
          <div class="ic-icon">${item.icon}</div>
          <div class="ic-name">${item.name}</div>
          <div class="ic-type">${item.type}</div>
          <div class="inv-qty-badge">${item.qty}</div>
        </div>
      `;
    });

    html += `</div>`;
    return html;
  }

  getShopHTML() {
    const shop = [
      { id: 1, name: 'Chapéu Rosa', icon: '🎩', price: 150, rarity: 'Comum' },
      { id: 2, name: 'Jaqueta Cyber', icon: '🧥', price: 500, rarity: 'Raro' },
      { id: 3, name: 'Botas Fluidas', icon: '👢', price: 300, rarity: 'Raro' },
      { id: 4, name: 'Auroras LED', icon: '✨', price: 250, rarity: 'Comum' },
      { id: 5, name: 'Capa de Herói', icon: '🦸', price: 750, rarity: 'Épico' },
      { id: 6, name: 'Óculos 3D', icon: '🕶️', price: 200, rarity: 'Comum' }
    ];

    let html = `<h3>🛍️ Loja</h3>`;
    html += `<div class="shop-grid">`;

    shop.forEach(item => {
      html += `
        <div class="shop-card">
          <div class="sc-icon">${item.icon}</div>
          <div class="sc-name">${item.name}</div>
          <div class="sc-price">💎 ${item.price}</div>
          <div class="sc-rarity">${item.rarity}</div>
          <button class="btn btn-primary" style="width:100%;margin-top:8px;font-size:10px;">Comprar</button>
        </div>
      `;
    });

    html += `</div>`;
    return html;
  }

  getRoomsHTML() {
    let html = `<h3>🏠 Minhas Salas</h3>`;
    html += `<div class="myrooms-list">`;

    Object.entries(this.gameState.rooms).forEach(([key, room]) => {
      const isActive = key === this.gameState.currentRoom;
      html += `
        <div class="myroom-row ${isActive ? 'active-room' : ''}" data-room="${key}">
          <span style="font-size:18px;">${room.emoji}</span>
          <div>
            <div style="font-weight:600;">${room.name}</div>
            <div style="font-size:9px;color:var(--text3);">Sala privada</div>
          </div>
          <button class="myroom-del" data-room="${key}">🗑️</button>
        </div>
      `;
    });

    html += `</div>`;
    html += `<button class="btn btn-primary" style="width:100%;">+ Nova Sala</button>`;
    return html;
  }

  getDecorHTML() {
    const furniture = [
      { name: 'Cama Futurista', icon: '🛏️', price: 200 },
      { name: 'Poltrona Gamer', icon: '🎮', price: 300 },
      { name: 'Mesa Holográfica', icon: '🖥️', price: 450 },
      { name: 'Luminária Neon', icon: '💡', price: 120 },
      { name: 'Estante Digital', icon: '📚', price: 250 },
      { name: 'Tapete Interativo', icon: '🟦', price: 180 }
    ];

    let html = `<h3>✨ Decoração</h3>`;
    html += `<div class="shop-grid">`;

    furniture.forEach(item => {
      html += `
        <div class="shop-card">
          <div class="sc-icon">${item.icon}</div>
          <div class="sc-name">${item.name}</div>
          <div class="sc-price">🪙 ${item.price}</div>
          <button class="btn btn-primary" style="width:100%;margin-top:8px;font-size:10px;">Colocar</button>
        </div>
      `;
    });

    html += `</div>`;
    return html;
  }

  getQuestsHTML() {
    const quests = [
      { title: 'Primeira Conversa', desc: 'Envie uma mensagem no chat', progress: 100 },
      { title: 'Decorador', desc: 'Coloque 5 móveis em sua sala', progress: 40 },
      { title: 'Social Butterfly', desc: 'Adicione 10 amigos', progress: 20 }
    ];

    let html = `<h3>📜 Missões</h3>`;

    quests.forEach(quest => {
      html += `
        <div class="quest-card">
          <div style="font-weight:700;color:var(--accent);margin-bottom:4px;">${quest.title}</div>
          <div style="font-size:11px;color:var(--text2);margin-bottom:8px;">${quest.desc}</div>
          <div class="quest-bar">
            <div class="quest-fill" style="width:${quest.progress}%"></div>
          </div>
          <div style="font-size:9px;color:var(--text3);margin-top:4px;">${quest.progress}%</div>
        </div>
      `;
    });

    return html;
  }

  getFriendsHTML() {
    const friends = [
      { name: 'Luna', status: 'Online', nobility: 'Elite' },
      { name: 'Phoenix', status: 'Online', nobility: 'Aspirante' },
      { name: 'Nova', status: 'Offline', nobility: 'Novato' }
    ];

    let html = `<h3>👥 Amigos</h3>`;

    friends.forEach(friend => {
      const statusColor = friend.status === 'Online' ? 'var(--success)' : 'var(--text3)';
      html += `
        <div class="friend-row">
          <div style="font-size:18px;">👤</div>
          <div style="flex:1;">
            <div style="font-weight:600;">${friend.name}</div>
            <div style="font-size:9px;color:${statusColor};">${friend.status}</div>
          </div>
          <span class="nobility-badge nb-1">${friend.nobility}</span>
        </div>
      `;
    });

    html += `<button class="btn btn-primary" style="width:100%;margin-top:10px;">+ Adicionar Amigo</button>`;
    return html;
  }

  getSettingsHTML() {
    return `
      <h3>⚙️ Configurações</h3>
      <div style="background:var(--surface2);border-radius:12px;padding:12px;margin:10px 0;">
        <label style="display:flex;align-items:center;gap:8px;margin-bottom:10px;cursor:pointer;">
          <input type="checkbox" checked>
          <span>Som ativado</span>
        </label>
        <label style="display:flex;align-items:center;gap:8px;margin-bottom:10px;cursor:pointer;">
          <input type="checkbox" checked>
          <span>Notificações</span>
        </label>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
          <input type="checkbox">
          <span>Modo escuro</span>
        </label>
      </div>
      <div style="margin-top:15px;">
        <button class="btn btn-secondary" style="width:100%;margin-bottom:8px;">Privacidade</button>
        <button class="btn btn-secondary" style="width:100%;margin-bottom:8px;">Suporte</button>
        <button class="btn btn-danger" style="width:100%;">Logout</button>
      </div>
    `;
  }

  // ============================================
  // UTILITIES
  // ============================================

  showEmote(emote) {
    const playerWrap = document.querySelector('.player-canvas-wrap');
    if (playerWrap) {
      const emoteEl = document.createElement('div');
      emoteEl.className = 'av-emote';
      emoteEl.textContent = emote;
      playerWrap.appendChild(emoteEl);

      setTimeout(() => emoteEl.remove(), 500);
    }
  }

  toggleRoomPopup() {
    const popup = document.getElementById('room-popup');
    popup.classList.toggle('open');

    if (popup.classList.contains('open')) {
      this.updateRoomPopup();
    }
  }

  updateRoomPopup() {
    const popup = document.getElementById('room-popup');
    const rooms = [
      { name: 'Sala Principal', count: 42, hot: true },
      { name: 'Galeria de Arte', count: 8, hot: false },
      { name: 'Club Exclusivo', count: 15, hot: false }
    ];

    popup.innerHTML = rooms.map(room => `
      <div class="room-btn ${room.hot ? 'room-hot' : ''}">
        <span>${room.name}</span>
        <span class="room-count-badge ${room.hot ? 'room-count-hot' : ''}">${room.count}</span>
      </div>
    `).join('');
  }

  zoomIn() {
    this.currentScale = Math.min(this.maxScale, this.currentScale + 0.1);
    this.applyZoom();
  }

  zoomOut() {
    this.currentScale = Math.max(this.minScale, this.currentScale - 0.1);
    this.applyZoom();
  }

  applyZoom() {
    const inner = document.getElementById('world-inner');
    inner.style.transform = `scale(${this.currentScale})`;
  }

  // ============================================
  // DATA MANAGEMENT
  // ============================================

  updateHUD() {
    document.getElementById('hud-name').textContent = this.gameState.playerName;
    document.getElementById('hud-level').textContent = this.gameState.level;
    document.getElementById('hud-nobility').textContent = this.gameState.nobility;
    document.getElementById('hud-coins').textContent = this.gameState.coins;
    document.getElementById('hud-gold').textContent = this.gameState.gold;

    // XP Bar
    const xpPercent = (this.gameState.xp / this.gameState.xpMax) * 100;
    document.getElementById('hud-xp-fill').style.width = `${xpPercent}%`;
    document.getElementById('hud-xp-txt').textContent = `${this.gameState.xp}/${this.gameState.xpMax}`;

    // Energy Bar
    const energyPercent = (this.gameState.energy / this.gameState.energyMax) * 100;
    document.getElementById('hud-en-fill').style.width = `${energyPercent}%`;
    document.getElementById('hud-en-txt').textContent = `${Math.floor(this.gameState.energy)}/${this.gameState.energyMax}`;
  }

  loadInventory() {
    // Simulado - em produção viria de um servidor
    this.gameState.inventory = [
      { id: 1, name: 'Chapéu', icon: '🎩' }
    ];
  }

  loadQuests() {
    // Simulado
    this.gameState.quests = [
      { id: 1, title: 'Primeira Conversa', completed: false }
    ];
  }

  simulateOnlinePlayers() {
    // Simulação de outros jogadores online
    const names = ['Luna', 'Phoenix', 'Nova', 'Zephyr', 'Iris'];
    names.forEach(name => {
      this.players.set(name, {
        name,
        room: this.gameState.currentRoom
      });
    });
  }

  saveGameState() {
    localStorage.setItem('pulseverse_gamestate', JSON.stringify(this.gameState));
    localStorage.setItem('pulseverse_chat', JSON.stringify(this.chatHistory));
  }

  loadGameState() {
    const saved = localStorage.getItem('pulseverse_gamestate');
    if (saved) {
      this.gameState = { ...this.gameState, ...JSON.parse(saved) };
      if (this.gameState.onboardingComplete) {
        setTimeout(() => this.startGame(), 100);
      }
    }

    const chatSaved = localStorage.getItem('pulseverse_chat');
    if (chatSaved) {
      this.chatHistory = JSON.parse(chatSaved);
    }
  }
}

// ============================================
// INITIALIZATION
// ============================================

let game;

document.addEventListener('DOMContentLoaded', () => {
  game = new PulseVerse();
  game.setupOnboardingListeners();
});

// Auto-save every 30 seconds
setInterval(() => {
  if (game) {
    game.saveGameState();
  }
}, 30000);

// Handle visibility change
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game) {
    game.saveGameState();
  }
});

// Prevent accidental refresh loss
window.addEventListener('beforeunload', (e) => {
  if (game && game.gameState.onboardingComplete) {
    game.saveGameState();
  }
});
