import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import axios from "axios";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import BreadcrumbsComponent from "../../BreadcrumbsComponent";
import { useContext } from "react";
import { ThemeContext } from "../../../contexts/ThemeContext";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

const settings = ["Dashboard", "Logout"];

const getAttendanceNotificationKey = (item) =>
    `attendance_notice_seen_${item.date}_${item.batchId || "batch"}_${item.status}`;

const getAssignmentNotificationKey = (item) =>
    `assignment_notice_seen_${item._id}_${item.createdAt || ""}`;

function StudentHeader({
    handleSidebarToggle,
    handleLogout,
    studentName,
    schoolImageUrl,
}) {
    const [anchorElUser, setAnchorElUser] = React.useState(null);
    const [notifications, setNotifications] = React.useState([]);
    const [anchorElNotif, setAnchorElNotif] = React.useState(null);
    const navigate = useNavigate();
    const { mode, toggleTheme } = useContext(ThemeContext);

    const logoPath = "/SuperTeacher_Logo_new_2.png";

    const plain = (html) => {
        if (!html) return "";
        try {
            const doc = new DOMParser().parseFromString(html, "text/html");
            return (doc.body.textContent || "").trim();
        } catch {
            return html.replace(/<[^>]+>/g, "").trim();
        }
    };

    React.useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const token = localStorage.getItem("token");
                const headers = token
                    ? { Authorization: `Bearer ${token}` }
                    : {};

                const [announcementRes, attendanceRes, assignmentsRes] = await Promise.all([
                    axios.get(
                        `${import.meta.env.VITE_API_URL}/student/all/announcements`,
                        { headers }
                    ),
                    axios.get(
                        `${import.meta.env.VITE_API_URL}/attendance/today/status`,
                        { headers }
                    ),
                    axios.get(
                        `${import.meta.env.VITE_API_URL}/assignments/student`,
                        { headers }
                    ),
                ]);

                const announcementNotifications = (
                    announcementRes?.data?.announcements || []
                )
                    .filter((announcement) => !announcement.isRead)
                    .map((announcement) => ({
                        id: announcement._id,
                        type: "announcement",
                        title:
                            announcement.title ||
                            plain(announcement.announcementContent),
                        subtitle:
                            announcement.audienceSummary || "Announcement",
                        createdAt: announcement.createdAt || "",
                    }));

                const attendanceNotifications = (
                    attendanceRes?.data?.statusList || []
                )
                    .filter(
                        (item) =>
                            !localStorage.getItem(
                                getAttendanceNotificationKey(item)
                            )
                    )
                    .map((item) => ({
                        id: `${item.date}-${item.batchId}-${item.status}`,
                        type: "attendance",
                        title: `Attendance marked ${item.status === "late" ? "Late" : "Present"}`,
                        subtitle: `${item.batchName || "Current Batch"}${item.className ? ` • ${item.className}` : ""}${item.section ? ` - ${item.section}` : ""}`,
                        createdAt: item.loginTime || item.date,
                        attendance: item,
                    }));

                const assignmentNotifications = (
                    assignmentsRes?.data?.assignments || []
                )
                    .filter(
                        (assignment) =>
                            !assignment?.submission &&
                            !localStorage.getItem(
                                getAssignmentNotificationKey(assignment)
                            )
                    )
                    .map((assignment) => ({
                        id: `assignment-${assignment._id}`,
                        type: "assignment",
                        title: `New assignment: ${assignment.title || "Assignment"}`,
                        subtitle:
                            assignment.courseName ||
                            assignment.batchName ||
                            assignment.classSection ||
                            "Assignment",
                        createdAt:
                            assignment.createdAt ||
                            assignment.updatedAt ||
                            assignment.dueDate ||
                            "",
                        assignment,
                    }));

                const mergedNotifications = [
                    ...announcementNotifications,
                    ...attendanceNotifications,
                    ...assignmentNotifications,
                ].sort(
                    (left, right) =>
                        new Date(right.createdAt || 0) -
                        new Date(left.createdAt || 0)
                );

                setNotifications(mergedNotifications);
            } catch (err) {
                console.error(err);
            }
        };

        fetchNotifications();
        window.addEventListener("announcementUpdated", fetchNotifications);
        window.addEventListener("attendanceUpdated", fetchNotifications);

        return () => {
            window.removeEventListener(
                "announcementUpdated",
                fetchNotifications
            );
            window.removeEventListener(
                "attendanceUpdated",
                fetchNotifications
            );
        };
    }, []);

    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleMenuItemClick = (setting) => {
        if (setting === "Logout") {
            handleLogout();
        } else if (setting === "Dashboard") {
            navigate("/student-dashboard");
        }

        handleCloseUserMenu();
    };

    const handleNotificationClick = (notification) => {
        if (notification.type === "attendance" && notification.attendance) {
            localStorage.setItem(
                getAttendanceNotificationKey(notification.attendance),
                "seen"
            );
            setNotifications((prev) =>
                prev.filter((item) => item.id !== notification.id)
            );
            setAnchorElNotif(null);
            navigate("/student-dashboard/attendance");
            return;
        }

        if (notification.type === "assignment" && notification.assignment) {
            localStorage.setItem(
                getAssignmentNotificationKey(notification.assignment),
                "seen"
            );
            setNotifications((prev) =>
                prev.filter((item) => item.id !== notification.id)
            );
            setAnchorElNotif(null);
            navigate("/student-dashboard/assignments");
            return;
        }

        setAnchorElNotif(null);
        navigate("/student-dashboard/announcements");
    };

    return (
        <>
            <AppBar
                position="fixed"
                sx={{
                    bgcolor: "background.paper",
                    backdropFilter: "blur(8px)",
                    borderBottom: 1,
                    borderColor: "divider",
                    boxShadow: 1,
                    transition: "top 0.3s ease",
                    width: "100%",
                    zIndex: 1100,
                }}
            >
                <Container
                    maxWidth={false}
                    sx={{ paddingLeft: 0, paddingRight: 0 }}
                >
                    <Toolbar disableGutters>
                        <IconButton
                            onClick={handleSidebarToggle}
                            sx={{
                                mr: 2,
                                color: "text.primary",
                            }}
                        >
                            <MenuIcon />
                        </IconButton>

                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                flexGrow: 1,
                            }}
                        >
                            <img
                                src={logoPath}
                                alt="Logo"
                                style={{
                                    height: "40px",
                                    width: "auto",
                                    marginRight: "16px",
                                }}
                            />

                            <Typography
                                variant="h6"
                                noWrap
                                component="div"
                                sx={{
                                    color: "primary.main",
                                    flexGrow: 1,
                                    textAlign: "center",
                                    display: { xs: "none", sm: "block" },
                                }}
                            >
                                {studentName}
                            </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <IconButton
                                onClick={toggleTheme}
                                sx={{
                                    mr: 2,
                                    color: "text.primary",
                                }}
                            >
                                {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
                            </IconButton>


                            <IconButton
                                onClick={(event) =>
                                    setAnchorElNotif(event.currentTarget)
                                }
                                sx={{ mr: 2 }}
                            >
                                <Badge
                                    badgeContent={notifications.length}
                                    color="error"
                                    invisible={notifications.length === 0}
                                >
                                    <NotificationsIcon />
                                </Badge>
                            </IconButton>

                            <Menu
                                anchorEl={anchorElNotif}
                                open={Boolean(anchorElNotif)}
                                onClose={() => setAnchorElNotif(null)}
                            >
                                {notifications.length === 0 ? (
                                    <MenuItem>No new notifications</MenuItem>
                                ) : (
                                    notifications.slice(0, 5).map((notification) => (
                                        <MenuItem
                                            key={notification.id}
                                            sx={{
                                                maxWidth: 320,
                                                whiteSpace: "normal",
                                                alignItems: "flex-start",
                                            }}
                                            onClick={() =>
                                                handleNotificationClick(
                                                    notification
                                                )
                                            }
                                        >
                                            <Box>
                                                <Typography
                                                    variant="body2"
                                                    sx={{ fontWeight: 600 }}
                                                >
                                                    {notification.title}
                                                </Typography>
                                                {notification.subtitle && (
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{
                                                            display: "block",
                                                            mt: 0.5,
                                                        }}
                                                    >
                                                        {notification.subtitle}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </MenuItem>
                                    ))
                                )}
                            </Menu>

                            <img
                                src={schoolImageUrl || logoPath}
                                alt="School Logo"
                                style={{
                                    height: "40px",
                                    width: "auto",
                                    marginRight: "16px",
                                }}
                            />
                            <Tooltip title="Open settings">
                                <IconButton
                                    onClick={handleOpenUserMenu}
                                    sx={{ p: 0 }}
                                >
                                    <Avatar
                                        alt="S"
                                        src="/static/images/avatar/2.jpg"
                                    />
                                </IconButton>
                            </Tooltip>
                            <Menu
                                sx={{ mt: "45px" }}
                                id="menu-appbar"
                                anchorEl={anchorElUser}
                                anchorOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                }}
                                open={Boolean(anchorElUser)}
                                onClose={handleCloseUserMenu}
                            >
                                {settings.map((setting) => (
                                    <MenuItem
                                        key={setting}
                                        onClick={() =>
                                            handleMenuItemClick(setting)
                                        }
                                    >
                                        <Typography textAlign="center">
                                            {setting}
                                        </Typography>
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Box>
                    </Toolbar>
                    <Box
                        sx={{
                            py: 0.5,
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        <BreadcrumbsComponent />
                    </Box>
                </Container>
            </AppBar>

            <Box sx={{ marginTop: "100px" }} />
        </>
    );
}

export default StudentHeader;
