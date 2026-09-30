import { useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import {
    Card,
    CardContent,
    CardActions,
    Typography,
    Radio,
    RadioGroup,
    FormControlLabel,
    Button,
    Box,
} from "@mui/material";
import { BreadcrumbContext } from "../../BreadcrumbContext";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { CheckCircle, Cancel } from "@mui/icons-material";
const AttemptQuiz = () => {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const location = useLocation();
    const quiz = location.state.quizData;
    const [data, setData] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [score, setScore] = useState(0);
    const [totalScore, setTotalScore] = useState(null);
    const [studentData, setStudentdata] = useState({});

    const [totalSeconds, setTotalSeconds] = useState(0);
    const [totalSecondsQuestion, setTotalSecondsQuestion] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [first, setFirst] = useState(false);
    const [intervalTime, setIntervalTime] = useState("");
    const [intervalTime1, setIntervalTime1] = useState("");
    const navigate = useNavigate();

    const from = location.state.from

    useEffect(() => {
        setBreadcrumbTrail([
            { name: 'Student Dashboard', path: '/student-dashboard' },
            ...(from === "course" || from === undefined
                ? [{ name: 'Courses', path: '/student-dashboard/courses' },] 
                : []),
            
            ...(from === "course" || from === undefined
                ? [{ name: 'My Learning', path: '/my-learning', state:{chapterDetails:location.state.chapterDetails,
                    studentNameSent:location.state.studentNameSent  || "",
                    chapterIdSent:location.state.chapterIdSent  || "",
                    batchName:location.state.batchName,
                    batchId:location.state.batchId,
                    courseName:location.state.courseName,
                    courseId:location.state.courseId} },] 
                : []),
                ...(from === "assessment" || from === undefined
                    ? [{ name: 'Assessment', path: '/student-dashboard/assessments' },] 
                    : []),

                
            
            
            { name: 'Attempt Quiz', path: '/student-dashboard/attempt-quiz' },
        ]);
    }, [location]);

    useEffect(() => {
        const fetchQuizDetails = async () => {
            try {
               
                const quizId = quiz.quiz;
                
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${
                        import.meta.env.VITE_API_URL
                    }/quizV2Final/get/quizDetails/${quizId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

           
                function shuffleArray(array) {
                    for (let i = array.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
                        [array[i], array[j]] = [array[j], array[i]]; // swap elements
                    }
                    return array;
                }

                if (quiz.randomizeQuestions) {
                    const shuffledArray = shuffleArray([
                        ...response.data.quiz.questionsSelected,
                    ]);
                    response.data.quiz.questionsSelected = shuffledArray;
                }
                if (quiz.randomizeOptions) {
                    for (let ele of response.data.quiz.questionsSelected) {
                        const shuffledArray = shuffleArray([...ele.options]);
                        ele.options = shuffledArray;
                    }
                }
                 
                setData(response.data.quiz);
                if (
                    quiz.questionDurationHours !== null ||
                    quiz.questionDurationMinutes !== null ||
                    quiz.quizDurationHours !== null ||
                    quiz.quizDurationMinutes !== null
                ) {
                    const hours = parseInt(quiz.quizDurationHours);
                    const minutes = parseInt(quiz.quizDurationMinutes);
                    const hours1 = parseInt(quiz.questionDurationHours);
                    const minutes1 = parseInt(quiz.questionDurationMinutes);
                    setTotalSeconds(hours * 3600 + minutes * 60);
                    setTotalSecondsQuestion(hours1 * 3600 + minutes1 * 60);
                } else {
                    setTotalSeconds(null);
                    setTotalSecondsQuestion(null);
                }
            } catch (error) {
                console.error("Error fetching Quizzes:", error);
            }
        };

        fetchQuizDetails();
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

                setStudentdata(response.data.student);
            } catch (error) {
                console.error("Error fetching Student Data:", error);
            }
        };

        fetchStudentDetails();
    }, []);

    const handleAnswer = (event) => {
        setSelectedAnswers({
            ...selectedAnswers,
            [currentQuestion]: event.target.value,
        });
    };

    const goToNextQuestion = () => {
        if (data && currentQuestion < data.questionsSelected.length - 1) {
            setCurrentQuestion(currentQuestion + 1);

            if (totalSecondsQuestion !== null) {
                setTotalSecondsQuestion(
                    parseInt(quiz.questionDurationHours) * 3600 +
                        parseInt(quiz.questionDurationMinutes) * 60
                );
            }
        }
    };

    const goToPreviousQuestion = () => {
        if (data && currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    useEffect(() => {
        let interval = null;
        if (totalSeconds > 0) {
            setFirst(true);
            interval = setInterval(() => {
                setTotalSeconds((prevSeconds) => prevSeconds - 1);
            }, 1000);
            setIntervalTime1(interval);
        } else if (totalSeconds === 0 && first) {
            setQuizCompleted(true);
            clearInterval(interval);
            clearInterval(intervalTime);
        }
        return () => {
            clearInterval(interval);
            clearInterval(intervalTime);
        };
    }, [totalSeconds]);

    const submitQuiz = () => {
        let responseData = {};
        let scoreSecured = 0;
        let totalScoreOfQuiz = 0;
        let index = 0;
        responseData["studentId"] = studentData._id;
        responseData["quizId"] = quiz.quiz;
        let responseArray = [];
        for (let ele of data.questionsSelected) {
            responseArray.push({
                questionId: ele._id,
                chosenOption: selectedAnswers[index],
            });

            for (let ele1 of ele.options) {
                if (parseInt(ele1.optionNumber) === parseInt(ele.answerKey)) {
                    totalScoreOfQuiz =
                        totalScoreOfQuiz + parseInt(ele1.optionWeightage);
                }
            }

            if (selectedAnswers[index]) {
                for (let ele1 of ele.options) {
                    if (
                        parseInt(selectedAnswers[index]) ===
                        parseInt(ele1.optionNumber)
                    ) {
                        scoreSecured =
                            scoreSecured + parseInt(ele1.optionWeightage);
                    }
                }
            }
            index = index + 1;
        }
        responseData["responseArray"] = responseArray;
        responseData["score"] = scoreSecured;
        responseData["maxScore"] = totalScoreOfQuiz;

        const createResponse = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.post(
                    `${
                        import.meta.env.VITE_API_URL
                    }/student/create/quiz/response`,
                    responseData,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            } catch (error) {
                console.error("Error fetching Student Data:", error);
            }
        };

        createResponse();

        setScore(scoreSecured);
        setTotalScore(totalScoreOfQuiz);
        setQuizCompleted(true);
        clearInterval(intervalTime);
        clearInterval(intervalTime1);
    };

    useEffect(() => {
        let interval1 = null;
        if (totalSecondsQuestion > 0) {
            interval1 = setInterval(() => {
                setTotalSecondsQuestion((prevSeconds) => prevSeconds - 1);
            }, 1000);
            setIntervalTime(interval1);
        } else if (totalSecondsQuestion === 0) {
            if (data && currentQuestion === data.questionsSelected.length - 1) {
                let responseData = {};
                let scoreSecured = 0;
                let totalScoreOfQuiz = 0;
                let index = 0;
                responseData["studentId"] = studentData._id;
                responseData["quizId"] = quiz.quiz;
                let responseArray = [];
                for (let ele of data.questionsSelected) {
                    responseArray.push({
                        questionId: ele._id,
                        chosenOption: selectedAnswers[index],
                    });
                    for (let ele1 of ele.options) {
                        if (
                            parseInt(ele1.optionNumber) ===
                            parseInt(ele.answerKey)
                        ) {
                            totalScoreOfQuiz =
                                totalScoreOfQuiz +
                                parseInt(ele1.optionWeightage);
                        }
                    }
                    if (selectedAnswers[index]) {
                        for (let ele1 of ele.options) {
                            if (
                                parseInt(selectedAnswers[index]) ===
                                parseInt(ele1.optionNumber)
                            ) {
                                scoreSecured =
                                    scoreSecured +
                                    parseInt(ele1.optionWeightage);
                            }
                        }
                    }
                    index = index + 1;
                }
                responseData["responseArray"] = responseArray;
                responseData["score"] = scoreSecured;
                responseData["maxScore"] = totalScoreOfQuiz;

                const createResponse = async () => {
                    try {
                        const token = localStorage.getItem("token");

                        const response = await axios.post(
                            `${
                                import.meta.env.VITE_API_URL
                            }/student/create/quiz/response`,
                            responseData,
                            {
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                },
                            }
                        );
                    } catch (error) {
                        console.error("Error fetching Student Data:", error);
                    }
                };

                createResponse();
                setTotalScore(totalScoreOfQuiz);
                setScore(scoreSecured);
                setQuizCompleted(true);
                clearInterval(interval1);
                // navigate("/student-dashboard/quiz-score", {
                //     state: {
                //         score: scoreSecured,
                //         totalScore:totalScoreOfQuiz,
                //         data,
                //         selectedAnswers
                //     },
                // });
                return;
            }
            goToNextQuestion();

            setTotalSecondsQuestion(
                parseInt(quiz.questionDurationHours) * 3600 +
                    parseInt(quiz.questionDurationMinutes) * 60
            );
            clearInterval(interval1);
        }
        return () => {
            clearInterval(interval1);
        };
    }, [totalSecondsQuestion]);

    const question = data && data.questionsSelected[currentQuestion];

    const formatTime = () => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
            2,
            "0"
        )}:${String(seconds).padStart(2, "0")}`;
    };

    const formatTime1 = () => {
        const hours = Math.floor(totalSecondsQuestion / 3600);
        const minutes = Math.floor((totalSecondsQuestion % 3600) / 60);
        const seconds = totalSecondsQuestion % 60;
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
            2,
            "0"
        )}:${String(seconds).padStart(2, "0")}`;
    };

    return (
        <>
            {data && !quizCompleted && (
                <>
                    <Box
                        sx={{
                            backgroundColor: "yellow",
                            padding: "10px",
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <Typography variant="h6" component="div" gutterBottom>
                            {data.quizTitle}
                        </Typography>
                    </Box>
                    {totalSeconds !== null && (
                        <Typography
                            variant="h6"
                            component="div"
                            gutterBottom
                            sx={{
                                margin: "10px",
                                fontSize: "18px",
                                textAlign: "right",
                            }}
                        >
                            Quiz Ends in :
                            <span style={{ color: "red" }}>{formatTime()}</span>
                        </Typography>
                    )}
                    {totalSecondsQuestion !== null && (
                        <Typography
                            variant="h6"
                            component="div"
                            gutterBottom
                            sx={{
                                margin: "10px",
                                fontSize: "18px",
                                textAlign: "right",
                            }}
                        >
                            Question Ends in :
                            <span style={{ color: "red" }}>
                                {formatTime1()}
                            </span>
                        </Typography>
                    )}

                    <Card sx={{ width: "80%", margin: "auto", mt: 4 }}>
                        <CardContent>
                            <Typography variant="body1" gutterBottom>
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                    }}
                                >
                                    <span style={{ marginRight: "10px" }}>
                                        {currentQuestion + 1}.
                                    </span>
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: question.questionStem,
                                        }}
                                    />
                                </Box>
                            </Typography>
                            <RadioGroup
                                value={selectedAnswers[currentQuestion] || ""}
                                onChange={handleAnswer}
                            >
                                {question.options.map((option, index) => (
                                    <FormControlLabel
                                        key={index}
                                        value={option.optionNumber.toString()}
                                        control={<Radio />}
                                        label={
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "row",
                                                }}
                                            >
                                                <p
                                                    style={{
                                                        marginRight: "10px",
                                                    }}
                                                >
                                                    {String.fromCharCode(
                                                        65 + index
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
                                ))}
                            </RadioGroup>
                        </CardContent>
                        <CardActions
                            sx={{
                                justifyContent: "flex-end",
                                px: 2,
                                pb: {
                                    xs: "40px",
                                    xl: 2,
                                },
                                position: "relative",
                            }}
                        >
                            <Typography
                                variant="body2"
                                sx={{
                                    position: "absolute",
                                    left: "50%",
                                    transform: {
                                        xs: "translate(-50%, 40px)", // Combine translateX and translateY for small devices
                                        xl: "translate(-50%, 0)",
                                    },
                                }}
                            >
                                Question {currentQuestion + 1} of{" "}
                                {data.questionsSelected.length}
                            </Typography>

                            <Box sx={{ display: "flex", gap: 1 }}>
                                {totalSeconds === null &&
                                    totalSecondsQuestion === null && (
                                        <Button
                                            onClick={goToPreviousQuestion}
                                            disabled={currentQuestion === 0}
                                            endIcon={<ChevronLeft />}
                                        >
                                            Previous
                                        </Button>
                                    )}
                                <Button
                                    onClick={goToNextQuestion}
                                    disabled={
                                        currentQuestion ===
                                        data.questionsSelected.length - 1
                                    }
                                    endIcon={<ChevronRight />}
                                >
                                    Next
                                </Button>
                                {currentQuestion ===
                                    data.questionsSelected.length - 1 && (
                                    <Button onClick={submitQuiz}>
                                        Submit Quiz
                                    </Button>
                                )}
                            </Box>
                        </CardActions>
                    </Card>
                </>
            )}
            {quizCompleted && (
                <>
                    <Box
                        sx={{
                            backgroundColor: "yellow",
                            padding: "10px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <Typography variant="h6" component="div" gutterBottom>
                            {data.quizTitle}
                        </Typography>
                        <p
                            style={{
                                padding: "10px",
                                textAlign: "center",
                                fontSize: "20px",
                            }}
                        >
                            {/* Quiz Completed your Score is {score}/{totalScore}. */}
                            All Quiz is Attempted
                        </p>
                    </Box>

                    <Box>
                        {data.questionsSelected.map(
                            (currentQuestion, index) => (
                                <Card
                                    sx={{ width: "80%", margin: "auto", mt: 4 }}
                                >
                                    <CardContent>
                                        <Typography
                                            variant="body1"
                                            gutterBottom
                                        >
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    flexDirection: "row",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        marginRight: "10px",
                                                    }}
                                                >
                                                    {index + 1}.
                                                </span>
                                                <span
                                                    dangerouslySetInnerHTML={{
                                                        __html: currentQuestion.questionStem,
                                                    }}
                                                />
                                            </Box>
                                        </Typography>

                                        <RadioGroup
                                            value={selectedAnswers[index] || ""}
                                        >
                                            {currentQuestion.options.map(
                                                (option, optIndex) => {
                                                    const isCorrect =
                                                        parseInt(
                                                            option.optionNumber
                                                        ) ===
                                                        parseInt(
                                                            currentQuestion.answerKey
                                                        );

                                                    const isSelected =
                                                        selectedAnswers[
                                                            index
                                                        ] &&
                                                        selectedAnswers[
                                                            index
                                                        ].toString() ===
                                                            option.optionNumber.toString();

                                                    const Icon = isCorrect
                                                        ? CheckCircle
                                                        : isSelected
                                                        ? Cancel
                                                        : null;
                                                    const color = isCorrect
                                                        ? "green"
                                                        : isSelected
                                                        ? "red"
                                                        : "inherit";

                                                    return (
                                                        <Box
                                                            key={optIndex}
                                                            sx={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                position:
                                                                    "relative",
                                                            }}
                                                        >
                                                            <FormControlLabel
                                                                value={option.optionNumber.toString()}
                                                                control={
                                                                    <Radio
                                                                        sx={{
                                                                            color: color,
                                                                            "&.Mui-checked":
                                                                                {
                                                                                    color: color,
                                                                                },
                                                                        }}
                                                                    />
                                                                }
                                                                label={
                                                                    <div
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            flexDirection:
                                                                                "row",
                                                                            color: color,
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
                                                                                    optIndex
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

                                                            {Icon && (
                                                                <Icon
                                                                    sx={{
                                                                        color: color,
                                                                        ml: 1,
                                                                        position:
                                                                            "absolute",
                                                                        right: "10px",
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>
                                                    );
                                                }
                                            )}
                                        </RadioGroup>
                                    </CardContent>
                                    <CardActions
                                        sx={{
                                            justifyContent: "flex-end",
                                            px: 2,
                                            pb: 2,
                                            position: "relative",
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                position: "absolute",
                                                left: "50%",
                                                transform: "translateX(-50%)",
                                            }}
                                        >
                                            Question {index + 1} of{" "}
                                            {data.questionsSelected.length}
                                        </Typography>
                                    </CardActions>
                                </Card>
                            )
                        )}
                    </Box>
                </>
            )}
        </>
    );
};

export default AttemptQuiz;
