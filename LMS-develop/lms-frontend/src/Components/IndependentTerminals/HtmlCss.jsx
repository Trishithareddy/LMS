import React, { useState, useEffect, useRef } from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import CodeMirror from "@uiw/react-codemirror";
import { sublime } from "@uiw/codemirror-theme-sublime";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import TerminalHeader from "./TerminalHeader";
import StudentFooter from "../Student/StudentComponents/StudentFooter";
import GeneralTerminalHeader from "./GeneralTerminalHeader";

const HtmlTerminal = () => {
    const [htmlCode, setHtmlCode] = useState(
        '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n    <style></style>\n</head>\n<body>\n    <h1>Hello, HTML!</h1>\n    <!-- Try adding more HTML elements here -->\n</body>\n</html>'
    );
    const [cssCode, setCssCode] = useState(
        "/* Try changing the color, font size, and background color below */\nbody {\n    font-family: Arial, sans-serif;\n    background-color: #f4f4f4;\n}\n\nh1 {\n    color: #333;\n    font-size: 24px;\n}"
    );
    const [preview, setPreview] = useState("");
    const [error, setError] = useState("");
    const outputRef = useRef(null);
    
    const [isLoggedIn, setIsLoggedIn] = useState(false);
   

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setIsLoggedIn(true);
        }
    }, []);

    const executeHtml = () => {
        try {
            const combinedCode = htmlCode.replace(
                "<style></style>",
                `<style>${cssCode}</style>`
            );
            setPreview(combinedCode);
            setError("");
            outputRef.current?.scrollIntoView({ behavior: "smooth" });
        } catch (err) {
            setError(`Error: ${err.message}`);
        }
    };

    useEffect(() => {
        const combinedCode = htmlCode.replace(
            "<style></style>",
            `<style>${cssCode}</style>`
        );
        setPreview(combinedCode);
    }, [cssCode, htmlCode]);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
            }}
        >
            {isLoggedIn ? (
                <TerminalHeader terminalName={"HTML"} />
            ) : (
                <GeneralTerminalHeader terminalName={"HTML"} />
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
                        value={htmlCode}
                        height="430px"
                        theme={sublime}
                        extensions={[loadLanguage("html")]}
                        onChange={(value) => setHtmlCode(value)}
                    />
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        CSS
                    </Typography>
                    <CodeMirror
                        value={cssCode}
                        height="300px"
                        theme={sublime}
                        extensions={[loadLanguage("css")]}
                        onChange={(value) => setCssCode(value)}
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
                            onClick={executeHtml}
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
                        {error && (
                            <Typography variant="body1" color="error">
                                {error}
                            </Typography>
                        )}
                        <Box
                            sx={{
                                padding: "8px",
                                border: "1px solid #ddd",
                                borderRadius: "4px",
                                display: "flex",
                                marginTop: "8px",
                                flexGrow: 1,
                            }}
                        >
                            <iframe
                                srcDoc={preview}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    border: "none",
                                    minHeight: "300px",
                                }}
                            />
                        </Box>
                    </Box>
                </Box>
            </Container>
            <StudentFooter />
        </Box>
    );
};

export default HtmlTerminal;
