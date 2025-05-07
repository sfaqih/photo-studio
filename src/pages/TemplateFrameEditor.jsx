import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Image as KonvaImage, Transformer } from "react-konva";

const Frame = ({ shapeProps, isSelected, onSelect, onChange }) => {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected) {
      trRef.current?.nodes([shapeRef.current]);
      trRef.current?.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Rect
        ref={shapeRef}
        {...shapeProps}
        stroke="black"
        strokeWidth={2}
        fill="rgba(0,0,0,0.1)"
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          node.scaleX(1);
          node.scaleY(1);

          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            width: Math.max(10, node.width() * scaleX),
            height: Math.max(10, node.height() * scaleY),
          });
        }}
        onDragEnd={(e) => {
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
      />
      {isSelected && <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => {
        if (newBox.width < 10 || newBox.height < 10) return oldBox;
        return newBox;
      }} />}
    </>
  );
};

const TemplateFrameEditor = () => {
  const [templateUrl, setTemplateUrl] = useState(null);
  const [templateImage, setTemplateImage] = useState(null);
  const [frames, setFrames] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!templateUrl) return;
    const img = new window.Image();
    img.src = templateUrl;
    img.onload = () => setTemplateImage(img);
  }, [templateUrl]);

  const addFrame = () => {
    const newFrame = {
      id: `frame-${frames.length + 1}`,
      x: 50,
      y: 50,
      width: 100,
      height: 100,
    };
    setFrames([...frames, newFrame]);
  };

  const handleUploadTemplate = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTemplateUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button onClick={addFrame} className="p-2 bg-blue-600 text-white rounded">Add Frame</button>
        <input type="file" accept="image/*" onChange={handleUploadTemplate} className="file:mr-2 file:py-1 file:px-4 file:rounded file:border-0 file:bg-gray-100" />
      </div>
      <Stage width={512} height={768} className="border">
        <Layer>
          {templateImage && <KonvaImage image={templateImage} width={512} height={768} />}
          {frames.map((frame, i) => (
            <Frame
              key={i}
              shapeProps={frame}
              isSelected={frame.id === selectedId}
              onSelect={() => setSelectedId(frame.id)}
              onChange={(newAttrs) => {
                const updatedFrames = frames.slice();
                updatedFrames[i] = newAttrs;
                setFrames(updatedFrames);
              }}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default TemplateFrameEditor;
