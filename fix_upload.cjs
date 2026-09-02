const fs = require('fs');

let content = fs.readFileSync('src/pages/Customize.tsx', 'utf8');

const newUploadLogic = `
  const resizeAndConvertImageToBase64 = (file: File, maxWidth: number = 1200): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scaleSize = maxWidth / img.width;
          let width = img.width;
          let height = img.height;
          
          if (scaleSize < 1) {
            width = img.width * scaleSize;
            height = img.height * scaleSize;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof StoreCustomizerConfig) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    try {
      // Firebase Storage is generally not fully provisioned in this sandboxed environment,
      // so we convert to a compressed Base64 string and save it directly via Firestore.
      const base64String = await resizeAndConvertImageToBase64(file, fieldName === 'logoUrl' ? 400 : 1200);
      updateConfig(fieldName, base64String);
      setUploadingField(null);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadingField(null);
    }
  };
`;

content = content.replace(/const handleImageUpload = async \[\s\S\]*?catch \(error\) \{\s*console\.error\(error\);\s*setUploadingField\(null\);\s*\}\s*\};\n/, newUploadLogic);

// We need a regex that matches the whole function. Let's do it with split/join or substring to be safe.
