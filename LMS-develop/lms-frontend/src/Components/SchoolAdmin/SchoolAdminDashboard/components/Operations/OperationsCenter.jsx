import React, { useEffect, useMemo, useState } from "react";
import {
    Alert, Box, Button, Card, CardContent, Checkbox, Chip, CircularProgress,
    FormControlLabel, Grid, MenuItem, Paper, Snackbar, Stack, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
    Typography
} from "@mui/material";
import {
    AdminPanelSettings, Archive, AssignmentInd, Download, FactCheck, FileUpload,
    History, LockReset, ManageAccounts, NotificationsActive, Route, Settings,
    SwapHoriz, WarningAmber
} from "@mui/icons-material";
import axios from "axios";
import Papa from "papaparse";

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const downloadText = (filename, content) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

const asCsv = (rows) => {
    if (!rows.length) return "";
    const keys = Object.keys(rows[0]);
    const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    return [keys.join(","), ...rows.map((row) => keys.map((key) => escape(row[key])).join(","))].join("\n");
};

const PanelTitle = ({ icon: Icon, title, subtitle }) => (
    <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: "#E8F5E9", display: "grid", placeItems: "center", color: "#2E7D32" }}>
                <Icon />
            </Box>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>{title}</Typography>
                <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
            </Box>
        </Stack>
    </Box>
);

const OperationsCenter = ({ onViewChange }) => {
    const [tab, setTab] = useState(0);
    const [adminData, setAdminData] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [activities, setActivities] = useState([]);
    const [quality, setQuality] = useState(null);
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [assignmentForm, setAssignmentForm] = useState({ batchId: "", studentId: "", teacherId: "" });
    const [resetForm, setResetForm] = useState({ userType: "student", userId: "", password: "" });
    const [bulkType, setBulkType] = useState("students");
    const [bulkRows, setBulkRows] = useState([]);
    const [settingsForm, setSettingsForm] = useState({});
    const [transferForm, setTransferForm] = useState({ studentId: "", batchId: "", studentClass: "", section: "", reason: "" });
    const [noticeForm, setNoticeForm] = useState({ title: "", announcementContent: "", priority: "normal" });

    const showMessage = (message, severity = "success") => setSnackbar({ open: true, message, severity });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [adminResponse, analyticsResponse, activityResponse, qualityResponse, transferResponse] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/school-admin/get-logged-school-admin`, { headers: authHeader() }),
                axios.get(`${import.meta.env.VITE_API_URL}/school-admin/analytics`, { headers: authHeader() }),
                axios.get(`${import.meta.env.VITE_API_URL}/school-admin/activity-log`, { headers: authHeader() }),
                axios.get(`${import.meta.env.VITE_API_URL}/school-admin/data-quality`, { headers: authHeader() }),
                axios.get(`${import.meta.env.VITE_API_URL}/school-admin/student-transfers`, { headers: authHeader() }),
            ]);
            setAdminData(adminResponse.data.schoolAdmin);
            setAnalytics(analyticsResponse.data.analytics);
            setActivities(activityResponse.data.activities || []);
            setQuality(qualityResponse.data.checks);
            setTransfers(transferResponse.data.transfers || []);
            setSettingsForm(adminResponse.data.schoolAdmin.school || {});
        } catch (error) {
            console.error("Error loading operations center:", error);
            showMessage("Unable to load operations center", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const school = adminData?.school || {};
    const batches = adminData?.batches || [];
    const students = school.students || [];
    const teachers = school.teachers || [];
    const permissions = settingsForm.teacherPermissions || {};

    const unassignedStudents = useMemo(() => students.filter((student) => !student.batches?.length), [students]);
    const unassignedTeachers = useMemo(() => teachers.filter((teacher) => !teacher.batches?.length), [teachers]);
    const inactiveUsers = useMemo(() => [
        ...students.filter((student) => !student.isActive).map((user) => ({ ...user, type: "student" })),
        ...teachers.filter((teacher) => !teacher.isActive).map((user) => ({ ...user, type: "teacher" })),
    ], [students, teachers]);

    const validateBulkRows = (rows) => {
        const existing = new Set([...students, ...teachers].map((user) => String(user.username || "").toLowerCase()));
        return rows.map((row, index) => {
            const errors = [];
            ["name", "username", "password"].forEach((field) => { if (!row[field]) errors.push(`${field} missing`); });
            if (bulkType === "students" && !(row.studentClass || row.class)) errors.push("class missing");
            if (bulkType === "students" && !row.section) errors.push("section missing");
            if (existing.has(String(row.username || "").toLowerCase())) errors.push("username exists");
            return { ...row, row: index + 1, errors };
        });
    };

    const validatedRows = useMemo(() => validateBulkRows(bulkRows), [bulkRows, bulkType, students, teachers]);
    const validBulkRows = validatedRows.filter((row) => !row.errors.length);

    const handleAssign = async (kind) => {
        if (!assignmentForm.batchId) return showMessage("Select a batch first", "warning");
        const id = kind === "student" ? assignmentForm.studentId : assignmentForm.teacherId;
        if (!id) return showMessage(`Select a ${kind}`, "warning");
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/admin/batch/assign`, {
                batchId: assignmentForm.batchId,
                studentIds: kind === "student" ? [id] : [],
                teacherIds: kind === "teacher" ? [id] : [],
            }, { headers: authHeader() });
            showMessage(`${kind === "student" ? "Student" : "Teacher"} assigned successfully`);
            setAssignmentForm((prev) => ({ ...prev, [`${kind}Id`]: "" }));
            fetchData();
        } catch (error) {
            showMessage(error.response?.data?.error || "Unable to assign", "error");
        }
    };

    const handleBulkUpload = async () => {
        if (!validBulkRows.length) return showMessage("No valid CSV rows to upload", "warning");
        const schoolId = school._id;
        const payload = bulkType === "students"
            ? { students: validBulkRows.map((row) => ({ name: row.name, username: row.username, password: row.password, age: Number(row.age || 10), contact: row.contact || "NA", fatherName: row.fatherName || "NA", address: row.address || "NA", schoolId, studentClass: row.studentClass || row.class, section: row.section, batchId: row.batchId ? [row.batchId] : [] })) }
            : { teachers: validBulkRows.map((row) => ({ name: row.name, username: row.username, password: row.password, schoolId, batchId: row.batchId ? [row.batchId] : [] })) };
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/admin/${bulkType === "students" ? "student" : "teacher"}/create`, payload, { headers: authHeader() });
            showMessage(`${validBulkRows.length} ${bulkType} uploaded`);
            setBulkRows([]);
            fetchData();
        } catch (error) {
            showMessage(error.response?.data?.message || "Unable to upload CSV", "error");
        }
    };

    const saveSettings = async () => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/school-admin/settings`, settingsForm, { headers: authHeader() });
            showMessage("School settings saved");
            fetchData();
        } catch (error) {
            showMessage(error.response?.data?.message || "Unable to save settings", "error");
        }
    };

    const handleResetPassword = async () => {
        if (!resetForm.userId || !resetForm.password) return showMessage("Select user and enter password", "warning");
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/school-admin/reset-password`, resetForm, { headers: authHeader() });
            showMessage("Password reset successfully");
            setResetForm((prev) => ({ ...prev, userId: "", password: "" }));
            fetchData();
        } catch (error) {
            showMessage(error.response?.data?.message || "Unable to reset password", "error");
        }
    };

    const transferStudent = async () => {
        if (!transferForm.studentId || !transferForm.batchId) return showMessage("Select student and target batch", "warning");
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/school-admin/transfer-student`, transferForm, { headers: authHeader() });
            showMessage("Student transferred");
            setTransferForm({ studentId: "", batchId: "", studentClass: "", section: "", reason: "" });
            fetchData();
        } catch (error) {
            showMessage(error.response?.data?.message || "Unable to transfer student", "error");
        }
    };

    const postNotice = async () => {
        if (!noticeForm.title || !noticeForm.announcementContent) return showMessage("Title and message are required", "warning");
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/school-admin/school-notice`, noticeForm, { headers: authHeader() });
            showMessage("Notice posted");
            setNoticeForm({ title: "", announcementContent: "", priority: "normal" });
            fetchData();
        } catch (error) {
            showMessage(error.response?.data?.message || "Unable to post notice", "error");
        }
    };

    const archiveBatch = async (batchId, archived) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/school-admin/batch/${batchId}/archive`, { archived }, { headers: authHeader() });
            showMessage(archived ? "Batch archived" : "Batch restored");
            fetchData();
        } catch (error) {
            showMessage(error.response?.data?.message || "Unable to update batch", "error");
        }
    };

    if (loading) return <Box sx={{ minHeight: "75vh", display: "grid", placeItems: "center" }}><CircularProgress /></Box>;

    const tabLabels = ["Wizard", "Permissions", "Academic Year", "Data Quality", "Parent Export", "Notice Board", "Import Preview", "Transfer", "Workload", "Archive", "Settings", "Activity"];
    const operationGroups = [
        {
            title: "Setup",
            subtitle: "School defaults and readiness checks",
            color: "#16A34A",
            icon: Route,
            items: [
                { tab: 0, label: "Setup Wizard", count: batches.length },
                { tab: 2, label: "Academic Year", count: settingsForm.academicYear ? "Set" : "Open" },
                { tab: 3, label: "Data Quality", count: (quality?.studentsWithoutBatch?.length || 0) + (quality?.teachersWithoutBatch?.length || 0) },
                { tab: 10, label: "Settings", count: "Edit" },
            ],
        },
        {
            title: "People",
            subtitle: "Imports, transfers, and teacher permissions",
            color: "#2563EB",
            icon: ManageAccounts,
            items: [
                { tab: 1, label: "Permissions", count: "Role" },
                { tab: 6, label: "Bulk Import", count: validBulkRows.length || "CSV" },
                { tab: 7, label: "Transfer", count: transfers.length },
                { tab: 8, label: "Workload", count: analytics?.teachers?.length || teachers.length },
            ],
        },
        {
            title: "Communication",
            subtitle: "Parent export and school notices",
            color: "#EA580C",
            icon: NotificationsActive,
            items: [
                { tab: 4, label: "Parent Export", count: students.length },
                { tab: 5, label: "Notice Board", count: analytics?.totals?.announcements || "Post" },
            ],
        },
        {
            title: "Governance",
            subtitle: "Archive and audit controls",
            color: "#7C3AED",
            icon: History,
            items: [
                { tab: 9, label: "Archive", count: batches.filter((batch) => (batch.status || "active") === "archived").length },
                { tab: 11, label: "Activity Log", count: activities.length },
            ],
        },
    ];
    const activeTabLabel = tabLabels[tab] || "Operations";
    const activeGroup = operationGroups.find((group) =>
        group.items.some((item) => item.tab === tab),
    ) || operationGroups[0];

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: "#0F172A" }}>School Operations Center</Typography>
                <Typography color="text.secondary">Setup, permissions, imports, transfers, notices, archive, and audit controls.</Typography>
            </Box>
            <Paper
                sx={{
                    mb: 2.5,
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.05)",
                    bgcolor: "#FFFFFF",
                }}
            >
                <Grid container spacing={1}>
                    {operationGroups.map((group) => {
                        const isActiveGroup = group.title === activeGroup.title;
                        const Icon = group.icon;

                        return (
                            <Grid item xs={12} sm={6} lg={3} key={group.title}>
                                <Button
                                    fullWidth
                                    onClick={() => setTab(group.items[0].tab)}
                                    sx={{
                                        minHeight: 70,
                                        justifyContent: "flex-start",
                                        gap: 1.25,
                                        px: 1.5,
                                        borderRadius: 1.5,
                                        border: `1px solid ${isActiveGroup ? group.color : "#E5E7EB"}`,
                                        bgcolor: isActiveGroup ? `${group.color}10` : "#F8FAFC",
                                        color: "#0F172A",
                                        textAlign: "left",
                                        textTransform: "none",
                                    }}
                                >
                                    <Box sx={{ width: 38, height: 38, borderRadius: 1.5, bgcolor: isActiveGroup ? group.color : "#FFFFFF", color: isActiveGroup ? "#FFFFFF" : group.color, display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                                        <Icon fontSize="small" />
                                    </Box>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography sx={{ fontWeight: 900, lineHeight: 1.15 }}>
                                            {group.title}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25, whiteSpace: "normal", lineHeight: 1.25 }}>
                                            {group.subtitle}
                                        </Typography>
                                    </Box>
                                </Button>
                            </Grid>
                        );
                    })}
                </Grid>
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #E2E8F0" }}>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                        <Typography variant="overline" sx={{ color: "#64748B", fontWeight: 900, mr: 0.5 }}>
                            {activeGroup.title}
                        </Typography>
                        {activeGroup.items.map((item) => {
                            const isActive = item.tab === tab;

                            return (
                                <Button
                                    key={item.label}
                                    onClick={() => setTab(item.tab)}
                                    sx={{
                                        minHeight: 38,
                                        px: 1.5,
                                        borderRadius: 999,
                                        border: `1px solid ${isActive ? activeGroup.color : "#CBD5E1"}`,
                                        bgcolor: isActive ? activeGroup.color : "#FFFFFF",
                                        color: isActive ? "#FFFFFF" : "#0F172A",
                                        textTransform: "none",
                                        fontWeight: 800,
                                        gap: 1,
                                    }}
                                >
                                    {item.label}
                                    <Box component="span" sx={{ px: 0.8, py: 0.15, borderRadius: 999, bgcolor: isActive ? "rgba(255,255,255,0.22)" : "#F1F5F9", color: isActive ? "#FFFFFF" : "#475569", fontSize: 12, fontWeight: 900 }}>
                                        {item.count}
                                    </Box>
                                </Button>
                            );
                        })}
                    </Stack>
                </Box>
            </Paper>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <Typography variant="overline" sx={{ color: "#64748B", fontWeight: 900 }}>Open Panel</Typography>
                <Chip label={activeTabLabel} sx={{ fontWeight: 900, bgcolor: `${activeGroup.color}14`, color: activeGroup.color }} />
            </Stack>

            {tab === 0 && <Card><CardContent><PanelTitle icon={Route} title="Setup Wizard" subtitle="Create people, assign batches, verify courses, and review reports." /><Grid container spacing={2}>{[["Add students", "students"], ["Add teachers", "teachers"], ["Assign batches", 6], ["Check data quality", 3], ["Open reports", "analytics"]].map(([label, target]) => <Grid item xs={12} md={2.4} key={label}><Paper sx={{ p: 2, border: "1px solid #E5E7EB", borderRadius: 2 }}><Typography sx={{ fontWeight: 900 }}>{label}</Typography><Button size="small" onClick={() => typeof target === "number" ? setTab(target) : onViewChange?.(target)}>Open</Button></Paper></Grid>)}</Grid></CardContent></Card>}

            {tab === 1 && <Card><CardContent><PanelTitle icon={AdminPanelSettings} title="Role Permissions" subtitle="Decide what teachers can do in this school." />{["createAssignments", "createQuizzes", "reviewProjects", "sendAnnouncements", "unlockChapters"].map((key) => <FormControlLabel key={key} control={<Checkbox checked={permissions[key] !== false} onChange={(e) => setSettingsForm({ ...settingsForm, teacherPermissions: { ...permissions, [key]: e.target.checked } })} />} label={key.replace(/([A-Z])/g, " $1")} />)}<Box><Button variant="contained" onClick={saveSettings}>Save Permissions</Button></Box></CardContent></Card>}

            {tab === 2 && <Card><CardContent><PanelTitle icon={Settings} title="Academic Year / Term" subtitle="Keep school-level reporting aligned to the current academic period." /><Grid container spacing={2}><Grid item xs={12} md={4}><TextField fullWidth label="Academic Year" value={settingsForm.academicYear || ""} onChange={(e) => setSettingsForm({ ...settingsForm, academicYear: e.target.value })} /></Grid><Grid item xs={12} md={4}><TextField fullWidth label="Term" value={settingsForm.term || ""} onChange={(e) => setSettingsForm({ ...settingsForm, term: e.target.value })} /></Grid><Grid item xs={12} md={4}><Button fullWidth sx={{ height: "100%" }} variant="contained" onClick={saveSettings}>Save</Button></Grid></Grid></CardContent></Card>}

            {tab === 3 && <Card><CardContent><PanelTitle icon={FactCheck} title="Data Quality Checks" subtitle="Find duplicate usernames, missing class/section/contact info, and unassigned users." />{[["Duplicate usernames", quality?.duplicateUsernames], ["Missing student data", quality?.missingStudentData], ["Students without batch", quality?.studentsWithoutBatch], ["Teachers without batch", quality?.teachersWithoutBatch]].map(([label, rows]) => <Paper key={label} sx={{ p: 2, mb: 1.5, border: "1px solid #E5E7EB" }}><Stack direction="row" justifyContent="space-between"><Typography sx={{ fontWeight: 900 }}>{label}</Typography><Chip label={rows?.length || 0} /></Stack></Paper>)}</CardContent></Card>}

            {tab === 4 && <Card><CardContent><PanelTitle icon={Download} title="Parent Contact Export" subtitle="Export student contact data for school communication." /><Button variant="contained" startIcon={<Download />} onClick={() => downloadText("parent-contact-export.csv", asCsv(students.map((s) => ({ name: s.name, username: s.username, class: s.class, section: s.section, fatherName: s.fatherName, contact: s.contact, address: s.address }))))}>Export CSV</Button></CardContent></Card>}

            {tab === 5 && <Card><CardContent><PanelTitle icon={NotificationsActive} title="School Notice Board" subtitle="Post a school-wide notice to batches under this school admin." /><Grid container spacing={2}><Grid item xs={12} md={4}><TextField fullWidth label="Title" value={noticeForm.title} onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} /></Grid><Grid item xs={12} md={3}><TextField select fullWidth label="Priority" value={noticeForm.priority} onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}><MenuItem value="normal">Normal</MenuItem><MenuItem value="important">Important</MenuItem><MenuItem value="urgent">Urgent</MenuItem></TextField></Grid><Grid item xs={12}><TextField fullWidth multiline minRows={4} label="Message" value={noticeForm.announcementContent} onChange={(e) => setNoticeForm({ ...noticeForm, announcementContent: e.target.value })} /></Grid><Grid item xs={12}><Button variant="contained" onClick={postNotice}>Post Notice</Button></Grid></Grid></CardContent></Card>}

            {tab === 6 && <Card><CardContent><PanelTitle icon={FileUpload} title="Import Preview Validation" subtitle="Upload CSV, fix invalid rows, then create only valid records." /><Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}><TextField select label="Upload type" value={bulkType} onChange={(e) => { setBulkType(e.target.value); setBulkRows([]); }}><MenuItem value="students">Students</MenuItem><MenuItem value="teachers">Teachers</MenuItem></TextField><Button variant="outlined" startIcon={<Download />} onClick={() => downloadText(bulkType === "students" ? "student-template.csv" : "teacher-template.csv", bulkType === "students" ? "name,username,password,age,contact,fatherName,address,studentClass,section,batchId\n" : "name,username,password,batchId\n")}>Template</Button><Button component="label" variant="outlined" startIcon={<FileUpload />}>Upload CSV<input hidden type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && Papa.parse(e.target.files[0], { header: true, skipEmptyLines: true, complete: ({ data }) => setBulkRows(data) })} /></Button><Button variant="contained" onClick={handleBulkUpload}>Create Valid Rows</Button></Stack><Typography>{validBulkRows.length} valid / {validatedRows.length} total rows</Typography><TableContainer sx={{ maxHeight: 320 }}><Table size="small"><TableHead><TableRow><TableCell>Row</TableCell><TableCell>Name</TableCell><TableCell>Username</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>{validatedRows.map((row) => <TableRow key={row.row}><TableCell>{row.row}</TableCell><TableCell>{row.name}</TableCell><TableCell>{row.username}</TableCell><TableCell>{row.errors.length ? <Chip color="error" label={row.errors.join(", ")} /> : <Chip color="success" label="Valid" />}</TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card>}

            {tab === 7 && <Card><CardContent><PanelTitle icon={SwapHoriz} title="Transfer Student" subtitle="Move a student to another batch/class/section and keep transfer history." /><Grid container spacing={2}><Grid item xs={12} md={3}><TextField select fullWidth label="Student" value={transferForm.studentId} onChange={(e) => setTransferForm({ ...transferForm, studentId: e.target.value })}>{students.map((s) => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={3}><TextField select fullWidth label="Target batch" value={transferForm.batchId} onChange={(e) => setTransferForm({ ...transferForm, batchId: e.target.value })}>{batches.map((b) => <MenuItem key={b._id} value={b._id}>{b.batchName}</MenuItem>)}</TextField></Grid><Grid item xs={6} md={2}><TextField fullWidth label="Class" value={transferForm.studentClass} onChange={(e) => setTransferForm({ ...transferForm, studentClass: e.target.value })} /></Grid><Grid item xs={6} md={2}><TextField fullWidth label="Section" value={transferForm.section} onChange={(e) => setTransferForm({ ...transferForm, section: e.target.value })} /></Grid><Grid item xs={12} md={2}><Button fullWidth sx={{ height: "100%" }} variant="contained" onClick={transferStudent}>Transfer</Button></Grid><Grid item xs={12}><TextField fullWidth label="Reason" value={transferForm.reason} onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })} /></Grid></Grid><TableContainer sx={{ mt: 2, maxHeight: 260 }}><Table size="small"><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Student</TableCell><TableCell>To Batch</TableCell><TableCell>Class</TableCell><TableCell>Reason</TableCell></TableRow></TableHead><TableBody>{transfers.map((t) => <TableRow key={t._id}><TableCell>{new Date(t.createdAt).toLocaleDateString("en-IN")}</TableCell><TableCell>{t.student?.name}</TableCell><TableCell>{t.toBatch?.batchName || "-"}</TableCell><TableCell>{t.toClass}-{t.toSection}</TableCell><TableCell>{t.reason}</TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card>}

            {tab === 8 && <Card><CardContent><PanelTitle icon={AssignmentInd} title="Teacher Workload" subtitle="Teacher batch count, attendance sessions, assignments, quizzes, announcements, and reviews." /><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Teacher</TableCell><TableCell>Batches</TableCell><TableCell>Attendance</TableCell><TableCell>Assignments</TableCell><TableCell>Quizzes</TableCell><TableCell>Announcements</TableCell><TableCell>Reviews</TableCell></TableRow></TableHead><TableBody>{(analytics?.teachers || []).map((t) => <TableRow key={t.id}><TableCell>{t.name}</TableCell><TableCell>{t.batches}</TableCell><TableCell>{t.attendanceSessions}</TableCell><TableCell>{t.assignmentsCreated}</TableCell><TableCell>{t.quizzesCreated}</TableCell><TableCell>{t.announcementsSent}</TableCell><TableCell>{t.projectReviews}</TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card>}

            {tab === 9 && <Card><CardContent><PanelTitle icon={Archive} title="Archive Batch" subtitle="Archive old batches instead of deleting them." /><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Batch</TableCell><TableCell>Students</TableCell><TableCell>Teachers</TableCell><TableCell>Status</TableCell><TableCell>Action</TableCell></TableRow></TableHead><TableBody>{batches.map((b) => <TableRow key={b._id}><TableCell>{b.batchName}</TableCell><TableCell>{b.students?.length || 0}</TableCell><TableCell>{b.teachers?.length || 0}</TableCell><TableCell><Chip label={b.status || "active"} /></TableCell><TableCell><Button size="small" onClick={() => archiveBatch(b._id, (b.status || "active") !== "archived")}>{(b.status || "active") === "archived" ? "Restore" : "Archive"}</Button></TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card>}

            {tab === 10 && <Card><CardContent><PanelTitle icon={Settings} title="School Settings" subtitle="Logo/contact details can stay with existing profile; these are operating defaults." /><Grid container spacing={2}><Grid item xs={12} md={4}><TextField fullWidth label="School Name" value={settingsForm.name || ""} onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })} /></Grid><Grid item xs={12} md={4}><TextField fullWidth label="Phone" value={settingsForm.phoneNumber || ""} onChange={(e) => setSettingsForm({ ...settingsForm, phoneNumber: e.target.value })} /></Grid><Grid item xs={12} md={4}><TextField fullWidth type="number" label="Attendance Threshold" value={settingsForm.attendanceThreshold || 75} onChange={(e) => setSettingsForm({ ...settingsForm, attendanceThreshold: Number(e.target.value) })} /></Grid><Grid item xs={12}><TextField fullWidth label="Default Password Rule" value={settingsForm.defaultPasswordRule || ""} onChange={(e) => setSettingsForm({ ...settingsForm, defaultPasswordRule: e.target.value })} /></Grid><Grid item xs={12}><Button variant="contained" onClick={saveSettings}>Save Settings</Button></Grid></Grid></CardContent></Card>}

            {tab === 11 && <Card><CardContent><PanelTitle icon={History} title="School Admin Activity Log" subtitle="Recent school-admin actions for accountability." /><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Time</TableCell><TableCell>Action</TableCell><TableCell>Target</TableCell><TableCell>Details</TableCell></TableRow></TableHead><TableBody>{activities.map((a) => <TableRow key={a._id}><TableCell>{new Date(a.createdAt).toLocaleString("en-IN")}</TableCell><TableCell>{a.action}</TableCell><TableCell>{a.targetName || a.targetType}</TableCell><TableCell>{a.details}</TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card>}

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default OperationsCenter;
