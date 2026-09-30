import { Box, Typography } from "@mui/material";
import React from "react";

function AdminFooter() {
    return (
        <Box
            component="footer"
            sx={{
                backgroundColor: "rgba(224, 224, 224, 0.7)",
                backdropFilter: "blur(5px)",
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                py: 3,
                width: "100%",
                zIndex: 1100,
            }}
        >
            <Box sx={{ maxWidth: "container", mx: "auto", color: "#07752A" }}>
                <Typography variant="body1" align="center">
                    © 2023 SUPER TEACHER. All Rights Reserved.
                </Typography>
            </Box>
        </Box>
    );
}

export default AdminFooter;
