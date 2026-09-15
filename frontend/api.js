/* ==========================================================================
   LogSetu — Frontend API Integration Client
   Universal Log Pre-processing Framework (SIH26156)
   Connects the Midnight Ledger Command Console to the FastAPI Backend.
   Gracefully falls back to client simulation if backend is unreachable.
   ========================================================================== */

(function () {
  'use strict';

  // Determine backend base URL (supports local dev, docker port 8000)
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const defaultApiHost = isLocalhost ? `http://${window.location.hostname}:8000` : 'http://localhost:8000';
  const API_BASE = window.LOGSETU_API_BASE || defaultApiHost;

  class LogSetuAPIClient {
    constructor(baseUrl = API_BASE) {
      this.baseUrl = baseUrl.replace(/\/+$/, '');
      this.isConnected = false;
      this.lastStats = null;
      this.listeners = [];
    }

    async _fetch(endpoint, options = {}) {
      try {
        const url = `${this.baseUrl}${endpoint}`;
        const resp = await fetch(url, {
          ...options,
          headers: {
            'Accept': 'application/json',
            ...(options.headers || {}),
          },
        });
        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({ detail: resp.statusText }));
          throw new Error(errData.detail || `HTTP ${resp.status}`);
        }
        return await resp.json();
      } catch (err) {
        // Log cleanly without throwing fatal errors to keep UI alive
        console.warn(`[LogSetu API] ${endpoint} failed:`, err.message);
        throw err;
      }
    }

    // Health
    async checkHealth() {
      try {
        const data = await this._fetch('/health');
        this.isConnected = data && data.status === 'ok';
        this._notifyStatus(this.isConnected);
        return data;
      } catch (e) {
        this.isConnected = false;
        this._notifyStatus(false);
        return null;
      }
    }

    // Dashboard Statistics
    async getStats() {
      return await this._fetch('/api/stats');
    }

    // Events & Stream
    async getStreamEvents(count = 20) {
      return await this._fetch(`/api/events/stream?count=${count}`);
    }

    async getRecentEvents(count = 20) {
      return await this._fetch(`/api/events/recent?count=${count}`);
    }

    async getEventTrace(eventId) {
      return await this._fetch(`/api/events/${eventId}/trace`);
    }

    // Ingestion
    async ingest(rawText, source = '', customName = '') {
      return await this._fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: rawText, source, custom_name: customName }),
      });
    }

    async ingestBatch(lines, source = '', customName = '') {
      return await this._fetch('/api/ingest/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines, source, custom_name: customName }),
      });
    }

    async ingestFile(file, source = '', customName = '') {
      const formData = new FormData();
      formData.append('file', file);
      if (source) formData.append('source', source);
      if (customName) formData.append('custom_name', customName);
      return await this._fetch('/api/ingest/file', {
        method: 'POST',
        body: formData,
      });
    }

    // Hash Chain
    async getBlocks(count = 10) {
      return await this._fetch(`/api/hashchain/blocks?count=${count}`);
    }

    async verifyChain() {
      return await this._fetch('/api/hashchain/verify', { method: 'POST' });
    }

    async simulateTamper(blockId = null, tamperRaw = true) {
      return await this._fetch('/api/hashchain/tamper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block_id: blockId, tamper_raw: tamperRaw }),
      });
    }

    async healChain() {
      return await this._fetch('/api/hashchain/heal', { method: 'POST' });
    }

    async getLatestCheckpoint() {
      return await this._fetch('/api/hashchain/checkpoint/latest');
    }

    // AI Integrator
    async analyzeAI(lines, sourceName = '', mode = null) {
      const aiMode = mode || window.__LOGSETU_AI_MODE || 'cloud';
      return await this._fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sample_lines: lines, source_name: sourceName, mode: aiMode }),
      });
    }

    async analyzeFileAI(file, sourceName = '', mode = null) {
      const aiMode = mode || window.__LOGSETU_AI_MODE || 'cloud';
      const formData = new FormData();
      formData.append('file', file);
      if (sourceName) formData.append('source_name', sourceName);
      formData.append('mode', aiMode);
      return await this._fetch('/api/ai/analyze/file', {
        method: 'POST',
        body: formData,
      });
    }

    async getProposal(proposalId) {
      return await this._fetch(`/api/ai/proposal/${proposalId}`);
    }

    async approveProposal(proposalId, approver = 'admin') {
      return await this._fetch(`/api/ai/approve/${proposalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approver }),
      });
    }

    async rejectProposal(proposalId) {
      return await this._fetch(`/api/ai/reject/${proposalId}`, { method: 'POST' });
    }

    async listMappings() {
      return await this._fetch('/api/ai/mappings');
    }

    // Drift Detection
    async getDriftStatus() {
      return await this._fetch('/api/drift/status');
    }

    async approveDriftRemap(source) {
      return await this._fetch(`/api/drift/remap/approve/${encodeURIComponent(source)}`, {
        method: 'POST',
      });
    }

    // Correlation
    async getIncidents() {
      return await this._fetch('/api/correlation/incidents');
    }

    // Tiered Routing
    async getRoutingStats() {
      return await this._fetch('/api/routing/stats');
    }

    // Anomaly Detection
    async getAnomalyStream() {
      return await this._fetch('/api/anomaly/stream');
    }

    // AI Log Explainer & Web-Augmented Q&A
    async explainLog(rawLog, sourceName = '', proposal = null, mode = 'cloud') {
      const aiMode = mode || window.__LOGSETU_AI_MODE || 'cloud';
      return await this._fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_log: rawLog, source_name: sourceName, proposal, mode: aiMode }),
      });
    }

    async askLogQA(query, rawLog = '', sourceName = '', proposal = null, allowWebSearch = true, mode = 'cloud') {
      const aiMode = mode || window.__LOGSETU_AI_MODE || 'cloud';
      return await this._fetch('/api/ai/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          raw_log: rawLog,
          source_name: sourceName,
          proposal,
          allow_web_search: allowWebSearch && aiMode !== 'local',
          mode: aiMode,
        }),
      });
    }

    onConnectionChange(cb) {
      this.listeners.push(cb);
    }

    _notifyStatus(connected) {
      this.listeners.forEach((cb) => {
        try { cb(connected); } catch (e) { }
      });
    }
  }

  // Export to window
  const api = new LogSetuAPIClient();
  window.LogSetuAPI = api;

  // ── Auto-Wiring & Live Sync Engine ───────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initBackendSync();
  });

  function initBackendSync() {
    // 1. Inject API Status Indicator in top header
    createStatusBadge();

    // 2. Initial health check
    api.checkHealth().then((health) => {
      if (health) {
        console.log('[LogSetu] Connected to backend service at', api.baseUrl);
        syncDashboardStats();
      }
    });

    // 3. Periodic sync loop (every 3.5 seconds)
    setInterval(() => {
      api.checkHealth().then((health) => {
        if (health) {
          syncDashboardStats();
        }
      });
    }, 3500);

    // 4. Hook into Tamper & Heal actions for dual frontend-backend sync
    hookHashchainTamper();

    // 5. Hook into Explain queries
    hookExplainQuery();
  }

  function createStatusBadge() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    const badge = document.createElement('div');
    badge.id = 'backendStatusBadge';
    badge.className = 'btn-pill';
    badge.style.cursor = 'default';
    badge.style.display = 'inline-flex';
    badge.style.alignItems = 'center';
    badge.style.gap = '6px';
    badge.style.fontSize = '11px';
    badge.style.padding = '4px 10px';
    badge.title = 'FastAPI Backend Connection Status';

    badge.innerHTML = `
      <span id="backendStatusDot" style="width: 7px; height: 7px; border-radius: 50%; background: #e74c3c; display: inline-block; box-shadow: 0 0 6px #e74c3c;"></span>
      <span id="backendStatusText" style="letter-spacing: 0.04em;">Backend: Offline</span>
    `;

    // Insert before the last button
    headerActions.insertBefore(badge, headerActions.firstChild);

    api.onConnectionChange((connected) => {
      const dot = document.getElementById('backendStatusDot');
      const text = document.getElementById('backendStatusText');
      if (dot && text) {
        if (connected) {
          dot.style.background = '#2ecc71';
          dot.style.boxShadow = '0 0 8px #2ecc71';
          text.textContent = 'Backend: Connected (Live)';
          badge.style.borderColor = 'rgba(46, 204, 113, 0.4)';
        } else {
          dot.style.background = '#e74c3c';
          dot.style.boxShadow = '0 0 8px #e74c3c';
          text.textContent = 'Backend: Offline (Simulation)';
          badge.style.borderColor = '';
        }
      }
    });
  }

  async function syncDashboardStats() {
    try {
      const stats = await api.getStats();
      if (!stats) return;

      // Update block count if element exists
      const kpiBlock = document.getElementById('kpiBlock');
      if (kpiBlock && stats.latest_block_id) {
        kpiBlock.textContent = `#${stats.latest_block_id.toLocaleString()}`;
      }

      // Update Throughput KPI
      const kpiThroughput = document.getElementById('kpiThroughput');
      if (kpiThroughput && stats.events_per_sec !== undefined) {
        kpiThroughput.textContent = `${stats.events_per_sec.toFixed(1)} /s`;
      }

      // Update live volume reduction percentage if element exists
      const volumePctElem = document.getElementById('volumeReductionPctText');
      if (volumePctElem && stats.volume_reduction_pct !== undefined) {
        volumePctElem.textContent = `${stats.volume_reduction_pct}%`;
      }
    } catch (e) {
      // Keep silent to avoid spamming console
    }
  }

  function hookHashchainTamper() {
    // Note: app.js directly handles btnSimulateTamper and btnHealChain clicks,
    // invoking window.LogSetuAPI.simulateTamper() and healChain() with UI updates.
  }

  function hookExplainQuery() {
    // Managed centrally in app.js with activeLogPayload context and live web search
  }

})();
