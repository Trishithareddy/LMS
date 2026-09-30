import React, { useEffect, useState } from "react";
import { Box, Container } from "@mui/material";
import TerminalHeader from "./TerminalHeader";
import StudentFooter from "../Student/StudentComponents/StudentFooter";
import GeneralTerminalHeader from "./GeneralTerminalHeader";
import PythonLabPanel from "./PythonLabPanel";

const STARTER_CODE = '# Try writing some code below\nprint("Hello, Python!")';

const  PythonTerminal = () => {
    const [code, setCode] = useState(STARTER_CODE);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setIsLoggedIn(Boolean(localStorage.getItem("token")));
    }, []);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            {isLoggedIn ? (
                <TerminalHeader terminalName="Python" />
            ) : (
                <GeneralTerminalHeader terminalName="Python" />
            )}
            <Container
                maxWidth={false}
                sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    px: { xs: 2, md: 4 },
                    py: 3,
                    backgroundColor: "#f6f8f7",
                }}
            >
                <PythonLabPanel
                    code={code}
                    onCodeChange={setCode}
                    starterCode={STARTER_CODE}
                    title="Python Lab"
                />
            </Container>
            <StudentFooter />
        </Box>
    );
};

export default PythonTerminal;
