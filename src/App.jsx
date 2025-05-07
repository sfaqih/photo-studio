import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';
import SelectTemplate from './pages/SelectTemplate';
import ChooseFolder from './pages/ChooseFolder';
import EditorPage from './pages/EditorPage';
import Template from './pages/Template';
import SelectPhoto from './pages/SelectPhoto';
import SelectFilter from './pages/SelectFilter';
import { PhotoStudioProvider } from './contexts/studio';
import PrintPreview from './pages/PrintPreview';
import PrintSuccess from './pages/PrintSuccess';

function App() {
  console.log("Rendering App V2...");
  return (
    // <div className="app-background">
    <PhotoStudioProvider>
    <HashRouter>
      <Routes>
        <Route path="/select-template" element={<SelectTemplate />} />
        <Route path="/" element={<ChooseFolder />} />
        <Route path="/select-photos" element={<SelectPhoto />} />
        <Route path="/select-filter" element={<SelectFilter />} />
        <Route path="/print-preview" element={<PrintPreview />} />
        <Route path="/print-success" element={<PrintSuccess />} />
        <Route path="/edit-images" element={<EditorPage />} />
        {/* <Route path="/setup-template" element={<TemplateSetupPage />} />
        <Route path="/setup-template-1" element={<TemplateFrameEditor />} />
        <Route path="/template-manager" element={<TemplateManager />} />
        <Route path="/template-management" element={<TemplateManagement />} /> */}
        <Route path="/template" element={<Template />} />
      </Routes>
    </HashRouter>
    </PhotoStudioProvider>
    // </div>
  );
}

export default App;
