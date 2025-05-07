// src/App.jsx
import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';
import { nanoid } from 'nanoid';
import { getMeta } from '../utils/Image';

function EditorPage() {
  const templateSelected = localStorage.getItem("selectedTemplate") != undefined ? JSON.parse(localStorage.getItem("selectedTemplate")) : null;
  const [templateImage, setTemplateImage] = useState(null);
  const [templateSize, setTemplateSize] = useState({ width: 800, height: 600 });
  const [photos, setPhotos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const trRef = useRef();

  const loadImage = (src, callback) => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => callback(img);
    img.src = src;
  };

  if(templateSelected) {
    loadImage(templateSelected.pathUrl, (img) => {
        setTemplateSize({ width: img.width, height: img.height});
        setTemplateImage(img);
    });
  }

  const handleTemplateUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      loadImage(reader.result, (img) => {
        setTemplateSize({ width: img.width / 3, height: img.height / 2 });
        setTemplateImage(img);
      });
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        loadImage(reader.result, (img) => {
          setPhotos((prev) => [
            ...prev,
            {
              id: nanoid(),
              img,
              x: 50,
              y: 50,
              width: img.width / 2,
              height: img.height / 2,
            },
          ]);
        });
      };
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    if (trRef.current && selectedId) {
      const stage = trRef.current.getStage();
      const selectedNode = stage.findOne(`#${selectedId}`);
      if (selectedNode) {
        trRef.current.nodes([selectedNode]);
        trRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  const updatePhoto = (id, newAttrs) => {
    const updated = photos.map((p) => (p.id === id ? { ...p, ...newAttrs } : p));
    setPhotos(updated);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <div>
          <label>Upload Template Image:</label>
          <input type="file" accept="image/*" onChange={handleTemplateUpload} />
        </div>
        <div>
          <label>Upload Photos:</label>
          <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} />
        </div>
      </div>
      <div className="border rounded shadow">
        <Stage width={templateSize.width} height={templateSize.height} className="bg-gray-100">
          {/* First layer for photos */}
          <Layer>
            {photos.map((photo) => (
              <KonvaImage
                key={photo.id}
                id={photo.id}
                image={photo.img}
                x={photo.x}
                y={photo.y}
                width={photo.width}
                height={photo.height}
                draggable
                onClick={() => setSelectedId(photo.id)}
                onTap={() => setSelectedId(photo.id)}
                onDragEnd={(e) => {
                  updatePhoto(photo.id, {
                    x: e.target.x(),
                    y: e.target.y(),
                  });
                }}
                onTransformEnd={(e) => {
                  const node = e.target;
                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();

                  node.scaleX(1);
                  node.scaleY(1);

                  updatePhoto(photo.id, {
                    x: node.x(),
                    y: node.y(),
                    width: Math.max(5, node.width() * scaleX),
                    height: Math.max(5, node.height() * scaleY),
                  });
                }}
              />
            ))}
            <Transformer
              ref={trRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) return oldBox;
                return newBox;
              }}
              rotateEnabled={false}
              keepRatio={false}
            />
          </Layer>

          {/* Second layer for template (always on top) */}
          <Layer>
            {templateImage && (
              <KonvaImage
                image={templateImage}
                x={0}
                y={0}
                width={templateSize.width}
                height={templateSize.height}
                listening={false}
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

export default EditorPage;
