// main.js
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const db = require('./db.cjs');

ipcMain.handle("dialog:openFolder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (result.canceled || result.filePaths.length === 0) return [];

  const dirPath = result.filePaths[0];
  const files = fs.readdirSync(dirPath);
  const imageFiles = files
    .filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
    .map((file) => ({
      name: file,
      url: `${path.join(dirPath, file)}`,
    }));

  const resultFolder = {
    dirPath,
    imageFiles
  }

  console.debug('resultFolder: ', resultFolder)
  return resultFolder;
});

ipcMain.handle("directory:readImages", async (event, dirPath) => {
  
  const files = fs.readdirSync(dirPath);
  const imageFiles = files
    .filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
    .map((file) => {
      const fullPath = path.join(dirPath, file);
      const data = fs.readFileSync(fullPath);
      const ext = path.extname(file).slice(1);
      const base64 = `data:image/${ext};base64,${data.toString('base64')}`;

      return {
        name: file,
        url: `${path.join(dirPath, file)}`,
        base64,
      }
    });

  const resultFolder = {
    dirPath,
    imageFiles
  }
  return resultFolder;
});

ipcMain.handle("load-image-base64", async (event, filePath) => {
  const path = require("path");
  const fs = require("fs");

  console.debug("filePath", filePath)

  try {
    const buffer = fs.readFileSync(filePath.url);
    const ext = path.extname(filePath.name).substring(1) || "png"; // default "png" jika tidak ada ekstensi
    const base64 = buffer.toString('base64');
    const dataUri = `data:image/${ext};base64,${base64}`;
    return dataUri;
    // const data = fs.readFileSync(filePath.url);
    // const base64 = `data:image/${ext};base64,${data.toString("base64")}`;
    // return base64;
  } catch (err) {
    console.error(`Error loading image ${filePath}:`, err);
    return null; // atau bisa juga throw err jika ingin tangani di React
  }
});

// === IPC for Template CRUD ===
ipcMain.handle("template:getAll", () => db.getTemplates());

ipcMain.handle("template:add", (event, name, data) => {
  db.addTemplate(name, data);
});

ipcMain.handle("template:find", (event, name) => {
  db.findTemplate(name);
});

ipcMain.handle("template:delete", (event, name) => {
  db.deleteTemplate(name);
});

// === IPC for Frame CRUD ===
ipcMain.handle("frame:getAll", (event, templateName) => db.getFrames(templateName));

ipcMain.handle("frame:add", (event, templateName, frame) => {
  db.addFrame(templateName, frame);
});

ipcMain.handle("frame:update", (event, templateName, frameId, data) => {
  db.updateFrame(templateName, frameId, data);
});

ipcMain.handle("frame:delete", (event, templateName, frameId) => {
  db.deleteFrame(templateName, frameId);
});

ipcMain.handle("db:getTemplates", () => db.getTemplates());
ipcMain.handle("db:saveTemplate", (e, id, data) => db.saveTemplate(id, data));
ipcMain.handle("db:deleteTemplate", (e, id) => db.deleteTemplate(id));
ipcMain.handle("db:getTemplate", (e, id) => db.getTemplate(id));
ipcMain.handle("db:saveFrame", (e, tplId, frame) => db.saveFrame(tplId, frame));
ipcMain.handle("db:updateFrame", (e, tplId, frameId, update) => db.updateFrame(tplId, frameId, update));
ipcMain.handle("db:deleteFrame", (e, tplId, frameId) => db.deleteFrame(tplId, frameId));

ipcMain.handle("template:upload", (e, fileName, dataUrl) => {
  const filePath = path.join(__dirname, `../public/templates/${fileName}`);
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
  return `/templates/${fileName}`;
});


function createWindow() {
    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    console.log("[main] preloadPath:", path.join(__dirname, "preload.js"));
  
    // win.loadURL("http://localhost:5173/"); // If running React dev server
    win.loadURL("http://localhost:5173/select-template");
    win.webContents.openDevTools();
}
  
app.whenReady().then(createWindow);
