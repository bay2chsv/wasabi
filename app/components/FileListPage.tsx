import { useEffect, useState } from "react";

export default function FileListPage({
  refreshFileList,
}: {
  refreshFileList: boolean;
}) {
  const [files, setFiles] = useState<
    {
      key: string;
      size: number;
      type: string;
    }[]
  >([]);

  const fetchFiles = async () => {
    const response = await fetch("/api/files");
    const data = await response.json();
    if (Array.isArray(data.files)) {
      const sortedFiles = data.files.sort(
        (a: { lastModified: Date }, b: { lastModified: Date }) =>
          new Date(b.lastModified).getTime() -
          new Date(a.lastModified).getTime()
      );
      setFiles(sortedFiles || []);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [refreshFileList]); // Trigger re-fetch when refreshFileList changes

  // Function to download files
  const downloadFile = async (key: string) => {
    try {
      const response = await fetch("/api/files/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const fileResponse = await fetch(data.url);
      console.log(fileResponse);
      const blob = await fileResponse.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = key.split("/").pop() || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Download failed", error);
      alert("Download failed");
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Files in Wasabi Bucket</h1>

      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map(({ key, size }) => {
            return (
              <li
                key={key}
                className="flex justify-between items-center border p-2"
              >
                <div className="flex items-center space-x-2">
                  <span>
                    {key} ({(size / 1024 / 1024).toFixed(2)} MB)
                  </span>{" "}
                </div>
                <button
                  onClick={() => downloadFile(key)}
                  className="px-4 py-1 bg-blue-500 text-white rounded-md"
                >
                  Download
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No files found.</p>
      )}
    </div>
  );
}
