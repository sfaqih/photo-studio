import React, { createContext, useContext, useState } from 'react';

// Membuat Context
const PhotoStudio = createContext();

// Provider Component
export const PhotoStudioProvider = ({ children }) => {
  const [photoStudioSession, setPhotoStudioSession] = useState({
    frames: [],
    dirPath: null
  });

  return (
    <PhotoStudio.Provider value={{ photoStudioSession, setPhotoStudioSession }}>
      {children}
    </PhotoStudio.Provider>
  );
};

// Hook untuk menggunakan context
export const usePhotoStudio = () => useContext(PhotoStudio);