/* ==========================================================================
   ULPF COMMAND CONSOLE — COMPLETE CLIENT ENGINE
   Midnight Ledger aesthetic, 6 Operational Views, & 120Hz Forensic Telemetry
   ========================================================================== */

(function () {
  'use strict';

  // ==========================================================================
  // 1. SOUND DESIGN (SYNTHETIC WEB AUDIO MECHANICAL TICKS & WATER RIPPLES)
  // ==========================================================================
  let soundEnabled = false;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
  }

  function playTickSound(pitch = 950, decay = 0.045) {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, audioCtx.currentTime + decay);

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + decay);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + decay);
    } catch (e) {
      console.warn('Audio tick error:', e);
    }
  }

  function playWaterRippleSound(isLight = false) {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const ripple = audioCtx.createOscillator();
      const rippleGain = audioCtx.createGain();

      osc.type = 'sine';
      ripple.type = 'sine';

      if (isLight) {
        // Ascending crystalline spring water droplet: 540Hz -> 1180Hz -> 880Hz
        osc.frequency.setValueAtTime(540, t);
        osc.frequency.exponentialRampToValueAtTime(1180, t + 0.11);
        osc.frequency.exponentialRampToValueAtTime(840, t + 0.45);

        ripple.frequency.setValueAtTime(1080, t);
        ripple.frequency.exponentialRampToValueAtTime(1760, t + 0.14);
        ripple.frequency.exponentialRampToValueAtTime(1320, t + 0.55);
      } else {
        // Descending deep water droplet: 1120Hz -> 620Hz -> 420Hz
        osc.frequency.setValueAtTime(1120, t);
        osc.frequency.exponentialRampToValueAtTime(620, t + 0.12);
        osc.frequency.exponentialRampToValueAtTime(420, t + 0.5);

        ripple.frequency.setValueAtTime(1680, t);
        ripple.frequency.exponentialRampToValueAtTime(940, t + 0.16);
        ripple.frequency.exponentialRampToValueAtTime(630, t + 0.6);
      }

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.048, t + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);

      rippleGain.gain.setValueAtTime(0.001, t);
      rippleGain.gain.linearRampToValueAtTime(0.024, t + 0.05);
      rippleGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      ripple.connect(rippleGain);
      rippleGain.connect(audioCtx.destination);

      osc.start(t);
      ripple.start(t);
      osc.stop(t + 0.6);
      ripple.stop(t + 0.7);
    } catch (e) {
      console.warn('Water ripple sound error:', e);
    }
  }

  const btnSoundToggle = document.getElementById('btnSoundToggle');
  const soundStatusText = document.getElementById('soundStatusText');

  if (btnSoundToggle) {
    btnSoundToggle.addEventListener('click', () => {
      initAudio();
      soundEnabled = !soundEnabled;
      btnSoundToggle.classList.toggle('active', soundEnabled);
      btnSoundToggle.title = soundEnabled ? 'Sound: On (Click to mute)' : 'Sound: Off (Click to turn on audio feedback)';
      if (soundStatusText) {
        soundStatusText.textContent = soundEnabled ? 'Sound: On' : 'Sound: Off';
      }
      if (soundEnabled) {
        playTickSound(1200, 0.06);
      }
    });
  }

  // ==========================================================================
  // 2. DIRECTIONAL ZERO-LAG WATER WAVE THEME CONTROLLER
  //    (Deep Vault Dark Theme ↔ Ice White Light Theme)
  //    Single button toggle: Moon (Dark) ↔ Sun (Light)
  // ==========================================================================
  const themeWaveCurtain = document.getElementById('themeWaveCurtain');
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  const themeLabelText = document.getElementById('themeLabelText');
  let isWaveAnimating = false;

  function getCurrentTheme() {
    const htmlEl = document.documentElement;
    const current = htmlEl.getAttribute('data-theme');
    return (current === 'ice-white') ? 'ice-white' : 'deep-vault';
  }

  function updateThemeButtonUI(theme) {
    if (!btnThemeToggle) return;
    const isLight = theme === 'ice-white';
    btnThemeToggle.setAttribute('data-current-theme', theme);
    btnThemeToggle.title = isLight
      ? 'Current: Light Mode (Ice White). Click for Dark Mode'
      : 'Current: Dark Mode (Deep Vault). Click for Light Mode';
    if (themeLabelText) {
      themeLabelText.textContent = isLight ? 'Light' : 'Dark';
    }
  }

  function switchThemeWithWave(targetTheme) {
    const htmlEl = document.documentElement;
    const currentTheme = getCurrentTheme();
    if (currentTheme === targetTheme || isWaveAnimating) return;

    isWaveAnimating = true;

    // Dark to Light -> wave sweeps from RIGHT to LEFT
    // Light to Dark -> wave sweeps from LEFT to RIGHT
    const isGoingToLight = targetTheme === 'ice-white';
    const isRTL = isGoingToLight;
    const waveDir = isRTL ? 'rtl' : 'ltr';

    htmlEl.setAttribute('data-wave-dir', waveDir);
    updateThemeButtonUI(targetTheme);

    try {
      localStorage.setItem('ulpf_theme', targetTheme);
    } catch (e) {
      // LocalStorage safeguard
    }

    playWaterRippleSound(isGoingToLight);

    if (themeWaveCurtain) {
      themeWaveCurtain.className = 'theme-wave-curtain';
      void themeWaveCurtain.offsetWidth;
      const waveClass = isRTL ? 'wave-rtl' : 'wave-ltr';
      themeWaveCurtain.classList.add('wave-active', waveClass);
    }

    if (document.startViewTransition) {
      htmlEl.classList.add('theme-switching');

      const transition = document.startViewTransition(() => {
        htmlEl.setAttribute('data-theme', targetTheme);
      });

      transition.finished.finally(() => {
        htmlEl.classList.remove('theme-switching');
        htmlEl.removeAttribute('data-wave-dir');
        if (themeWaveCurtain) {
          themeWaveCurtain.classList.remove('wave-active', 'wave-rtl', 'wave-ltr');
        }
        isWaveAnimating = false;
        // Redraw trace threads after theme styling settles
        setTimeout(drawConnectingThreads, 80);
      });
    } else {
      htmlEl.classList.add('theme-switching');
      setTimeout(() => {
        htmlEl.setAttribute('data-theme', targetTheme);
      }, 480);

      setTimeout(() => {
        htmlEl.classList.remove('theme-switching');
        htmlEl.removeAttribute('data-wave-dir');
        if (themeWaveCurtain) {
          themeWaveCurtain.classList.remove('wave-active', 'wave-rtl', 'wave-ltr');
        }
        isWaveAnimating = false;
        setTimeout(drawConnectingThreads, 80);
      }, 1080);
    }
  }

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const current = getCurrentTheme();
      const next = (current === 'ice-white') ? 'deep-vault' : 'ice-white';
      switchThemeWithWave(next);
    });
  }

  // Restore saved theme on startup (default: deep-vault dark theme)
  try {
    const saved = localStorage.getItem('ulpf_theme');
    if (saved === 'ice-white' || saved === 'deep-vault') {
      document.documentElement.setAttribute('data-theme', saved);
      updateThemeButtonUI(saved);
    } else {
      document.documentElement.setAttribute('data-theme', 'deep-vault');
      updateThemeButtonUI('deep-vault');
    }
  } catch (e) {
    updateThemeButtonUI('deep-vault');
  }

  // ==========================================================================
  // 3. MULTI-VIEW ROUTING CONTROLLER (6 Operational Screens)
  //    01 Overview, 02 Traceability, 03 AI Wizard, 04 Drift, 05 Hashchain, 06 Graph
  // ==========================================================================
  const viewNavButtons = document.querySelectorAll('.view-nav-item');
  const viewPanels = document.querySelectorAll('.view-panel');

  const routeViewMap = {
    'overview': 'view-overview',
    'traceability': 'view-traceability',
    'wizard': 'view-wizard',
    'drift': 'view-drift',
    'hashchain': 'view-hashchain',
    'graph': 'view-graph'
  };

  const viewIdToHash = {
    'view-overview': 'overview',
    'view-traceability': 'traceability',
    'view-wizard': 'wizard',
    'view-drift': 'drift',
    'view-hashchain': 'hashchain',
    'view-graph': 'graph'
  };

  function switchView(targetViewId, updateHash = true) {
    if (!targetViewId) return;

    // Toggle active state on view panels
    viewPanels.forEach((panel) => {
      const isActive = panel.id === targetViewId;
      panel.classList.toggle('active', isActive);
    });

    // Toggle active state on view navigation bar buttons
    viewNavButtons.forEach((btn) => {
      const isActive = btn.getAttribute('data-target-view') === targetViewId;
      btn.classList.toggle('active', isActive);
    });

    // Update URL hash if requested
    if (updateHash && viewIdToHash[targetViewId]) {
      history.replaceState(null, '', `#${viewIdToHash[targetViewId]}`);
    }

    playTickSound(820, 0.03);

    // If switching to traceability, recompute dynamic SVG threads
    if (targetViewId === 'view-traceability') {
      setTimeout(() => {
        drawConnectingThreads();
      }, 120);
    }

    // Scroll smoothly to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Bind click handlers to view navigation buttons
  viewNavButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetView = btn.getAttribute('data-target-view');
      switchView(targetView);
    });
  });

  // Handle URL hash routing on initial load and back/forward navigation
  function handleHashRoute() {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash && routeViewMap[hash]) {
      switchView(routeViewMap[hash], false);
    }
  }

  window.addEventListener('hashchange', handleHashRoute);
  handleHashRoute();

  // Cross-link buttons in views
  const btnQuickTrace = document.getElementById('btnQuickTrace');
  if (btnQuickTrace) {
    btnQuickTrace.addEventListener('click', () => {
      switchView('view-traceability');
    });
  }

  const btnExportLedger = document.getElementById('btnExportLedger');
  if (btnExportLedger) {
    btnExportLedger.addEventListener('click', () => {
      switchView('view-hashchain');
    });
  }


  // ==========================================================================
  // 5. SIGNATURE FEATURE: THE LEDGER SPINE CONTROLLER
  // ==========================================================================
  const spineRail = document.getElementById('spineRail');
  const spineTraveler = document.getElementById('spineTraveler');
  const spineNodes = document.querySelectorAll('.spine-node');
  let currentStageIndex = 0;
  const stageTops = [6, 20, 40, 60, 80, 96];

  const spineStageToView = [
    'view-overview',      // Stage 01: Collector
    'view-traceability',  // Stage 02: Raw Store
    'view-drift',         // Stage 03: Detector
    'view-wizard',        // Stage 04: Parser
    'view-traceability',  // Stage 05: Normalizer
    'view-graph'          // Stage 06: Router
  ];

  function updateSpineStage(index) {
    if (!spineTraveler) return;
    currentStageIndex = index;
    const isMobile = window.innerWidth <= 1280;

    spineNodes.forEach((node, idx) => {
      node.classList.toggle('active', idx === currentStageIndex);
    });

    if (isMobile) {
      const activeNode = spineNodes[currentStageIndex];
      if (activeNode) {
        spineTraveler.style.top = '2px';
        spineTraveler.style.left = `${activeNode.offsetLeft + 10}px`;
      }
    } else {
      spineTraveler.style.left = '1px';
      spineTraveler.style.top = `${stageTops[currentStageIndex]}%`;
    }
  }

  spineNodes.forEach((node, idx) => {
    node.addEventListener('click', () => {
      updateSpineStage(idx);
      playTickSound(700 + idx * 80, 0.035);
      if (spineStageToView[idx]) {
        switchView(spineStageToView[idx]);
      }
    });
  });

  // Ambient continuous spine progression
  setInterval(() => {
    const nextIdx = (currentStageIndex + 1) % spineNodes.length;
    updateSpineStage(nextIdx);
  }, 3800);

  // ==========================================================================
  // 6. UTC CLOCK & LIVE TELEMETRY SIMULATOR
  // ==========================================================================
  const utcClock = document.getElementById('utcClock');
  const telemetryEps = document.getElementById('telemetryEps');
  const kpiThroughput = document.getElementById('kpiThroughput');

  function updateClock() {
    const now = new Date();
    const h = String(now.getUTCHours()).padStart(2, '0');
    const m = String(now.getUTCMinutes()).padStart(2, '0');
    const s = String(now.getUTCSeconds()).padStart(2, '0');
    if (utcClock) utcClock.textContent = `${h}:${m}:${s}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  setInterval(() => {
    const base = 428900;
    const delta = Math.floor(Math.random() * 450) - 200;
    const formatted = (base + delta).toLocaleString('en-US');
    if (telemetryEps) telemetryEps.textContent = formatted;
    if (kpiThroughput) kpiThroughput.textContent = formatted;
  }, 2200);

  // ==========================================================================
  // 7. 3D APPLE / VISIONOS GLASS TILT & SPECULAR SHINE ENGINE
  // ==========================================================================
  function init3DGlassCards() {
    const glassCards = document.querySelectorAll('.glass-card-3d');

    glassCards.forEach((card) => {
      // Skip interactive graph canvas to prevent unwanted 3D perspective wobbling on mouse move
      if (card.classList.contains('graph-workspace-card')) return;

      let rect = null;

      card.addEventListener('mouseenter', () => {
        rect = card.getBoundingClientRect();
      });

      card.addEventListener('mousemove', (e) => {
        if (!rect) rect = card.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateY = ((mouseX - centerX) / centerX) * 3.5;
        const rotateX = -((mouseY - centerY) / centerY) * 3.5;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(4px)`;
        card.style.setProperty('--shine-x', `${mouseX}px`);
        card.style.setProperty('--shine-y', `${mouseY}px`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
        card.style.setProperty('--shine-x', '-300px');
        card.style.setProperty('--shine-y', '-300px');
        rect = null;
      });
    });
  }
  init3DGlassCards();

  // ==========================================================================
  // 8. HSM QUANTUM ENTROPY MINI-SCOPE
  // ==========================================================================
  const hsmCanvas = document.getElementById('hsmEntropyCanvas');
  if (hsmCanvas) {
    const hsmCtx = hsmCanvas.getContext('2d');
    let entropyPhase = 0;

    function renderEntropyStream() {
      hsmCtx.clearRect(0, 0, hsmCanvas.width, hsmCanvas.height);
      hsmCtx.strokeStyle = '#cc9166';
      hsmCtx.lineWidth = 1.2;
      hsmCtx.beginPath();

      entropyPhase += 0.09;
      const w = hsmCanvas.width;
      const h = hsmCanvas.height;

      for (let x = 0; x < w; x += 2) {
        const noise = (Math.random() - 0.5) * 3.5;
        const y = h / 2 + Math.sin((x * 0.35) + entropyPhase) * 4 + noise;
        if (x === 0) hsmCtx.moveTo(x, y);
        else hsmCtx.lineTo(x, y);
      }
      hsmCtx.stroke();
      requestAnimationFrame(renderEntropyStream);
    }
    requestAnimationFrame(renderEntropyStream);
  }

  // ==========================================================================
  // 9. LIVE INGESTION STREAM ENGINE (Overview View 01)
  // ==========================================================================
  const streamTableBody = document.getElementById('streamTableBody');
  const btnPauseResume = document.getElementById('btnPauseResume');
  const pauseResumeText = document.getElementById('pauseResumeText');
  const streamSearch = document.getElementById('streamSearch');
  let streamActive = true;

  // Monoline 14x14 format glyphs (Feature 7)
  const formatGlyphsMap = {
    'CEF': `<svg class="format-glyph format-glyph-cef active" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-label="CEF"><rect x="1.5" y="2" width="11" height="10" rx="2"></rect><line x1="5" y1="4.5" x2="5" y2="9.5"></line><line x1="9" y1="4.5" x2="9" y2="9.5"></line><line x1="1.5" y1="6" x2="12.5" y2="6"></line></svg>`,
    'Syslog': `<svg class="format-glyph format-glyph-syslog" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-label="Syslog"><rect x="1.5" y="2" width="11" height="10" rx="1.5"></rect><path d="M4 5.5l2 1.5-2 1.5"></path><line x1="8" y1="8.5" x2="10" y2="8.5"></line></svg>`,
    'JSON': `<svg class="format-glyph format-glyph-json" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-label="JSON"><path d="M4.5 2.5c-.8 0-1.5.7-1.5 1.5v1.5c0 .8-.7 1.5-1.5 1.5.8 0 1.5.7 1.5 1.5v1.5c0 .8.7 1.5 1.5 1.5"></path><path d="M9.5 2.5c.8 0 1.5.7 1.5 1.5v1.5c0 .8.7 1.5 1.5 1.5-.8 0-1.5.7-1.5 1.5v1.5c0 .8-.7 1.5-1.5 1.5"></path></svg>`,
    'XML': `<svg class="format-glyph format-glyph-xml" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-label="XML"><path d="M4.5 4L2 7l2.5 3"></path><path d="M9.5 4L12 7l-2.5 3"></path><line x1="8" y1="3" x2="6" y2="11"></line></svg>`,
    'LEEF': `<svg class="format-glyph format-glyph-leef" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-label="LEEF"><rect x="2" y="2" width="10" height="10" rx="1.5"></rect><line x1="4.5" y1="5" x2="9.5" y2="5"></line><line x1="4.5" y1="7.5" x2="8" y2="7.5"></line><line x1="4.5" y1="10" x2="9.5" y2="10"></line></svg>`
  };

  const mockLogSources = [
    { src: 'WinSec-Auditing-DC01', id: '4624', ocsf: 'Authentication (1001)', sev: 'info', name: 'Logon Success: svc_ledger', fmt: 'CEF' },
    { src: 'Cisco-ASA-Edge-01', id: '106023', ocsf: 'Network Activity (4001)', sev: 'info', name: 'TCP Outbound Permit: 443', fmt: 'Syslog' },
    { src: 'AWS-CloudTrail-IAM', id: 'AssumeRole', ocsf: 'Access Control (3002)', sev: 'info', name: 'AssumeRole: SecurityAudit', fmt: 'JSON' },
    { src: 'K8s-Audit-ProdCluster', id: 'PodExec', ocsf: 'Process Activity (1007)', sev: 'critical', name: 'Privileged Exec in Pod: auth-api', fmt: 'JSON' },
    { src: 'Nginx-Gateway-Ingress', id: 'HTTP-502', ocsf: 'HTTP Activity (4002)', sev: 'info', name: 'Gateway Timeout /v1/ledger', fmt: 'Syslog' },
    { src: 'CrowdStrike-Falcon', id: 'Detect-084', ocsf: 'Security Finding (2001)', sev: 'critical', name: 'Suspicious PowerShell EncodedCmd', fmt: 'LEEF' }
  ];

  function createStreamRow(item) {
    const tr = document.createElement('tr');
    tr.className = 'stream-row new-entry';
    const now = new Date();
    const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}.${String(now.getUTCMilliseconds()).padStart(3, '0')}`;
    const glyphSvg = formatGlyphsMap[item.fmt] || formatGlyphsMap['CEF'];

    tr.innerHTML = `
      <td class="td-mono">${timeStr}</td>
      <td class="td-mono">
        <span class="format-chip ${item.fmt === 'CEF' ? 'active' : ''}">${glyphSvg}${item.fmt}</span>
        ${item.src}
      </td>
      <td class="td-mono">${item.id}</td>
      <td>${item.ocsf}</td>
      <td>
        <span class="severity-chip ${item.sev}">${item.sev.toUpperCase()}</span>
      </td>
      <td class="td-mono" style="color: var(--accent-copper);">BLOCK OK</td>
    `;
    return tr;
  }

  if (streamTableBody) {
    mockLogSources.forEach((item) => {
      const row = createStreamRow(item);
      streamTableBody.appendChild(row);
    });
  }

  setInterval(() => {
    if (!streamActive || !streamTableBody) return;
    const item = mockLogSources[Math.floor(Math.random() * mockLogSources.length)];
    const row = createStreamRow(item);

    if (streamSearch && streamSearch.value.trim() !== '') {
      const term = streamSearch.value.toLowerCase();
      if (!item.src.toLowerCase().includes(term) && !item.id.toLowerCase().includes(term) && !item.ocsf.toLowerCase().includes(term)) {
        row.style.display = 'none';
      }
    }

    streamTableBody.insertBefore(row, streamTableBody.firstChild);

    if (streamTableBody.children.length > 12) {
      streamTableBody.removeChild(streamTableBody.lastChild);
    }
  }, 2400);

  if (btnPauseResume) {
    btnPauseResume.addEventListener('click', () => {
      streamActive = !streamActive;
      btnPauseResume.classList.toggle('active', !streamActive);
      if (pauseResumeText) {
        pauseResumeText.textContent = streamActive ? 'Pause Stream' : 'Resume Stream';
      }
      playTickSound(720, 0.04);
    });
  }

  if (streamSearch && streamTableBody) {
    streamSearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const rows = streamTableBody.querySelectorAll('tr');
      rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }

  // ==========================================================================
  // 10. TRACEABILITY WORKBENCH: DYNAMIC SVG CONNECTING THREADS (View 02)
  // ==========================================================================
  const threadCanvas = document.getElementById('traceThreadsCanvas');
  const traceSplitWrapper = document.getElementById('traceSplitWrapper');
  const btnToggleThreads = document.getElementById('btnToggleThreads');
  const threadToggleLabel = document.getElementById('threadToggleLabel');
  let threadsVisible = true;

  const fieldPairs = [
    { raw: 'rawLine-eventCode', ocsf: 'ocsf-code' },
    { raw: 'rawLine-time', ocsf: 'ocsf-time' },
    { raw: 'rawLine-user', ocsf: 'ocsf-user' },
    { raw: 'rawLine-domain', ocsf: 'ocsf-domain' },
    { raw: 'rawLine-logonType', ocsf: 'ocsf-logonType' },
    { raw: 'rawLine-srcIp', ocsf: 'ocsf-ip' },
    { raw: 'rawLine-workstation', ocsf: 'ocsf-workstation' },
    { raw: 'rawLine-hash', ocsf: 'ocsf-hash' }
  ];

  function drawConnectingThreads(activePair = null) {
    if (!threadCanvas || !traceSplitWrapper) return;
    if (!threadsVisible) {
      threadCanvas.innerHTML = '';
      return;
    }

    const wrapperRect = traceSplitWrapper.getBoundingClientRect();
    if (wrapperRect.width === 0 || wrapperRect.height === 0) return;

    let svgHtml = '';

    fieldPairs.forEach((pair) => {
      const rawEl = document.getElementById(pair.raw);
      const ocsfEl = document.getElementById(pair.ocsf);

      if (!rawEl || !ocsfEl) return;

      const rawRect = rawEl.getBoundingClientRect();
      const ocsfRect = ocsfEl.getBoundingClientRect();

      const startX = rawRect.right - wrapperRect.left;
      const startY = (rawRect.top + rawRect.bottom) / 2 - wrapperRect.top;
      const endX = ocsfRect.left - wrapperRect.left;
      const endY = (ocsfRect.top + ocsfRect.bottom) / 2 - wrapperRect.top;

      const deltaX = (endX - startX) * 0.55;
      const cp1X = startX + deltaX;
      const cp1Y = startY;
      const cp2X = endX - deltaX;
      const cp2Y = endY;

      const isCurrentActive = activePair && (activePair.raw === pair.raw || activePair.ocsf === pair.ocsf);
      const opacity = activePair ? (isCurrentActive ? 1.0 : 0.15) : 0.45;
      const strokeWidth = isCurrentActive ? 2.4 : 1.2;

      svgHtml += `
        <g opacity="${opacity}">
          <path class="thread-path ${isCurrentActive ? 'photon-active' : ''}" d="M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}" 
                style="stroke-width: ${strokeWidth}px;" />
          <circle class="thread-endpoint" cx="${startX}" cy="${startY}" r="${isCurrentActive ? 3.5 : 2}" />
          <circle class="thread-endpoint" cx="${endX}" cy="${endY}" r="${isCurrentActive ? 3.5 : 2}" />
        </g>
      `;
    });

    threadCanvas.innerHTML = svgHtml;
  }

  setTimeout(drawConnectingThreads, 300);
  window.addEventListener('resize', drawConnectingThreads);

  fieldPairs.forEach((pair) => {
    const rawEl = document.getElementById(pair.raw);
    const ocsfEl = document.getElementById(pair.ocsf);

    [rawEl, ocsfEl].forEach((el) => {
      if (!el) return;
      el.addEventListener('mouseenter', () => {
        if (rawEl) rawEl.classList.add('highlighted');
        if (ocsfEl) ocsfEl.classList.add('highlighted');
        drawConnectingThreads(pair);
        playTickSound(1020, 0.02);
      });

      el.addEventListener('mouseleave', () => {
        if (rawEl) rawEl.classList.remove('highlighted');
        if (ocsfEl) ocsfEl.classList.remove('highlighted');
        drawConnectingThreads(null);
      });
    });
  });

  if (btnToggleThreads) {
    btnToggleThreads.addEventListener('click', () => {
      threadsVisible = !threadsVisible;
      btnToggleThreads.classList.toggle('active', threadsVisible);
      if (threadToggleLabel) {
        threadToggleLabel.textContent = threadsVisible ? 'Threads: Active' : 'Threads: Off';
      }
      drawConnectingThreads();
      playTickSound(780, 0.04);
    });
  }

  // Traceability Explainer Cards (i buttons on Raw and Clean log cards)
  const btnRawLogInfo = document.getElementById('btnRawLogInfo');
  const rawLogInfoCard = document.getElementById('rawLogInfoCard');
  const btnCloseRawInfo = document.getElementById('btnCloseRawInfo');

  const btnOcsfLogInfo = document.getElementById('btnOcsfLogInfo');
  const ocsfLogInfoCard = document.getElementById('ocsfLogInfoCard');
  const btnCloseOcsfInfo = document.getElementById('btnCloseOcsfInfo');

  function toggleLogExplainer(card, btn, forceState) {
    if (!card) return;
    const isCurrentlyOpen = card.style.display !== 'none';
    const nextState = (typeof forceState === 'boolean') ? forceState : !isCurrentlyOpen;
    card.style.display = nextState ? 'block' : 'none';
    if (btn) btn.classList.toggle('active', nextState);
    playTickSound(nextState ? 960 : 680, 0.035);
    setTimeout(drawConnectingThreads, 40);
    setTimeout(drawConnectingThreads, 300);
  }

  if (btnRawLogInfo && rawLogInfoCard) {
    btnRawLogInfo.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLogExplainer(rawLogInfoCard, btnRawLogInfo);
    });
  }
  if (btnCloseRawInfo && rawLogInfoCard) {
    btnCloseRawInfo.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLogExplainer(rawLogInfoCard, btnRawLogInfo, false);
    });
  }

  if (btnOcsfLogInfo && ocsfLogInfoCard) {
    btnOcsfLogInfo.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLogExplainer(ocsfLogInfoCard, btnOcsfLogInfo);
    });
  }
  if (btnCloseOcsfInfo && ocsfLogInfoCard) {
    btnCloseOcsfInfo.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLogExplainer(ocsfLogInfoCard, btnOcsfLogInfo, false);
    });
  }


  // Fidelity Cutoff Slider in Traceability
  const customSlider = document.getElementById('customSlider');
  const sliderProgress = document.getElementById('sliderProgress');
  const sliderThumb = document.getElementById('sliderThumb');
  const sliderValDisplay = document.getElementById('sliderValDisplay');
  let isDraggingSlider = false;

  function updateSlider(clientX) {
    if (!customSlider) return;
    const rect = customSlider.getBoundingClientRect();
    let pos = (clientX - rect.left) / rect.width;
    pos = Math.max(0.05, Math.min(1.0, pos));
    const percentage = Math.round(pos * 100);

    if (sliderProgress) sliderProgress.style.width = `${percentage}%`;
    if (sliderThumb) sliderThumb.style.left = `${percentage}%`;
    if (sliderValDisplay) sliderValDisplay.textContent = `${percentage}%`;
  }

  if (customSlider) {
    customSlider.addEventListener('mousedown', (e) => {
      isDraggingSlider = true;
      updateSlider(e.clientX);
      playTickSound(900, 0.03);
    });

    window.addEventListener('mousemove', (e) => {
      if (isDraggingSlider) updateSlider(e.clientX);
    });

    window.addEventListener('mouseup', () => {
      if (isDraggingSlider) {
        isDraggingSlider = false;
        playTickSound(1100, 0.03);
      }
    });
  }

  // ==========================================================================
  // 11. AI INTEGRATOR ONBOARDING WIZARD CONTROLLER (View 03)
  //     Step 1 (Ingest) -> Step 2 (Diff Review) -> Step 3 (Wax Seal Commit)
  // ==========================================================================
  const wizardTabs = document.querySelectorAll('.wizard-step-tab');
  const wizardStep1 = document.getElementById('wizardStep1');
  const wizardStep2 = document.getElementById('wizardStep2');
  const wizardStep3 = document.getElementById('wizardStep3');
  const btnGoToStep2 = document.getElementById('btnGoToStep2');
  const btnBackToStep1 = document.getElementById('btnBackToStep1');
  const btnGoToStep3 = document.getElementById('btnGoToStep3');
  const btnBackToStep2 = document.getElementById('btnBackToStep2');
  const btnWizardWaxSeal = document.getElementById('btnWizardWaxSeal');
  const wizardSealBtnText = document.getElementById('wizardSealBtnText');
  const logDropzone = document.getElementById('logDropzone');
  const presetChips = document.querySelectorAll('.preset-chip');

  function setWizardStep(stepNum) {
    wizardTabs.forEach((tab) => {
      const tabStep = parseInt(tab.getAttribute('data-wizard-step'), 10);
      tab.classList.toggle('active', tabStep === stepNum);
    });

    if (wizardStep1) wizardStep1.style.display = stepNum === 1 ? 'block' : 'none';
    if (wizardStep2) {
      wizardStep2.style.display = stepNum === 2 ? 'block' : 'none';
      if (stepNum === 2) {
        setTimeout(activateWizardStep2Features, 60);
      }
    }
    if (wizardStep3) wizardStep3.style.display = stepNum === 3 ? 'block' : 'none';

    playTickSound(850 + stepNum * 70, 0.04);
  }

  wizardTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const step = parseInt(tab.getAttribute('data-wizard-step'), 10);
      setWizardStep(step);
    });
  });

  if (btnGoToStep2) btnGoToStep2.addEventListener('click', () => setWizardStep(2));
  if (btnBackToStep1) btnBackToStep1.addEventListener('click', () => setWizardStep(1));
  if (btnGoToStep3) btnGoToStep3.addEventListener('click', () => setWizardStep(3));
  if (btnBackToStep2) btnBackToStep2.addEventListener('click', () => setWizardStep(2));

  // Dropzone drag-and-drop simulation
  if (logDropzone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      logDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        logDropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      logDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        logDropzone.classList.remove('dragover');
      });
    });

    logDropzone.addEventListener('drop', (e) => {
      playTickSound(1150, 0.06);
      const dropText = logDropzone.querySelector('.dropzone-primary');
      if (dropText) {
        dropText.textContent = '✓ Payload Loaded: pan_os_threat_log.syslog (1.4 KB) — AST Parsing...';
      }
      setTimeout(() => {
        setWizardStep(2);
      }, 700);
    });

    logDropzone.addEventListener('click', () => {
      playTickSound(900, 0.04);
      const dropText = logDropzone.querySelector('.dropzone-primary');
      if (dropText) {
        dropText.textContent = '✓ Sample Ingested: Palo Alto PAN-OS Threat Log — AST Generated';
      }
    });
  }

  // Preset Source selector
  presetChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      presetChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      playTickSound(950, 0.03);

      const dropText = logDropzone ? logDropzone.querySelector('.dropzone-primary') : null;
      if (dropText) {
        dropText.textContent = `✓ Selected: ${chip.textContent} — Ready for AST Mapping`;
      }
    });
  });

  // Wizard Step 3: Signature Wax-Seal Stamp Confirmation
  if (btnWizardWaxSeal) {
    btnWizardWaxSeal.addEventListener('click', () => {
      if (btnWizardWaxSeal.classList.contains('sealed')) {
        btnWizardWaxSeal.classList.remove('sealed', 'stamping');
        if (wizardSealBtnText) wizardSealBtnText.textContent = 'Stamp & Commit to Ledger';
        playTickSound(650, 0.04);
        return;
      }

      btnWizardWaxSeal.classList.add('stamping');
      playTickSound(520, 0.08);

      setTimeout(() => {
        btnWizardWaxSeal.classList.add('sealed');
        btnWizardWaxSeal.classList.remove('stamping');
        if (wizardSealBtnText) {
          wizardSealBtnText.textContent = 'Committed to Consensus [Seal #891,242]';
        }
        playTickSound(1100, 0.05);

        // Prepend new block item to Overview chain list if present
        const kpiBlock = document.getElementById('kpiBlock');
        if (kpiBlock) kpiBlock.textContent = '#891,242';

        const chainBlocksList = document.getElementById('chainBlocksList');
        if (chainBlocksList) {
          const newBlock = document.createElement('div');
          newBlock.className = 'chain-block-item';
          newBlock.style.animation = 'streamSlideIn 0.4s var(--ease-expo-soft) forwards';
          newBlock.innerHTML = `
            <span class="block-folio-num">242</span>
            <div class="block-meta">
              <span class="block-hash">SHA-256: 0x8a92...e104</span>
              <span class="block-time">Block #891,242 · Palo Alto PAN-OS Mapped</span>
            </div>
            <span class="block-status-badge">SEALED</span>
          `;
          chainBlocksList.insertBefore(newBlock, chainBlocksList.firstChild);
        }
      }, 350);
    });
  }

  // ==========================================================================
  // 12. SCHEMA DRIFT DETECTION CONTROLLER (View 04)
  // ==========================================================================
  const driftSlider = document.getElementById('driftSlider');
  const driftProgress = document.getElementById('driftProgress');
  const driftThumb = document.getElementById('driftThumb');
  const driftValText = document.getElementById('driftValText');
  let isDraggingDriftSlider = false;

  function updateDriftSlider(clientX) {
    if (!driftSlider) return;
    const rect = driftSlider.getBoundingClientRect();
    let pos = (clientX - rect.left) / rect.width;
    pos = Math.max(0.1, Math.min(1.0, pos));
    const percentage = Math.round(pos * 100);

    if (driftProgress) driftProgress.style.width = `${percentage}%`;
    if (driftThumb) driftThumb.style.left = `${percentage}%`;
    if (driftValText) driftValText.textContent = `${percentage}%`;
  }

  if (driftSlider) {
    driftSlider.addEventListener('mousedown', (e) => {
      isDraggingDriftSlider = true;
      updateDriftSlider(e.clientX);
      playTickSound(900, 0.03);
    });

    window.addEventListener('mousemove', (e) => {
      if (isDraggingDriftSlider) updateDriftSlider(e.clientX);
    });

    window.addEventListener('mouseup', () => {
      if (isDraggingDriftSlider) {
        isDraggingDriftSlider = false;
        playTickSound(1050, 0.03);
      }
    });
  }

  // Calm 600ms Copper Pulse test button
  const btnTestPulseRow = document.getElementById('btnTestPulseRow');
  const driftRowOkta = document.getElementById('driftRowOkta');

  if (btnTestPulseRow && driftRowOkta) {
    btnTestPulseRow.addEventListener('click', () => {
      playTickSound(960, 0.05);
      driftRowOkta.classList.remove('drift-pulsing');
      void driftRowOkta.offsetWidth; // force reflow
      driftRowOkta.classList.add('drift-pulsing');

      setTimeout(() => {
        driftRowOkta.classList.remove('drift-pulsing');
      }, 650);
    });
  }

  // AI Re-Mapping Review Modal
  const btnReviewDrift = document.getElementById('btnReviewDrift');
  const remapModalBackdrop = document.getElementById('remapModalBackdrop');
  const btnCloseRemapModal = document.getElementById('btnCloseRemapModal');
  const btnRejectRemap = document.getElementById('btnRejectRemap');
  const btnAcceptRemap = document.getElementById('btnAcceptRemap');

  function openRemapModal() {
    if (remapModalBackdrop) {
      remapModalBackdrop.classList.add('active');
      playTickSound(940, 0.05);
    }
  }

  function closeRemapModal() {
    if (remapModalBackdrop) {
      remapModalBackdrop.classList.remove('active');
      playTickSound(640, 0.04);
    }
  }

  if (btnReviewDrift) btnReviewDrift.addEventListener('click', openRemapModal);
  if (btnCloseRemapModal) btnCloseRemapModal.addEventListener('click', closeRemapModal);
  if (btnRejectRemap) btnRejectRemap.addEventListener('click', closeRemapModal);
  if (remapModalBackdrop) {
    remapModalBackdrop.addEventListener('click', (e) => {
      if (e.target === remapModalBackdrop) closeRemapModal();
    });
  }

  if (btnAcceptRemap) {
    btnAcceptRemap.addEventListener('click', () => {
      playTickSound(1180, 0.07);
      closeRemapModal();

      // Resolve Okta Drift row to nominal steady status
      if (driftRowOkta) {
        driftRowOkta.classList.remove('drift-alerting');
        const statsEl = driftRowOkta.querySelector('.drift-row-stats');
        if (statsEl) {
          statsEl.innerHTML = `
            <span class="drift-stat-good">Translation Success: 99.98% (Updated & Sealed)</span>
            <span class="drift-stat-sub">AI Auto-Repair Applied: Commit #891,242</span>
          `;
        }
        const actionsEl = driftRowOkta.querySelector('.drift-row-actions');
        if (actionsEl) {
          actionsEl.innerHTML = `<span class="drift-status-badge" style="color: #2ecc71; border-color: rgba(46, 204, 113, 0.4);">HEALTHY</span>`;
        }
      }
    });
  }

  // ==========================================================================
  // 13. HASH-CHAIN TAMPER-EVIDENCE & SELF-HEAL CONTROLLER (View 05)
  // ==========================================================================
  const btnSimulateTamper = document.getElementById('btnSimulateTamper');
  const tamperBtnText = document.getElementById('tamperBtnText');
  const btnHealChain = document.getElementById('btnHealChain');
  const chainNode890 = document.getElementById('chainNode890');
  const blockHash890 = document.getElementById('blockHash890');
  const statusBadge890 = document.getElementById('statusBadge890');
  const fractureCrackLine = document.getElementById('fractureCrackLine');

  let isTampered = false;
  const originalHash890 = '0x4f12a9b3c801...e81c3d';
  const corruptedHash890 = '0xDEAD...BEEF7A';

  if (btnSimulateTamper) {
    btnSimulateTamper.addEventListener('click', () => {
      isTampered = !isTampered;

      if (isTampered) {
        // Trigger tamper attack
        playTickSound(440, 0.12);
        if (chainNode890) chainNode890.classList.add('tampered');
        if (blockHash890) {
          blockHash890.textContent = corruptedHash890;
          blockHash890.style.color = '#ff4757';
        }
        if (statusBadge890) {
          statusBadge890.textContent = 'TAMPER DETECTED: RECORD ALTERED!';
          statusBadge890.classList.add('tampered-tag');
        }
        if (fractureCrackLine) fractureCrackLine.classList.add('cracked');
        if (btnHealChain) btnHealChain.style.display = 'inline-flex';
        if (tamperBtnText) tamperBtnText.textContent = 'Simulating Hacker Attack (Chain Broken)';
        if (btnSimulateTamper) btnSimulateTamper.classList.add('active');
      } else {
        selfHealChain();
      }
    });
  }

  function selfHealChain() {
    isTampered = false;
    playTickSound(1200, 0.08);

    if (chainNode890) {
      chainNode890.classList.remove('tampered');
      chainNode890.style.transition = 'box-shadow 0.6s var(--ease-expo-soft), border-color 0.6s var(--ease-expo-soft)';
      chainNode890.style.borderColor = '#2ecc71';
      chainNode890.style.boxShadow = '0 0 28px rgba(46, 204, 113, 0.4)';
      setTimeout(() => {
        chainNode890.style.borderColor = '';
        chainNode890.style.boxShadow = '';
      }, 1200);
    }

    if (blockHash890) {
      blockHash890.textContent = originalHash890;
      blockHash890.style.color = '';
    }

    if (statusBadge890) {
      statusBadge890.textContent = 'UNTOUCHED & SEALED (RESTORED)';
      statusBadge890.classList.remove('tampered-tag');
    }

    if (fractureCrackLine) fractureCrackLine.classList.remove('cracked');
    if (btnHealChain) btnHealChain.style.display = 'none';
    if (tamperBtnText) tamperBtnText.textContent = 'Simulate Hacker Tampering Old Log';
    if (btnSimulateTamper) btnSimulateTamper.classList.remove('active');
  }

  if (btnHealChain) {
    btnHealChain.addEventListener('click', selfHealChain);
  }

  // ==========================================================================
  // 14. CORRELATION GRAPH & NODE INSPECTOR (View 06)
  // ==========================================================================
  const graphNodes = document.querySelectorAll('.graph-node-group');
  const nodeInspectorDrawer = document.getElementById('nodeInspectorDrawer');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');
  const drawerTitle = document.getElementById('drawerTitle');
  const drawerDesc = document.getElementById('drawerDesc');
  const drawerBadge = document.getElementById('drawerBadge');
  const dCorrelated = document.getElementById('dCorrelated');
  const dConfidence = document.getElementById('dConfidence');
  const dRisk = document.getElementById('dRisk');
  const btnTraceAttack = document.getElementById('btnTraceAttack');

  const nodeTelemetry = {
    'threat': {
      title: 'Hacker IP: 198.51.100.42',
      badge: 'EXTERNAL HACKER',
      desc: 'Known overseas hacking group. Caught trying to break through 4 perimeter office firewalls.',
      logs: '3,412',
      confidence: '99.9%',
      risk: '9.8 / 10',
      riskColor: '#ff4757'
    },
    'host1': {
      title: 'WKSTN-FIN-08 (Finance Laptop)',
      badge: 'INFECTED COMPUTER',
      desc: 'An employee laptop in Finance. Clicked a malicious link and established a secret connection to the hacker.',
      logs: '1,420',
      confidence: '99.6%',
      risk: '8.4 / 10',
      riskColor: '#ff6b6b'
    },
    'user': {
      title: 'Account: tirth.patel',
      badge: 'STOLEN USER ACCOUNT',
      desc: 'The hacker stole this employee\'s password and tried to give themselves administrator privileges.',
      logs: '892',
      confidence: '99.8%',
      risk: '8.9 / 10',
      riskColor: '#ff6b6b'
    },
    'target': {
      title: 'DC01-PROD.CORP (Main Server)',
      badge: 'PRIZE TARGET (MAIN SERVER)',
      desc: 'The central office server that controls all company computers. The hacker attempted a remote login.',
      logs: '6,840',
      confidence: '100%',
      risk: '9.9 / 10',
      riskColor: '#ff4757'
    },
    'proc': {
      title: 'mimikatz.exe',
      badge: 'PASSWORD THEFT TOOL',
      desc: 'A hacker tool caught attempting to steal other employees\' saved passwords from computer memory.',
      logs: '184',
      confidence: '99.2%',
      risk: '9.5 / 10',
      riskColor: '#ff4757'
    },
    'host2': {
      title: 'SQL-CLUSTER-02 (Customer Database)',
      badge: 'DATABASE VAULT',
      desc: 'Contains customer records and archives. The hacker was blocked before downloading any data.',
      logs: '4,102',
      confidence: '98.5%',
      risk: '7.2 / 10',
      riskColor: '#cc9166'
    }
  };

  graphNodes.forEach((node) => {
    node.addEventListener('click', () => {
      const nodeKey = node.getAttribute('data-node');
      const data = nodeTelemetry[nodeKey];

      if (data && nodeInspectorDrawer) {
        if (drawerTitle) drawerTitle.textContent = data.title;
        if (drawerBadge) drawerBadge.textContent = data.badge;
        if (drawerDesc) drawerDesc.textContent = data.desc;
        if (dCorrelated) dCorrelated.textContent = data.logs;
        if (dConfidence) dConfidence.textContent = data.confidence;
        if (dRisk) {
          dRisk.textContent = data.risk;
          dRisk.style.color = data.riskColor;
        }

        nodeInspectorDrawer.classList.add('active');
        playTickSound(980, 0.035);
      }
    });
  });

  if (btnCloseDrawer && nodeInspectorDrawer) {
    btnCloseDrawer.addEventListener('click', () => {
      nodeInspectorDrawer.classList.remove('active');
      playTickSound(650, 0.03);
    });
  }

  // Animate Attack Vector
  let isAttackAnimating = false;
  if (btnTraceAttack) {
    btnTraceAttack.addEventListener('click', () => {
      const attackEdges = document.querySelectorAll('.edge-attack');
      isAttackAnimating = !isAttackAnimating;

      attackEdges.forEach((edge) => {
        edge.classList.toggle('animated', isAttackAnimating);
      });

      btnTraceAttack.classList.toggle('active', isAttackAnimating);
      playTickSound(isAttackAnimating ? 1140 : 700, 0.05);

      const span = btnTraceAttack.querySelector('span');
      if (span) {
        span.textContent = isAttackAnimating ? 'Pause Attack Story' : 'Play Attack Step-by-Step';
      }
    });
  }

  // ==========================================================================
  // 15. DEFCON 1 EMERGENCY FORENSIC FREEZE
  // ==========================================================================
  const btnForensicFreeze = document.getElementById('btnForensicFreeze');
  const freezeBanner = document.getElementById('freezeBanner');
  const btnThaw = document.getElementById('btnThaw');
  const freezeStatusText = document.getElementById('freezeStatusText');
  let isFrozen = false;

  function setFreezeState(freeze) {
    isFrozen = freeze;
    if (freezeBanner) freezeBanner.classList.toggle('active', isFrozen);
    if (btnForensicFreeze) btnForensicFreeze.classList.toggle('active', isFrozen);
    if (freezeStatusText) freezeStatusText.textContent = isFrozen ? 'Frozen' : 'Freeze';

    playTickSound(isFrozen ? 420 : 880, 0.12);
  }

  if (btnForensicFreeze) {
    btnForensicFreeze.addEventListener('click', () => setFreezeState(!isFrozen));
  }
  if (btnThaw) {
    btnThaw.addEventListener('click', () => setFreezeState(false));
  }

  // ==========================================================================
  // 16. INTERACTIVE MERKLE TREE / ZKP INSPECTOR MODAL
  // ==========================================================================
  const merkleModalBackdrop = document.getElementById('merkleModalBackdrop');
  const btnCloseMerkleModal = document.getElementById('btnCloseMerkleModal');
  const ledgerBlocks = document.querySelectorAll('.ledger-chain-block, .chain-block-item');
  const btnRunZkProof = document.getElementById('btnRunZkProof');
  const zkConsoleBody = document.getElementById('zkConsoleBody');
  const zkStatusIndicator = document.getElementById('zkStatusIndicator');
  const zkBtnText = document.getElementById('zkBtnText');

  function openMerkleModal() {
    if (merkleModalBackdrop) {
      merkleModalBackdrop.classList.add('active');
      playTickSound(920, 0.05);
    }
  }

  function closeMerkleModal() {
    if (merkleModalBackdrop) {
      merkleModalBackdrop.classList.remove('active');
      playTickSound(640, 0.04);
    }
  }

  ledgerBlocks.forEach(b => b.addEventListener('click', openMerkleModal));
  if (btnCloseMerkleModal) btnCloseMerkleModal.addEventListener('click', closeMerkleModal);
  if (merkleModalBackdrop) {
    merkleModalBackdrop.addEventListener('click', (e) => {
      if (e.target === merkleModalBackdrop) closeMerkleModal();
    });
  }

  // ZK-SNARK proof execution simulation
  let zkRunning = false;
  if (btnRunZkProof) {
    btnRunZkProof.addEventListener('click', () => {
      if (zkRunning) return;
      zkRunning = true;
      if (zkBtnText) zkBtnText.textContent = 'Verifying Proof...';
      if (zkStatusIndicator) {
        zkStatusIndicator.textContent = '● GENERATING DIGITAL PROOF';
        zkStatusIndicator.style.color = 'var(--accent-copper)';
      }

      const steps = [
        '[00:00.08] Checking mathematical fingerprint against 1,024 bundled logs',
        '[00:00.18] Validating digital signatures without revealing confidential details',
        '[00:00.32] Verifying cryptographic link to Master Root 0x9a8e...d24b',
        '[00:00.45] PROOF COMPLETE: Mathematical guarantee matches Master Root',
        '✓ 100% AUTHENTIC & UNTAMPERED (Safe for Legal Audit)'
      ];

      if (zkConsoleBody) zkConsoleBody.innerHTML = '';
      steps.forEach((step, idx) => {
        setTimeout(() => {
          if (zkConsoleBody) {
            const div = document.createElement('div');
            div.className = idx === steps.length - 1 ? 'zk-line success' : 'zk-line highlight';
            div.textContent = step;
            zkConsoleBody.appendChild(div);
          }
          playTickSound(800 + idx * 80, 0.03);

          if (idx === steps.length - 1) {
            if (zkStatusIndicator) {
              zkStatusIndicator.textContent = '● PROOF VERIFIED: 100% AUTHENTIC';
              zkStatusIndicator.style.color = '#2ecc71';
            }
            if (zkBtnText) zkBtnText.textContent = 'Verified Authentic ✓';
            setTimeout(() => {
              zkRunning = false;
              if (zkBtnText) zkBtnText.textContent = 'Compute Digital Proof';
            }, 3000);
          }
        }, (idx + 1) * 260);
      });
    });
  }

  // ==========================================================================
  // ADDENDUM FEATURES (1 THROUGH 7)
  // ==========================================================================

  // --------------------------------------------------------------------------
  // FEATURE 4: Air-Gapped Deployment Status Badge (Header Toggle)
  // --------------------------------------------------------------------------
  const btnAirgapToggle = document.getElementById('btnAirgapToggle');
  const airgapStatusText = document.getElementById('airgapStatusText');

  function toggleAirgapMode() {
    if (!btnAirgapToggle) return;
    const isNowOffline = btnAirgapToggle.classList.toggle('offline-mode');
    if (airgapStatusText) {
      airgapStatusText.textContent = isNowOffline ? 'Local AI' : 'Cloud AI';
    }
    playTickSound(isNowOffline ? 640 : 960, 0.04);
  }

  if (btnAirgapToggle) {
    btnAirgapToggle.addEventListener('click', toggleAirgapMode);
  }

  // Keyboard shortcut demo hotkey: 'A' or 'a' (when not inside an input/textarea)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'a' || e.key === 'A') {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag !== 'input' && activeTag !== 'textarea') {
        toggleAirgapMode();
      }
    }
  });

  // --------------------------------------------------------------------------
  // FEATURE 3: Tiered / Cost-Aware Routing Diagram Live Counters
  // --------------------------------------------------------------------------
  const counterHotVal = document.getElementById('counterHotVal');
  const counterColdVal = document.getElementById('counterColdVal');

  if (counterHotVal && counterColdVal) {
    setInterval(() => {
      // Hot counter fluctuates gently around 1,204 events/sec
      const hotJitter = 1204 + Math.floor((Math.random() - 0.5) * 24);
      counterHotVal.textContent = hotJitter.toLocaleString();

      // Cold counter fluctuates gently around 18,900 events/min
      const coldJitter = 18900 + Math.floor((Math.random() - 0.5) * 50);
      counterColdVal.textContent = coldJitter.toLocaleString();
    }, 2100);
  }

  // --------------------------------------------------------------------------
  // FEATURE 6: Explainable NL Query Workbench (Traceability View)
  // --------------------------------------------------------------------------
  const nlQueryForm = document.getElementById('nlQueryForm');
  const nlQueryInput = document.getElementById('nlQueryInput');
  const nlAnswerCard = document.getElementById('nlAnswerCard');
  const nlAnswerText = document.getElementById('nlAnswerText');
  const nlCloseBtn = document.getElementById('nlCloseBtn');
  const nlViewRuleLink = document.getElementById('nlViewRuleLink');

  function handleNlQuerySubmit() {
    if (!nlAnswerCard) return;
    const query = (nlQueryInput ? nlQueryInput.value.trim() : '').toLowerCase();

    // Contextual answer generation based on user inquiry
    if (query.includes('ip') || query.includes('src')) {
      if (nlAnswerText) {
        nlAnswerText.innerHTML = `Original field <code class="nl-token">src=192.168.10.144</code> was translated into standard field <code class="nl-token">"src_endpoint.ip"</code> because this is the computer's network IP address where the action started.`;
      }
      if (nlViewRuleLink) {
        nlViewRuleLink.setAttribute('data-target-raw', 'rawLine-srcIp');
        nlViewRuleLink.setAttribute('data-target-ocsf', 'ocsf-ip');
      }
    } else if (query.includes('user') || query.includes('suser')) {
      if (nlAnswerText) {
        nlAnswerText.innerHTML = `Original field <code class="nl-token">suser=tirth.patel</code> was translated into standard field <code class="nl-token">"user.name"</code> because "suser" stands for source user (the employee logging into the computer).`;
      }
      if (nlViewRuleLink) {
        nlViewRuleLink.setAttribute('data-target-raw', 'rawLine-user');
        nlViewRuleLink.setAttribute('data-target-ocsf', 'ocsf-user');
      }
    } else {
      if (nlAnswerText) {
        nlAnswerText.innerHTML = `Original field <code class="nl-token">logonType=10</code> was translated into <code class="nl-token">"logon_type": "RemoteInteractive"</code> because in Windows, code 10 means someone logged in remotely from another computer (like using Remote Desktop).`;
      }
      if (nlViewRuleLink) {
        nlViewRuleLink.setAttribute('data-target-raw', 'rawLine-logonType');
        nlViewRuleLink.setAttribute('data-target-ocsf', 'ocsf-logonType');
      }
    }

    nlAnswerCard.style.display = 'block';
    playTickSound(1020, 0.04);
  }

  if (nlQueryForm) {
    nlQueryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleNlQuerySubmit();
    });
  }

  if (nlCloseBtn) {
    nlCloseBtn.addEventListener('click', () => {
      if (nlAnswerCard) nlAnswerCard.style.display = 'none';
      playTickSound(700, 0.025);
    });
  }

  if (nlViewRuleLink) {
    nlViewRuleLink.addEventListener('click', () => {
      const rawId = nlViewRuleLink.getAttribute('data-target-raw') || 'rawLine-logonType';
      const ocsfId = nlViewRuleLink.getAttribute('data-target-ocsf') || 'ocsf-logonType';

      const rawEl = document.getElementById(rawId);
      const ocsfEl = document.getElementById(ocsfId);

      if (rawEl && ocsfEl) {
        rawEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        rawEl.classList.add('highlighted');
        ocsfEl.classList.add('highlighted');

        drawConnectingThreads({ raw: rawId, ocsf: ocsfId });
        playTickSound(1180, 0.05);

        setTimeout(() => {
          rawEl.classList.remove('highlighted');
          ocsfEl.classList.remove('highlighted');
          drawConnectingThreads(null);
        }, 3200);
      }
    });
  }

  // --------------------------------------------------------------------------
  // FEATURES 1 & 2: Wizard Step 2 Per-Field Confidence Bars & Connecting Threads
  // --------------------------------------------------------------------------
  const wizardThreadsOverlay = document.getElementById('wizardThreadsOverlay');
  const wizardDiffContainer = document.getElementById('wizardDiffContainer');
  const btnReviewRow4 = document.getElementById('btnReviewRow4');

  const wizardFieldPairs = [
    { raw: 'wraw-line-1', ocsf: 'wocsf-line-1' },
    { raw: 'wraw-line-2', ocsf: 'wocsf-line-2' },
    { raw: 'wraw-line-3', ocsf: 'wocsf-line-3' },
    { raw: 'wraw-line-4', ocsf: 'wocsf-line-4' },
    { raw: 'wraw-line-5', ocsf: 'wocsf-line-5' }
  ];

  function activateWizardStep2Features() {
    // 1. Animate Per-Field Confidence Bars (staggered 60ms per row)
    const confidenceFills = document.querySelectorAll('.diff-confidence-bar-fill');
    confidenceFills.forEach((fill, idx) => {
      fill.style.width = '0%';
      setTimeout(() => {
        const targetWidth = fill.getAttribute('data-target-width') || '98%';
        fill.style.width = targetWidth;
        playTickSound(880 + idx * 40, 0.02);
      }, idx * 60);
    });

    // 2. Animate Copper Connecting Threads (only after confidence bars finish: ~660ms)
    const totalConfidenceDuration = (confidenceFills.length * 60) + 420;
    setTimeout(() => {
      drawWizardConnectingThreads();
    }, totalConfidenceDuration);
  }

  function drawWizardConnectingThreads() {
    if (!wizardThreadsOverlay || !wizardDiffContainer) return;
    const containerRect = wizardDiffContainer.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) return;

    let svgHtml = `
      <defs>
        <linearGradient id="wizardCopperThreadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ae9357" />
          <stop offset="40%" stop-color="#fff0cc" />
          <stop offset="70%" stop-color="#ae9357" />
          <stop offset="100%" stop-color="rgba(174, 147, 87, 0.15)" />
        </linearGradient>
      </defs>
    `;

    wizardFieldPairs.forEach((pair, idx) => {
      const rawEl = document.getElementById(pair.raw);
      const ocsfEl = document.getElementById(pair.ocsf);

      if (!rawEl || !ocsfEl) return;

      const rawRect = rawEl.getBoundingClientRect();
      const ocsfRect = ocsfEl.getBoundingClientRect();

      const startX = rawRect.right - containerRect.left;
      const startY = (rawRect.top + rawRect.bottom) / 2 - containerRect.top;
      const endX = ocsfRect.left - containerRect.left;
      const endY = (ocsfRect.top + ocsfRect.bottom) / 2 - containerRect.top;

      const deltaX = (endX - startX) * 0.55;
      const cp1X = startX + deltaX;
      const cp1Y = startY;
      const cp2X = endX - deltaX;
      const cp2Y = endY;

      const pathLength = Math.hypot(endX - startX, endY - startY) * 1.25;
      const delayMs = idx * 50;

      svgHtml += `
        <g class="wizard-thread-group" data-pair="${idx}">
          <path class="wizard-thread-path" 
                d="M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}" 
                style="stroke-dasharray: ${pathLength}; stroke-dashoffset: ${pathLength}; animation-delay: ${delayMs}ms;" />
          <circle cx="${startX}" cy="${startY}" r="2.5" fill="#ae9357" opacity="0.9" />
          <circle cx="${endX}" cy="${endY}" r="2.5" fill="#ae9357" opacity="0.9" />
        </g>
      `;
    });

    wizardThreadsOverlay.innerHTML = svgHtml;
    playTickSound(1150, 0.05);
  }

  window.addEventListener('resize', () => {
    if (wizardStep2 && wizardStep2.style.display !== 'none') {
      drawWizardConnectingThreads();
    }
  });

  if (btnReviewRow4) {
    btnReviewRow4.addEventListener('click', (e) => {
      e.stopPropagation();
      playTickSound(1100, 0.05);
      alert("AST Mapping Audit (Confidence 61.2%):\n\nField: 'proto' -> 'connection_info.protocol_name'\nRule: Fallback regex applied ('tcp' -> 'TCP').\nRecommendation: Confirm standard IANA transport protocol enum for RFC 793 compliance.");
    });
  }

  // --------------------------------------------------------------------------
  // FEATURE 5: 40-Event Rolling Anomaly Detection Strip (Schema Drift View)
  // --------------------------------------------------------------------------
  const anomalyDotsTrack = document.getElementById('anomalyDotsTrack');
  const anomalyPopoverCard = document.getElementById('anomalyPopoverCard');
  const popoverEventType = document.getElementById('popoverEventType');
  const popoverScoreVal = document.getElementById('popoverScoreVal');
  const popoverContributors = document.getElementById('popoverContributors');

  const anomalyEventPool = [
    { type: 'WinSec 4625 (Failed Logon)', score: '0.942', contributors: 'unusual dst_port (4444) + off-hours login (03:14 UTC)' },
    { type: 'AWS IAM CreateAccessKey', score: '0.887', contributors: 'unusual geohash (TOR Exit) + root privilege escalation' },
    { type: 'K8s Privileged Pod Exec', score: '0.965', contributors: 'service_account: cluster-admin + interactive bash' },
    { type: 'CrowdStrike Suspicious CobaltStrike', score: '0.978', contributors: 'beaconing interval (1500ms) + unnamed pipe' }
  ];

  let anomalyDotsData = [];

  function initAnomalyStrip() {
    if (!anomalyDotsTrack) return;
    anomalyDotsData = [];

    // Pre-populate 40 dots, placing 2 flagged anomalies at index 14 and index 31
    for (let i = 0; i < 40; i++) {
      if (i === 14) {
        anomalyDotsData.push({ isAnomaly: true, ...anomalyEventPool[0] });
      } else if (i === 31) {
        anomalyDotsData.push({ isAnomaly: true, ...anomalyEventPool[1] });
      } else {
        anomalyDotsData.push({ isAnomaly: false });
      }
    }

    renderAnomalyDots();
  }

  function renderAnomalyDots() {
    if (!anomalyDotsTrack) return;
    anomalyDotsTrack.innerHTML = '';

    anomalyDotsData.forEach((dot, index) => {
      const dotEl = document.createElement('div');
      dotEl.className = `anomaly-dot ${dot.isAnomaly ? 'flagged' : 'nominal'}`;
      dotEl.setAttribute('data-index', index);

      if (dot.isAnomaly) {
        dotEl.addEventListener('mouseenter', (e) => {
          showAnomalyPopover(e, dot);
          playTickSound(1050, 0.03);
        });

        dotEl.addEventListener('mouseleave', () => {
          hideAnomalyPopover();
        });
      }

      anomalyDotsTrack.appendChild(dotEl);
    });
  }

  function showAnomalyPopover(e, dot) {
    if (!anomalyPopoverCard) return;
    const trackRect = anomalyDotsTrack.getBoundingClientRect();
    const dotRect = e.target.getBoundingClientRect();

    if (popoverEventType) popoverEventType.textContent = dot.type;
    if (popoverScoreVal) popoverScoreVal.textContent = `${dot.score} / 1.000`;
    if (popoverContributors) popoverContributors.textContent = `Top contributors: ${dot.contributors}`;

    const offsetLeft = dotRect.left - trackRect.left - 130;
    const boundedLeft = Math.max(10, Math.min(trackRect.width - 300, offsetLeft));

    anomalyPopoverCard.style.left = `${boundedLeft}px`;
    anomalyPopoverCard.style.bottom = '52px';
    anomalyPopoverCard.style.display = 'block';
  }

  function hideAnomalyPopover() {
    if (anomalyPopoverCard) anomalyPopoverCard.style.display = 'none';
  }

  initAnomalyStrip();

  // Rolling stream: new dot enters right every 2s, oldest shifts out left
  setInterval(() => {
    if (!anomalyDotsTrack) return;

    // ~7% chance of introducing a new anomaly
    const isNewAnomaly = Math.random() < 0.07;
    const newDot = isNewAnomaly
      ? { isAnomaly: true, ...anomalyEventPool[Math.floor(Math.random() * anomalyEventPool.length)] }
      : { isAnomaly: false };

    anomalyDotsData.shift();
    anomalyDotsData.push(newDot);

    renderAnomalyDots();
  }, 2000);

  // ==========================================================================
  // ADDENDUM: EXPLAIN MODE, WELCOME OVERLAY, SPOTLIGHT TOUR & JARGON GLOSSARY
  // ==========================================================================

  // 1. Explain Mode Global Toggle
  let explainModeActive = false;
  const btnExplainToggle = document.getElementById('btnExplainToggle');
  const explainStatusText = document.getElementById('explainStatusText');

  function setExplainMode(active) {
    explainModeActive = active;
    document.body.classList.toggle('explain-active', explainModeActive);

    if (btnExplainToggle) {
      btnExplainToggle.classList.toggle('active', explainModeActive);
    }
    if (explainStatusText) {
      explainStatusText.textContent = explainModeActive ? 'Explain: On' : 'Explain';
    }

    playTickSound(explainModeActive ? 920 : 680, 0.04);
  }

  if (btnExplainToggle) {
    btnExplainToggle.addEventListener('click', () => {
      setExplainMode(!explainModeActive);
    });
  }

  // 2. Central Glossary Tooltip
  const GLOSSARY = {
    ocsf: "A shared, standard format so logs from different companies' tools can all be compared the same way.",
    ast: "A structured breakdown of the raw log so a computer can read its parts individually.",
    cve: "A public ID number for a known security vulnerability.",
    leef: "A log event format developed by IBM QRadar for security intelligence.",
    cef: "Common Event Format — an older log format popular on enterprise firewalls.",
    drift: "When a log source changes its layout or fields without warning, breaking old parsers.",
    "hash-chain": "A digital record book where each page locks to the previous one, making any edits impossible to hide.",
    merkle: "A cryptographic tree of digital signatures that mathematically verifies data without exposing the contents.",
    tenant: "An isolated enterprise or customer department operating inside the shared security platform.",
    "isolation-forest": "An AI model that isolates weird or unusual network behaviors from normal day-to-day traffic."
  };

  const glossaryTooltip = document.getElementById('glossaryTooltip');
  const glossaryTerm = document.getElementById('glossaryTerm');
  const glossaryDef = document.getElementById('glossaryDef');

  function showGlossaryTooltip(targetEl, termKey) {
    if (!glossaryTooltip || !termKey || !GLOSSARY[termKey]) return;

    glossaryTerm.textContent = termKey.toUpperCase();
    glossaryDef.textContent = GLOSSARY[termKey];

    const rect = targetEl.getBoundingClientRect();
    const tooltipWidth = 240;
    let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    left = Math.max(12, Math.min(window.innerWidth - tooltipWidth - 12, left));

    let top = rect.top - 70;
    if (top < 10) {
      top = rect.bottom + 8;
    }

    glossaryTooltip.style.left = `${left}px`;
    glossaryTooltip.style.top = `${top}px`;
    glossaryTooltip.classList.add('visible');
  }

  function hideGlossaryTooltip() {
    if (glossaryTooltip) {
      glossaryTooltip.classList.remove('visible');
    }
  }

  // Attach hover and click to all .term-explain elements
  document.querySelectorAll('.term-explain').forEach((el) => {
    const term = el.getAttribute('data-term') || el.textContent.trim().toLowerCase();

    el.addEventListener('mouseenter', () => {
      if (explainModeActive) {
        showGlossaryTooltip(el, term);
      }
    });

    el.addEventListener('mouseleave', () => {
      hideGlossaryTooltip();
    });

    el.addEventListener('click', (e) => {
      if (explainModeActive) {
        e.stopPropagation();
        showGlossaryTooltip(el, term);
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.term-explain')) {
      hideGlossaryTooltip();
    }
  });

  // 3. Welcome Modal (#4)
  const welcomeModalOverlay = document.getElementById('welcomeModalOverlay');
  const btnWelcomeClose = document.getElementById('btnWelcomeClose');
  const btnWelcomeDismiss = document.getElementById('btnWelcomeDismiss');
  const btnWelcomeStartTour = document.getElementById('btnWelcomeStartTour');
  const chkWelcomeDontShow = document.getElementById('chkWelcomeDontShow');
  const btnHelpTour = document.getElementById('btnHelpTour');

  function showWelcomeModal() {
    if (welcomeModalOverlay) {
      welcomeModalOverlay.style.display = 'flex';
      playTickSound(780, 0.05);
    }
  }

  function hideWelcomeModal(savePreference = true) {
    if (!welcomeModalOverlay) return;
    welcomeModalOverlay.style.display = 'none';

    if (savePreference && chkWelcomeDontShow && chkWelcomeDontShow.checked) {
      try {
        localStorage.setItem('ulpf_welcome_dismissed', 'true');
      } catch (e) {
        // LocalStorage safeguard
      }
    }
  }

  if (btnWelcomeClose) {
    btnWelcomeClose.addEventListener('click', () => hideWelcomeModal(true));
  }
  if (btnWelcomeDismiss) {
    btnWelcomeDismiss.addEventListener('click', () => hideWelcomeModal(true));
  }
  if (welcomeModalOverlay) {
    welcomeModalOverlay.addEventListener('click', (e) => {
      if (e.target === welcomeModalOverlay) {
        hideWelcomeModal(true);
      }
    });
  }

  if (btnHelpTour) {
    btnHelpTour.addEventListener('click', () => {
      showWelcomeModal();
    });
  }

  // Auto-show on first visit
  setTimeout(() => {
    try {
      const dismissed = localStorage.getItem('ulpf_welcome_dismissed');
      if (dismissed !== 'true') {
        showWelcomeModal();
      }
    } catch (e) {
      showWelcomeModal();
    }
  }, 450);

  // 4. Guided Tour Controller (#5)
  const tourSpotlightBox = document.getElementById('tourSpotlightBox');
  const tourCalloutCard = document.getElementById('tourCalloutCard');
  const tourStepIndicator = document.getElementById('tourStepIndicator');
  const tourCardTitle = document.getElementById('tourCardTitle');
  const tourCardDesc = document.getElementById('tourCardDesc');
  const btnTourBack = document.getElementById('btnTourBack');
  const btnTourNext = document.getElementById('btnTourNext');
  const tourNextText = document.getElementById('tourNextText');
  const btnTourSkip = document.getElementById('btnTourSkip');
  const btnTourSkipText = document.getElementById('btnTourSkipText');

  let currentTourStep = 0;
  let tourActive = false;

  const tourSteps = [
    {
      view: 'view-overview',
      targetSelector: '#consoleViewNav',
      title: 'How Logs Flow (6 Simple Steps)',
      desc: 'These tabs let you follow a security log from when it leaves a computer to when it is permanently locked in our vault.'
    },
    {
      view: 'view-overview',
      targetSelector: '.stream-table-wrap',
      title: 'Live Activity Stream',
      desc: 'This table shows security events arriving in real time right now from company laptops, servers, and firewalls.'
    },
    {
      view: 'view-wizard',
      targetSelector: '#wizardStep1',
      title: 'AI Log Translator',
      desc: 'Watch our AI learn a brand-new device format in seconds — instead of a programmer spending weeks writing rules by hand.'
    },
    {
      view: 'view-hashchain',
      targetSelector: '#chainedLedgerVisualizer',
      title: 'Tamper-Proof Record Book',
      desc: 'Every log bundle is sealed with an unbreakable digital fingerprint. If anyone ever alters an old log, the system catches it instantly.'
    }
  ];

  function startGuidedTour() {
    hideWelcomeModal(true);
    setExplainMode(true); // Auto-enable explain mode so evaluators see annotations
    tourActive = true;
    currentTourStep = 0;
    renderTourStep();
  }

  function stopGuidedTour() {
    tourActive = false;
    if (tourSpotlightBox) tourSpotlightBox.classList.remove('active');
    if (tourCalloutCard) tourCalloutCard.style.display = 'none';
  }

  function renderTourStep() {
    if (!tourActive || currentTourStep < 0 || currentTourStep >= tourSteps.length) {
      stopGuidedTour();
      return;
    }

    const step = tourSteps[currentTourStep];

    if (step.view) {
      switchView(step.view);
    }

    setTimeout(() => {
      positionSpotlightAndCard(step);
    }, 180);
  }

  function positionSpotlightAndCard(step) {
    const target = document.querySelector(step.targetSelector);
    if (!target) {
      stopGuidedTour();
      return;
    }

    const rect = target.getBoundingClientRect();
    const pad = 8;
    const sLeft = Math.max(0, rect.left - pad);
    const sTop = Math.max(0, rect.top - pad);
    const sWidth = Math.min(window.innerWidth - sLeft, rect.width + pad * 2);
    const sHeight = Math.min(window.innerHeight - sTop, rect.height + pad * 2);

    if (tourSpotlightBox) {
      tourSpotlightBox.style.left = `${sLeft}px`;
      tourSpotlightBox.style.top = `${sTop}px`;
      tourSpotlightBox.style.width = `${sWidth}px`;
      tourSpotlightBox.style.height = `${sHeight}px`;
      tourSpotlightBox.classList.add('active');
    }

    if (tourStepIndicator) tourStepIndicator.textContent = `Step ${currentTourStep + 1} of ${tourSteps.length}`;
    if (tourCardTitle) tourCardTitle.textContent = step.title;
    if (tourCardDesc) tourCardDesc.textContent = step.desc;

    if (btnTourBack) {
      btnTourBack.style.display = currentTourStep > 0 ? 'inline-flex' : 'none';
    }
    if (tourNextText) {
      tourNextText.textContent = currentTourStep === tourSteps.length - 1 ? 'Finish Tour ✓' : 'Next →';
    }

    if (tourCalloutCard) {
      tourCalloutCard.style.display = 'block';

      const cardWidth = 340;
      const cardHeight = 180;
      let cardLeft = sLeft + (sWidth / 2) - (cardWidth / 2);
      let cardTop = sTop + sHeight + 16;

      if (cardTop + cardHeight > window.innerHeight - 20) {
        cardTop = Math.max(16, sTop - cardHeight - 16);
      }
      cardLeft = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, cardLeft));

      tourCalloutCard.style.left = `${cardLeft}px`;
      tourCalloutCard.style.top = `${cardTop}px`;
    }

    playTickSound(840 + currentTourStep * 50, 0.035);
  }

  if (btnWelcomeStartTour) {
    btnWelcomeStartTour.addEventListener('click', () => {
      startGuidedTour();
    });
  }

  if (btnTourNext) {
    btnTourNext.addEventListener('click', () => {
      if (currentTourStep < tourSteps.length - 1) {
        currentTourStep++;
        renderTourStep();
      } else {
        stopGuidedTour();
      }
    });
  }

  if (btnTourBack) {
    btnTourBack.addEventListener('click', () => {
      if (currentTourStep > 0) {
        currentTourStep--;
        renderTourStep();
      }
    });
  }

  if (btnTourSkip) btnTourSkip.addEventListener('click', stopGuidedTour);
  if (btnTourSkipText) btnTourSkipText.addEventListener('click', stopGuidedTour);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tourActive) {
      stopGuidedTour();
    }
  });

  window.addEventListener('resize', () => {
    if (tourActive) {
      positionSpotlightAndCard(tourSteps[currentTourStep]);
    }
  });

})();
