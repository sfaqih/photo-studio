import React, { useEffect, useState } from 'react';
import TemplateManager from '../components/Template/TemplateManager';
import CanvasEditor from '../components/Template/CanvasEditor';

function Template() {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);

  const loadTemplates = async () => {
    const tpls = await window.electronAPI.getTemplates();
    setTemplates(tpls);
  };

  const handleSaveFrames = async (frames) => {
    const updated = { ...selected, frames };
    console.debug("Updated Frames, ", updated)
    await window.electronAPI.saveFrame(updated.id, updated);
    setTemplates(prev => prev.map(t => t.name === updated.name ? updated : t));
  };

  const unsetSelectedTemplate = () => {
    setSelected(null)
  }

  const setSelectedTemplate = (template) => {
    setSelected(template)
  }

  const handleDeleteTemplate = async (templateId) => {
    console.debug("Delete Template: ", templateId)
    await window.electronAPI.deleteTemplate(templateId);
  }

  useEffect(() => {
    loadTemplates();
  }, []);

  return (
    <div>
      {!selected && (
        <><TemplateManager onUpload={loadTemplates} onClickEdit={setSelectedTemplate} onClickDelete={handleDeleteTemplate} /></>
      )}
      {selected && <CanvasEditor template={selected} onSaveFrames={handleSaveFrames} back={unsetSelectedTemplate} />}
    </div>
  );
}

export default Template;
