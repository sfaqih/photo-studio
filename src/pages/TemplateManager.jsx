import React, { useEffect, useState } from "react";

const TemplateManager = ({ onSelect }) => {
  const [templates, setTemplates] = useState([]);
  const [name, setName] = useState("");
  const [path, setPath] = useState("");

  useEffect(() => {
    const savedTemplates = window.frameStore.getTemplates() || [];
    console.debug("savedTemplates", savedTemplates);
    setTemplates(savedTemplates);
  }, []);

  const handleAdd = () => {
    if (!name || !path) return alert("Fill in all fields");
    const newTemplate = {
      id: Date.now(),
      name,
      path,
    };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    window.frameStore.saveTemplates(updated);
    setName("");
    setPath("");
  };

  const handleDelete = (id) => {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    window.frameStore.saveTemplates(updated);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Template Manager</h2>
      <div className="mb-2 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template name"
          className="border px-2 py-1"
        />
        <input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="Template path (file://...)"
          className="border px-2 py-1 w-[300px]"
        />
        <button type="button" onClick={handleAdd} className="bg-green-500 text-white px-3 py-1 rounded">
          + Add
        </button>
      </div>
      <ul className="space-y-2">
        {templates.map((t) => (
          <li key={t.id} className="flex justify-between border p-2 rounded">
            <div>
              <strong>{t.name}</strong>
              <p className="text-xs text-gray-500">{t.path}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onSelect(t)} className="text-blue-600">✏ Manage Frames</button>
              <button onClick={() => handleDelete(t.id)} className="text-red-600">🗑</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TemplateManager;
