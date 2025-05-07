// PhotoBoothApp.jsx - Komponen utama yang mengintegrasikan PhotoLibrary dan CanvasEditor
import React, { useState } from 'react';
import PhotoLibrary from '../components/SelectPhoto/PhotoLibrary';
import CanvasEditor from '../components/SelectPhoto/CanvasEditor';
import { DefaultPaper } from '../constants/template';

const SelectPhoto = () => {
  // State untuk menyimpan foto-foto customer
  const [customerPhotos, setCustomerPhotos] = useState([]);
  // State untuk menyimpan gambar template
  const [templateImage, setTemplateImage] = useState(null);
  // State untuk ukuran canvas
  const [canvasSize, setCanvasSize] = useState({ width: DefaultPaper.width, height: DefaultPaper.height });
  // State untuk menyimpan frames/kotak pada template
  const [frames, setFrames] = useState([]);
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
    <div className="container min-w-screen flex">
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

export default SelectPhoto;