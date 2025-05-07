import { useState } from "react";

export default function NativeFolderImageGrid() {
  const [images, setImages] = useState([]);

  const template = { id: 1, title: "Template 1", image: "/frames/1.jpeg" };

  const loadImageAsBase64 = async (filePath) => {
    const base64 = await window.electronAPI.loadImageBase64(filePath);
    return base64;
  };

  const loadImages = async () => {
    const files = await window.electronAPI.chooseFolder(); // dari folder
  
    const base64Images = await Promise.all(
      files.map(async (filePath) => ({
        name: filePath.name,
        data: await loadImageAsBase64(filePath),
      }))
    );
  
    setImages(base64Images);
  };

  const [slotImages, setSlotImages] = useState({});
  

  // const loadImages = async () => {
  //   const result = await window.electronAPI.chooseFolder();
  //   if (result) setImages(result);
  // };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("text/plain", index);
  };

  const handleDrop = (e, index) => {
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (fromIndex === index) return;

    const updated = [...images];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(index, 0, moved);
    setImages(updated);
  };

  return (
<div className="flex w-full h-screen">
  <div className="w-3/4 p-4 overflow-y-auto border-r">
  <button
       onClick={loadImages}
       className="bg-indigo-500 text-white px-6 py-2 rounded hover:bg-indigo-600 transition"
     >
       Choose Folder
     </button>
    {/* Image List dari Folder */}
    {/* <div className="grid grid-cols-3 gap-4">
      {images.map((img, idx) => (
        <img
          key={idx}
          src={img.data}
          draggable
          onDragStart={(e) => handleDragStart(e, img)}
          alt={img.name} className="w-full h-40 object-cover"
        />
      ))}
    </div> */}
  </div>

  <div className="w-1/4 p-4 flex flex-col items-center">
    <img src={template.image} className="w-full rounded-lg mb-4" />

    {/* Slot 2x3 */}
    <div className="grid grid-cols-3 gap-2 w-full">
      {[0, 1, 2, 3, 4, 5].map((slot) => (
        <div
          key={slot}
          onDrop={(e) => handleDrop(e, slot)}
          onDragOver={(e) => e.preventDefault()}
          className="w-full aspect-square border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-white"
        >
          {slotImages[slot] && (
            <img src={slotImages[slot]} className="object-cover w-full h-full rounded" />
          )}
        </div>
      ))}
    </div>
  </div>
</div>
    
    // <div className="p-6">
    //   <button
    //     onClick={loadImages}
    //     className="bg-indigo-500 text-white px-6 py-2 rounded hover:bg-indigo-600 transition"
    //   >
    //     Choose Folder
    //   </button>

    //   <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
    //     {images.map((img, index) => (
    //       <div
    //         key={index}
    //         draggable
    //         onDragStart={(e) => handleDragStart(e, index)}
    //         onDragOver={(e) => e.preventDefault()}
    //         onDrop={(e) => handleDrop(e, index)}
    //         className="relative border rounded overflow-hidden shadow-md hover:shadow-xl"
    //       >
    //         <img src={img.data} alt={img.name} className="w-full h-40 object-cover" />
    //         <p className="text-center p-1 text-sm">{img.name}</p>
    //       </div>
    //     ))}
    //   </div>
    // </div>
  );
}
