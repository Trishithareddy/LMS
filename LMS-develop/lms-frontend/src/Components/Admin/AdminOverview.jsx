import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Grid,
    LinearProgress,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import {
    AddBusiness,
    AutoStories,
    Bolt,
    Checklist,
    Groups,
    ManageAccounts,
    School,
    Tune,
    WarningAmber,
} from "@mui/icons-material";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BreadcrumbContext } from "../BreadcrumbContext";

const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const StatCard = ({ icon: Icon, label, value, caption, color, bg }) => (
    <Paper sx={{ p: 2.25, height: "100%", borderRadius: 2, border: "1px solid #E2E8F0", bgcolor: bg }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ width: 42, height: 42, borderRadius: 1.5, bgcolor: "#FFFFFF", display: "grid", placeItems: "center", color }}>
                <Icon />
            </Box>
            <Typography sx={{ fontWeight: 900, fontSize: 34, lineHeight: 1, color: "#0F172A" }}>{value}</Typography>
        </Stack>
        <Typography sx={{ mt: 2, fontWeight: 900, color: "#334155" }}>{label}</Typography>
        <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>{caption}</Typography>
    </Paper>
);

const MiniMetric = ({ label, value, color = "#16A34A", total = 100 }) => (
    <Box sx={{ mb: 1.75 }}>
        <Stack direction="row" justifyContent="space-between" spacing={1}>
            <Typography sx={{ fontWeight: 800 }}>{label}</Typography>
            <Typography sx={{ fontWeight: 900 }}>{value}</Typography>
        </Stack>
        <LinearProgress
            variant="determinate"
            value={Math.min(100, total ? (Number(value || 0) / total) * 100 : 0)}
            sx={{
                mt: 0.75,
                height: 8,
                borderRadius: 999,
                bgcolor: "#E2E8F0",
                "& .MuiLinearProgress-bar": { bgcolor: color },
            }}
        />
    </Box>
);

const EmptyState = ({ children }) => (
    <Box sx={{ py: 2, color: "#64748B", fontSize: 14 }}>
        {children}
    </Box>
);

const DetailRow = ({ label, value, caption, color = "#15803D", onClick }) => (
    <Box
        onClick={onClick}
        sx={{
            py: 1,
            borderBottom: "1px solid #EEF2F7",
            cursor: onClick ? "pointer" : "default",
            borderRadius: 1,
            px: onClick ? 1 : 0,
            "&:hover": onClick ? { bgcolor: "#F8FAFC" } : undefined,
            "&:last-child": { borderBottom: 0 },
        }}
    >
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 900, color: "#0F172A" }} noWrap>{label}</Typography>
                {caption && <Typography variant="body2" color="text.secondary" noWrap>{caption}</Typography>}
            </Box>
            <Chip size="small" label={value} sx={{ fontWeight: 900, bgcolor: `${color}18`, color }} />
        </Stack>
    </Box>
);

const ActionItem = ({ icon: Icon, title, value, helper, color, onClick }) => (
    <Paper sx={{ p: 1.65, borderRadius: 2, border: `1px solid ${color}55`, bgcolor: `${color}0D` }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: "#FFFFFF", color, display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                <Icon fontSize="small" />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
                    <Chip size="small" label={value} sx={{ fontWeight: 900, bgcolor: color, color: "#FFFFFF" }} />
                </Stack>
                <Typography variant="body2" color="text.secondary">{helper}</Typography>
            </Box>
            <Button size="small" onClick={onClick} sx={{ fontWeight: 900, color }}>Open</Button>
        </Stack>
    </Paper>
);

const AdminOverview = () => {
    const navigate = useNavigate();
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [overview, setOverview] = useState(null);

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Admin Dashboard", path: "/admin-dashboard" },
            { name: "Overview", path: "/admin-dashboard" },
        ]);
    }, [setBreadcrumbTrail]);

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/admin/overview`,
                    { headers: authHeader() },
                );
                setOverview(response.data);
            } catch (err) {
                console.error("Error loading admin overview:", err);
                setError("Unable to load Super Admin dashboard right now.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <Box sx={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
                <CircularProgress />
            </Box>
        );
    }

    const totals = overview?.totals || {};
    const risks = overview?.riskAlerts || {};
    const content = overview?.contentHealth || {};
    const ai = overview?.aiUsage || {};
    const activity = overview?.schoolActivity || {};
    const onboarding = overview?.onboarding || {};
    const maxPlatform = Math.max(totals.batches || 0, totals.questions || 0, totals.schools || 0, 1);
    const openAiraIndexingFix = (chapter = content.chaptersMissingAiraList?.[0]) => {
        if (!chapter?._id) {
            navigate("/admin-dashboard/view-Courses");
            return;
        }
        navigate("/admin-dashboard/add-ebook", {
            state: {
                chapterId: chapter._id,
                chapterName: chapter.name || "",
                courseId: chapter.course || "",
                courseName: chapter.courseName || "",
                reason: "aira-indexing",
            },
        });
    };

    return (
        <Box sx={{ p: { xs: 1, md: 2 } }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2} sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="overline" sx={{ color: "#15803D", fontWeight: 900 }}>Super Admin</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: "#0F172A", letterSpacing: 0 }}>LMS Control Center</Typography>
                    <Typography color="text.secondary">Cross-school health, usage, onboarding, content readiness, and risk alerts.</Typography>
                </Box>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Button variant="contained" startIcon={<AddBusiness />} onClick={() => navigate("/admin-dashboard/create-schools")}>Add School</Button>
                    <Button variant="contained" startIcon={<ManageAccounts />} onClick={() => navigate("/admin-dashboard/create-school-admin")}>Add School Admin</Button>
                </Stack>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard icon={School} label="Schools" value={totals.schools || 0} caption={`${risks.schoolsWithoutAdmin || 0} without admin`} color="#15803D" bg="#ECFDF3" />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard icon={Groups} label="Students" value={totals.students || 0} caption={`${activity.activeStudents30d || 0} active in 30 days`} color="#2563EB" bg="#EFF6FF" />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard icon={ManageAccounts} label="Teachers" value={totals.teachers || 0} caption={`${activity.activeTeachers30d || 0} active in 30 days`} color="#7C3AED" bg="#F5F3FF" />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard icon={AutoStories} label="Courses" value={totals.courses || 0} caption={`${content.draftCourses || 0} draft/unpublished`} color="#EA580C" bg="#FFF7ED" />
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} lg={8}>
                    <Paper sx={{ p: 2.5, borderRadius: 2, border: "1px solid #E2E8F0", height: "100%" }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 900 }}>School Snapshot</Typography>
                                <Typography variant="body2" color="text.secondary">Largest schools by assigned students and teachers.</Typography>
                            </Box>
                            <Button variant="contained"onClick={() => navigate("/admin-dashboard/view-schools")} sx={{ fontWeight: 900 }}>View All</Button>
                        </Stack>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>School</TableCell>
                                        <TableCell>City</TableCell>
                                        <TableCell align="right">Students</TableCell>
                                        <TableCell align="right">Teachers</TableCell>
                                        <TableCell>School Admin</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(overview?.schoolRows || []).map((school) => (
                                        <TableRow key={school.id}>
                                            <TableCell sx={{ fontWeight: 900 }}>{school.name}</TableCell>
                                            <TableCell>{school.city}</TableCell>
                                            <TableCell align="right">{school.students}</TableCell>
                                            <TableCell align="right">{school.teachers}</TableCell>
                                            <TableCell><Chip size="small" label={school.admin} color={school.admin === "Not assigned" ? "warning" : "success"} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 2.5, borderRadius: 2, border: "1px solid #E2E8F0", height: "100%" }}>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>AIRA Usage</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Current month platform message usage.</Typography>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                            <Typography sx={{ fontWeight: 900 }}>{ai.usedCalls || 0} / {ai.monthlyLimit || 12000}</Typography>
                            <Chip size="small" label={`${ai.usagePercent || 0}%`} color={(ai.usagePercent || 0) > 85 ? "warning" : "success"} />
                        </Stack>
                        <LinearProgress variant="determinate" value={Math.min(ai.usagePercent || 0, 100)} sx={{ height: 10, borderRadius: 999, mb: 2 }} />
                        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                            <Chip size="small" label={`${ai.remainingCalls || 0} left`} sx={{ fontWeight: 900 }} />
                            <Chip size="small" label={`${ai.failed || 0} failed`} color={(ai.failed || 0) ? "warning" : "success"} sx={{ fontWeight: 900 }} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>Top AI features</Typography>
                        {(ai.byFeature || []).slice(0, 3).map((feature) => (
                            <DetailRow
                                key={feature._id || "unknown"}
                                label={feature._id || "Unknown"}
                                value={feature.calls}
                                color="#7C3AED"
                            />
                        ))}
                        {!ai.byFeature?.length && <EmptyState>No AIRA calls recorded this month.</EmptyState>}
                    </Paper>
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2.5, borderRadius: 2, border: "1px solid #E2E8F0", height: "100%" }}>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>Content Health</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Course content readiness across chapters.</Typography>
                        <MiniMetric label="Chapters with ebook" value={content.chaptersWithEbook || 0} total={content.totalChapters || 1} color="#16A34A" />
                        <MiniMetric label="Missing AIRA indexing" value={content.chaptersMissingAira || 0} total={content.totalChapters || 1} color="#F97316" />
                        <MiniMetric label="Missing videos" value={content.chaptersMissingVideo || 0} total={content.totalChapters || 1} color="#2563EB" />
                        <MiniMetric label="Draft courses" value={content.draftCourses || 0} total={totals.courses || 1} color="#7C3AED" />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>AIRA indexing gaps</Typography>
                        {(content.chaptersMissingAiraList || []).slice(0, 3).map((chapter) => (
                            <DetailRow
                                key={chapter._id}
                                label={chapter.name || "Untitled chapter"}
                                caption={chapter.courseName || "Course not tagged"}
                                value="Fix"
                                color="#F97316"
                                onClick={() => openAiraIndexingFix(chapter)}
                            />
                        ))}
                        {!content.chaptersMissingAiraList?.length && <EmptyState>All uploaded ebooks are ready for AIRA generation.</EmptyState>}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2.5, borderRadius: 2, border: "1px solid #E2E8F0", height: "100%" }}>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>Onboarding Funnel</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>School setup path from creation to active usage.</Typography>
                        {[
                            ["Schools created", onboarding.schoolsCreated],
                            ["Admins assigned", onboarding.adminsAssigned],
                            ["Teachers added", onboarding.teachersAdded],
                            ["Students added", onboarding.studentsAdded],
                            ["Active schools", onboarding.activeSchools],
                        ].map(([label, value]) => (
                            <MiniMetric key={label} label={label} value={value || 0} total={onboarding.schoolsCreated || 1} color="#16A34A" />
                        ))}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2.5, borderRadius: 2, border: "1px solid #E2E8F0", height: "100%" }}>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>AIRA By School</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Schools consuming the most AI messages this month.</Typography>
                        {(ai.bySchool || []).slice(0, 4).map((school) => (
                            <DetailRow
                                key={school._id || school.schoolName}
                                label={school.schoolName || "Unknown school"}
                                caption={`${school.failed || 0} failed calls`}
                                value={school.calls}
                                color="#2563EB"
                            />
                        ))}
                        {!ai.bySchool?.length && <EmptyState>No school-level AIRA usage recorded yet.</EmptyState>}
                    </Paper>
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2.5, borderRadius: 2, border: "1px solid #E2E8F0", height: "100%" }}>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>Platform Mix</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Configured core LMS objects.</Typography>
                        <MiniMetric label="Batches" value={totals.batches || 0} total={maxPlatform} color="#16A34A" />
                        <MiniMetric label="Question Bank" value={totals.questions || 0} total={maxPlatform} color="#2563EB" />
                        <MiniMetric label="Chapters" value={totals.chapters || 0} total={maxPlatform} color="#EA580C" />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2.5, borderRadius: 2, border: "1px solid #E2E8F0" }}>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>Risk Alerts</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Operational gaps Super Admin can fix.</Typography>
                        <Grid container spacing={1.5}>
                            <Grid item xs={12} md={6}>
                            <ActionItem icon={WarningAmber} title="Schools without admin" value={risks.schoolsWithoutAdmin || 0} helper="Assign ownership before school testing starts." color="#F97316" onClick={() => navigate("/admin-dashboard/create-school-admin", { state: { reason: "schools-without-admin" } })} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                            <ActionItem icon={Groups} title="Schools without students" value={risks.schoolsWithoutStudents || 0} helper="Schools created but not yet onboarded." color="#2563EB" onClick={() => navigate("/admin-dashboard/bulk-add-students", { state: { reason: "schools-without-students" } })} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                            <ActionItem icon={Checklist} title="Batches missing people" value={risks.emptyBatches || 0} helper="Batch needs both students and teacher assignment." color="#DC2626" onClick={() => navigate("/admin-dashboard/assign-candidates-to-batch", { state: { reason: "batches-missing-people" } })} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                            <ActionItem icon={AutoStories} title="Chapters not indexed for AIRA" value={risks.chaptersMissingAira || 0} helper="Ebook is visible but question generation cannot read it." color="#7C3AED" onClick={() => openAiraIndexingFix()} />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} lg={5}>
                    <Paper sx={{ p: 2.5, borderRadius: 2, border: "1px solid #E2E8F0" }}>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>Recent Actions</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Latest school admin operations recorded by the system.</Typography>
                        <Stack spacing={1}>
                            {(overview?.recentActions || []).slice(0, 6).map((item) => (
                                <Paper key={item.id} sx={{ p: 1.25, border: "1px solid #E2E8F0", borderRadius: 1.5 }}>
                                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                                        <Typography sx={{ fontWeight: 900 }}>{item.action}</Typography>
                                        <Typography variant="caption" color="text.secondary">{new Date(item.createdAt).toLocaleDateString("en-IN")}</Typography>
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary">{item.school || item.targetName}</Typography>
                                </Paper>
                            ))}
                            {!overview?.recentActions?.length && (
                                <Typography color="text.secondary">No recent actions recorded yet.</Typography>
                            )}
                        </Stack>
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2.5, borderRadius: 2, border: "1px solid #E2E8F0" }}>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>Quick Operations</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Common Super Admin workflows.</Typography>
                        <Grid container spacing={1.5}>
                            {[
                                ["Create Course", "/admin-dashboard/create-course"],
                                ["Bulk Add Students", "/admin-dashboard/bulk-add-students"],
                                ["Bulk Add Teachers", "/admin-dashboard/bulk-add-teachers"],
                                ["Create Batch", "/admin-dashboard/create-batch"],
                                ["Question Base", "/admin-dashboard/question-base-tabs"],
                                ["School Admins", "/admin-dashboard/view-school-admin"],
                            ].map(([label, path]) => (
                                <Grid item xs={12} sm={6} md={4} key={label}>
                                    <Button fullWidth variant="outlined" startIcon={<Tune />} onClick={() => navigate(path)} sx={{ justifyContent: "flex-start", minHeight: 48, fontWeight: 900 }}>
                                        {label}
                                    </Button>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminOverview;
