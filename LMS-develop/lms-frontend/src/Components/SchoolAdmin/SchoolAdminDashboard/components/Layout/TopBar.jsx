import React, { useState } from "react";
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Avatar,
    Box,
    useTheme,
    useMediaQuery,
    Menu,
    MenuItem,
} from "@mui/material";
import {
    Menu as MenuIcon,
    NotificationsOutlined,
    AccountCircle,

} from "@mui/icons-material";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useNavigate } from "react-router-dom";
import ProfileSettings from "../Profile/ProfileSettings"
const TopBar = ({ onMobileMenuToggle }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const navigate = useNavigate()
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };
    const handleDownload = () => {
        window.location.href = "https://drive.google.com/drive/folders/1xAUr4gbZ0BEH4kxE_lxuNZMow8jFZ6fY";
    };

    const handleProfileclick = () => {
        return (<ProfileSettings />)
    }
    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                backgroundColor: "#FFFFFF",
                borderBottom: "1px solid #E0E0E0",
                color: "#000000",
                width: { md: `calc(100% - 240px)` },
                ml: { md: `240px` },
            }}
        >
            <Toolbar>
                {isMobile && (
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={onMobileMenuToggle}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                )}

                <Typography
                    variant="h6"
                    component="div"
                    sx={{ flexGrow: 1, fontWeight: 600 }}
                >
                    School Administration
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <IconButton color="inherit" aria-label="notifications">
                        <NotificationsOutlined sx={{ width: 32, height: 32 }} />
                    </IconButton>

                    <IconButton
                        className="relative group flex flex-col items-center"
                        color="inherit"
                        aria-label="fileDownload"
                        onClick={handleDownload}
                    >
                        <FileDownloadIcon sx={{ width: 32, height: 32 }} />

                        <span
                            className="absolute top-full mt-2 px-2 py-1 text-xs text-white bg-gray-800 
               rounded-md opacity-0 group-hover:opacity-100 
               translate-y-1 group-hover:translate-y-0 
               transition-all duration-300"
                        >
                            Super Installer
                        </span>
                    </IconButton>

                    <IconButton
                        color="inherit"
                        aria-label="account"
                        onClick={handleClick}
                    >
                        <AccountCircle sx={{ width: 32, height: 32 }} />
                    </IconButton>
                </Box>
            </Toolbar>

            <Box
                display="flex"
                alignItems="center"
                justifyContent="flex-end"
                sx={{ pr: 2 }}
            >
                {/* Dropdown Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    PaperProps={{
                        elevation: 3,
                        sx: { mt: 1.5 },
                    }}
                >
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
            </Box>
        </AppBar>
    );
};

export default TopBar;
