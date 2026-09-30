import React from "react";
import { Box, Typography } from "@mui/material";

function TeacherFooter() {
    return (
        <Box
            component="footer"
            sx={{
                bgcolor: "background.paper",
                color: "text.primary",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderTop: 1,
                borderColor: "divider",
                boxShadow: 1,
                py: 2,
                width: "100%",
                mt: "auto",
                zIndex: 40,
            }}
        >
            <Box sx={{ mx: "auto" }}>
                <Typography
                    variant="body2"
                    align="center"
                    sx={{
                        color: "primary.main",
                        fontWeight: 600,
                    }}
                >
                    © 2024 SUPER TEACHER. All Rights Reserved.
                </Typography>
            </Box>
        </Box>
    );
}

export default TeacherFooter;