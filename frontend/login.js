/* ==========================================================================
   LogSetu — Role-Based Access Control (RBAC) & Login Modal
   Provides Analyst, Admin / Officer, and Compliance Auditor personas.
   Gates critical approvals (AI translation wax-seal, drift re-mapping) to Admin.
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'logsetu_user_role';

  const ROLES = {
    analyst: {
      id: 'analyst',
      name: 'Security Analyst',
      badge: 'ANALYST',
      desc: 'Real-time telemetry, threat correlation, and natural language log explainability.',
      canApprove: false,
    },
    admin: {
      id: 'admin',
      name: 'Admin / Officer',
      badge: 'ADMIN / OFFICER',
      desc: 'Full authority: approve AI schema translations, resolve format drift, sign checkpoints.',
      canApprove: true,
    },
    auditor: {
      id: 'auditor',
      name: 'Compliance Auditor',
      badge: 'AUDITOR',
      desc: 'Forensic integrity: inspect immutable hash chains, Merkle proofs, and Ed25519 signatures.',
      canApprove: false,
    },
  };

  let currentRole = localStorage.getItem(STORAGE_KEY) || 'admin';
  if (!ROLES[currentRole]) currentRole = 'admin';

  function getCurrentRole() {
    return ROLES[currentRole];
  }

  function setRole(roleId) {
    if (ROLES[roleId]) {
      currentRole = roleId;
      localStorage.setItem(STORAGE_KEY, roleId);
      updateRoleBadge();
      updateActionPermissions();
    }
  }

  // Inject Role Selector button into top header
  function initRoleBadge() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    const btnRole = document.createElement('button');
    btnRole.id = 'btnRoleSelector';
    btnRole.className = 'btn-pill';
    btnRole.title = 'Switch Role (Analyst / Admin / Auditor)';
    btnRole.style.display = 'inline-flex';
    btnRole.style.alignItems = 'center';
    btnRole.style.gap = '6px';
    btnRole.style.fontSize = '12px';
    btnRole.style.cursor = 'pointer';

    btnRole.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
      <span id="roleLabelText">Role: ${ROLES[currentRole].name}</span>
      <span style="font-size: 9px; opacity: 0.7;">▾</span>
    `;

    btnRole.addEventListener('click', openRoleModal);
    headerActions.insertBefore(btnRole, headerActions.children[1] || headerActions.firstChild);
  }

  function updateRoleBadge() {
    const lbl = document.getElementById('roleLabelText');
    if (lbl) {
      lbl.textContent = `Role: ${ROLES[currentRole].name}`;
    }
  }

  // Create role selection modal dialog
  function createRoleModal() {
    if (document.getElementById('logsetuRoleModal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'logsetuRoleModal';
    overlay.className = 'merkle-modal-overlay';
    overlay.style.display = 'none';
    overlay.style.zIndex = '99999';

    overlay.innerHTML = `
      <div class="glass-card-3d" style="width: 480px; max-width: 92vw; padding: 28px; border-radius: 16px; border: 1px solid var(--accent-copper-trans, rgba(174,147,87,0.3)); background: rgba(14,19,27,0.92); backdrop-filter: blur(20px); color: #fff; box-shadow: 0 24px 60px rgba(0,0,0,0.6);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(174,147,87,0.15); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(174,147,87,0.4); color: #ae9357;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 600; font-family: var(--font-display, serif); letter-spacing: 0.03em;">Operator Persona & Role</h3>
              <p style="margin: 0; font-size: 11px; opacity: 0.65;">Select an active identity to simulate multi-persona operations</p>
            </div>
          </div>
          <button id="btnCloseRoleModal" style="background: transparent; border: none; color: #fff; opacity: 0.6; font-size: 18px; cursor: pointer;">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px;">
          ${Object.values(ROLES).map(r => `
            <div class="role-card-option glass-card-3d" data-role-id="${r.id}" style="padding: 14px 16px; border-radius: 10px; cursor: pointer; border: 1px solid ${r.id === currentRole ? '#ae9357' : 'rgba(255,255,255,0.08)'}; background: ${r.id === currentRole ? 'rgba(174,147,87,0.12)' : 'rgba(255,255,255,0.02)'}; transition: all 0.2s ease;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-weight: 600; font-size: 13px; color: ${r.id === currentRole ? '#ae9357' : '#fff'};">${r.name}</span>
                <span style="font-size: 9px; padding: 2px 7px; border-radius: 4px; background: rgba(255,255,255,0.08); letter-spacing: 0.05em; font-family: monospace;">${r.badge}</span>
              </div>
              <p style="margin: 0; font-size: 11px; opacity: 0.7; line-height: 1.4;">${r.desc}</p>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button class="btn-pill" id="btnConfirmRole" style="padding: 6px 18px; font-weight: 500;">Confirm Persona</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Event listeners
    document.getElementById('btnCloseRoleModal').addEventListener('click', closeRoleModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeRoleModal();
    });

    const cards = overlay.querySelectorAll('.role-card-option');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => {
          c.style.border = '1px solid rgba(255,255,255,0.08)';
          c.style.background = 'rgba(255,255,255,0.02)';
          const nameSpan = c.querySelector('span');
          if (nameSpan) nameSpan.style.color = '#fff';
        });
        card.style.border = '1px solid #ae9357';
        card.style.background = 'rgba(174,147,87,0.12)';
        const nameSpan = card.querySelector('span');
        if (nameSpan) nameSpan.style.color = '#ae9357';
        overlay.dataset.selectedRole = card.dataset.roleId;
      });
    });

    document.getElementById('btnConfirmRole').addEventListener('click', () => {
      const selected = overlay.dataset.selectedRole;
      if (selected) {
        setRole(selected);
      }
      closeRoleModal();
    });
  }

  function openRoleModal() {
    createRoleModal();
    const modal = document.getElementById('logsetuRoleModal');
    if (modal) {
      modal.dataset.selectedRole = currentRole;
      modal.style.display = 'flex';
    }
  }

  function closeRoleModal() {
    const modal = document.getElementById('logsetuRoleModal');
    if (modal) modal.style.display = 'none';
  }

  function showToast(msg) {
    let toast = document.getElementById('logsetuToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'logsetuToast';
      toast.className = 'glass-card-3d';
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.right = '24px';
      toast.style.padding = '12px 20px';
      toast.style.borderRadius = '8px';
      toast.style.zIndex = '999999';
      toast.style.border = '1px solid rgba(174,147,87,0.4)';
      toast.style.background = 'rgba(18,24,34,0.95)';
      toast.style.color = '#fff';
      toast.style.fontSize = '12px';
      toast.style.boxShadow = '0 12px 32px rgba(0,0,0,0.5)';
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
    }, 3200);
  }

  function updateActionPermissions() {
    // Intercept approval buttons if not admin
    const btnWaxSeal = document.getElementById('btnWizardWaxSeal');
    if (btnWaxSeal && !btnWaxSeal._roleHooked) {
      btnWaxSeal._roleHooked = true;
      btnWaxSeal.addEventListener('click', (e) => {
        if (!ROLES[currentRole].canApprove) {
          e.stopPropagation();
          showToast('⚠️ Approval Gated: Switch role to Admin / Officer to seal translation into the ledger.');
        }
      }, true);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initRoleBadge();
    updateActionPermissions();
  });

  window.LogSetuAuth = {
    getRole: getCurrentRole,
    setRole: setRole,
    openModal: openRoleModal,
  };

})();
