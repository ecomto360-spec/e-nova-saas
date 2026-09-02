const fs = require('fs');
let content = fs.readFileSync('src/pages/Customize.tsx', 'utf8');

const targetFunction = `  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof StoreCustomizerConfig) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    try {
      const storageRef = ref(storage, \`stores/\${auth.currentUser?.uid || 'demo'}/\${fieldName}-\${Date.now()}\`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        () => {},
        (error) => {
          console.error("Upload error:", error);
          setUploadingField(null);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          updateConfig(fieldName, downloadURL);
          setUploadingField(null);
        }
      );
    } catch (error) {
      console.error(error);
      setUploadingField(null);
    }
  };`;

const newUploadLogic = `  const resizeAndConvertImageToBase64 = (file: File, maxWidth: number = 1200): Promise<string> => {
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
  };`;

if (content.includes("const storageRef = ref(storage")) {
  content = content.replace(targetFunction, newUploadLogic);
  fs.writeFileSync('src/pages/Customize.tsx', content);
  console.log("Successfully replaced");
} else {
  console.log("Could not find the target string.");
}
