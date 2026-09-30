import CloudPdfViewer from "@cloudpdf/viewer";
import { Box } from "@mui/material";
import React, { useEffect, useRef } from "react";

function WorksheetKeys({ worksheetUrl }) {
    const viewer = useRef(null);

    useEffect(() => {
        if (worksheetUrl) {
            CloudPdfViewer(
                {
                    documentId: worksheetUrl,
                    darkMode: true,
                },
                viewer.current
            ).then((instance) => {
                console.log("CloudPdfViewer instance created successfully");
            }).catch((error) => {
                console.error("Error creating CloudPdfViewer instance:", error);
            });
        }
    }, [worksheetUrl]);



    if (!worksheetUrl) {
        return (
            <Box sx={{ padding: "20px", textAlign: "center" }}>
                No worksheet available for this chapter.
            </Box>
        );
    }

    return (
        <Box
            sx={{
                width: "80%",
                margin: "0 auto",
                padding: "20px",
                boxSizing: "border-box",
                backgroundColor: "#ffffff",
                height: "80vh",
                "@media (max-width: 600px)": {
                    width: "100%",
                },
            }}
        >
            <Box sx={{ height: "100%" }} ref={viewer}></Box>
        </Box>
    );
}

export default WorksheetKeys;