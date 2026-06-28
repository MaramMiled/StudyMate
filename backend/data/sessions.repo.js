import fs from "fs";

const DB_FILE = "./db.json";

function readDB() {
  if (!fs.existsSync(DB_FILE)) return { sessions: [] };
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// GET ONE SESSION
export function getSession(id) {
  const db = readDB();
  return db.sessions.find(s => s.id === id);
}

// CREATE SESSION
export function createSession(session) {
  const db = readDB();
  db.sessions.push(session);
  writeDB(db);
  return session;
}

// UPDATE SESSION (IMPORTANT FOR SETTINGS LATER)
export function updateSession(id, updaterFn) {
  const db = readDB();

  db.sessions = db.sessions.map(s =>
    s.id === id ? updaterFn(s) : s
  );

  writeDB(db);

  return db.sessions.find(s => s.id === id);
}