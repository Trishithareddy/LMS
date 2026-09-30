import React, { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    List,
    ListItem,
    ListItemText,
    Divider,
} from "@mui/material";
import axios from "axios";

const Quiz = ({ chapterId }) => {
    const [quizzes, setQuizzes] = useState([]);
    const [view, setView] = useState(false);
    const [quiz, setQuiz] = useState([]);
    const [quizAssignData, setQuizAssignData] = useState([]);
    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${
                        import.meta.env.VITE_API_URL
                    }/quizAssign/fetch/quizzes/${chapterId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
             
                setQuizzes(response.data.quizzes);
            } catch (error) {
                console.error("Error fetching Quizzes:", error);
            }
        };

        if (chapterId) {
            fetchQuizzes();
        }
    }, []);

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

    const viewQuiz = async (quiz) => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/quizV2Final/get/quizDetails/${
                    quiz.quiz
                }`
            );

          
            setQuiz(response.data.quiz);
        } catch (error) {
            console.error("Error fetching Quiz:", error);
        }
        setView(!view);
        setQuizAssignData(quiz);
    };
    const backToQuizzes = () => {
        setView(!view);
        setQuiz([]);
        setQuizAssignData([]);
    };

    const dateConversionFun = (date) => {
        const dateConvertion = {
            timeZone: "Asia/Kolkata",
            hour12: false, // 24-hour format
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        };
        var date1 = new Date(date);
        var newDate = date1.toLocaleString("en-IN", dateConvertion);
        return newDate;
    };

    const displayAnswer = (answerKey) => {
        switch (answerKey) {
            case "1":
                return <span>A</span>;
            case "2":
                return <span>B</span>;
            case "3":
                return <span>C</span>;
            case "4":
            default:
                return <span>D</span>;
        }
    };

    return (
        <>
            {quizzes.length !== 0 && !view && (
                <TableContainer component={Paper}>
                    <Table aria-label="simple table">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: "green" }}>
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
                                <TableCell
                                    sx={{ color: "white" }}
                                    align="center"
                                >
                                    Concepts name
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
                            {quizzes.map((quiz) => (
                                <TableRow key={quiz._id}>
                                    <TableCell align="center">
                                        {quiz.chapterName}
                                    </TableCell>
                                    <TableCell component="th" scope="row">
                                        {convertUTCToIST(quiz.startDateTime)}
                                    </TableCell>
                                    <TableCell align="center">
                                        {convertUTCToIST(quiz.endDateTime)}
                                    </TableCell>
                                    <TableCell align="center">
                                        {quiz.questionDurationHours}:
                                        {quiz.questionDurationMinutes}
                                    </TableCell>

                                    <TableCell align="center">
                                        {quiz.quizDurationHours}:
                                        {quiz.quizDurationMinutes}
                                    </TableCell>
                                    <TableCell align="center">
                                        {quiz.concepts.length > 0 &&
                                            quiz.concepts.map((every) => (
                                                <li>{every.name}</li>
                                            ))}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "center",
                                                gap: 1,
                                            }}
                                        >
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={() => viewQuiz(quiz)}
                                            >
                                                View
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            {quizzes.length === 0 && !view && (
                <p
                    style={{
                        margin: "20px",
                        textAlign: "center",
                        width: "100%",
                    }}
                >
                    No Quizzes are available in this chapter.
                </p>
            )}
            {view && (
                <>
                    {Object.entries(quiz).length > 0 && (
                        <Card
                            sx={{
                                maxWidth: 600,
                                margin: "20px auto",
                                padding: "15px",
                                borderRadius: "12px",
                                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                            }}
                        >
                            <CardContent>
                                <Typography
                                    variant="h5"
                                    gutterBottom
                                    color="primary"
                                    fontWeight="bold"
                                >
                                    Quiz Code: {quiz.quizCode}
                                </Typography>

                                <Divider sx={{ marginBottom: 2 }} />

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Typography
                                            variant="subtitle1"
                                            color="textSecondary"
                                        >
                                            <strong>Quiz Title:</strong>{" "}
                                            {quiz.quizTitle}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography
                                            variant="subtitle1"
                                            color="textSecondary"
                                        >
                                            <strong>Quiz Id:</strong>{" "}
                                            {quiz.quizId}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography
                                            variant="subtitle1"
                                            color="textSecondary"
                                        >
                                            <strong>Chapter name:</strong>{" "}
                                            {quizAssignData.chapterName}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography
                                            variant="subtitle1"
                                            color="textSecondary"
                                        >
                                            <strong>
                                                Quiz Start Datetime:
                                            </strong>{" "}
                                            {convertUTCToIST(
                                                quizAssignData.startDateTime
                                            )}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography
                                            variant="subtitle1"
                                            color="textSecondary"
                                        >
                                            <strong>Quiz End Datetime:</strong>{" "}
                                            {convertUTCToIST(
                                                quizAssignData.endDateTime
                                            )}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography
                                            variant="subtitle1"
                                            color="textSecondary"
                                        >
                                            <strong>
                                                Question duration in
                                                (hours:minutes):
                                            </strong>{" "}
                                            {
                                                quizAssignData.questionDurationHours
                                            }
                                            :
                                            {
                                                quizAssignData.questionDurationMinutes
                                            }
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography
                                            variant="subtitle1"
                                            color="textSecondary"
                                        >
                                            <strong>
                                                Quiz duration in
                                                (hours:minutes):
                                            </strong>{" "}
                                            {quizAssignData.quizDurationHours}:
                                            {quizAssignData.quizDurationMinutes}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography
                                            variant="subtitle1"
                                            color="textSecondary"
                                        >
                                            <strong>Category:</strong>{" "}
                                            {quiz.categoryName}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="textSecondary"
                                        >
                                            {quiz.categoryDescription}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography
                                            variant="subtitle1"
                                            color="textSecondary"
                                        >
                                            <strong>Subcategory:</strong>{" "}
                                            {quiz.subCategoryName}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="textSecondary"
                                        >
                                            {quiz.subCategoryDescription}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography
                                            variant="subtitle1"
                                            color="textSecondary"
                                        >
                                            <strong>Chapter:</strong>{" "}
                                            {quiz.chapterLabelledName}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography
                                            variant="subtitle1"
                                            color="textSecondary"
                                        >
                                            <strong>Concepts:</strong>
                                        </Typography>
                                        <List dense>
                                            {quiz.concepts.map(
                                                (concept, index) => (
                                                    <ListItem key={index}>
                                                        <ListItemText
                                                            primary={
                                                                concept.name
                                                            }
                                                        />
                                                    </ListItem>
                                                )
                                            )}
                                        </List>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Divider sx={{ marginBottom: 2 }} />
                                    </Grid>

                                    {quiz.questionsSelected.map(
                                        (question, index) => (
                                            <React.Fragment key={index}>
                                                <Grid item xs={12}>
                                                    <Typography
                                                        variant="subtitle1"
                                                        color="textSecondary"
                                                    >
                                                        <strong>
                                                            Question {index + 1}{" "}
                                                            Stem:
                                                        </strong>
                                                    </Typography>
                                                    <div
                                                        dangerouslySetInnerHTML={{
                                                            __html: question.questionStem,
                                                        }}
                                                    />
                                                </Grid>

                                                <Grid item xs={12}>
                                                    <Typography
                                                        variant="subtitle1"
                                                        color="textSecondary"
                                                    >
                                                        <strong>
                                                            Options:
                                                        </strong>
                                                    </Typography>
                                                    <List dense>
                                                        {question.options.map(
                                                            (
                                                                option,
                                                                optIndex
                                                            ) => (
                                                                <ListItem
                                                                    key={
                                                                        optIndex
                                                                    }
                                                                >
                                                                    <ListItemText
                                                                        primary={
                                                                            <div
                                                                                dangerouslySetInnerHTML={{
                                                                                    __html: option.option,
                                                                                }}
                                                                            />
                                                                        }
                                                                    />
                                                                </ListItem>
                                                            )
                                                        )}
                                                    </List>
                                                </Grid>

                                                <Grid item xs={12}>
                                                    <Typography
                                                        variant="subtitle1"
                                                        color="textSecondary"
                                                    >
                                                        <strong>Answer:</strong>{" "}
                                                        {displayAnswer(
                                                            question.answerKey
                                                        )}
                                                    </Typography>
                                                </Grid>

                                                <Grid item xs={12}>
                                                    <Typography
                                                        variant="subtitle1"
                                                        color="textSecondary"
                                                    >
                                                        <strong>
                                                            Explanation:
                                                        </strong>
                                                    </Typography>
                                                    <div
                                                        dangerouslySetInnerHTML={{
                                                            __html: question.explanation,
                                                        }}
                                                    />
                                                </Grid>

                                                <Grid item xs={12}>
                                                    <Typography
                                                        variant="subtitle1"
                                                        color="textSecondary"
                                                    >
                                                        <strong>
                                                            Created At:
                                                        </strong>{" "}
                                                        {dateConversionFun(
                                                            question.createdAt
                                                        )}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Typography
                                                        variant="subtitle1"
                                                        color="textSecondary"
                                                    >
                                                        <strong>
                                                            Updated At:
                                                        </strong>{" "}
                                                        {dateConversionFun(
                                                            question.updatedAt
                                                        )}
                                                    </Typography>
                                                </Grid>

                                                <Grid item xs={12}>
                                                    <Divider
                                                        sx={{ marginBottom: 2 }}
                                                    />
                                                </Grid>
                                            </React.Fragment>
                                        )
                                    )}
                                </Grid>
                                <Button onClick={() => backToQuizzes()}>
                                    Back to Quizzes
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </>
    );
};

export default Quiz;
