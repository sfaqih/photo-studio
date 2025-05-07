const { contextBridge, ipcRenderer } = require("electron");

console.log('[preload] Loaded!');

contextBridge.exposeInMainWorld("electronAPI", {
  chooseFolder: () => ipcRenderer.invoke("dialog:openFolder"),
  loadImageBase64: (filePath) => ipcRenderer.invoke("load-image-base64", filePath),
  dirReadImages: (directory) => ipcRenderer.invoke("directory:readImages", directory),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printPhoto: (printData) => ipcRenderer.invoke('print-photo', printData),
  compressImages: (folder, output) => ipcRenderer.invoke('compress-images-folder', folder, output),

  getTemplates: () => ipcRenderer.invoke("db:getTemplates"),
  getTemplate: (id) => ipcRenderer.invoke("db:getTemplate", id),
  saveTemplate: (id, data) => ipcRenderer.invoke("db:saveTemplate", id, data),
  deleteTemplate: (id) => ipcRenderer.invoke("db:deleteTemplate", id),
  saveFrame: (tplId, frame) => ipcRenderer.invoke("db:saveFrame", tplId, frame),
  updateFrame: (tplId, frameId, update) => ipcRenderer.invoke("db:updateFrame", tplId, frameId, update),
  deleteFrame: (tplId, frameId) => ipcRenderer.invoke("db:deleteFrame", tplId, frameId),
  uploadTemplate: (fileName, dataUrl) => ipcRenderer.invoke("template:upload", fileName, dataUrl),
});

// === Template CRUD ===
// contextBridge.exposeInMainWorld("templateAPI", {
//   getAll: () => ipcRenderer.invoke("template:getAll"),
//   add: (name, data) => ipcRenderer.invoke("template:add", name, data),
//   delete: (name) => ipcRenderer.invoke("template:delete", name),
//   find: (name) => ipcRenderer.invoke("template:find", name),
// });

// // === Frame CRUD ===
// contextBridge.exposeInMainWorld("frameAPI", {
//   getAll: (templateName) => ipcRenderer.invoke("frame:getAll", templateName),
//   add: (templateName, frame) => ipcRenderer.invoke("frame:add", templateName, frame),
//   update: (templateName, frameId, data) => ipcRenderer.invoke("frame:update", templateName, frameId, data),
//   delete: (templateName, frameId) => ipcRenderer.invoke("frame:delete", templateName, frameId),
// });