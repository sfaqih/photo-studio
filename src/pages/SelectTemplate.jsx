import { useState, useEffect } from "react";
import { Card } from "@material-tailwind/react";
import { useNavigate } from 'react-router-dom';
import { ArrowLeftCircle } from 'lucide-react';

export default function SelectTemplate() {
    const navigate = useNavigate();
    const [selectedId, setSelectedId] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templates, setTemplates] = useState([]);

    const onNextClick = () => {
        if (!selectedId) return false;
        const selectedTemplate = templates.find((template) => {
            return template.id == selectedId
        })
        localStorage.setItem("selectedTemplate", JSON.stringify(selectedTemplate));

        // navigate("/edit-images");
        navigate('/select-photos');
    }

    const onSelectTemplate = async (templateId) => {
        setSelectedId(templateId)

        const template = await window.electronAPI.getTemplate(templateId);

        if (template) setSelectedTemplate(template)
    }

    const loadTemplates = async () => {
        const tpls = await window.electronAPI.getTemplates();
        setTemplates(tpls);
    };

    const handleBack = () => {
        return navigate('/');
    }

    useEffect(() => {
        loadTemplates();
    }, []);    

    return (
        <div className="container min-w-screen flex">
            <div className="w-2/3 max-h-screen">
                <div className="flex justify-between items-center px-5 py-2">
                  <button 
                    className="back-button flex items-center text-pink-500 hover:text-pink-600"
                    onClick={handleBack}
                  >
                    <ArrowLeftCircle size={24} className="mr-2" />
                    <span>Kembali</span>
                  </button>
                </div>         
                <div className="px-5 max-h-screen flex flex-col justify-center items-center ">
                    {/* <img src={"/choose_frame.png"} className="object-cover w-50 pb-4 max-h-90" /> */}
                    <Card className="cursor-pointer p-1 border-2 bg-gray-100 rounded-xl my-2">
                        <div className="h-[600px] overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-mint scrollbar-track-gray-200">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {templates.map((template) => (
                                    <div
                                        key={template.id}
                                        onClick={() => onSelectTemplate(template.id)}
                                        className="relative cursor-pointer p-1 border-0 transition-all duration-200 rounded-xl group"
                                    >
                                        <img
                                            src={template.pathUrl}
                                            alt={template.name}
                                            className="w-full h-full rounded"
                                        />

                                        {/* Overlay */}
                                        <div
                                            className={`
                        absolute inset-0 rounded 
                        transition duration-200 
                        ${selectedId === template.id ? "bg-black/60" : "group-hover:bg-black/20"}
                        flex items-center justify-center
                        `}
                                        >
                                            {selectedId === template.id && (
                                                <span className="text-white font-semibold">Selected</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
            <div className="w-1/3">
                <div className="py-2">&nbsp;</div>
                <div className="h-full flex flex-col justify-center items-center px-3 space-y-3">
                {/* Header */}
                {/* <div className="w-full text-center">
                    <h1 className="text-white text-3xl font-light">Preview</h1>
                </div> */}

                {/* Body */}
                {
                    selectedTemplate &&
                    <div className="w-full border-4 bg-gray-100 max-h-7/10">
                        <img src={selectedTemplate.pathUrl} className="w-full h-full" alt={selectedTemplate.name} />
                    </div>
                }

                {/* Footer */}
                {
                    selectedTemplate &&
                    <div className="w-full max-w-sm flex items-center justify-center">
                        <button className="bg-pink-500 hover:bg-pink-600 transition-colors disabled:opacity-50 text-white text-2xl px-12 py-5 rounded-2xl shadow-lg" onClick={onNextClick} ><span>Next (Pilih Foto)</span></button>
                    </div>
                }
                </div>
            </div>
            {/* <div className="w-1/4 pe-4 content-center">
                <h2 className="text-4xl text-center">Preview</h2>
                {selectedTemplate &&
                    <><div className="my-10">
                        <img src={selectedTemplate.pathUrl} className="mt-[9vh]" alt={selectedTemplate.name} />
                    </div>
                    <div className="">
                        <button className="btn-97 w-full" onClick={onNextClick} >Next (Pilih Foto)</button>
                    </div>
                    </>
                }
            </div> */}
        </div>
    );
}
