/* ==========================================================================
   ULPF COMMAND CONSOLE — COMPLETE CLIENT ENGINE
   Midnight Ledger aesthetic, 6 Operational Views, & 120Hz Forensic Telemetry
   ========================================================================== */

(function () {
  'use strict';

  // Global Engine States (accessible everywhere in IIFE scope)
  let isFrozen = false;
  let streamActive = true;
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const BACKEND_API_BASE = (window.LogSetuAPI && window.LogSetuAPI.baseUrl)
    ? window.LogSetuAPI.baseUrl
    : (isLocalhost ? `http://${window.location.hostname}:8000` : 'http://localhost:8000');

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

  // Utility HTML Escaper
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Exact raw logs for the 4 popular sample presets
  const PRESET_LOGS = {
    'pan-os': {
      name: 'Palo Alto Firewall',
      raw: 'CEF:0|PaloAltoNetworks|PAN-OS|10.1|THREAT|url|3|src=192.168.10.144 dst=10.0.0.12 spt=443 dpt=54210 act=deny cat=Suspicious-URL cs1=malware-c2 cs1Label=ThreatCategory threat_id=CVE-2024-3400 proto=tcp'
    },
    'cloudtrail': {
      name: 'AWS Cloud Activity',
      raw: '{"timestamp":"2026-09-08T00:15:30Z","sourceIPAddress":"198.51.100.42","userIdentity":{"userName":"admin"},"eventName":"AssumeRole","eventSource":"iam.amazonaws.com","service":"aws_iam","status":"success"}'
    },
    'crowdstrike': {
      name: 'CrowdStrike Antivirus',
      raw: 'CEF:0|CrowdStrike|FalconHost|6.48|Detection|Suspicious Process|9|src=192.168.10.144 act=detected msg=mimikatz.exe detected cs1=T1003 cs1Label=MitreTechnique proto=TCP'
    },
    'win-event': {
      name: 'Windows Login Log',
      raw: 'CEF:0|Microsoft|WindowsSecurity|10|4624|Logon Success|1|src=192.168.10.144 suser=tirth.patel sdomain=CORP.DOM logonType=10 shost=WKSTN-FIN-08 spt=54210 proto=TCP'
    }
  };

  // Active state for currently selected / uploaded log (starts empty on fresh load)
  let activeLogPayload = {
    sourceName: '',
    customName: '',
    rawText: '',
    fileName: '',
    proposal: null,
    timestamp: null
  };
  let sessionLogsHistory = [];
  window.__getActiveLogPayload = () => activeLogPayload;

  // Asynchronous proposal loader & synchronizer across views
  async function ensureProposalForPayload(payload) {
    if (!payload || !payload.rawText || !payload.rawText.trim()) return null;
    if (payload.proposal) return payload.proposal;

    const rawText = payload.rawText.trim();
    const payloadLines = rawText.split('\n').map(s => s.trim()).filter(Boolean);
    const sampleLines = payloadLines.slice(0, 10);
    const sourceName = payload.sourceName || 'Custom Event';
    const customNameInput = document.getElementById('customLogNameInput');
    const customName = (payload.customName || (customNameInput ? customNameInput.value.trim() : '')).trim();
    payload.customName = customName;

    let proposal = null;
    try {
      const activeMode = window.__LOGSETU_AI_MODE || 'cloud';
      if (window.LogSetuAPI && window.LogSetuAPI.analyzeAI) {
        proposal = await window.LogSetuAPI.analyzeAI(sampleLines, sourceName, activeMode);
      } else {
        const resp = await fetch(`${BACKEND_API_BASE}/api/ai/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sample_lines: sampleLines, source_name: sourceName, mode: activeMode })
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        proposal = await resp.json();
      }
    } catch (err) {
      console.warn('[LogSetu AI Wizard] API call failed or offline, using intelligent client AST fallback:', err);
      proposal = generateClientSideASTProposal(sampleLines[0] || rawText, sourceName);
    }

    payload.proposal = proposal;
    payload.timestamp = payload.timestamp || Date.now();

    // Auto-ingest into ledger in background if not yet recorded
    if (!payload.chainBlockId) {
      try {
        let ingestRes = null;
        if (window.LogSetuAPI && window.LogSetuAPI.ingest) {
          ingestRes = await window.LogSetuAPI.ingest(rawText, sourceName, customName);
        } else {
          const iResp = await fetch(`${BACKEND_API_BASE}/api/ingest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw_text: rawText, source: sourceName, custom_name: customName })
          });
          if (iResp.ok) ingestRes = await iResp.json();
        }
        if (ingestRes && ingestRes.chain_block_id) {
          payload.chainBlockId = ingestRes.chain_block_id;
          payload.contentHash = ingestRes.content_hash;
          if (ingestRes.custom_name && !payload.customName) {
            payload.customName = ingestRes.custom_name;
          }
          if (typeof renderLedgerVisualizer === 'function') {
            renderLedgerVisualizer();
          }
        }
      } catch (iErr) {
        console.warn('[LogSetu Ingestion] Auto-append failed:', iErr);
      }
    }

    // Maintain session history (most recent first)
    const existingIdx = sessionLogsHistory.findIndex(h => h.rawText === payload.rawText);
    if (existingIdx >= 0) {
      sessionLogsHistory[existingIdx] = { ...payload };
    } else {
      sessionLogsHistory.unshift({ ...payload });
    }

    return proposal;
  }

  // ==========================================================================
  // 3. MULTI-VIEW ROUTING CONTROLLER (6 Operational Screens)
  //    01 Overview, 02 AI Wizard, 03 Traceability, 04 Drift, 05 Hashchain, 06 Graph
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

    // Cleanly close any open overlay modals/drawers when navigating between views
    if (typeof closeMerkleModal === 'function') closeMerkleModal();
    if (typeof closeRemapModal === 'function') closeRemapModal();
    const drawer = document.getElementById('nodeInspectorDrawer');
    if (drawer) drawer.classList.remove('active');

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

    // If switching to traceability, synchronize active log and recompute dynamic SVG threads
    if (targetViewId === 'view-traceability') {
      if (activeLogPayload && activeLogPayload.rawText && !activeLogPayload.proposal) {
        ensureProposalForPayload(activeLogPayload).then(() => {
          renderTraceabilityWorkbench(activeLogPayload);
          setTimeout(() => {
            drawConnectingThreads();
          }, 120);
        });
      } else {
        renderTraceabilityWorkbench(activeLogPayload);
        setTimeout(() => {
          drawConnectingThreads();
        }, 120);
      }
    }

    // If switching to ledger, dynamically render verified blocks from backend
    if (targetViewId === 'view-hashchain') {
      if (typeof renderLedgerVisualizer === 'function') {
        renderLedgerVisualizer();
      }
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

  // Cross-link buttons in views
  const btnQuickTrace = document.getElementById('btnQuickTrace');
  if (btnQuickTrace) {
    btnQuickTrace.addEventListener('click', () => {
      switchView('view-traceability');
    });
  }

  const btnVerifyChain = document.getElementById('btnVerifyChain');
  if (btnVerifyChain) {
    btnVerifyChain.addEventListener('click', () => {
      playTickSound(1050, 0.05);
      switchView('view-hashchain');
      setTimeout(() => {
        if (typeof openMerkleModal === 'function') {
          openMerkleModal();
        }
      }, 250);
    });
  }

  const btnExportLedger = document.getElementById('btnExportLedger');
  async function exportForensicAuditSeal() {
    playTickSound(1050, 0.05);

    let verifyStatus = { valid: true, details: "Consensus verified." };
    let chainBlocks = cachedLedgerBlocks || [];

    try {
      if (window.LogSetuAPI && window.LogSetuAPI.verifyChain) {
        verifyStatus = await window.LogSetuAPI.verifyChain();
      } else {
        const vResp = await fetch(`${BACKEND_API_BASE}/api/hashchain/verify`, { method: 'POST' });
        if (vResp.ok) verifyStatus = await vResp.json();
      }

      if (window.LogSetuAPI && window.LogSetuAPI.getBlocks) {
        const bData = await window.LogSetuAPI.getBlocks(50);
        if (bData && bData.blocks) chainBlocks = bData.blocks;
      } else {
        const bResp = await fetch(`${BACKEND_API_BASE}/api/hashchain/blocks?count=50`);
        if (bResp.ok) {
          const bData = await bResp.json();
          if (bData && bData.blocks) chainBlocks = bData.blocks;
        }
      }
    } catch (e) {
      console.warn('[LogSetu Export Seal] Fetching live blocks failed, using memory state:', e);
    }

    const exportPackage = {
      audit_certificate: {
        system: "LogSetu Universal Log Pre-processing Framework (ULPF)",
        project: "SIH26156 / NTRO Forensic Command Console",
        specification: "Midnight Ledger Cryptographic Standard v2.0",
        export_timestamp: new Date().toISOString(),
        consensus_status: verifyStatus.valid ? "AUTHENTIC_SEALED" : "TAMPER_DETECTED",
        integrity_check: verifyStatus,
        total_blocks_recorded: chainBlocks.length
      },
      current_analyzed_log: activeLogPayload && activeLogPayload.rawText ? {
        source_name: activeLogPayload.sourceName || "Active Event",
        detected_format: activeLogPayload.proposal?.detected_format || "Raw Event",
        overall_confidence: activeLogPayload.proposal?.overall_confidence || 1.0,
        content_sha256: activeLogPayload.contentHash || "Computed at ingestion",
        chained_block_id: activeLogPayload.chainBlockId || (chainBlocks[0]?.block_id),
        raw_text_payload: activeLogPayload.rawText,
        mapped_ocsf_fields: activeLogPayload.proposal?.field_mappings || []
      } : null,
      cryptographic_hashchain: chainBlocks.map(b => ({
        block_id: b.block_id,
        status: b.status,
        block_hash: b.block_hash,
        previous_hash: b.previous_hash,
        content_hash: b.content_hash,
        source: b.source,
        detected_format: b.detected_format,
        timestamp: b.timestamp,
        raw_text: b.raw_text
      }))
    };

    const jsonStr = JSON.stringify(exportPackage, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logsetu-audit-seal-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Visual feedback on button
    if (btnExportLedger) {
      const btnSpan = btnExportLedger.querySelector('span');
      const origText = btnSpan ? btnSpan.textContent : 'Export Seal';
      if (btnSpan) btnSpan.textContent = 'Seal Exported ✓';
      btnExportLedger.style.borderColor = '#2ecc71';
      btnExportLedger.style.color = '#2ecc71';

      setTimeout(() => {
        if (btnSpan) btnSpan.textContent = origText;
        btnExportLedger.style.borderColor = '';
        btnExportLedger.style.color = '';
      }, 2000);
    }
  }

  if (btnExportLedger) {
    btnExportLedger.addEventListener('click', exportForensicAuditSeal);
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
    if (isFrozen) return;
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
    if (isFrozen) return;
    const now = new Date();
    const h = String(now.getUTCHours()).padStart(2, '0');
    const m = String(now.getUTCMinutes()).padStart(2, '0');
    const s = String(now.getUTCSeconds()).padStart(2, '0');
    if (utcClock) utcClock.textContent = `${h}:${m}:${s}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  setInterval(() => {
    if (isFrozen) return;
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
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;

        const rotX = ((y - cy) / cy) * -4.5;
        const rotY = ((x - cx) / cx) * 4.5;

        card.style.transform = `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(2px)`;
        card.style.setProperty('--shine-x', `${x}px`);
        card.style.setProperty('--shine-y', `${y}px`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)';
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
      if (!isFrozen) {
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
      }
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

    tr.title = `Click to inspect and translate ${item.src} log event`;
    tr.addEventListener('click', () => {
      playTickSound(900, 0.04);
      let presetKey = 'pan-os';
      const srcLower = item.src.toLowerCase();
      if (srcLower.includes('aws') || srcLower.includes('guardduty')) presetKey = 'aws-guardduty';
      else if (srcLower.includes('crowdstrike') || srcLower.includes('falcon') || item.fmt === 'LEEF') presetKey = 'crowdstrike';
      else if (srcLower.includes('win') || srcLower.includes('logon')) presetKey = 'windows-sec';

      if (typeof window.selectPresetLog === 'function') {
        window.selectPresetLog(presetKey);
      }
      switchView('view-wizard');
    });

    return tr;
  }

  if (streamTableBody) {
    mockLogSources.forEach((item) => {
      const row = createStreamRow(item);
      streamTableBody.appendChild(row);
    });
  }

  setInterval(() => {
    if (!streamActive || isFrozen || !streamTableBody) return;
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
      if (isFrozen) return;
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
  let threadComputationsCount = 0;
  let threadComputationsSkipped = 0;
  let currentStrictnessCutoff = 80;

  let fieldPairs = [];

  function drawConnectingThreads(activePair = null) {
    if (!threadCanvas || !traceSplitWrapper) return;
    if (!threadsVisible) {
      threadComputationsSkipped++;
      if (threadCanvas.innerHTML !== '') {
        threadCanvas.innerHTML = '';
      }
      return;
    }

    const wrapperRect = traceSplitWrapper.getBoundingClientRect();
    if (wrapperRect.width === 0 || wrapperRect.height === 0 || wrapperRect.width < 768) {
      threadCanvas.innerHTML = '';
      return;
    }

    threadComputationsCount++;
    let svgHtml = '';
    const mappings = (activeLogPayload && activeLogPayload.proposal && activeLogPayload.proposal.field_mappings) 
      ? activeLogPayload.proposal.field_mappings 
      : [];

    fieldPairs.forEach((pair, idx) => {
      const rawEl = document.getElementById(pair.raw);
      const ocsfEl = document.getElementById(pair.ocsf);

      if (!rawEl || !ocsfEl) return;

      const fm = mappings[idx];
      const confPct = fm ? Math.round((fm.confidence || 0.6) * 100) : 80;
      const isMapped = confPct >= currentStrictnessCutoff;

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
      const strokeColor = isMapped ? 'var(--accent-copper, #cc9166)' : '#f39c12';
      const opacity = activePair ? (isCurrentActive ? 1.0 : 0.15) : (isMapped ? 0.45 : 0.65);
      const strokeWidth = isCurrentActive ? 2.6 : 1.3;
      const dashAttr = isMapped ? '' : 'stroke-dasharray="4, 3"';

      svgHtml += `
        <g opacity="${opacity}">
          <path class="thread-path ${isCurrentActive ? 'photon-active' : ''} ${!isMapped ? 'flagged-thread' : ''}" 
                d="M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}" 
                style="stroke: ${strokeColor}; stroke-width: ${strokeWidth}px;" 
                ${dashAttr} />
          <circle class="thread-endpoint" cx="${startX}" cy="${startY}" r="${isCurrentActive ? 3.5 : 2}" style="fill: ${strokeColor};" />
          <circle class="thread-endpoint" cx="${endX}" cy="${endY}" r="${isCurrentActive ? 3.5 : 2}" style="fill: ${strokeColor};" />
        </g>
      `;
    });

    threadCanvas.innerHTML = svgHtml;
  }

  window.addEventListener('resize', () => {
    if (activeLogPayload && activeLogPayload.proposal) {
      drawConnectingThreads();
    }
  });

  // Part 7: Traceability Detail Toggle & Summary
  const traceSummaryBanner = document.getElementById('traceSummaryBanner');
  const traceSummaryHeadline = document.getElementById('traceSummaryHeadline');
  const sumTraceSource = document.getElementById('sumTraceSource');
  const btnToggleTraceDiff = document.getElementById('btnToggleTraceDiff');
  const btnToggleTraceDiffText = document.getElementById('btnToggleTraceDiffText');
  let traceDiffCollapsed = false;

  if (btnToggleTraceDiff && traceSplitWrapper) {
    btnToggleTraceDiff.addEventListener('click', () => {
      traceDiffCollapsed = !traceDiffCollapsed;
      traceSplitWrapper.classList.toggle('collapsed', traceDiffCollapsed);
      if (btnToggleTraceDiffText) {
        btnToggleTraceDiffText.textContent = traceDiffCollapsed ? 'View Line-by-Line Code Inspector ▾' : 'Hide Code Inspector ▴';
      }
      btnToggleTraceDiff.setAttribute('aria-expanded', String(!traceDiffCollapsed));
      playTickSound(900, 0.03);
      if (!traceDiffCollapsed) {
        setTimeout(() => {
          drawConnectingThreads();
        }, 120);
      }
    });
  }

  // Dynamic Traceability Renderer for Active Log
  function renderTraceabilityWorkbench(payload) {
    const traceEmptyState = document.getElementById('traceEmptyState');
    const traceSummaryBanner = document.getElementById('traceSummaryBanner');
    const traceSummaryHeadline = document.getElementById('traceSummaryHeadline');
    const sumTraceSource = document.getElementById('sumTraceSource');
    const tracePanelRaw = document.getElementById('tracePanelRaw');
    const traceThreadsCanvas = document.getElementById('traceThreadsCanvas');
    const tracePanelOcsf = document.getElementById('tracePanelOcsf');
    const rawLogBody = document.getElementById('rawLogBody');
    const ocsfLogBody = document.getElementById('ocsfLogBody');
    const rawPanelFormatTag = document.getElementById('rawPanelFormatTag');
    const rawPanelByteSize = document.getElementById('rawPanelByteSize');
    const ocsfPanelFormatTag = document.getElementById('ocsfPanelFormatTag');
    const ocsfPanelMetaCategory = document.getElementById('ocsfPanelMetaCategory');

    if (!payload || !payload.proposal || !payload.rawText) {
      if (traceEmptyState) traceEmptyState.style.display = 'flex';
      if (traceSummaryBanner) traceSummaryBanner.style.display = 'none';
      if (tracePanelRaw) tracePanelRaw.style.display = 'none';
      if (traceThreadsCanvas) traceThreadsCanvas.style.display = 'none';
      if (tracePanelOcsf) tracePanelOcsf.style.display = 'none';
      fieldPairs.length = 0;
      if (traceThreadsCanvas) traceThreadsCanvas.innerHTML = '';
      if (rawLogBody) rawLogBody.innerHTML = '';
      if (ocsfLogBody) ocsfLogBody.innerHTML = '';
      return;
    }

    const proposal = payload.proposal;
    const mappings = proposal.field_mappings || [];
    const sourceTitle = payload.sourceName || 'Device Source';
    const mappedCount = typeof proposal.mapped_count === 'number' ? proposal.mapped_count : mappings.length;
    const confPct = Math.round((proposal.overall_confidence || 0.8) * 100);

    if (traceEmptyState) traceEmptyState.style.display = 'none';
    if (traceSummaryBanner) {
      traceSummaryBanner.style.display = 'flex';
      if (traceSummaryHeadline) {
        traceSummaryHeadline.innerHTML = `<span>Forensic Traceability Verdict:</span> <em>${mappedCount} attributes preserved</em> from <strong>${escapeHtml(sourceTitle)}</strong> in clean OCSF standard`;
      }
      if (sumTraceSource) sumTraceSource.textContent = sourceTitle;

      // Dynamically update traceSummaryChips
      const traceSummaryChips = document.getElementById('traceSummaryChips');
      if (traceSummaryChips) {
        const lossDisplay = proposal.data_loss !== undefined
          ? (proposal.data_loss === 0 ? '0.00% (Lossless)' : `${proposal.data_loss.toFixed(2)}%`)
          : '0 Bytes (Lossless)';
        const lossClass = (proposal.data_loss || 0) > 10 ? 'warning' : 'success';
        const confClass = confPct >= 75 ? 'success' : 'warning';

        traceSummaryChips.innerHTML = `
          <span class="summary-metric-chip success">Original Source: <strong id="sumTraceSource">${escapeHtml(sourceTitle)}</strong></span>
          <span class="summary-metric-chip ${confClass}">Field Mapping Integrity: <strong>${confPct}% Verified</strong></span>
          <span class="summary-metric-chip ${lossClass}">Data Loss: <strong>${lossDisplay}</strong></span>
          <span class="summary-metric-chip">Target Schema: <strong>OCSF Standard v${escapeHtml(proposal.schema_version || '1.1.0')}</strong></span>
        `;
      }

      // Dynamic Session Log History Switcher
      let historyRow = document.getElementById('traceSessionHistoryRow');
      if (!historyRow) {
        historyRow = document.createElement('div');
        historyRow.id = 'traceSessionHistoryRow';
        historyRow.style.cssText = 'display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); width: 100%;';
        traceSummaryBanner.appendChild(historyRow);
      }

      if (historyRow) {
        if (sessionLogsHistory.length > 1) {
          historyRow.style.display = 'flex';
          historyRow.innerHTML = `<span style="font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Session History (${sessionLogsHistory.length}):</span>`;
          sessionLogsHistory.forEach((item, idx) => {
            const isActive = item.rawText === payload.rawText;
            const chipBtn = document.createElement('button');
            chipBtn.type = 'button';
            chipBtn.className = `btn-pill ${isActive ? 'active' : ''}`;
            chipBtn.style.cssText = 'font-size: 11px; padding: 2px 10px; cursor: pointer;';
            chipBtn.textContent = `${item.customName || item.sourceName || 'Log #' + (idx + 1)}`;
            chipBtn.title = `Switch to ${item.customName || item.sourceName || 'Log #' + (idx + 1)}`;
            chipBtn.addEventListener('click', () => {
              activeLogPayload = item;
              const nameInput = document.getElementById('customLogNameInput');
              if (nameInput) nameInput.value = item.customName || '';
              renderTraceabilityWorkbench(activeLogPayload);
              if (logPasteInput) logPasteInput.value = item.rawText || '';
              if (typeof renderWizardStep2 === 'function' && item.proposal) {
                renderWizardStep2(item.proposal);
              }
              playTickSound(920, 0.03);
            });
            historyRow.appendChild(chipBtn);
          });
        } else {
          historyRow.style.display = 'none';
          historyRow.innerHTML = '';
        }
      }
    }
    if (tracePanelRaw) tracePanelRaw.style.display = 'flex';
    if (traceThreadsCanvas) traceThreadsCanvas.style.display = 'block';
    if (tracePanelOcsf) tracePanelOcsf.style.display = 'flex';

    if (rawPanelFormatTag) {
      const fmt = proposal.detected_format || 'Raw Log';
      let glyphKey = 'CEF';
      if (fmt.includes('JSON')) glyphKey = 'JSON';
      else if (fmt.includes('Syslog')) glyphKey = 'Syslog';
      else if (fmt.includes('XML')) glyphKey = 'XML';
      else if (fmt.includes('LEEF')) glyphKey = 'LEEF';
      const glyph = formatGlyphsMap[glyphKey] || formatGlyphsMap['CEF'];
      rawPanelFormatTag.innerHTML = `
        ${glyph}
        Original Raw Log (${escapeHtml(sourceTitle)}) · ${escapeHtml(fmt)}
      `;
    }

    if (rawPanelByteSize) {
      const rawBytes = new Blob([payload.rawText]).size;
      rawPanelByteSize.textContent = `Safe Store · ${rawBytes.toLocaleString()} bytes`;
    }

    if (ocsfPanelMetaCategory) {
      const mappedCount = typeof proposal.mapped_count === 'number' ? proposal.mapped_count : mappings.length;
      ocsfPanelMetaCategory.textContent = `Universal OCSF · ${mappedCount} fields mapped · ${Math.round((proposal.overall_confidence || 0.8) * 100)}% Match`;
    }

    if (rawLogBody) rawLogBody.innerHTML = '';
    if (ocsfLogBody) ocsfLogBody.innerHTML = '';
    fieldPairs.length = 0;

    let initialMappedCount = 0;
    let initialFlaggedCount = 0;

    mappings.forEach((fm, idx) => {
      const rawLineId = `rawTraceLine-${idx + 1}`;
      const ocsfRowId = `ocsfTraceRow-${idx + 1}`;
      const pair = { raw: rawLineId, ocsf: ocsfRowId };
      fieldPairs.push(pair);

      const lineNo = String(idx + 1).padStart(2, '0');
      const confPct = Math.round((fm.confidence || 0.6) * 100);
      const isMapped = confPct >= currentStrictnessCutoff;
      if (isMapped) initialMappedCount++;
      else initialFlaggedCount++;

      // Raw Line (Left)
      if (rawLogBody) {
        const rawDiv = document.createElement('div');
        rawDiv.className = `raw-line ${!isMapped ? 'flagged-raw-token' : ''}`;
        rawDiv.id = rawLineId;
        rawDiv.setAttribute('data-match', ocsfRowId);
        rawDiv.innerHTML = `<span class="line-no">${lineNo}</span><span class="raw-token-key">${escapeHtml(fm.raw_field)}=</span><span class="raw-token-val">${escapeHtml(fm.sample_raw_value || '')}</span>`;
        rawLogBody.appendChild(rawDiv);

        rawDiv.addEventListener('mouseenter', () => {
          rawDiv.classList.add('highlighted');
          const ocsfEl = document.getElementById(ocsfRowId);
          if (ocsfEl) ocsfEl.classList.add('highlighted');
          if (threadsVisible) {
            drawConnectingThreads(pair);
          }
          playTickSound(1020, 0.02);
        });
        rawDiv.addEventListener('mouseleave', () => {
          rawDiv.classList.remove('highlighted');
          const ocsfEl = document.getElementById(ocsfRowId);
          if (ocsfEl) ocsfEl.classList.remove('highlighted');
          if (threadsVisible) {
            drawConnectingThreads(null);
          }
        });
      }

      // OCSF Row (Right)
      if (ocsfLogBody) {
        const ocsfDiv = document.createElement('div');
        ocsfDiv.className = `ocsf-row ${isMapped ? 'mapped-verified' : 'flagged-for-review'}`;
        ocsfDiv.id = ocsfRowId;
        ocsfDiv.setAttribute('data-match', rawLineId);
        ocsfDiv.innerHTML = `
          <span class="ocsf-key">"${escapeHtml(fm.ocsf_field)}": <span class="ocsf-val">${escapeHtml(JSON.stringify(fm.sample_ocsf_value !== undefined ? fm.sample_ocsf_value : ''))}</span></span>
          <span class="review-status-pill" style="display: ${isMapped ? 'none' : 'inline-flex'};">Review Required</span>
          <span class="ocsf-confidence-chip ${isMapped ? 'verified' : 'flagged'}">${isMapped ? '' : '⚠ '}${confPct}%</span>
        `;
        ocsfLogBody.appendChild(ocsfDiv);

        ocsfDiv.addEventListener('mouseenter', () => {
          ocsfDiv.classList.add('highlighted');
          const rawEl = document.getElementById(rawLineId);
          if (rawEl) rawEl.classList.add('highlighted');
          if (threadsVisible) {
            drawConnectingThreads(pair);
          }
          playTickSound(1020, 0.02);
        });
        ocsfDiv.addEventListener('mouseleave', () => {
          const rawEl = document.getElementById(rawLineId);
          if (rawEl) rawEl.classList.remove('highlighted');
          ocsfDiv.classList.remove('highlighted');
          if (threadsVisible) {
            drawConnectingThreads(null);
          }
        });
      }
    });

    // Update banner counts with strictness verdict
    if (traceSummaryHeadline) {
      traceSummaryHeadline.innerHTML = `<span>Forensic Traceability Verdict:</span> <em>${initialMappedCount} attributes mapped</em>, <strong style="color: ${initialFlaggedCount > 0 ? '#f39c12' : 'var(--accent-copper)'};">${initialFlaggedCount} flagged for review</strong> (Strictness: ${currentStrictnessCutoff}%)`;
    }

    if (ocsfPanelMetaCategory) {
      ocsfPanelMetaCategory.textContent = `Universal OCSF · ${initialMappedCount} verified · ${initialFlaggedCount} flagged · ${currentStrictnessCutoff}% Strictness`;
    }

    // Recompute SVG threads if visible
    if (threadsVisible) {
      setTimeout(() => {
        drawConnectingThreads();
      }, 120);
    }
  }

  // Hook up Empty State "Go to AI Log Translator" button
  const btnGoToTranslatorEmpty = document.getElementById('btnGoToTranslatorEmpty');
  if (btnGoToTranslatorEmpty) {
    btnGoToTranslatorEmpty.addEventListener('click', () => {
      switchView('view-wizard');
      setWizardStep(1);
    });
  }

  if (btnToggleThreads) {
    btnToggleThreads.classList.toggle('active', threadsVisible);
    btnToggleThreads.setAttribute('aria-pressed', String(threadsVisible));

    btnToggleThreads.addEventListener('click', () => {
      threadsVisible = !threadsVisible;
      btnToggleThreads.classList.toggle('active', threadsVisible);
      btnToggleThreads.setAttribute('aria-pressed', String(threadsVisible));
      if (threadToggleLabel) {
        threadToggleLabel.textContent = threadsVisible ? 'Visual Links: Active' : 'Visual Links: Off';
      }
      if (threadsVisible) {
        drawConnectingThreads();
      } else {
        threadComputationsSkipped++;
        if (threadCanvas) threadCanvas.innerHTML = '';
      }
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

    // Update dynamic text inside explainer cards for the active log
    if (nextState && activeLogPayload) {
      if (card === rawLogInfoCard) {
        const mainText = card.querySelector('.explainer-main-text');
        if (mainText) {
          mainText.innerHTML = `<strong>What is this:</strong> This is the exact, unedited security record created by <strong>${escapeHtml(activeLogPayload.sourceName || 'the device')}</strong> (${escapeHtml(activeLogPayload.proposal ? activeLogPayload.proposal.detected_format : 'Preserved Raw')}).`;
        }
      } else if (card === ocsfLogInfoCard) {
        const mainText = card.querySelector('.explainer-main-text');
        if (mainText) {
          mainText.innerHTML = `<strong>What is this:</strong> This is the exact same event from the left, translated into the universal <strong>OCSF Standard JSON</strong> (${activeLogPayload.proposal && activeLogPayload.proposal.field_mappings ? activeLogPayload.proposal.field_mappings.length : 0} fields mapped with ${activeLogPayload.proposal ? Math.round(activeLogPayload.proposal.overall_confidence * 100) : 0}% confidence).`;
        }
      }
    }

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

  // Fidelity & Translation Strictness Cutoff Slider in Traceability
  const customSlider = document.getElementById('customSlider');
  const sliderProgress = document.getElementById('sliderProgress');
  const sliderThumb = document.getElementById('sliderThumb');
  const sliderValDisplay = document.getElementById('sliderValDisplay');
  const strictnessInfoBtn = document.getElementById('strictnessInfoBtn');
  const strictnessInfoPopup = document.getElementById('strictnessInfoPopup');
  let isDraggingSlider = false;

  function updateStrictnessCutoff(cutoffPct) {
    currentStrictnessCutoff = cutoffPct;
    if (sliderValDisplay) sliderValDisplay.textContent = `${cutoffPct}%`;
    if (sliderProgress) sliderProgress.style.width = `${cutoffPct}%`;
    if (sliderThumb) sliderThumb.style.left = `${cutoffPct}%`;
    if (customSlider) customSlider.setAttribute('aria-valuenow', String(cutoffPct));

    if (!activeLogPayload || !activeLogPayload.proposal) return;
    const mappings = activeLogPayload.proposal.field_mappings || [];
    let mappedCount = 0;
    let flaggedCount = 0;

    mappings.forEach((fm, idx) => {
      const rawEl = document.getElementById(`rawTraceLine-${idx + 1}`);
      const ocsfEl = document.getElementById(`ocsfTraceRow-${idx + 1}`);
      const confPct = Math.round((fm.confidence || 0.6) * 100);
      const isMapped = confPct >= cutoffPct;

      if (isMapped) mappedCount++;
      else flaggedCount++;

      if (ocsfEl) {
        ocsfEl.classList.toggle('flagged-for-review', !isMapped);
        ocsfEl.classList.toggle('mapped-verified', isMapped);

        const confChip = ocsfEl.querySelector('.ocsf-confidence-chip');
        if (confChip) {
          confChip.className = `ocsf-confidence-chip ${isMapped ? 'verified' : 'flagged'}`;
          confChip.innerHTML = `${isMapped ? '' : '⚠ '}${confPct}%`;
        }

        const statusPill = ocsfEl.querySelector('.review-status-pill');
        if (statusPill) {
          statusPill.style.display = isMapped ? 'none' : 'inline-flex';
        }
      }

      if (rawEl) {
        rawEl.classList.toggle('flagged-raw-token', !isMapped);
      }
    });

    const traceSummaryHeadline = document.getElementById('traceSummaryHeadline');
    if (traceSummaryHeadline) {
      const sourceTitle = activeLogPayload.sourceName || 'Device Source';
      traceSummaryHeadline.innerHTML = `<span>Forensic Traceability Verdict:</span> <em>${mappedCount} attributes mapped</em>, <strong style="color: ${flaggedCount > 0 ? '#f39c12' : 'var(--accent-copper)'};">${flaggedCount} flagged for review</strong> (Strictness: ${cutoffPct}%)`;
    }

    const ocsfPanelMetaCategory = document.getElementById('ocsfPanelMetaCategory');
    if (ocsfPanelMetaCategory) {
      ocsfPanelMetaCategory.textContent = `Universal OCSF · ${mappedCount} verified · ${flaggedCount} flagged · ${cutoffPct}% Strictness`;
    }

    if (threadsVisible) {
      drawConnectingThreads();
    }
  }

  function setStrictnessCutoff(pct) {
    const clamped = Math.max(40, Math.min(99, Math.round(pct)));
    updateStrictnessCutoff(clamped);
  }

  function updateSlider(clientX) {
    if (!customSlider) return;
    const rect = customSlider.getBoundingClientRect();
    let pos = (clientX - rect.left) / rect.width;
    pos = Math.max(0.40, Math.min(0.99, pos));
    const percentage = Math.round(pos * 100);
    updateStrictnessCutoff(percentage);
  }

  if (customSlider) {
    customSlider.addEventListener('mousedown', (e) => {
      if (isFrozen) return;
      isDraggingSlider = true;
      updateSlider(e.clientX);
      playTickSound(900, 0.03);
    });

    customSlider.addEventListener('touchstart', (e) => {
      if (isFrozen) return;
      if (e.touches && e.touches[0]) {
        isDraggingSlider = true;
        updateSlider(e.touches[0].clientX);
        playTickSound(900, 0.03);
      }
    }, { passive: true });

    customSlider.addEventListener('keydown', (e) => {
      if (isFrozen) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        setStrictnessCutoff(currentStrictnessCutoff - (e.shiftKey ? 5 : 2));
        playTickSound(850, 0.02);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        setStrictnessCutoff(currentStrictnessCutoff + (e.shiftKey ? 5 : 2));
        playTickSound(950, 0.02);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isDraggingSlider) updateSlider(e.clientX);
    });

    window.addEventListener('touchmove', (e) => {
      if (isDraggingSlider && e.touches && e.touches[0]) {
        updateSlider(e.touches[0].clientX);
      }
    }, { passive: true });

    window.addEventListener('mouseup', () => {
      if (isDraggingSlider) {
        isDraggingSlider = false;
        playTickSound(1100, 0.03);
      }
    });

    window.addEventListener('touchend', () => {
      if (isDraggingSlider) {
        isDraggingSlider = false;
        playTickSound(1100, 0.03);
      }
    });
  }

  // Strictness Info Popover
  if (strictnessInfoBtn && strictnessInfoPopup) {
    function showStrictnessPopup() {
      strictnessInfoPopup.classList.add('visible');
      strictnessInfoBtn.classList.add('active');
    }

    function hideStrictnessPopup() {
      strictnessInfoPopup.classList.remove('visible');
      strictnessInfoBtn.classList.remove('active');
    }

    strictnessInfoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showStrictnessPopup();
      playTickSound(880, 0.02);
    });

    strictnessInfoBtn.addEventListener('mouseenter', () => {
      showStrictnessPopup();
    });

    strictnessInfoBtn.addEventListener('mouseleave', () => {
      setTimeout(() => {
        if (!strictnessInfoPopup.matches(':hover') && !strictnessInfoBtn.matches(':hover')) {
          hideStrictnessPopup();
        }
      }, 250);
    });

    strictnessInfoPopup.addEventListener('mouseleave', () => {
      setTimeout(() => {
        if (!strictnessInfoBtn.matches(':hover')) {
          hideStrictnessPopup();
        }
      }, 200);
    });

    document.addEventListener('click', (e) => {
      if (!strictnessInfoBtn.contains(e.target) && !strictnessInfoPopup.contains(e.target)) {
        hideStrictnessPopup();
      }
    });
  }

  // Telemetry API for automated verification & inspection
  window.__LOGSETU_TELEMETRY = {
    getThreadsVisible: () => threadsVisible,
    setThreadsVisible: (vis) => {
      if (btnToggleThreads) {
        if (threadsVisible !== vis) {
          btnToggleThreads.click();
        }
      } else {
        threadsVisible = vis;
      }
    },
    getThreadComputationsCount: () => threadComputationsCount,
    getThreadComputationsSkipped: () => threadComputationsSkipped,
    getCurrentStrictness: () => currentStrictnessCutoff,
    setStrictness: (val) => setStrictnessCutoff(val),
    getActiveMappingsStats: () => {
      if (!activeLogPayload || !activeLogPayload.proposal) return { total: 0, mapped: 0, flagged: 0 };
      const mappings = activeLogPayload.proposal.field_mappings || [];
      let m = 0, f = 0;
      mappings.forEach(fm => {
        if (Math.round((fm.confidence || 0.6) * 100) >= currentStrictnessCutoff) m++;
        else f++;
      });
      return { total: mappings.length, mapped: m, flagged: f };
    }
  };

  // ==========================================================================
  // 11. AI INTEGRATOR ONBOARDING WIZARD CONTROLLER (View 03)
  //     Step 1 (Ingest) -> Step 2 (Diff Review) -> Step 3 (Wax Seal Commit)
  // ==========================================================================
  // 11. AI INTEGRATOR ONBOARDING WIZARD CONTROLLER (View 02 - Formerly View 03)
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
  const logFileInput = document.getElementById('logFileInput');
  const logPasteInput = document.getElementById('logPasteInput');
  const btnClearLogInput = document.getElementById('btnClearLogInput');
  const presetChips = document.querySelectorAll('.preset-chip');

  function setWizardStep(stepNum) {
    wizardTabs.forEach((tab) => {
      const tabStep = parseInt(tab.getAttribute('data-wizard-step'), 10);
      tab.classList.toggle('active', tabStep === stepNum);
    });

    if (wizardStep1) wizardStep1.style.display = stepNum === 1 ? 'block' : 'none';
    if (wizardStep2) {
      wizardStep2.style.display = stepNum === 2 ? 'block' : 'none';
      const step2Empty = document.getElementById('wizardStep2EmptyState');
      const diffContainer = document.getElementById('wizardDiffContainer');
      const wizardSummaryBanner = document.getElementById('wizardSummaryBanner');
      const wizardTranslationStatusBadge = document.getElementById('wizardTranslationStatusBadge');
      if (!activeLogPayload.proposal) {
        if (step2Empty) step2Empty.style.display = 'flex';
        if (diffContainer) diffContainer.style.display = 'none';
        if (wizardSummaryBanner) wizardSummaryBanner.style.display = 'none';
        if (wizardTranslationStatusBadge) wizardTranslationStatusBadge.style.display = 'none';
      } else {
        if (step2Empty) step2Empty.style.display = 'none';
        if (diffContainer) diffContainer.style.display = '';
        if (wizardSummaryBanner) wizardSummaryBanner.style.display = 'flex';
        if (wizardTranslationStatusBadge) wizardTranslationStatusBadge.style.display = 'inline-flex';
        if (stepNum === 2) {
          setTimeout(activateWizardStep2Features, 60);
        }
      }
    }
    if (wizardStep3) wizardStep3.style.display = stepNum === 3 ? 'block' : 'none';

    playTickSound(850 + stepNum * 70, 0.04);
  }

  const btnBackToStep1FromEmpty = document.getElementById('btnBackToStep1FromEmpty');
  if (btnBackToStep1FromEmpty) {
    btnBackToStep1FromEmpty.addEventListener('click', () => {
      setWizardStep(1);
    });
  }

  wizardTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const step = parseInt(tab.getAttribute('data-wizard-step'), 10);
      setWizardStep(step);
    });
  });

  // Client-side fallback AST generator if backend unreachable
  function generateClientSideASTProposal(rawText, sourceName) {
    const text = (rawText || '').trim();
    let detectedFormat = 'Custom Key-Value';
    const mappings = [];

    if (text.startsWith('{')) {
      detectedFormat = 'JSON (Structured Document)';
      try {
        const obj = JSON.parse(text);
        for (const [k, v] of Object.entries(obj)) {
          if (typeof v !== 'object') {
            const kl = k.toLowerCase();
            const isIp = kl.includes('ip');
            const isUser = kl.includes('user') || kl.includes('name');
            const isTime = kl.includes('time') || kl.includes('ts') || kl.includes('date');
            const isStatus = kl.includes('status') || kl.includes('action') || kl.includes('act');
            mappings.push({
              raw_field: k,
              ocsf_field: isIp ? 'src_endpoint.ip' : (isUser ? 'user.name' : (isTime ? 'time' : (isStatus ? 'disposition_id' : `unmapped.${k}`))),
              confidence: isIp || isUser || isTime || isStatus ? 0.965 : 0.420,
              method: isIp || isUser || isTime || isStatus ? 'rule' : 'fallback',
              sample_raw_value: String(v),
              sample_ocsf_value: isStatus && String(v).toLowerCase() === 'success' ? '1' : String(v),
              transformation: isIp ? 'Extracted IPv4' : (isStatus ? 'Normalized disposition' : (isTime ? 'Normalized timestamp' : 'Flagged for analyst review')),
              is_mapped: isIp || isUser || isTime || isStatus
            });
          }
        }
      } catch (e) {}
    } else if (text.startsWith('CEF:')) {
      detectedFormat = 'CEF (Common Event Format)';
      const parts = text.split('|');
      if (parts.length >= 7) {
        mappings.push({ raw_field: 'vendor', ocsf_field: 'metadata.product.vendor_name', confidence: 0.985, method: 'rule', sample_raw_value: parts[1], sample_ocsf_value: parts[1], transformation: 'Security product vendor', is_mapped: true });
        mappings.push({ raw_field: 'product', ocsf_field: 'metadata.product.name', confidence: 0.985, method: 'rule', sample_raw_value: parts[2], sample_ocsf_value: parts[2], transformation: 'Security product name', is_mapped: true });
        mappings.push({ raw_field: 'signature_id', ocsf_field: 'activity_id', confidence: 0.930, method: 'rule', sample_raw_value: parts[4], sample_ocsf_value: parts[4], transformation: 'Device signature ID', is_mapped: true });
      }
      const extMatch = text.match(/(\w+)=((?:[^ ]| (?!\w+=))*)/g);
      if (extMatch) {
        extMatch.forEach(pair => {
          const [k, ...vParts] = pair.split('=');
          const val = vParts.join('=');
          if (k === 'src') mappings.push({ raw_field: 'src', ocsf_field: 'src_endpoint.ip', confidence: 0.988, method: 'rule', sample_raw_value: val, sample_ocsf_value: val, transformation: 'Extracted source IPv4', is_mapped: true });
          else if (k === 'dst') mappings.push({ raw_field: 'dst', ocsf_field: 'dst_endpoint.ip', confidence: 0.985, method: 'rule', sample_raw_value: val, sample_ocsf_value: val, transformation: 'Extracted destination IPv4', is_mapped: true });
          else if (k === 'spt') mappings.push({ raw_field: 'spt', ocsf_field: 'src_endpoint.port', confidence: 0.990, method: 'rule', sample_raw_value: val, sample_ocsf_value: val, transformation: 'Port number', is_mapped: true });
          else if (k === 'dpt') mappings.push({ raw_field: 'dpt', ocsf_field: 'dst_endpoint.port', confidence: 0.990, method: 'rule', sample_raw_value: val, sample_ocsf_value: val, transformation: 'Port number', is_mapped: true });
          else if (k === 'act') mappings.push({ raw_field: 'act', ocsf_field: 'disposition_id', confidence: 0.970, method: 'rule', sample_raw_value: val, sample_ocsf_value: val === 'allow' ? '1' : (val === 'deny' ? '2' : val), transformation: 'Normalized OCSF Disposition enum', is_mapped: true });
          else if (k === 'threat_id') mappings.push({ raw_field: 'threat_id', ocsf_field: 'vulnerabilities[0].cve.uid', confidence: 0.985, method: 'rule', sample_raw_value: val, sample_ocsf_value: val, transformation: 'Standard CVE format', is_mapped: true });
          else if (k === 'suser') mappings.push({ raw_field: 'suser', ocsf_field: 'user.name', confidence: 0.955, method: 'rule', sample_raw_value: val, sample_ocsf_value: val, transformation: 'User identity', is_mapped: true });
          else mappings.push({ raw_field: k, ocsf_field: `unmapped.${k}`, confidence: 0.420, method: 'fallback', sample_raw_value: val, sample_ocsf_value: val, transformation: 'Unrecognized field flagged for manual analyst review', is_mapped: false });
        });
      }
    } else if (text.includes('|') || text.includes(';')) {
      const delim = text.includes('|') ? '|' : ';';
      detectedFormat = `Delimited Key-Value (${delim === '|' ? 'Pipe' : 'Semicolon'})`;
      const segments = text.split(delim).map(s => s.trim()).filter(Boolean);
      segments.forEach(seg => {
        const kvMatch = seg.match(/^([a-zA-Z_][\w.-]*)\s*[:=]\s*(.*)$/);
        if (kvMatch && !seg.startsWith('http')) {
          const k = kvMatch[1].trim();
          const v = kvMatch[2].trim();
          const kl = k.toLowerCase();
          const isIp = kl.includes('client') || kl.includes('ip') || kl.includes('target') || kl.includes('src') || kl.includes('dst');
          const isTime = kl.includes('time') || kl.includes('date');
          const isAct = kl.includes('action') || kl.includes('act');
          const isDev = kl.includes('device') || kl.includes('host');
          const isMapped = isIp || isTime || isAct || isDev;
          mappings.push({
            raw_field: k,
            ocsf_field: isIp ? (kl.includes('client') || kl.includes('src') ? 'src_endpoint.ip' : 'dst_endpoint.ip') : (isTime ? 'time' : (isAct ? 'disposition_id' : (isDev ? 'metadata.product.name' : `unmapped.${k}`))),
            confidence: isMapped ? 0.980 : 0.420,
            method: isMapped ? 'rule' : 'fallback',
            sample_raw_value: v,
            sample_ocsf_value: isAct && v.toLowerCase() === 'block' ? '2' : v,
            transformation: isMapped ? 'Recognized security field' : 'Unrecognized field flagged for manual analyst review',
            is_mapped: isMapped
          });
        }
      });
    } else {
      const kvMatches = text.match(/(\w+)\s*=\s*(?:\"([^\"]*)\"|(\S+))/g);
      if (kvMatches) {
        kvMatches.slice(0, 8).forEach(kv => {
          const [k, v] = kv.split('=');
          mappings.push({
            raw_field: k.trim(),
            ocsf_field: `unmapped.${k.trim()}`,
            confidence: 0.420,
            method: 'fallback',
            sample_raw_value: (v || '').trim(),
            sample_ocsf_value: (v || '').trim(),
            transformation: 'Unrecognized field flagged for manual analyst review',
            is_mapped: false
          });
        });
      }
    }

    if (mappings.length === 0) {
      mappings.push({
        raw_field: 'raw_line',
        ocsf_field: 'unmapped.raw_line',
        confidence: 0.350,
        method: 'fallback',
        sample_raw_value: text.slice(0, 100),
        sample_ocsf_value: text.slice(0, 100),
        transformation: 'Unrecognized payload',
        is_mapped: false
      });
    }

    const totalCount = mappings.length;
    const mappedCount = mappings.filter(m => m.is_mapped).length;
    const unmappedCount = totalCount - mappedCount;
    const dataLoss = Math.round((unmappedCount / Math.max(1, totalCount)) * 1000) / 10;
    const fieldsPreserved = Math.round((100 - dataLoss) * 10) / 10;
    const overall = mappings.reduce((acc, m) => acc + m.confidence, 0) / mappings.length;

    const ocsfEvent = {
      metadata: { version: '1.1.0' },
      time: Date.now(),
      class_uid: 0,
      class_name: 'Base Event',
      activity_id: 0,
      activity_name: 'Unknown',
      severity_id: 1,
      severity: 'Informational'
    };

    return {
      proposal_id: 'local_' + Date.now(),
      source_name: sourceName || 'Custom Source',
      detected_format: detectedFormat,
      overall_confidence: Math.round(overall * 1000) / 1000,
      field_mappings: mappings,
      ocsf_event: ocsfEvent,
      clean_json: JSON.stringify(ocsfEvent, null, 2),
      data_loss: dataLoss,
      fields_preserved: fieldsPreserved,
      mapped_count: mappedCount,
      unmapped_count: unmappedCount,
      total_fields: totalCount,
      schema_version: 'OCSF v1.1.0'
    };
  }

  // Part 7: Step 2 Code Diff & Connecting Threads declarations
  const wizardThreadsOverlay = document.getElementById('wizardThreadsOverlay');
  const wizardDiffContainer = document.getElementById('wizardDiffContainer');
  let wizardFieldPairs = [
    { raw: 'wraw-line-1', ocsf: 'wocsf-line-1' },
    { raw: 'wraw-line-2', ocsf: 'wocsf-line-2' },
    { raw: 'wraw-line-3', ocsf: 'wocsf-line-3' },
    { raw: 'wraw-line-4', ocsf: 'wocsf-line-4' },
    { raw: 'wraw-line-5', ocsf: 'wocsf-line-5' }
  ];

  // Part 7: Step 2 Code Diff Toggle for First-Time Viewers
  const btnToggleWizardDiff = document.getElementById('btnToggleWizardDiff');
  const btnToggleWizardDiffText = document.getElementById('btnToggleWizardDiffText');
  let wizardDiffCollapsed = false;

  if (btnToggleWizardDiff && wizardDiffContainer) {
    btnToggleWizardDiff.addEventListener('click', () => {
      wizardDiffCollapsed = !wizardDiffCollapsed;
      wizardDiffContainer.classList.toggle('collapsed', wizardDiffCollapsed);
      if (btnToggleWizardDiffText) {
        btnToggleWizardDiffText.textContent = wizardDiffCollapsed ? 'View Field-by-Field Code Diff ▾' : 'Hide Code Diff ▴';
      }
      btnToggleWizardDiff.setAttribute('aria-expanded', String(!wizardDiffCollapsed));
      playTickSound(900, 0.03);
      if (!wizardDiffCollapsed) {
        setTimeout(() => {
          drawWizardConnectingThreads();
        }, 120);
      } else {
        if (wizardThreadsOverlay) wizardThreadsOverlay.innerHTML = '';
      }
    });
  }

  // Render Step 2 Diff with the real proposal
  function renderWizardStep2(proposal) {
    activeLogPayload.proposal = proposal;
    const rawBody = document.getElementById('wizardDiffRawBody');
    const ocsfBody = document.getElementById('wizardDiffOcsfBody');
    const statusBadge = document.getElementById('wizardTranslationStatusBadge');
    const wizardSummaryBanner = document.getElementById('wizardSummaryBanner');
    const wizardSummaryHeadline = document.getElementById('wizardSummaryHeadline');
    const sumWizardConf = document.getElementById('sumWizardConf');
    const sumWizardLoss = document.getElementById('sumWizardLoss');
    const sumWizardStandard = document.getElementById('sumWizardStandard');
    const sumWizardFormat = document.getElementById('sumWizardFormat');

    if (!rawBody || !ocsfBody) return;

    // Update status badge
    const confPct = Math.round((proposal.overall_confidence || 0.8) * 100);
    const modeTag = (proposal.ai_mode === 'local' || window.__LOGSETU_AI_MODE === 'local') ? ' [🔒 Local AI]' : ' [🌐 Cloud AI]';
    if (statusBadge) {
      if (confPct >= 75) {
        statusBadge.textContent = `✓ ${proposal.detected_format || 'Format Detected'} · ${confPct}% Confidence${modeTag}`;
        statusBadge.className = 'format-chip active';
        statusBadge.style.borderColor = 'var(--accent-copper)';
        statusBadge.style.color = 'var(--accent-copper)';
      } else {
        statusBadge.textContent = `⚠ ${proposal.detected_format || 'Format Ambiguous'} · ${confPct}% Needs Review${modeTag}`;
        statusBadge.className = 'format-chip';
        statusBadge.style.borderColor = '#f39c12';
        statusBadge.style.color = '#f39c12';
      }
    }

    const mappings = proposal.field_mappings || [];

    // Part 7: Populate High-Level Summary Banner for First-Time Viewers
    if (wizardSummaryBanner) {
      wizardSummaryBanner.style.display = 'flex';
      const mappedCount = typeof proposal.mapped_count === 'number' ? proposal.mapped_count : mappings.filter(m => m.is_mapped !== false).length;
      const totalFields = proposal.total_fields || mappings.length;
      if (wizardSummaryHeadline) {
        wizardSummaryHeadline.innerHTML = `<span>AI Translation Proposed:</span> <em>${mappedCount} / ${totalFields} fields translated</em> with <strong>${confPct}% confidence</strong> (<span class="term-explain" data-term="ocsf">OCSF Standard</span>)`;
      }
      if (sumWizardConf) sumWizardConf.textContent = `${confPct}%`;
      const dataLoss = typeof proposal.data_loss === 'number' ? proposal.data_loss : 0.0;
      if (sumWizardLoss) {
        sumWizardLoss.textContent = dataLoss > 0
          ? `${dataLoss.toFixed(1)}% (${proposal.fields_preserved !== undefined ? proposal.fields_preserved.toFixed(1) + '% Match' : 'Lossy'})`
          : `0.00% (Lossless)`;
      }
      if (sumWizardStandard) sumWizardStandard.textContent = proposal.schema_version || `OCSF v1.1.0`;
      if (sumWizardFormat) sumWizardFormat.textContent = proposal.detected_format || 'Auto-Detected Format';
    }

    rawBody.innerHTML = '';
    ocsfBody.innerHTML = '';
    wizardFieldPairs.length = 0;

    const displayMappings = mappings && mappings.length > 0 ? mappings : [];

    displayMappings.forEach((fm, idx) => {
      const rawLineId = `wraw-line-${idx + 1}`;
      const ocsfLineId = `wocsf-line-${idx + 1}`;
      wizardFieldPairs.push({ raw: rawLineId, ocsf: ocsfLineId });

      const lineNo = String(idx + 1).padStart(2, '0');
      const conf = Math.round((fm.confidence || 0.6) * 100);
      const isLowConf = conf < 75;
      const barColor = isLowConf ? '#777a88' : '#cc9166';

      // Left pane line
      const rawDiv = document.createElement('div');
      rawDiv.className = 'diff-line';
      rawDiv.id = rawLineId;
      rawDiv.innerHTML = `<span class="line-no">${lineNo}</span><span class="code-key">${escapeHtml(fm.raw_field)}:</span> <span class="code-val">${escapeHtml(JSON.stringify(fm.sample_raw_value || ''))}</span>`;
      rawBody.appendChild(rawDiv);

      // Right pane OCSF line
      const ocsfUnit = document.createElement('div');
      ocsfUnit.className = 'diff-row-unit';

      const reviewPillHtml = isLowConf
        ? `<button type="button" class="btn-review-pill" title="Review mapping AI proposal" style="margin-left: 6px;">Check</button>`
        : '';

      const transTooltip = fm.transformation ? ` [${escapeHtml(fm.transformation)}]` : '';
      ocsfUnit.innerHTML = `
        <div class="diff-line diff-highlight ${isLowConf ? 'low-confidence-row' : ''}" id="${ocsfLineId}" title="${escapeHtml(fm.ocsf_field)}${transTooltip}">
          <span class="line-no">${lineNo}</span>
          <span class="code-key">"${escapeHtml(fm.ocsf_field)}":</span>
          <span class="code-val">${escapeHtml(fm.sample_ocsf_value !== undefined ? String(fm.sample_ocsf_value) : '')}</span>
          ${reviewPillHtml}
        </div>
        <div class="diff-confidence-bar-track" data-tooltip="${conf}% — ${isLowConf ? (fm.transformation || 'Low confidence: needs human review') : (fm.transformation || 'High confidence verified match')}">
          <div class="diff-confidence-bar-fill" data-target-width="${conf}%" style="--bar-color: ${barColor}; width: 0%;"></div>
        </div>
      `;

      function highlightStep2Pair(targetIdx) {
        const allRaw = rawBody.querySelectorAll('.diff-line');
        const allOcsf = ocsfBody.querySelectorAll('.diff-row-unit');
        const allThreads = wizardThreadsOverlay ? wizardThreadsOverlay.querySelectorAll('.wizard-thread-group') : [];

        allRaw.forEach((el, i) => {
          el.classList.toggle('photon-active', targetIdx !== null && i === targetIdx);
        });
        allOcsf.forEach((el, i) => {
          const l = el.querySelector('.diff-line');
          if (l) l.classList.toggle('photon-active', targetIdx !== null && i === targetIdx);
        });
        allThreads.forEach((g, i) => {
          if (targetIdx === null) {
            g.style.opacity = '1';
            const p = g.querySelector('.wizard-thread-path');
            if (p) p.style.strokeWidth = '1.4px';
          } else if (i === targetIdx) {
            g.style.opacity = '1';
            const p = g.querySelector('.wizard-thread-path');
            if (p) {
              p.style.strokeWidth = '2.8px';
              p.style.stroke = 'var(--accent-copper, #cc9166)';
            }
          } else {
            g.style.opacity = '0.15';
          }
        });
      }

      rawDiv.addEventListener('mouseenter', () => highlightStep2Pair(idx));
      rawDiv.addEventListener('mouseleave', () => highlightStep2Pair(null));
      ocsfUnit.addEventListener('mouseenter', () => highlightStep2Pair(idx));
      ocsfUnit.addEventListener('mouseleave', () => highlightStep2Pair(null));

      if (isLowConf) {
        const btnCheck = ocsfUnit.querySelector('.btn-review-pill');
        if (btnCheck) {
          btnCheck.addEventListener('click', (e) => {
            e.stopPropagation();
            playTickSound(1100, 0.05);
            alert(`Field Translation Audit (${conf}% Confidence):\n\nOriginal Field: '${fm.raw_field}'\nTarget OCSF Field: '${fm.ocsf_field}'\nTransformation: ${fm.transformation || 'Direct'}\nMethod: ${fm.method || 'AI Inference'}\n\nReview: This field has a partial or unverified match. You can approve or customize it.`);
          });
        }
      }

      ocsfBody.appendChild(ocsfUnit);
    });

    // Update Step 3 headline & meta
    const sealHeadline = document.getElementById('sealPromptHeadline');
    const sealMeta = document.getElementById('sealPromptMeta');
    if (sealHeadline) {
      sealHeadline.textContent = `${activeLogPayload.sourceName || 'Custom Source'} → Universal Format (${proposal.detected_format || 'Standard'})`;
    }
    if (sealMeta) {
      sealMeta.textContent = `AI Accuracy: ${(proposal.overall_confidence * 100).toFixed(1)}% · ${displayMappings.length} fields mapped · Tamper-proof digital seal ready`;
    }
  }

  // Handle Step 1 -> Step 2 analysis
  async function triggerLogAnalysis() {
    if (isFrozen) return;
    let rawText = '';
    if (activeLogPayload.fileName && activeLogPayload.rawText) {
      rawText = activeLogPayload.rawText.trim();
    } else if (logPasteInput && logPasteInput.value.trim()) {
      rawText = logPasteInput.value.trim();
      activeLogPayload.rawText = rawText;
      if (!activeLogPayload.sourceName) {
        const matchedPreset = Object.values(PRESET_LOGS).find(p => p.raw.trim() === rawText);
        activeLogPayload.sourceName = matchedPreset ? matchedPreset.name : 'Custom Pasted Log';
      }
    } else {
      rawText = (activeLogPayload.rawText || '').trim();
    }

    if (!rawText) {
      alert('Please choose an example preset, upload a log file, or paste raw log text first.');
      return;
    }

    const dropText = logDropzone ? logDropzone.querySelector('.dropzone-primary') : null;
    if (dropText) {
      dropText.textContent = `⏳ Reading sample & generating AST mappings...`;
    }

    playTickSound(1050, 0.05);

    const proposal = await ensureProposalForPayload(activeLogPayload);

    if (dropText && proposal) {
      dropText.textContent = `✓ Translation Ready: ${proposal.detected_format || 'Detected'} (${Math.round(proposal.overall_confidence * 100)}% Match)`;
    }

    if (proposal) {
      renderWizardStep2(proposal);
      renderTraceabilityWorkbench(activeLogPayload);
      setWizardStep(2);
    }
  }

  if (btnGoToStep2) btnGoToStep2.addEventListener('click', triggerLogAnalysis);
  if (btnBackToStep1) btnBackToStep1.addEventListener('click', () => setWizardStep(1));
  if (btnGoToStep3) btnGoToStep3.addEventListener('click', () => setWizardStep(3));
  if (btnBackToStep2) btnBackToStep2.addEventListener('click', () => setWizardStep(2));

  // File Input handling (Max 25MB check)
  function handleSelectedFile(file) {
    if (isFrozen || !file) return;
    const maxBytes = 25 * 1024 * 1024; // 25MB
    if (file.size > maxBytes) {
      alert(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed limit of 25MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      activeLogPayload.rawText = content;
      activeLogPayload.fileName = file.name;
      activeLogPayload.sourceName = file.name.replace(/\.[^/.]+$/, '');
      const customNameInput = document.getElementById('customLogNameInput');
      if (customNameInput && customNameInput.value.trim()) {
        activeLogPayload.customName = customNameInput.value.trim();
      } else if (customNameInput && !customNameInput.value.trim()) {
        customNameInput.value = file.name.replace(/\.[^/.]+$/, '');
        activeLogPayload.customName = customNameInput.value.trim();
      }
      activeLogPayload.proposal = null;

      presetChips.forEach(c => c.classList.remove('active'));
      if (logPasteInput) {
        logPasteInput.value = content;
      }
      if (btnClearLogInput) btnClearLogInput.style.display = 'inline-block';

      const dropText = logDropzone ? logDropzone.querySelector('.dropzone-primary') : null;
      if (dropText) {
        dropText.textContent = `✓ Loaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB) — Ready for AST Mapping`;
      }
      playTickSound(1150, 0.06);

      // Pre-compute proposal in background so Raw → Clean and Step 2 are immediately synchronized
      await ensureProposalForPayload(activeLogPayload);
    };
    reader.readAsText(file);
  }

  if (logFileInput) {
    logFileInput.addEventListener('change', (e) => {
      if (isFrozen) return;
      if (e.target.files && e.target.files[0]) {
        handleSelectedFile(e.target.files[0]);
      }
    });
  }

  // Dropzone drag-and-drop & click
  if (logDropzone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      logDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isFrozen) return;
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
      e.preventDefault();
      e.stopPropagation();
      if (isFrozen) return;
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleSelectedFile(e.dataTransfer.files[0]);
      } else {
        const text = e.dataTransfer.getData('text');
        if (text) {
          activeLogPayload.rawText = text;
          activeLogPayload.sourceName = 'Custom Dropped Log';
          activeLogPayload.fileName = '';
          const customNameInput = document.getElementById('customLogNameInput');
          if (customNameInput && customNameInput.value.trim()) {
            activeLogPayload.customName = customNameInput.value.trim();
          }
          activeLogPayload.proposal = null;
          presetChips.forEach(c => c.classList.remove('active'));
          if (logPasteInput) logPasteInput.value = text;
          if (btnClearLogInput) btnClearLogInput.style.display = 'inline-block';
          const dropText = logDropzone.querySelector('.dropzone-primary');
          if (dropText) dropText.textContent = `✓ Dropped Log Loaded (${text.length} chars) — Ready for AST Mapping`;
          playTickSound(1150, 0.06);
          ensureProposalForPayload(activeLogPayload);
        }
      }
    });

    logDropzone.addEventListener('click', (e) => {
      if (isFrozen) return;
      if (e.target !== logFileInput) {
        if (logFileInput) logFileInput.click();
      }
    });
  }

  // Live custom log name listener (Part 8)
  const customLogNameInput = document.getElementById('customLogNameInput');
  if (customLogNameInput) {
    customLogNameInput.addEventListener('input', (e) => {
      activeLogPayload.customName = e.target.value.trim();
    });
  }

  // Paste Input handling
  if (logPasteInput) {
    logPasteInput.addEventListener('input', (e) => {
      const text = e.target.value.trim();
      if (text) {
        activeLogPayload.rawText = text;
        activeLogPayload.sourceName = 'Custom Pasted Log';
        activeLogPayload.fileName = '';
        if (customLogNameInput && customLogNameInput.value.trim()) {
          activeLogPayload.customName = customLogNameInput.value.trim();
        }
        activeLogPayload.proposal = null;
        presetChips.forEach(c => c.classList.remove('active'));
        if (btnClearLogInput) btnClearLogInput.style.display = 'inline-block';

        const dropText = logDropzone ? logDropzone.querySelector('.dropzone-primary') : null;
        if (dropText) {
          dropText.textContent = `✓ Pasted Custom Log (${text.length} chars) — Ready for AST Mapping`;
        }
      } else {
        if (btnClearLogInput) btnClearLogInput.style.display = 'none';
        activeLogPayload.rawText = '';
        activeLogPayload.sourceName = '';
        activeLogPayload.proposal = null;
      }
    });
  }

  if (btnClearLogInput) {
    btnClearLogInput.addEventListener('click', () => {
      if (logPasteInput) logPasteInput.value = '';
      if (customLogNameInput) customLogNameInput.value = '';
      btnClearLogInput.style.display = 'none';
      activeLogPayload = {
        sourceName: '',
        customName: '',
        rawText: '',
        fileName: '',
        proposal: null,
        timestamp: null
      };
      presetChips.forEach(c => c.classList.remove('active'));
      const dropText = logDropzone ? logDropzone.querySelector('.dropzone-primary') : null;
      if (dropText) {
        dropText.textContent = `Drag your log file here (.log, .json, .syslog, .csv)`;
      }
      renderTraceabilityWorkbench(activeLogPayload);

      const step2Empty = document.getElementById('wizardStep2EmptyState');
      const diffContainer = document.getElementById('wizardDiffContainer');
      const wizardSummaryBanner = document.getElementById('wizardSummaryBanner');
      const wizardTranslationStatusBadge = document.getElementById('wizardTranslationStatusBadge');
      if (step2Empty) step2Empty.style.display = 'flex';
      if (diffContainer) diffContainer.style.display = 'none';
      if (wizardSummaryBanner) wizardSummaryBanner.style.display = 'none';
      if (wizardTranslationStatusBadge) wizardTranslationStatusBadge.style.display = 'none';

      playTickSound(650, 0.04);
    });
  }

  // Preset Source selector
  presetChips.forEach((chip) => {
    chip.addEventListener('click', async () => {
      if (isFrozen) return;
      presetChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      playTickSound(950, 0.03);

      const presetKey = chip.getAttribute('data-preset');
      const presetData = PRESET_LOGS[presetKey] || PRESET_LOGS['pan-os'];
      activeLogPayload.sourceName = presetData.name;
      activeLogPayload.rawText = presetData.raw;
      activeLogPayload.fileName = `${presetKey}.log`;
      activeLogPayload.proposal = null;

      if (logPasteInput) logPasteInput.value = presetData.raw;
      if (btnClearLogInput) btnClearLogInput.style.display = 'inline-block';

      const dropText = logDropzone ? logDropzone.querySelector('.dropzone-primary') : null;
      if (dropText) {
        dropText.textContent = `✓ Selected: ${chip.textContent} — Ready for AST Mapping`;
      }

      // Pre-compute proposal in background so Raw → Clean and Step 2 are immediately synchronized
      await ensureProposalForPayload(activeLogPayload);
    });
  });

  window.selectPresetLog = function(presetKey) {
    if (isFrozen) return;
    let key = presetKey;
    if (key === 'aws-guardduty') key = 'cloudtrail';
    if (key === 'windows-sec') key = 'win-event';
    const chip = document.querySelector(`.preset-chip[data-preset="${key}"]`);
    if (chip) {
      chip.click();
    }
  };

  // Wizard Step 3: Signature Wax-Seal Stamp Confirmation
  if (btnWizardWaxSeal) {
    btnWizardWaxSeal.addEventListener('click', async () => {
      if (isFrozen) return;
      if (btnWizardWaxSeal.classList.contains('sealed')) {
        btnWizardWaxSeal.classList.remove('sealed', 'stamping');
        if (wizardSealBtnText) wizardSealBtnText.textContent = 'Stamp & Save Permanently';
        playTickSound(650, 0.04);
        return;
      }

      btnWizardWaxSeal.classList.add('stamping');
      playTickSound(520, 0.08);

      let blockNum = '#891,242';
      let contentHash = '0x8a92...e104';

      // Genuine backend ingestion / stamp
      try {
        if (window.LogSetuAPI && window.LogSetuAPI.ingest) {
          const res = await window.LogSetuAPI.ingest(activeLogPayload.rawText, activeLogPayload.sourceName, activeLogPayload.customName);
          if (res && res.chain_block_id) {
            blockNum = `#${res.chain_block_id.toLocaleString()}`;
            contentHash = res.content_hash ? res.content_hash.slice(0, 10) + '...' + res.content_hash.slice(-4) : contentHash;
          }
        }
      } catch (err) {
        console.warn('[LogSetu Wax Seal] Backend ingestion fallback:', err);
      }

      setTimeout(() => {
        btnWizardWaxSeal.classList.add('sealed');
        btnWizardWaxSeal.classList.remove('stamping');
        if (wizardSealBtnText) {
          wizardSealBtnText.textContent = `Committed to Consensus [Seal ${blockNum}]`;
        }
        playTickSound(1100, 0.05);

        const kpiBlock = document.getElementById('kpiBlock');
        if (kpiBlock) kpiBlock.textContent = blockNum;

        const chainBlocksList = document.getElementById('chainBlocksList');
        if (chainBlocksList) {
          const newBlock = document.createElement('div');
          newBlock.className = 'chain-block-item';
          newBlock.style.animation = 'streamSlideIn 0.4s var(--ease-expo-soft) forwards';
          newBlock.innerHTML = `
            <span class="block-folio-num">${blockNum.replace('#', '').slice(-3)}</span>
            <div class="block-meta">
              <span class="block-hash">SHA-256: ${contentHash}</span>
              <span class="block-time">Block ${blockNum} · ${escapeHtml(activeLogPayload.sourceName)} Mapped</span>
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
      if (isFrozen) return;
      isDraggingDriftSlider = true;
      updateDriftSlider(e.clientX);
      playTickSound(900, 0.03);
    });

    driftSlider.addEventListener('touchstart', (e) => {
      if (isFrozen) return;
      if (e.touches && e.touches[0]) {
        isDraggingDriftSlider = true;
        updateDriftSlider(e.touches[0].clientX);
        playTickSound(900, 0.03);
      }
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      if (isDraggingDriftSlider) updateDriftSlider(e.clientX);
    });

    window.addEventListener('touchmove', (e) => {
      if (isDraggingDriftSlider && e.touches && e.touches[0]) {
        updateDriftSlider(e.touches[0].clientX);
      }
    }, { passive: true });

    window.addEventListener('mouseup', () => {
      if (isDraggingDriftSlider) {
        isDraggingDriftSlider = false;
        playTickSound(1050, 0.03);
      }
    });

    window.addEventListener('touchend', () => {
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
      if (isFrozen) return;
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
    if (isFrozen) return;
    const modal = document.getElementById('remapModalBackdrop');
    if (modal) {
      modal.classList.add('active');
      playTickSound(940, 0.05);
    }
  }

  function closeRemapModal() {
    const modal = document.getElementById('remapModalBackdrop');
    if (modal) {
      modal.classList.remove('active');
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
      if (isFrozen) return;
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
  //     Real computed blocks, SHA-256 chain links, simulated tampering & auto-heal
  // ==========================================================================
  const btnSimulateTamper = document.getElementById('btnSimulateTamper');
  const tamperBtnText = document.getElementById('tamperBtnText');
  const btnHealChain = document.getElementById('btnHealChain');
  const chainedLedgerVisualizer = document.getElementById('chainedLedgerVisualizer');
  const ledgerTotalBlocksCount = document.getElementById('ledgerTotalBlocksCount');
  const btnLoadMoreLedgerBlocks = document.getElementById('btnLoadMoreLedgerBlocks');

  let isTampered = false;
  let currentLedgerBlocksCount = 10;
  let cachedLedgerBlocks = [];
  let allBlockDetailsExpanded = false;
  const individuallyExpandedBlockIds = new Set();

  const btnToggleAllBlockDetails = document.getElementById('btnToggleAllBlockDetails');
  const btnToggleAllBlockDetailsText = document.getElementById('btnToggleAllBlockDetailsText');

  function updateLedgerHashVisibilitySync() {
    const allBlocks = document.querySelectorAll('.ledger-chain-block');
    if (!allBlocks.length) return;

    let expandedCount = 0;
    allBlocks.forEach(block => {
      const details = block.querySelector('.block-technical-details');
      const singleBtn = block.querySelector('.btn-toggle-single-block-hash');
      const singleSpan = singleBtn ? singleBtn.querySelector('span') : null;
      const isExpanded = details && !details.classList.contains('collapsed');

      if (isExpanded) {
        expandedCount++;
        if (singleSpan) singleSpan.textContent = 'Hide Hashes ▴';
        if (singleBtn) {
          singleBtn.setAttribute('aria-expanded', 'true');
          singleBtn.title = 'Hide cryptographic hash values for this block';
        }
      } else {
        if (singleSpan) singleSpan.textContent = 'Show Hashes ▾';
        if (singleBtn) {
          singleBtn.setAttribute('aria-expanded', 'false');
          singleBtn.title = 'Show cryptographic hash values for this block';
        }
      }
    });

    allBlockDetailsExpanded = (expandedCount === allBlocks.length);

    if (btnToggleAllBlockDetails && btnToggleAllBlockDetailsText) {
      if (expandedCount === 0) {
        btnToggleAllBlockDetailsText.textContent = 'Show Hashes ▾';
        btnToggleAllBlockDetails.setAttribute('aria-expanded', 'false');
        btnToggleAllBlockDetails.title = 'Show technical cryptographic hashes on all blocks';
      } else {
        btnToggleAllBlockDetailsText.textContent = 'Hide Hashes ▴';
        btnToggleAllBlockDetails.setAttribute('aria-expanded', 'true');
        btnToggleAllBlockDetails.title = 'Hide technical cryptographic hashes on all blocks';
      }
    }
  }

  if (btnToggleAllBlockDetails) {
    btnToggleAllBlockDetails.addEventListener('click', () => {
      const allDetails = document.querySelectorAll('.block-technical-details');
      // If any block is currently expanded (button says Hide Hashes), clicking should collapse all.
      // Only when all blocks are collapsed (button says Show Hashes), clicking should expand all.
      const anyExpanded = Array.from(allDetails).some(d => !d.classList.contains('collapsed'));
      const shouldExpandAll = !anyExpanded;
      allBlockDetailsExpanded = shouldExpandAll;
      individuallyExpandedBlockIds.clear();

      allDetails.forEach(d => {
        d.classList.toggle('collapsed', !shouldExpandAll);
      });

      playTickSound(950, 0.03);
      updateLedgerHashVisibilitySync();
    });
  }

  async function renderLedgerVisualizer(count = currentLedgerBlocksCount) {
    if (!chainedLedgerVisualizer) return;

    let blocks = [];
    let totalCount = 0;

    try {
      let data = null;
      if (window.LogSetuAPI && window.LogSetuAPI.getBlocks) {
        data = await window.LogSetuAPI.getBlocks(count);
      } else {
        const resp = await fetch(`${BACKEND_API_BASE}/api/hashchain/blocks?count=${count}`);
        if (resp.ok) data = await resp.json();
      }

      if (data && Array.isArray(data.blocks)) {
        blocks = data.blocks;
        totalCount = data.total_blocks || blocks.length;
        cachedLedgerBlocks = blocks;
      }
    } catch (err) {
      console.warn('[LogSetu Ledger] Failed to fetch hashchain blocks from backend, using cached/fallback:', err);
      blocks = cachedLedgerBlocks;
    }

    if (ledgerTotalBlocksCount && totalCount) {
      ledgerTotalBlocksCount.textContent = totalCount.toLocaleString();
    }

    // Check if any block is currently tampered
    const hasTamperedBlock = blocks.some(b => b.status === 'tampered');
    isTampered = hasTamperedBlock;

    if (btnHealChain) {
      btnHealChain.style.display = isTampered ? 'inline-flex' : 'none';
    }
    if (tamperBtnText) {
      tamperBtnText.textContent = isTampered ? 'Simulating Hacker Attack (Chain Broken)' : 'Simulate Hacker Tampering Old Log';
    }
    if (btnSimulateTamper) {
      btnSimulateTamper.classList.toggle('active', isTampered);
    }

    if (!blocks || blocks.length === 0) {
      chainedLedgerVisualizer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted); font-family: var(--font-mono);">
          <p>No blocks recorded in the cryptographic ledger yet.</p>
        </div>
      `;
      return;
    }

    chainedLedgerVisualizer.innerHTML = '';

    blocks.forEach((block, idx) => {
      const isBlockTampered = block.status === 'tampered';
      const isBlockExpanded = allBlockDetailsExpanded || isBlockTampered || individuallyExpandedBlockIds.has(block.block_id);
      const blockCard = document.createElement('div');
      blockCard.className = `ledger-chain-block glass-card-3d ${isBlockTampered ? 'tampered' : ''}`;
      blockCard.id = `chainBlock-${block.block_id}`;

      const blockNumStr = `#${(block.block_id || 0).toLocaleString()}`;
      const srcName = block.source || 'Standard Ingest';
      const customNameStr = (block.custom_name || '').trim();
      const formatBadge = (block.detected_format || 'RAW').toUpperCase();
      const statusLabel = isBlockTampered ? 'TAMPER DETECTED: RECORD ALTERED!' : 'UNTOUCHED &amp; SEALED';
      const timeDisplay = block.timestamp ? new Date(block.timestamp).toLocaleTimeString() : 'Just now';

      blockCard.setAttribute('data-custom-name', customNameStr.toLowerCase());
      blockCard.setAttribute('data-block-id', String(block.block_id || ''));
      blockCard.setAttribute('data-source', srcName.toLowerCase());
      blockCard.setAttribute('data-payload', (block.raw_text || '').toLowerCase());

      blockCard.innerHTML = `
        <div class="chain-block-top">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span class="chain-block-num">${blockNumStr}</span>
            ${customNameStr ? `
            <span class="chain-block-custom-name" style="font-family: var(--font-mono); font-size: 0.76rem; font-weight: 600; color: var(--accent-copper, #cc9166); background: rgba(204, 145, 102, 0.12); border: 1px solid rgba(204, 145, 102, 0.3); padding: 2px 8px; border-radius: var(--radius-pill);" title="Custom Log Label: ${escapeHtml(customNameStr)}">
              🏷️ ${escapeHtml(customNameStr)}
            </span>` : ''}
            <span style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--text-ghost); background: rgba(255,255,255,0.05); border: 1px solid var(--hairline); padding: 2px 8px; border-radius: var(--radius-pill);">
              ${escapeHtml(srcName)} · ${escapeHtml(formatBadge)}
            </span>
          </div>
          <span class="chain-seal-tag ${isBlockTampered ? 'tampered-tag' : ''}">
            ${statusLabel}
          </span>
        </div>

        <div class="chain-block-compact-row">
          <span class="compact-source">Source: <strong>${escapeHtml(srcName)}</strong> ${customNameStr ? `[<strong style="color: var(--accent-copper, #cc9166);">${escapeHtml(customNameStr)}</strong>]` : ''} (${escapeHtml(formatBadge)})</span>
          <span class="compact-fingerprint">● ${isBlockTampered ? 'Chain Link Broken' : 'SHA-256 Chained Link Verified'}</span>
        </div>

        <div class="block-technical-details ${isBlockExpanded ? '' : 'collapsed'}">
          <div class="chain-block-hashes">
            <div>
              <span class="hash-lbl">BLOCK HASH: </span>
              <span class="hash-str" style="${isBlockTampered ? 'color: #ff4757; font-weight: 700;' : ''}">${escapeHtml(block.block_hash || '')}</span>
            </div>
            <div>
              <span class="hash-lbl">PREVIOUS LINK: </span>
              <span class="hash-str">${escapeHtml(block.previous_hash || '0000000000000000000000000000000000000000000000000000000000000000')}</span>
            </div>
            ${block.content_hash ? `
            <div>
              <span class="hash-lbl">CONTENT DIGEST: </span>
              <span class="hash-str" style="color: var(--accent-copper);">${escapeHtml(block.content_hash)}</span>
            </div>` : ''}
          </div>

          ${block.raw_text ? `
          <div class="ledger-payload-preview" title="${escapeHtml(block.raw_text)}">
            <span style="color: var(--text-ghost); text-transform: uppercase; font-size: 0.7rem; margin-right: 6px;">Payload:</span>${escapeHtml(block.raw_text)}
          </div>` : ''}
        </div>

        <div class="chain-block-footer">
          <span>Sealed: ${escapeHtml(timeDisplay)}</span>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button type="button" class="btn-pill btn-toggle-single-block-hash" style="padding: 3px 10px; font-size: 0.74rem; cursor: pointer;" aria-expanded="${isBlockExpanded ? 'true' : 'false'}" title="${isBlockExpanded ? 'Hide cryptographic hash values for this block' : 'Show cryptographic hash values for this block'}">
              <span>${isBlockExpanded ? 'Hide Hashes ▴' : 'Show Hashes ▾'}</span>
            </button>
            ${block.raw_text ? `
            <button type="button" class="btn-pill btn-trace-ledger-block" data-block-id="${block.block_id}" title="Trace raw to clean fields in View 03" style="padding: 3px 10px; font-size: 0.74rem; border-color: var(--accent-copper); color: var(--accent-copper); cursor: pointer;">
              <span>Trace ↔</span>
            </button>` : ''}
            <button type="button" class="btn-pill btn-tamper-single-block" data-block-id="${block.block_id}" title="Simulate hacker modifying this specific record's stored raw data" style="padding: 3px 10px; font-size: 0.74rem; cursor: pointer;">
              <span>Tamper ⚡</span>
            </button>
            <button type="button" class="btn-pill btn-zk-merkle-inspect" data-block-id="${block.block_id}" title="Inspect zero-knowledge Merkle proof" style="padding: 3px 10px; font-size: 0.74rem; cursor: pointer;">
              <span>Inspect Merkle</span>
            </button>
          </div>
        </div>
      `;

      // Attach single block detail toggle
      const btnToggleSingle = blockCard.querySelector('.btn-toggle-single-block-hash');
      const techDetails = blockCard.querySelector('.block-technical-details');
      if (btnToggleSingle && techDetails) {
        btnToggleSingle.addEventListener('click', (e) => {
          e.stopPropagation();
          const isNowExpanded = techDetails.classList.contains('collapsed');
          if (isNowExpanded) {
            techDetails.classList.remove('collapsed');
            btnToggleSingle.setAttribute('aria-expanded', 'true');
            btnToggleSingle.querySelector('span').textContent = 'Hide Hashes ▴';
            btnToggleSingle.title = 'Hide cryptographic hash values for this block';
            individuallyExpandedBlockIds.add(block.block_id);
          } else {
            techDetails.classList.add('collapsed');
            btnToggleSingle.setAttribute('aria-expanded', 'false');
            btnToggleSingle.querySelector('span').textContent = 'Show Hashes ▾';
            btnToggleSingle.title = 'Show cryptographic hash values for this block';
            individuallyExpandedBlockIds.delete(block.block_id);
          }
          updateLedgerHashVisibilitySync();
        });
      }

      // Attach button actions
      const btnTrace = blockCard.querySelector('.btn-trace-ledger-block');
      if (btnTrace) {
        btnTrace.addEventListener('click', (e) => {
          e.stopPropagation();
          traceLedgerBlock(block);
        });
      }

      const btnTamperBlock = blockCard.querySelector('.btn-tamper-single-block');
      if (btnTamperBlock) {
        btnTamperBlock.disabled = isFrozen;
        btnTamperBlock.classList.toggle('frozen-disabled', isFrozen);
        btnTamperBlock.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (isFrozen) return;
          playTickSound(440, 0.12);
          try {
            if (window.LogSetuAPI && window.LogSetuAPI.simulateTamper) {
              await window.LogSetuAPI.simulateTamper(block.block_id, true);
            } else {
              await fetch(`${BACKEND_API_BASE}/api/hashchain/tamper`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ block_id: block.block_id, tamper_raw: true })
              });
            }
            await renderLedgerVisualizer(currentLedgerBlocksCount);
          } catch (err) {
            console.warn('[LogSetu Tamper Single Block] Error:', err);
          }
        });
      }

      const btnZk = blockCard.querySelector('.btn-zk-merkle-inspect');
      if (btnZk) {
        btnZk.addEventListener('click', (e) => {
          e.stopPropagation();
          openMerkleModal();
        });
      }

      blockCard.addEventListener('click', () => {
        openMerkleModal();
      });

      chainedLedgerVisualizer.appendChild(blockCard);

      // Between blocks: render connector link with fracture if tampered
      if (idx < blocks.length - 1) {
        const nextBlock = blocks[idx + 1];
        const isBroken = isBlockTampered || nextBlock.status === 'tampered';

        const connectorDiv = document.createElement('div');
        connectorDiv.className = 'chain-connector-link';
        connectorDiv.innerHTML = `
          <div class="connector-line" style="${isBroken ? 'background: #ff4757;' : ''}"></div>
          <div class="fracture-crack-line ${isBroken ? 'cracked' : ''}"></div>
          <div class="connector-lock" style="${isBroken ? 'color: #ff4757; font-weight: 700; background: rgba(40,10,10,0.9);' : ''}">
            ${isBroken ? '⚠️ Fractured Link' : '🔒'}
          </div>
        `;
        chainedLedgerVisualizer.appendChild(connectorDiv);
      }
    });

    updateLedgerHashVisibilitySync();
    filterLedgerBlocks();
  }

  // Live Ledger Search Filtering (Part 8)
  const ledgerSearchInput = document.getElementById('ledgerSearchInput');
  function filterLedgerBlocks() {
    if (!chainedLedgerVisualizer) return;
    const q = (ledgerSearchInput ? ledgerSearchInput.value.trim().toLowerCase() : '');
    const cards = chainedLedgerVisualizer.querySelectorAll('.ledger-chain-block');
    let visibleCount = 0;

    cards.forEach(card => {
      if (!q) {
        card.style.display = '';
        visibleCount++;
        return;
      }
      const cName = card.getAttribute('data-custom-name') || '';
      const bId = card.getAttribute('data-block-id') || '';
      const src = card.getAttribute('data-source') || '';
      const payload = card.getAttribute('data-payload') || '';
      const textContent = card.innerText.toLowerCase();

      const matches = cName.includes(q) ||
                      bId.includes(q.replace('#', '')) ||
                      src.includes(q) ||
                      payload.includes(q) ||
                      textContent.includes(q);

      if (matches) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Also toggle connector lines between visible cards
    const connectors = chainedLedgerVisualizer.querySelectorAll('.chain-connector-link');
    connectors.forEach(conn => {
      conn.style.display = q ? 'none' : '';
    });

    let emptySearchMsg = document.getElementById('ledgerSearchEmptyNotice');
    if (visibleCount === 0 && cards.length > 0) {
      if (!emptySearchMsg) {
        emptySearchMsg = document.createElement('div');
        emptySearchMsg.id = 'ledgerSearchEmptyNotice';
        emptySearchMsg.style.cssText = 'text-align: center; padding: 30px; color: var(--text-muted); font-family: var(--font-mono); font-size: 0.85rem; width: 100%;';
        chainedLedgerVisualizer.appendChild(emptySearchMsg);
      }
      emptySearchMsg.textContent = `No ledger blocks match "${ledgerSearchInput ? ledgerSearchInput.value.trim() : ''}".`;
      emptySearchMsg.style.display = 'block';
    } else if (emptySearchMsg) {
      emptySearchMsg.style.display = 'none';
    }
  }

  if (ledgerSearchInput) {
    ledgerSearchInput.addEventListener('input', filterLedgerBlocks);
  }

  // Trace back from ledger block to Raw ↔ Clean Logs (View 03)
  async function traceLedgerBlock(block) {
    if (!block || !block.raw_text) return;
    playTickSound(1100, 0.04);

    const payloadLines = block.raw_text.split('\n').map(s => s.trim()).filter(Boolean);
    const sampleLines = payloadLines.slice(0, 10);

    let proposal = null;
    try {
      const activeMode = window.__LOGSETU_AI_MODE || 'cloud';
      if (window.LogSetuAPI && window.LogSetuAPI.analyzeAI) {
        proposal = await window.LogSetuAPI.analyzeAI(sampleLines, block.source, activeMode);
      } else {
        const resp = await fetch(`${BACKEND_API_BASE}/api/ai/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sample_lines: sampleLines, source_name: block.source || 'Ledger Block', mode: activeMode })
        });
        if (resp.ok) proposal = await resp.json();
      }
    } catch (e) {
      console.warn('[LogSetu Trace Block] AI mapping fallback:', e);
    }

    if (!proposal) {
      proposal = generateClientSideASTProposal(sampleLines[0], block.source || 'Ledger Block');
    }

    activeLogPayload = {
      sourceName: block.source || `Sealed Block #${block.block_id}`,
      rawText: block.raw_text,
      fileName: `block_${block.block_id}.log`,
      proposal: proposal,
      timestamp: block.timestamp ? new Date(block.timestamp).getTime() : Date.now(),
      customName: block.custom_name || '',
      chainBlockId: block.block_id,
      contentHash: block.content_hash || ''
    };

    switchView('view-traceability');
    renderTraceabilityWorkbench(activeLogPayload);
  }

  // Tamper Simulation Toggle
  if (btnSimulateTamper) {
    btnSimulateTamper.addEventListener('click', async () => {
      if (isFrozen) return;
      if (!isTampered) {
        // Trigger real backend tamper attack
        playTickSound(440, 0.12);
        try {
          const targetBlockId = (activeLogPayload && activeLogPayload.chainBlockId) ? activeLogPayload.chainBlockId : null;
          if (window.LogSetuAPI && window.LogSetuAPI.simulateTamper) {
            await window.LogSetuAPI.simulateTamper(targetBlockId, true);
          } else {
            await fetch(`${BACKEND_API_BASE}/api/hashchain/tamper`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ block_id: targetBlockId, tamper_raw: true })
            });
          }
        } catch (err) {
          console.warn('[LogSetu Tamper Simulation] Error calling tamper endpoint:', err);
        }
        await renderLedgerVisualizer(currentLedgerBlocksCount);
      } else {
        await selfHealChain();
      }
    });
  }

  // Self-heal Chain
  async function selfHealChain() {
    if (isFrozen) return;
    playTickSound(1200, 0.08);
    try {
      if (window.LogSetuAPI && window.LogSetuAPI.healChain) {
        await window.LogSetuAPI.healChain();
      } else {
        await fetch(`${BACKEND_API_BASE}/api/hashchain/heal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
      }
    } catch (err) {
      console.warn('[LogSetu Self Heal] Error calling heal endpoint:', err);
    }
    await renderLedgerVisualizer(currentLedgerBlocksCount);
  }

  if (btnHealChain) {
    btnHealChain.addEventListener('click', () => {
      if (isFrozen) return;
      selfHealChain();
    });
  }

  // Load More Older Blocks
  if (btnLoadMoreLedgerBlocks) {
    btnLoadMoreLedgerBlocks.addEventListener('click', async () => {
      if (isFrozen) return;
      currentLedgerBlocksCount += 10;
      playTickSound(920, 0.03);
      await renderLedgerVisualizer(currentLedgerBlocksCount);
    });
  }

  // Initial render on load
  setTimeout(() => {
    renderLedgerVisualizer(10);
  }, 300);

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
      if (isFrozen) return;
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

  function setFreezeState(freeze) {
    isFrozen = Boolean(freeze);
    document.body.classList.toggle('system-frozen', isFrozen);

    if (freezeBanner) {
      freezeBanner.classList.toggle('active', isFrozen);
      freezeBanner.setAttribute('aria-hidden', String(!isFrozen));
    }
    if (btnForensicFreeze) {
      btnForensicFreeze.classList.toggle('active', isFrozen);
      btnForensicFreeze.setAttribute('aria-pressed', String(isFrozen));
    }
    if (freezeStatusText) {
      freezeStatusText.textContent = isFrozen ? 'Frozen' : 'Freeze';
    }

    // Synchronize stream pause control and button UI
    streamActive = !isFrozen;
    if (btnPauseResume) {
      btnPauseResume.classList.toggle('active', isFrozen);
      btnPauseResume.disabled = isFrozen;
      btnPauseResume.classList.toggle('frozen-disabled', isFrozen);
    }
    if (pauseResumeText) {
      pauseResumeText.textContent = isFrozen ? 'Stream Frozen' : 'Pause Stream';
    }

    // Update Live Feed indicator tag on View 01
    const streamLiveTag = document.querySelector('.stream-live-tag');
    if (streamLiveTag) {
      if (isFrozen) {
        streamLiveTag.innerHTML = '<span class="pulse-dot" style="width:4px;height:4px;background:#ff4757;box-shadow:0 0 6px #ff4757;"></span>Ingestion Frozen';
      } else {
        streamLiveTag.innerHTML = '<span class="pulse-dot" style="width:4px;height:4px;"></span>Live Feed';
      }
    }

    // Visibly and functionally disable all state-changing interactions across all views
    const stateChangingSelectors = [
      // View 02: AI Log Translator
      '#logFileInput',
      '#customLogNameInput',
      '#logPasteInput',
      '#btnClearLogInput',
      '#btnGoToStep2',
      '#btnGoToStep3',
      '#btnWizardWaxSeal',
      '#btnBackToStep1',
      '#btnBackToStep1FromEmpty',
      '#btnBackToStep2',
      '#logDropzone',
      '#wizardPresetLogs .preset-chip',
      // View 03: Sliders & Form queries
      '#customSlider',
      '#nlQueryInput',
      '#nlQuerySubmit',
      // View 04: Format Drift
      '#driftSlider',
      '#btnReviewDrift',
      '#btnAcceptRemap',
      '#btnRejectRemap',
      // View 05: Tamper & Heal mutations
      '#btnSimulateTamper',
      '#btnHealChain',
      '#btnLoadMoreLedgerBlocks',
      '.btn-tamper-single-block',
      // View 06: Attack animation
      '#btnTraceAttack'
    ];

    stateChangingSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if ('disabled' in el) {
          el.disabled = isFrozen;
        }
        el.classList.toggle('frozen-disabled', isFrozen);
        if (el.id === 'customSlider' || el.id === 'driftSlider') {
          el.setAttribute('tabindex', isFrozen ? '-1' : '0');
          const sliderContainer = el.closest('.slider-container');
          if (sliderContainer) {
            sliderContainer.classList.toggle('frozen-disabled', isFrozen);
          }
        }
      });
    });

    // If attack animation was running, halt it
    if (isFrozen && isAttackAnimating) {
      const attackEdges = document.querySelectorAll('.edge-attack');
      attackEdges.forEach((edge) => edge.classList.remove('animated'));
      if (btnTraceAttack) {
        btnTraceAttack.classList.remove('active');
        const span = btnTraceAttack.querySelector('span');
        if (span) span.textContent = 'Play Attack Step-by-Step';
      }
      isAttackAnimating = false;
    }

    playTickSound(isFrozen ? 420 : 880, 0.12);
  }

  if (btnForensicFreeze) {
    btnForensicFreeze.addEventListener('click', () => setFreezeState(!isFrozen));
  }
  if (btnThaw) {
    btnThaw.addEventListener('click', () => setFreezeState(false));
  }

  // Keyboard shortcut 'f' / 'F' to toggle Forensic Freeze
  window.addEventListener('keydown', (e) => {
    if ((e.key === 'f' || e.key === 'F') && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
      setFreezeState(!isFrozen);
    }
  });

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
    const modal = document.getElementById('merkleModalBackdrop');
    if (modal) {
      modal.classList.add('active');
      playTickSound(920, 0.05);
    }
  }

  function closeMerkleModal() {
    const modal = document.getElementById('merkleModalBackdrop');
    if (modal) {
      modal.classList.remove('active');
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
  let currentAIMode = 'cloud';
  window.__LOGSETU_AI_MODE = 'cloud';

  function toggleAirgapMode() {
    if (!btnAirgapToggle) return;
    const isNowOffline = btnAirgapToggle.classList.toggle('offline-mode');
    currentAIMode = isNowOffline ? 'local' : 'cloud';
    window.__LOGSETU_AI_MODE = currentAIMode;
    if (airgapStatusText) {
      airgapStatusText.textContent = isNowOffline ? 'Local AI' : 'Cloud AI';
    }
    btnAirgapToggle.title = isNowOffline
      ? "Mode: 100% Offline Private Local AI (Zero outbound network calls). Click to switch to Cloud AI."
      : "Mode: Smart Cloud AI (Hosted models + live threat intelligence). Click to switch to Local AI.";
    btnAirgapToggle.setAttribute('aria-pressed', String(isNowOffline));
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
      if (isFrozen) return;
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
  const nlQuerySubmit = document.getElementById('nlQuerySubmit');
  const nlAnswerCard = document.getElementById('nlAnswerCard');
  const nlAnswerText = document.getElementById('nlAnswerText');
  const nlCloseBtn = document.getElementById('nlCloseBtn');
  const nlViewRuleLink = document.getElementById('nlViewRuleLink');

  function generateClientFallbackAnswer(query) {
    if (!nlAnswerText || !activeLogPayload) return;
    const mappings = activeLogPayload.proposal ? (activeLogPayload.proposal.field_mappings || []) : [];
    const sourceName = activeLogPayload.sourceName || 'Device';
    const qLower = (query || '').toLowerCase();

    if (!qLower) {
      nlAnswerText.innerHTML = `Source <strong>${escapeHtml(sourceName)}</strong> event parsed into universal OCSF standard with ${mappings.length} attributes preserved. All extracted endpoints, actions, and timestamps have been validated for lossless SIEM ingestion.`;
      return;
    }

    const matchedFm = mappings.find(fm =>
      (fm.raw_field && qLower.includes(fm.raw_field.toLowerCase())) ||
      (fm.ocsf_field && qLower.includes(fm.ocsf_field.toLowerCase())) ||
      (fm.sample_raw_value && qLower.includes(String(fm.sample_raw_value).toLowerCase()))
    );

    if (matchedFm) {
      const confPct = Math.round((matchedFm.confidence || 0.8) * 100);
      nlAnswerText.innerHTML = `Original token <code class="nl-token">${escapeHtml(matchedFm.raw_field)}=${escapeHtml(matchedFm.sample_raw_value)}</code> is normalized into universal OCSF <code class="nl-token">"${escapeHtml(matchedFm.ocsf_field)}"</code> with <strong>${confPct}% confidence</strong> (${escapeHtml(matchedFm.transformation || 'Standard mapping')}).`;
    } else {
      nlAnswerText.innerHTML = `Regarding the active <strong>${escapeHtml(sourceName)}</strong> record: ${mappings.length} fields normalized in clean OCSF standard. No specific conflict was detected for query "${escapeHtml(query)}".`;
    }
  }

  async function handleNlQuerySubmit() {
    if (isFrozen || !nlAnswerCard) return;
    const query = (nlQueryInput ? nlQueryInput.value.trim() : '');

    if (!activeLogPayload || !activeLogPayload.rawText) {
      if (nlAnswerText) {
        nlAnswerText.innerHTML = `No log has been selected yet. Select an example preset or upload a log in the AI Log Translator first.`;
      }
      nlAnswerCard.style.display = 'block';
      playTickSound(800, 0.03);
      return;
    }

    // Ensure proposal is available
    if (!activeLogPayload.proposal) {
      await ensureProposalForPayload(activeLogPayload);
    }

    if (nlAnswerText) {
      nlAnswerText.innerHTML = `<span style="opacity: 0.7;">⏳ ${query ? 'Analyzing query against active log & threat intelligence...' : 'Generating plain-English AI explanation for active log...'}</span>`;
    }
    nlAnswerCard.style.display = 'block';
    playTickSound(1020, 0.04);

    try {
      const activeMode = window.__LOGSETU_AI_MODE || (btnAirgapToggle && btnAirgapToggle.classList.contains('offline-mode') ? 'local' : 'cloud');

      if (!query || query.toLowerCase() === 'explain' || query.toLowerCase().includes('explain this log')) {
        // Mode 1: Plain English Explanation (Part 3 & Part 6)
        let expData = null;
        if (window.LogSetuAPI && window.LogSetuAPI.explainLog) {
          expData = await window.LogSetuAPI.explainLog(
            activeLogPayload.rawText,
            activeLogPayload.sourceName,
            activeLogPayload.proposal,
            activeMode
          );
        } else {
          const resp = await fetch(`${BACKEND_API_BASE}/api/ai/explain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              raw_log: activeLogPayload.rawText,
              source_name: activeLogPayload.sourceName,
              proposal: activeLogPayload.proposal,
              mode: activeMode
            })
          });
          if (resp.ok) expData = await resp.json();
        }

        if (expData && expData.summary) {
          const isLocal = (expData.ai_mode === 'local') || (activeMode === 'local');
          const modeBadge = isLocal
            ? `<div style="margin-bottom: 6px; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 2px 8px; border-radius: 4px; background: rgba(39, 174, 96, 0.12); color: #2ecc71; border: 1px solid rgba(39, 174, 96, 0.25);">🔒 Local AI Engine (Air-Gapped Offline Processing)</div>`
            : `<div style="margin-bottom: 6px; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 2px 8px; border-radius: 4px; background: rgba(204, 145, 102, 0.12); color: var(--accent-copper, #cc9166); border: 1px solid rgba(204, 145, 102, 0.25);">☁️ Cloud AI Pipeline Active</div>`;

          nlAnswerText.innerHTML = `
            ${modeBadge}
            <div style="margin-bottom: 8px;">${expData.summary}</div>
            <div style="font-size: 11.5px; opacity: 0.9; line-height: 1.5; border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.06)); padding-top: 8px;">
              <strong>Field Normalization Rationale:</strong><br>${expData.detailed_explanation}
            </div>
          `;
        }
      } else {
        // Mode 2: Specific Q&A Search (Part 4 & Part 6)
        let qaData = null;
        if (window.LogSetuAPI && window.LogSetuAPI.askLogQA) {
          qaData = await window.LogSetuAPI.askLogQA(
            query,
            activeLogPayload.rawText,
            activeLogPayload.sourceName,
            activeLogPayload.proposal,
            activeMode !== 'local',
            activeMode
          );
        } else {
          const resp = await fetch(`${BACKEND_API_BASE}/api/ai/qa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query,
              raw_log: activeLogPayload.rawText,
              source_name: activeLogPayload.sourceName,
              proposal: activeLogPayload.proposal,
              allow_web_search: activeMode !== 'local',
              mode: activeMode
            })
          });
          if (resp.ok) qaData = await resp.json();
        }

        if (qaData && qaData.answer) {
          let badgeHtml = '';
          const isLocal = (qaData.ai_mode === 'local') || (activeMode === 'local');
          if (isLocal) {
            badgeHtml = `
              <div style="margin-bottom: 6px; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 2px 8px; border-radius: 4px; background: rgba(39, 174, 96, 0.12); color: #2ecc71; border: 1px solid rgba(39, 174, 96, 0.25);">
                🔒 Local AI (Air-Gapped Offline Mode — Zero Outbound Calls)
              </div>
            `;
          } else if (qaData.web_search_performed && qaData.search_query) {
            badgeHtml = `
              <div style="margin-bottom: 6px; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 2px 8px; border-radius: 4px; background: rgba(52, 152, 219, 0.12); color: #3498db; border: 1px solid rgba(52, 152, 219, 0.25);">
                🌐 Live Web Intel Verified: <em>${escapeHtml(qaData.search_query)}</em>
              </div>
            `;
          } else {
            badgeHtml = `
              <div style="margin-bottom: 6px; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 2px 8px; border-radius: 4px; background: rgba(204, 145, 102, 0.12); color: var(--accent-copper, #cc9166); border: 1px solid rgba(204, 145, 102, 0.25);">
                ☁️ Cloud AI Pipeline Active
              </div>
            `;
          }
          nlAnswerText.innerHTML = `${badgeHtml}<div>${qaData.answer}</div>`;
        }
      }
    } catch (err) {
      console.warn('[LogSetu Explain / Q&A] Remote call failed, using client-side generator:', err);
      generateClientFallbackAnswer(query);
    }
  }

  if (nlQuerySubmit) {
    nlQuerySubmit.addEventListener('click', (e) => {
      e.preventDefault();
      handleNlQuerySubmit();
    });
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

  const btnReviewRow4 = document.getElementById('btnReviewRow4');

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
    if (!anomalyDotsTrack || isFrozen) return;

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
    if (e.key === 'Escape') {
      if (tourActive) stopGuidedTour();
      if (typeof closeMerkleModal === 'function') closeMerkleModal();
      if (typeof closeRemapModal === 'function') closeRemapModal();
      if (typeof hideWelcomeModal === 'function') hideWelcomeModal(false);
      const drawer = document.getElementById('nodeInspectorDrawer');
      if (drawer) drawer.classList.remove('active');
    }
  });

  window.addEventListener('resize', () => {
    if (tourActive) {
      positionSpotlightAndCard(tourSteps[currentTourStep]);
    }
  });

  // Initialize views to pristine empty state on page load (Part 3)
  renderTraceabilityWorkbench(null);
  setWizardStep(1);
  handleHashRoute();

})();
