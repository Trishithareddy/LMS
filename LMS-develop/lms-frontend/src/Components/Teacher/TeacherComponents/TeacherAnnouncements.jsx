import React, { useContext, useState, useEffect, useRef, useMemo } from "react";
import JoditEditor from "jodit-react";
import axios from "axios";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useTheme } from "@mui/material/styles";

import { BreadcrumbContext } from "../../BreadcrumbContext";

const announcementTypeOptions = [
    { value: "general", label: "General Notice" },
    { value: "reminder", label: "Reminder" },
    { value: "activity", label: "Activity Update" },
    { value: "assessment", label: "Assessment Update" },
    { value: "urgent", label: "Urgent Notice" },
    { value: "event", label: "Event / Circular" },
];

const priorityOptions = [
    { value: "normal", label: "Normal" },
    { value: "important", label: "Important" },
    { value: "urgent", label: "Urgent" },
];

const priorityColors = {
    normal: { bg: "#eef6ff", color: "#1d4ed8" },
    important: { bg: "#fff7ed", color: "#c2410c" },
    urgent: { bg: "#fef2f2", color: "#b91c1c" },
};

const stripHtml = (value = "") => {
    const div = document.createElement("div");
    div.innerHTML = value;
    return div.textContent || div.innerText || "";
};

const getAnnouncementDefaults = () => ({
    id: null,
    title: "",
    announcementType: "general",
    priority: "normal",
    isPinned: false,
    isReminder: false,
    expiresAt: "",
    linkUrl: "",
    linkLabel: "",
    announcementContent: "",
    selectedBatches: [],
});

function TeacherAnnouncements() {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [batches, setBatches] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [announcements, setAnnouncements] = useState([]);
    const [formState, setFormState] = useState(getAnnouncementDefaults());
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [loading, setLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const editor = useRef(null);

    const config = useMemo(
        () => ({
            theme: isDark ? "dark" : "light",
            height: "320px",
            width: "100%",
            uploader: {
                insertImageAsBase64URI: false,
                url: `${import.meta.env.VITE_API_URL}/lessons/upload-image`,
                format: "json",
            },
        }),
        [isDark]
    );

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Teacher Dashboard", path: "/teacher-dashboard" },
            { name: "Announcements", path: "/teacher-dashboard/announcements" },
        ]);
    }, [setBreadcrumbTrail]);

    const handleSnackbarOpen = (message, severity) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    const fetchAllBatches = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/teacher/get/AllBatches`,
                { headers }
            );
            setBatches(response?.data?.teacher?.batches || response?.data?.batches || []);
        } catch (error) {
            console.error("Error fetching batches:", error);
            handleSnackbarOpen("Could not load batches", "error");
        }
    };

    const fetchAnnouncements = async () => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/teacher/announcements`,
                { headers }
            );
            setAnnouncements(res.data.announcements || []);
        } catch (err) {
            console.error("Error fetching announcements", err);
            handleSnackbarOpen("Could not load announcements", "error");
        }
    };

    useEffect(() => {
        fetchAllBatches();
    }, []);

    useEffect(() => {
        if (tabValue === 1) {
            fetchAnnouncements();
        }
    }, [tabValue]);

    const resetForm = () => {
        setFormState(getAnnouncementDefaults());
    };

    const buildPayload = () => ({
        title: formState.title.trim(),
        announcementType: formState.announcementType,
        priority: formState.priority,
        isPinned: formState.isPinned,
        isReminder: formState.isReminder,
        expiresAt: formState.expiresAt || null,
        linkUrl: formState.linkUrl.trim(),
        linkLabel: formState.linkLabel.trim(),
        announcementContent: formState.announcementContent,
        batches: formState.selectedBatches.map((batch) => ({ _id: batch._id })),
    });

    const handleSaveAnnouncement = async () => {
        if (!formState.title.trim()) {
            handleSnackbarOpen("Please add a title", "error");
            return;
        }
        if (!formState.announcementContent.trim()) {
            handleSnackbarOpen("Please add announcement content", "error");
            return;
        }
        if (formState.selectedBatches.length === 0) {
            handleSnackbarOpen("Select at least one batch", "error");
            return;
        }

        setLoading(true);
        try {
            const payload = buildPayload();
            if (formState.id) {
                await axios.put(
                    `${import.meta.env.VITE_API_URL}/teacher/announcement/${formState.id}`,
                    payload,
                    { headers }
                );
                handleSnackbarOpen("Announcement updated successfully", "success");
            } else {
                await axios.post(
                    `${import.meta.env.VITE_API_URL}/teacher/create/announcement`,
                    payload,
                    {
                        headers: {
                            ...headers,
                            "Content-Type": "application/json",
                        },
                    }
                );
                handleSnackbarOpen("Announcement created successfully", "success");
            }
            resetForm();
            await fetchAnnouncements();
            setTabValue(1);
        } catch (error) {
            console.error("Error saving announcement:", error);
            handleSnackbarOpen(
                error.response?.data?.message || "Error while saving announcement",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (announcement) => {
        setFormState({
            id: announcement._id,
            title: announcement.title || "",
            announcementType: announcement.announcementType || "general",
            priority: announcement.priority || "normal",
            isPinned: Boolean(announcement.isPinned),
            isReminder: Boolean(announcement.isReminder),
            expiresAt: announcement.expiresAt
                ? new Date(announcement.expiresAt).toISOString().slice(0, 16)
                : "",
            linkUrl: announcement.linkUrl || "",
            linkLabel: announcement.linkLabel || "",
            announcementContent: announcement.announcementContent || "",
            selectedBatches: (announcement.batches || []).map((batch) => ({
                _id: batch._id,
                batchName: batch.batchName,
            })),
        });
        setTabValue(0);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/teacher/announcement/${deleteTarget._id}`,
                { headers }
            );
            handleSnackbarOpen("Announcement deleted", "success");
            setDeleteTarget(null);
            fetchAnnouncements();
        } catch (error) {
            console.error("Error deleting announcement", error);
            handleSnackbarOpen("Could not delete announcement", "error");
        }
    };

    const handleRepost = async (announcementId) => {
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/teacher/announcement/${announcementId}/repost`,
                {},
                { headers }
            );
            handleSnackbarOpen("Announcement reposted", "success");
            fetchAnnouncements();
        } catch (error) {
            console.error("Error reposting announcement", error);
            handleSnackbarOpen("Could not repost announcement", "error");
        }
    };

    return (
        <Box>
            <Snackbar
                open={openSnackbar}
                autoHideDuration={4000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setOpenSnackbar(false)}
                    severity={snackbarSeverity}
                    sx={{ width: "100%" }}
                    icon={
                        snackbarSeverity === "success" ? (
                            <CheckCircleOutlineIcon fontSize="inherit" />
                        ) : undefined
                    }
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            <Tabs value={tabValue} onChange={(e, value) => setTabValue(value)} centered>
                <Tab label={formState.id ? "Edit Announcement" : "Create Announcement"} />
                <Tab label="View Announcements" />
            </Tabs>

            {tabValue === 0 && (
                <Box
                    sx={{
                        mt: 3,
                        p: { xs: 2, md: 3 },
                        borderRadius: 3,
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="h4" fontWeight={700} gutterBottom>
                                {formState.id ? "Update announcement" : "Create announcement"}
                            </Typography>
                            <Typography color="text.secondary">
                                Send trackable class notices with type, priority, expiry, and
                                optional links.
                            </Typography>
                        </Box>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={7}>
                                <TextField
                                    fullWidth
                                    label="Title / Subject"
                                    value={formState.title}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            title: e.target.value,
                                        }))
                                    }
                                />
                            </Grid>
                            <Grid item xs={12} md={5}>
                                <Autocomplete
                                    multiple
                                    options={batches}
                                    getOptionLabel={(option) => option.batchName}
                                    isOptionEqualToValue={(option, value) => option._id === value._id}
                                    value={formState.selectedBatches}
                                    onChange={(event, newValue) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            selectedBatches: newValue,
                                        }))
                                    }
                                    renderInput={(params) => (
                                        <TextField {...params} label="Target Batches" />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Announcement Type"
                                    value={formState.announcementType}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            announcementType: e.target.value,
                                        }))
                                    }
                                >
                                    {announcementTypeOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Priority"
                                    value={formState.priority}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            priority: e.target.value,
                                        }))
                                    }
                                >
                                    {priorityOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    type="datetime-local"
                                    label="Visible Until"
                                    InputLabelProps={{ shrink: true }}
                                    value={formState.expiresAt}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            expiresAt: e.target.value,
                                        }))
                                    }
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Linked Page URL (optional)"
                                    placeholder="/student-dashboard/assignments"
                                    value={formState.linkUrl}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            linkUrl: e.target.value,
                                        }))
                                    }
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Link Label (optional)"
                                    placeholder="Open Assignment"
                                    value={formState.linkLabel}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            linkLabel: e.target.value,
                                        }))
                                    }
                                />
                            </Grid>
                        </Grid>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formState.isPinned}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                isPinned: e.target.checked,
                                            }))
                                        }
                                    />
                                }
                                label="Pin this announcement"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formState.isReminder}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                isReminder: e.target.checked,
                                            }))
                                        }
                                    />
                                }
                                label="Mark as reminder"
                            />
                        </Stack>

                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 3,
                                bgcolor: "background.default",
                                border: "1px solid",
                                borderColor: "divider",
                            }}
                        >
                            <Typography variant="h6" gutterBottom>
                                Announcement body
                            </Typography>
                            <JoditEditor
                                ref={editor}
                                value={formState.announcementContent}
                                config={config}
                                tabIndex={1}
                                onBlur={(newContent) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        announcementContent: newContent,
                                    }))
                                }
                            />
                        </Box>

                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="contained"
                                onClick={handleSaveAnnouncement}
                                disabled={loading}
                            >
                                {loading
                                    ? "Saving..."
                                    : formState.id
                                        ? "Update Announcement"
                                        : "Save Announcement"}
                            </Button>
                            {formState.id && (
                                <Button variant="outlined" onClick={resetForm}>
                                    Cancel Edit
                                </Button>
                            )}
                        </Stack>
                    </Stack>
                </Box>
            )}

            {tabValue === 1 && (
                <Box mt={3}>
                    {announcements.length === 0 && (
                        <Typography sx={{ textAlign: "center", mt: 4 }}>
                            No announcements yet
                        </Typography>
                    )}

                    <Stack spacing={3}>
                        {announcements.map((announcement) => {
                            const priorityStyle =
                                priorityColors[announcement.priority] || priorityColors.normal;
                            return (
                                <Card
                                    key={announcement._id}
                                    sx={{
                                        borderRadius: 3,
                                        boxShadow: isDark ? 0 : 2,
                                        bgcolor: "background.paper",
                                        border: "1px solid",

                                        borderColor: announcement.isPinned
                                            ? "success.light"
                                            : "divider",
                                    }}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        <Stack
                                            direction={{ xs: "column", md: "row" }}
                                            justifyContent="space-between"
                                            spacing={2}
                                        >
                                            <Box sx={{ flex: 1 }}>
                                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                                    <Chip
                                                        label={announcement.typeLabel}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: isDark
                                                                ? "rgba(6,182,212,.15)"
                                                                : "#ecfeff",
                                                            color: isDark
                                                                ? "#67e8f9"
                                                                : "#0f766e",
                                                        }}
                                                    />
                                                    <Chip
                                                        label={
                                                            announcement.priority?.charAt(0).toUpperCase() +
                                                            announcement.priority?.slice(1)
                                                        }
                                                        size="small"
                                                        sx={{
                                                            bgcolor:
                                                                announcement.priority === "urgent"
                                                                    ? isDark
                                                                        ? "rgba(239,68,68,.18)"
                                                                        : "#fef2f2"
                                                                    : announcement.priority === "important"
                                                                        ? isDark
                                                                            ? "rgba(249,115,22,.18)"
                                                                            : "#fff7ed"
                                                                        : isDark
                                                                            ? "rgba(59,130,246,.18)"
                                                                            : "#eef6ff",

                                                            color:
                                                                announcement.priority === "urgent"
                                                                    ? "#ef4444"
                                                                    : announcement.priority === "important"
                                                                        ? "#f97316"
                                                                        : "#3b82f6",
                                                        }}
                                                    />
                                                    {announcement.isReminder && (
                                                        <Chip label="Reminder" size="small" />
                                                    )}
                                                    {announcement.isPinned && (
                                                        <Chip
                                                            icon={<PushPinRoundedIcon />}
                                                            label="Pinned"
                                                            size="small"
                                                            color="success"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                    {announcement.isExpired && (
                                                        <Chip label="Expired" size="small" color="default" />
                                                    )}
                                                </Stack>

                                                <Typography variant="h5" fontWeight={700} mt={1.5}>
                                                    {announcement.title}
                                                </Typography>

                                                <Typography color="text.secondary" mt={0.5}>
                                                    For {announcement.batches?.length > 2
                                                        ? `${announcement.batches.length} batches`
                                                        : (announcement.batches || [])
                                                            .map((batch) => batch.batchName)
                                                            .join(", ")}
                                                </Typography>
                                            </Box>

                                            <Stack direction="row" spacing={1} alignItems="flex-start">
                                                <Button
                                                    size="small"
                                                    sx={{
                                                        color: "text.primary",
                                                        "&:hover": {
                                                            bgcolor: "action.hover",
                                                        },
                                                    }}
                                                    startIcon={<EditRoundedIcon />}
                                                    onClick={() => handleEdit(announcement)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="small"
                                                    sx={{
                                                        color: "text.primary",
                                                        "&:hover": {
                                                            bgcolor: "action.hover",
                                                        },
                                                    }}
                                                    startIcon={<RefreshRoundedIcon />}
                                                    onClick={() => handleRepost(announcement._id)}
                                                >
                                                    Repost
                                                </Button>
                                                <Button
                                                    size="small"
                                                    sx={{
                                                        color: "error.main",
                                                        "&:hover": {
                                                            bgcolor: "error.dark",
                                                            color: "#fff",
                                                        },
                                                    }}
                                                    color="error"
                                                    startIcon={<DeleteOutlineRoundedIcon />}
                                                    onClick={() => setDeleteTarget(announcement)}
                                                >
                                                    Delete
                                                </Button>
                                            </Stack>
                                        </Stack>

                                        <Box
                                            sx={{
                                                mt: 2,
                                                mb: 2,
                                                "& img": {
                                                    display: "block",
                                                    maxWidth: "100%",
                                                    borderRadius: 2,
                                                    margin: "10px 0",
                                                },
                                            }}
                                            dangerouslySetInnerHTML={{
                                                __html: announcement.announcementContent,
                                            }}
                                        />

                                        {(announcement.linkUrl || announcement.linkLabel) && (
                                            <Button
                                                href={announcement.linkUrl || "#"}
                                                target="_blank"
                                                rel="noreferrer"
                                                variant="outlined"
                                                sx={{ mb: 2 }}
                                            >
                                                {announcement.linkLabel || "Open linked page"}
                                            </Button>
                                        )}

                                        <Grid container spacing={2} sx={{ mb: 2 }}>
                                            <Grid item xs={12} md={4}>
                                                <Box
                                                    sx={{
                                                        p: 2,
                                                        borderRadius: 2,
                                                        bgcolor: isDark ? "rgba(34,197,94,.12)" : "#f0fdf4",
                                                    }}
                                                >
                                                    <Typography color="text.secondary" variant="body2">
                                                        Target students
                                                    </Typography>
                                                    <Typography variant="h5" fontWeight={700}>
                                                        {announcement.targetedStudentCount || 0}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Box
                                                    sx={{
                                                        p: 2,
                                                        borderRadius: 2,
                                                        bgcolor: isDark
                                                            ? "rgba(59,130,246,.12)"
                                                            : "#eff6ff",
                                                    }}
                                                >
                                                    <Typography color="text.secondary" variant="body2">
                                                        Acknowledged
                                                    </Typography>
                                                    <Typography variant="h5" fontWeight={700}>
                                                        {announcement.acknowledgedCount || 0}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Box
                                                    sx={{
                                                        p: 2,
                                                        borderRadius: 2,
                                                        bgcolor: isDark
                                                            ? "rgba(249,115,22,.12)"
                                                            : "#fff7ed",
                                                    }}
                                                >
                                                    <Typography color="text.secondary" variant="body2">
                                                        Pending
                                                    </Typography>
                                                    <Typography variant="h5" fontWeight={700}>
                                                        {announcement.pendingAcknowledgementCount || 0}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>

                                        <Divider
                                            sx={{
                                                my: 2,
                                                borderColor: "divider",
                                            }}
                                        />

                                        <Stack
                                            direction={{ xs: "column", md: "row" }}
                                            spacing={2}
                                            justifyContent="space-between"
                                        >
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    Created by {announcement.createdBy?.name || "Unknown"} on{" "}
                                                    {new Date(announcement.createdAt).toLocaleString()}
                                                </Typography>
                                                {announcement.expiresAt && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        Visible until{" "}
                                                        {new Date(announcement.expiresAt).toLocaleString()}
                                                    </Typography>
                                                )}
                                            </Box>

                                            <Box sx={{ minWidth: { xs: "100%", md: 320 } }}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Pending acknowledgements
                                                </Typography>
                                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                                    {(announcement.pendingStudents || []).length === 0 ? (
                                                        <Chip label="Everyone acknowledged" size="small" color="success" />
                                                    ) : (
                                                        (announcement.pendingStudents || []).map((student) => (
                                                            <Chip
                                                                key={student._id}
                                                                label={`${student.name} • ${student.batchName}`}
                                                                size="small"
                                                                sx={{
                                                                    borderColor: "divider",
                                                                    bgcolor: isDark
                                                                        ? "rgba(255,255,255,.05)"
                                                                        : "#fff",
                                                                }}
                                                            />
                                                        ))
                                                    )}
                                                </Stack>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Stack>
                </Box>
            )}

            <Dialog
                open={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                PaperProps={{
                    sx: {
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 3,
                    },
                }}
            >
                <DialogTitle>Delete announcement</DialogTitle>
                <DialogContent>
                    <Typography>
                        Delete "{deleteTarget?.title}"? This will remove it for students too.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
                    <Button color="error" onClick={handleDelete}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default TeacherAnnouncements;
