import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import { ArrowLeftCircle, Check, Printer } from 'lucide-react';
import { usePhotoStudio } from '../contexts/studio';
import { loadHtmlImage } from '../utils/Image';
import { parseCubeFile, applyLutToImage } from '../utils/Lut';
import { DefaultPaper, DefaultScale } from '../constants/template';
import { Button } from '@material-tailwind/react';

const PrintPreview = () => {
  const navigate = useNavigate();
  const stageRef = useRef(null);
  const { photoStudioSession } = usePhotoStudio();
  
  // State for display and control
  const [templateImage, setTemplateImage] = useState(null);
  const [frames, setFrames] = useState([]);
  const [resolvedImages, setResolvedImages] = useState({});
  const [filteredPhotos, setFilteredPhotos] = useState({});
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [printError, setPrintError] = useState(null);
  const [finalStage, setFinalStage] = useState({ width: 400, height: 595 }); // Default approximation for 4R (4×6″)

  // Access to Electron's API through window.electron
  const electron = window.electronAPI;

  // Load template, frames, and filter from localStorage
  useEffect(() => {
    const loadTemplateFrames = async () => {
      try {
        setLoading(true);
        const photoStudio = photoStudioSession;
        const selectedTemplate = JSON.parse(localStorage.getItem("selectedTemplate") || "null");
        const selectedFilter = JSON.parse(localStorage.getItem("selectedFilter") || "null");
        
        if (!photoStudio || !selectedTemplate) {
          alert("Please restart your journey...");
          navigate('/');
          return;
        }

        // Load template image
        const img = await loadHtmlImage(selectedTemplate?.pathUrl);
        setTemplateImage(img);
        
        // 4R size in pixels (4×6″ at 300dpi = ~1200×1800 pixels)
        // Scale for preview while maintaining aspect ratio
        setFinalStage({ width: DefaultPaper.width * DefaultScale, height: DefaultPaper.height * DefaultScale });
        
        setFrames(photoStudio.frames);
        
        // Load filter data if available
        if (selectedFilter && selectedFilter.id !== 'original' && selectedFilter.path) {
          try {
            const response = await fetch(selectedFilter.path);
            const cubeContent = await response.text();
            const lutData = parseCubeFile(cubeContent);
            selectedFilter.lutData = lutData;
          } catch (error) {
            console.error("Failed to load filter data:", error);
          }
        }
      } catch (error) {
        console.error("Error loading template:", error);
        alert("Failed to load template. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadTemplateFrames();
    loadAvailablePrinters();
  }, [photoStudioSession, navigate]);

  // Load all photos once frames are set
  useEffect(() => {
    if (!frames || frames.length === 0) return;

    const loadAllImages = async () => {
      const results = {};
      setLoading(true);
      for (const frame of frames) {
        if (frame.photo?.preview || frame.photo?.file?.path) {
          try {
            const img = await loadHtmlImage(frame.photo.preview);
            results[frame.id] = img;
          } catch (err) {
            console.error('Failed to load image for frame', frame.id, err);
          }
        }
      }
      setResolvedImages(results);
      
      // Apply saved filter to images if needed
      applySelectedFilter(results);
    };

    loadAllImages();
  }, [frames]);

  // Apply selected filter to all photos
  const applySelectedFilter = async (images) => {
    const selectedFilter = JSON.parse(localStorage.getItem("selectedFilter") || "null");
    if (!selectedFilter || selectedFilter.id === 'original' || !frames) {
      return;
    }
    
    try {
      const filtered = {};
      
      // Apply filter to each image
      for (const frame of frames) {
        if (frame.photo && images[frame.id]) {
          try {
            if (selectedFilter.lutData) {
              const filteredImg = await applyLutToImage(images[frame.id], selectedFilter.lutData);
              filtered[frame.id] = filteredImg;
            }
          } catch (error) {
            console.error(`Failed to apply filter to frame ${frame.id}:`, error);
          }
        }
      }
      setFilteredPhotos(filtered);
      setLoading(false);
    } catch (error) {
      console.error("Error applying filters:", error);
    }
  };

  // Load available printers
  const loadAvailablePrinters = async () => {
    try {
      // Use Electron's IPC to get printers
      const printers = await electron.getPrinters();
      setAvailablePrinters(printers);
      
      // Set EPSON L8050 as default if available
      const epsonPrinter = printers.find(printer => 
        printer.name.toLowerCase().includes('epson') && 
        printer.name.toLowerCase().includes('l8050')
      );
      
      if (epsonPrinter) {
        setSelectedPrinter(epsonPrinter.name);
      } else if (printers.length > 0) {
        setSelectedPrinter(printers[0].name);
      }
    } catch (error) {
      console.error("Failed to load printers:", error);
      setPrintError("Failed to load printers. Please check printer connections.");
    }
  };

  // Print the current canvas
  const handlePrint = async () => {
    if (!stageRef.current || !selectedPrinter) {
      setPrintError("Cannot print: No printer selected or canvas not ready");
      return;
    }

    setPrinting(true);
    setPrintError(null);
    
    try {
      // Get canvas data URL
      const dataURL = stageRef.current.toDataURL({ 
        pixelRatio: 3, // Higher quality for printing
        mimeType: 'image/jpeg',
        quality: 0.95
      });
      
      // Call Electron's print function
      const printResult = await window.electronAPI.printPhoto({
        printerName: selectedPrinter,
        imageData: dataURL,
        options: {
          silent: true,
          printBackground: true,
          deviceName: selectedPrinter,
          // 4R size in mm (approximately 102mm × 152mm)
          pageSize: { width: 102000, height: 152000 }, // In microns
          landscape: false,
          marginsType: 1, // Minimum margins
          scaleFactor: 100,
        }
      });
      
      if (printResult.success) {
        // Navigate to success screen or show success message
        navigate('/print-success');
      } else {
        setPrintError(printResult.message || "Print failed. Please try again.");
      }
    } catch (error) {
      console.error("Print error:", error);
      setPrintError("Print failed: " + (error.message || "Unknown error"));
    } finally {
      setPrinting(false);
    }
  };

  const handleBackToFilters = () => {
    navigate('/select-filter');
  };

  const renderCompositeImage = () => {
    return (
      <Stage 
        ref={stageRef}
        width={finalStage.width} 
        height={finalStage.height}
        style={{ background: '#f0f0f0', margin: '0 auto', maxWidth: '100%' }}
      >
        <Layer>
          {frames && frames.map(frame => {
            if (!frame.photo) return null;

            const photoImg = filteredPhotos[frame.id] || resolvedImages[frame.id];
            if (!photoImg) return null;

            const photoRatio = photoImg.width / photoImg.height;
            const frameRatio = frame.width / frame.height;

            let photoWidth, photoHeight;
            let offsetX = frame.photoOffsetX || 0;
            let offsetY = frame.photoOffsetY || 0;

            if (photoRatio > frameRatio) {
              photoHeight = frame.height;
              photoWidth = photoHeight * photoRatio;
              if (offsetX === 0) offsetX = (photoWidth - frame.width) / 2;
            } else {
              photoWidth = frame.width;
              photoHeight = photoWidth / photoRatio;
              if (offsetY === 0) offsetY = (photoHeight - frame.height) / 2;
            }

            return (
              <KonvaImage
                key={frame.id}
                image={photoImg}
                x={frame.x * DefaultScale}
                y={frame.y * DefaultScale}
                width={photoWidth * DefaultScale}
                height={photoHeight * DefaultScale}
                offsetX={offsetX * DefaultScale}
                offsetY={offsetY * DefaultScale}
                clipFunc={(ctx) => {
                  ctx.rect(0, 0, frame.width * DefaultScale, frame.height * DefaultScale);
                }}
              />
            );
          })}
        </Layer>
        <Layer>
        {templateImage && (
            <KonvaImage
              image={templateImage}
              width={templateImage.width * DefaultScale}
              height={templateImage.height * DefaultScale}
            />
          )}
        </Layer>
      </Stage>
    );
  };

  return (
    <>
    <div className='h-full max-w-screen'>
    <div className="flex justify-between items-center mb-auto">
    <button 
      className="back-button flex items-center text-pink-500 hover:text-pink-600 px-3"
      onClick={handleBackToFilters}
      disabled={printing}
    >
      <ArrowLeftCircle size={24} className="mr-2" />
      <span>Kembali ke Filter</span>
    </button>
    <h1 className="filter-title text-3xl font-bold text-center mb-6 text-black">Cetak Preview</h1>
    <div className="w-24"></div> {/* Spacer for alignment */}
    </div>
    <div className="print-preview-container max-h-screen flex items-center justify-center mx-auto min-w-screen w-full">
        <div className="preview-container relative mb-8 w-1/2">
          {Object.keys(filteredPhotos).length > 0 && renderCompositeImage()}
          {loading && (
           <Button variant="text" size="lg" loading={true}>
           Loading
         </Button>
          )}
        </div>    
        <div className='container w-1/2'>
        <div className="printer-selection max-w-lg mx-auto mb-6">
          <h2 className="text-xl font-semibold mb-3">Pilih Printer</h2>
          {availablePrinters.length === 0 ? (
            <div className="text-red-500">No printers found. Please check printer connections.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availablePrinters.map((printer) => (
                <div 
                  key={printer.name}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedPrinter === printer.name 
                      ? 'border-pink-500 bg-pink-50' 
                      : 'border-gray-300 hover:border-pink-300'
                  }`}
                  onClick={() => setSelectedPrinter(printer.name)}
                >
                  <div className="printer-icon mr-3 text-gray-700">
                    <Printer size={24} />
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium">{printer.name}</div>
                    <div className="text-sm text-gray-500">
                      {printer.status === 'READY' ? 'Siap digunakan' : printer.status}
                    </div>
                  </div>
                  {printer.status === 'READY' && (
                    <div className="check-icon text-green-500 ml-2">
                      <Check size={20} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {printError && (
            <div className="error-message mt-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded">
              {printError}
            </div>
          )}
        </div>
        
        <div className="print-instructions text-sm text-gray-600 mx-auto max-w-lg mb-6">
          <p>Ukuran foto akan dicetak dalam ukuran 4R (4×6″ / 10×15cm)</p>
        </div>
        
        <div className="actions flex justify-center">
          <button 
            className="print-button bg-pink-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-pink-600 transition-colors disabled:opacity-50 flex items-center"
            onClick={handlePrint}
            disabled={printing || !selectedPrinter || loading}
          >
            {printing ? (
              <>
                <div className="spinner mr-2 w-5 h-5 border-t-2 border-white rounded-full animate-spin"></div>
                Mencetak...
              </>
            ) : (
              <>
                <Printer size={20} className="mr-2" />
                Cetak Foto
              </>
            )}
          </button>
        </div>
        </div>  
    </div>
    </div>
    </>
  );
};

export default PrintPreview;