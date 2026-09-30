import CloudPdfViewer from "@cloudpdf/viewer";
import { Box, Typography } from "@mui/material";
import React, { useEffect, useRef } from "react";

function WorksheetKeys({ worksheet }) {
    const viewer = useRef(null);

    useEffect(() => {
        

        if (!worksheet) {
            console.error("No worksheetUrl provided");
            return;
        }

        CloudPdfViewer(
            {
                documentId: worksheet,
                darkMode: true,
            },
            viewer.current
        ).then((instance) => {
            console.log("CloudPdfViewer instance created successfully");
        }).catch((error) => {
            console.error("Error creating CloudPdfViewer instance:", error);
        });
    }, [worksheet]);

    if (!worksheet) {
        return (
            <Box sx={{ padding: "20px", textAlign: "center" }}>
                <Typography>No worksheet available for this chapter.</Typography>
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