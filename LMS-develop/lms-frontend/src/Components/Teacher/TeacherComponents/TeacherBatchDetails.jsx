import {
    Box,
    Button,
    ButtonGroup,
    List,
    ListItem,
    ListItemText,
    Typography,
} from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';
import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { BreadcrumbContext } from "../../BreadcrumbContext";
import {
    Grid,
    Card,
    CardContent,
    Avatar,
    Stack,
    Chip,
    Paper,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { useLocation, useNavigate } from "react-router-dom";
const TeacherBatchDetails = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const batchId = location.state._id;
    const from = location.state.from
    const [data, setData] = useState({});
    const [teacherMongoDbId, setTeacherMongoDbId] = useState(null);
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);



    useEffect(() => {
        const fetchBatchDetails = async () => {
            try {
                const token = localStorage.getItem("token");

                const { data } = await axios.get(
                    `${import.meta.env.VITE_API_URL}/teacher/getBatchBasicInfo/${batchId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                const { batch } = data;
                setTeacherMongoDbId(batch.teacherMongoDbId);

                // Find the main teacher
                setData(batch);
                // const teacherToHighlight = batch.teachers.find(
                //     (teacher) => teacher._id === batch.teacherMongoDbId
                // );

                // // Build new teacher list immutably
                // const updatedTeachers = teacherToHighlight
                //     ? [
                //         teacherToHighlight,
                //         ...batch.teachers.filter(
                //             (teacher) => teacher._id !== batch.teacherMongoDbId
                //         ),
                //     ]
                //     : [...batch.teachers];

                // // Update state with immutability
                // setData({
                //     ...batch,
                //     teachers: updatedTeachers,
                // });
            } catch (error) {
                console.error("Error fetching batch details:", error);
            }
        };

        fetchBatchDetails();
    }, [location]);

    useEffect(() => {
        setBreadcrumbTrail([
            { name: 'Teacher Dashboard', path: '/teacher-dashboard' },
            ...(from === "batches" || from === "batchDetails"
                ? [{ name: 'Batches', path: '/teacher-dashboard/batches' }]
                : []),
            ...(from === "studentDetails"
                ? [{ name: 'Students', path: '/teacher-dashboard/students' }]
                : []),

            { name: `Batch Details`, path: '/teacher-dashboard/batchdetails', state: { "_id": `${batchId}` } }



        ]);
    }, []);


    const students = (studentsData) => {
        navigate("/teacher-dashboard/students", {
            state: {
                students: studentsData,
            },
        });
    };

    const goToCourse = (id) => {

        navigate("/my-learning1", {
            state: {
                "courseIdSent": id,
                "_id": batchId,
                "from": from === "studentDetails" ? "studentDetails" : "batchDetails"
            },
        });
    };
    const getClassInSuperscriptFormat = (classSended, lastELementOrNot) => {

        const numbers = [];
        const letters = [];

        for (let char of classSended) {
            if (/[0-9]/.test(char)) {
                numbers.push(char);
            } else if (/[a-zA-Z]/.test(char)) {
                letters.push(char);
            }
        }
        if (lastELementOrNot) {
            return (
                <p>
                    {numbers.join("")}
                    <sup>{letters.join("")}</sup>
                </p>
            );
        }
        return (
            <p>
                {numbers.join("")}
                <sup>{letters.join("")}</sup>,
            </p>
        );
    };
    return (
        <div>
            {Object.keys(data).length !== 0 && (
                <Box p={3} width="100%">

                    {/* HEADER */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            mb: 3,
                            borderRadius: 3,
                            border: 1,
                            borderColor: "divider",
                            bgcolor: "background.paper",
                            position: "relative",
                            overflow: "hidden",

                            "&::before": {
                                content: '""',
                                position: "absolute",
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: 6,
                                bgcolor: "primary.main",
                            },
                        }}
                    >
                        <Box sx={{ pl: 2 }}>
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 800,
                                    color: "text.primary",
                                    mb: 0.5,
                                }}
                            >
                                {data.batchName}
                            </Typography>

                            <Typography
                                variant="body1"
                                sx={{
                                    color: "text.secondary",
                                }}
                            >
                                {data.students.length} Students • {data.courses.length} Courses
                            </Typography>
                        </Box>
                    </Paper>
                    {/* COURSES */}
                    <Typography variant="h6" mb={2}>
                        📚 Courses
                    </Typography>

                    <Grid container spacing={2}>
                        {data.courses.map((course) => (
                            <Grid item xs={12} md={6} key={course._id}>
                                <Card sx={{ borderRadius: "16px", p: 2 }}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <img
                                            src={course.imageUrl}
                                            style={{ width: 100, borderRadius: 10 }}
                                        />
                                        <Box flex={1}>
                                            <Typography fontWeight="600">{course.name}</Typography>
                                            <Button
                                                variant="contained"
                                                sx={{ mt: 1 }}
                                                onClick={() => goToCourse(course._id)}
                                            >
                                                Go
                                            </Button>
                                        </Box>
                                    </Box>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* TEACHERS */}
                    {/* <Typography variant="h6" mt={4} mb={2}>
      👩‍🏫 Teachers
    </Typography>

    <Box sx={{ p: 2, background: "#fafafa", borderRadius: "12px" }}>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {data.teachers.map((teacher) => (
          <Chip
            key={teacher._id}
            label={`${teacher.name} ${
              teacher._id === teacherMongoDbId ? "(You)" : ""
            }`}
            color={teacher._id === teacherMongoDbId ? "success" : "default"}
          />
        ))}
      </Stack>
    </Box> */}

                    {/* STUDENTS */}
                    <Typography variant="h6" mt={4} mb={2}>
                        👨‍🎓 Students
                    </Typography>

                    <Card
                        sx={{
                            p: 2,
                            borderRadius: "16px",
                            cursor: "pointer",
                        }}
                        onClick={() => students(data.students)}
                    >
                        <Typography fontWeight="600">
                            Total Students: {data.students.length}
                        </Typography>
                    </Card>

                </Box>
            )}

        </div>
    );
};

export default TeacherBatchDetails;