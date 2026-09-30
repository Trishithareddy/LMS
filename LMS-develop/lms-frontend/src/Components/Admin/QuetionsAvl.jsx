import React, { useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { Box } from "@mui/system";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
} from "@mui/material";

const QuestionsAvl = () => {
    const [courses, setCourses] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [questionData, setQuestionData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCourses = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/courses/getAllCourses`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setCourses(response.data);
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchQuestionDetails = async (qbChapterId) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${
                    import.meta.env.VITE_API_URL
                }/questionBase/generate/getChapterById/${qbChapterId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

          
            setQuestionData(response.data);
        } catch (error) {
            console.error("Error fetching questions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch all courses on load
    useEffect(() => {
        fetchCourses();
    }, []);

    // set chapters when course changes
    useEffect(() => {
        if (selectedCourse) {
            setChapters(selectedCourse.chapters || []);
            setSelectedChapter(null);
        }
    }, [selectedCourse]);

    // Fetch questions when chapter changes
    useEffect(() => {
        if (selectedChapter?.qbChapterId) {
            fetchQuestionDetails(selectedChapter.qbChapterId);
        }
    }, [selectedChapter]);



    return (
        <>
            {isLoading ? (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        padding: "20px",
                    }}
                >
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={{ mb: 6 }}>
                    <Box>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                fontFamily: "sans-serif",
                                fontSize: "24px",
                                mt: 4,
                            }}
                        >
                            Get Question Details
                        </Box>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                gap: 2,
                                my: 4,
                            }}
                        >
                            <Autocomplete
                                sx={{ width: 300 }}
                                options={courses}
                                getOptionLabel={(course) => course?.name || ""}
                                value={selectedCourse}
                                onChange={(event, newValue) =>
                                    setSelectedCourse(newValue)
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Course"
                                    />
                                )}
                            />
                            <Autocomplete
                                sx={{ width: 300 }}
                                options={chapters}
                                getOptionLabel={(chapter) =>
                                    chapter?.name || ""
                                }
                                value={selectedChapter}
                                onChange={(event, newValue) =>
                                    setSelectedChapter(newValue)
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Chapter Name"
                                    />
                                )}
                            />
                        </Box>
                    </Box>
                    <TableContainer
                        component={Paper}
                        sx={{ maxWidth: 800, mx: "auto", mt: 4 }}
                    >
                        <Typography
                            variant="h6"
                            align="center"
                            gutterBottom
                            sx={{ mt: 2 }}
                        >
                            Question Distribution by Type and Difficulty
                        </Typography>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <strong>Questions Type</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>Easy</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>Medium</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>Hard</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>Total Number of Q</strong>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {questionData?.data?.map((row, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            {row.questionType}
                                        </TableCell>
                                        <TableCell align="center">
                                            {row.Easy}
                                        </TableCell>
                                        <TableCell align="center">
                                            {row.Medium}
                                        </TableCell>
                                        <TableCell align="center">
                                            {row.Hard}
                                        </TableCell>
                                        <TableCell align="center">
                                            {row.total}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
        </>
    );
};

export default QuestionsAvl;
