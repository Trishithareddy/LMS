import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useNavigate } from "react-router-dom";

function GeneralTerminalHeader({ terminalName }) {
    const navigate = useNavigate();

    return (
        <>
            <AppBar
                position="fixed"
                sx={{
                    backgroundColor: "rgba(224, 224, 224, 0.7)",
                    backdropFilter: "blur(5px)",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                    transition: "top 0.3s ease",
                    width: "100%",
                    zIndex: 1100,
                }}
            >
                <Container
                    maxWidth={false}
                    sx={{ paddingLeft: 0, paddingRight: 0 }}
                >
                    <Toolbar disableGutters>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                flexGrow: 1,
                            }}
                        >
                            <Button
                                startIcon={<ArrowBackRoundedIcon />}
                                onClick={() => navigate("/")}
                                sx={{
                                    mr: 1,
                                    minWidth: "unset",
                                    color: "#14532d",
                                    textTransform: "none",
                                    fontWeight: 700,
                                }}
                            >
                                Home
                            </Button>
                            <img
                                src="/SuperTeacher_Logo_new_2.png"
                                alt="Logo"
                                style={{
                                    height: "40px",
                                    width: "auto",
                                    marginRight: "16px",
                                }}
                            />

                            <Typography
                                variant="h6"
                                noWrap
                                component="div"
                                sx={{
                                    color: "#07752A",
                                    flexGrow: 1,
                                    textAlign: "center",
                                    // display: { xs: "none", sm: "block" },
                                }}
                            >
                                {terminalName}
                            </Typography>
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Ensure content doesn't hide behind the header */}
            <Box sx={{ marginTop: "64px" }}>{/* Page content goes here */}</Box>
        </>
    );
}

export default GeneralTerminalHeader;
