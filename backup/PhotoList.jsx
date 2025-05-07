import React, { useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';
import { Card } from "@material-tailwind/react";

const PhotoList = ({ photos, onDragStart }) => {
    console.debug("photos::: ", photos);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const onSelectTemplate = async (templateId) => {
        setSelectedId(templateId)

        const template = await window.electronAPI.getTemplate(templateId);

        if (template) setSelectedTemplate(template)
    }

  return (
    <div className="p-6 bg-main-color min-h-screen flex flex-col justify-center items-center ">
    <img src={"./choose_frame.png"} className="object-cover w-50 pb-4 max-h-90" />
    <Card className="cursor-pointer p-1 border-2 bg-gray-100 rounded-xl my-2">
        <div className="h-[600px] overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-mint scrollbar-track-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                    <div
                        key={index}
                        // onClick={() => onSelectTemplate(photo.id)}
                        className="relative cursor-pointer p-1 border-0 transition-all duration-200 rounded-xl group"
                    >
                        <img
                            key={index}
                            src={photo.pathUrl}
                            alt={photo.name}
                            className="w-full h-full rounded"
                        />

                        {/* Overlay */}
                        <div
                            className={`
        absolute inset-0 rounded 
        transition duration-200 
        ${selectedId === photo.id ? "bg-black/60" : "group-hover:bg-black/20"}
        flex items-center justify-center
        `}
                        >
                            {selectedId === photo.id && (
                                <span className="text-white font-semibold">Selected</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </Card>
</div>
  )
};


export default PhotoList;
