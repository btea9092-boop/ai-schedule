(() => {
  const KEY = 'petalJournal.v1';
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const localDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const today = () => localDate(new Date());
  const state = { water: 0, waterTarget: 2000, meals: 0, sleep: 0, joy: 0, bowel: 0, weight: 0, hasWeight: false };

  const ARCH_FLOWERS = [
    { x: 48, y: 410, h: 65, s: 1.15, c: 'rose', tilt: 18 },
    { x: 332, y: 410, h: 65, s: 1.15, c: 'ice', tilt: -18 },
    { x: 78, y: 420, h: 52, s: 1.0, c: 'ice', tilt: 12 },
    { x: 302, y: 420, h: 52, s: 1.0, c: 'rose', tilt: -12 },
    { x: 34, y: 375, h: 58, s: 0.95, c: 'ice', tilt: 26 },
    { x: 346, y: 375, h: 58, s: 0.95, c: 'rose', tilt: -26 },
    { x: 108, y: 425, h: 40, s: 0.85, c: 'rose', tilt: 8 },
    { x: 272, y: 425, h: 40, s: 0.85, c: 'ice', tilt: -8 },
    { x: 62, y: 395, h: 46, s: 0.9, c: 'rose', tilt: 20 },
    { x: 318, y: 395, h: 46, s: 0.9, c: 'ice', tilt: -20 },
    { x: 28, y: 335, h: 48, s: 0.82, c: 'rose', tilt: 32 },
    { x: 352, y: 335, h: 48, s: 0.82, c: 'ice', tilt: -32 },
    { x: 135, y: 430, h: 32, s: 0.75, c: 'ice', tilt: 5 },
    { x: 245, y: 430, h: 32, s: 0.75, c: 'rose', tilt: -5 }
  ];

  function readData() {
    const data = JSON.parse(localStorage.getItem(KEY) || '{}');
    return data && typeof data === 'object' ? data : {};
  }

  function renderShrineSvg() {
    const waterRatio = Math.min(1.2, Math.max(0, state.water / state.waterTarget));
    const topW = 2 + waterRatio * 14;
    const botW = 6 + waterRatio * 36;
    const cascade = $('waterCascade');
    cascade.setAttribute('d', `M ${190 - topW} 165 Q 190 265 ${190 - botW} 375 L ${190 + botW} 375 Q 190 265 ${190 + topW} 165 Z`);
    cascade.style.opacity = 0.12 + waterRatio * 0.73;

    const sleepRatio = Math.min(1, Math.max(0, state.sleep / 10));
    $('sleepHalo').setAttribute('r', (38 + sleepRatio * 55).toFixed(1));
    $('astroOuter').style.opacity = 0.25 + sleepRatio * 0.75;
    $('starField').style.opacity = 0.2 + sleepRatio * 0.8;
    $('moonBody').style.filter = `brightness(${0.78 + sleepRatio * 0.42}) drop-shadow(0 0 ${7 + sleepRatio * 13}px rgba(255,249,230,${0.38 + sleepRatio * 0.42}))`;

    const mealRatio = Math.min(1, Math.max(0, state.meals / 3));
    const flowerCount = Math.min(ARCH_FLOWERS.length, Math.round(mealRatio * ARCH_FLOWERS.length));
    let flowers = '';
    for (let i = 0; i < flowerCount; i++) {
      const flower = ARCH_FLOWERS[i];
      const grow = 0.4 + mealRatio * 0.7;
      const radians = (flower.tilt * Math.PI) / 180;
      const tx = flower.x + Math.sin(radians) * flower.h * grow;
      const ty = flower.y - Math.cos(radians) * flower.h * grow;
      const cx = (flower.x + tx) / 2 + (flower.tilt > 0 ? -10 : 10);
      const cy = (flower.y + ty) / 2;
      const gradient = flower.c === 'rose' ? 'url(#rosePetal)' : 'url(#icePetal)';
      const open = 16 + mealRatio * 28;
      const scale = (flower.s * grow).toFixed(2);
      flowers += `
        <path d="M ${flower.x} ${flower.y} Q ${cx} ${cy} ${tx} ${ty}" fill="none" stroke="rgba(158,212,209,0.55)" stroke-width="1.3"/>
        <g transform="translate(${tx},${ty}) rotate(${flower.tilt}) scale(${scale})">
          <circle cx="0" cy="0" r="12" fill="url(#haloGrad)" opacity="0.7"/>
          <path d="M0,0 C-6,-8 -5,-18 0,-23 C5,-18 6,-8 0,0" fill="${gradient}" transform="rotate(${-open * 1.2})"/>
          <path d="M0,0 C-6,-8 -5,-18 0,-23 C5,-18 6,-8 0,0" fill="${gradient}" transform="rotate(${open * 1.2})"/>
          <path d="M0,0 C-6,-9 -5,-20 0,-25 C5,-20 6,-9 0,0" fill="${gradient}" transform="rotate(${-open * 0.55})"/>
          <path d="M0,0 C-6,-9 -5,-20 0,-25 C5,-20 6,-9 0,0" fill="${gradient}" transform="rotate(${open * 0.55})"/>
          <path d="M0,0 C-6,-10 -5,-22 0,-27 C5,-22 6,-10 0,0" fill="${gradient}"/>
          <circle cx="0" cy="-5" r="2.5" fill="#fff9e6" filter="url(#glow)"/>
        </g>`;
    }
    $('archFlowersGroup').innerHTML = flowers;

    const lotusCount = Math.min(5, 1 + state.bowel);
    const lotusPositions = [190, 145, 235, 105, 275];
    let lotuses = '';
    for (let i = 0; i < lotusCount; i++) {
      const x = lotusPositions[i];
      const y = 376 + (i % 2) * 10;
      lotuses += `
        <g transform="translate(${x}, ${y}) scale(${i === 0 ? 1.1 : 0.85})">
          <ellipse cx="0" cy="3" rx="14" ry="4" fill="rgba(158,212,209,0.35)"/>
          <path d="M0,2 C-4,-5 -3,-11 0,-14 C3,-11 4,-5 0,2" fill="url(#icePetal)" transform="rotate(-28)"/>
          <path d="M0,2 C-4,-5 -3,-11 0,-14 C3,-11 4,-5 0,2" fill="url(#icePetal)" transform="rotate(28)"/>
          <path d="M0,2 C-4,-6 -3,-12 0,-16 C3,-12 4,-6 0,2" fill="url(#rosePetal)"/>
        </g>`;
    }
    $('lotusGroup').innerHTML = lotuses;

    let prisms = '';
    if (state.hasWeight) {
      for (let i = 0; i < 6; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const tier = Math.floor(i / 2);
        const x = 190 + side * (112 + tier * 16);
        const y = 135 + tier * 42;
        prisms += `<polygon points="${x},${y - 9} ${x + 5},${y} ${x},${y + 9} ${x - 5},${y}" fill="rgba(255,202,212,0.7)" stroke="#fff9e6" stroke-width="0.7" filter="url(#glow)"/>`;
      }
    }
    $('weightPrisms').innerHTML = prisms;
  }

  class ShrineCanvas {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      if (!this.ctx) throw new Error('今日小笺动画无法创建 Canvas 画布。');
      this.w = 380;
      this.h = 550;
      canvas.width = this.w;
      canvas.height = this.h;
      this.ripples = [];
      this.drops = [];
      this.meteors = [];
      this.butterflies = [];
      this.lanterns = [];
      this.tick = 0;
      this.running = false;
      this.frame = 0;
      for (let i = 0; i < 12; i++) {
        this.butterflies.push({
          x: 70 + Math.random() * 240,
          y: 220 + Math.random() * 180,
          angle: Math.random() * Math.PI * 2,
          wing: Math.random() * Math.PI
        });
      }
      for (let i = 0; i < 20; i++) {
        this.lanterns.push({
          x: 40 + Math.random() * 300,
          y: 120 + Math.random() * 280,
          vy: 0.2 + Math.random() * 0.35,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.loop();
    }

    stop() {
      this.running = false;
      cancelAnimationFrame(this.frame);
      this.ctx.clearRect(0, 0, this.w, this.h);
    }

    loop() {
      if (!this.running) return;
      this.tick++;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);
      const waterRatio = Math.min(1.2, state.water / state.waterTarget);
      const joyRatio = Math.min(1, state.joy);

      if (Math.random() < 0.02 + waterRatio * 0.53) {
        this.drops.push({
          x: 190 + (Math.random() - 0.5) * (12 + waterRatio * 35),
          y: 170 + Math.random() * 40,
          vy: 3 + Math.random() * 2.5,
          len: 12 + Math.random() * 14
        });
      }

      const maxRipples = Math.max(2, Math.round(waterRatio * 12));
      if (this.ripples.length < maxRipples && this.tick % Math.max(8, Math.round(36 - waterRatio * 24)) === 0) {
        this.ripples.push({
          x: 190 + (Math.random() - 0.5) * 140,
          y: 375 + (Math.random() - 0.5) * 32,
          r: 2,
          maxR: 30 + waterRatio * 48,
          color: Math.random() > 0.45 ? '158, 212, 209' : '255, 202, 212'
        });
      }

      for (let i = this.drops.length - 1; i >= 0; i--) {
        const drop = this.drops[i];
        drop.y += drop.vy;
        ctx.strokeStyle = 'rgba(237, 245, 245, 0.7)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y - drop.len);
        ctx.lineTo(drop.x, drop.y);
        ctx.stroke();
        if (drop.y >= 375) {
          if (this.ripples.length < maxRipples + 3) {
            this.ripples.push({ x: drop.x, y: 375 + (Math.random() - 0.5) * 12, r: 2, maxR: 25 + waterRatio * 35, color: '158, 212, 209' });
          }
          this.drops.splice(i, 1);
        }
      }

      for (let i = this.ripples.length - 1; i >= 0; i--) {
        const ripple = this.ripples[i];
        ripple.r += 0.5 + waterRatio * 0.25;
        const alpha = Math.max(0, (1 - ripple.r / ripple.maxR) * 0.8);
        ctx.strokeStyle = `rgba(${ripple.color}, ${alpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(ripple.x, ripple.y, ripple.r, ripple.r * 0.22, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (ripple.r >= ripple.maxR) this.ripples.splice(i, 1);
      }

      if (Math.random() < 0.008 + joyRatio * 0.045) {
        this.meteors.push({
          x: 100 + Math.random() * 280,
          y: 10 + Math.random() * 100,
          len: 60 + Math.random() * 40,
          spd: 4 + Math.random() * 2,
          a: 1
        });
      }
      for (let i = this.meteors.length - 1; i >= 0; i--) {
        const meteor = this.meteors[i];
        meteor.x -= meteor.spd;
        meteor.y += meteor.spd * 0.6;
        meteor.a -= 0.015;
        const gradient = ctx.createLinearGradient(meteor.x, meteor.y, meteor.x + meteor.len, meteor.y - meteor.len * 0.6);
        gradient.addColorStop(0, `rgba(255, 249, 230, ${meteor.a})`);
        gradient.addColorStop(0.4, `rgba(255, 182, 193, ${meteor.a * 0.8})`);
        gradient.addColorStop(1, 'rgba(255, 182, 193, 0)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(meteor.x + meteor.len, meteor.y - meteor.len * 0.6);
        ctx.stroke();
        if (meteor.a <= 0) this.meteors.splice(i, 1);
      }

      const lanternCount = Math.round(joyRatio * this.lanterns.length);
      for (let i = 0; i < lanternCount; i++) {
        const lantern = this.lanterns[i];
        lantern.y -= lantern.vy * (0.6 + joyRatio);
        lantern.x += Math.sin(this.tick * 0.03 + lantern.phase) * 0.35;
        if (lantern.y < 60) lantern.y = 390;
        const alpha = 0.4 + Math.sin(this.tick * 0.06 + lantern.phase) * 0.35;
        ctx.fillStyle = `rgba(255, 225, 180, ${alpha})`;
        ctx.shadowColor = '#ffcad4';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(lantern.x, lantern.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      const butterflyCount = state.bowel ? Math.min(this.butterflies.length, state.bowel * 3) : 0;
      for (let i = 0; i < butterflyCount; i++) {
        const butterfly = this.butterflies[i];
        butterfly.wing += 0.22;
        butterfly.angle += (Math.random() - 0.5) * 0.15;
        butterfly.x += Math.cos(butterfly.angle) * 0.7;
        butterfly.y += Math.sin(butterfly.angle) * 0.5 - 0.2;
        if (butterfly.y < 110) butterfly.y = 370;
        if (butterfly.x < 40) butterfly.x = 340;
        if (butterfly.x > 340) butterfly.x = 40;
        const wingSpan = Math.abs(Math.sin(butterfly.wing)) * 5 + 1.5;
        ctx.save();
        ctx.translate(butterfly.x, butterfly.y);
        ctx.rotate(butterfly.angle + Math.PI / 2);
        ctx.fillStyle = i % 2 === 0 ? 'rgba(158, 212, 209, 0.85)' : 'rgba(255, 202, 212, 0.85)';
        ctx.shadowColor = '#9ED4D1';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.ellipse(-wingSpan / 2, 0, wingSpan, 3.5, 0.3, 0, Math.PI * 2);
        ctx.ellipse(wingSpan / 2, 0, wingSpan, 3.5, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      this.frame = requestAnimationFrame(() => this.loop());
    }
  }

  function renderWidgets(data) {
    const date = today();
    const todos = (data.todos || []).filter(item => !item.completedAt || item.completedAt >= date);
    $('homeTodoList').innerHTML = todos.length
      ? todos.map(item => `<div class="home-todo ${item.completedAt === date ? 'is-complete' : ''}"><label><input type="checkbox" data-todo-complete="${escapeHtml(item.id)}" ${item.completedAt === date ? 'checked' : ''}><span>${escapeHtml(item.content)}</span></label><button class="secondary-button" type="button" data-todo-delete="${escapeHtml(item.id)}" aria-label="删除待办">删除</button></div>`).join('')
      : '<p class="home-empty">还没有待办事项。</p>';
    const selectableArchives = (data.memoryArchives || [])
      .filter(archive => !['health-archive', 'personal-profile-archive', 'chat-summary-archive'].includes(archive.id));
    const selectedIds = data.settings?.chatMemoryArchiveIdsConfigured
      ? new Set(data.settings.chatMemoryArchiveIds || [])
      : new Set(selectableArchives.map(archive => archive.id));
    const favorites = selectableArchives.filter(archive => selectedIds.has(archive.id))
      .flatMap(archive => (archive.items || [])
        .filter(item => item.source === 'AI 收藏' || item.type === '收藏')
        .map(item => ({ ...item, archiveName: archive.name })));
    $('homeFavoritesList').innerHTML = favorites.length
      ? favorites.map(item => `<article class="home-favorite"><div class="home-favorite-copy"><p>${escapeHtml(item.content)}</p><small>来自「${escapeHtml(item.archiveName)}」</small></div><button class="secondary-button" type="button" data-favorite-delete="${escapeHtml(item.id)}" aria-label="删除收藏">删除</button></article>`).join('')
      : '<p class="home-empty">还没有收藏内容。</p>';
    const note = data.todayNote?.date === date ? data.todayNote.content : 'The butterfly counts not months but moments, and has time enough.';
    $('todayNote').textContent = note;
    $('todayNote').hidden = !note;
  }

  function updateFromHealthData() {
    const data = readData();
    const date = today();
    const food = (data.food || []).filter(record => record.date === date);
    state.water = food.reduce((sum, record) => sum + (Number(record.waterMl) || 0), 0);
    state.waterTarget = Math.max(1, Number(data.settings?.dietGoals?.waterMl) || 2000);
    state.meals = food.filter(record => record.category === '正餐').length;
    state.sleep = (data.sleep || []).filter(record => record.date === date)
      .reduce((sum, record) => sum + (Number(record.hours) || 0), 0);
    const joyRecords = (data.joy || []).filter(record => record.date === date);
    const joyMinutes = joyRecords.reduce((sum, record) => sum + (Number(record.durationMinutes) || 0), 0);
    state.joy = Math.min(1, Math.max(joyMinutes / 120, joyRecords.length / 12));
    state.bowel = (data.bowel || []).filter(record => record.date === date).length;
    const weights = (data.weight || []).filter(record => record.date === date);
    state.hasWeight = weights.length > 0;
    state.weight = Number(weights[0]?.value) || 0;
    renderShrineSvg();
    renderWidgets(data);
    const home = $('view-home');
    if (home.classList.contains('active') && !data.settings?.reduceMotion) canvas.start();
    else canvas.stop();
  }

  const canvas = new ShrineCanvas($('shrineCanvas'));
  renderShrineSvg();
  updateFromHealthData();
  const observer = new MutationObserver(updateFromHealthData);
  observer.observe($('view-home'), { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('petal-data-updated', updateFromHealthData);
  window.addEventListener('storage', event => {
    if (event.key === KEY) updateFromHealthData();
  });
  window.setInterval(updateFromHealthData, 60000);
})();
