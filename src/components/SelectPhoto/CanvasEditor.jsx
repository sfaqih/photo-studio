// CanvasEditor.jsx - Komponen untuk canvas dan manipulasi foto
import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Rect } from 'react-konva';
import { useNavigate } from 'react-router-dom';
import { DefaultPaper, DefaultScale } from '../../constants/template';
import { usePhotoStudio } from '../../contexts/studio';

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
    const stageRef = useRef(null); // Use 'any' for stageRef
    const containerRef = useRef(null);
    const navigate = useNavigate();
    const scaling = DefaultScale;
    const scalingWidth = DefaultScale;

    const { photoStudioSession, setPhotoStudioSession } = usePhotoStudio();

    const [stageZoom, setStageZoom] = useState(1);
    const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
    const [isDraggingStage, setIsDraggingStage] = useState(false);
    const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
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
                width: canvasSize.width,
                height: canvasSize.height
            });
        });
        console.debug("photoStudioSession: ", photoStudioSession);
        const frames = photoStudioSession?.frames?.length > 0 ? photoStudioSession.frames : selectedTemplate?.frames;
        setFrames(frames);
    };

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

    const handleStageTouchStart = (e) => {
        setIsDraggingStage(true);
        const touch = e.touches[0];
        setTouchStart({ x: touch.clientX, y: touch.clientY });
    };

    const handleStageTouchMove = (e) => {
        if (!isDraggingStage) return;

        const touch = e.touches[0];
        const stage = stageRef.current;

        if (stage) {
            const point = {
                x: touch.clientX / stageZoom, // Account for zoom
                y: touch.clientY / stageZoom,
            };

            setStagePosition({
                x: stagePosition.x + (point.x - touchStart.x) / stageZoom,
                y: stagePosition.y + (point.y - touchStart.y) / stageZoom,
            });
            setTouchStart({ x: touch.clientX, y: touch.clientY });
        }
    };

    const handleStageTouchEnd = () => {
        setIsDraggingStage(false);
    };

    const handleDrag = (e) => { // Use 'any' for the event type
      if (isDraggingStage) {
        setStagePosition({
          x: stagePosition.x + e.evt.movementX,
          y: stagePosition.y + e.evt.movementY,
        });
      }
    };

    // Handler untuk klik di luar object di stage
      const handleStageClick = (e) => {  // Use 'any' for the event type
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

    const handleZoom = (e) => { // Use 'any' for the event
        const stage = stageRef.current;
        if (!stage) return;

        const zoomCenter = stage.getPointerPosition() || { x: stage.width() / 2, y: stage.height() / 2 };

        let newScale = stageZoom + e.evt.deltaY * -0.002;
        newScale = Math.max(0.5, Math.min(5, newScale)); // Limit zoom

        setScale(newScale);

        // Calculate new position to keep zoom centered
        const oldCenter = {
            x: (zoomCenter.x - stagePosition.x) / stageZoom,
            y: (zoomCenter.y - stagePosition.y) / stageZoom,
        };

        const newPositionX = zoomCenter.x - oldCenter.x * newScale;
        const newPositionY = zoomCenter.y - oldCenter.y * newScale;

        setStageZoom(newScale);
        setStagePosition({
            x: newPositionX,
            y: newPositionY,
        });
    };


    // Fungsi untuk render foto dalam frame
    const renderPhotoInFrame = (frame) => {
        if (!frame.photo) return null;
        console.debug("frame.photo: ", frame.photo)

        const photoImg   = frame.photo.img;
        const photoRatio = photoImg.width / photoImg.height;
        const frameRatio = frame.width / frame.height;

        let photoWidth, photoHeight;
        let offsetX = frame.photoOffsetX || 0;
        let offsetY = frame.photoOffsetY || 0;

        if (photoRatio > frameRatio) {
            console.log("A");
            photoHeight = frame.height;
            photoWidth = photoHeight * photoRatio;
            if (offsetX === 0) offsetX = (photoWidth - frame.width) / 2;
        } else {
            console.log("B");
            photoWidth = frame.width;
            photoHeight = photoWidth / photoRatio;
            if (offsetY === 0) offsetY = (photoHeight - frame.height) / 2;
        }

        return (
            // <Group
            //     key={frame.id}
            //     x={scaledX}
            //     y={scaledY}
            //     clipFunc={(ctx) => {
            //         ctx.rect(0, 0, scaledWidth, scaledHeight);
            //     }}
            // >
                <KonvaImage
                    id={`photo-${frame.id}`}
                    image={frame.photo.img}
                    x={frame.x * DefaultScale}
                    y={frame.y * DefaultScale}
                    width={photoWidth * DefaultScale}
                    height={photoHeight * DefaultScale}
                    offsetX={offsetX * DefaultScale}
                    offsetY={offsetY * DefaultScale}
                    // onClick={() => setSelectedId(`photo-${frame.id}`)}
                    // onTap={() => setSelectedId(`photo-${frame.id}`)}
                    onClick={() => console.log("Tes Click:::")}
                    onDblClick={() => console.log("Tes DOuble Click:::")}
                    // onDblTap={handleRemovePhotoFromFrame(frame.id)}
                    onTransformEnd={(e) => { // Use 'any' for the event
                        const node = e.target;
                        const scaleX = node.scaleX();
                        const scaleY = node.scaleY();

                        // Reset scale to avoid visual distortion
                        node.scaleX(1);
                        node.scaleY(1);

                        // Clamp new offset if needed
                        const newX = node.x();
                        const newY = node.y();

                        handlePhotoPositionChange(frame.id, newX, newY);
                    }}
                    clipFunc={(ctx) => {
                        ctx.rect(0, 0, frame.width * DefaultScale, frame.height * DefaultScale);
                    }}
                />
            // </Group>
        );
    };


    // Render custom dropzone untuk setiap frame
    const renderFrameDropZone = (frame) => {
        // Calculate position relative to stage container
        const frameStyle = {
            position: 'absolute',
            left: `${frame.x * scalingWidth}px`,
            top: `${frame.y * scaling}px`,
            width: `${frame.width * scalingWidth}px`,
            height: `${frame.height * scaling}px`,
            border: activeDropZone === frame.id ? '2px dashed #4299e1' : '2px dashed transparent',
            backgroundColor: activeDropZone === frame.id ? 'rgba(66, 153, 225, 0.2)' : 'transparent',
            pointerEvents: 'all',
            zIndex: 10,
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

    // Render custom div hover untuk setiap frame
    const renderFrameHover = (frame) => {
        // Calculate position relative to stage container
        const frameStyle = {
            position: 'absolute',
            left: `${frame.x * scalingWidth}px`,
            top: `${frame.y * scaling}px`,
            width: `${frame.width * scalingWidth}px`,
            height: `${frame.height * scaling}px`,
            border: activeDropZone === frame.id ? '2px dashed #4299e1' : '2px dashed transparent',
            backgroundColor: activeDropZone === frame.id ? 'rgba(66, 153, 225, 0.2)' : 'transparent',
            pointerEvents: 'all',
            zIndex: 15,
        };

        return frame.photo && (<div
            key={`hover-${frame.id}`}
            style={frameStyle}
            onDoubleClick={() => handleRemovePhotoFromFrame(frame.id)}
        />);
    };

    const resetCanvas = () => {
        setFrames(frames.map(frame => ({ ...frame, photo: null, photoOffsetX: 0, photoOffsetY: 0 })));
    };

    const checkPhotoInFrame = () => {
        let result = true;
        frames.forEach(frame => {
            if (!frame.photo) result = false;
        });

        return result;
    }

    const handleNext = () => {
        const checkPhotoFrames = checkPhotoInFrame();

        if (!checkPhotoFrames) return alert('Pastikan semua frame terisi oleh foto...');

        setPhotoStudioSession({
            frames,
            dirPath: localStorage.getItem("CustomerFolder") || null,
            printDirPath: photoStudioSession.printDirPath
        });

        return navigate('/select-filter');
    }

    return (
        <div className="w-2/5 max-h-screen p-4">
            <div
                className=""
                // style={{ height: 'calc(100vh - 180px)' }}
                style={{ position: 'relative' }}
                ref={containerRef}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <Stage
                    width={DefaultPaper.width * scalingWidth}
                    height={DefaultPaper.height * scaling}
                    ref={stageRef}
                    onClick={handleStageClick}
                    onWheel={handleZoom}
                    draggable
                    dragBoundFunc={(pos) => {
                        const stage = stageRef.current;
                        if (!stage) return pos;

                        const { width, height } = stage.getClientRect();
                        const zoom = stageZoom;

                        const minX = (1 - zoom) * width;
                        const minY = (1 - zoom) * height;
                        const maxX = 0;
                        const maxY = 0;

                        return {
                            x: Math.max(minX, Math.min(maxX, pos.x)),
                            y: Math.max(minY, Math.min(maxY, pos.y)),
                        };
                    }}
                    position={stagePosition}
                    scale={{ x: stageZoom, y: stageZoom }}
                    onDragStart={() => setIsDraggingStage(true)}
                    onDragEnd={(e) => { // Use 'any' for the event
                      setIsDraggingStage(false);
                      handleDrag(e);
                    }}
                    onDrag={handleDrag}
                    onTouchStart={handleStageTouchStart}
                    onTouchMove={handleStageTouchMove}
                    onTouchEnd={handleStageTouchEnd}
                >

                    {/* Layer 2: Foto-foto dalam frame */}
                    <Layer>
                        {frames.map(frame => renderPhotoInFrame(frame))}
                    </Layer>

                    {/* Layer 1: Background Template */}
                    <Layer>
                        {templateImage && (
                            <KonvaImage
                                image={templateImage}
                                x={0}
                                y={0}
                                width={DefaultPaper.width * scalingWidth}
                                height={DefaultPaper.height * scaling}
                                // width={canvasSize.width / 2}
                                // height={canvasSize.height}
                                listening={false}
                            />
                        )}
                    </Layer>

                    {/* Layer 3: Frame outlines dan visual indicators */}
                    <Layer>
                        {frames.map(frame => (
                            <Rect
                                key={frame.id}
                                id={frame.id}
                                x={frame.x * scalingWidth}
                                y={frame.y * scaling}
                                width={frame.width * scalingWidth}
                                height={frame.height * scaling}
                                stroke={activeDropZone === frame.id ? '#4299e1' : 'white'}
                                strokeWidth={2}
                                dash={[5, 5]}
                                fill="transparent"
                                onClick={() => {
                                    if (frame.photo) {
                                        setSelectedId(`photo-${frame.id}`);
                                    }
                                }}
                                onTap={() => {  // Add onTap for mobile
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

                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                    {frames.map(frame => renderFrameHover(frame))}
                </div>
                {/* HTML Overlay untuk Drop Zones */}
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                    {frames.map(frame => renderFrameDropZone(frame))}
                </div>
            </div>

            <div className="mt-4 flex space-x-4">
                {/* <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Export Hasil
                </button> */}
                <button
                    className="px-4 py-2 bg-slate-600 text-white rounded-2xl hover:bg-slate-700"
                    onClick={resetCanvas}
                >
                    Reset
                </button>
                <button onClick={handleNext} className="bg-pink-500 hover:bg-pink-600 transition-colors disabled:opacity-50 text-white text-2xl px-12 py-5 rounded-2xl shadow-lg">
                    Next (Pilih Efek Filter)
                </button>
            </div>

            <div className="mt-4 text-sm text-gray-600">
                <p>* Double klik pada foto untuk menghapus foto</p>
                {/* <p>* Klik pada foto untuk mengatur posisi dan ukurannya</p> */}
            </div>
        </div>
    );
};

export default CanvasEditor;