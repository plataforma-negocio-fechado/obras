export const MAX_EVIDENCE_BYTES = 1_500_000;
export const MAX_EVIDENCE_DIMENSION = 1600;

export type CompressedImage = {
  dataUrl: string;
  type: "image/jpeg";
  size: number;
};

export function dataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(",", 2)[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

export function compressImageFile(file: File): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Selecione uma imagem"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a foto"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Não foi possível processar a foto"));
      image.onload = () => {
        const scale = Math.min(1, MAX_EVIDENCE_DIMENSION / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Seu navegador não conseguiu preparar a foto"));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        let quality = 0.8;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrlBytes(dataUrl) > MAX_EVIDENCE_BYTES && quality > 0.45) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        const size = dataUrlBytes(dataUrl);
        if (size > MAX_EVIDENCE_BYTES) {
          reject(new Error("A foto ainda ficou grande demais. Tente uma imagem menor."));
          return;
        }
        resolve({ dataUrl, type: "image/jpeg", size });
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
