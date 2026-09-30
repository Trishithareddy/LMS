import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupsIcon from "@mui/icons-material/Groups";
import PeopleIcon from "@mui/icons-material/People";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CampaignIcon from "@mui/icons-material/Campaign";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import DescriptionIcon from "@mui/icons-material/Description";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import TerminalIcon from "@mui/icons-material/Terminal";
import CodeIcon from "@mui/icons-material/Code";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

const sidebarSections = [
    {
        title: "Workspace",
        items: [
            {
                label: "Dashboard",
                icon: <DashboardIcon fontSize="small" />,
                path: "/teacher-dashboard",
            },
            {
                label: "Batches",
                icon: <GroupsIcon fontSize="small" />,
                path: "/teacher-dashboard/batches",
            },
            {
                label: "Students",
                icon: <PeopleIcon fontSize="small" />,
                path: "/teacher-dashboard/students",
            },
            {
                label: "Attendance",
                icon: <FactCheckIcon fontSize="small" />,
                path: "/teacher-dashboard/attendance",
            },
        ],
    },
    {
        title: "Teaching",
        items: [
            {
                label: "Assessment Center",
                icon: <AssignmentIcon fontSize="small" />,
                path: "/teacher-dashboard/assessment-center",
            },
            {
                label: "Projects",
                icon: <WorkspacesIcon fontSize="small" />,
                path: "/teacher-dashboard/projects",
            },
            {
                label: "Announcements",
                icon: <CampaignIcon fontSize="small" />,
                path: "/teacher-dashboard/announcements",
            },
        ],
    },
];

const teacherTools = [
    {
        label: "Assignments",
        icon: <AssignmentTurnedInIcon fontSize="small" />,
        path: "/teacher-dashboard/assignments",
    },
    {
        label: "Question Paper Generator",
        icon: <DescriptionIcon fontSize="small" />,
        path: "/teacher-dashboard/question-paper-generator",
    },
    {
        label: "Lesson Plan Generator",
        icon: <AutoAwesomeIcon fontSize="small" />,
        path: "/teacher-dashboard/aira-lesson-plan-generator",
    },
    {
        label: "Python Lab",
        icon: <TerminalIcon fontSize="small" />,
        path: "/terminal/terminal-python",
    },
    {
        label: "HTML Lab",
        icon: <CodeIcon fontSize="small" />,
        path: "/terminal/terminal-html",
    },
    {
        label: "Scratch Lab",
        icon: <SmartToyOutlinedIcon fontSize="small" />,
        path: "/terminal/scratch-html",
    },
];

const sectionLabelStyles = {
    mx: 1.5,
    mt: 2,
    mb: 1,
    px: 1.5,
    py: 1.05,
    borderRadius: 1,
    borderLeft: "4px solid",
    borderColor: "primary.main",
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

const mainItemStyles = (active) => ({
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

const nestedItemStyles = (active) => ({
    ml: 1.5,
    mr: 1.5,
    mb: 0.5,
    borderRadius: 2.5,
    minHeight: 40,
    pl: 2.25,

    color: active ? "primary.main" : "text.primary",

    bgcolor: active ? "action.selected" : "transparent",

    border: 1,

    borderColor: active ? "primary.main" : "transparent",

    "&:hover": {
        bgcolor: "action.hover",
    },
});

export default function TeacherSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = React.useState({
        workspace: true,
        teaching: true,
        tools: true,
    });

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
                {sidebarSections.map((section, sectionIndex) => {
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
                                                sx={mainItemStyles(active)}
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

                <Typography onClick={() => handleToggle("tools")} sx={{ ...sectionLabelStyles, mt: 2.25 }}>
                    Super Tools
                    {open.tools ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                </Typography>

                <Collapse in={open.tools} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ pt: 0.5 }}>
                        {teacherTools.map((item) => {
                            const active = isPathActive(item.path);
                            return (
                                <ListItem key={item.label} disablePadding>
                                    <ListItemButton
                                        onClick={() => navigate(item.path)}
                                        sx={nestedItemStyles(active)}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                minWidth: 32,
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
                                                fontSize: 14.5,
                                                fontWeight: active ? 800 : 500,
                                                color: active ? "primary.main" : "text.primary",
                                            }}

                                        />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>
                </Collapse>
            </List>
        </Box>
    );
}
