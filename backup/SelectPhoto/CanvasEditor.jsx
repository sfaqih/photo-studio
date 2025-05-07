// CanvasEditor.jsx - Komponen untuk canvas dan manipulasi foto
import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Rect } from 'react-konva';

const CanvasEditor = ({
    templateImage,
    setTemplateImage,
    canvasSize,
    setCanvasSize,
    frames,
    setFrames,
    selectedId,
    setSelectedId,
    activeDropZone,
    setActiveDropZone,
    draggingPhoto,
    setDraggingPhoto
}) => {
    // Refs
    const transformerRef = useRef(null);
    const stageRef = useRef(null);
    const containerRef = useRef(null);


    const [stageSize, setStageSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    // Effect untuk menangani transformer
    useEffect(() => {
        if (selectedId && transformerRef.current) {
            // Cari node yang dipilih
            const selectedNode = stageRef.current.findOne(`#${selectedId}`);
            if (selectedNode) {
                transformerRef.current.nodes([selectedNode]);
                transformerRef.current.getLayer().batchDraw();
            } else {
                transformerRef.current.nodes([]);
                transformerRef.current.getLayer().batchDraw();
            }
        } else if (transformerRef.current) {
            transformerRef.current.nodes([]);
            transformerRef.current.getLayer().batchDraw();
        }
    }, [selectedId]);

    useEffect(() => {
        handleTemplateLoad();
    }, []);

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

    // Handler untuk upload template
    const handleTemplateUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new window.Image();
                img.src = e.target.result;
                img.onload = () => {
                    setTemplateImage(img);
                    setCanvasSize({
                        width: img.width,
                        height: img.height
                    });
                };
            };
            reader.readAsDataURL(file);
        }
    };

    // Handler untuk display template dari template yang sudah dipilih pada page sebelumnya
    const handleTemplateLoad = () => {
        const selectedTemplate = localStorage.getItem("selectedTemplate") ? JSON.parse(localStorage.getItem("selectedTemplate")) : null || null;
        console.debug("Load Template selectedTemplate, ", selectedTemplate)
        console.debug("Load Template pathUrl, ", selectedTemplate?.pathUrl)

        new Promise((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
            img.src = selectedTemplate?.pathUrl;
            img.crossOrigin = 'anonymous'; // Handle CORS if needed
        }).then(img => {
            console.debug("Load Template Image, ", img)
            setTemplateImage(img);
            console.debug("Load Template Size:", `${img.width} : ${img.height}`)
            setCanvasSize({
                width: img.width,
                height: img.height
            });
        });

        setFrames(selectedTemplate?.frames);
    };

    const getTemplateDimensions = () => {
        if (!canvasSize) return { width: 0, height: 0, x: 0, y: 0 };

        const imageRatio = canvasSize.width / canvasSize.height;
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

        return { width, height, x, y };
    };

    const templateDimensions = getTemplateDimensions();


    // Handler untuk drag over pada Stage container
    const handleDragOver = (e) => {
        e.preventDefault(); // Penting! Untuk mengizinkan drop
        e.stopPropagation();
    };

    // Handler untuk drop pada Stage container
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!draggingPhoto || !stageRef.current || !activeDropZone) return;

        // Update frame dengan foto yang di-drop
        setFrames(frames.map(frame => {
            if (frame.id === activeDropZone) {
                return {
                    ...frame,
                    photo: draggingPhoto,
                    photoOffsetX: 0,
                    photoOffsetY: 0
                };
            }
            return frame;
        }));

        setDraggingPhoto(null);
        setActiveDropZone(null);
    };

    // Handler untuk drag enter pada frame
    const handleFrameDragEnter = (frameId, e) => {
        e.preventDefault();
        setActiveDropZone(frameId);
    };

    // Handler untuk drag leave pada frame
    const handleFrameDragLeave = (e) => {
        e.preventDefault();
        setActiveDropZone(null);
    };

    // Handler untuk klik di luar object di stage
    const handleStageClick = (e) => {
        // Klik pada empty area
        if (e.target === e.target.getStage()) {
            setSelectedId(null);
        }
    };

    // Handler untuk menggeser foto dalam frame
    const handlePhotoPositionChange = (frameId, newX, newY) => {
        setFrames(frames.map(frame => {
            if (frame.id === frameId && frame.photo) {
                return {
                    ...frame,
                    photoOffsetX: newX,
                    photoOffsetY: newY
                };
            }
            return frame;
        }));
    };

    // Handler untuk menghapus foto dari frame
    const handleRemovePhotoFromFrame = (frameId) => {
        setFrames(frames.map(frame => {
            if (frame.id === frameId) {
                return {
                    ...frame,
                    photo: null,
                    photoOffsetX: 0,
                    photoOffsetY: 0
                };
            }
            return frame;
        }));
    };

    const fitImageIntoFrame = (img, frameWidth, frameHeight) => {
        const imgRatio = img.width / img.height;
        const frameRatio = frameWidth / frameHeight;
    
        let finalWidth, finalHeight;
    
        if (imgRatio > frameRatio) {
            // Image is wider than frame
            finalWidth = frameWidth;
            finalHeight = frameWidth / imgRatio;
        } else {
            // Image is taller than frame
            finalHeight = frameHeight;
            finalWidth = frameHeight * imgRatio;
        }
    
        const offsetX = (frameWidth - finalWidth) / 2;
        const offsetY = (frameHeight - finalHeight) / 2;
    
        return {
            width: finalWidth,
            height: finalHeight,
            x: offsetX,
            y: offsetY,
        };
    };
    

    // Fungsi untuk render foto dalam frame
    const renderPhotoInFrame = (frame) => {
        if (!frame.photo || !frame.photo.img) return null;
    
        // const DefaultScale = 0.4;
        const scaledWidth = frame.width * DefaultScale;
        const scaledHeight = frame.height * DefaultScale;
    
        const scaledX = frame.x * DefaultScale;
        const scaledY = frame.y * DefaultScale;
    
        const fit = fitImageIntoFrame(frame.photo.img, scaledWidth, scaledHeight);
    
        return (
            <Group
                key={frame.id}
                x={scaledX}
                y={scaledY}
                clipFunc={(ctx) => {
                    ctx.rect(0, 0, scaledWidth, scaledHeight);
                }}
            >
                <KonvaImage
                    id={`photo-${frame.id}`}
                    image={frame.photo.img}
                    x={fit.x}
                    y={fit.y}
                    width={fit.width}
                    height={fit.height}
                    draggable
                    onClick={() => setSelectedId(`photo-${frame.id}`)}
                    onTap={() => setSelectedId(`photo-${frame.id}`)}
                    onDragEnd={(e) => {
                        handlePhotoPositionChange(frame.id, e.target.x(), e.target.y());
                    }}
                />
            </Group>
        );
    };
    

    // Render custom dropzone untuk setiap frame
    const renderFrameDropZone = (frame) => {
        // Calculate position relative to stage container
        const frameStyle = {
            position: 'absolute',
            left: `${frame.x}px`,
            top: `${frame.y}px`,
            width: `${frame.width}px`,
            height: `${frame.height}px`,
            border: activeDropZone === frame.id ? '2px dashed #4299e1' : '2px dashed transparent',
            backgroundColor: activeDropZone === frame.id ? 'rgba(66, 153, 225, 0.2)' : 'transparent',
            pointerEvents: 'all'
        };

        return (
            <div
                key={`dropzone-${frame.id}`}
                style={frameStyle}
                onDragEnter={(e) => handleFrameDragEnter(frame.id, e)}
                onDragLeave={handleFrameDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            />
        );
    };

    const resetCanvas = () => {
        setFrames(frames.map(frame => ({ ...frame, photo: null, photoOffsetX: 0, photoOffsetY: 0 })));
    };

    return (
        <div className="w-2/4 p-4">
            {/* <h2 className="text-xl font-bold mb-4">Canvas Editor</h2> */}

            {/* <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Template
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleTemplateUpload}
          className="block w-full text-sm text-gray-500
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-md file:border-0
                   file:text-sm file:font-semibold
                   file:bg-blue-50 file:text-blue-700
                   hover:file:bg-blue-100"
        />
      </div> */}

            <div
                className="border rounded shadow bg-white overflow-auto h-screen relative"
                // style={{ height: 'calc(100vh - 180px)' }}
                ref={containerRef}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <Stage
                    width={stageSize.width} height={stageSize.height}
                    ref={stageRef}
                    onClick={handleStageClick}
                >
                    {/* Layer 1: Background Template */}
                    <Layer>
                        {templateImage && (
                            <KonvaImage
                                image={templateImage}
                                x={0}
                                y={0}
                                width={templateDimensions.width}
                                height={templateDimensions.height}
                                // width={canvasSize.width / 2}
                                // height={canvasSize.height}
                                listening={false}
                            />
                        )}
                    </Layer>

                    {/* Layer 2: Foto-foto dalam frame */}
                    <Layer>
                        {frames.map(frame => renderPhotoInFrame(frame))}
                    </Layer>

                    {/* Layer 3: Frame outlines dan visual indicators */}
                    <Layer>
                        {frames.map(frame => (
                            <Rect
                                key={frame.id}
                                id={frame.id}
                                x={frame.x}
                                y={frame.y}
                                width={frame.width}
                                height={frame.height}
                                stroke={activeDropZone === frame.id ? '#4299e1' : 'white'}
                                strokeWidth={2}
                                dash={[5, 5]}
                                fill="transparent"
                                onClick={() => {
                                    if (frame.photo) {
                                        setSelectedId(`photo-${frame.id}`);
                                    }
                                }}
                                onDblClick={() => handleRemovePhotoFromFrame(frame.id)}
                            />
                        ))}
                    </Layer>

                    {/* Layer 4: Transformer untuk seleksi dan transformasi */}
                    <Layer>
                        <Transformer
                            ref={transformerRef}
                            boundBoxFunc={(oldBox, newBox) => {
                                if (newBox.width < 5 || newBox.height < 5) return oldBox;
                                return newBox;
                            }}
                            rotateEnabled={true}
                            keepRatio={false}
                        />
                    </Layer>
                </Stage>

                {/* HTML Overlay untuk Drop Zones */}
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                    {frames.map(frame => renderFrameDropZone(frame))}
                </div>
            </div>

            <div className="mt-4 flex space-x-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Simpan Project
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Export Hasil
                </button>
                <button
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    onClick={resetCanvas}
                >
                    Reset Canvas
                </button>
            </div>

            <div className="mt-4 text-sm text-gray-600">
                <p>* Double klik pada frame untuk menghapus foto</p>
                <p>* Klik pada foto untuk mengatur posisi dan ukurannya</p>
            </div>
        </div>
    );
};

export default CanvasEditor;