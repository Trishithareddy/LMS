import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Divider,
    Paper,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    ContentCopy,
    DeleteOutline,
    Download,
    PlayArrow,
    RestartAlt,
    TextIncrease,
    TextDecrease,
} from "@mui/icons-material";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { sublime } from "@uiw/codemirror-theme-sublime";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import {
    formatPythonOutputHtml,
    getPyodideInstance,
    runPythonCode,
} from "./pythonRunner";
import { useTheme } from "@mui/material/styles";

const FONT_MIN = 12;
const FONT_MAX = 30;
const FONT_STEP = 2;
const FONT_DEFAULT = 14;

const PythonLabPanel = ({
    code,
    onCodeChange,
    starterCode,
    title = "Python Lab",
    showReset = true,
    showDownload = true,
    height = "540px",
    extraActions = null,
    editable = true,
}) => {
    const [output, setOutput] = useState("");
    const [rawOutput, setRawOutput] = useState("");
    const [hasError, setHasError] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [pyodide, setPyodide] = useState(null);
    const [fontSize, setFontSize] = useState(FONT_DEFAULT);
    const outputRef = useRef(null);
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const actionButtonStyle = {
        color: "text.primary",
        borderColor: "success.main",

        "& .MuiButton-startIcon": {
            color: "inherit",
        },

        "& .MuiSvgIcon-root": {
            color: "inherit",
        },

        "&:hover": {
            borderColor: "success.dark",
            backgroundColor: "action.hover",
        },

        "&.Mui-disabled": {
            color: "text.disabled",
            borderColor: "divider",
        },
    };

    const fontSizeTheme = useMemo(
        () =>
            EditorView.theme({
                "&": { fontSize: `${fontSize}px` },
                ".cm-gutters": { fontSize: `${fontSize}px` },
            }),
        [fontSize]
    );

    const increaseFont = () =>
        setFontSize((f) => Math.min(f + FONT_STEP, FONT_MAX));
    const decreaseFont = () =>
        setFontSize((f) => Math.max(f - FONT_STEP, FONT_MIN));

    useEffect(() => {
        let mounted = true;

        const loadPyodide = async () => {
            try {
                const pyodideInstance = await getPyodideInstance();
                if (mounted) setPyodide(pyodideInstance);
            } catch (error) {
                if (!mounted) return;
                setHasError(true);
                setRawOutput(String(error));
                setOutput(formatPythonOutputHtml(String(error)));
            }
        };

        loadPyodide();

        return () => {
            mounted = false;
        };
    }, []);

    const executeCode = async () => {
        if (!pyodide) {
            setHasError(true);
            setRawOutput("Python engine is still loading. Please try again.");
            setOutput("Python engine is still loading. Please try again.");
            return;
        }

        try {
            setIsRunning(true);
            setHasError(false);
            const result = await runPythonCode(pyodide, code);
            setRawOutput(result);
            setOutput(formatPythonOutputHtml(result));
            outputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        } catch (err) {
            setHasError(true);
            setRawOutput(err.toString());
            setOutput(formatPythonOutputHtml(err.toString()));
            outputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        } finally {
            setIsRunning(false);
        }
    };

    const clearOutput = () => {
        setOutput("");
        setRawOutput("");
        setHasError(false);
    };

    const resetCode = () => {
        onCodeChange(starterCode || "");
        clearOutput();
    };

    const copyCode = async () => {
        await navigator.clipboard.writeText(code || "");
    };

    const copyOutput = async () => {
        await navigator.clipboard.writeText(rawOutput || "");
    };

    const downloadCode = () => {
        const blob = new Blob([code || ""], { type: "text/x-python" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "python_lab_code.py";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <Paper
            elevation={0}
            sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "background.paper",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: { xs: "flex-start", md: "center" },
                    gap: 2,
                    p: 2,
                    flexDirection: { xs: "column", md: "row" },
                }}
            >
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {title}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                    <Button
                        variant="contained"
                        sx={{
                            bgcolor: "#16a34a",
                            "&:hover": {
                                bgcolor: "#15803d",
                            },
                        }}
                        startIcon={<PlayArrow />}
                        onClick={executeCode}
                        disabled={isRunning || !pyodide}
                    >
                        {isRunning ? "Running..." : "Run"}
                    </Button>

                    {/* Font size controls — affects editor + output together */}
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.5}
                        sx={{
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.paper",
                            borderRadius: 1,
                            px: 0.5,
                        }}
                    >
                        <Tooltip title="Decrease font size">
                            <span>
                                <Button
                                    size="small"
                                    sx={{
                                        color: "text.primary",
                                        minWidth: 32,
                                    }}
                                    onClick={decreaseFont}
                                >
                                    <TextDecrease fontSize="small" />
                                </Button>
                            </span>
                        </Tooltip>
                        <Typography
                            variant="caption"
                            sx={{ width: 28, textAlign: "center", fontWeight: 600 }}
                        >
                            {fontSize}
                        </Typography>
                        <Tooltip title="Increase font size">
                            <span>
                                <Button
                                    size="small"
                                    sx={{
                                        color: "text.primary",
                                        minWidth: 32,
                                    }}
                                    onClick={increaseFont}
                                >
                                    <TextIncrease fontSize="small" />
                                </Button>
                            </span>
                        </Tooltip>
                    </Stack>

                    <Tooltip title="Clear output">
                        <span>
                            <Button
                                variant="outlined"
                                sx={actionButtonStyle}
                                startIcon={<DeleteOutline />}
                                onClick={clearOutput}
                                disabled={!output}
                            >
                                Clear
                            </Button>
                        </span>
                    </Tooltip>
                    {showReset && (
                        <Button
                            variant="outlined"
                            sx={actionButtonStyle}
                            startIcon={<RestartAlt />}
                            onClick={resetCode}
                        >
                            Reset
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        sx={actionButtonStyle}
                        startIcon={<ContentCopy />}
                        onClick={copyCode}
                    >
                        Copy Code
                    </Button>
                    {showDownload && (
                        <Button
                            variant="outlined"
                            sx={actionButtonStyle}
                            startIcon={<Download />}
                            onClick={downloadCode}
                        >
                            Download
                        </Button>
                    )}
                    {extraActions}
                </Stack>
            </Box>

            <Divider />

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        lg: "minmax(0, 1.08fr) minmax(360px, 0.92fr)",
                    },
                    alignItems: "stretch",
                }}
            >
                <Box
                    sx={{
                        p: 2,
                        borderRight: {
                            lg: "1px solid",
                        },
                        borderColor: "divider",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <Box
                        sx={{
                            minHeight: 40,
                            display: "flex",
                            alignItems: "center",
                            mb: 1,
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
                            Code Editor
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            borderRadius: 1.5,
                            overflow: "hidden",
                            border: "1px solid",
                            borderColor: isDark ? "#4b5563" : "#263340",
                            height,
                            "& .cm-editor": {
                                height: "100%",
                            },
                        }}
                    >
                        <CodeMirror
                            value={code}
                            height={height}
                            theme={sublime}
                            extensions={[loadLanguage("python"), fontSizeTheme]}
                            onChange={(value) => onCodeChange(value)}
                            editable={editable}
                            basicSetup={{
                                lineNumbers: true,
                                highlightActiveLineGutter: editable,
                                highlightActiveLine: editable,
                                dropCursor: editable,
                            }}
                        />
                    </Box>
                </Box>

                <Box
                    ref={outputRef}
                    sx={{
                        p: 2,
                        bgcolor: "background.default",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 1,
                            minHeight: 40,
                            mb: 1,
                        }}
                    >
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 700,
                                color: "text.primary",
                            }}
                        >
                            Output
                        </Typography>
                        <Button
                            size="small"
                            variant="outlined"
                            sx={actionButtonStyle}
                            startIcon={<ContentCopy />}
                            onClick={copyOutput}
                            disabled={!rawOutput}
                        >
                            Copy Output
                        </Button>
                    </Box>

                    {!pyodide && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Loading Python engine. First load can take a few seconds.
                        </Alert>
                    )}

                    {hasError && output && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            The program stopped with an error. Check the traceback below.
                        </Alert>
                    )}

                    <Box
                        sx={{
                            height,
                            borderRadius: 1.5,
                            overflow: "auto",
                            backgroundColor: hasError
                                ? (isDark ? "#2b1212" : "#210b0b")
                                : "#050505",

                            border: "1px solid",

                            borderColor: hasError
                                ? "#ef9a9a"
                                : isDark
                                    ? "#4b5563"
                                    : "#111",

                        }}
                    >
                        {output ? (
                            <pre
                                style={{
                                    whiteSpace: "pre-wrap",
                                    wordWrap: "break-word",
                                    color: hasError ? "#fecaca" : "#fff",
                                    padding: "16px",
                                    margin: 0,
                                    minHeight: "100%",
                                    fontSize: `${fontSize}px`,
                                    lineHeight: 1.6,
                                }}
                                dangerouslySetInnerHTML={{ __html: output }}
                            />
                        ) : (
                            <Box
                                sx={{
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "text.secondary",
                                    textAlign: "center",
                                    p: 3,
                                }}
                            >
                                <Typography>
                                    Run your code to see console, chart, or turtle output here.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
        </Paper>
    );
};

export default PythonLabPanel;