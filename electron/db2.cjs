const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "templates.json");

// Pastikan folder dan file tersedia
function initStorage() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ templates: {} }, null, 2));
}

function readData() {
  initStorage();
  const raw = fs.readFileSync(dbPath);
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// CRUD TEMPLATE
function getTemplates() {
  const db = readData();
//   return Object.entries(db.templates).map(([filename, data]) => ({
//     id: filename,
//     ...data
//   })) | [];
  return Object.values(db.templates);
}

function addTemplate(name, dataUrl) {
  const db = readData();
  console.debug("db.templates[name]", db.templates[name]);
  if (db.templates[name]) throw new Error("Template already exists.");
  db.templates[name] = {
    name,
    frames: [],
    dataUrl,
  };
  writeData(db);
}

function findTemplate(name) {
    const db = readData();
    const template = db.templates[name];
    if (!template) throw new Error("Template not found.");

    return db.templates[name];
}

function deleteTemplate(name) {
  const db = readData();
  delete db.templates[name];
  writeData(db);
}

// CRUD FRAME
function getFrames(templateName) {
  const db = readData();
  return db.templates[templateName]?.frames || [];
}

function addFrame(templateName, frame) {
  const db = readData();
  console.debug("db.templates: ", db.templates);
  if (!db.templates[templateName]) throw new Error("Template not found.");
  db.templates[templateName].frames.push(frame);
  writeData(db);
}

function updateFrame(templateName, frameId, updatedFrame) {
  const db = readData();
  const frames = db.templates[templateName]?.frames;
  if (!frames) throw new Error("Template or frame not found.");

  const idx = frames.findIndex((f) => f.id === frameId);
  if (idx === -1) throw new Error("Frame not found.");

  frames[idx] = { ...frames[idx], ...updatedFrame };
  writeData(db);
}

function deleteFrame(templateName, frameId) {
  const db = readData();
  const frames = db.templates[templateName]?.frames;
  if (!frames) throw new Error("Template or frame not found.");

  db.templates[templateName].frames = frames.filter((f) => f.id !== frameId);
  writeData(db);
}

module.exports = {
  getTemplates,
  addTemplate,
  deleteTemplate,
  findTemplate,
  getFrames,
  addFrame,
  updateFrame,
  deleteFrame,
};
