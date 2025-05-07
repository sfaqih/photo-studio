import React, { useState } from 'react';

const PhotoList = ({ photos }) => {
    console.debug("photos::: ", photos);
    const [active, setActive] = useState(photos[0]?.base64 || null);
//   return (
//     <div className="h-full overflow-y-auto p-4 space-y-4">
//       {photos.map((photo, index) => (
//         <img
//           key={index}
//           src={photo.base64}
//           alt={`Photo ${index}`}
//           draggable
//           onDragStart={(e) => e.dataTransfer.setData('photo', photo)}
//           className="w-full rounded-md cursor-grab border border-gray-300"
//         />
//       ))}
//     </div>
//   );

  return (
    <div className="grid gap-4">
    <div>
      <img
        className="h-auto w-full max-w-full rounded-lg object-cover object-center md:h-[480px]"
        src={active}
        alt=""
      />
    </div>
    <div className="grid grid-cols-5 gap-4">
      {photos.map((photo, index) => (
        <div key={index}>
          <img
            key={index}
            onClick={() => setActive(photo.base64)}
            src={photo.base64}
            className="h-20 max-w-full cursor-pointer rounded-lg object-cover object-center"
            alt="gallery-image"
                       draggable
            onDragStart={(e) => onDragStart(e, photo)}
          />
        </div>
      ))}
    </div>
  </div>
  )
};


export default PhotoList;
