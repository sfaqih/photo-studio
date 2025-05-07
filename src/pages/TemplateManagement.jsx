import { useState, useEffect } from "react";

export default function TemplateManagement() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [frames, setFrames] = useState([]);
  const [newFrame, setNewFrame] = useState({ x: 0, y: 0, width: 100, height: 100 });

  // Fetch template list on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const data = await window.templateAPI.getAll();
    setTemplates(data);
  };

  const handleAddTemplate = async () => {
    const name = prompt("Nama Template?");
    if (!name) return;
    await window.templateAPI.add(name, { frames: [], createdAt: Date.now() });
    loadTemplates();
  };

  const handleDeleteTemplate = async (name) => {
    if (confirm("Yakin ingin hapus template ini?")) {
      await window.templateAPI.delete(name);
      setSelectedTemplate(null);
      setFrames([]);
      loadTemplates();
    }
  };

  const handleSelectTemplate = async (name) => {
    setSelectedTemplate(name);
    const templateFrames = await window.frameAPI.getAll(name);
    setFrames(templateFrames);
  };

  const handleAddFrame = async () => {
    const frame = {
      id: Date.now(),
      ...newFrame
    };
    await window.frameAPI.add(selectedTemplate, frame);
    const updated = await window.frameAPI.getAll(selectedTemplate);
    setFrames(updated);
  };

  const handleDeleteFrame = async (id) => {
    await window.frameAPI.delete(selectedTemplate, id);
    const updated = await window.frameAPI.getAll(selectedTemplate);
    setFrames(updated);
  };

  const handleUpdateFrame = async (id, key, value) => {
    const updated = frames.map(f => f.id === id ? { ...f, [key]: Number(value) } : f);
    setFrames(updated);
    await window.frameAPI.update(selectedTemplate, id, { [key]: Number(value) });
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Template Manager</h1>

      <div>
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleAddTemplate}>
          Tambah Template
        </button>

        <div className="grid grid-cols-3 gap-4 mt-4">

        </div>
      </div>

      {selectedTemplate && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Frames untuk: {selectedTemplate}</h2>

          <div className="space-y-2">
            {frames.map((frame) => (
              <div key={frame.id} className="flex items-center gap-4 border p-2 rounded">
                <span>ID: {frame.id}</span>
                <label>
                  X:
                  <input
                    type="number"
                    value={frame.x}
                    onChange={(e) => handleUpdateFrame(frame.id, "x", e.target.value)}
                    className="ml-1 w-16 border px-2"
                  />
                </label>
                <label>
                  Y:
                  <input
                    type="number"
                    value={frame.y}
                    onChange={(e) => handleUpdateFrame(frame.id, "y", e.target.value)}
                    className="ml-1 w-16 border px-2"
                  />
                </label>
                <label>
                  W:
                  <input
                    type="number"
                    value={frame.width}
                    onChange={(e) => handleUpdateFrame(frame.id, "width", e.target.value)}
                    className="ml-1 w-16 border px-2"
                  />
                </label>
                <label>
                  H:
                  <input
                    type="number"
                    value={frame.height}
                    onChange={(e) => handleUpdateFrame(frame.id, "height", e.target.value)}
                    className="ml-1 w-16 border px-2"
                  />
                </label>
                <button className="text-red-500" onClick={() => handleDeleteFrame(frame.id)}>
                  Hapus
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 space-x-2">
            <input
              type="number"
              placeholder="x"
              value={newFrame.x}
              onChange={(e) => setNewFrame({ ...newFrame, x: Number(e.target.value) })}
              className="border px-2 w-20"
            />
            <input
              type="number"
              placeholder="y"
              value={newFrame.y}
              onChange={(e) => setNewFrame({ ...newFrame, y: Number(e.target.value) })}
              className="border px-2 w-20"
            />
            <input
              type="number"
              placeholder="width"
              value={newFrame.width}
              onChange={(e) => setNewFrame({ ...newFrame, width: Number(e.target.value) })}
              className="border px-2 w-20"
            />
            <input
              type="number"
              placeholder="height"
              value={newFrame.height}
              onChange={(e) => setNewFrame({ ...newFrame, height: Number(e.target.value) })}
              className="border px-2 w-20"
            />
            <button className="bg-green-500 text-white px-4 py-1 rounded" onClick={handleAddFrame}>
              Tambah Frame
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
