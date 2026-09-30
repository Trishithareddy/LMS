import React, { useEffect, useContext, useMemo, useState } from "react";
import axios from "axios";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import NotificationImportantRoundedIcon from "@mui/icons-material/NotificationImportantRounded";
import { useTheme, alpha } from "@mui/material/styles";

import { BreadcrumbContext } from "../../BreadcrumbContext";

const priorityColors = (theme) => ({
    normal: {
        bg: alpha(theme.palette.info.main, 0.12),
        color: theme.palette.info.main,
    },
    important: {
        bg: alpha(theme.palette.warning.main, 0.12),
        color: theme.palette.warning.main,
    },
    urgent: {
        bg: alpha(theme.palette.error.main, 0.12),
        color: theme.palette.error.main,
    },
});


function StudentAnnouncements() {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadingBtn, setLoadingBtn] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const theme = useTheme();
    const dark = theme.palette.mode === "dark";

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Student Dashboard", path: "/student-dashboard" },
            { name: "Announcements", path: "/student-dashboard/announcements" },
        ]);
    }, [setBreadcrumbTrail]);

    const fetchAllAnnouncements = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/student/all/announcements`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setAnnouncements(response.data.announcements || []);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch announcements");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllAnnouncements();
    }, []);

    const markAsRead = async (id) => {
        setLoadingBtn(id);

        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `${import.meta.env.VITE_API_URL}/student/announcement/read/${id}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            await fetchAllAnnouncements();
            window.dispatchEvent(new Event("announcementUpdated"));
            setSnackbarOpen(true);
        } catch (err) {
            setError(err.response?.data?.message || "Could not acknowledge announcement");
        } finally {
            setLoadingBtn(null);
        }
    };

    const summary = useMemo(() => {
        const unread = announcements.filter((item) => !item.isRead).length;
        const urgent = announcements.filter((item) => item.priority === "urgent").length;
        return { unread, urgent, total: announcements.length };
    }, [announcements]);

    if (loading) {
        return (
            <Container
                sx={{
                    textAlign: "center",
                    mt: 4,
                    minHeight: "50vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ textAlign: "center", mt: 4 }}>
                <Typography variant="h6" color="error">
                    {error}
                </Typography>
            </Container>
        );
    }

    if (announcements.length === 0) {
        return (
            <Container sx={{ textAlign: "center", mt: 6, opacity: 0.65 }}>
                <Typography variant="h6">No active announcements right now</Typography>
            </Container>
        );
    }

    return (
        <Container sx={{ pb: 4 }}>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={2500}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity="success">
                    Announcement acknowledged
                </Alert>
            </Snackbar>

            <Box sx={{ mt: 2, mb: 3 }}>
                <Typography
                    variant="h3"
                    fontWeight={900}
                    color="text.primary"
                >
                    Announcements
                </Typography>
                <Typography color="text.secondary" mt={0.5}>
                    Urgent notices stay highlighted, unread items stay at the top, and older
                    expired notices stay out of the way.
                </Typography>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Box
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: "background.paper",
                            border: 1,
                            borderColor: "divider",
                            boxShadow: 2,
                        }}
                    >
                        <Typography color="text.secondary">Unread</Typography>
                        <Typography variant="h4" fontWeight={700}>
                            {summary.unread}
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: "background.paper", border: 1, borderColor: "divider", boxShadow: 2 }}>
                        <Typography color="text.secondary">Urgent</Typography>
                        <Typography variant="h4" fontWeight={700}>
                            {summary.urgent}
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: "background.paper", border: 1, borderColor: "divider", boxShadow: 2 }}>
                        <Typography color="text.secondary">Active notices</Typography>
                        <Typography variant="h4" fontWeight={700}>
                            {summary.total}
                        </Typography>
                    </Box>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {announcements.map((announcement) => {
                    const priorityStyle =
                        priorityColors(theme)[announcement.priority] ??
                        priorityColors(theme).normal;
                    return (
                        <Grid item xs={12} md={6} key={announcement._id}>
                            <Card
                                sx={{
                                    height: "100%",
                                    borderRadius: 3,
                                    border: 1,
                                    borderColor: announcement.isRead
                                        ? "divider"
                                        : "success.main",

                                    bgcolor: "background.paper",
                                    boxShadow: 2,
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" mb={1.5}>
                                        <Chip
                                            label={announcement.typeLabel}
                                            size="small"
                                            color="info"
                                            variant="outlined"
                                        />
                                        <Chip
                                            label={
                                                announcement.priority?.charAt(0).toUpperCase() +
                                                announcement.priority?.slice(1)
                                            }
                                            size="small"
                                            sx={{
                                                backgroundColor: priorityStyle.bg,
                                                color: priorityStyle.color,
                                            }}
                                        />
                                        {announcement.isPinned && (
                                            <Chip
                                                icon={<PushPinRoundedIcon />}
                                                label="Pinned"
                                                size="small"
                                                color="success"
                                                variant="outlined"
                                            />
                                        )}
                                        {!announcement.isRead && (
                                            <Chip
                                                icon={<NotificationImportantRoundedIcon />}
                                                label="Unread"
                                                size="small"
                                                color="warning"
                                                variant="outlined"
                                            />
                                        )}
                                    </Stack>

                                    <Typography variant="h5" fontWeight={700}>
                                        {announcement.title}
                                    </Typography>
                                    <Typography color="text.secondary" mt={0.5}>
                                        {announcement.audienceSummary}
                                    </Typography>

                                    <Box
                                        sx={{
                                            color: "text.primary",

                                            "& p": {
                                                color: "text.primary",
                                            },

                                            "& span": {
                                                color: "text.primary",
                                            },

                                            "& div": {
                                                color: "text.primary",
                                            },

                                            "& img": {
                                                maxWidth: "100%",
                                                borderRadius: 2,
                                                my: 1,
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
                                            variant="text"
                                            sx={{ mt: 1, mb: 1 }}
                                        >
                                            {announcement.linkLabel || "Open linked page"}
                                        </Button>
                                    )}

                                    <DividerSpacer />

                                    <Typography variant="body2" color="text.secondary">
                                        Created by {announcement.createdBy?.name || "Unknown"}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Posted on {new Date(announcement.createdAt).toLocaleString()}
                                    </Typography>
                                    {announcement.expiresAt && (
                                        <Typography variant="body2" color="text.secondary">
                                            Visible until {new Date(announcement.expiresAt).toLocaleString()}
                                        </Typography>
                                    )}

                                    <Box sx={{ mt: 2 }}>
                                        {announcement.isRead ? (
                                            <Chip label="Acknowledged" color="success" />
                                        ) : (
                                            <Button
                                                variant="contained"
                                                disabled={loadingBtn === announcement._id}
                                                onClick={() => markAsRead(announcement._id)}
                                            >
                                                {loadingBtn === announcement._id
                                                    ? "Saving..."
                                                    : "Acknowledge"}
                                            </Button>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Container>
    );
}

function DividerSpacer() {
    return (
        <Box
            sx={{
                borderTop: 1,
                borderColor: "divider",
                my: 2,
            }}
        />
    );
}

export default StudentAnnouncements;
