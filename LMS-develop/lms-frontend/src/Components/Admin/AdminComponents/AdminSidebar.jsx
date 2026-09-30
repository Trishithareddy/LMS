import AssessmentIcon from "@mui/icons-material/Assessment";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BadgeIcon from "@mui/icons-material/Badge";
import BusinessIcon from "@mui/icons-material/Business";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import GroupsIcon from "@mui/icons-material/Groups";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PersonIcon from "@mui/icons-material/Person";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import SchoolIcon from "@mui/icons-material/School";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const menuSections = [
    {
        title: "Overview",
        items: [
            {
                key: "dashboard",
                label: "Dashboard",
                icon: DashboardIcon,
                path: "/admin-dashboard",
            },
            {
                key: "schoolReports",
                label: "School Reports",
                icon: QueryStatsIcon,
                path: "/admin-dashboard/school-usage-reports",
            },
        ],
    },
    {
        title: "Content",
        items: [
            {
                key: "course",
                label: "Courses",
                icon: MenuBookIcon,
                relatedPaths: [
                    "/admin-dashboard/update-Courses",
                    "/admin-dashboard/duplicate-course",
                ],
                children: [
                    { label: "Create Course", path: "/admin-dashboard/create-course" },
                    { label: "Manage Courses", path: "/admin-dashboard/view-Courses" },
                ],
            },
            {
                key: "questionBase",
                label: "Question Base",
                icon: AssessmentIcon,
                path: "/admin-dashboard/question-base-tabs",
                relatedPaths: [
                    "/admin-dashboard/quiz-tabs",
                    "/admin-dashboard/create-question",
                    "/admin-dashboard/edit-question",
                    "/admin-dashboard/complete-question",
                ],
            },
            {
                key: "badges",
                label: "Badges",
                icon: BadgeIcon,
                children: [
                    { label: "View Badges", path: "/admin-dashboard/badges" },
                    { label: "Create Badge", path: "/admin-dashboard/badges/create" },
                ],
            },
            {
                key: "scratch",
                label: "Scratch",
                icon: AutoAwesomeIcon,
                children: [
                    { label: "Create Scratch", path: "/admin-dashboard/create-scratch" },
                    { label: "View Scratch", path: "/admin-dashboard/view-scratch" },
                    { label: "Update Scratch", path: "/admin-dashboard/Update-scratch" },
                ],
            },
        ],
    },
    {
        title: "People",
        items: [
            {
                key: "student",
                label: "Students",
                icon: SchoolIcon,
                children: [
                    { label: "Add Students", path: "/admin-dashboard/bulk-add-students" },
                    { label: "Student Records", path: "/admin-dashboard/view-students" },
                    { label: "Delete Students", path: "/admin-dashboard/delete-bulk-students" },
                ],
            },
            {
                key: "teacher",
                label: "Teachers",
                icon: PersonIcon,
                children: [
                    { label: "Add Teachers", path: "/admin-dashboard/bulk-add-teachers" },
                    { label: "Teacher Records", path: "/admin-dashboard/view-teachers" },
                    { label: "Delete Teachers", path: "/admin-dashboard/delete-bulk-teachers" },
                ],
            },
            {
                key: "schoolAdmin",
                label: "School Admins",
                icon: ManageAccountsIcon,
                children: [
                    { label: "Add Admin", path: "/admin-dashboard/create-school-admin" },
                    { label: "Admin Records", path: "/admin-dashboard/view-school-admin" },
                    { label: "Manage Admins", path: "/admin-dashboard/Update-school-admin" },
                ],
            },
        ],
    },
    {
        title: "Operations",
        items: [
            {
                key: "school",
                label: "Schools",
                icon: BusinessIcon,
                children: [
                    { label: "Create School", path: "/admin-dashboard/create-schools" },
                    { label: "View Schools", path: "/admin-dashboard/view-schools" },
                    { label: "Update Schools", path: "/admin-dashboard/update-schools" },
                    { label: "Delete Schools", path: "/admin-dashboard/delete-schools" },
                ],
            },
            {
                key: "batch",
                label: "Batches",
                icon: GroupsIcon,
                children: [
                    { label: "Create Batch", path: "/admin-dashboard/create-batch" },
                    { label: "View Batches", path: "/admin-dashboard/view-batch" },
                    { label: "Update Batch", path: "/admin-dashboard/update-batch" },
                    { label: "Delete Batch", path: "/admin-dashboard/delete-batch" },
                    { label: "Assign Candidates", path: "/admin-dashboard/assign-candidates-to-batch" },
                    { label: "Assign Courses", path: "/admin-dashboard/assign-courses-to-batch" },
                    { label: "Deassign Candidates", path: "/admin-dashboard/deassign-Candidates" },
                    { label: "Deassign Courses", path: "/admin-dashboard/deassign-Courses" },
                ],
            },
        ],
    },
];

const getInitialOpenState = (pathname) => {
    const state = {};
    menuSections.forEach((section) => {
        section.items.forEach((item) => {
            state[item.key] = item.children?.some((child) => child.path === pathname) || false;
        });
    });
    return state;
};

export default function AdminSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = React.useState(() => getInitialOpenState(location.pathname));

    React.useEffect(() => {
        setOpen((prev) => ({ ...prev, ...getInitialOpenState(location.pathname) }));
    }, [location.pathname]);

    const handleClick = (item) => {
        setOpen((prevState) => ({
            ...prevState,
            [item]: !prevState[item],
        }));
    };

    const isActive = (path) => location.pathname === path;
    const isGroupActive = (item) =>
        item.children?.some((child) => isActive(child.path)) ||
        item.relatedPaths?.some((path) => isActive(path)) ||
        isActive(item.path);

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <Box
            sx={{
                height: "100%",
                minHeight: "calc(100vh - 96px)",
                background: "#f8faf9",
                borderRight: "1px solid #dde7df",
                px: 1.5,
                py: 1.5,
                overflowY: "auto",
            }}
        >
            <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {menuSections.map((section) => (
                    <Box key={section.title}>
                        <Typography
                            sx={{
                                px: 1.5,
                                py: 0.85,
                                mb: 0.75,
                                borderLeft: "4px solid #12a150",
                                borderRadius: "4px",
                                backgroundColor: "#eaf8ef",
                                color: "#005f2b",
                                fontSize: 13,
                                fontWeight: 800,
                                letterSpacing: 1.6,
                                textTransform: "uppercase",
                            }}
                        >
                            {section.title}
                        </Typography>

                        {section.items.map((item) => {
                            const Icon = item.icon || SettingsSuggestIcon;
                            const active = isGroupActive(item);
                            const expanded = open[item.key];

                            return (
                                <Box key={item.key} sx={{ mb: 0.35 }}>
                                    <ListItemButton
                                        onClick={() =>
                                            item.children
                                                ? handleClick(item.key)
                                                : handleNavigation(item.path)
                                        }
                                        sx={{
                                            minHeight: 46,
                                            borderRadius: "8px",
                                            px: 1.5,
                                            color: active ? "#005f2b" : "#1f2937",
                                            backgroundColor: active ? "#dcf3e4" : "transparent",
                                            border: active
                                                ? "1px solid #a8dfba"
                                                : "1px solid transparent",
                                            "&:hover": {
                                                backgroundColor: "#edf8f1",
                                                color: "#005f2b",
                                            },
                                        }}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                minWidth: 38,
                                                color: active ? "#12a150" : "#6b7280",
                                            }}
                                        >
                                            <Icon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.label}
                                            primaryTypographyProps={{
                                                fontSize: 15,
                                                fontWeight: active ? 800 : 650,
                                            }}
                                        />
                                        {item.children &&
                                            (expanded ? (
                                                <ExpandLess fontSize="small" />
                                            ) : (
                                                <ExpandMore fontSize="small" />
                                            ))}
                                    </ListItemButton>

                                    {item.children && (
                                        <Collapse in={expanded} timeout="auto" unmountOnExit>
                                            <List
                                                component="div"
                                                disablePadding
                                                sx={{
                                                    ml: 2.4,
                                                    my: 0.4,
                                                    pl: 1.4,
                                                    borderLeft: "1px solid #cbd8ce",
                                                }}
                                            >
                                                {item.children.map((child) => {
                                                    const childActive = isActive(child.path);
                                                    return (
                                                        <ListItemButton
                                                            key={child.path}
                                                            onClick={() => handleNavigation(child.path)}
                                                            sx={{
                                                                minHeight: 38,
                                                                borderRadius: "7px",
                                                                px: 1.4,
                                                                my: 0.25,
                                                                color: childActive ? "#005f2b" : "#344054",
                                                                backgroundColor: childActive
                                                                    ? "#eaf8ef"
                                                                    : "transparent",
                                                                "&:hover": {
                                                                    backgroundColor: "#f1fbf4",
                                                                    color: "#005f2b",
                                                                },
                                                            }}
                                                        >
                                                            <ListItemText
                                                                primary={child.label}
                                                                primaryTypographyProps={{
                                                                    fontSize: 14,
                                                                    fontWeight: childActive ? 800 : 550,
                                                                }}
                                                            />
                                                        </ListItemButton>
                                                    );
                                                })}
                                            </List>
                                        </Collapse>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                ))}
            </List>
        </Box>
    );
}
