import { useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";
import {
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
import toast from "react-hot-toast";
const CompleteQuiz = () => {
    const [quiz, setQuiz] = useState("");

    const location = useLocation();
    const id = location.state.quizId;

    const fetchCompleteQuiz = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${
                    import.meta.env.VITE_API_URL
                }/quizV2Final/get/quizDetails/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
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
            var date = new Date(response.data.quiz.createdAt);
            var newDate = date.toLocaleString("en-IN", dateConvertion);
            var date1 = new Date(response.data.quiz.updatedAt);
            var newDate1 = date1.toLocaleString("en-IN", dateConvertion);
            response.data.quiz["createdAt"] = newDate;
            response.data.quiz["updatedAt"] = newDate1;
            setQuiz(response.data.quiz);
        } catch (error) {
            console.error("Error fetching Quiz:", error);
            toast.error("Error fetching Quiz details. Please try again later.");
        }
    };

    useEffect(() => {
        fetchCompleteQuiz();
    }, []);

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
                                    <strong>Quiz Id:</strong> {quiz.quizId}
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
                                    {quiz.concepts.map((concept, index) => (
                                        <ListItem key={index}>
                                            <ListItemText
                                                primary={concept.name}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ marginBottom: 2 }} />
                            </Grid>

                            {quiz.questionsSelected.map((question, index) => (
                                <React.Fragment key={index}>
                                    <Grid item xs={12}>
                                        <Typography
                                            variant="subtitle1"
                                            color="textSecondary"
                                        >
                                            <strong>
                                                Question {index + 1} Stem:
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
                                            <strong>Options:</strong>
                                        </Typography>
                                        <List dense>
                                            {question.options.map(
                                                (option, index) => (
                                                    <ListItem key={index}>
                                                        <ListItemText
                                                            primary={
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        flexDirection:
                                                                            "row",
                                                                        alignItems:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    <p
                                                                        style={{
                                                                            marginRight:
                                                                                "10px",
                                                                        }}
                                                                    >
                                                                        {String.fromCharCode(
                                                                            65 +
                                                                                index
                                                                        )}
                                                                        )
                                                                    </p>
                                                                    <span
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: option.option,
                                                                        }}
                                                                    />
                                                                </div>
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
                                            {displayAnswer(question.answerKey)}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography
                                            variant="subtitle1"
                                            color="textSecondary"
                                        >
                                            <strong>Explanation:</strong>
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
                                            <strong>Created At:</strong>{" "}
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
                                            <strong>Updated At:</strong>{" "}
                                            {dateConversionFun(
                                                question.updatedAt
                                            )}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Divider sx={{ marginBottom: 2 }} />
                                    </Grid>
                                </React.Fragment>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>
            )}
        </>
    );
};

export default CompleteQuiz;
