// src/components/ProductManagementComponents/ImageUpload.tsx

import React, { ChangeEvent } from 'react';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  maxSizePerImageMB?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 5,
  maxSizePerImageMB = 2,
}) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => file.size / 1024 / 1024 <= maxSizePerImageMB);

    if (validFiles.length + images.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images.`);
      return;
    }

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
          onImagesChange([...images, reader.result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    const updated = [...images];
    updated.splice(index, 1);
    onImagesChange(updated);
  };

  return (
    <div>
      <label className="block mb-2 font-semibold">Upload Images</label>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
      />
      <div className="flex mt-2 space-x-2 overflow-x-auto">
        {images.map((img, idx) => (
          <div key={idx} className="relative">
            <img
              src={img}
              alt={`Uploaded ${idx + 1}`}
              className="h-20 w-20 object-cover rounded"
            />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-0 right-0 bg-red-600 text-white rounded-full px-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageUpload;
