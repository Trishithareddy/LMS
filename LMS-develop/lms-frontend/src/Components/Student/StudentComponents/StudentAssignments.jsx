import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    Paper,
    Snackbar,
    Tab,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import RefreshIcon from "@mui/icons-material/Refresh";

const StudentAssignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submittingId, setSubmittingId] = useState("");
    const [uploadingId, setUploadingId] = useState("");
    const [activeTab, setActiveTab] = useState(0);

    const [submissionDrafts, setSubmissionDrafts] = useState({});

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    const getAuthHeaders = () => {
        const token =
            localStorage.getItem("token") ||
            localStorage.getItem("authToken") ||
            localStorage.getItem("studentToken");

        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const showSnackbar = (message, severity = "success") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const fetchAssignments = async () => {
        try {
            setLoading(true);

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/assignments/student`,
                { headers: getAuthHeaders() }
            );

            const data = response.data?.assignments || [];
            setAssignments(data);

            const drafts = {};
            data.forEach((assignment) => {
                drafts[assignment._id] = {
                    textAnswer: assignment.submission?.textAnswer || "",
                    codeAnswer: assignment.submission?.codeAnswer || "",
                    fileUrl: assignment.submission?.fileUrl || "",
                    fileName: assignment.submission?.fileName || "",
                    uploadedFileUrl:
                        assignment.submission?.uploadedFileUrl || "",
                    uploadedFileName:
                        assignment.submission?.uploadedFileName || "",
                    uploadedFileType:
                        assignment.submission?.uploadedFileType || "",
                    uploadedFileSize:
                        assignment.submission?.uploadedFileSize || 0,
                    projectLink: assignment.submission?.projectLink || "",
                    studentNote: assignment.submission?.studentNote || "",
                };
            });

            setSubmissionDrafts(drafts);
        } catch (error) {
            console.error("Error fetching student assignments:", error);
            showSnackbar(
                error.response?.data?.message || "Failed to fetch assignments",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, []);

    const pendingAssignments = useMemo(() => {
        return assignments.filter((assignment) => !assignment.submission);
    }, [assignments]);

    const submittedAssignments = useMemo(() => {
        return assignments.filter((assignment) => assignment.submission);
    }, [assignments]);

    const updateDraft = (assignmentId, field, value) => {
        setSubmissionDrafts((prev) => ({
            ...prev,
            [assignmentId]: {
                ...(prev[assignmentId] || {}),
                [field]: value,
            },
        }));
    };

    const isSubmissionValid = (assignment, draft) => {
        const submissionType = assignment.submissionType || "Mixed Submission";

        if (submissionType === "Text Answer") {
            return Boolean(draft.textAnswer?.trim());
        }

        if (submissionType === "Code Answer") {
            return Boolean(draft.codeAnswer?.trim());
        }

        if (submissionType === "File URL") {
            return Boolean(draft.fileUrl?.trim());
        }

        if (submissionType === "File Upload") {
            return Boolean(draft.uploadedFileUrl?.trim() || draft.file);
        }

        if (submissionType === "Project Link") {
            return Boolean(draft.projectLink?.trim());
        }

        return Boolean(
            draft.textAnswer?.trim() ||
            draft.codeAnswer?.trim() ||
            draft.fileUrl?.trim() ||
            draft.projectLink?.trim() ||
            draft.studentNote?.trim()
        );
    };

    const getValidationMessage = (assignment) => {
        const submissionType = assignment.submissionType || "Mixed Submission";

        if (submissionType === "Text Answer") {
            return "Please enter your answer before submitting.";
        }

        if (submissionType === "Code Answer") {
            return "Please enter your code before submitting.";
        }

        if (submissionType === "File URL") {
            return "Please paste your file URL before submitting.";
        }

        if (submissionType === "File Upload") {
            return "Please upload your completed file before submitting.";
        }

        if (submissionType === "Project Link") {
            return "Please paste your project link before submitting.";
        }

        return "Please add your answer/code/file link/project link before submitting.";
    };

    const uploadAssignmentFile = async (assignmentId, file) => {
        if (!file) return null;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("assignmentId", assignmentId);

        try {
            setUploadingId(assignmentId);

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/assignments/submission-file`,
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
            setUploadingId("");
        }
    };

    const submitAssignment = async (assignmentId) => {
        const assignment = assignments.find(
            (item) => String(item._id) === String(assignmentId)
        );

        const draft = submissionDrafts[assignmentId] || {};

        if (!isSubmissionValid(assignment || {}, draft)) {
            showSnackbar(getValidationMessage(assignment || {}), "error");
            return;
        }

        try {
            setSubmittingId(assignmentId);
            const uploadedFile = await uploadAssignmentFile(
                assignmentId,
                draft.file,
            );

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/assignments/submit`,
                {
                    assignmentId,
                    textAnswer: draft.textAnswer || "",
                    codeAnswer: draft.codeAnswer || "",
                    fileUrl: draft.fileUrl || "",
                    fileName: draft.fileName || "",
                    uploadedFileUrl:
                        uploadedFile?.url || draft.uploadedFileUrl || "",
                    uploadedFileName:
                        uploadedFile?.name || draft.uploadedFileName || "",
                    uploadedFileType:
                        uploadedFile?.type || draft.uploadedFileType || "",
                    uploadedFileSize:
                        uploadedFile?.size || draft.uploadedFileSize || 0,
                    projectLink: draft.projectLink || "",
                    studentNote: draft.studentNote || "",
                },
                { headers: getAuthHeaders() }
            );

            if (response.data?.success) {
                showSnackbar("Assignment submitted successfully", "success");
                await fetchAssignments();
                setActiveTab(1);
            }
        } catch (error) {
            console.error("Error submitting assignment:", error);
            showSnackbar(
                error.response?.data?.message || "Failed to submit assignment",
                "error"
            );
        } finally {
            setSubmittingId("");
        }
    };

    const formatDateTime = (value) => {
        if (!value) return "-";

        try {
            return new Date(value).toLocaleString();
        } catch {
            return "-";
        }
    };

    const getStatusColor = (status) => {
        if (status === "reviewed") return "success";
        if (status === "needs_correction") return "warning";
        if (status === "late_submission") return "error";
        return "info";
    };

    const getSubmissionGuide = (assignment) => {
        const submissionType = assignment.submissionType || "Mixed Submission";

        if (submissionType === "Text Answer") {
            return {
                title: "Type your answer",
                description:
                    "Write your response in the answer box below and submit it when it is ready.",
            };
        }

        if (submissionType === "Code Answer") {
            return {
                title: "Type or paste your code",
                description:
                    "Use the code box below for your solution. Check the problem statement and expected output before submitting.",
            };
        }

        if (submissionType === "File URL") {
            return {
                title: "Share your completed file",
                description:
                    "Paste the accessible file link below and add the file name your teacher should check.",
            };
        }

        if (submissionType === "File Upload") {
            return {
                title: "Upload your completed work",
                description:
                    "Choose the finished file from your device. Add a short note if your teacher needs context.",
            };
        }

        if (submissionType === "Project Link") {
            return {
                title: "Share your project link",
                description:
                    "Paste the project link below after checking that your teacher can open it.",
            };
        }

        return {
            title: "Add your work",
            description:
                "Use the answer, code, file, or project field that matches your work before submitting.",
        };
    };

    const getDueLabel = (assignment, isLate) => {
        if (assignment.submission) return "Submitted";
        if (isLate) return "Past Due";
        if (assignment.dueDate === new Date().toISOString().split("T")[0]) {
            return "Due Today";
        }

        return "Pending";
    };

    const renderAssignmentDetails = (assignment) => {
        const detailRows = [];

        if (assignment.expectedAnswerLength) {
            detailRows.push({
                label: "Expected Answer Length",
                value: assignment.expectedAnswerLength,
            });
        }

        if (assignment.problemStatement) {
            detailRows.push({
                label: "Problem Statement",
                value: assignment.problemStatement,
            });
        }

        if (assignment.starterCode) {
            detailRows.push({
                label: "Starter Code",
                value: assignment.starterCode,
                code: true,
            });
        }

        if (assignment.expectedOutput) {
            detailRows.push({
                label: "Expected Output",
                value: assignment.expectedOutput,
            });
        }

        if (assignment.testCases) {
            detailRows.push({
                label: "Test Cases / Sample Inputs",
                value: assignment.testCases,
            });
        }

        if (assignment.practicalSteps) {
            detailRows.push({
                label: "Practical Steps",
                value: assignment.practicalSteps,
            });
        }

        if (assignment.projectRequirements) {
            detailRows.push({
                label: "Project Requirements",
                value: assignment.projectRequirements,
            });
        }

        if (assignment.worksheetUrl) {
            detailRows.push({
                label: "Worksheet URL",
                value: assignment.worksheetUrl,
                link: true,
            });
        }

        if (assignment.allowedFileTypes) {
            detailRows.push({
                label: "Allowed File Types",
                value: assignment.allowedFileTypes,
            });
        }

        if (assignment.fileNameInstruction) {
            detailRows.push({
                label: "File Name / Submission Instruction",
                value: assignment.fileNameInstruction,
            });
        }

        if (!detailRows.length) return null;

        return (
            <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: "background.default" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    Assignment Details
                </Typography>

                {detailRows.map((row, index) => (
                    <Box key={index} sx={{ mb: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {row.label}
                        </Typography>

                        {row.link ? (
                            <Typography variant="body2">
                                <a href={row.value} target="_blank" rel="noreferrer">
                                    {row.value}
                                </a>
                            </Typography>
                        ) : row.code ? (
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 1.5,
                                    mt: 0.5,
                                    backgroundColor: (theme) =>
                                        theme.palette.mode === "dark"
                                            ? theme.palette.grey[900]
                                            : theme.palette.grey[100],
                                    whiteSpace: "pre-wrap",
                                    fontFamily: "monospace",
                                    fontSize: 13,
                                }}
                            >
                                {row.value}
                            </Paper>
                        ) : (
                            <Typography
                                variant="body2"
                                sx={{ whiteSpace: "pre-wrap" }}
                            >
                                {row.value}
                            </Typography>
                        )}
                    </Box>
                ))}
            </Paper>
        );
    };

    const renderRubric = (assignment) => {
        const rubric = assignment.rubric || [];

        if (!rubric.length) return null;

        return (
            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    Rubric
                </Typography>

                {rubric.map((row, index) => (
                    <Box
                        key={index}
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 2,
                            py: 0.5,
                            borderBottom:
                                index === rubric.length - 1
                                    ? "none"
                                    : "1px solid #eee",
                        }}
                    >
                        <Typography variant="body2">{row.criteria}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {row.marks} marks
                        </Typography>
                    </Box>
                ))}
            </Paper>
        );
    };

    const renderSubmissionFields = (assignment) => {
        const draft = submissionDrafts[assignment._id] || {};
        const submissionType = assignment.submissionType || "Mixed Submission";
        const guide = getSubmissionGuide(assignment);

        const showText =
            submissionType === "Text Answer" || submissionType === "Mixed Submission";

        const showCode =
            submissionType === "Code Answer" || submissionType === "Mixed Submission";

        const showFile =
            submissionType === "File URL" || submissionType === "Mixed Submission";

        const showUpload =
            submissionType === "File Upload" ||
            submissionType === "Mixed Submission";

        const showProject =
            submissionType === "Project Link" ||
            assignment.taskType === "Project Task" ||
            submissionType === "Mixed Submission";
        const fileAccept = assignment.allowedFileTypes
            ? assignment.allowedFileTypes
                .split(/[,/ ]+/)
                .filter(Boolean)
                .map((type) => `.${type.replace(/^\./, "")}`)
                .join(",")
            : undefined;

        return (
            <Paper
                variant="outlined"
                sx={{
                    mt: 1.5,
                    p: { xs: 1.5, md: 2 },
                    borderColor: "success.light",
                    backgroundColor: (theme) =>
                        theme.palette.mode === "dark"
                            ? theme.palette.grey[900]
                            : "#f8fff9",
                }}
            >
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {guide.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {guide.description}
                    </Typography>
                </Box>

                <Grid container spacing={2}>
                    {showText && (
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                minRows={4}
                                label="Your Answer"
                                placeholder="Type your answer here"
                                value={draft.textAnswer || ""}
                                onChange={(e) =>
                                    updateDraft(
                                        assignment._id,
                                        "textAnswer",
                                        e.target.value
                                    )
                                }
                            />
                        </Grid>
                    )}

                    {showCode && (
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                minRows={7}
                                label="Your Code"
                                placeholder="Paste or type your code here"
                                value={draft.codeAnswer || ""}
                                onChange={(e) =>
                                    updateDraft(
                                        assignment._id,
                                        "codeAnswer",
                                        e.target.value
                                    )
                                }
                                InputProps={{
                                    sx: {
                                        fontFamily: "monospace",
                                        fontSize: 14,
                                    },
                                }}
                            />
                        </Grid>
                    )}

                    {showFile && (
                        <>
                            <Grid item xs={12} md={8}>
                                <TextField
                                    fullWidth
                                    label="File URL"
                                    placeholder="Paste Google Drive / uploaded file link"
                                    value={draft.fileUrl || ""}
                                    onChange={(e) =>
                                        updateDraft(
                                            assignment._id,
                                            "fileUrl",
                                            e.target.value
                                        )
                                    }
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="File Name"
                                    placeholder="Example: Riya_Project.pdf"
                                    value={draft.fileName || ""}
                                    onChange={(e) =>
                                        updateDraft(
                                            assignment._id,
                                            "fileName",
                                            e.target.value
                                        )
                                    }
                                />
                            </Grid>
                        </>
                    )}

                    {showUpload && (
                        <Grid item xs={12}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 1.5,
                                    borderStyle: "dashed",
                                    bgcolor: "background.default",
                                    borderColor: "divider",
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 700, mb: 1 }}
                                >
                                    Upload File
                                </Typography>
                                <Button variant="contained" component="label">
                                    Choose File
                                    <input
                                        hidden
                                        type="file"
                                        accept={fileAccept}
                                        onChange={(e) =>
                                            updateDraft(
                                                assignment._id,
                                                "file",
                                                e.target.files?.[0] || null,
                                            )
                                        }
                                    />
                                </Button>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 1 }}
                                >
                                    {draft.file?.name ||
                                        draft.uploadedFileName ||
                                        "No file selected yet."}
                                </Typography>
                                {assignment.allowedFileTypes && (
                                    <Typography variant="caption" color="text.secondary">
                                        Accepted: {assignment.allowedFileTypes}
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>
                    )}

                    {showProject && (
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Project Link"
                                placeholder="Paste project link here"
                                value={draft.projectLink || ""}
                                onChange={(e) =>
                                    updateDraft(
                                        assignment._id,
                                        "projectLink",
                                        e.target.value
                                    )
                                }
                            />
                        </Grid>
                    )}

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            label="Student Note (optional)"
                            placeholder="Any note for your teacher"
                            value={draft.studentNote || ""}
                            onChange={(e) =>
                                updateDraft(
                                    assignment._id,
                                    "studentNote",
                                    e.target.value
                                )
                            }
                        />
                    </Grid>
                </Grid>
            </Paper>
        );
    };

    const renderSubmittedContent = (submission) => {
        if (!submission) return null;

        return (
            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    Your Submission
                </Typography>

                {submission.textAnswer && (
                    <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap", mb: 1 }}
                    >
                        <b>Answer:</b> {submission.textAnswer}
                    </Typography>
                )}

                {submission.codeAnswer && (
                    <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Code:
                        </Typography>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 1.5,
                                backgroundColor: "#f5f5f5",
                                whiteSpace: "pre-wrap",
                                fontFamily: "monospace",
                                fontSize: 13,
                            }}
                        >
                            {submission.codeAnswer}
                        </Paper>
                    </Box>
                )}

                {submission.fileUrl && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <b>File:</b>{" "}
                        <a
                            href={submission.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
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
                        <a
                            href={submission.projectLink}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {submission.projectLink}
                        </a>
                    </Typography>
                )}

                {submission.studentNote && (
                    <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap", mb: 1 }}
                    >
                        <b>Note:</b> {submission.studentNote}
                    </Typography>
                )}

                <Typography variant="body2" color="text.secondary">
                    Submitted At: {formatDateTime(submission.submittedAt)}
                </Typography>

                {submission.submissionHistory?.length > 0 && (
                    <Paper variant="outlined" sx={{ p: 1.5, mt: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Previous submissions
                        </Typography>
                        {submission.submissionHistory.map((version, index) => (
                            <Typography
                                key={`${version.submittedAt || "version"}-${index}`}
                                variant="caption"
                                sx={{ display: "block", mt: 0.5 }}
                            >
                                Version {index + 1}:{" "}
                                {formatDateTime(version.submittedAt)}
                                {version.uploadedFileUrl && (
                                    <>
                                        {" "}-
                                        <a
                                            href={version.uploadedFileUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {" "}open file
                                        </a>
                                    </>
                                )}
                            </Typography>
                        ))}
                    </Paper>
                )}
            </Paper>
        );
    };

    const renderReviewFeedback = (submission, assignment) => {
        if (!submission) return null;

        const hasAira =
            submission.airaEvaluation?.feedback ||
            submission.airaEvaluation?.suggestedMarks !== null;

        const hasTeacherReview =
            submission.finalMarks !== null ||
            submission.teacherComment ||
            submission.status === "reviewed" ||
            submission.status === "needs_correction";

        if (!hasAira && !hasTeacherReview) return null;

        return (
            <Paper variant="outlined" sx={{ p: 2, mt: 2, backgroundColor: "#f8fff8" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    Review / Feedback
                </Typography>

                {hasAira && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            AIRA Evaluation
                        </Typography>

                        {submission.airaEvaluation?.suggestedMarks !== null && (
                            <Typography variant="body2">
                                Suggested Marks:{" "}
                                <b>
                                    {submission.airaEvaluation.suggestedMarks} /{" "}
                                    {assignment.maxMarks}
                                </b>
                            </Typography>
                        )}

                        {submission.airaEvaluation?.feedback && (
                            <Typography
                                variant="body2"
                                sx={{ whiteSpace: "pre-wrap", mt: 1 }}
                            >
                                {submission.airaEvaluation.feedback}
                            </Typography>
                        )}

                        {submission.airaEvaluation?.strengths?.length > 0 && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                <b>Strengths:</b>{" "}
                                {submission.airaEvaluation.strengths.join(", ")}
                            </Typography>
                        )}

                        {submission.airaEvaluation?.improvements?.length > 0 && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                <b>Improvements:</b>{" "}
                                {submission.airaEvaluation.improvements.join(", ")}
                            </Typography>
                        )}
                    </Box>
                )}

                {hasTeacherReview && (
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Teacher Review
                        </Typography>

                        {submission.finalMarks !== null && (
                            <Typography variant="body2">
                                Final Marks:{" "}
                                <b>
                                    {submission.finalMarks} / {assignment.maxMarks}
                                </b>
                            </Typography>
                        )}

                        {submission.teacherComment && (
                            <Typography
                                variant="body2"
                                sx={{ whiteSpace: "pre-wrap", mt: 1 }}
                            >
                                {submission.teacherComment}
                            </Typography>
                        )}
                    </Box>
                )}
            </Paper>
        );
    };

    const renderAssignmentCard = (assignment, isSubmitted = false) => {
        const submission = assignment.submission;
        const isLate =
            assignment.dueDate &&
            new Date(assignment.dueDate) < new Date(new Date().toDateString());

        return (
            <Card
                key={assignment._id}
                sx={{
                    mb: 3,
                    border: "1px solid",
                    borderColor: isSubmitted ? "divider" : "success.light",
                    boxShadow: isSubmitted ? 1 : 2,
                }}
            >
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
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                {assignment.title}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                            >
                                {assignment.description}
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                display: "flex",
                                gap: 1,
                                flexWrap: "wrap",
                                alignItems: "flex-start",
                            }}
                        >
                            <Chip
                                label={assignment.assignmentType}
                                size="small"
                                color="primary"
                            />
                            <Chip
                                label={assignment.submissionType}
                                size="small"
                                color="info"
                            />
                            <Chip
                                label={`${assignment.maxMarks} marks`}
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
                            {submission && (
                                <Chip
                                    label={submission.status || "submitted"}
                                    size="small"
                                    color={getStatusColor(submission.status)}
                                />
                            )}
                            {!submission && (
                                <Chip
                                    label={getDueLabel(assignment, isLate)}
                                    size="small"
                                    color={isLate ? "error" : "warning"}
                                    variant={isLate ? "filled" : "outlined"}
                                />
                            )}
                        </Box>
                    </Box>

                    <Grid container spacing={1} sx={{ mt: 2 }}>
                        <Grid item xs={12} md={3}>
                            <Typography variant="body2">
                                <b>Due Date:</b> {assignment.dueDate}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Typography variant="body2">
                                <b>Course:</b> {assignment.courseName || "-"}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Typography variant="body2">
                                <b>Chapter:</b> {assignment.chapterName || "-"}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Typography variant="body2">
                                <b>Tool:</b> {assignment.softwareTool || "General"}
                            </Typography>
                        </Grid>
                    </Grid>

                    {assignment.attachmentUrl && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <b>Attachment:</b>{" "}
                            <a
                                href={assignment.attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Open attachment
                            </a>
                        </Typography>
                    )}

                    {isLate && !submission && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            This assignment is past the due date. It may be marked
                            as late after submission.
                        </Alert>
                    )}

                    {isSubmitted && submission?.status !== "needs_correction" ? (
                        <>
                            {renderAssignmentDetails(assignment)}
                            {renderRubric(assignment)}
                            {renderSubmittedContent(submission)}
                            {renderReviewFeedback(submission, assignment)}
                        </>
                    ) : (
                        <>
                            {submission?.status === "needs_correction" && (
                                <Alert severity="warning" sx={{ mt: 2 }}>
                                    Your teacher asked for corrections. Update
                                    your work below and resubmit.
                                </Alert>
                            )}

                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 1.5,
                                    borderStyle: "dashed",
                                    bgcolor: "background.paper",
                                    borderColor: "divider",
                                }}
                            >
                                <Typography
                                    variant="overline"
                                    sx={{ color: "success.dark" }}
                                >
                                    Student Work Area
                                </Typography>
                                <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 700, lineHeight: 1.25 }}
                                >
                                    Complete and submit this assignment here
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.5 }}
                                >
                                    Your teacher expects a{" "}
                                    <b>
                                        {assignment.submissionType ||
                                            "Mixed Submission"}
                                    </b>{" "}
                                    for this assignment.
                                </Typography>

                                {renderSubmissionFields(assignment)}

                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="success"
                                    startIcon={<SendIcon />}
                                    onClick={() => submitAssignment(assignment._id)}
                                    disabled={
                                        submittingId === assignment._id ||
                                        uploadingId === assignment._id
                                    }
                                    sx={{ mt: 2, minHeight: 46 }}
                                >
                                    {submittingId === assignment._id ||
                                        uploadingId === assignment._id ? (
                                        <CircularProgress
                                            size={22}
                                            color="inherit"
                                        />
                                    ) : (
                                        submission?.status ===
                                            "needs_correction"
                                            ? "Resubmit Corrected Work"
                                            : "Submit Assignment"
                                    )}
                                </Button>
                            </Paper>

                            {renderAssignmentDetails(assignment)}
                            {renderRubric(assignment)}
                        </>
                    )}
                </CardContent>
            </Card>
        );
    };

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
                    My Assignments
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    View assignments, submit your work, and check teacher/AIRA
                    feedback.
                </Typography>
            </Box>

            <Paper
                variant="outlined"
                sx={{
                    mb: 3,
                    p: 0.75,
                    bgcolor: "background.paper",
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={(e, value) => setActiveTab(value)}
                    variant="fullWidth"
                    indicatorColor="success"
                    textColor="inherit"
                    sx={{
                        "& .MuiTabs-indicator": {
                            display: "none",
                        },

                        "& .MuiTab-root": {
                            minHeight: 48,
                            borderRadius: 1,
                            textTransform: "none",
                            fontWeight: 700,
                            color: "text.primary",      // <-- visible in both themes
                        },

                        "& .MuiTab-root.Mui-selected": {
                            bgcolor: "success.main",
                            color: "#fff",
                        },
                    }}
                >
                    <Tab label={`Pending (${pendingAssignments.length})`} />
                    <Tab label={`Submitted (${submittedAssignments.length})`} />
                </Tabs>
            </Paper>

            <Box sx={{ mb: 2 }}>
                <Button
                    variant="contained"
                    color="success"
                    startIcon={<RefreshIcon />}
                    onClick={fetchAssignments}
                    disabled={loading}
                >
                    Refresh
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ textAlign: "center", mt: 5 }}>
                    <CircularProgress />
                </Box>
            ) : activeTab === 0 ? (
                pendingAssignments.length ? (
                    pendingAssignments.map((assignment) =>
                        renderAssignmentCard(assignment, false)
                    )
                ) : (
                    <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
                        <Typography color="text.secondary">
                            No pending assignments.
                        </Typography>
                    </Paper>
                )
            ) : submittedAssignments.length ? (
                submittedAssignments.map((assignment) =>
                    renderAssignmentCard(assignment, true)
                )
            ) : (
                <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
                    <Typography color="text.secondary">
                        No submitted assignments yet.
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default StudentAssignments;
