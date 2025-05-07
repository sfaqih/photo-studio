// src/pages/TemplateSetupPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import { nanoid } from 'nanoid';
import { useNavigate } from 'react-router-dom';

export default function TemplateSetupPage() {
  const [templateImage, setTemplateImage] = useState(null);
  const [templateSize, setTemplateSize] = useState({ width: 800, height: 600 });
  const [frames, setFrames] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const trRef = useRef();
  const navigate = useNavigate();

  const loadImage = (src, cb) => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => cb(img);
    img.src = src;
  };

  const handleTemplateUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      loadImage(reader.result, (img) => {
        setTemplateSize({ width: img.width, height: img.height });
        setTemplateImage(img);
      });
    };
    reader.readAsDataURL(file);
  };

  const addFrame = () => {
    setFrames((prev) => [
      ...prev,
      {
        id: nanoid(),
        x: 50,
        y: 50,
        width: 200,
        height: 200,
      },
    ]);
  };

  const updateFrame = (id, attrs) => {
    setFrames(frames.map((f) => (f.id === id ? { ...f, ...attrs } : f)));
  };

  useEffect(() => {
    if (trRef.current && selectedId) {
      const stage = trRef.current.getStage();
      const node = stage.findOne(`#${selectedId}`);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  const handleSave = () => {
    localStorage.setItem('templateFrames', JSON.stringify(frames));
    localStorage.setItem('templateImage', templateImage.src);
    navigate('/editor-page');
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <div>
          <label>Upload Template Image:</label>
          <input type="file" accept="image/*" onChange={handleTemplateUpload} />
        </div>
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={addFrame}>Add Frame</button>
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleSave}>Save & Go to Editor</button>
      </div>

      <div className="border rounded shadow">
        <Stage width={templateSize.width} height={templateSize.height}>
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

            {frames.map((frame) => (
              <Rect
                key={frame.id}
                id={frame.id}
                x={frame.x}
                y={frame.y}
                width={frame.width}
                height={frame.height}
                stroke="red"
                strokeWidth={2}
                draggable
                onClick={() => setSelectedId(frame.id)}
                onTap={() => setSelectedId(frame.id)}
                onDragEnd={(e) => updateFrame(frame.id, { x: e.target.x(), y: e.target.y() })}
                onTransformEnd={(e) => {
                  const node = e.target;
                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();

                  node.scaleX(1);
                  node.scaleY(1);

                  updateFrame(frame.id, {
                    x: node.x(),
                    y: node.y(),
                    width: Math.max(10, node.width() * scaleX),
                    height: Math.max(10, node.height() * scaleY),
                  });
                }}
              />
            ))}
            <Transformer
              ref={trRef}
              boundBoxFunc={(oldBox, newBox) => {
                return newBox.width < 10 || newBox.height < 10 ? oldBox : newBox;
              }}
              rotateEnabled={false}
              keepRatio={false}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
