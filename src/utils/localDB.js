const DB_NAME = 'niko_app_db';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (ev) => {
      const db = ev.target.result;
      if (!db.objectStoreNames.contains('memories')) {
        const store = db.createObjectStore('memories', { keyPath: 'id', autoIncrement: true });
        store.createIndex('user_id', 'user_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('letters')) {
        const store = db.createObjectStore('letters', { keyPath: 'id', autoIncrement: true });
        store.createIndex('user_id', 'user_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('messages')) {
        const store = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
        store.createIndex('user_id', 'user_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('planner')) {
        db.createObjectStore('planner', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore(storeName, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = fn(store);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error || new Error('Transaction error'));
  });
}

export async function getMemories(userId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('memories', 'readonly');
    const idx = tx.objectStore('memories').index('user_id');
    const req = idx.getAll(IDBKeyRange.only(userId));
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveMemory(userId, { title, emoji, category, photoFile, createdBy }) {
  const created_at = new Date().toISOString();
  let photo_blob = null;
  if (photoFile) {
    photo_blob = await photoFile.arrayBuffer().then((buf) => new Blob([buf], { type: photoFile.type }));
  }
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB();
      const tx = db.transaction('memories', 'readwrite');
      const store = tx.objectStore('memories');
      const record = { user_id: userId, title, emoji, category, created_at, photo_blob, created_by: createdBy };
      const req = store.add(record);
      req.onsuccess = () => {
        const id = req.result;
        resolve({ ...record, id });
      };
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function getLetters(userId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('letters', 'readonly');
    const idx = tx.objectStore('letters').index('user_id');
    const req = idx.getAll(IDBKeyRange.only(userId));
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveLetter(userId, payload, createdBy) {
  const created_at = new Date().toISOString();
  const record = { user_id: userId, ...payload, created_at, created_by: createdBy };
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('letters', 'readwrite');
    const store = tx.objectStore('letters');
    const req = store.add(record);
    req.onsuccess = () => resolve({ ...record, id: req.result });
    req.onerror = () => reject(req.error);
  });
}

export async function deleteLetter(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('letters', 'readwrite');
    const store = tx.objectStore('letters');
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function getPlanner() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('planner', 'readonly');
    const store = tx.objectStore('planner');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getMessages(userId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('messages', 'readonly');
    const idx = tx.objectStore('messages').index('user_id');
    const req = idx.getAll(IDBKeyRange.only(userId));
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveMessage(userId, payload, createdBy) {
  const created_at = new Date().toISOString();
  const record = { user_id: userId, ...payload, created_at, created_by: createdBy };
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('messages', 'readwrite');
    const store = tx.objectStore('messages');
    const req = store.add(record);
    req.onsuccess = () => resolve({ ...record, id: req.result });
    req.onerror = () => reject(req.error);
  });
}

export async function addPlan(payload, createdBy) {
  const created_at = new Date().toISOString();
  const record = { ...payload, created_at, created_by: createdBy };
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('planner', 'readwrite');
    const store = tx.objectStore('planner');
    const req = store.add(record);
    req.onsuccess = () => resolve({ ...record, id: req.result });
    req.onerror = () => reject(req.error);
  });
}

export async function updatePlanner(plannerObj) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('planner', 'readwrite');
    const store = tx.objectStore('planner');
    const req = store.put(plannerObj);
    req.onsuccess = () => resolve(plannerObj);
    req.onerror = () => reject(req.error);
  });
}

export async function toggleTask(planId, taskId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('planner', 'readwrite');
    const store = tx.objectStore('planner');
    const req = store.get(planId);
    req.onsuccess = () => {
      const plan = req.result;
      if (!plan) return resolve(null);
      plan.tasks = plan.tasks || [];
      plan.tasks = plan.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
      const updateReq = store.put(plan);
      updateReq.onsuccess = () => resolve(plan);
      updateReq.onerror = () => reject(updateReq.error);
    };
    req.onerror = () => reject(req.error);
  });
}

export default {
  getMemories,
  saveMemory,
  getLetters,
  saveLetter,
  deleteLetter,
  getPlanner,
  addPlan,
  toggleTask,
};
