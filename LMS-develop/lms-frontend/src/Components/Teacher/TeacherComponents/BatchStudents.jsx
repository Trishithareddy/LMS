
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import {
    Box,
    Button,
    Chip,
    Container,
    Grid,
    IconButton,
    MenuItem,
    Modal,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    CircularProgress,
} from "@mui/material";
import React from "react";

import axios from "axios";
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BreadcrumbContext } from "../../BreadcrumbContext";

const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
};
const style1 = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 300,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
    display: "flex",
    flexDirection: "column",
};

function StudentTable() {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);

    const [open, setOpen] = React.useState(null);
    const [fathername, setFathername] = useState("");
    const [passWord, setPassWord] = useState("");
    const handleOpen = (id) => setOpen(id);
    const handleClose = () => setOpen(null);
    const [data, setData] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [schoolName, setSchoolName] = useState("");
    const [searchTags, setSearchTags] = useState({});
    const [currentField, setCurrentField] = useState("studentId");
    const [currentField1, setCurrentField1] = useState("name");
    const [currentInput, setCurrentInput] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [batchName, setBatchName] = useState("");
    const [courseName, setCourseName] = useState("");
    const [sortConfig, setSortConfig] = useState({});
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    const handleSortRequest = (property) => {
        setSortConfig((prevConfig) => {
            const currentDirection = prevConfig[property];
            if (currentDirection === "asc") {
                return { ...prevConfig, [property]: "desc" };
            } else if (currentDirection === "desc") {
                const newConfig = { ...prevConfig };
                delete newConfig[property];
                return newConfig;
            } else {
                return { ...prevConfig, [property]: "asc" };
            }
        });
    };

    const sortData = (data, sortConfig) => {
        const sortableData = [...data];
        const sortEntries = Object.entries(sortConfig);
        if (sortEntries.length === 0) return sortableData;

        sortableData.sort((a, b) => {
            for (const [key, direction] of sortEntries) {
                if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
                if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
            }
            return 0;
        });

        return sortableData;
    };

    const handleChange = (event) => {
        setPassword(event.target.value);
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Teacher Dashboard", path: "/teacher-dashboard" },
            { name: "Students", path: "/teacher-dashboard/students" },
        ]);
    }, [setBreadcrumbTrail]);

    useEffect(() => {
        const fetchBatches = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/teacher/test`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                for (const ele of response.data) {
                    var batchesArray = [];
                    var coursesArray = [];
                    var schoolArray = [];
                    for (const ele1 of ele.batches) {
                        batchesArray.push(ele1.batchId);
                    }

                    batchesArray.sort((a, b) => a - b);

                    ele["batchesString"] = batchesArray.join();
                    ele["batches"] = ele.batches.sort(
                        (a, b) => a.batchId - b.batchId
                    );

                    for (const ele2 of ele.courses) {
                        if (ele2.courseId !== undefined) {
                            coursesArray.push(ele2.courseId);
                        }
                    }
                    coursesArray.sort((a, b) => a - b);
                    ele["courses"] = ele.courses.sort(
                        (a, b) => a.courseId - b.courseId
                    );
                    ele["coursesString"] = coursesArray.join();

                    for (const ele3 of ele.school) {
                        if (ele3.schoolId !== undefined) {
                            schoolArray.push(ele3.schoolId);
                        }
                    }
                    if (schoolArray.length === 0) {
                        ele["schoolString"] = ",";
                    } else {
                        schoolArray.sort((a, b) => a - b);
                        ele["schoolString"] = schoolArray.join();
                    }
                    const options = {
                        timeZone: "Asia/Kolkata",
                        hour12: false,
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                    };
                    var date = new Date(ele["updatedAt"]);
                    var newDate = date.toLocaleString("en-IN", options);

                    ele["updatedAt"] = newDate;
                }



                setData(response.data);
            } catch (error) {
                console.error("Error fetching batches:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBatches();
    }, []);

    const ViewStudentDetails = (id) => {
        navigate("/teacher-dashboard/studentDetails", {
            state: {
                studentId: id,
            },
        });
    };

    const handleMouseEnterOncourse = (courseId) => {
        let assumeCourseName = "";
        for (const ele of data) {
            for (const ele1 of ele.courses) {
                if (Number(ele1.courseId) === Number(courseId)) {
                    assumeCourseName = ele1.name;
                    break;
                }
            }
            if (assumeCourseName !== "") {
                break;
            }
        }
        setCourseName(assumeCourseName);
    };

    const handleMouseEnterOnBatch = (batchId) => {
        let assumeBatchName = "";
        for (const ele of data) {
            for (const ele1 of ele.batches) {
                if (Number(ele1.batchId) === Number(batchId)) {
                    assumeBatchName = ele1.batchName;
                    break;
                }
            }
            if (assumeBatchName !== "") {
                break;
            }
        }
        setBatchName(assumeBatchName);
    };

    const handleMouseEnter = (schoolId) => {
        let assumeSchoolName = "";
        for (const ele of data) {
            if (ele.school[0].id === schoolId) {
                assumeSchoolName = ele.school[0].name;
            }
        }
        setSchoolName(assumeSchoolName);
    };
    const goToBatch = async (id) => {
        const token = localStorage.getItem("token");

        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/teacher/getBatchId/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            navigate("/teacher-dashboard/batchdetails", {
                state: {
                    _id: response.data._id,
                    from: "studentDetails",
                },
            });
        } catch (err) {
            console.error("Error fetching batches:", err);
        }
    };

    const goToCourse = (id, batches) => {
        let batchMongodbId;
        for (const ele of batches) {
            for (const ele1 of ele.courses) {
                if (id === ele1._id) {
                    batchMongodbId = ele._id;
                    break;
                }
            }
            if (batchMongodbId !== undefined) {
                break;
            }
        }

        navigate("/my-learning1", {
            state: {
                courseIdSent: id,
                _id: `${batchMongodbId}`,
                from: "directCourse",
            },
        });
    };

    const handleAddTag = (event) => {
        if (event.key === "Enter" && currentInput.trim() !== "") {
            setSearchTags((prev) => ({
                ...prev,
                [currentField]: [
                    ...(prev[currentField] || []),
                    currentInput.trim(),
                ],
            }));
            setCurrentInput("");
        }
    };

    const handleDeleteTag = (field, tagToDelete) => {
        setSearchTags((prev) => ({
            ...prev,
            [field]: prev[field].filter((tag) => tag !== tagToDelete),
        }));
    };

    const filteredStudents = useMemo(() => {
        return sortData(
            data.filter((student) => {
                return Object.entries(searchTags).every(([field, tags]) => {
                    if (tags.length === 0) return true;
                    if (Array.isArray(student[field])) {
                        if (field === "school") {
                            for (const ele of student[field]) {
                                var studentValue = ele.schoolId || "";
                                return tags.some((tag) =>
                                    studentValue
                                        .toString()
                                        .toLowerCase()
                                        .includes(tag.toLowerCase())
                                );
                            }
                        } else if (field === "batches") {
                            var studentValue = [];
                            for (var ele of student[field]) {
                                studentValue.push(ele.batchId || "");
                            }
                            return tags.some((tag) =>
                                studentValue.some((value) =>
                                    value
                                        .toString()
                                        .toLowerCase()
                                        .includes(tag.toLowerCase())
                                )
                            );
                        } else {
                            var studentValue = [];

                            for (var ele of student[field]) {
                                studentValue.push(ele.courseId || "");
                            }
                            return tags.some((tag) =>
                                studentValue.some((value) =>
                                    value
                                        .toString()
                                        .toLowerCase()
                                        .includes(tag.toLowerCase())
                                )
                            );
                        }
                    } else {
                        var studentValue = student[field] || "";
                        return tags.some((tag) =>
                            studentValue
                                .toString()
                                .toLowerCase()
                                .includes(tag.toLowerCase())
                        );
                    }
                });
            }),
            sortConfig
        );
    }, [data, searchTags, sortConfig]);

    const updateStudentDetails = async (studentId, password1, fatherName) => {
        setOpen(null);
        let passwordChanged = true;
        if (passWord === "") {
            passwordChanged = false;
        }
        const studentData = {
            passwordChange: passwordChanged,
        };
        if (fathername === "") {
            studentData.fatherName = fatherName;
        } else {
            studentData.fatherName = fathername;
        }

        if (passWord === "") {
            studentData.password = password1;
        } else {
            studentData.password = passWord;
        }

        const token = localStorage.getItem("token");

        try {
            const response = await axios.put(
                `${
                    import.meta.env.VITE_API_URL
                }/teacher/updateStudent/${studentId}`,
                { data: studentData },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

        } catch (err) {
            console.error("Error fetching batches:", err);
        }
        window.location.reload();
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container sx={{ padding: "10px", width: "100%" }}>
            <Typography
                variant="h4"
                gutterBottom
                align="center"
                sx={{
                    color: (theme) => theme.palette.success.main,
                    fontSize: "1.35rem",
                    fontWeight: "600",
                    marginTop: "20px",
                }}
            >
                Filter Students
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Grid
                    container
                    spacing={2}
                    justifyContent="center"
                    alignItems="center"
                    sx={{ maxWidth: "600px" }}
                >
                    <Grid item xs={12} sm={4}>
                        <Select
                            value={currentField}
                            onChange={(e) => setCurrentField(e.target.value)}
                            fullWidth
                            size="small"
                        >
                            {/* <MenuItem value="studentId">Student Id</MenuItem> */}
                            <MenuItem value="name">Student Name</MenuItem>
                            <MenuItem value="fatherName">Father Name</MenuItem>
                            <MenuItem value="class">Class</MenuItem>
                            {/* <MenuItem value="school">School Id</MenuItem> */}
                            {/* <MenuItem value="batches">Batch Id</MenuItem> */}
                            {/* <MenuItem value="courses">Course Id</MenuItem> */}
                        </Select>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                        <TextField
                            label={`Search by ${currentField}`}
                            variant="outlined"
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                            onKeyPress={handleAddTag}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                </Grid>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                        flexWrap: "wrap",
                        justifyContent: "center",
                        maxWidth: "600px",
                    }}
                >
                    {Object.entries(searchTags).map(([field, tags]) =>
                        tags.map((tag) => (
                            <Chip
                                key={`${field}-${tag}`}
                                label={`${field}: ${tag}`}
                                onDelete={() => handleDeleteTag(field, tag)}
                                sx={{ mb: 1 }}
                            />
                        ))
                    )}
                </Stack>
            </Box>

            <Typography
                variant="h4"
                align="center"
                gutterBottom
                sx={{
                    color: (theme) => theme.palette.success.main,
                    fontSize: "1.35rem",
                    fontWeight: "600",
                    marginTop: "25px",
                }}
            >
                Students Information
            </Typography>

            <TableContainer
                component={Paper}
                elevation={3}
                sx={{
                    marginTop: "10px",
                    overflowX: "auto",
                    width: "100%",
                }}
            >
                <Table sx={{ width: "100%" }}>
                    <TableHead sx={{ width: "100%" }}>
                        <TableRow>
                            <TableCell
                                sx={{
                                    backgroundColor: "green",
                                    color: "white",
                                    fontWeight: "600",
                                    borderWidth: "0px",
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Typography
                                        sx={{ margin: "0px", padding: "0px" }}
                                    >
                                        Student Name
                                    </Typography>
                                    <Box>
                                        <IconButton
                                            onClick={() =>
                                                handleSortRequest("name")
                                            }
                                        >
                                            {sortConfig["name"] === "asc" ? (
                                                <ArrowUpwardIcon
                                                    sx={{ color: "white" }}
                                                />
                                            ) : sortConfig["name"] ===
                                              "desc" ? (
                                                <ArrowDownwardIcon
                                                    sx={{ color: "white" }}
                                                />
                                            ) : (
                                                <FilterAltIcon
                                                    sx={{ color: "white" }}
                                                />
                                            )}
                                        </IconButton>
                                    </Box>
                                </Box>
                            </TableCell>
                            {/* <TableCell
                                sx={{
                                    backgroundColor: "green",
                                    color: "white",
                                    fontWeight: "600",
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Typography
                                        sx={{ margin: "0px", padding: "0px" }}
                                    >
                                        Father's Name
                                    </Typography>
                                    <Box>
                                        <IconButton
                                            onClick={() =>
                                                handleSortRequest("fatherName")
                                            }
                                        >
                                            {sortConfig["fatherName"] ===
                                            "asc" ? (
                                                <ArrowUpwardIcon
                                                    sx={{ color: "white" }}
                                                />
                                            ) : sortConfig["fatherName"] ===
                                              "desc" ? (
                                                <ArrowDownwardIcon
                                                    sx={{ color: "white" }}
                                                />
                                            ) : (
                                                <FilterAltIcon
                                                    sx={{ color: "white" }}
                                                />
                                            )}
                                        </IconButton>
                                    </Box>
                                </Box>
                            </TableCell> */}
                            <TableCell
                                sx={{
                                    backgroundColor: "green",
                                    color: "white",
                                    fontWeight: "600",
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Typography
                                        sx={{ margin: "0px", padding: "0px" }}
                                    >
                                        Class
                                    </Typography>
                                    <Box>
                                        <IconButton
                                            onClick={() =>
                                                handleSortRequest("class")
                                            }
                                        >
                                            {sortConfig["class"] === "asc" ? (
                                                <ArrowUpwardIcon
                                                    sx={{ color: "white" }}
                                                />
                                            ) : sortConfig["class"] ===
                                              "desc" ? (
                                                <ArrowDownwardIcon
                                                    sx={{ color: "white" }}
                                                />
                                            ) : (
                                                <FilterAltIcon
                                                    sx={{ color: "white" }}
                                                />
                                            )}
                                        </IconButton>
                                    </Box>
                                </Box>
                            </TableCell>
{/* 
                            <TableCell
                                sx={{
                                    backgroundColor: "green",
                                    color: "white",
                                    fontWeight: "600",
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Typography
                                        sx={{ margin: "0px", padding: "0px" }}
                                    >
                                        School name
                                    </Typography>
                                </Box>
                            </TableCell> */}
                            <TableCell
                                sx={{
                                    backgroundColor: "green",
                                    color: "white",
                                    fontWeight: "600",
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Typography
                                        sx={{ margin: "0px", padding: "0px" }}
                                    >
                                        Batch Name
                                    </Typography>
                                </Box>
                            </TableCell>
                            <TableCell
                                sx={{
                                    backgroundColor: "green",
                                    color: "white",
                                    fontWeight: "600",
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Typography
                                        sx={{ margin: "0px", padding: "0px" }}
                                    >
                                        Course
                                    </Typography>
                                </Box>
                            </TableCell>

                            <TableCell
                                align="center"
                                sx={{
                                    backgroundColor: "green",
                                    color: "white",
                                    fontWeight: "600",
                                }}
                            >
                                Actions
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody sx={{ width: "100%" }}>
                        {filteredStudents
                            .slice(
                                page * rowsPerPage,
                                page * rowsPerPage + rowsPerPage
                            )
                            .map((student, index) => (
                                <TableRow key={index} sx={{ width: "100%" }}>

                                    <TableCell>{student.name}</TableCell>
                                    {/* <TableCell>{student.fatherName}</TableCell> */}
                                    <TableCell>{student.class}</TableCell>

                                    {/* <TableCell>
                                        <Tooltip
                                            title={schoolName}
                                            onMouseEnter={() =>
                                                handleMouseEnter(
                                                    student.school[0].id
                                                )
                                            }
                                            arrow
                                        >
                                            <Box
                                                sx={{
                                                    color: "black",
                                                    margin: "3px",
                                                    backgroundColor: "#fff176",
                                                    "&:hover": {
                                                        backgroundColor:
                                                            "rgb(240, 227, 185)",
                                                    },
                                                    textAlign: "center",
                                                    padding: "6px 10px",
                                                    borderRadius: "5px",
                                                    display: "inline-block",
                                                }}
                                            >
                                                {student.school[0].schoolId}
                                            </Box>
                                        </Tooltip>{" "}
                                    </TableCell> */}

                                    <TableCell>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "row",
                                            }}
                                        >
                                            {student.batches.map(
                                                (every, index1) => (
                                                    <Tooltip
                                                        key={index1}
                                                        title={batchName}
                                                        onMouseEnter={() =>
                                                            handleMouseEnterOnBatch(
                                                                every.batchId
                                                            )
                                                        }
                                                        arrow
                                                    >
                                                        <Box
                                                            sx={{
                                                                color: "black",
                                                                margin: "3px",
                                                                backgroundColor:
                                                                    "#fff176",
                                                                "&:hover": {
                                                                    backgroundColor:
                                                                        "rgb(240, 227, 185)",
                                                                },
                                                                textAlign:
                                                                    "center",
                                                                padding:
                                                                    "6px 10px",
                                                                borderRadius:
                                                                    "5px",
                                                                display:
                                                                    "inline-block",
                                                            }}
                                                            onClick={() =>
                                                                goToBatch(
                                                                    every.batchId
                                                                )
                                                            }
                                                        >
                                                            {every.batchId}
                                                        </Box>
                                                    </Tooltip>
                                                )
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "row",
                                            }}
                                        >
                                            {student.courses.map(
                                                (every, index2) => (
                                                    <Tooltip
                                                        key={index2}
                                                        title={courseName}
                                                        onMouseEnter={() =>
                                                            handleMouseEnterOncourse(
                                                                every.courseId
                                                            )
                                                        }
                                                        arrow
                                                    >
                                                        <Box
                                                            sx={{
                                                                color: "black",
                                                                margin: "3px",
                                                                backgroundColor:
                                                                    "#fff176",
                                                                "&:hover": {
                                                                    backgroundColor:
                                                                        "rgb(240, 227, 185)",
                                                                },
                                                                textAlign:
                                                                    "center",
                                                                padding:
                                                                    "6px 10px",
                                                                borderRadius:
                                                                    "5px",
                                                                display:
                                                                    "inline-block",
                                                            }}
                                                            onClick={() =>
                                                                goToCourse(
                                                                    every._id,
                                                                    student.batches
                                                                )
                                                            }
                                                        >
                                                            {every.courseId}
                                                        </Box>
                                                    </Tooltip>
                                                )
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "flex-end",
                                                gap: "10px",
                                            }}
                                        >
                                            <Button
                                                onClick={() =>
                                                    ViewStudentDetails(
                                                        student.studentId
                                                    )
                                                }
                                                variant="contained"
                                                size="small"
                                                sx={{
                                                    fontSize: "0.7rem",
                                                    padding: "4px 8px",
                                                    minWidth: "30px",
                                                }}
                                            >
                                                View
                                            </Button>
                                            <Button
                                                onClick={() =>
                                                    handleOpen(
                                                        student.studentId
                                                    )
                                                }
                                                variant="contained"
                                                size="small"
                                                sx={{
                                                    fontSize: "0.7rem",
                                                    padding: "4px 8px",
                                                    minWidth: "30px",
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            <Modal
                                                open={
                                                    open === student.studentId
                                                }
                                                onClose={handleClose}
                                                aria-labelledby="modal-modal-title"
                                                aria-describedby="modal-modal-description"
                                            >
                                                <Box sx={style}>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            mb: 3,
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        Update Student Details
                                                    </Typography>

                                                    <TextField
                                                        id="outlined-basic"
                                                        label="Father Name"
                                                        variant="outlined"
                                                        onChange={(e) =>
                                                            setFathername(
                                                                e.target.value
                                                            )
                                                        }
                                                        defaultValue={
                                                            student.fatherName
                                                        }
                                                        sx={{
                                                            margin: "10px",
                                                            width: "350px",
                                                        }}
                                                    />

                                                    <TextField
                                                        id="outlined-basic"
                                                        label="Password"
                                                        type={
                                                            showPassword
                                                                ? "text"
                                                                : "password"
                                                        }
                                                        variant="outlined"
                                                        onChange={(e) =>
                                                            setPassWord(
                                                                e.target.value
                                                            )
                                                        }

                                                        sx={{
                                                            margin: "10px",
                                                            width: "350px",
                                                        }}
                                                    />

                                                    <Button
                                                        variant="text"
                                                        color="secondary"
                                                        sx={{
                                                            color: "black",
                                                            marginRight: "10px",
                                                        }}
                                                        onClick={
                                                            toggleShowPassword
                                                        }
                                                    >
                                                        {showPassword
                                                            ? "Hide Password"
                                                            : "Show Password"}
                                                    </Button>

                                                    <Button
                                                        sx={{ color: "black" }}
                                                        onClick={() =>
                                                            updateStudentDetails(
                                                                student.studentId,
                                                                student.password,
                                                                student.fatherName
                                                            )
                                                        }
                                                    >
                                                        Update
                                                    </Button>
                                                </Box>
                                            </Modal>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
                <TablePagination
                    rowsPerPageOptions={[10, 20, 30, 40]}
                    component="div"
                    count={filteredStudents.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Box>
        </Container>
    );
}
export default StudentTable;