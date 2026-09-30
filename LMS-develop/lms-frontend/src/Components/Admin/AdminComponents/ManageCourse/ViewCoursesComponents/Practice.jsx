import { Box, Button, Container, MenuItem, Select, Typography } from "@mui/material";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import { sublime } from "@uiw/codemirror-theme-sublime";
import CodeMirror from "@uiw/react-codemirror";
import React, { useEffect, useState } from "react";


const Practice = () => {
    const [code, setCode] = useState(
        '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n    <style></style>\n</head>\n<body>\n    <h1>Hello, HTML!</h1>\n    <!-- Try adding more HTML elements here -->\n</body>\n</html>'
    );
    const [cssCode, setCssCode] = useState(
        "/* Try changing the color, font size, and background color below */\nbody {\n    font-family: Arial, sans-serif;\n    background-color: #f4f4f4;\n}\n\nh1 {\n    color: #333;\n    font-size: 24px;\n}"
    );

    const [output, setOutput] = useState("");
    const [language, setLanguage] = useState("html");
    const [preview, setPreview] = useState("");
    const [pyodide, setPyodide] = useState(null);

    useEffect(() => {
        const loadPyodide = async () => {
            const pyodideInstance = await window.languagePluginLoader;
            setPyodide(pyodideInstance);
        };
        loadPyodide();
    }, []);

    const handleLanguageChange = (event) => {
        const lang = event.target.value;
        setLanguage(lang);
        setCode(
            {
                javascript:
                    '// Try writing some code below\nconsole.log("Hello, JavaScript!");',
                html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n    <style></style>\n</head>\n<body>\n    <h1>Hello, HTML!</h1>\n    <!-- Try adding more HTML elements here -->\n</body>\n</html>',
                python: '# Try writing some code below\nprint("Hello, Python!")',
            }[lang]
        );
    };

    const executeCode = async () => {
        try {
            if (language === "javascript") {
                let result;
                const log = [];
                const originalConsoleLog = console.log;

                // Override console.log to capture logs
                console.log = (...args) => {
                    log.push(args.join(" "));
                    originalConsoleLog(...args);
                };

                try {
                    result = new Function(`
                        ${code}
                        return;
                    `)();
                } catch (err) {
                    result = err.toString();
                }

                // Restore the original console.log
                console.log = originalConsoleLog;

                // Set the output
                setOutput(log.join("\n") || result);
            } else if (language === "html") {
                const combinedCode = code.replace(
                    "<style></style>",
                    `<style>${cssCode}</style>`
                );
                setPreview(combinedCode);
            } else if (language === "python") {
                if (pyodide) {
                    try {
                        await pyodide.loadPackage("micropip");

                        // Redirect stdout to capture print statements
                        pyodide.runPython(`
                            import sys
                            from io import StringIO
                            sys.stdout = sys.stderr = StringIO()
                        `);

                        await pyodide.runPythonAsync(code);

                        const result = pyodide.runPython(
                            "sys.stdout.getvalue()"
                        );
                        // Replace special characters and render as HTML
                        const formattedResult = result
                            .replace(/\n/g, "<br>")
                            .replace(/ /g, "&nbsp;");
                        setOutput(formattedResult);
                    } catch (err) {
                        setOutput(err.toString());
                    }
                } else {
                    setOutput("Pyodide is not loaded");
                }
            }
        } catch (err) {
            setOutput(err.toString());
        }
    };

    useEffect(() => {
        if (language === "html") {
            const combinedCode = code.replace(
                "<style></style>",
                `<style>${cssCode}</style>`
            );
            setPreview(combinedCode);
        }
    }, [cssCode, code, language]);

    return (
       <Container>
             <Box sx={{ padding: "16px" }}>
            <Typography variant="h6" gutterBottom>
                Happy Coding!
            </Typography>
            <Select
                value={language}
                onChange={handleLanguageChange}
                sx={{ width: "200px", mb: "7px", height: "25px" }}
            >
                <MenuItem value="javascript">JavaScript</MenuItem>
                <MenuItem value="html">HTML</MenuItem>
                <MenuItem value="python">Python</MenuItem>
            </Select>
            <CodeMirror
                value={code}
                height="300px"
                theme={sublime}
                extensions={[loadLanguage(language)]}
                onChange={(value) => setCode(value)}
            />
            {language === "html" && (
                <>
                    <Typography variant="h6" gutterBottom>
                        CSS
                    </Typography>
                    <CodeMirror
                        value={cssCode}
                        height="300px"
                        theme={sublime}
                        extensions={[loadLanguage("css")]}
                        onChange={(value) => setCssCode(value)}
                    />
                </>
            )}
            <Box sx={{ marginTop: "16px" }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={executeCode}
                >
                    Run Code
                </Button>
            </Box>
            <Box sx={{ marginTop: "16px" }}>
                <Typography variant="h6">Output:</Typography>
                <Box
                    sx={{
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        display: "flex",
                    }}
                >
                    {language === "html" ? (
                        <iframe
                            srcDoc={preview}
                            style={{
                                width: "100%",
                                height: "300px",
                                border: "none",
                            }}
                        />
                    ) : (
                        <pre
                            style={{
                                whiteSpace: "pre-wrap",
                                wordWrap: "break-word",
                                width: "100%",
                                height: "100%",
                                border: "none",
                                color: "#ffff",
                                backgroundColor: "black",
                                padding: "10px 15px",
                            }}
                            dangerouslySetInnerHTML={{ __html: output }}
                        />
                    )}
                </Box>
            </Box>
        </Box>
       </Container>
    );
};

export default Practice;
