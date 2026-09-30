import React from "react";
import {
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,

} from "@mui/material";
import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CircularProgress from "@mui/material/CircularProgress";
import { BreadcrumbContext } from "../../BreadcrumbContext";

function StudentAssessments() {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [quizzes, setQuizzes] = useState(null);
    const [quizPresent, setQuizPresent] = useState(null);
    const [studentData, setStudentData] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Student Dashboard", path: "/student-dashboard" },
            { name: "Assessment", path: "/student-dashboard/assessments" },
        ]);
    }, []);

    useEffect(() => {
        const fetchStudentDetails = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/student/get/details`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                setStudentData(response.data.student);
            } catch (error) {
                console.error("Error fetching Student Data:", error);
            }
        };

        fetchStudentDetails();
    }, []);

    const attemptQuiz = (quiz) => {
        navigate("/student-dashboard/attempt-quiz", {
            state: {
                quizData: quiz,
                from: "assessment",
            },
        });
    };

    const getStatus = async (quiz) => {
        const date1 = new Date(quiz.startDateTime);
        const date2 =
            quiz.endDateTime !== null ? new Date(quiz.endDateTime) : null;
        const currentDate = new Date();

        let totalScoreOfQuiz = 0;

        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/quizV2Final/get/quizDetails/${quiz.quiz
                }`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            for (let ele of response.data.quiz.questionsSelected) {
                for (let ele1 of ele.options) {
                    if (
                        parseInt(ele1.optionNumber) === parseInt(ele.answerKey)
                    ) {
                        totalScoreOfQuiz =
                            totalScoreOfQuiz + parseInt(ele1.optionWeightage);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching Quiz:", error);
        }

        if (currentDate < date1) {
            return ["Not yet Started", "-", totalScoreOfQuiz];
        } else if (quiz.endDateTime !== null && date2 < currentDate) {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/student/quiz/attempted/${studentData._id
                    }/${quiz.quiz}`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                let maxScore = 0;
                let index = 0;
                if (response.data.attempted) {
                    for (let ele of response.data.response) {
                        if (index === 0) {
                            maxScore = parseInt(ele.score);
                        } else {
                            maxScore =
                                maxScore > parseInt(ele.score)
                                    ? maxScore
                                    : parseInt(ele.score);
                        }
                        index = index + 1;
                    }
                }

                return response.data.attempted
                    ? [
                        "Expired",
                        maxScore,
                        response.data.response[
                            response.data.response.length - 1
                        ].maxScore,
                    ]
                    : ["Expired", "-", totalScoreOfQuiz];
            } catch (error) {
                console.error(
                    "Error fetching Student Quiz Attempt Data:",
                    error
                );
                return "Error";
            }
        } else {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/student/quiz/attempted/${studentData._id
                    }/${quiz.quiz}`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                let maxScoreSecured = 0;
                let index = 0;
                if (response.data.attempted) {
                    for (let ele of response.data.response) {
                        if (index === 0) {
                            maxScoreSecured = parseInt(ele.score);
                        } else {
                            maxScoreSecured =
                                maxScoreSecured > parseInt(ele.score)
                                    ? maxScoreSecured
                                    : parseInt(ele.score);
                        }
                        index = index + 1;
                    }
                }

                return response.data.attempted
                    ? [
                        "Completed",
                        maxScoreSecured,
                        response.data.response[
                            response.data.response.length - 1
                        ].maxScore,
                    ]
                    : ["Due", "-", totalScoreOfQuiz];
            } catch (error) {
                console.error(
                    "Error fetching Student Quiz Attempt Data:",
                    error
                );
                return "Error";
            }
        }
    };

    function convertUTCToIST(utcDateString) {
        const utcDate = new Date(utcDateString);

        const options = {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false, // Use 24-hour format
            timeZone: "Asia/Kolkata", // Use IST timezone
        };

        return utcDate.toLocaleString("en-IN", options);
    }

    useEffect(() => {
        const fetchStudentQuizzes = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL
                    }/student/all/chapterLevel/quizzes`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                   
                let quizIsPresent = response.data.student.quizzes.length !== 0;

                let quizzessOk = response.data.student.quizzes;
                let quizzesWithStatus = await Promise.all(
                    quizzessOk.flatMap((quizObj) =>
                        quizObj.chapterData[quizObj.chapterId].map(
                            async (quiz) => {
                                const status = await getStatus(quiz);
                                return {
                                    ...quiz,
                                    status,
                                    batchName: quizObj.batchName,
                                };
                            }
                        )
                    )
                );

                setQuizzes(quizzesWithStatus);
                setQuizPresent(quizIsPresent);
            } catch (error) {
                console.error("Error fetching Student Quizzes:", error);
            }
        };

        fetchStudentQuizzes();
    }, [studentData]);

    return (
        <>
            {quizPresent && (
                <Box sx={{ margin: "20px" }}>
                    <TableContainer component={Paper}>
                        <Table aria-label="simple table">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "green" }}>
                                    {/* <TableCell
                                        sx={{ color: "white" }}
                                        align="center"
                                    >
                                        Batch Name
                                    </TableCell> */}
                                    <TableCell
                                        sx={{ color: "white" }}
                                        align="center"
                                    >
                                        Course Name
                                    </TableCell>
                                    <TableCell
                                        sx={{ color: "white" }}
                                        align="center"
                                    >
                                        Chapter Name
                                    </TableCell>
                                    <TableCell
                                        sx={{ color: "white" }}
                                        align="center"
                                    >
                                        Start Datetime
                                    </TableCell>
                                    <TableCell
                                        sx={{ color: "white" }}
                                        align="center"
                                    >
                                        End Datetime
                                    </TableCell>
                                    <TableCell
                                        sx={{ color: "white" }}
                                        align="center"
                                    >
                                        Question Duration in (hours:minutes)
                                    </TableCell>

                                    <TableCell
                                        sx={{ color: "white" }}
                                        align="center"
                                    >
                                        Quiz Duration in (hours:minutes)
                                    </TableCell>
                                    {/* <TableCell
                                        sx={{ color: "white" }}
                                        align="center"
                                    >
                                        Concepts name
                                    </TableCell> */}
                                    <TableCell
                                        sx={{ color: "white" }}
                                        align="center"
                                    >
                                        Score
                                    </TableCell>
                                    <TableCell
                                        sx={{ color: "white" }}
                                        align="center"
                                    >
                                        Status
                                    </TableCell>
                                    <TableCell
                                        sx={{ color: "white" }}
                                        align="center"
                                    >
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Object.entries(studentData).length !== 0 &&
                                    quizzes.map((quiz) => (
                                        <TableRow key={quiz._id}>
                                            {/* <TableCell align="center">
                                                {quiz.batchName}
                                            </TableCell> */}
                                            <TableCell align="center">
                                                {quiz.courseName}
                                            </TableCell>
                                            <TableCell align="center">
                                                {quiz.chapterName}
                                            </TableCell>
                                            <TableCell
                                                component="th"
                                                scope="row"
                                            >
                                                {convertUTCToIST(
                                                    quiz.startDateTime
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {quiz.endDateTime === null
                                                    ? "unlimited"
                                                    : convertUTCToIST(
                                                        quiz.endDateTime
                                                    )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {quiz.questionDurationHours ===
                                                    null
                                                    ? "unlimited"
                                                    : `${quiz.questionDurationHours}:${quiz.questionDurationMinutes}`}
                                            </TableCell>

                                            <TableCell align="center">
                                                {quiz.quizDurationHours === null
                                                    ? "unlimited"
                                                    : `${quiz.quizDurationHours}:${quiz.quizDurationMinutes}`}
                                            </TableCell>
                                            {/* <TableCell align="center">
                                                {quiz.concepts.length > 0 &&
                                                    quiz.concepts.map(
                                                        (every) => (
                                                            <li>
                                                                {every.name}
                                                            </li>
                                                        )
                                                    )}
                                            </TableCell> */}
                                            <TableCell align="center">
                                                {`${quiz.status[1]}/${quiz.status[2]}`}
                                            </TableCell>
                                            <TableCell align="center">
                                                {Array.isArray(quiz.status)
                                                    ? quiz.status[0]
                                                    : quiz.status}
                                            </TableCell>
                                            <TableCell align="center">
                                                {(quiz.status[0] ===
                                                    "Not yet Started" ||
                                                    quiz.status[0] ===
                                                    "Expired") && (
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                justifyContent:
                                                                    "center",
                                                                gap: 1,
                                                            }}
                                                        >
                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                sx={{
                                                                    backgroundColor:
                                                                        "rgb(191, 187, 187)",
                                                                    "&:hover": {
                                                                        backgroundColor:
                                                                            "darkgrey",
                                                                    },
                                                                }}
                                                            >
                                                                Attempt
                                                            </Button>
                                                        </Box>
                                                    )}
                                                {(quiz.status[0] === "Due" ||
                                                    quiz.status[0] ===
                                                    "Completed") && (
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                justifyContent:
                                                                    "center",
                                                                gap: 1,
                                                            }}
                                                        >
                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                onClick={() =>
                                                                    attemptQuiz(
                                                                        quiz
                                                                    )
                                                                }
                                                            >
                                                                Attempt
                                                            </Button>
                                                        </Box>
                                                    )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
            {!quizzes && (
                <Box
                    sx={{
                        width: "100%",
                        height: "60vh",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <CircularProgress />
                </Box>
            )}
            {!quizPresent && quizzes && (
                <Typography
                    variant="h6"
                    style={{
                        textAlign: "center",
                        marginTop: "2rem",
                        opacity: 0.5,
                    }}>
                    No Assessments are assigned to you.
                </Typography>
            )}
        </>
    );
}

export default StudentAssessments;
