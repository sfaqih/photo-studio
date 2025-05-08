import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ChooseFolder() {
  const [dirPath, setDirPath] = useState(null);
  const [dirName, setDirName] = useState(null);
  const navigate = useNavigate();

  const onChoose = async () => {
    const files = await window.electronAPI.chooseFolder(); // dari folder

    setDirName(files.basename);
    setDirPath(files.dirPath);

    localStorage.setItem("CustomerFolder", `${files.dirPath}/compressed`);
  };

  const handleNext = () => {
    if(!dirPath) return alert("Mohon untuk pilih folder dengan benar...");
    window.electronAPI.compressImages(dirPath, `${dirPath}/compressed`);

    return navigate("/select-template");
  }

  return (
    <div className="min-h-screen min-w-screen flex flex-col items-center justify-center p-4">
      {/* Container Card */}
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-md border-4 border-black p-8 flex flex-col items-center gap-4">
        {/* Icon (replace with your own asset later) */}
        <div className="w-32 h-32 rounded-lg flex items-center justify-center">
          {/* Placeholder for image/icon */}
          <span className="text-sm"><img src="./icons/choose_folder.png" alt="" /></span>
        </div>

        {/* Folder Name */}
        <div className="text-center text-black font-semibold">
          {dirName && dirName}
          {dirPath && <><div><span className="text-xs text-black">Folder: {dirPath}</span></div></>}
        </div>

        {/* Button Pilih Folder */}
        <button className="bg-black text-white px-6 py-2 rounded-full" onClick={onChoose}>
          Pilih Folder
        </button>
      </div>

      {/* Spacer */}
      <div className="mt-8">
        {/* Button Pilih Template */}
        <button className="bg-pink-500 hover:bg-pink-600 transition-colors disabled:opacity-50 text-white text-2xl px-12 py-5 rounded-2xl shadow-lg" onClick={handleNext}>
          Pilih Template
        </button>
      </div>
    </div>
  );
}
