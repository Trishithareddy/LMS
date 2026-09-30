import React, { useState } from "react";
import axios from "axios";

export default function DownloadReportButton({ quizId,resetSelectedQuiz, filters = {} }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token");
      const params = new URLSearchParams(filters).toString();

      const base = import.meta.env.VITE_API_URL;
      const url =
        `${base}/quiz/report/${quizId}/download/pdf` +
        (params ? `?${params}` : "");

      const resp = await axios.get(url, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });



      // resp.data is already a Blob
      const blobUrl = window.URL.createObjectURL(resp.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `quiz_report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to download report");
    }
    finally {
      setLoading(false)
      resetSelectedQuiz()
    }
  };

  return (
    <button
      onClick={handleDownload}
      className={`py-3 px-3 ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 cursor-pointer"}
       text-white rounded-lg`}
      disabled={loading}
    >
      {loading ? "Downloading..." : "Download Report"}
    </button>
  );
}