import CloudPdfViewer from "@cloudpdf/viewer";
import { Box, Typography } from "@mui/material";
import React, { useEffect, useRef } from "react";

function Ebook({ ebookUrl }) {
    const viewer = useRef(null);
    const viewerInstance = useRef(null);

    useEffect(() => {
        let isMounted = true;

        const initializeViewer = async () => {
          

            if (!ebookUrl) {
                console.error("No ebookUrl provided");
                return;
            }

            try {
                // Store the instance in the ref
                viewerInstance.current = await CloudPdfViewer(
                    {
                        documentId: ebookUrl, // Make sure this matches your document ID format
                        darkMode: false,
                        enableDownload: false,
                        enablePrinting: true,
                        enableChat: true,
                    },
                    viewer.current
                );

       
            } catch (error) {
                console.error("Error creating CloudPdfViewer instance:", error);
            }
        };

        if (ebookUrl) {
            initializeViewer();
        }

        // Cleanup function
        return () => {
            isMounted = false;
            if (viewerInstance.current) {
                try {
                    viewerInstance.current.destroy();
                    viewerInstance.current = null;
                } catch (error) {
                    console.error("Error destroying viewer instance:", error);
                }
            }
        };
    }, [ebookUrl]);

    if (!ebookUrl) {
        return (
            <Box sx={{ padding: "20px", textAlign: "center" }}>
                <Typography>No e-book available for this chapter.</Typography>
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

export default Ebook;
