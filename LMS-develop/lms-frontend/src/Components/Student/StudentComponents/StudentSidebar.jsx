import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { Badge } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import SchoolIcon from "@mui/icons-material/School";
import QuizIcon from "@mui/icons-material/Quiz";
import CampaignIcon from "@mui/icons-material/Campaign";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import axios from "axios";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

const studentSections = [
    {
        title: "Learning",
        items: [
            {
                label: "Dashboard",
                icon: <DashboardIcon fontSize="small" />,
                path: "/student-dashboard",
            },
            {
                label: "Courses",
                icon: <SchoolIcon fontSize="small" />,
                path: "/student-dashboard/courses",
            },
            {
                label: "Assessments",
                icon: <QuizIcon fontSize="small" />,
                path: "/student-dashboard/assessments",
            },
            {
                label: "Attendance",
                icon: <FactCheckIcon fontSize="small" />,
                path: "/student-dashboard/attendance",
            },
        ],
    },
    {
        title: "Classroom",
        items: [
            {
                label: "Projects",
                icon: <WorkspacesIcon fontSize="small" />,
                path: "/student-dashboard/projects-Practice",
            },
            {
                label: "Assignments",
                icon: <AssignmentTurnedInIcon fontSize="small" />,
                path: "/student-dashboard/assignments",
            },
        ],
    },
];

const sectionLabelStyles = {
    mx: 1.5,
    mt: 2,
    mb: 1,
    px: 1.5,
    py: 1.05,
    borderLeft: "4px solid",
    borderColor: "primary.main",
    borderRadius: 1,
    bgcolor: "action.hover",
    color: "primary.main",
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
};

const navItemStyles = (active) => ({
    mx: 1.5,
    mb: 0.5,
    borderRadius: 2.5,
    minHeight: 50,
    color: active ? "primary.main" : "text.primary",
    bgcolor: active ? "action.selected" : "transparent",
    border: 1,
    borderColor: active ? "primary.main" : "transparent",
    "&:hover": {
        bgcolor: "action.hover",
    },
});

export default function StudentSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState({
        learning: true,
        classroom: true,
        updates: true,
    });

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/student/all/announcements`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    },
                );

                const anns = res?.data?.announcements || [];
                const unread = anns.filter((announcement) => !announcement.isRead);
                setUnreadCount(unread.length);
            } catch (err) {
                console.error(err);
            }
        };

        fetchAnnouncements();
        window.addEventListener("announcementUpdated", fetchAnnouncements);

        return () => {
            window.removeEventListener(
                "announcementUpdated",
                fetchAnnouncements,
            );
        };
    }, []);

    const isPathActive = (path) =>
        location.pathname === path || location.pathname.startsWith(`${path}/`);

    const handleToggle = (section) => {
        setOpen((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    return (
        <Box
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                color: "text.primary",
                bgcolor: "background.paper",
                borderRight: 1,
                borderColor: "divider",
                py: 1,
                px: 1,
            }}
        >
            <List sx={{ px: 0, py: 0 }}>
                {studentSections.map((section, sectionIndex) => {
                    const sectionKey = section.title.toLowerCase();
                    return (
                        <Box key={section.title}>
                            <Typography
                                onClick={() => handleToggle(sectionKey)}
                                sx={{ ...sectionLabelStyles, mt: sectionIndex === 0 ? 1 : 2.25 }}
                            >
                                {section.title}
                                {open[sectionKey] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                            </Typography>
                            <Collapse in={open[sectionKey]} timeout="auto" unmountOnExit>
                                {section.items.map((item) => {
                                    const active = isPathActive(item.path);
                                    return (
                                        <ListItem key={item.label} disablePadding>
                                            <ListItemButton
                                                onClick={() => navigate(item.path)}
                                                sx={navItemStyles(active)}
                                            >
                                                <ListItemIcon
                                                    sx={{
                                                        minWidth: 36,
                                                        color: active
                                                            ? "primary.main"
                                                            : "text.secondary",
                                                    }}
                                                >
                                                    {item.icon}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={item.label}
                                                    primaryTypographyProps={{
                                                        fontSize: 15,
                                                        fontWeight: active ? 800 : 500,
                                                        color: active ? "primary.main" : "text.primary",
                                                    }}
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    );
                                })}
                            </Collapse>
                        </Box>
                    );
                })}

                <Typography onClick={() => handleToggle("updates")} sx={{ ...sectionLabelStyles, mt: 2.25 }}>
                    Updates
                    {open.updates ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                </Typography>
                <Collapse in={open.updates} timeout="auto" unmountOnExit>
                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={() =>
                                navigate("/student-dashboard/announcements")
                            }
                            sx={navItemStyles(
                                isPathActive("/student-dashboard/announcements"),
                            )}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 36,
                                    color: isPathActive(
                                        "/student-dashboard/announcements",
                                    )
                                        ? "primary.main"
                                        : "text.secondary",
                                }}
                            >
                                <Badge
                                    badgeContent={unreadCount}
                                    color="error"
                                    overlap="circular"
                                >
                                    <CampaignIcon fontSize="small" />
                                </Badge>
                            </ListItemIcon>
                            <ListItemText
                                primary="Announcements"
                                primaryTypographyProps={{
                                    fontSize: 15,
                                    fontWeight: isPathActive(
                                        "/student-dashboard/announcements",
                                    )
                                        ? 800
                                        : 500,
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                </Collapse>
            </List>
        </Box>
    );
}
