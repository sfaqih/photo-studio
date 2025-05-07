import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import { displayTemplateHeight, displayTemplateWidth } from '../../utils/Image';
import { DefaultPaper } from '../../constants/template';

const CanvasEditor = ({ template, onSaveFrames, back }) => {
    const containerRef = useRef(null);
  const [imageObj, setImageObj] = useState(null);
  const [frames, setFrames] = useState(template.frames || []);
  const [selectedId, setSelectedId] = useState(null);
    const [stageSize, setStageSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });
  
  const trRef = useRef();
  const layerRef = useRef();

  const getTemplateDimensions = () => {
    if (!imageObj) return { width: 0, height: 0, x: 0, y: 0 };

    const imageRatio = imageObj.width / imageObj.height;
    const stageRatio = stageSize.width / stageSize.height;
    
    let width, height, x, y;

    // If image is wider than the stage (in proportion)
    if (imageRatio > stageRatio) {
      width = stageSize.width;
      height = stageSize.width / imageRatio;
      x = 0;
      y = (stageSize.height - height) / 2; // Center vertically
    } 
    // If image is taller than the stage (in proportion)
    else {
      height = stageSize.height;
      width = stageSize.height * imageRatio;
      x = (stageSize.width - width) / 2; // Center horizontally
      y = 0;
    }

    const templateHeight = displayTemplateHeight(imageObj.width, imageObj.height);

    return { width: displayTemplateWidth, height: templateHeight, x, y };
  };

  const templateDimensions = getTemplateDimensions();

  useEffect(() => {
    const img = new window.Image();
    img.src = template.pathUrl || template.dataUrl;
    img.onload = () => setImageObj(img);
  }, [template]);

  useEffect(() => {
    setFrames(template.frames || []);
  }, [template]);

  useEffect(() => {
    const stage = trRef.current?.getStage();
    const selectedNode = stage?.findOne(`#${selectedId}`);
    if (selectedNode) {
      trRef.current.nodes([selectedNode]);
      trRef.current.getLayer().batchDraw();
    } else {
      trRef.current.nodes([]);
    }
  }, [selectedId, frames]);

      useEffect(() => {
          const handleResize = () => {
              if (containerRef.current) {
                  const containerWidth = containerRef.current.offsetWidth;
                  const containerHeight = containerRef.current.offsetHeight;
                  setStageSize({
                      width: containerWidth,
                      height: containerHeight
                  });
              }
          };
  
          window.addEventListener('resize', handleResize);
          handleResize(); // Initial sizing
  
          return () => window.removeEventListener('resize', handleResize);
      }, []);

  const addFrame = () => {
    const newFrame = {
      id: `frame-${Date.now()}`,
      x: 50,
      y: 50,
      width: 100,
      height: 100,
    };
    setFrames([...frames, newFrame]);
    setSelectedId(newFrame.id);
  };

  const updateFrame = (id, newProps) => {
    setFrames(frames.map((f) => (f.id === id ? { ...f, ...newProps } : f)));
  };

  const deleteFrame = (id) => {
    setFrames(frames.filter((f) => f.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="mt-4 h-screen rounded p-4">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => back()} className="bg-slate-950 text-white px-3 py-1 rounded rounded-lg">
          Back to List
        </button>
        <button onClick={addFrame} className="bg-slate-950 text-white px-3 py-1 rounded rounded-lg">
          Add Frame
        </button>
        <button onClick={() => onSaveFrames(frames)} className="bg-slate-950 text-white px-3 py-1 rounded rounded-lg">
          Save Frames
        </button>
        {selectedId && (
          <button onClick={() => deleteFrame(selectedId)} className="bg-slate-950 text-white px-3 py-1 rounded rounded-lg">
            Delete Selected Frame
          </button>
        )}
      </div>
        <div ref={containerRef} className='canvas-wrapper'>
      <Stage width={DefaultPaper.width} height={DefaultPaper.height}>
        <Layer ref={layerRef}>
          {imageObj && (
            <KonvaImage
              image={imageObj}
              width={imageObj.width}
              height={imageObj.heigt}
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
              onDragEnd={(e) =>
                updateFrame(frame.id, {
                  x: e.target.x(),
                  y: e.target.y(),
                })
              }
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
};

export default CanvasEditor;
