// const API_BASE = 'http://localhost:5000/api'; // or use import.meta.env.VITE_API_URL
// let alreadyLoaded = false;

// function getProjectId() {
//   const p = new URLSearchParams(window.location.search);
//   const id = p.get('id') || p.get('projectId') || null;
//   return id ? String(id) : null;
// }

// function getAuthHeaders() {
//   const token = localStorage.getItem('token');
//   return token ? { Authorization: `Bearer ${token}` } : {};
// }

// export async function loadFromLMS(vm) {
//   if (alreadyLoaded) return;
//   alreadyLoaded = true;

//   const id = getProjectId();
//   if (!id) return;

//   const url = `${API_BASE}/project/${encodeURIComponent(id)}.sb3`; // singular
//   console.log('[LMS] load', url);

//   const resp = await fetch(url, { headers: { ...getAuthHeaders() } });
//   if (!resp.ok) return; // 404 => start blank

//   const ab = await resp.arrayBuffer();

//   // Clean any auto-added sprites before loading the real project
//   try {
//     vm.stopAll();
//     if (vm?.runtime?.targets?.length) {
//       for (const t of [...vm.runtime.targets]) {
//         if (!t.isStage) await vm.deleteSprite(t.id);
//       }
//     }
//   } catch (_) {}

//   await vm.loadProject(ab);
// }

// export async function saveToLMS(vm) {
//   const id = getProjectId();
//   if (!id) {
//     alert('No project id in URL (?id=...)');
//     return;
//   }

//   const ab = await vm.saveProjectSb3();
//   const url = `${API_BASE}/project/${encodeURIComponent(id)}.sb3`; // singular + encoded
//   console.log('[LMS] save', url);

//   const res = await fetch(url, {
//     method: 'PUT',
//     body: new Blob([ab], { type: 'application/octet-stream' }),
//     headers: { ...getAuthHeaders() },
//   });

//   const text = await res.text().catch(() => '');
//   if (!res.ok) {
//     alert(`Save failed: ${res.status} ${text}`);
//     return;
//   }
//   alert('Saved to LMS!');
// }


// src/lib/savetolms.js (or wherever this sits)

let alreadyLoaded = false;

// read query params once
const qs = new URLSearchParams(window.location.search);
// apiBase comes without /api for project routes; both /project and /api/project
// exist in your server, but we'll default to /api to match your current routes.
const RAW_BASE = (qs.get('apiBase') || 'http://localhost:5000').replace(/\/+$/, '');
const API_BASE = `${RAW_BASE}/api`; // your routes also mounted under /api/project
const TOKEN = qs.get('token') || ''; // pass via ?token=..., don't rely on localStorage

function getProjectSlotId() {
  // IMPORTANT: for .sb3 we prefer projectId (student practice). If not present, fall back to id (chapter).
  const pid = qs.get('projectId');
  const cid = qs.get('id');
  const id = pid || cid || null;
  return id ? String(id) : null;
}

function getAuthHeaders() {
  return TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};

}

export async function loadFromLMS(vm) {
  if (alreadyLoaded) return;
  alreadyLoaded = true;

  const id = getProjectSlotId();
  if (!id) return;

  const url = `${API_BASE}/project/${encodeURIComponent(id)}.sb3`;
  console.log('[LMS] load', url);

  const resp = await fetch(url, { headers: getAuthHeaders() });
  if (!resp.ok) return; // 404 -> start blank

  const ab = await resp.arrayBuffer();

  // clean default sprites before loading
  try {
    vm.stopAll();
    if (vm?.runtime?.targets?.length) {
      for (const t of [...vm.runtime.targets]) {
        if (!t.isStage) await vm.deleteSprite(t.id);
      }
    }
  } catch {}

  await vm.loadProject(ab);
}

export async function saveToLMS(vm) {
  const id = getProjectSlotId();
  if (!id) {
    alert('No project id. Provide ?projectId=<practiceId> for students or ?id=<chapterId> for admin.');
    return;
  }

  const ab = await vm.saveProjectSb3();
  const url = `${API_BASE}/project/${encodeURIComponent(id)}.sb3`;
  console.log('[LMS] save', url);

  const res = await fetch(url, {
    method: 'PUT',
    body: new Blob([ab], { type: 'application/octet-stream' }),
    headers: getAuthHeaders(),
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    alert(`Save failed: ${res.status} ${text}`);
    return;
  }
  alert('Saved to LMS!');
}