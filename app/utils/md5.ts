import CryptoJS from "crypto-js";

export async function calculateMD5(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = () => {
      const wordArray = CryptoJS.lib.WordArray.create(
        new Uint8Array(reader.result as ArrayBuffer)
      );
      const md5Hash = CryptoJS.MD5(wordArray).toString();
      resolve(md5Hash);
    };

    reader.onerror = (error) => reject(error);
  });
}
