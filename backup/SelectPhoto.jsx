// PhotoBoothApp.jsx - Komponen utama yang mengintegrasikan PhotoLibrary dan CanvasEditor
import React, { useState } from 'react';
import PhotoLibrary from './PhotoLibrary';
import CanvasEditor from './CanvasEditor';

const PhotoBoothApp = () => {
  // State untuk menyimpan foto-foto customer
  const [customerPhotos, setCustomerPhotos] = useState([]);
  // State untuk menyimpan gambar template
  const [templateImage, setTemplateImage] = useState(null);
  // State untuk ukuran canvas
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  // State untuk menyimpan frames/kotak pada template
  const [frames, setFrames] = useState([
    { id: 'frame1', x: 50, y: 50, width: 200, height: 200, photo: null },
    { id: 'frame2', x: 300, y: 50, width: 200, height: 200, photo: null },
    { id: 'frame3', x: 550, y: 50, width: 200, height: 200, photo: null },
    { id: 'frame4', x: 175, y: 300, width: 200, height: 200, photo: null },
    { id: 'frame5', x: 425, y: 300, width: 200, height: 200, photo: null },
  ]);
  // State untuk selected photo/frame
  const [selectedId, setSelectedId] = useState(null);
  // State untuk frame yang sedang aktif (untuk drop target)
  const [activeDropZone, setActiveDropZone] = useState(null);
  // State untuk menyimpan foto yang sedang di-drag
  const [draggingPhoto, setDraggingPhoto] = useState(null);

  // Handler untuk memulai drag dari daftar foto
  const handleDragStart = (e, photo) => {
    // Set transfer data untuk identifikasi foto
    e.dataTransfer.setData('photoId', photo.id);
    setDraggingPhoto(photo);
    
    // Optionally set a drag image
    if (photo.img) {
      // Create a temporary element for drag preview
      const dragPreview = document.createElement('div');
      dragPreview.style.position = 'absolute';
      dragPreview.style.top = '-1000px';
      document.body.appendChild(dragPreview);
      
      const img = new Image();
      img.src = photo.preview;
      img.style.width = '100px';
      img.style.height = 'auto';
      dragPreview.appendChild(img);
      
      e.dataTransfer.setDragImage(img, 50, 50);
      
      // Clean up after drag starts
      setTimeout(() => {
        document.body.removeChild(dragPreview);
      }, 0);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <PhotoLibrary 
        customerPhotos={customerPhotos}
        setCustomerPhotos={setCustomerPhotos}
        handleDragStart={handleDragStart}
      />
      <CanvasEditor 
        templateImage={templateImage}
        setTemplateImage={setTemplateImage}
        canvasSize={canvasSize}
        setCanvasSize={setCanvasSize}
        frames={frames}
        setFrames={setFrames}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        activeDropZone={activeDropZone}
        setActiveDropZone={setActiveDropZone}
        draggingPhoto={draggingPhoto}
        setDraggingPhoto={setDraggingPhoto}
      />
    </div>
  );
};

export default PhotoBoothApp;