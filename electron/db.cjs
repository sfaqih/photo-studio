// /electron/db.cjs
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data/db.json');
const templatesDir = path.join(__dirname, '../public/templates');

if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, '{}');
if (!fs.existsSync(templatesDir)) fs.mkdirSync(templatesDir, { recursive: true });

function loadDB() {
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

function saveDB(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports = {
  getTemplates: () => Object.entries(loadDB()).map(([key, value]) => ({ id: key, ...value })),
  getTemplate: (id) => loadDB()[id],
  saveTemplate: (id, data) => {
    const db = loadDB();
    db[id] = data;
    saveDB(db);
  },
  deleteTemplate: (id) => {
    const db = loadDB();
    delete db[id];
    saveDB(db);
  },
  saveFrame: (templateId, template) => {
    console.debug("template...", template);
    try {
        const db = loadDB();
        db[templateId] = template;
        saveDB(db);

        console.debug("db[templateId]", db[templateId]);
        console.info("SUCCESS SAVE FRAME");
    } catch (error) {
        console.error("ERROR SAVE FRAME", error);
    }
  },
  updateFrame: (templateId, frameId, updates) => {
    const db = loadDB();
    db[templateId].frames = db[templateId].frames.map(f => f.id === frameId ? { ...f, ...updates } : f);
    saveDB(db);
  },
  deleteFrame: (templateId, frameId) => {
    const db = loadDB();
    db[templateId].frames = db[templateId].frames.filter(f => f.id !== frameId);
    saveDB(db);
  },
};
