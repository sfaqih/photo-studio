import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from "react-konva";

const FrameManager = ({ templateImagePath }) => {
  const [templateImage, setTemplateImage] = useState(null);
  const [frames, setFrames] = useState([]);
  const [selectedFrameId, setSelectedFrameId] = useState(null);
  const trRef = useRef();

  // Load image using new Image()
  useEffect(() => {
    const img = new window.Image();
    img.src = templateImagePath;
    img.onload = () => setTemplateImage(img);
  }, [templateImagePath]);

  // Attach transformer ke frame terpilih
  useEffect(() => {
    if (trRef.current && selectedFrameId) {
      const selectedNode = stageRef.current.findOne(`#frame-${selectedFrameId}`);
      if (selectedNode) {
        trRef.current.nodes([selectedNode]);
        trRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedFrameId, frames]);

  const stageRef = useRef();

  const handleAddFrame = () => {
    const newFrame = {
      id: Date.now(),
      x: 50,
      y: 50,
      width: 100,
      height: 100,
    };
    setFrames([...frames, newFrame]);
  };

  const handleDragMove = (e, id) => {
    const updatedFrames = frames.map((frame) =>
      frame.id === id ? { ...frame, x: e.target.x(), y: e.target.y() } : frame
    );
    setFrames(updatedFrames);
  };

  const handleTransform = (e, id) => {
    const node = e.target;
    const updatedFrames = frames.map((frame) =>
      frame.id === id
        ? {
            ...frame,
            x: node.x(),
            y: node.y(),
            width: node.width() * node.scaleX(),
            height: node.height() * node.scaleY(),
          }
        : frame
    );
    node.scaleX(1);
    node.scaleY(1);
    setFrames(updatedFrames);
  };

  const handleDeleteFrame = () => {
    if (selectedFrameId) {
      setFrames(frames.filter((frame) => frame.id !== selectedFrameId));
      setSelectedFrameId(null);
    }
  };

  const handleSaveFrames = () => {
    window.frameStore.set("frames", frames);
    alert("Frames saved!");
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        <button onClick={handleAddFrame} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          + Add Frame
        </button>
        <button onClick={handleDeleteFrame} disabled={!selectedFrameId} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          🗑 Delete Frame
        </button>
        <button onClick={handleSaveFrames} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          💾 Save
        </button>
      </div>

      <Stage width={900} height={600} ref={stageRef} className="border shadow-lg">
        <Layer>
          {templateImage && <KonvaImage image={templateImage} />}
          {frames.map((frame) => (
            <Rect
              key={frame.id}
              id={`frame-${frame.id}`}
              x={frame.x}
              y={frame.y}
              width={frame.width}
              height={frame.height}
              stroke="orange"
              strokeWidth={3}
              draggable
              onClick={() => setSelectedFrameId(frame.id)}
              onTap={() => setSelectedFrameId(frame.id)}
              onDragMove={(e) => handleDragMove(e, frame.id)}
              onTransformEnd={(e) => handleTransform(e, frame.id)}
            />
          ))}
          <Transformer ref={trRef} />
        </Layer>
      </Stage>
    </div>
  );
};

export default FrameManager;
