import React, { useEffect, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box, Toolbar, Snackbar, Alert, CircularProgress } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import axios from "axios";

// Components
import Sidebar from "./components/Layout/Sidebar";
import TopBar from "./components/Layout/TopBar";
import DashboardOverview from "./components/Dashboard/DashboardOverview";
import BatchList from "./components/Batchs/BatchList";
import BatchDetails from "./components/Batchs/BatchDetails";
import StudentList from "./components/Students/StudentList";
import TeacherList from "./components/Teachers/TeacherList";
import ProfileSettings from "./components/Profile/ProfileSettings";
import StudentModal from "./components/Modals/StudentModal";
import TeacherModal from "./components/Modals/TeacherModal";
import AnalyticsDashboard from "./components/Analytics/AnalyticsDashboard";
import OperationsCenter from "./components/Operations/OperationsCenter";
import BulkStudentModal from "./components/Modals/BulkStudentModal";

const theme = createTheme({
    palette: {
        primary: {
            main: "#2E7D32",
        },
        secondary: {
            main: "#1976D2",
        },
        background: {
            default: "#FAFAFA",
            paper: "#FFFFFF",
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 700,
        },
        h6: {
            fontWeight: 600,
        },
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    borderRadius: 12,
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                },
            },
        },
    },
});

const SchoolAdminDashboard = () => {
    const [selectedView, setSelectedView] = useState("dashboard");
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [studentModalOpen, setStudentModalOpen] = useState(false);
    const [teacherModalOpen, setTeacherModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [bulkStudentModalOpen, setBulkStudentModalOpen] =
    useState(false);

    const [schoolAdminData, setSchoolAdminData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [getbatches, setBatches] = useState([]);
    const [getshool, setGetSchool] = useState({});

    const handleSnackbarClose = () => {
        setOpenSnackbar(false);
    };

    // fetching data from the backend
    useEffect(() => {
        fetchData();
    }, []);
    const fetchData = async () => {
        // setIsLoading(true);
        const token = localStorage.getItem("token");
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL
                }/school-admin/get-logged-school-admin`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const fetchedBatches = response.data.schoolAdmin.batches || [];
            setBatches(fetchedBatches);
            setSchoolAdminData(response.data.schoolAdmin);
            setGetSchool(response.data.schoolAdmin.school || {});

            // setSnackbarMessage(" Data fetched successfully");
            // setSnackbarSeverity("success");
            // setOpenSnackbar(true);

            // check if selectedBatch exists, then update it
            if (selectedBatch) {
                const updatedBatch = fetchedBatches.find(b => b._id === selectedBatch._id);
                if (updatedBatch) {
                    setSelectedBatch(updatedBatch);
                }
            }
        } catch (error) {
            console.error("Error fetching school admin data:", error);
            setSnackbarMessage(
                "Something went wrong while Please try again later"
            );
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
        }
    };

    useEffect
    const handleMobileToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleViewChange = (view) => {
        setSelectedView(view);
        setSelectedBatch(null);
        setMobileOpen(false);
    };

    const handleBatchSelect = (batch) => {
        setSelectedBatch(batch);
    };

    const handleBatchBack = () => {
        setSelectedBatch(null);
    };

    const handleEditStudent = (student) => {
        setSelectedStudent(student);
        setStudentModalOpen(true);
    };

    const handleEditTeacher = (teacher) => {
        setSelectedTeacher(teacher);
        setTeacherModalOpen(true);
    };

    const handleAdminSave = async (adminData) => {
        setIsLoading(true);

        
        const token = localStorage.getItem("token");
        try {
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL
                }/school-admin/update-school-admin/${adminData._id}`,
                adminData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                setSnackbarMessage("Admin updated successfully");
                setSnackbarSeverity("success");
                setOpenSnackbar(true);
                fetchData();
            }
        } catch (error) {
            console.error("Error unable to update:", error);
            setSnackbarMessage("Unable to update ");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddStudent = () => {
        setSelectedStudent(null);
        setStudentModalOpen(true);
    };

    const handleBulkAddStudent = () => {
    setBulkStudentModalOpen(true);
};

    const handleAddTeacher = () => {
        setSelectedTeacher(null);
        setTeacherModalOpen(true);
    };
    const handleBlockStudent = async (studentId) => {
       
        setIsLoading(true);
        const token = localStorage.getItem("token");
        try {
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL
                }/school-admin/block-student/${studentId}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                setSnackbarMessage(response.data.message || "Student status updated successfully");
                setSnackbarSeverity("success");
                setOpenSnackbar(true);
                fetchData();
            }
        } catch (error) {
            console.error("Error unable to block student:", error);
            setSnackbarMessage("Unable to block student");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
        } finally {
            setIsLoading(false);
        }
    };
    const handleBlockTeacher = async (teacherId) => {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        try {
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL
                }/school-admin/block-teacher/${teacherId}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                setSnackbarMessage(response.data.message || "Teacher status updated successfully");
                setSnackbarSeverity("success");
                setOpenSnackbar(true);
                fetchData();
            }
        } catch (error) {
            console.error("Error unable to block Teacher:", error);
            setSnackbarMessage("Unable to block Teacher");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
        } finally {
            setIsLoading(false);
        }
    };

    const renderContent = () => {
        if (selectedView === "batches") {
            if (selectedBatch) {
                return (
                    <BatchDetails
                        batch={selectedBatch}
                        onBack={handleBatchBack}
                        onEditStudent={handleEditStudent}
                        onEditTeacher={handleEditTeacher}
                        fetchData={fetchData}
                    />
                );
            }
            return (
                <BatchList
                    batches={getbatches}
                    onBatchSelect={handleBatchSelect}
                />
            );
        }

        switch (selectedView) {
           case "students":
    return (
        <StudentList
    students={getshool.students || []}
    batches={getbatches || []}
    onEditStudent={handleEditStudent}
    onHandleBlockStudent={handleBlockStudent}
    onAddStudent={handleAddStudent}
    onBulkAddStudent={handleBulkAddStudent}
    fetchData={fetchData}
/>
    );
            case "teachers":
                return (
                    <TeacherList
                        teachers={getshool.teachers}
                        onEditTeacher={handleEditTeacher}
                        onHandleBlockTeacher={handleBlockTeacher}
                        onAddTeacher={handleAddTeacher}
                        fetchData={fetchData}
                    />
                );
            case "analytics":
                return <AnalyticsDashboard />;
            case "operations":
                return <OperationsCenter onViewChange={handleViewChange} />;
            case "profile":
                return (
                    <ProfileSettings
                        schoolAdmin={schoolAdminData}
                        onSave={handleAdminSave}
                    />
                );
            default:
                return <DashboardOverview schoolAdminData={schoolAdminData} onViewChange={handleViewChange} />;
        }
    };

    return (
        <>

            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Box sx={{ display: "flex" }}>
                    <TopBar onMobileMenuToggle={handleMobileToggle} />
                    <Sidebar
                        selectedView={selectedView}
                        onViewChange={handleViewChange}
                        mobileOpen={mobileOpen}
                        onMobileToggle={handleMobileToggle}
                    />
                    <Box
                        component="main"
                        sx={{
                            flexGrow: 1,
                            bgcolor: "background.default",
                            minHeight: "100vh",
                            width: { sm: `calc(100% - 240px)` },
                        }}
                    >
                        <Toolbar />
                        {renderContent()}
                    </Box>
                </Box>

                <StudentModal
    open={studentModalOpen}
    student={selectedStudent}
    onClose={() => setStudentModalOpen(false)}
    getbatches={getbatches}
    getSchool={getshool}
    fetchData={fetchData}
/>

<BulkStudentModal
    open={bulkStudentModalOpen}
    onClose={() => setBulkStudentModalOpen(false)}
    getbatches={getbatches}
    getSchool={getshool}
    fetchData={fetchData}
/>

<TeacherModal
    open={teacherModalOpen}
    teacher={selectedTeacher}
    onClose={() => setTeacherModalOpen(false)}
    getbatches={getbatches}
    getSchool={getshool}
    fetchData={fetchData}
/>
                <Snackbar
                    open={openSnackbar}
                    autoHideDuration={3000}
                    onClose={handleSnackbarClose}
                    anchorOrigin={{
                        vertical: "top",
                        horizontal: "center",
                    }}
                >
                    <Alert
                        onClose={handleSnackbarClose}
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
            </ThemeProvider>

        </>
    );
};

export default SchoolAdminDashboard;
