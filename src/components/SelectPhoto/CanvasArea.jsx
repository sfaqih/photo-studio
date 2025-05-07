import React, { useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';

const CanvasArea = ({ draggedPhoto }) => {
  const stageRef = useRef();
  const [canvasPhotos, setCanvasPhotos] = useState([]);
    const templateSelected = localStorage.getItem("selectedTemplate") != undefined ? JSON.parse(localStorage.getItem("selectedTemplate")) : null;
    const [templateImage, setTemplateImage] = useState(null);
    const [templateSize, setTemplateSize] = useState({ width: 800, height: 600 });

  const handleDrop = (e) => {
    e.preventDefault();
    stageRef.current.setPointersPositions(e);
    const pos = stageRef.current.getPointerPosition();

    const image = new window.Image();
    image.src = draggedPhoto?.base64;
    image.onload = () => {
      setCanvasPhotos((prev) => [
        ...prev,
        {
          id: Date.now(),
          image,
          x: pos.x,
          y: pos.y,
          width: image.width / 2,
          height: image.height / 2,
        },
      ]);
    };
  };

  const loadImage = (src, callback) => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => callback(img);
    img.src = src;
  };

  if(templateSelected) {
    loadImage(templateSelected.pathUrl, (img) => {
        setTemplateSize({ width: img.width / 2, height: img.height / 2});
        setTemplateImage(img);
    });
  }

  return (
    <div
      className="h-full p-4"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <Stage width={templateSize.width} height={templateSize.height} ref={stageRef}>
        <Layer>
          {canvasPhotos.map((item) => (
            <KonvaImage
              key={item.id}
              image={item.image}
              x={item.x}
              y={item.y}
              width={item.width}
              height={item.height}
              draggable
            />
          ))}
        </Layer>
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
  );
};

export default CanvasArea;
