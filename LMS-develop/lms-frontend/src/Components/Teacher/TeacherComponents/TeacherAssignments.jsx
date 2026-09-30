import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    CircularProgress,
    Divider,
    FormControl,
    FormControlLabel,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import RateReviewIcon from "@mui/icons-material/RateReview";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useTheme } from "@mui/material/styles";

const TASK_TYPES = [
    {
        value: "Quick Task",
        title: "Quick Task",
        description: "Fast homework or classroom follow-up.",
    },
    {
        value: "Written Task",
        title: "Written Task",
        description: "Students write an answer inside the LMS.",
    },
    {
        value: "Coding Task",
        title: "Coding Task",
        description: "Students solve a coding problem and submit code.",
    },
    {
        value: "Practical Task",
        title: "Practical Task",
        description: "Students upload tool-based practical work.",
    },
    {
        value: "Project Task",
        title: "Project Task",
        description: "Students submit project work with file evidence.",
    },
];

const TASK_TEMPLATES = [
    {
        label: "Concept Explain",
        taskType: "Written Task",
        title: "Explain the concept",
        description:
            "Explain the key concept from today's chapter in your own words with one example.",
    },
    {
        label: "Python Practice",
        taskType: "Coding Task",
        title: "Python coding practice",
        description: "Solve the coding task and submit your code.",
        problemStatement:
            "Write a program that uses the concept taught in this chapter.",
    },
    {
        label: "Tool Practical",
        taskType: "Practical Task",
        title: "Practical work submission",
        description:
            "Complete the practical task using the given tool and upload your finished file.",
    },
    {
        label: "Mini Project",
        taskType: "Project Task",
        title: "Mini project",
        description:
            "Build the project from the requirements and submit your work with evidence.",
    },
];

const SOFTWARE_TOOLS = [
    "General",
    "Python",
    "Scratch",
    "HTML/CSS",
    "JavaScript",
    "MS Word",
    "MS PowerPoint",
    "MS Excel",
    "Canva / Design",
    "Robotics / Arduino",
    "AI / Teachable Machine",
    "Cyber Safety",
];

const SUBMISSION_TYPES = [
    "Text Answer",
    "Code Answer",
    "File Upload",
    "Project Link",
    "Mixed Submission",
];

const REVIEW_STATUS = [
    { label: "Reviewed", value: "reviewed" },
    { label: "Needs Correction", value: "needs_correction" },
    { label: "Submitted", value: "submitted" },
    { label: "Late Submission", value: "late_submission" },
];

const getTodayDate = () => new Date().toISOString().split("T")[0];

const detectSoftwareTool = ({
    courseName = "",
    chapterName = "",
    title = "",
}) => {
    const text = `${courseName} ${chapterName} ${title}`.toLowerCase();

    if (text.includes("python")) return "Python";
    if (text.includes("scratch")) return "Scratch";
    if (text.includes("html") || text.includes("css")) return "HTML/CSS";
    if (text.includes("javascript") || text.includes("js")) return "JavaScript";
    if (text.includes("word")) return "MS Word";
    if (text.includes("excel")) return "MS Excel";
    if (text.includes("powerpoint") || text.includes("ppt")) return "MS PowerPoint";
    if (text.includes("robot") || text.includes("arduino")) return "Robotics / Arduino";
    if (text.includes("teachable") || text.includes("ai")) return "AI / Teachable Machine";
    if (text.includes("cyber") || text.includes("safety")) return "Cyber Safety";

    return "General";
};

const scaleRubricToMaxMarks = (rubric = [], maxMarks = 10) => {
    const target = Number(maxMarks || 10);
    const total = rubric.reduce((sum, row) => sum + Number(row.marks || 0), 0);

    if (!total || total === target) return rubric;

    const scaled = rubric.map((row) => ({
        ...row,
        marks: Math.max(1, Math.round((Number(row.marks || 0) / total) * target)),
    }));

    const scaledTotal = scaled.reduce((sum, row) => sum + Number(row.marks || 0), 0);
    const difference = target - scaledTotal;

    if (scaled.length > 0 && difference !== 0) {
        scaled[0] = {
            ...scaled[0],
            marks: Math.max(1, Number(scaled[0].marks || 0) + difference),
        };
    }

    return scaled;
};

const ASSIGNMENT_TYPE_TEMPLATES = {
    "Quick Task": {
        assignmentType: "Quick Task",
        submissionType: "Text Answer",
        softwareTool: "General",
        autoEvaluate: true,
        dynamicFields: ["expectedAnswerLength"],
        rubric: [
            { criteria: "Correctness", marks: 5 },
            { criteria: "Completeness", marks: 3 },
            { criteria: "Clarity", marks: 2 },
        ],
    },

    "Written Task": {
        assignmentType: "Written Task",
        submissionType: "Text Answer",
        softwareTool: "General",
        autoEvaluate: true,
        dynamicFields: ["expectedAnswerLength"],
        rubric: [
            { criteria: "Concept understanding", marks: 4 },
            { criteria: "Completeness", marks: 3 },
            { criteria: "Clarity", marks: 2 },
            { criteria: "Presentation", marks: 1 },
        ],
    },

    "Coding Task": {
        assignmentType: "Coding Assignment",
        submissionType: "Code Answer",
        softwareTool: "Python",
        autoEvaluate: true,
        dynamicFields: ["problemStatement", "starterCode", "expectedOutput", "testCases"],
        rubric: [
            { criteria: "Logic", marks: 4 },
            { criteria: "Syntax", marks: 2 },
            { criteria: "Output", marks: 2 },
            { criteria: "Code clarity", marks: 2 },
        ],
    },

    "Practical Task": {
        assignmentType: "Practical Task",
        submissionType: "File Upload",
        softwareTool: "MS Word",
        autoEvaluate: false,
        dynamicFields: ["practicalSteps", "allowedFileTypes", "fileNameInstruction"],
        rubric: [
            { criteria: "Task completion", marks: 4 },
            { criteria: "Tool usage", marks: 3 },
            { criteria: "Accuracy", marks: 2 },
            { criteria: "Presentation", marks: 1 },
        ],
    },

    "Project Task": {
        assignmentType: "Project Task",
        submissionType: "File Upload",
        softwareTool: "General",
        autoEvaluate: false,
        dynamicFields: ["projectRequirements", "allowedFileTypes", "fileNameInstruction"],
        rubric: [
            { criteria: "Functionality", marks: 3 },
            { criteria: "Completion", marks: 3 },
            { criteria: "Creativity", marks: 2 },
            { criteria: "Presentation", marks: 2 },
        ],
    },

    "Theory Assignment": {
        submissionType: "Text Answer",
        softwareTool: "General",
        dynamicFields: ["expectedAnswerLength"],
        rubric: [
            { criteria: "Concept understanding", marks: 4 },
            { criteria: "Completeness", marks: 3 },
            { criteria: "Clarity", marks: 2 },
            { criteria: "Presentation", marks: 1 },
        ],
    },

    "Coding Assignment": {
        submissionType: "Code Answer",
        softwareTool: "Python",
        dynamicFields: ["problemStatement", "starterCode", "expectedOutput", "testCases"],
        rubric: [
            { criteria: "Logic", marks: 4 },
            { criteria: "Syntax", marks: 2 },
            { criteria: "Output", marks: 2 },
            { criteria: "Code clarity", marks: 2 },
        ],
    },

    "Software Practical": {
        submissionType: "File URL",
        softwareTool: "MS Word",
        dynamicFields: ["practicalSteps", "fileNameInstruction"],
        rubric: [
            { criteria: "Tool usage", marks: 3 },
            { criteria: "Task completion", marks: 3 },
            { criteria: "Accuracy", marks: 2 },
            { criteria: "Presentation", marks: 2 },
        ],
    },

    "Project Work": {
        submissionType: "Project Link",
        softwareTool: "General",
        dynamicFields: ["projectRequirements", "fileNameInstruction"],
        rubric: [
            { criteria: "Creativity", marks: 3 },
            { criteria: "Functionality", marks: 3 },
            { criteria: "Completion", marks: 2 },
            { criteria: "Presentation", marks: 2 },
        ],
    },

};

const getAssignmentTypeTemplate = (assignmentType, maxMarks = 10) => {
    const template =
        ASSIGNMENT_TYPE_TEMPLATES[assignmentType] ||
        ASSIGNMENT_TYPE_TEMPLATES["Written Task"];

    return {
        ...template,
        rubric: scaleRubricToMaxMarks(template.rubric, maxMarks),
    };
};

const getInitialForm = () => ({
    title: "",
    description: "",

    className: "",
    sectionName: "",
    classSection: "",

    courseId: "",
    courseName: "",
    chapterId: "",
    chapterName: "",

    taskType: "Written Task",
    assignmentType: "Written Task",
    softwareTool: "General",
    submissionType: "Text Answer",

    expectedAnswerLength: "",
    problemStatement: "",
    starterCode: "",
    expectedOutput: "",
    testCases: "",
    practicalSteps: "",
    projectRequirements: "",
    allowedFileTypes: "",
    fileNameInstruction: "",

    dueDate: getTodayDate(),
    maxMarks: 10,
    autoEvaluate: true,
    attachmentUrl: "",
    attachmentName: "",
    attachmentType: "",
    attachmentSize: 0,
    attachmentFile: null,
    status: "active",
});

const TeacherAssignments = () => {
    const [activeTab, setActiveTab] = useState(0);

    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState("");
    const [selectedBatchDetails, setSelectedBatchDetails] = useState(null);

    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [allSubmissions, setAllSubmissions] = useState([]);
    const [assignmentReport, setAssignmentReport] = useState([]);

    const [loadingBatches, setLoadingBatches] = useState(false);
    const [loadingBatchDetails, setLoadingBatchDetails] = useState(false);
    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [loadingAllSubmissions, setLoadingAllSubmissions] = useState(false);
    const [loadingReport, setLoadingReport] = useState(false);
    const [creating, setCreating] = useState(false);
    const [editingAssignmentId, setEditingAssignmentId] = useState("");
    const [showAdvancedCreate, setShowAdvancedCreate] = useState(false);
    const [evaluatingId, setEvaluatingId] = useState("");
    const [reviewingId, setReviewingId] = useState("");
    const [uploadingAttachment, setUploadingAttachment] = useState(false);
    const [reviewFilter, setReviewFilter] = useState("all");

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    const [form, setForm] = useState(getInitialForm());
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const [rubric, setRubric] = useState(
        getAssignmentTypeTemplate("Written Task", 10).rubric,
    );

    const [reviewDrafts, setReviewDrafts] = useState({});

    const getAuthHeaders = () => {
        const token =
            localStorage.getItem("token") ||
            localStorage.getItem("authToken") ||
            localStorage.getItem("teacherToken");

        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const showSnackbar = (message, severity = "success") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const selectedBatch = useMemo(() => {
        return batches.find((batch) => String(batch._id) === String(selectedBatchId)) || null;
    }, [batches, selectedBatchId]);

    const batchCourses = useMemo(() => {
        return (
            selectedBatchDetails?.courses ||
            selectedBatchDetails?.batch?.courses ||
            selectedBatch?.courses ||
            []
        );
    }, [selectedBatchDetails, selectedBatch]);

    const selectedCourse = useMemo(() => {
        return (
            batchCourses.find((course) => String(course._id) === String(form.courseId)) || null
        );
    }, [batchCourses, form.courseId]);

    const courseChapters = useMemo(() => {
        return (
            selectedCourse?.chapters ||
            selectedCourse?.courseChapters ||
            selectedCourse?.chapter ||
            []
        );
    }, [selectedCourse]);

    const classSectionOptions = useMemo(() => {
        const details = selectedBatchDetails || {};

        const possibleClassSections =
            details.classSections ||
            details.sections ||
            details.classes ||
            details.batchSections ||
            details.batch?.classSections ||
            details.batch?.sections ||
            [];

        if (Array.isArray(possibleClassSections) && possibleClassSections.length) {
            return possibleClassSections
                .map((item) => {
                    if (typeof item === "string") {
                        return {
                            className: item,
                            sectionName: "",
                            classSection: item,
                        };
                    }

                    const className =
                        item.className ||
                        item.class ||
                        item.grade ||
                        item.standard ||
                        item.studentClass ||
                        "";

                    const sectionName =
                        item.sectionName ||
                        item.section ||
                        item.division ||
                        item.classSectionName ||
                        "";

                    const classSection =
                        item.classSection ||
                        item.name ||
                        [className, sectionName].filter(Boolean).join(" - ");

                    return {
                        className,
                        sectionName,
                        classSection,
                    };
                })
                .filter((item) => item.classSection);
        }

        const students =
            details.students ||
            details.batch?.students ||
            selectedBatch?.students ||
            [];

        const map = new Map();

        students.forEach((rawStudent) => {
            const student =
                rawStudent?.student ||
                rawStudent?.studentId ||
                rawStudent?.user ||
                rawStudent ||
                {};

            const className =
                student.className ||
                student.class ||
                student.grade ||
                student.standard ||
                student.studentClass ||
                rawStudent.className ||
                rawStudent.class ||
                rawStudent.grade ||
                rawStudent.standard ||
                rawStudent.studentClass ||
                "";

            const sectionName =
                student.sectionName ||
                student.section ||
                student.division ||
                student.classSectionName ||
                rawStudent.sectionName ||
                rawStudent.section ||
                rawStudent.division ||
                rawStudent.classSectionName ||
                "";

            const classSection =
                student.classSection ||
                rawStudent.classSection ||
                [className, sectionName].filter(Boolean).join(" - ");

            if (classSection) {
                map.set(classSection, {
                    className,
                    sectionName,
                    classSection,
                });
            }
        });

        return Array.from(map.values());
    }, [selectedBatchDetails, selectedBatch]);

    const reportByAssignment = useMemo(() => {
        return new Map(
            assignmentReport.map((row) => [String(row.assignmentId), row]),
        );
    }, [assignmentReport]);

    const fetchTeacherBatches = async () => {
        try {
            setLoadingBatches(true);

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/teacher/getLoggedinTeacher`,
                { headers: getAuthHeaders() },
            );

            const teacherBatches = response.data?.teacher?.batches || [];
            setBatches(Array.isArray(teacherBatches) ? teacherBatches : []);
        } catch (error) {
            console.error("Error fetching batches:", error);
            showSnackbar("Failed to fetch teacher batches", "error");
        } finally {
            setLoadingBatches(false);
        }
    };

    const fetchBatchDetails = async (batchId) => {
        if (!batchId) {
            setSelectedBatchDetails(null);
            return;
        }

        try {
            setLoadingBatchDetails(true);

            let batchData = null;

            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/teacher/getBatchInfo/${batchId}`,
                    { headers: getAuthHeaders() },
                );

                batchData =
                    response.data?.batch ||
                    response.data?.data ||
                    response.data ||
                    null;
            } catch (mainError) {
                const fallbackResponse = await axios.get(
                    `${import.meta.env.VITE_API_URL}/teacher/getBatchBasicInfo/${batchId}`,
                    { headers: getAuthHeaders() },
                );

                batchData =
                    fallbackResponse.data?.batch ||
                    fallbackResponse.data?.data ||
                    fallbackResponse.data ||
                    null;
            }

            setSelectedBatchDetails(batchData);
        } catch (error) {
            console.error("Error fetching batch details:", error);
            setSelectedBatchDetails(null);
            showSnackbar("Failed to fetch batch course/class details", "error");
        } finally {
            setLoadingBatchDetails(false);
        }
    };

    const fetchAssignments = async () => {
        try {
            setLoadingAssignments(true);

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/assignments/teacher`,
                {
                    params: selectedBatchId ? { batchId: selectedBatchId } : {},
                    headers: getAuthHeaders(),
                },
            );

            setAssignments(response.data?.assignments || []);
        } catch (error) {
            console.error("Error fetching assignments:", error);
            showSnackbar("Failed to fetch assignments", "error");
        } finally {
            setLoadingAssignments(false);
        }
    };

    const fetchAllTeacherSubmissions = async () => {
        try {
            setLoadingAllSubmissions(true);

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/assignments/teacher/submissions`,
                {
                    params: selectedBatchId ? { batchId: selectedBatchId } : {},
                    headers: getAuthHeaders(),
                },
            );

            setAllSubmissions(response.data?.submissions || []);
        } catch (error) {
            console.error("Error fetching submitted assignments:", error);
            showSnackbar("Failed to fetch submitted assignments", "error");
        } finally {
            setLoadingAllSubmissions(false);
        }
    };

    const fetchAssignmentReport = async () => {
        try {
            setLoadingReport(true);

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/assignments/report/summary`,
                {
                    params: selectedBatchId ? { batchId: selectedBatchId } : {},
                    headers: getAuthHeaders(),
                },
            );

            setAssignmentReport(response.data?.report || []);
        } catch (error) {
            console.error("Error loading assignment report:", error);
            showSnackbar("Failed to load assignment report", "error");
        } finally {
            setLoadingReport(false);
        }
    };

    const refreshAll = async () => {
        await Promise.all([
            fetchAssignments(),
            fetchAllTeacherSubmissions(),
            fetchAssignmentReport(),
        ]);
    };

    useEffect(() => {
        fetchTeacherBatches();
    }, []);

    useEffect(() => {
        if (selectedBatchId) {
            fetchBatchDetails(selectedBatchId);
        } else {
            setSelectedBatchDetails(null);
        }

        refreshAll();
        setSelectedAssignment(null);
        setSubmissions([]);

        setForm((prev) => ({
            ...prev,
            className: "",
            sectionName: "",
            classSection: "",
            courseId: "",
            courseName: "",
            chapterId: "",
            chapterName: "",
        }));
    }, [selectedBatchId]);

    const handleFormChange = (field, value) => {
        setForm((prev) => {
            const updated = { ...prev, [field]: value };

            if (field === "classSection") {
                const selectedClassSection = classSectionOptions.find(
                    (item) => item.classSection === value,
                );

                updated.classSection = value;
                updated.className = selectedClassSection?.className || "";
                updated.sectionName = selectedClassSection?.sectionName || "";
            }

            if (field === "taskType" || field === "assignmentType") {
                const template = getAssignmentTypeTemplate(value, updated.maxMarks);

                updated.taskType = field === "taskType" ? value : updated.taskType;
                updated.assignmentType = template.assignmentType || value;
                updated.submissionType = template.submissionType;
                updated.softwareTool = template.softwareTool;
                updated.autoEvaluate = template.autoEvaluate;

                updated.expectedAnswerLength = "";
                updated.problemStatement = "";
                updated.starterCode = "";
                updated.expectedOutput = "";
                updated.testCases = "";
                updated.practicalSteps = "";
                updated.projectRequirements = "";
                updated.allowedFileTypes = "";
                updated.fileNameInstruction = "";

                setRubric(template.rubric);
            }

            if (field === "courseId") {
                const course = batchCourses.find(
                    (item) => String(item._id) === String(value),
                );

                updated.courseName = course?.name || course?.courseName || "";
                updated.chapterId = "";
                updated.chapterName = "";

                if (updated.assignmentType === "Theory Assignment") {
                    updated.softwareTool = detectSoftwareTool({
                        courseName: course?.name || course?.courseName || "",
                        chapterName: "",
                        title: updated.title,
                    });
                }
            }

            if (field === "chapterId") {
                const chapter = courseChapters.find(
                    (item) => String(item._id) === String(value),
                );

                updated.chapterName = chapter?.name || chapter?.chapterName || "";

                if (updated.assignmentType === "Theory Assignment") {
                    updated.softwareTool = detectSoftwareTool({
                        courseName: updated.courseName,
                        chapterName: chapter?.name || chapter?.chapterName || "",
                        title: updated.title,
                    });
                }
            }

            if (field === "title" && updated.assignmentType === "Theory Assignment") {
                updated.softwareTool = detectSoftwareTool({
                    courseName: updated.courseName,
                    chapterName: updated.chapterName,
                    title: value,
                });
            }

            if (field === "softwareTool") {
                const toolRubric = getAssignmentTypeTemplate(
                    updated.assignmentType,
                    updated.maxMarks,
                ).rubric;

                setRubric(toolRubric);
            }

            if (field === "maxMarks") {
                const template = getAssignmentTypeTemplate(
                    updated.assignmentType,
                    value,
                );

                setRubric(template.rubric);
            }

            return updated;
        });
    };

    const addRubricRow = () => {
        setRubric((prev) => [...prev, { criteria: "", marks: 0 }]);
    };

    const updateRubricRow = (index, field, value) => {
        setRubric((prev) =>
            prev.map((row, idx) =>
                idx === index
                    ? {
                        ...row,
                        [field]: field === "marks" ? Number(value || 0) : value,
                    }
                    : row,
            ),
        );
    };

    const removeRubricRow = (index) => {
        setRubric((prev) => prev.filter((_, idx) => idx !== index));
    };

    const applyTaskTemplate = (template) => {
        handleFormChange("taskType", template.taskType);
        setForm((prev) => ({
            ...prev,
            title: template.title,
            description: template.description,
            problemStatement: template.problemStatement || prev.problemStatement,
        }));
    };

    const uploadTeacherAttachment = async (file) => {
        if (!file) return null;

        const formData = new FormData();
        formData.append("file", file);

        try {
            setUploadingAttachment(true);
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/assignments/attachment-file`,
                formData,
                {
                    headers: {
                        ...getAuthHeaders(),
                        "Content-Type": "multipart/form-data",
                    },
                },
            );

            return response.data?.file || null;
        } finally {
            setUploadingAttachment(false);
        }
    };

    const createAssignment = async (status = form.status || "active") => {
        if (!selectedBatchId) {
            showSnackbar("Please select a batch", "error");
            return;
        }

        if (!form.title.trim()) {
            showSnackbar("Please enter assignment title", "error");
            return;
        }

        if (!form.dueDate) {
            showSnackbar("Please select due date", "error");
            return;
        }

        try {
            setCreating(true);

            const uploadedAttachment = await uploadTeacherAttachment(
                form.attachmentFile,
            );
            const { attachmentFile, ...formPayload } = form;
            const payload = {
                ...formPayload,
                status,
                batchId: selectedBatchId,
                batchName:
                    selectedBatch?.batchName ||
                    selectedBatchDetails?.batchName ||
                    selectedBatchDetails?.batch?.batchName ||
                    "",
                maxMarks: Number(form.maxMarks || 10),
                attachmentUrl:
                    uploadedAttachment?.url || form.attachmentUrl || "",
                attachmentName:
                    uploadedAttachment?.name || form.attachmentName || "",
                attachmentType:
                    uploadedAttachment?.type || form.attachmentType || "",
                attachmentSize:
                    uploadedAttachment?.size || form.attachmentSize || 0,
                rubric: rubric.filter(
                    (row) => row.criteria && Number(row.marks) > 0,
                ),
            };

            const response = editingAssignmentId
                ? await axios.put(
                    `${import.meta.env.VITE_API_URL}/assignments/${editingAssignmentId}`,
                    payload,
                    { headers: getAuthHeaders() },
                )
                : await axios.post(
                    `${import.meta.env.VITE_API_URL}/assignments/create`,
                    payload,
                    { headers: getAuthHeaders() },
                );

            if (response.data?.success) {
                showSnackbar(
                    editingAssignmentId
                        ? "Task updated successfully"
                        : status === "draft"
                            ? "Task saved as draft"
                            : "Task published successfully",
                    "success",
                );

                setForm(getInitialForm());
                setRubric(getAssignmentTypeTemplate("Written Task", 10).rubric);
                setEditingAssignmentId("");
                setShowAdvancedCreate(false);

                await refreshAll();
                setActiveTab(1);
            }
        } catch (error) {
            console.error("Error creating assignment:", error);
            showSnackbar(
                error.response?.data?.message || "Failed to create assignment",
                "error",
            );
        } finally {
            setCreating(false);
        }
    };

    const filteredSubmissions = (items = []) => {
        if (reviewFilter === "all") return items;
        if (reviewFilter === "pending") {
            return items.filter((submission) =>
                ["submitted", "late_submission"].includes(submission.status),
            );
        }
        return items.filter((submission) => submission.status === reviewFilter);
    };

    const editAssignment = (assignment) => {
        setForm({
            ...getInitialForm(),
            ...assignment,
            courseId: assignment.courseId || "",
            chapterId: assignment.chapterId || "",
            taskType: assignment.taskType || "Written Task",
        });
        setRubric(
            assignment.rubric?.length
                ? assignment.rubric
                : getAssignmentTypeTemplate(
                    assignment.taskType || "Written Task",
                    assignment.maxMarks || 10,
                ).rubric,
        );
        setEditingAssignmentId(assignment._id);
        setShowAdvancedCreate(true);
        setActiveTab(0);
    };

    const updateAssignmentStatus = async (assignment, status) => {
        try {
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/assignments/${assignment._id}`,
                { status },
                { headers: getAuthHeaders() },
            );

            if (response.data?.success) {
                showSnackbar(
                    status === "active"
                        ? "Task published"
                        : status === "closed"
                            ? "Task closed"
                            : "Task saved as draft",
                    "success",
                );
                await refreshAll();
            }
        } catch (error) {
            console.error("Error updating task status:", error);
            showSnackbar("Failed to update task status", "error");
        }
    };

    const loadSubmissions = async (assignment) => {
        try {
            setSelectedAssignment(assignment);
            setLoadingSubmissions(true);
            setActiveTab(1);

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/assignments/${assignment._id}/submissions`,
                { headers: getAuthHeaders() },
            );

            const fetched = response.data?.submissions || [];
            setSubmissions(fetched);

            const drafts = {};
            fetched.forEach((submission) => {
                drafts[submission._id] = {
                    finalMarks:
                        submission.finalMarks ??
                        submission.airaEvaluation?.suggestedMarks ??
                        "",
                    teacherComment: submission.teacherComment || "",
                    status:
                        submission.status === "submitted" ||
                            submission.status === "late_submission"
                            ? "reviewed"
                            : submission.status || "reviewed",
                };
            });

            setReviewDrafts(drafts);
        } catch (error) {
            console.error("Error loading submissions:", error);
            showSnackbar("Failed to load submissions", "error");
        } finally {
            setLoadingSubmissions(false);
        }
    };

    const runAiraEvaluation = async (submissionId) => {
        try {
            setEvaluatingId(submissionId);

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/assignments/submission/${submissionId}/aira-evaluate`,
                {},
                { headers: getAuthHeaders() },
            );

            if (response.data?.success) {
                showSnackbar("AIRA evaluation completed", "success");

                if (selectedAssignment) {
                    await loadSubmissions(selectedAssignment);
                }

                await fetchAllTeacherSubmissions();
                await fetchAssignmentReport();
            }
        } catch (error) {
            console.error("AIRA evaluation failed:", error);
            showSnackbar("AIRA evaluation failed", "error");
        } finally {
            setEvaluatingId("");
        }
    };

    const updateReviewDraft = (submissionId, field, value) => {
        setReviewDrafts((prev) => ({
            ...prev,
            [submissionId]: {
                ...(prev[submissionId] || {}),
                [field]: value,
            },
        }));
    };

    const reviewSubmission = async (submissionId) => {
        const draft = reviewDrafts[submissionId] || {};

        try {
            setReviewingId(submissionId);

            const response = await axios.patch(
                `${import.meta.env.VITE_API_URL}/assignments/submission/${submissionId}/review`,
                {
                    finalMarks: draft.finalMarks,
                    teacherComment: draft.teacherComment,
                    status: draft.status || "reviewed",
                },
                { headers: getAuthHeaders() },
            );

            if (response.data?.success) {
                showSnackbar("Submission reviewed successfully", "success");

                if (selectedAssignment) {
                    await loadSubmissions(selectedAssignment);
                }

                await fetchAllTeacherSubmissions();
                await fetchAssignmentReport();
            }
        } catch (error) {
            console.error("Review failed:", error);
            showSnackbar("Failed to review submission", "error");
        } finally {
            setReviewingId("");
        }
    };

    const exportReportCSV = () => {
        if (!assignmentReport.length) {
            showSnackbar("No assignment report available", "error");
            return;
        }

        const rows = [
            [
                "Assignment",
                "Batch",
                "Class / Section",
                "Tool",
                "Due Date",
                "Max Marks",
                "Submissions",
                "Reviewed",
                "Needs Correction",
                "Late",
                "Pending Review",
            ],
        ];

        assignmentReport.forEach((row) => {
            rows.push([
                row.title || "",
                row.batchName || "",
                row.classSection || "All",
                row.softwareTool || "",
                row.dueDate || "",
                row.maxMarks || 0,
                row.totalSubmissions || 0,
                row.reviewed || 0,
                row.needsCorrection || 0,
                row.late || 0,
                row.pendingReview || 0,
            ]);
        });

        const csv = rows
            .map((row) =>
                row
                    .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                    .join(","),
            )
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "assignment_report.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const formatDateTime = (value) => {
        if (!value) return "-";

        try {
            return new Date(value).toLocaleString();
        } catch {
            return "-";
        }
    };

    const renderSubmissionContent = (submission) => {
        return (
            <Box sx={{ mt: 1 }}>
                {submission.textAnswer && (
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 1 }}>
                        <b>Text:</b> {submission.textAnswer}
                    </Typography>
                )}

                {submission.codeAnswer && (
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 1.5,
                            my: 1,
                            bgcolor: isDark
                                ? "#161616"
                                : "#f7f7f7",

                            color: "text.primary",
                            whiteSpace: "pre-wrap",
                            fontFamily: "monospace",
                        }}
                    >
                        {submission.codeAnswer}
                    </Paper>
                )}

                {submission.fileUrl && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <b>File:</b>{" "}
                        <a href={submission.fileUrl} target="_blank" rel="noreferrer">
                            {submission.fileName || submission.fileUrl}
                        </a>
                    </Typography>
                )}

                {submission.uploadedFileUrl && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <b>Uploaded File:</b>{" "}
                        <a
                            href={submission.uploadedFileUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {submission.uploadedFileName || "Open file"}
                        </a>
                    </Typography>
                )}

                {submission.projectLink && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <b>Project Link:</b>{" "}
                        <a href={submission.projectLink} target="_blank" rel="noreferrer">
                            {submission.projectLink}
                        </a>
                    </Typography>
                )}

                {submission.studentNote && (
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        <b>Student Note:</b> {submission.studentNote}
                    </Typography>
                )}
            </Box>
        );
    };

    const renderDynamicAssignmentFields = () => {
        const template = getAssignmentTypeTemplate(
            form.taskType || form.assignmentType,
            form.maxMarks,
        );

        const fields = template.dynamicFields || [];

        if (!fields.length) return null;

        const fieldConfig = {
            expectedAnswerLength: {
                label: "Expected Answer Length",
                placeholder: "Example: 5-6 lines / 100 words / short paragraph",
                multiline: false,
                md: 6,
            },
            problemStatement: {
                label: "Problem Statement",
                placeholder: "Write the coding problem students need to solve.",
                multiline: true,
                md: 12,
            },
            starterCode: {
                label: "Starter Code",
                placeholder: "Optional starter code for students.",
                multiline: true,
                md: 12,
            },
            expectedOutput: {
                label: "Expected Output",
                placeholder: "Example output / expected result.",
                multiline: true,
                md: 6,
            },
            testCases: {
                label: "Test Cases / Sample Inputs",
                placeholder: "Example: input 5 and 7 → output 12",
                multiline: true,
                md: 6,
            },
            practicalSteps: {
                label: "Practical Steps",
                placeholder: "Step 1..., Step 2..., Step 3...",
                multiline: true,
                md: 12,
            },
            projectRequirements: {
                label: "Project Requirements",
                placeholder:
                    "Mention features, tools, output, and submission requirements.",
                multiline: true,
                md: 12,
            },
            allowedFileTypes: {
                label: "Allowed File Types",
                placeholder: "Example: PDF, DOCX, PPTX, PNG, SB3, PY",
                multiline: false,
                md: 6,
            },
            fileNameInstruction: {
                label: "File Name / Submission Instruction",
                placeholder: "Example: Save as Name_Class_Project.pdf",
                multiline: true,
                md: 6,
            },
        };

        return (
            <>
                <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {form.taskType || form.assignmentType} Details
                    </Typography>
                </Grid>

                {fields.map((field) => {
                    const config = fieldConfig[field];

                    if (!config) return null;

                    return (
                        <Grid item xs={12} md={config.md || 6} key={field}>
                            <TextField
                                fullWidth
                                multiline={config.multiline}
                                minRows={config.multiline ? 3 : undefined}
                                label={config.label}
                                placeholder={config.placeholder}
                                value={form[field] || ""}
                                onChange={(e) =>
                                    handleFormChange(field, e.target.value)
                                }
                            />
                        </Grid>
                    );
                })}
            </>
        );
    };

    const renderCreateAssignmentTab = () => (
        <Card
            sx={{
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                boxShadow: isDark ? 0 : 2,
            }}
        >
            <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {editingAssignmentId ? "Edit Student Task" : "Create Student Task"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Start from what you want students to do. Submission settings
                    and rubric defaults are filled for you.
                </Typography>

                <Grid container spacing={2}>
                    {!selectedBatchId && (
                        <Grid item xs={12}>
                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                Select a batch above to unlock class, course, and
                                chapter details for this task.
                            </Alert>
                        </Grid>
                    )}

                    <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                            What should students do?
                        </Typography>
                        <Grid container spacing={1.5}>
                            {TASK_TYPES.map((task) => (
                                <Grid item xs={12} sm={6} md key={task.value}>
                                    <Paper
                                        variant="outlined"
                                        onClick={() =>
                                            handleFormChange("taskType", task.value)
                                        }
                                        sx={{
                                            p: 1.5,
                                            height: "100%",
                                            cursor: "pointer",
                                            borderColor:
                                                form.taskType === task.value
                                                    ? "success.main"
                                                    : "divider",
                                            bgcolor:
                                                form.taskType === task.value
                                                    ? isDark
                                                        ? "rgba(34,197,94,.12)"
                                                        : "#f1fbf3"
                                                    : "background.paper",
                                        }}
                                    >
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                            {task.title}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {task.description}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                        <Box
                            sx={{
                                display: "flex",
                                gap: 1,
                                flexWrap: "wrap",
                                alignItems: "center",
                                mt: 1.5,
                            }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                Start from template:
                            </Typography>
                            {TASK_TEMPLATES.map((template) => (
                                <Button
                                    key={template.label}
                                    size="small"
                                    variant="outlined"
                                    onClick={() => applyTaskTemplate(template)}
                                >
                                    {template.label}
                                </Button>
                            ))}
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Task Title"
                            value={form.title}
                            onChange={(e) =>
                                handleFormChange("title", e.target.value)
                            }
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            type="date"
                            label="Due Date"
                            value={form.dueDate}
                            onChange={(e) =>
                                handleFormChange("dueDate", e.target.value)
                            }
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Max Marks"
                            value={form.maxMarks}
                            onChange={(e) =>
                                handleFormChange("maxMarks", e.target.value)
                            }
                            onWheel={(e) => e.target.blur()}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            label="What should students do?"
                            placeholder="Write the task clearly as students will read it."
                            value={form.description}
                            onChange={(e) =>
                                handleFormChange("description", e.target.value)
                            }
                        />
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>Class / Section</InputLabel>
                            <Select
                                label="Class / Section"
                                value={form.classSection}
                                disabled={!selectedBatchId || loadingBatchDetails}
                                onChange={(e) =>
                                    handleFormChange("classSection", e.target.value)
                                }
                            >
                                <MenuItem value="">
                                    All students in selected batch
                                </MenuItem>

                                {classSectionOptions.map((item) => (
                                    <MenuItem
                                        key={item.classSection}
                                        value={item.classSection}
                                    >
                                        {item.classSection}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {!selectedBatchId ? (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mt: 0.75 }}
                            >
                                Select a batch above first.
                            </Typography>
                        ) : classSectionOptions.length === 0 && !loadingBatchDetails ? (
                            <Typography
                                variant="caption"
                                color="warning.main"
                                sx={{ display: "block", mt: 0.75 }}
                            >
                                No class/section options were found for this batch.
                            </Typography>
                        ) : null}
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>Course</InputLabel>
                            <Select
                                label="Course"
                                value={form.courseId}
                                disabled={!selectedBatchId || loadingBatchDetails}
                                onChange={(e) =>
                                    handleFormChange("courseId", e.target.value)
                                }
                            >
                                {batchCourses.map((course) => (
                                    <MenuItem key={course._id} value={course._id}>
                                        {course.name ||
                                            course.courseName ||
                                            "Unnamed Course"}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {!selectedBatchId ? (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mt: 0.75 }}
                            >
                                Select a batch above first.
                            </Typography>
                        ) : batchCourses.length === 0 && !loadingBatchDetails ? (
                            <Typography
                                variant="caption"
                                color="warning.main"
                                sx={{ display: "block", mt: 0.75 }}
                            >
                                No courses were found for this batch.
                            </Typography>
                        ) : null}
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>Chapter</InputLabel>
                            <Select
                                label="Chapter"
                                value={form.chapterId}
                                disabled={!form.courseId}
                                onChange={(e) =>
                                    handleFormChange("chapterId", e.target.value)
                                }
                            >
                                {courseChapters.map((chapter) => (
                                    <MenuItem key={chapter._id} value={chapter._id}>
                                        {chapter.name ||
                                            chapter.chapterName ||
                                            "Unnamed Chapter"}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {!form.courseId ? (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mt: 0.75 }}
                            >
                                Select a course first to load chapters.
                            </Typography>
                        ) : courseChapters.length === 0 ? (
                            <Typography
                                variant="caption"
                                color="warning.main"
                                sx={{ display: "block", mt: 0.75 }}
                            >
                                No chapters were found for the selected course.
                            </Typography>
                        ) : null}
                    </Grid>

                    {renderDynamicAssignmentFields()}

                    <Grid item xs={12}>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                bgcolor: isDark
                                    ? "rgba(59,130,246,.12)"
                                    : "#f7fbff",
                                borderColor: "info.light",
                            }}
                        >
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Student view preview
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700, mt: 1 }}>
                                {form.title || "Task title will appear here"}
                            </Typography>
                            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
                                {form.description ||
                                    "The instructions you write will appear here for students."}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                                <Chip label={form.taskType} size="small" color="success" />
                                <Chip
                                    label={`Students submit: ${form.submissionType}`}
                                    size="small"
                                    color="info"
                                />
                                <Chip label={`${form.maxMarks || 0} marks`} size="small" />
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Button
                            variant="outlined"
                            onClick={() => setShowAdvancedCreate((prev) => !prev)}
                        >
                            {showAdvancedCreate
                                ? "Hide Advanced Settings"
                                : "Advanced Settings & Rubric"}
                        </Button>
                    </Grid>

                    {showAdvancedCreate && (
                        <>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Software / Tool</InputLabel>
                                    <Select
                                        label="Software / Tool"
                                        value={form.softwareTool}
                                        onChange={(e) =>
                                            handleFormChange("softwareTool", e.target.value)
                                        }
                                    >
                                        {SOFTWARE_TOOLS.map((tool) => (
                                            <MenuItem key={tool} value={tool}>
                                                {tool}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Submission Type</InputLabel>
                                    <Select
                                        label="Submission Type"
                                        value={form.submissionType}
                                        onChange={(e) =>
                                            handleFormChange(
                                                "submissionType",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        {SUBMISSION_TYPES.map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {type}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Attachment URL (optional fallback)"
                                    value={form.attachmentUrl}
                                    onChange={(e) =>
                                        handleFormChange("attachmentUrl", e.target.value)
                                    }
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Paper
                                    variant="outlined"
                                    sx={{ p: 1.5, borderStyle: "dashed" }}
                                >
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        Teacher Attachment
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Upload a brief, starter file, sample image, or
                                        supporting document students need.
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                                        <Button component="label" variant="outlined" size="small">
                                            Choose Attachment
                                            <input
                                                hidden
                                                type="file"
                                                onChange={(e) =>
                                                    handleFormChange(
                                                        "attachmentFile",
                                                        e.target.files?.[0] || null,
                                                    )
                                                }
                                            />
                                        </Button>
                                        <Typography variant="body2" color="text.secondary">
                                            {form.attachmentFile?.name ||
                                                form.attachmentName ||
                                                "No attachment selected."}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>

                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={form.autoEvaluate}
                                            onChange={(e) =>
                                                handleFormChange(
                                                    "autoEvaluate",
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                    }
                                    label="Enable AIRA auto evaluation for submissions"
                                />
                                <Typography variant="caption" color="text.secondary">
                                    {form.taskType === "Practical Task" ||
                                        form.taskType === "Project Task"
                                        ? "AIRA is assistive for uploaded practical/project work; teacher review should decide final marks."
                                        : "AIRA can give a strong first review for typed answers and code. Teacher final review still controls marks."}
                                </Typography>
                            </Grid>
                        </>
                    )}
                </Grid>

                {showAdvancedCreate && (
                    <>
                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                Rubric
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                AIRA and teacher review will use this marking rubric.
                            </Typography>
                        </Box>

                        {rubric.map((row, index) => (
                            <Grid container spacing={2} sx={{ mb: 1 }} key={index}>
                                <Grid item xs={12} md={7}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Criteria"
                                        value={row.criteria}
                                        onChange={(e) =>
                                            updateRubricRow(
                                                index,
                                                "criteria",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Grid>

                                <Grid item xs={8} md={3}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        label="Marks"
                                        value={row.marks}
                                        onChange={(e) =>
                                            updateRubricRow(
                                                index,
                                                "marks",
                                                e.target.value,
                                            )
                                        }
                                        onWheel={(e) => e.target.blur()}
                                    />
                                </Grid>

                                <Grid item xs={4} md={2}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        color="error"
                                        onClick={() => removeRubricRow(index)}
                                    >
                                        Remove
                                    </Button>
                                </Grid>
                            </Grid>
                        ))}

                        <Button variant="outlined" onClick={addRubricRow} sx={{ mt: 1 }}>
                            Add Rubric Row
                        </Button>
                    </>
                )}

                <Grid container spacing={1.5} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={4}>
                        <Button
                            fullWidth
                            variant="outlined"
                            color="success"
                            onClick={() => createAssignment("draft")}
                            disabled={creating}
                            sx={{ minHeight: 44 }}
                        >
                            Save Draft
                        </Button>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            startIcon={<AddIcon />}
                            onClick={() => createAssignment("active")}
                            disabled={creating}
                            sx={{ minHeight: 44 }}
                        >
                            {creating ? (
                                <CircularProgress size={22} color="inherit" />
                            ) : editingAssignmentId ? (
                                "Update & Publish Task"
                            ) : (
                                "Publish Task"
                            )}
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );

    const renderAssignmentsGivenTab = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                            Assignments Given
                        </Typography>

                        {loadingAssignments ? (
                            <CircularProgress />
                        ) : !assignments.length ? (
                            <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
                                <Typography color="text.secondary">
                                    No assignments created yet.
                                </Typography>
                            </Paper>
                        ) : (
                            assignments.map((assignment) => (
                                <Card
                                    key={assignment._id}
                                    variant="outlined"
                                    sx={{
                                        mb: 2,
                                        borderColor:
                                            selectedAssignment?._id === assignment._id
                                                ? "success.main"
                                                : "divider",
                                    }}
                                >
                                    <CardContent>
                                        <Typography
                                            variant="subtitle1"
                                            sx={{ fontWeight: 700 }}
                                        >
                                            {assignment.title}
                                        </Typography>

                                        <Box
                                            sx={{
                                                display: "flex",
                                                gap: 1,
                                                flexWrap: "wrap",
                                                my: 1,
                                            }}
                                        >
                                            <Chip
                                                label={assignment.softwareTool}
                                                size="small"
                                                color="info"
                                            />
                                            <Chip
                                                label={
                                                    assignment.taskType ||
                                                    assignment.assignmentType
                                                }
                                                size="small"
                                            />
                                            <Chip
                                                label={assignment.status || "active"}
                                                size="small"
                                                color={
                                                    assignment.status === "active"
                                                        ? "success"
                                                        : assignment.status ===
                                                            "closed"
                                                            ? "default"
                                                            : "warning"
                                                }
                                                variant="outlined"
                                            />
                                            <Chip
                                                label={`Max: ${assignment.maxMarks}`}
                                                size="small"
                                                color="success"
                                            />
                                            {assignment.classSection && (
                                                <Chip
                                                    label={assignment.classSection}
                                                    size="small"
                                                    color="warning"
                                                />
                                            )}
                                            <Chip
                                                label={`Submitted: ${reportByAssignment.get(
                                                    String(assignment._id),
                                                )?.totalSubmissions || 0
                                                    }`}
                                                size="small"
                                                variant="outlined"
                                            />
                                            <Chip
                                                label={`Reviewed: ${reportByAssignment.get(
                                                    String(assignment._id),
                                                )?.reviewed || 0
                                                    }`}
                                                size="small"
                                                color="success"
                                                variant="outlined"
                                            />
                                        </Box>

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Due: {assignment.dueDate}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Batch: {assignment.batchName || "-"}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Class / Section:{" "}
                                            {assignment.classSection || "All"}
                                        </Typography>

                                        <Grid container spacing={1} sx={{ mt: 1 }}>
                                            <Grid item xs={12}>
                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    onClick={() =>
                                                        loadSubmissions(assignment)
                                                    }
                                                >
                                                    View Submissions
                                                </Button>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Button
                                                    fullWidth
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() =>
                                                        editAssignment(assignment)
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Button
                                                    fullWidth
                                                    size="small"
                                                    variant="outlined"
                                                    color={
                                                        assignment.status ===
                                                            "active"
                                                            ? "warning"
                                                            : "success"
                                                    }
                                                    onClick={() =>
                                                        updateAssignmentStatus(
                                                            assignment,
                                                            assignment.status ===
                                                                "active"
                                                                ? "closed"
                                                                : "active",
                                                        )
                                                    }
                                                >
                                                    {assignment.status === "active"
                                                        ? "Close"
                                                        : "Publish"}
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={7}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                            Review Selected Assignment
                        </Typography>
                        {!!selectedAssignment && !!submissions.length && (
                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                                {[
                                    ["all", "All"],
                                    ["pending", "Pending Review"],
                                    ["reviewed", "Reviewed"],
                                    ["needs_correction", "Needs Correction"],
                                    ["late_submission", "Late"],
                                ].map(([value, label]) => (
                                    <Button
                                        key={value}
                                        size="small"
                                        variant={
                                            reviewFilter === value
                                                ? "contained"
                                                : "outlined"
                                        }
                                        color="success"
                                        onClick={() => setReviewFilter(value)}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </Box>
                        )}

                        {!selectedAssignment ? (
                            <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
                                <Typography color="text.secondary">
                                    Select an assignment to view submissions.
                                </Typography>
                            </Paper>
                        ) : loadingSubmissions ? (
                            <CircularProgress />
                        ) : !submissions.length ? (
                            <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
                                <Typography color="text.secondary">
                                    No submissions yet for this assignment.
                                </Typography>
                            </Paper>
                        ) : (
                            filteredSubmissions(submissions).map((submission) =>
                                renderReviewCard(submission, selectedAssignment),
                            )
                        )}
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderReviewCard = (submission, assignmentForMarks) => {
        const draft = reviewDrafts[submission._id] || {};

        return (
            <Card key={submission._id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 2,
                            flexWrap: "wrap",
                        }}
                    >
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                {submission.studentName}
                            </Typography>

                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 1,
                                    flexWrap: "wrap",
                                    mt: 1,
                                }}
                            >
                                <Chip
                                    label={submission.status}
                                    size="small"
                                    color={
                                        submission.status === "reviewed"
                                            ? "success"
                                            : submission.status === "needs_correction"
                                                ? "warning"
                                                : "info"
                                    }
                                />

                                {submission.classSection && (
                                    <Chip
                                        label={submission.classSection}
                                        size="small"
                                        color="warning"
                                    />
                                )}

                                {submission.isLate && (
                                    <Chip label="Late" size="small" color="error" />
                                )}
                            </Box>
                        </Box>

                        <Button
                            variant="outlined"
                            startIcon={<SmartToyIcon />}
                            onClick={() => runAiraEvaluation(submission._id)}
                            disabled={evaluatingId === submission._id}
                        >
                            {evaluatingId === submission._id
                                ? "Checking..."
                                : "Run AIRA"}
                        </Button>
                    </Box>

                    {renderSubmissionContent(submission)}

                    {submission.submissionHistory?.length > 0 && (
                        <Paper variant="outlined" sx={{ p: 1.5, mt: 1.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Submission History
                            </Typography>
                            {submission.submissionHistory.map((version, index) => (
                                <Box
                                    key={`${version.submittedAt || "history"}-${index}`}
                                    sx={{
                                        mt: 1,
                                        pt: index ? 1 : 0,
                                        borderTop: index
                                            ? "1px solid"
                                            : "none",

                                        borderColor: "divider",
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary">
                                        Version {index + 1}: {formatDateTime(version.submittedAt)}
                                    </Typography>
                                    {version.textAnswer && (
                                        <Typography
                                            variant="body2"
                                            sx={{ whiteSpace: "pre-wrap" }}
                                        >
                                            {version.textAnswer}
                                        </Typography>
                                    )}
                                    {version.uploadedFileUrl && (
                                        <Typography variant="body2">
                                            <a
                                                href={version.uploadedFileUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {version.uploadedFileName ||
                                                    "Open previous file"}
                                            </a>
                                        </Typography>
                                    )}
                                </Box>
                            ))}
                        </Paper>
                    )}

                    {submission.airaEvaluation?.feedback && (
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                mt: 2,
                                bgcolor: isDark
                                    ? "rgba(34,197,94,.10)"
                                    : "#f8fff8",
                            }}
                        >
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                AIRA Evaluation
                            </Typography>

                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Suggested Marks:{" "}
                                <b>
                                    {submission.airaEvaluation.suggestedMarks} /{" "}
                                    {assignmentForMarks?.maxMarks ||
                                        submission.maxMarks ||
                                        0}
                                </b>
                            </Typography>

                            <Typography
                                variant="body2"
                                sx={{ mt: 1, whiteSpace: "pre-wrap" }}
                            >
                                {submission.airaEvaluation.feedback}
                            </Typography>
                        </Paper>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Final Marks"
                                value={draft.finalMarks ?? ""}
                                onChange={(e) =>
                                    updateReviewDraft(
                                        submission._id,
                                        "finalMarks",
                                        e.target.value,
                                    )
                                }
                                onWheel={(e) => e.target.blur()}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    label="Status"
                                    value={draft.status || "reviewed"}
                                    onChange={(e) =>
                                        updateReviewDraft(
                                            submission._id,
                                            "status",
                                            e.target.value,
                                        )
                                    }
                                >
                                    {REVIEW_STATUS.map((status) => (
                                        <MenuItem
                                            key={status.value}
                                            value={status.value}
                                        >
                                            {status.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={5}>
                            <TextField
                                fullWidth
                                label="Teacher Comment"
                                value={draft.teacherComment || ""}
                                onChange={(e) =>
                                    updateReviewDraft(
                                        submission._id,
                                        "teacherComment",
                                        e.target.value,
                                    )
                                }
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="success"
                                startIcon={<RateReviewIcon />}
                                onClick={() => reviewSubmission(submission._id)}
                                disabled={reviewingId === submission._id}
                            >
                                {reviewingId === submission._id
                                    ? "Saving Review..."
                                    : "Save Review"}
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        );
    };

    const renderSubmittedAssignmentsTab = () => {
        if (loadingAllSubmissions) {
            return <CircularProgress />;
        }

        if (!allSubmissions.length) {
            return (
                <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
                    <Typography color="text.secondary">
                        No submitted assignments yet.
                    </Typography>
                </Paper>
            );
        }

        return (
            <>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                    {[
                        ["all", "All"],
                        ["pending", "Pending Review"],
                        ["reviewed", "Reviewed"],
                        ["needs_correction", "Needs Correction"],
                        ["late_submission", "Late"],
                    ].map(([value, label]) => (
                        <Button
                            key={value}
                            size="small"
                            variant={reviewFilter === value ? "contained" : "outlined"}
                            color="success"
                            onClick={() => setReviewFilter(value)}
                        >
                            {label}
                        </Button>
                    ))}
                </Box>
                <Grid container spacing={2}>
                    {filteredSubmissions(allSubmissions).map((submission) => (
                        <Grid item xs={12} md={6} key={submission._id}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: 2,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <Box>
                                            <Typography
                                                variant="subtitle1"
                                                sx={{ fontWeight: 700 }}
                                            >
                                                {submission.assignmentTitle ||
                                                    submission.assignment?.title ||
                                                    "Assignment"}
                                            </Typography>
                                            <Typography variant="body2">
                                                <b>Student:</b>{" "}
                                                {submission.studentName || "-"}
                                            </Typography>
                                            <Typography variant="body2">
                                                <b>Batch:</b>{" "}
                                                {submission.batchName ||
                                                    submission.assignment?.batchName ||
                                                    "-"}
                                            </Typography>
                                            <Typography variant="body2">
                                                <b>Class / Section:</b>{" "}
                                                {submission.classSection ||
                                                    submission.assignment?.classSection ||
                                                    "All"}
                                            </Typography>
                                            <Typography variant="body2">
                                                <b>Submitted:</b>{" "}
                                                {formatDateTime(submission.submittedAt)}
                                            </Typography>
                                        </Box>

                                        <Chip
                                            label={submission.status || "submitted"}
                                            size="small"
                                            color={
                                                submission.status === "reviewed"
                                                    ? "success"
                                                    : submission.status ===
                                                        "needs_correction"
                                                        ? "warning"
                                                        : "info"
                                            }
                                        />
                                    </Box>

                                    {submission.isLate && (
                                        <Chip
                                            label="Late"
                                            size="small"
                                            color="error"
                                            sx={{ mt: 1 }}
                                        />
                                    )}

                                    {renderSubmissionContent(submission)}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </>
        );
    };

    const renderReportsTab = () => (
        <Card>
            <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Assignment Report
                </Typography>

                {loadingReport ? (
                    <CircularProgress />
                ) : !assignmentReport.length ? (
                    <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
                        <Typography color="text.secondary">
                            No report data available.
                        </Typography>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Assignment</TableCell>
                                    <TableCell>Tool</TableCell>
                                    <TableCell>Class / Section</TableCell>
                                    <TableCell>Total</TableCell>
                                    <TableCell>Submissions</TableCell>
                                    <TableCell>Reviewed</TableCell>
                                    <TableCell>Needs Correction</TableCell>
                                    <TableCell>Late</TableCell>
                                    <TableCell>Pending Review</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {assignmentReport.map((row) => (
                                    <TableRow key={row.assignmentId || row._id}>
                                        <TableCell>{row.title}</TableCell>
                                        <TableCell>{row.softwareTool}</TableCell>
                                        <TableCell>
                                            {row.classSection || "All"}
                                        </TableCell>
                                        <TableCell>{row.total || "-"}</TableCell>
                                        <TableCell>
                                            {row.totalSubmissions || 0}
                                        </TableCell>
                                        <TableCell>{row.reviewed || 0}</TableCell>
                                        <TableCell>
                                            {row.needsCorrection || 0}
                                        </TableCell>
                                        <TableCell>{row.late || 0}</TableCell>
                                        <TableCell>
                                            {row.pendingReview || 0}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ p: 2 }}>
            <Snackbar
                open={openSnackbar}
                autoHideDuration={5000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setOpenSnackbar(false)}
                    severity={snackbarSeverity}
                    sx={{ width: "100%" }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Assignments & Student Submissions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Create assignments, collect student work, review submissions,
                    use AIRA, and track reports.
                </Typography>
            </Box>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Select Batch</InputLabel>
                                <Select
                                    label="Select Batch"
                                    value={selectedBatchId}
                                    onChange={(e) =>
                                        setSelectedBatchId(e.target.value)
                                    }
                                    disabled={loadingBatches}
                                >
                                    {batches.map((batch) => (
                                        <MenuItem key={batch._id} value={batch._id}>
                                            {batch.batchName ||
                                                batch.name ||
                                                "Unnamed Batch"}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mt: 0.75 }}
                            >
                                Pick the batch first. Class, course, and chapter
                                options load from this selection.
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="success"
                                startIcon={<RefreshIcon />}
                                onClick={refreshAll}
                            >
                                Refresh
                            </Button>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="success"
                                startIcon={<FileDownloadIcon />}
                                onClick={exportReportCSV}
                                disabled={!assignmentReport.length}
                            >
                                Export Report CSV
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Paper
                variant="outlined"
                sx={{
                    mb: 3,
                    p: 0.75,
                    bgcolor: isDark
                        ? "background.paper"
                        : "#f4f7f4",
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={(event, newValue) => setActiveTab(newValue)}
                    indicatorColor="success"
                    textColor="success"
                    variant="fullWidth"
                    sx={{
                        minHeight: 50,
                        "& .MuiTabs-indicator": {
                            height: 4,
                            borderRadius: "4px 4px 0 0",
                        },
                        "& .MuiTab-root": {
                            minHeight: 50,
                            borderRadius: 1,
                            fontWeight: 700,
                            textTransform: "none",
                        },
                        "& .Mui-selected": {
                            backgroundColor: "success.main",
                            color: "#fff !important",
                        },
                    }}
                >
                    <Tab label="Create Assignment" />
                    <Tab label={`Assignments Given (${assignments.length})`} />
                    <Tab label={`Submitted Assignments (${allSubmissions.length})`} />
                    <Tab label="Reports" />
                </Tabs>
            </Paper>

            {activeTab === 0 && renderCreateAssignmentTab()}
            {activeTab === 1 && renderAssignmentsGivenTab()}
            {activeTab === 2 && renderSubmittedAssignmentsTab()}
            {activeTab === 3 && renderReportsTab()}
        </Box>
    );
};

export default TeacherAssignments;
