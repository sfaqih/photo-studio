// main.js
const { app, BrowserWindow, ipcMain, dialog, globalShortcut, screen } = require("electron");
const path = require("path");
const fs = require("fs");
const db = require('./db.cjs');
const log = require('electron-log');
const { compressImagesFromFolder } = require('./utils.js');

// Setup logging
log.transports.file.level = 'info';

ipcMain.handle("dialog:openFolder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (result.canceled || result.filePaths.length === 0) return [];

  const dirPath = result.filePaths[0];
  const basename = path.basename(dirPath)
  const files = fs.readdirSync(dirPath);
  const imageFiles = files
    .filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
    .map((file) => ({
      name: file,
      url: `${path.join(dirPath, file)}`,
    }));

  const resultFolder = {
    dirPath,
    basename,
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
  } catch (err) {
    console.error(`Error loading image ${filePath}:`, err);
    return null; // atau bisa juga throw err jika ingin tangani di React
  }
});

ipcMain.handle('compress-images-folder', async (event, folder, output) => {
  console.debug("Compress Folder: ", folder)
  console.debug("Compress Output: ", output);
  try {
    return await compressImagesFromFolder(folder, output);
  } catch (error) {
    return null;
  }
})

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

async function getPrinters() {
  const win = new BrowserWindow({ show: false }); // Invisible window

  const printers = await win.webContents.getPrintersAsync();
  win.close();
  return printers;
}

// let mainWindow;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize

  const win = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    fullscreen: true,
    fullScreenable: true
  });
  console.log("[main] preloadPath:", path.join(__dirname, "preload.js"));


  win.maximize();
  win.setTitle("Photo Studio");
  win.loadFile(path.join(__dirname, '../react-dist/index.html'));
  // win.loadURL("http://localhost:5173/"); // If running React dev server
  // mainWindow = win
  // win.loadURL("http://localhost:5173/template");

  // win.loadURL("http://localhost:5173/select-template");
}

ipcMain.handle('get-printers', async () => {

  try {
    const printers = await getPrinters();

    // Tambahkan informasi status siap
    return printers.map(printer => {
      return {
        ...printer,
        isReady: printer.status === 0, // Status 0 biasanya berarti printer siap
        // Cek apakah ini printer EPSON L8050 (prioritaskan)
        isEpsonL8050: printer.name.includes('EPSON L8050') ||
          printer.displayName.includes('EPSON L8050')
      };
    });
  } catch (error) {
    console.error('Error getting printers:', error);
    throw error;
  }
});

function createWindowSetupTemplate() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    resizable: false
  });

  win.maximize();
  win.setTitle("Photo Studio")
  // win.loadFile(path.join(__dirname, '../react-dist/template.html'));
  // win.loadURL("http://localhost:5173/template");
}

app.whenReady().then(() => {
  globalShortcut.register('Shift+CommandOrControl+T', () => {
    createWindowSetupTemplate()
  })
}).then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});


// IPC handler untuk mencetak foto
ipcMain.handle('print-photo', async (event, { printerName, imageData, paperSize, custFolder }) => {
  console.debug('printerName: ', printerName)
  console.debug('paperSize: ', paperSize)
  console.debug('custFolder: ', custFolder)

  if (!fs.existsSync(custFolder)) {
    fs.mkdirSync(custFolder);
  }

  try {
    // Buat tempat untuk menyimpan gambar sementara
    const tempImgPath = path.join(custFolder, `final-${Date.now()}.jpg`);

    // Simpan gambar dari dataUrl
    const base64Data = imageData.split(';base64,').pop();
    fs.writeFileSync(tempImgPath, base64Data, { encoding: 'base64' });

    // Setup opsi cetak
    const printOptions = {
      silent: true, // Tidak tampilkan dialog print
      printBackground: true,
      deviceName: printerName,
      pageSize: {
        width: paperSize.pageSize.width / 300 * 25.4, // Convert DPI ke mm
        height: paperSize.pageSize.height / 300 * 25.4
      },
      margins: {
        marginType: 'custom',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }
    };

    // Buat window temporary untuk mencetak
    const printWindow = new BrowserWindow({
      width: paperSize.pageSize.width,
      height: paperSize.pageSize.height,
      show: false
    });

    // Load HTML khusus untuk mencetak
    const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body, html {
                  margin: 0;
                  padding: 0;
                  overflow: hidden;
                  width: 100%;
                  height: 100%;
                }
                img {
                  width: 100%;
                  height: 100%;
                  object-fit: contain;
                }
              </style>
            </head>
            <body>
              <img src="${tempImgPath}" />
            </body>
          </html>
        `;

    // Simpan HTML ke file temp
    const tempHtmlPath = path.join(custFolder, `print-${Date.now()}.html`);
    fs.writeFileSync(tempHtmlPath, htmlContent);

    // Load HTML dan cetak
    await printWindow.loadFile(tempHtmlPath);

    // Tunggu sampai konten siap
    printWindow.webContents.on('did-finish-load', () => {
      setTimeout(() => {
        printWindow.webContents.print(printOptions, (success, errorType) => {
          // Cleanup file temporary
          try {
            fs.unlinkSync(tempImgPath);
            fs.unlinkSync(tempHtmlPath);
          } catch (err) {
            console.error('Error cleaning temp files:', err);
          }

          printWindow.close();

          if (!success) {
            throw new Error(`Print failed: ${errorType}`);
          }
        });
      }, 1000); // Tunggu sebentar sampai gambar benar-benar dimuat
    });

    return { success: true };
  } catch (error) {
    console.error('Error printing photo:', error);
    throw error;
  }
});
