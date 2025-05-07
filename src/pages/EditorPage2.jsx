import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image, Rect, Transformer, Group, Text } from 'react-konva';
import Konva from 'konva';

export default function ImageCollage() {
  const [template, setTemplate] = useState(null);
  const [frames, setFrames] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isSetupMode, setIsSetupMode] = useState(true);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const containerRef = useRef(null);

  // Handle window resize
  useEffect(() => {
    const checkSize = () => {
      if (containerRef.current && template) {
        const containerWidth = containerRef.current.offsetWidth;
        const scale = containerWidth / template.width;
        
        setStageSize({
          width: containerWidth,
          height: template.height * scale
        });
      }
    };

    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, [template, containerRef]);

  // Update transformer when selection changes
  useEffect(() => {
    if (selectedId === null || !transformerRef.current || !isSetupMode) {
      return;
    }

    // Find the selected node
    const selectedNode = transformerRef.current.getStage().findOne('#' + selectedId);
    if (selectedNode) {
      transformerRef.current.nodes([selectedNode]);
      transformerRef.current.getLayer().batchDraw();
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedId, isSetupMode]);

  const handleTemplateUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        setTemplate(img);
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetWidth * (img.height / img.width)
        });
        setFrames([]);
        setImages([]);
        setSelectedId(null);
        setIsSetupMode(true);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e, frameId) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        setImages(prevImages => {
          const newImages = [...prevImages];
          const existingIndex = newImages.findIndex(img => img.frameId === frameId);
          
          if (existingIndex !== -1) {
            newImages[existingIndex] = { frameId, img };
          } else {
            newImages.push({ frameId, img });
          }
          
          return newImages;
        });
      };
    };
    reader.readAsDataURL(file);
  };

  const addFrame = () => {
    if (frames.length >= 6) return;
    
    const id = `frame-${frames.length + 1}`;
    const width = 200;
    const height = 200;
    const x = Math.random() * (stageSize.width - width - 50) + 25;
    const y = Math.random() * (stageSize.height - height - 50) + 25;
    
    setFrames([...frames, { id, x, y, width, height }]);
    setSelectedId(id);
  };

  const deleteFrame = (id) => {
    setFrames(frames.filter(frame => frame.id !== id));
    setImages(images.filter(img => img.frameId !== id));
    
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const downloadCollage = () => {
    // Hide transformer before exporting
    const transformerNode = transformerRef.current;
    if (transformerNode) {
      transformerNode.visible(false);
      transformerNode.getLayer().batchDraw();
    }
    
    const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
    
    // Restore transformer visibility
    if (transformerNode) {
      transformerNode.visible(true);
      transformerNode.getLayer().batchDraw();
    }
    
    const link = document.createElement('a');
    link.download = 'collage.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDragEnd = (e, id) => {
    setFrames(
      frames.map(frame => {
        if (frame.id === id) {
          return {
            ...frame,
            x: e.target.x(),
            y: e.target.y()
          };
        }
        return frame;
      })
    );
  };

  const handleTransformEnd = (e, id) => {
    const node = e.target;
    
    setFrames(
      frames.map(frame => {
        if (frame.id === id) {
          return {
            ...frame,
            x: node.x(),
            y: node.y(),
            width: node.width() * node.scaleX(),
            height: node.height() * node.scaleY()
          };
        }
        return frame;
      })
    );
    
    // Reset scale after updating dimensions
    node.scaleX(1);
    node.scaleY(1);
  };

  const checkDeselect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Photo Collage Maker</h1>
      
      {/* Template Upload Section */}
      <div className="w-full bg-gray-50 p-4 rounded-md mb-6">
        <h2 className="text-xl font-semibold mb-3">Step 1: Upload Template Image</h2>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleTemplateUpload}
          className="mb-4"
        />
        {template ? (
          <p className="text-green-600">✓ Template uploaded successfully</p>
        ) : (
          <p className="text-sm text-gray-500">
            Upload your template image first
          </p>
        )}
      </div>
      
      {/* Frames and Photos Section */}
      {template && (
        <div className="w-full bg-gray-50 p-4 rounded-md mb-6">
          <h2 className="text-xl font-semibold mb-3">
            Step 2: {isSetupMode ? 'Setup Frames' : 'Add Photos'}
          </h2>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {isSetupMode && (
              <button
                onClick={addFrame}
                disabled={frames.length >= 6}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                Add Frame ({frames.length}/6)
              </button>
            )}
            
            {frames.length > 0 && (
              <button
                onClick={() => setIsSetupMode(!isSetupMode)}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                {isSetupMode ? 'Done Setting Up Frames' : 'Edit Frames'}
              </button>
            )}
            
            {selectedId && isSetupMode && (
              <button
                onClick={() => deleteFrame(selectedId)}
                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Selected Frame
              </button>
            )}
          </div>
          
          {isSetupMode && (
            <p className="text-sm text-gray-600 mb-4">
              Click "Add Frame" to add up to 6 frames. <strong>Click and drag</strong> to move frames. <strong>Select a frame</strong> to resize or delete it.
            </p>
          )}
          
          {!isSetupMode && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Upload Photos</h3>
              <div className="grid grid-cols-3 gap-2">
                {frames.map((frame) => {
                  const imageExists = images.some(img => img.frameId === frame.id);
                  return (
                    <div key={frame.id} className="bg-gray-100 p-2 rounded border">
                      <p className="text-sm mb-1">Frame {frame.id.split('-')[1]}</p>
                      <div className="aspect-square bg-gray-200 flex items-center justify-center mb-2">
                        {imageExists ? (
                          <div className="relative w-full h-full">
                            <img
                              src={images.find(img => img.frameId === frame.id).img.src}
                              alt={`Frame ${frame.id}`}
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute top-0 right-0 bg-black bg-opacity-50 text-white p-1">
                              <span className="text-xs">✓</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Empty</span>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, frame.id)}
                        className="text-xs w-full"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Canvas Area */}
      {template && (
        <div 
          ref={containerRef} 
          className="w-full border border-gray-300 mb-6 overflow-hidden"
        >
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            onMouseDown={checkDeselect}
            onTouchStart={checkDeselect}
          >
            <Layer>
              {/* Background Template */}
              <Image
                image={template}
                width={stageSize.width}
                height={stageSize.height}
              />
              
              {/* Frames and Images */}
              {frames.map((frame) => {
                const imageData = images.find(img => img.frameId === frame.id);
                
                return (
                  <Group key={frame.id}>
                    {/* Frame with clipped image */}
                    <Group
                      id={frame.id}
                      x={frame.x}
                      y={frame.y}
                      width={frame.width}
                      height={frame.height}
                      draggable={isSetupMode}
                      onClick={() => isSetupMode && setSelectedId(frame.id)}
                      onTap={() => isSetupMode && setSelectedId(frame.id)}
                      onDragEnd={(e) => handleDragEnd(e, frame.id)}
                      onTransformEnd={(e) => handleTransformEnd(e, frame.id)}
                      clipFunc={(ctx) => {
                        ctx.beginPath();
                        ctx.rect(0, 0, frame.width, frame.height);
                        ctx.closePath();
                      }}
                    >
                      {/* Filled image if exists */}
                      {imageData && (
                        <Image
                          image={imageData.img}
                          width={frame.width}
                          height={frame.height}
                          x={0}
                          y={0}
                          offsetX={0}
                          offsetY={0}
                        />
                      )}
                    </Group>
                                    
                    {/* Frame boundary - visible in setup mode */}
                    {isSetupMode && (
                      <Rect
                        x={frame.x}
                        y={frame.y}
                        width={frame.width}
                        height={frame.height}
                        stroke={selectedId === frame.id ? "#FF0000" : "#FF4040"}
                        strokeWidth={2}
                        dash={[5, 5]}
                        onClick={() => setSelectedId(frame.id)}
                        onTap={() => setSelectedId(frame.id)}
                      />
                    )}
                    
                    {/* Frame number */}
                    {isSetupMode && (
                      <Text
                        x={frame.x + 5}
                        y={frame.y + 5}
                        text={frame.id.split('-')[1]}
                        fontSize={16}
                        fill="#FF0000"
                      />
                    )}
                  </Group>
                );
              })}
              
              {/* Transformer for resizing frames */}
              {isSetupMode && (
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    // Minimum size constraint
                    if (newBox.width < 50 || newBox.height < 50) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                  anchorStroke="#FF0000"
                  anchorFill="#FFFFFF"
                  anchorSize={8}
                  borderStroke="#FF0000"
                  borderDash={[5, 5]}
                />
              )}
            </Layer>
          </Stage>
        </div>
      )}
      
      {/* Download Button */}
      {template && frames.length > 0 && !isSetupMode && (
        <button 
          onClick={downloadCollage}
          className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
        >
          Download Collage
        </button>
      )}
      
      {/* Reset Button */}
      {template && (
        <button 
          onClick={() => {
            setTemplate(null);
            setFrames([]);
            setImages([]);
            setSelectedId(null);
            setIsSetupMode(true);
          }}
          className="mt-4 text-red-600 underline"
        >
          Start Over
        </button>
      )}
    </div>
  );
}