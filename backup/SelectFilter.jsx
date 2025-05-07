import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import { ArrowLeftCircle, ArrowRightCircle } from 'lucide-react';
import '../styles/SelectFilter.css';
import { DefaultScale, DefaultPaper } from '../constants/template';
import { usePhotoStudio } from '../contexts/studio';

// Utility function to load an image
const loadHtmlImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
    img.crossOrigin = 'anonymous';
  });
};

// Helper functions for LUT filter processing
const parseCubeFile = (cubeContent) => {
  const lines = cubeContent.split('\n');
  let size = 0;
  const lut = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('LUT_3D_SIZE')) {
      size = parseInt(trimmedLine.split(' ')[1], 10);
    } else if (trimmedLine && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('LUT') && !trimmedLine.startsWith('TITLE')) {
      const values = trimmedLine.split(' ').filter(v => v.trim() !== '').map(parseFloat);
      if (values.length === 3) {
        lut.push(values);
      }
    }
  }
  
  return { size, lut };
};

const applyLutToImage = (image, lutData, outputType = 'image') => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      
      ctx.drawImage(image, 0, 0, image.width, image.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      const { size, lut } = lutData;
      const cubeSize = size;
      
      // Apply LUT to each pixel
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;
        
        // Calculate indices
        const rx = r * (cubeSize - 1);
        const gx = g * (cubeSize - 1);
        const bx = b * (cubeSize - 1);
        
        const x0 = Math.floor(rx);
        const y0 = Math.floor(gx);
        const z0 = Math.floor(bx);
        
        const x1 = Math.min(x0 + 1, cubeSize - 1);
        const y1 = Math.min(y0 + 1, cubeSize - 1);
        const z1 = Math.min(z0 + 1, cubeSize - 1);
        
        // Calculate interpolation weights
        const xd = rx - x0;
        const yd = gx - y0;
        const zd = bx - z0;
        
        // Trilinear interpolation formula
        const index = (x) => x[0] * Math.pow(cubeSize, 2) + x[1] * cubeSize + x[2];
        
        const c000 = lut[index([x0, y0, z0])];
        const c001 = lut[index([x0, y0, z1])];
        const c010 = lut[index([x0, y1, z0])];
        const c011 = lut[index([x0, y1, z1])];
        const c100 = lut[index([x1, y0, z0])];
        const c101 = lut[index([x1, y0, z1])];
        const c110 = lut[index([x1, y1, z0])];
        const c111 = lut[index([x1, y1, z1])];
        
        // Interpolate RGB values
        const newR = 
          c000[0] * (1 - xd) * (1 - yd) * (1 - zd) +
          c001[0] * (1 - xd) * (1 - yd) * zd +
          c010[0] * (1 - xd) * yd * (1 - zd) +
          c011[0] * (1 - xd) * yd * zd +
          c100[0] * xd * (1 - yd) * (1 - zd) +
          c101[0] * xd * (1 - yd) * zd +
          c110[0] * xd * yd * (1 - zd) +
          c111[0] * xd * yd * zd;
          
        const newG = 
          c000[1] * (1 - xd) * (1 - yd) * (1 - zd) +
          c001[1] * (1 - xd) * (1 - yd) * zd +
          c010[1] * (1 - xd) * yd * (1 - zd) +
          c011[1] * (1 - xd) * yd * zd +
          c100[1] * xd * (1 - yd) * (1 - zd) +
          c101[1] * xd * (1 - yd) * zd +
          c110[1] * xd * yd * (1 - zd) +
          c111[1] * xd * yd * zd;
          
        const newB = 
          c000[2] * (1 - xd) * (1 - yd) * (1 - zd) +
          c001[2] * (1 - xd) * (1 - yd) * zd +
          c010[2] * (1 - xd) * yd * (1 - zd) +
          c011[2] * (1 - xd) * yd * zd +
          c100[2] * xd * (1 - yd) * (1 - zd) +
          c101[2] * xd * (1 - yd) * zd +
          c110[2] * xd * yd * (1 - zd) +
          c111[2] * xd * yd * zd;
        
        // Update pixel data
        data[i] = Math.round(newR * 255);
        data[i + 1] = Math.round(newG * 255);
        data[i + 2] = Math.round(newB * 255);
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      if (outputType === 'url') {
        resolve(canvas.toDataURL('image/png'));
      } else {
        // Create a new image from the canvas
        const newImg = new window.Image();
        newImg.onload = () => resolve(newImg);
        newImg.onerror = (err) => reject(err);
        newImg.src = canvas.toDataURL('image/png');
      }
    } catch (error) {
      reject(error);
    }
  });
};

const SelectFilter = () => {
  const navigate = useNavigate();
  const stageRef = useRef(null);
  const sliderRef = useRef(null);
  
  // State for display and control
  const [currentFilterIndex, setCurrentFilterIndex] = useState(0);
  const [templateImage, setTemplateImage] = useState(null);
  const [frames, setFrames] = useState([]);
  const [resolvedImages, setResolvedImages] = useState({});
  const [filteredPhotos, setFilteredPhotos] = useState({});
  const [filters, setFilters] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [finalStage, setFinalStage] = useState({ width: 400, height: 595 });
  const { photoStudioSession } = usePhotoStudio();
  
  // Load template and frames from localStorage
  useEffect(() => {
    const loadTemplateFrames = async () => {
      try {
        const photoStudio = photoStudioSession;
        console.debug("photoStudio: ", photoStudio);
        const selectedTemplate = JSON.parse(localStorage.getItem("selectedTemplate") || "null");
        if (!photoStudio || !selectedTemplate) {
          alert("Please restart your journey...");
          return;
        }

        // Load template image
        const img = await loadHtmlImage(selectedTemplate?.pathUrl);
        setTemplateImage(img);
        setFinalStage({ width: DefaultPaper.width * DefaultScale, height: DefaultPaper.height * DefaultScale });
        setFrames(photoStudio.frames);
      } catch (error) {
        console.error("Error loading template:", error);
        alert("Failed to load template. Please try again.");
      }
    };

    loadTemplateFrames();
  }, [photoStudioSession]);

  // Load all photos once frames are set
  useEffect(() => {
    if (!frames || frames.length === 0) return;

    const loadAllImages = async () => {
      const results = {};
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
    };

    loadAllImages();
  }, [frames]);

  // Load filters
  useEffect(() => {
    const loadFilters = async () => {
      setLoadingFilter(true);
      try {
        const availableFilters = [
          { id: 'original', name: 'Original', path: null },
          { id: 'blue', name: 'Blue', path: './filters/blue.CUBE' },
          { id: 'fresh', name: 'Fresh', path: './filters/fresh.CUBE' },
          { id: 'green', name: 'Green', path: './filters/green.CUBE' },
          { id: 'pink', name: 'Pink', path: './filters/pink.CUBE' },
          { id: 'pink_blue', name: 'Pink & Blue', path: './filters/pink_blue.CUBE' },
          { id: 'photosession', name: 'Photo Session', path: './filters/photosession.CUBE' }
        ];
        
        // Use the first frame image as sample if available, otherwise use a default image
        const sampleKey = frames && frames.length > 0 && frames[0].photo && resolvedImages[frames[0].id]
          ? frames[0].id
          : null;
        
        const sampleImage = sampleKey 
          ? resolvedImages[sampleKey] 
          : await loadHtmlImage("/water.png");
        
        const loadedFilters = [...availableFilters];
        
        // Load thumbnail for original filter
        
        // Load and process other filters
        for (let i = 1; i < loadedFilters.length; i++) {
          try {
            const response = await fetch(loadedFilters[i].path);
            const cubeContent = await response.text();
            
            loadedFilters[i].lutData = parseCubeFile(cubeContent);
            
            if (sampleImage) {
              const filteredImageUrl = await applyLutToImage(sampleImage, loadedFilters[i].lutData, 'url');
              loadedFilters[i].sampleImg = filteredImageUrl;
            }
          } catch (error) {
            console.error(`Failed to load filter ${loadedFilters[i].name}:`, error);
            // Set a placeholder for failed filters
            loadedFilters[i].sampleImg = sampleImage.src;
          }
        }
        
        setFilters(loadedFilters);
        // Set default filter
        setSelectedFilter(loadedFilters[0]);
      } catch (error) {
        console.error("Error loading filters:", error);
      } finally {
        setLoadingFilter(false);
      }
    };

    // Only load filters when we have images to apply them to
    if (Object.keys(resolvedImages).length > 0) {
      loadFilters();
    }
  }, [resolvedImages, frames]);

  // Apply selected filter to all photos
  useEffect(() => {
    if (!selectedFilter || !frames || Object.keys(resolvedImages).length === 0) {
      return;
    }

    const applyFilterToPhotos = async () => {
      setLoadingFilter(true);
      try {
        const filtered = {};
        
        // If original filter selected, use original images
        if (selectedFilter.id === 'original') {
          setFilteredPhotos({});
          return;
        }
        
        // Apply filter to each image
        for (const frame of frames) {
          if (frame.photo && resolvedImages[frame.id]) {
            try {
              const filteredImg = await applyLutToImage(resolvedImages[frame.id], selectedFilter.lutData);
              filtered[frame.id] = filteredImg;
            } catch (error) {
              console.error(`Failed to apply filter to frame ${frame.id}:`, error);
            }
          }
        }
        setFilteredPhotos(filtered);
      } catch (error) {
        console.error("Error applying filters:", error);
      } finally {
        setLoadingFilter(false);
      }
    };

    applyFilterToPhotos();
  }, [selectedFilter, frames, resolvedImages]);

  // Handle slider navigation
  useEffect(() => {
    if (sliderRef.current && filters.length > 0) {
      // Calculate the position to center the current filter in the slider
      const itemWidth = 100; // Approximate width of each filter item
      const sliderWidth = sliderRef.current.clientWidth;
      const scrollPosition = (currentFilterIndex * itemWidth) - (sliderWidth / 2) + (itemWidth / 2);
      
      sliderRef.current.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  }, [currentFilterIndex, filters.length]);

  const handlePrevious = () => {
    if (currentFilterIndex > 0) {
      setCurrentFilterIndex(currentFilterIndex - 1);
      setSelectedFilter(filters[currentFilterIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentFilterIndex < filters.length - 1) {
      setCurrentFilterIndex(currentFilterIndex + 1);
      setSelectedFilter(filters[currentFilterIndex + 1]);
    }
  };

  const handleFilterSelect = (index) => {
    setCurrentFilterIndex(index);
    setSelectedFilter(filters[index]);
  };

  const handleContinue = () => {
    // Save selected filter
    if (selectedFilter) {
      localStorage.setItem("selectedFilter", JSON.stringify(selectedFilter));
    }
    navigate('/print-preview');
  };

  const exportCurrentCanvas = () => {
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL();
      // You can use this dataURL to save the image or preview
      console.log("Canvas exported:", dataURL);
      return dataURL;
    }
    return null;
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
    <div className="filter-selection-container min-h-screen flex flex-col items-center justify-center mx-auto max-w-4xl px-4 py-6">
        <div className='justify-content-center'>
        <h1 className="filter-title text-3xl font-bold text-center mb-6">Pilih Filter!</h1>
      
      <div className="preview-container relative mb-8">
        {renderCompositeImage()}
        {loadingFilter && (
          <div className="absolute inset-0 flex items-center justify-center rounded">
            <div className="loading-spinner"></div>
          </div>
        )}
      </div>
      
      <div className="filter-navigation flex items-center mb-4">
        <button 
          className="arrow-button left focus:outline-none disabled:opacity-50"
          onClick={handlePrevious} 
          disabled={currentFilterIndex === 0 || loadingFilter}
        >
          <ArrowLeftCircle size={40} color="#C93B8A" />
        </button>
        
        <div className="filter-slider-wrapper flex-grow mx-4 overflow-hidden">
          <div 
            className="filter-slider flex space-x-4 py-2 overflow-x-auto"
            ref={sliderRef}
          >
            {filters.map((filter, index) => (
              <div 
                key={filter.id} 
                className={`filter-item flex-shrink-0 cursor-pointer transition-all duration-200 ${
                  index === currentFilterIndex ? 'scale-110 border-2 border-pink-500' : ''
                }`}
                onClick={() => handleFilterSelect(index)}
              >
                {filter.sampleImg ? (
                  <div className="filter-preview w-20 h-20 overflow-hidden rounded">
                    <img 
                      src={filter.sampleImg} 
                      alt={filter.name} 
                      className="filter-image w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="filter-preview w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                    <span>Loading</span>
                  </div>
                )}
                <p className="filter-name text-center mt-2 font-medium">{filter.name}</p>
              </div>
            ))}
          </div>
        </div>
        
        <button 
          className="arrow-button right focus:outline-none disabled:opacity-50" 
          onClick={handleNext} 
          disabled={currentFilterIndex === filters.length - 1 || loadingFilter}
        >
          <ArrowRightCircle size={40} color="#C93B8A" />
        </button>
      </div>
      
      <div className="slider-progress relative h-2 bg-gray-200 rounded-full mb-8">
        <div 
          className="progress-indicator absolute h-full bg-pink-500 rounded-full transition-all duration-300"
          style={{ 
            width: `${100 / filters.length}%`, 
            left: `${(currentFilterIndex / (filters.length - 1)) * (100 - (100 / filters.length))}%` 
          }}
        ></div>
      </div>
      
      <div className="actions flex justify-center">
        <button 
          className="print-button bg-pink-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
          onClick={handleContinue}
          disabled={loadingFilter}
        >
          {loadingFilter ? 'Processing...' : 'Cetak'}
        </button>
      </div>
        </div>
    </div>
  );
};

export default SelectFilter;