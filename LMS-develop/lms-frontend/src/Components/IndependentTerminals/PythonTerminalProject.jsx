
import React, { useState } from "react";
import { Box, Button, Container, Snackbar, Alert } from "@mui/material";
import { useOutletContext } from "react-router-dom";
import PythonLabPanel from "./PythonLabPanel";

const STARTER_CODE = `message = "Hello Maam"
print(message)`;

const PythonTerminalProject = () => {
    const [code, setCode] = useState(STARTER_CODE);
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const { studentName } = useOutletContext();


    const handleSubmit = () => {
        setOpenSnackbar(true);
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === "clickaway") {
            return;
        }
        setOpenSnackbar(false);
    };

    const shouldShowSubmitButton =
        studentName === "Gaurav Pendekar" || studentName === "Arjun";

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
            }}
        >
            <Container
                sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
            >
                <Box sx={{ py: 2, flexGrow: 1 }}>
                    <PythonLabPanel
                        code={code}
                        onCodeChange={setCode}
                        starterCode={STARTER_CODE}
                        title="Python Project Lab"
                        height="430px"
                        extraActions={
                            shouldShowSubmitButton ? (
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={handleSubmit}
                                >
                                    Submit Project
                                </Button>
                            ) : null
                        }
                    />
                </Box>
            </Container>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={2000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                sx={{ marginTop: "24px" }} // Add some top margin to avoid colliding with any top bars
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity="success"
                    sx={{ width: "100%" }}
                >
                    Project saved successfully!
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default PythonTerminalProject;
