import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";

const TemplateManager = ({ onUpload, onClickEdit, onClickDelete }) => {

    const [templates, setTemplates] = useState([]);
    const [selected, setSelected] = useState(null);
    const navigate = useNavigate();

    const fileInputRef = useRef();

    const handleUploadClick = () => fileInputRef.current.click();

    const handleFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const dataUrl = reader.result;
            const pathUrl = await window.electronAPI.uploadTemplate(file.name, dataUrl);
            await window.electronAPI.saveTemplate(file.name, { name: file.name, pathUrl, frames: [] });
            onUpload();
        };
        reader.readAsDataURL(file);
    };

    const loadTemplates = async () => {
        const tpls = await window.electronAPI.getTemplates();
        setTemplates(tpls);
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    return (
        <div className="p-6">
            <div className="flex items-center justify-start mb-6">
                <h2 className="text-2xl font-semibold">📁 Template Manager</h2>
                {/* <button onClick={navigate(-1)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Back</button> */}
                <div className='mx-5'>
                    <button
                        onClick={handleUploadClick}
                        className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-900 transition"
                    >
                        ➕ Upload Template
                    </button>
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFile} />
            </div>
            {templates.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                    <p className="text-lg">Belum ada template yang diupload.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {templates.map((tpl) => (
                        <div
                            key={tpl.name}
                            className="border rounded-lg shadow-sm hover:shadow-md bg-white overflow-hidden transition"
                        >
                            <img
                                src={tpl.pathUrl}
                                alt={tpl.name}
                                className="w-full h-32 object-cover"
                            />
                            <div className="p-3">
                                <p className="text-sm font-medium truncate text-black">{tpl.name}</p>
                                <div className="flex justify-between mt-3 space-x-2">
                                    <button
                                        onClick={() => onClickEdit(tpl)}
                                        className="flex-1 bg-slate-800 text-white text-sm px-3 py-1 rounded hover:bg-slate-900 transition"
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        onClick={() => onClickDelete(tpl.id)}
                                        className="flex-1 bg-slate-800 text-white text-sm px-3 py-1 rounded hover:bg-slate-900 transition"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
};

export default TemplateManager;
