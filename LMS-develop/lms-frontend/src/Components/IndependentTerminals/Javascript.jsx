import React, { useRef, useState ,useEffect } from "react";
import { Box, Button, Typography, Container } from "@mui/material";
import CodeMirror from "@uiw/react-codemirror";
import { sublime } from "@uiw/codemirror-theme-sublime";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import TerminalHeader from "./TerminalHeader";
import StudentFooter from "../Student/StudentComponents/StudentFooter";
import GeneralTerminalHeader from "./GeneralTerminalHeader";

const JavaScriptTerminal = () => {
    const [code, setCode] = useState(
        '// Try writing some code below\nconsole.log("Hello, JavaScript!");'
    );
    const [output, setOutput] = useState("");
    const outputRef = useRef(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setIsLoggedIn(true);
        }
    }, []);

    const executeCode = () => {
        let log = [];
        const originalConsoleLog = console.log;

        console.log = (...args) => {
            log.push(args.join(" "));
            originalConsoleLog(...args);
        };

        try {
            new Function(code)();
        } catch (err) {
            log.push(`Error: ${err.toString()}`);
        }

        console.log = originalConsoleLog;
        setOutput(log.join("\n"));

        outputRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
            }}
        >
           {isLoggedIn ? (
                <TerminalHeader terminalName={"Javascript"} />
            ) : (
                <GeneralTerminalHeader terminalName={"Javascript"} />
            )}
            <Container
                sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
            >
                <Box
                    sx={{
                        padding: "16px",
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <CodeMirror
                        value={code}
                        height="430px"
                        theme={sublime}
                        extensions={[loadLanguage("javascript")]}
                        onChange={(value) => setCode(value)}
                    />
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-start",
                            marginTop: "16px",
                        }}
                    >
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={executeCode}
                            sx={{ minWidth: "120px" }}
                        >
                            Run Code
                        </Button>
                    </Box>
                    <Box
                        ref={outputRef}
                        sx={{
                            marginTop: "16px",
                            flexGrow: 1,
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <Typography variant="h6">Output:</Typography>
                        <pre
                            style={{
                                whiteSpace: "pre-wrap",
                                wordWrap: "break-word",
                                backgroundColor: "#000",
                                color: "#fff",
                                padding: "10px 15px",
                                flexGrow: 1,
                                minHeight: "200px",
                            }}
                        >
                            {output}
                        </pre>
                    </Box>
                </Box>
            </Container>
            <StudentFooter />
        </Box>
    );
};

export default JavaScriptTerminal;
