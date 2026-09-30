import React, { useRef, useEffect } from "react";
import { Box } from "@mui/material";
import CloudPdfViewer from "@cloudpdf/viewer";

function Ebook({ ebookUrl }) {
    const viewerRef = useRef(null);

    useEffect(() => {
        if (!ebookUrl) return;

        const container = viewerRef.current;
        if (!container) return;

        let instance;

        const initViewer = async () => {
            instance = await CloudPdfViewer(
                {
                    documentId: ebookUrl,
                    darkMode: true,
                },
                container
            );
        };

        initViewer();

        return () => {
            if (instance && instance.destroy) {
                instance.destroy();
            }
        };
    }, [ebookUrl]);

    return (
        <div className="h-screen mt-4 w-[80%] mx-auto">
            <div ref={viewerRef} className="h-full mx-auto" />
        </div>
    );
}

export default Ebook;
