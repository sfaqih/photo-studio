import fs from 'fs';
import path from 'path';
import os from 'os';

export const printPhoto = async(printerName, imageData, paperSize) => {
    try {
        // Buat tempat untuk menyimpan gambar sementara
        const tempDir = os.tmpdir();
        const tempImgPath = path.join(tempDir, `print/print-${Date.now()}.png`);

        // Simpan gambar dari dataUrl
        const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync(tempImgPath, base64Data, 'base64');

        // Setup opsi cetak
        const printOptions = {
            silent: true, // Tidak tampilkan dialog print
            printBackground: true,
            deviceName: printerName,
            pageSize: {
                width: paperSize.width / 300 * 25.4, // Convert DPI ke mm
                height: paperSize.height / 300 * 25.4
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
            width: paperSize.width,
            height: paperSize.height,
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
        const tempHtmlPath = path.join(tempDir, `photobooth-print-${Date.now()}.html`);
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
}