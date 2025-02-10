"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { calculateMD5 } from "./utils/md5";
import FileListPage from "./components/FileListPage";

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const [refreshFileList, setRefreshFileList] = useState(false);

  const uploadFiles = async () => {
    if (files.length === 0) return alert("Please select files to upload");

    setUploading(true);

    try {
      // Calculate MD5 hash for each file
      const fileData = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          md5: await calculateMD5(file),
        }))
      );

      // Request pre-signed URLs from backend
      const response = await fetch("/api/files/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: fileData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      const { presignedUrls } = await response.json();

      // Upload each file to Wasabi
      await Promise.all(
        presignedUrls.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          async ({ url, fields, key, expectedEtag }: any, index: number) => {
            const formData = new FormData();
            Object.entries(fields).forEach(([k, v]) =>
              formData.append(k, v as string)
            );
            formData.append("file", files[index]);

            await fetch(url, {
              method: "POST",
              body: formData,
            });

            const etagResponse = await fetch("/api/files/upload/verify-etag", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key, expectedMd5: expectedEtag }),
            });

            if (!etagResponse.ok) {
              throw new Error(
                `ETag mismatch for ${files[index].name}. Upload failed.`
              );
            }

            return { key, expectedEtag, presignedUrl: url };
          }
        )
      );

      setFiles([]);
      setRefreshFileList((prev) => !prev);
      alert("Upload successful!");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Upload failed", error);
      alert(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="max-w-lg mx-auto mt-10 p-6 border rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Upload Files</h1>

        <div
          {...getRootProps()}
          className="border-dashed border-2 p-10 text-center cursor-pointer"
        >
          <input {...getInputProps()} />
          <p>Click to select</p>
        </div>

        {files.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Files to upload:</h3>
            <ul>
              {files.map((file, index) => (
                <li
                  key={file.name}
                  className="flex justify-between items-center"
                >
                  <span>{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.374-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33Z"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={uploadFiles}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
          disabled={uploading || files.length === 0}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      <FileListPage refreshFileList={refreshFileList} />
    </>
  );
}
