import React, { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    FormControl,
    FormControlLabel,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Switch,
    Tab,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
    BorderStyle,
} from "docx";
import { saveAs } from "file-saver";

const AiraLessonPlanGenerator = () => {
    const [activeTab, setActiveTab] = useState(0);

    const [courses, setCourses] = useState([]);
    const [chapters, setChapters] = useState([]);

    const [selectedCourse, setSelectedCourse] = useState("");
    const [selectedChapter, setSelectedChapter] = useState("");

    const [grade, setGrade] = useState("");
    const [lessonNo, setLessonNo] = useState("");
    const [lessonName, setLessonName] = useState("");
    const [numberOfSessions, setNumberOfSessions] = useState(2);
    const [durationPerSession, setDurationPerSession] = useState("40 minutes");
    const [teachingStyle, setTeachingStyle] = useState("Activity-based");
    const [includeHomework, setIncludeHomework] = useState(true);
    const [includeAssessment, setIncludeAssessment] = useState(true);

    const [templateFile, setTemplateFile] = useState(null);

    const [loading, setLoading] = useState(false);
    const [lessonPlan, setLessonPlan] = useState("");
    const [references, setReferences] = useState([]);
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState("");

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const apiUrl = import.meta.env.VITE_API_URL;

    const getAuthHeaders = () => {
        const token =
            localStorage.getItem("token") ||
            localStorage.getItem("authToken") ||
            localStorage.getItem("teacherToken");

        return token ? { Authorization: `Bearer ${token}` } : {};
    };


    useEffect(() => {
        if (selectedCourse) {
            fetchChapters(selectedCourse);
        } else {
            setChapters([]);
        }
    }, [selectedCourse]);

    const showSnackbar = (message, severity = "success") => {
        setSnackbar({
            open: true,
            message,
            severity,
        });
    };

    const normalizeArrayResponse = (data, possibleKeys = []) => {
        if (Array.isArray(data)) return data;

        for (const key of possibleKeys) {
            if (Array.isArray(data?.[key])) {
                return data[key];
            }
        }

        return [];
    };

    const fetchCourses = async () => {
        try {
            const allCourses = [];
            let page = 1;
            let totalPages = 1;

            do {
                const response = await axios.get(
                    `${apiUrl}/courses/getAllCourses?page=${page}&limit=100`,
                    {
                        headers: getAuthHeaders(),
                    },
                );

                const coursesArray = Array.isArray(response.data)
                    ? response.data
                    : Array.isArray(response.data?.data)
                        ? response.data.data
                        : Array.isArray(response.data?.courses)
                            ? response.data.courses
                            : Array.isArray(response.data?.allCourses)
                                ? response.data.allCourses
                                : [];

                allCourses.push(...coursesArray);

                totalPages =
                    response.data?.pagination?.totalPages ||
                    response.data?.totalPages ||
                    1;

                page++;
            } while (page <= totalPages);

            setCourses(allCourses);
        } catch (error) {
            console.error("Error fetching courses:", error);

            showSnackbar(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Failed to fetch courses",
                "error",
            );

            setCourses([]);
        }
    };

    const fetchAllBatchesData = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/teacher/get/AllBatches`,
                {
                    headers: getAuthHeaders(),
                },
            );
            console.log("Fetched batches data:", response.data);
            const setAllBatch = response.data?.teacher?.batches || [];
            setBatches(setAllBatch || []);
        } catch (error) {
            console.error("Error fetching batches:", error);
            handleSnackbarOpen("Error fetching data", "error");
        }
    };

    useEffect(() => {
        fetchAllBatchesData();
    }, []);

    const fetchChapters = async (courseId) => {
        try {
            const response = await axios.get(
                `${apiUrl}/chapters/by-course?courseId=${courseId}`,
                {
                    headers: getAuthHeaders(),
                },
            );

            const chaptersArray = normalizeArrayResponse(response.data, [
                "chapters",
                "data",
                "allChapters",
                "chapter",
                "result",
                "results",
            ]);

            setChapters(chaptersArray);
        } catch (error) {
            console.error("Error fetching chapters:", error);

            showSnackbar(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Failed to fetch chapters",
                "error",
            );

            setChapters([]);
        }
    };

    const validateCommonFields = () => {
        if (!selectedCourse) {
            showSnackbar("Please select a course", "warning");
            return false;
        }

        if (!selectedChapter) {
            showSnackbar("Please select a chapter", "warning");
            return false;
        }

        return true;
    };

    const handleGenerateStandard = async () => {
        if (!validateCommonFields()) return;

        try {
            setLoading(true);
            setLessonPlan("");
            setReferences([]);

            const response = await axios.post(
                `${apiUrl}/chapters/aira/lesson-plan`,
                {
                    chapterId: selectedChapter,
                    grade,
                    lessonNo,
                    lessonName,
                    numberOfSessions,
                    durationPerSession,
                    teachingStyle,
                    includeHomework,
                    includeAssessment,
                },
                {
                    headers: getAuthHeaders(),
                },
            );

            setLessonPlan(response.data.lessonPlan || "");
            setReferences(response.data.references || []);

            showSnackbar("Lesson plan generated successfully", "success");
        } catch (error) {
            console.error("Error generating lesson plan:", error);

            showSnackbar(
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Failed to generate lesson plan",
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCustom = async () => {
        if (!validateCommonFields()) return;

        if (!templateFile) {
            showSnackbar("Please upload school lesson plan format", "warning");
            return;
        }

        try {
            setLoading(true);
            setLessonPlan("");
            setReferences([]);

            const formData = new FormData();

            formData.append("templateFile", templateFile);
            formData.append("chapterId", selectedChapter);
            formData.append("grade", grade);
            formData.append("lessonNo", lessonNo);
            formData.append("lessonName", lessonName);
            formData.append("numberOfSessions", numberOfSessions);
            formData.append("durationPerSession", durationPerSession);
            formData.append("teachingStyle", teachingStyle);
            formData.append("includeHomework", includeHomework);
            formData.append("includeAssessment", includeAssessment);

            const response = await axios.post(
                `${apiUrl}/chapters/aira/lesson-plan/custom-format`,
                formData,
                {
                    headers: {
                        ...getAuthHeaders(),
                        "Content-Type": "multipart/form-data",
                    },
                },
            );

            setLessonPlan(response.data.lessonPlan || "");
            setReferences(response.data.references || []);

            showSnackbar(
                "Custom format lesson plan generated successfully",
                "success",
            );
        } catch (error) {
            console.error("Error generating custom lesson plan:", error);

            showSnackbar(
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Failed to generate custom lesson plan",
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (!lessonPlan) return;

        try {
            await navigator.clipboard.writeText(lessonPlan);
            showSnackbar("Lesson plan copied", "success");
        } catch (error) {
            showSnackbar("Could not copy lesson plan", "error");
        }
    };

    const cleanMarkdownText = (text) => {
        return String(text || "")
            .replace(/\*\*/g, "")
            .replace(/\*/g, "")
            .replace(/__/g, "")
            .replace(/_/g, "")
            .replace(/`/g, "")
            .replace(/<br\s*\/?>/gi, "\n")
            .trim();
    };

    const isMarkdownTableLine = (line = "") => {
        const text = String(line || "").trim();
        return text.startsWith("|") && text.endsWith("|");
    };

    const isMarkdownTableSeparator = (line = "") => {
        return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
    };

    const splitMarkdownTableRow = (line = "") => {
        return String(line || "")
            .trim()
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((cell) => cleanMarkdownText(cell.trim()));
    };

    const createTextParagraph = (text, options = {}) => {
        return new Paragraph({
            children: [
                new TextRun({
                    text: cleanMarkdownText(text),
                    bold: options.bold || false,
                    size: options.size || 22,
                }),
            ],
            spacing: {
                before: options.before || 0,
                after: options.after || 120,
                line: 276,
            },
            alignment: options.alignment || AlignmentType.LEFT,
        });
    };

    const createTableCell = (text, isHeader = false) => {
        return new TableCell({
            width: {
                size: 100 / 4,
                type: WidthType.PERCENTAGE,
            },
            margins: {
                top: 120,
                bottom: 120,
                left: 120,
                right: 120,
            },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
            },
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: cleanMarkdownText(text),
                            bold: isHeader,
                            size: 20,
                        }),
                    ],
                    spacing: {
                        after: 80,
                    },
                }),
            ],
            shading: isHeader
                ? {
                    fill: "EAF4EA",
                }
                : undefined,
        });
    };

    const createDocxTable = (tableLines = []) => {
        const usefulLines = tableLines.filter(
            (line) =>
                isMarkdownTableLine(line) && !isMarkdownTableSeparator(line),
        );

        const rows = usefulLines.map((line, rowIndex) => {
            const cells = splitMarkdownTableRow(line);

            return new TableRow({
                children: cells.map((cell) =>
                    createTableCell(cell, rowIndex === 0),
                ),
            });
        });

        return new Table({
            width: {
                size: 100,
                type: WidthType.PERCENTAGE,
            },
            rows,
        });
    };

    const markdownToDocxParagraphs = (markdownText) => {
        const blocks = [];
        const lines = String(markdownText || "").split("\n");

        let i = 0;

        while (i < lines.length) {
            const rawLine = lines[i];
            const text = rawLine.trim();

            if (!text) {
                blocks.push(new Paragraph(""));
                i++;
                continue;
            }

            if (text === "---" || text === "***" || text === "___") {
                blocks.push(new Paragraph(""));
                i++;
                continue;
            }

            if (isMarkdownTableLine(text)) {
                const tableLines = [];

                while (
                    i < lines.length &&
                    isMarkdownTableLine(lines[i].trim())
                ) {
                    tableLines.push(lines[i].trim());
                    i++;
                }

                blocks.push(createDocxTable(tableLines));
                blocks.push(new Paragraph(""));
                continue;
            }

            if (text.startsWith("# ")) {
                blocks.push(
                    new Paragraph({
                        text: cleanMarkdownText(text.replace(/^#\s+/, "")),
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 200, after: 160 },
                    }),
                );
                i++;
                continue;
            }

            if (text.startsWith("## ")) {
                blocks.push(
                    new Paragraph({
                        text: cleanMarkdownText(text.replace(/^##\s+/, "")),
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 200, after: 140 },
                    }),
                );
                i++;
                continue;
            }

            if (text.startsWith("### ")) {
                blocks.push(
                    new Paragraph({
                        text: cleanMarkdownText(text.replace(/^###\s+/, "")),
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 160, after: 120 },
                    }),
                );
                i++;
                continue;
            }

            if (/^[-*●]\s+/.test(text)) {
                blocks.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: cleanMarkdownText(
                                    text.replace(/^[-*●]\s+/, ""),
                                ),
                                size: 22,
                            }),
                        ],
                        bullet: { level: 0 },
                        spacing: { after: 90 },
                    }),
                );
                i++;
                continue;
            }

            if (/^\d+\.\s+/.test(text)) {
                blocks.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: cleanMarkdownText(
                                    text.replace(/^\d+\.\s+/, ""),
                                ),
                                size: 22,
                            }),
                        ],
                        numbering: {
                            reference: "numbered-list",
                            level: 0,
                        },
                        spacing: { after: 90 },
                    }),
                );
                i++;
                continue;
            }

            if (text.includes(":") && text.length < 120) {
                const [label, ...rest] = text.split(":");
                const value = rest.join(":").trim();

                blocks.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${cleanMarkdownText(label)}: `,
                                bold: true,
                                size: 22,
                            }),
                            new TextRun({
                                text: cleanMarkdownText(value),
                                size: 22,
                            }),
                        ],
                        spacing: {
                            after: 100,
                        },
                    }),
                );

                i++;
                continue;
            }

            blocks.push(createTextParagraph(text));
            i++;
        }

        return blocks;
    };

    const downloadWord = async () => {
        if (!lessonPlan) return;

        const safeLessonName =
            lessonName?.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "chapter";

        const title =
            activeTab === 0
                ? "AIRA Lesson Plan"
                : "AIRA Custom School Format Lesson Plan";

        const doc = new Document({
            numbering: {
                config: [
                    {
                        reference: "numbered-list",
                        levels: [
                            {
                                level: 0,
                                format: "decimal",
                                text: "%1.",
                                alignment: "left",
                            },
                        ],
                    },
                ],
            },
            sections: [
                {
                    properties: {
                        page: {
                            margin: {
                                top: 900,
                                right: 900,
                                bottom: 900,
                                left: 900,
                            },
                        },
                    },
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: title,
                                    bold: true,
                                    size: 34,
                                }),
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: {
                                after: 300,
                            },
                        }),

                        new Table({
                            width: {
                                size: 100,
                                type: WidthType.PERCENTAGE,
                            },
                            rows: [
                                new TableRow({
                                    children: [
                                        createTableCell("Grade", true),
                                        createTableCell(
                                            grade || "Not specified",
                                        ),
                                        createTableCell("Lesson No.", true),
                                        createTableCell(
                                            lessonNo || "Not specified",
                                        ),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        createTableCell("Lesson Name", true),
                                        createTableCell(
                                            lessonName || "Selected Chapter",
                                        ),
                                        createTableCell("Sessions", true),
                                        createTableCell(
                                            String(numberOfSessions || ""),
                                        ),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        createTableCell("Duration", true),
                                        createTableCell(
                                            durationPerSession || "",
                                        ),
                                        createTableCell("Teaching Style", true),
                                        createTableCell(teachingStyle || ""),
                                    ],
                                }),
                            ],
                        }),

                        new Paragraph(""),

                        ...markdownToDocxParagraphs(lessonPlan),
                    ],
                },
            ],
        });

        const blob = await Packer.toBlob(doc);

        const fileName =
            activeTab === 0
                ? `AIRA_Lesson_Plan_${safeLessonName}.docx`
                : `AIRA_Custom_Format_Lesson_Plan_${safeLessonName}.docx`;

        saveAs(blob, fileName);
    };

    const handleCourseChange = (courseId) => {
        setSelectedCourse(courseId);
        setSelectedChapter("");
        setLessonName("");
        setLessonPlan("");
        setReferences([]);
    };

    const handleChapterChange = (chapterId) => {
        setSelectedChapter(chapterId);
        setLessonPlan("");
        setReferences([]);

        const chapter = Array.isArray(chapters)
            ? chapters.find((c) => c._id === chapterId)
            : null;

        if (chapter) {
            setLessonName(chapter.name || chapter.chapterName || "");
        }
    };

    const handleBatchChange = (batch) => {
        setSelectedBatch(batch);
        const selected = batches.find((b) => b._id === batch);

        if (selected) {
            setCourses(selected.courses || []);
        } else {
            setCourses([]);
        }
    };

    console.log("Batches data in component:", selectedBatch);


    const renderCommonFields = () => {
        return (
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>Batch</InputLabel>
                        <Select
                            value={selectedBatch || ""}
                            label="Batch"
                            onChange={(e) => handleBatchChange(e.target.value)}
                        >
                            {Array.isArray(batches) && batches.length > 0 ? (
                                batches.map((batch) => (
                                    <MenuItem
                                        key={batch._id}
                                        value={batch._id}
                                    >
                                        {batch.batchName || "Untitled Batch"}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem value="" disabled>
                                    No batch found
                                </MenuItem>
                            )}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>Course</InputLabel>
                        <Select
                            value={selectedCourse || ""}
                            label="Course"
                            onChange={(e) => handleCourseChange(e.target.value)}
                        >
                            {Array.isArray(courses) && courses.length > 0 ? (
                                courses.map((course) => (
                                    <MenuItem
                                        key={course._id}
                                        value={course._id}
                                    >
                                        {course.name || course.courseName || "Untitled Course"}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem value="" disabled>
                                    No courses found
                                </MenuItem>
                            )}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                    <FormControl fullWidth disabled={!selectedCourse}>
                        <InputLabel>Chapter</InputLabel>
                        <Select
                            value={selectedChapter}
                            label="Chapter"
                            onChange={(e) =>
                                handleChapterChange(e.target.value)
                            }
                        >
                            {Array.isArray(chapters) && chapters.length > 0 ? (
                                chapters.map((chapter) => (
                                    <MenuItem
                                        key={chapter._id}
                                        value={chapter._id}
                                    >
                                        {chapter.name ||
                                            chapter.chapterName ||
                                            "Untitled Chapter"}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem value="" disabled>
                                    {selectedCourse
                                        ? "No chapters found"
                                        : "Select course first"}
                                </MenuItem>
                            )}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                    <TextField
                        fullWidth
                        label="Grade"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        placeholder="Example: 5"
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <TextField
                        fullWidth
                        label="Lesson No."
                        value={lessonNo}
                        onChange={(e) => setLessonNo(e.target.value)}
                        placeholder="Example: 1"
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Lesson Name"
                        value={lessonName}
                        onChange={(e) => setLessonName(e.target.value)}
                    />
                </Grid>

                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        type="number"
                        label="No. of Sessions/Periods"
                        value={numberOfSessions}
                        onChange={(e) =>
                            setNumberOfSessions(
                                Math.max(1, Number(e.target.value) || 1),
                            )
                        }
                        inputProps={{ min: 1, max: 10 }}
                    />
                </Grid>

                <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                        <InputLabel>Duration per Session</InputLabel>
                        <Select
                            value={durationPerSession}
                            label="Duration per Session"
                            onChange={(e) =>
                                setDurationPerSession(e.target.value)
                            }
                        >
                            <MenuItem value="30 minutes">30 minutes</MenuItem>
                            <MenuItem value="40 minutes">40 minutes</MenuItem>
                            <MenuItem value="45 minutes">45 minutes</MenuItem>
                            <MenuItem value="60 minutes">60 minutes</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                        <InputLabel>Teaching Style</InputLabel>
                        <Select
                            value={teachingStyle}
                            label="Teaching Style"
                            onChange={(e) => setTeachingStyle(e.target.value)}
                        >
                            <MenuItem value="Activity-based">
                                Activity-based
                            </MenuItem>
                            <MenuItem value="Project-based">
                                Project-based
                            </MenuItem>
                            <MenuItem value="Discussion-based">
                                Discussion-based
                            </MenuItem>
                            <MenuItem value="5E Model">5E Model</MenuItem>
                            <MenuItem value="Demonstration-based">
                                Demonstration-based
                            </MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={includeAssessment}
                                onChange={(e) =>
                                    setIncludeAssessment(e.target.checked)
                                }
                                color="success"
                            />
                        }
                        label="Include Assessment"
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={includeHomework}
                                onChange={(e) =>
                                    setIncludeHomework(e.target.checked)
                                }
                                color="success"
                            />
                        }
                        label="Include Assignment / HW"
                    />
                </Grid>
            </Grid>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() =>
                    setSnackbar((prev) => ({ ...prev, open: false }))
                }
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() =>
                        setSnackbar((prev) => ({ ...prev, open: false }))
                    }
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Typography variant="h5" fontWeight={700} gutterBottom>
                AIRA Lesson Plan Generator
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Generate structured lesson plans from selected chapter eBooks.
                Use the standard format or upload a school-specific lesson plan
                format.
            </Typography>

            <Paper variant="outlined" sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={(event, newValue) => {
                        setActiveTab(newValue);
                        setLessonPlan("");
                        setReferences([]);
                    }}
                    indicatorColor="success"
                    textColor="success"
                    variant="fullWidth"
                >
                    <Tab label="Standard Format" />
                    <Tab label="Custom School Format" />
                </Tabs>
            </Paper>

            {activeTab === 0 && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography
                            variant="h6"
                            sx={{ fontWeight: 700, mb: 2 }}
                        >
                            Standard Lesson Plan Format
                        </Typography>

                        {renderCommonFields()}

                        <Box sx={{ mt: 3 }}>
                            <Button
                                variant="contained"
                                color="success"
                                disabled={loading}
                                onClick={handleGenerateStandard}
                            >
                                {loading ? (
                                    <CircularProgress
                                        size={22}
                                        color="inherit"
                                    />
                                ) : (
                                    "Generate Lesson Plan"
                                )}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {activeTab === 1 && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography
                            variant="h6"
                            sx={{ fontWeight: 700, mb: 1 }}
                        >
                            Custom School Lesson Plan Format
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                        >
                            Upload a school lesson plan template in PDF or DOCX
                            format. AIRA will follow the uploaded structure,
                            headings, and section order.
                        </Typography>

                        {renderCommonFields()}

                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} md={8}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        backgroundColor: "#fafafa",
                                    }}
                                >
                                    <Typography
                                        variant="subtitle2"
                                        sx={{ fontWeight: 700, mb: 1 }}
                                    >
                                        Upload School Format
                                    </Typography>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mb: 2 }}
                                    >
                                        Supported files: PDF, DOCX
                                    </Typography>

                                    <Button
                                        component="label"
                                        variant="outlined"
                                        startIcon={<UploadFileIcon />}
                                    >
                                        Choose Template File
                                        <input
                                            hidden
                                            type="file"
                                            accept=".pdf,.docx"
                                            onChange={(e) => {
                                                const file =
                                                    e.target.files?.[0];

                                                if (!file) return;

                                                const allowedTypes = [
                                                    "application/pdf",
                                                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                                ];

                                                const allowedExtensions =
                                                    file.name
                                                        .toLowerCase()
                                                        .endsWith(".pdf") ||
                                                    file.name
                                                        .toLowerCase()
                                                        .endsWith(".docx");

                                                if (
                                                    !allowedTypes.includes(
                                                        file.type,
                                                    ) &&
                                                    !allowedExtensions
                                                ) {
                                                    showSnackbar(
                                                        "Only PDF and DOCX files are allowed",
                                                        "error",
                                                    );
                                                    return;
                                                }

                                                setTemplateFile(file);
                                            }}
                                        />
                                    </Button>

                                    {templateFile && (
                                        <Typography
                                            variant="body2"
                                            sx={{ mt: 2 }}
                                        >
                                            Selected file:{" "}
                                            <b>{templateFile.name}</b>
                                        </Typography>
                                    )}
                                </Paper>
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 3 }}>
                            <Button
                                variant="contained"
                                color="success"
                                disabled={loading}
                                onClick={handleGenerateCustom}
                            >
                                {loading ? (
                                    <CircularProgress
                                        size={22}
                                        color="inherit"
                                    />
                                ) : (
                                    "Generate in Uploaded Format"
                                )}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {lessonPlan && (
                <Card>
                    <CardContent>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 2,
                                flexWrap: "wrap",
                                mb: 2,
                            }}
                        >
                            <Box>
                                <Typography variant="h6" fontWeight={700}>
                                    Generated Lesson Plan
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {activeTab === 0
                                        ? "Standard SuperTeacher lesson plan format"
                                        : "Generated using uploaded school format"}
                                </Typography>
                            </Box>

                            <Box sx={{ display: "flex", gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<ContentCopyIcon />}
                                    onClick={copyToClipboard}
                                >
                                    Copy
                                </Button>

                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<DownloadIcon />}
                                    onClick={downloadWord}
                                >
                                    Download Word
                                </Button>
                            </Box>
                        </Box>

                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                backgroundColor: "#ffffff",
                                maxHeight: 600,
                                overflow: "auto",
                            }}
                        >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {lessonPlan}
                            </ReactMarkdown>
                        </Paper>

                        {references.length > 0 && (
                            <Box sx={{ mt: 3 }}>
                                <Typography
                                    variant="subtitle1"
                                    fontWeight={700}
                                >
                                    References
                                </Typography>

                                {references.map((reference, index) => {
                                    let referenceText = "";

                                    if (typeof reference === "string") {
                                        referenceText = reference;
                                    } else if (reference?.pageNumber) {
                                        referenceText = `Page ${reference.pageNumber}`;
                                    } else if (reference?.page) {
                                        referenceText = `Page ${reference.page}`;
                                    } else if (reference?.text) {
                                        referenceText = reference.text;
                                    } else {
                                        referenceText =
                                            JSON.stringify(reference);
                                    }

                                    return (
                                        <Typography
                                            key={index}
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {index + 1}. {referenceText}
                                        </Typography>
                                    );
                                })}
                            </Box>
                        )}
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default AiraLessonPlanGenerator;
