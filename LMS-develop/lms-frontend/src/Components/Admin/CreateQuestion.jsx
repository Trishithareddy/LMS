import AddIcon from "@mui/icons-material/Add";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import JoditEditor from "jodit-react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Snackbar,
    TextField,
    Typography,
    Paper,
    TableBody,
    Table,
    TableCell,
    TableHead,
    TableRow,
    TableContainer,
    CircularProgress,
} from "@mui/material";
import Papa from "papaparse";
import Autocomplete from "@mui/material/Autocomplete";
import Stack from "@mui/material/Stack";
import axios from "axios";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { styled } from "@mui/material/styles";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: "bold",
    backgroundColor: theme.palette.success.main,
    color: theme.palette.common.white,
    textAlign: "center",
    padding: theme.spacing(1),
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": {
        backgroundColor: theme.palette.action.hover,
    },
}));

const CreateQuestion = () => {
    const [csvData, setCsvData] = useState([]);
    const [csvFile, setCsvFile] = useState(null);

    const questionType = [
        { _id: 1, name: "MCQ" },
        { _id: 2, name: "Short Answer" },
        { _id: 3, name: "Fill In the Blanks" },
        { _id: 4, name: "Long Answer" },
        { _id: 5, name: "Very Short Answer" },
        { _id: 6, name: "True or False" },
    ];
    const difficultyLevelType = [
        { _id: 1, name: "Easy" },
        { _id: 2, name: "Medium" },
        { _id: 3, name: "Hard" },
    ];
    // const answerKey = [
    //     { answer: "A", _id: 1 },
    //     { answer: "B", _id: 2 },
    //     { answer: "C", _id: 3 },
    //     { answer: "D", _id: 4 },
    // ];
    const [selectedQuestionType, setSelectedQuestionType] = useState("");
    const [selectedDifficultyLevelType, setSelectedDifficultyLevelType] =
        useState("");


    const [grade, setGrade] = useState([]);
    const [showGradeFields, setShowGradeFields] = useState(false);
    const [gradeName, setGradeName] = useState("");
    const [selectedGrade, setSelectedGrade] = useState("");

    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState("");

    const [questionTitle, setQuestionTitle] = useState("");

    const [showChapterFields, setShowChapterFields] = useState(false);
    const [chapters, setChapters] = useState([]);
    const [chapterName, setChapterName] = useState("");
    const [selectedChapter, setSelectedChapter] = useState("");

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    const [questionStemContent, setQuestionStemContent] = useState("");
    const [option1, setOption1] = useState("");
    const [option2, setOption2] = useState("");
    const [option3, setOption3] = useState("");
    const [option4, setOption4] = useState("");
    const [selectedAnswerKey, setSelectedAnswerKey] = useState("");
    const [explanation, setExplanation] = useState("");
    const [answerVariations, setAnswerVariations] = useState([""]);
    const [courseChapters, setCourseChapters] = useState([""]);
    const [loading, setLoading] = useState(false);

    const editor1 = useRef(null);
    const editor2 = useRef(null);
    const editor3 = useRef(null);
    const editor4 = useRef(null);
    const editor5 = useRef(null);
    const editor6 = useRef(null);
    const formRef1 = useRef(null);
    const formRef2 = useRef(null);
    const formRef3 = useRef(null);
    const formRef4 = useRef(null);
    const formRef5 = useRef(null);
    const formRef6 = useRef(null);

    const config = useMemo(
        () => ({
            theme: "light",
            height: "350px",
            width: "100%",
            uploader: {
                insertImageAsBase64URI: false,
                url: `${import.meta.env.VITE_API_URL}/lessons/upload-image`,
                format: "json",
                headers: {},
                prepareData: function (formData) {
                    return formData;
                },
                process: function (response) {
                    if (!response.success || !response.data) {
                        return {
                            error: response.messages
                                ? response.messages[0]
                                : "Upload failed",
                        };
                    }
                    return {
                        files: response.data.files,
                        path: "",
                        isImages: response.data.isImages,
                        error: null,
                    };
                },
                defaultHandlerSuccess: function (data) {
                    const imageUrl = data.files[0];
                    this.selection.insertImage(imageUrl);
                },
            },
            extraButtons: [
                {
                    name: "video",
                    icon: "video",
                    exec: (editor) => {
                        const url = prompt("Enter video URL:");
                        if (url) {
                            editor.selection.insertHTML(`
                            <video controls src="${url}" style="max-width: 100%; height: auto;"></video>
                        `);
                        }
                    },
                },
            ],
        }),
        []
    );

    const renderTableCellsOfHeader = (question) => {
        if (!question) return null;

        switch (question.questionType) {
            case "MCQ":
                return (
                    <>
                        <StyledTableCell>option1Number</StyledTableCell>
                        <StyledTableCell>option1</StyledTableCell>

                        <StyledTableCell>option2Number</StyledTableCell>
                        <StyledTableCell>option2</StyledTableCell>
     
                        <StyledTableCell>option3Number</StyledTableCell>
                        <StyledTableCell>option3</StyledTableCell>
  
                        <StyledTableCell>option4Number</StyledTableCell>
                        <StyledTableCell>option4</StyledTableCell>

                        <StyledTableCell>Answer</StyledTableCell>
                    </>
                );

            case "Short Answer":
            case "Long Answer":
            case "Fill In the Blanks":
                return <StyledTableCell>Answer</StyledTableCell>;

            case "Very Short Answer":
                return (
                    <>
                        <StyledTableCell>Answer</StyledTableCell>
                    </>
                );

            case "True or False":
                return <StyledTableCell>Answer</StyledTableCell>;

            default:
                return null;
        }
    };

    const renderTableCellsOfBody = (question) => {
        if (!question) return null;

        switch (question.questionType) {
            case "MCQ":
                return (
                    <>
                        {question.options.map((every, index) => (
                            <React.Fragment key={index}>
                                <TableCell>{every.optionNumber}</TableCell>
                                <TableCell>{every.option}</TableCell>
                            </React.Fragment>
                        ))}
                        <TableCell>{question.answer}</TableCell>
                    </>
                );

            case "Short Answer":
            case "Long Answer":
            case "Fill In the Blanks":
                return <TableCell>{question.answer}</TableCell>;

            case "Very Short Answer":
                return (
                    <>
                        <TableCell>{question.answer}</TableCell>
                    </>
                );

            case "True or False":
                return <TableCell>{question.answer}</TableCell>;

            default:
                return null;
        }
    };

    const handleFileUpload = (event) => {
        setCsvFile(event.target.files[0]);
    };

    const processCSV = (file) => {
    Papa.parse(file, {
        complete: (results) => {
            const rows = results.data.slice(1); // skip header row

            if (rows[0][0] === "MCQ") {
                const processOptions = (opt1, opt2, opt3, opt4) => [
                    { optionNumber: 1, option: `<p>${opt1}</p>` },
                    { optionNumber: 2, option: `<p>${opt2}</p>` },
                    { optionNumber: 3, option: `<p>${opt3}</p>` },
                    { optionNumber: 4, option: `<p>${opt4}</p>` },
                ];

                const parsedData = rows.map((row) => ({
                    questionType:   row[0],
                    questionTitle:  row[1],
                    grade:          row[2],
                    gradeName:      row[3],
                    course:         row[4],
                    courseName:     row[5],
                    chapter:        row[6],
                    chapterName:    row[7],
                    difficultyLevel: row[8],
                    questionStem:   `<p>${row[9]}</p>`,
                    explanation:    `<p>${row[10]}</p>`,
                    options:        processOptions(row[11], row[12], row[13], row[14]),
                    answer:         row[15],
                }));

                setCsvData(parsedData);

            } else if (rows[0][0] === "Very Short Answer") {
                const parsedData = rows.map((row) => ({
                    questionType:   row[0],
                    questionTitle:  row[1],
                    grade:          row[2],
                    gradeName:      row[3],
                    course:         row[4],
                    courseName:     row[5],
                    chapter:        row[6],
                    chapterName:    row[7],
                    difficultyLevel: row[8],
                    questionStem:   `<p>${row[9]}</p>`,
                    answer:         `<p>${row[10]}</p>`,
                    explanation:    `<p>${row[11]}</p>`,
                }));

                setCsvData(parsedData);

            } else {
                const parsedData = rows.map((row) => ({
                    questionType:   row[0],
                    questionTitle:  row[1],
                    grade:          row[2],
                    gradeName:      row[3],
                    course:         row[4],
                    courseName:     row[5],
                    chapter:        row[6],
                    chapterName:    row[7],
                    difficultyLevel: row[8],
                    questionStem:   `<p>${row[9]}</p>`,
                    answer:         `<p>${row[10]}</p>`,
                    explanation:    `<p>${row[11]}</p>`,
                }));

                setCsvData(parsedData);
            }
        },
        header: false,
        skipEmptyLines: true,
    });
};

    const handleCSVSubmit = async () => {
        if (!csvFile) {
            handleSnackbarOpen("Please select a CSV file", "error");
            return;
        }

        processCSV(csvFile);
    };

    const handleSnackbarOpen = (message, severity = "success") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === "clickaway") {
            return;
        }
        setOpenSnackbar(false);
    };



    const fetchAllCourses = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/courses/getAllCourses`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log("Courses fetched:", response.data);
            setCourses(response.data.data);
        } catch (error) {
            console.error("Error fetching Courses:", error);
            handleSnackbarOpen("Error fetching Courses", "error");
        }
    };
    useEffect(() => {
        fetchAllCourses()
    }, []);

    const fetchChapters = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/chapters/getAllChapters`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setChapters(response.data);
        } catch (error) {
            console.error("Error fetching chapters:", error);
            handleSnackbarOpen("Error fetching Chapters", "error");
        }
    };

    useEffect(() => {
        fetchChapters();
    }, []);

    const fetchGrades = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/questionBase/get/allGrades`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setGrade(response.data.grades);
        } catch (error) {
            console.error("Error fetching boards:", error);
            handleSnackbarOpen("Error fetching Grades", "error");
            setGrade([]);
        }
    };

    useEffect(() => {
        fetchGrades();
    }, []);

    const handleQuestionTypeChange = (e) => {
        setSelectedQuestionType(e.target.value);
    };

    const handleDifficultyLevelTypeChange = (e) => {
        setSelectedDifficultyLevelType(e.target.value);
    };



    const handleGradeChange = (e) => {
        setSelectedGrade(e.target.value);
    };


    const handleChapterChange = (e) => {
        setSelectedChapter(e.target.value);
    };
    const handleCourseChange = (e) => {
        const course = e.target.value;
        setSelectedCourse(course);
        const chapter = chapters.filter(
            (chapterId) => chapterId.course == course._id
        );
        chapter.sort((a, b) => a.chapterId - b.chapterId);
        setCourseChapters(chapter);
    };


    const handleGradeSave = async () => {
        const data = { gradeName: gradeName };
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/questionBase/grade/create`,
                data,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            handleSnackbarOpen("Grade created successfully", "success");
            fetchGrades();
        } catch (error) {
            console.error("Error creating Grade:", error);
            handleSnackbarOpen("Error occurred while creating Grade", "error");
        }
        setGradeName("");
    };

    const handleChapterSave = async () => {
        if (!selectedCourse) {
            handleSnackbarOpen("Please select a Course", "error");
            return;
        }

        const data = { name: chapterName };
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/chapters/${
                    selectedCourse._id
                }/addChapter`,
                data,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            handleSnackbarOpen("Chapter created successfully", "success");
        } catch (error) {
            console.error("Error creating Chapter:", error);
            handleSnackbarOpen(
                "Error occurred while creating Chapter",
                "error"
            );
        }

        setChapterName("");
        fetchChapters(selectedSubcategory._id);
    };

    const handleAnswerKeyChange = (e) => {
        setSelectedAnswerKey(e.target.value);
    };

    const handleQuestionSave = async () => {

        const questionData = {
            questionType: selectedQuestionType,
            questionTitle: questionTitle,
            grade: selectedGrade._id,
            gradeName: selectedGrade.name,
            course: selectedCourse._id, // Add this line
            courseName: selectedCourse.name,
            chapter: selectedChapter._id,
            chapterName: selectedChapter.name,
            difficultyLevel: selectedDifficultyLevelType,
            questionStem: questionStemContent,
            explanation: explanation,
        };

        if (selectedQuestionType === "MCQ") {
            questionData.options = [
                {
                    optionNumber: 1,
                    option: option1,
                },
                {
                    optionNumber: 2,
                    option: option2,
                 
                },
                {
                    optionNumber: 3,
                    option: option3,
                 
                },
                {
                    optionNumber: 4,
                    option: option4,
                },
            ];
            questionData.answer=selectedAnswerKey
        } else if (selectedQuestionType === "Very Short Answer") {
            questionData.answer = option1;
          
        } else {
            questionData.answer = option1;
        }

        const questionsToSubmit = csvData.length > 0 ? csvData : [questionData];
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `${
                    import.meta.env.VITE_API_URL
                }/questionBase/create/questionBase`,
                questionsToSubmit,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            handleSnackbarOpen("Question created successfully", "success");

            setCsvData([]);
            setCsvFile(null);

            setQuestionTitle("");
            setSelectedQuestionType("");
            setSelectedDifficultyLevelType("");
            setSelectedGrade("");
            setSelectedCourse("");
            setSelectedChapter("");
            setQuestionStemContent("");
            setOption1("");
            setOption2("");
            setOption3("");
            setOption4("");
            setSelectedAnswerKey("");
            setExplanation("");
        } catch (error) {
            console.error("Error creating Question:", error);
            handleSnackbarOpen(
                "Error occurred while creating Question",
                "error"
            );
            return;
        } finally {
            setLoading(false);
        }
    };

    const renderAnswerSection = () => {
        switch (selectedQuestionType) {
            case "MCQ":
                return (
                    <>
                        <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                            sx={{
                                backgroundColor: "rgb(237, 231, 230)",
                                padding: "20px",
                            }}
                            mb={2}
                        >
                            <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                // sx={{width: "95%" }}
                                mb={2}
                            >
                                <div ref={formRef2}>
                                    <Typography
                                        variant="h6"
                                        component="h2"
                                        gutterBottom
                                        textAlign="center"
                                    >
                                        Option1
                                    </Typography>
                                    <JoditEditor
                                        ref={editor2}
                                        value={option1}
                                        config={config}
                                        tabIndex={1} // tabIndex of textarea
                                        onBlur={(newContent) =>
                                            setOption1(newContent)
                                        } // preferred to use only this option to update the content for performance reasons
                                    />
                                </div>
                            </Box>
           
                            <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                // sx={{width: "95%" }}
                                mb={2}
                            >
                                <div ref={formRef4}>
                                    <Typography
                                        variant="h6"
                                        component="h2"
                                        gutterBottom
                                        textAlign="center"
                                    >
                                        Option2
                                    </Typography>
                                    <JoditEditor
                                        ref={editor4}
                                        value={option2}
                                        config={config}
                                        tabIndex={1} // tabIndex of textarea
                                        onBlur={(newContent) =>
                                            setOption2(newContent)
                                        } // preferred to use only this option to update the content for performance reasons
                                    />
                                </div>
                            </Box>
  
                            <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                // sx={{width: "95%" }}
                                mb={2}
                            >
                                <div ref={formRef5}>
                                    <Typography
                                        variant="h6"
                                        component="h2"
                                        gutterBottom
                                        textAlign="center"
                                    >
                                        Option3
                                    </Typography>
                                    <JoditEditor
                                        ref={editor5}
                                        value={option3}
                                        config={config}
                                        tabIndex={1} // tabIndex of textarea
                                        onBlur={(newContent) =>
                                            setOption3(newContent)
                                        } // preferred to use only this option to update the content for performance reasons
                                    />
                                </div>
                            </Box>

                            <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                // sx={{width: "95%" }}
                                mb={2}
                            >
                                <div ref={formRef6}>
                                    <Typography
                                        variant="h6"
                                        component="h2"
                                        gutterBottom
                                        textAlign="center"
                                    >
                                        Option4
                                    </Typography>
                                    <JoditEditor
                                        ref={editor6}
                                        value={option4}
                                        config={config}
                                        tabIndex={1} // tabIndex of textarea
                                        onBlur={(newContent) =>
                                            setOption4(newContent)
                                        } // preferred to use only this option to update the content for performance reasons
                                    />
                                </div>
                            </Box>
                        </Box>

                        <Box display="flex" alignItems="center" mb={2}>
                            <FormControl
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                required
                            >
                                <TextField
                                    labelId="answerKey-select-label"
                                    value={selectedAnswerKey}
                                    onChange={handleAnswerKeyChange}
                                    label="Answer in words *"
                                >
                                </TextField>
                            </FormControl>
                        </Box>
                    </>
                );

            case "Short Answer":
            case "Fill In the Blanks":
            case "Long Answer":
                return (
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        sx={{
                            backgroundColor: "rgb(237, 231, 230)",
                            padding: "20px",
                        }}
                        mb={2}
                    >
                        <div style={{ width: "100%" }}>
                            <Typography
                                variant="h6"
                                component="h2"
                                gutterBottom
                                textAlign="center"
                            >
                                Answer
                            </Typography>
                            <JoditEditor
                                value={option1}
                                config={config}
                                tabIndex={1}
                                onBlur={(newContent) => setOption1(newContent)}
                            />
                        </div>
                    </Box>
                );

            case "Very Short Answer":
                return (
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        sx={{
                            backgroundColor: "rgb(237, 231, 230)",
                            padding: "20px",
                        }}
                        mb={2}
                    >
                        {answerVariations.map((_, index) => (
                            <Box key={index} width="100%" mb={2}>
                                <Typography
                                    variant="h6"
                                    component="h2"
                                    gutterBottom
                                    textAlign="center"
                                >
                                    {index === 0
                                        ? "Main Answer"
                                        : `Variation ${index}`}
                                </Typography>
                                <JoditEditor
                                    value={
                                        index === 0
                                            ? option1
                                            : answerVariations[index]
                                    }
                                    config={config}
                                    tabIndex={1}
                                    onBlur={(newContent) => {
                                        if (index === 0) {
                                            setOption1(newContent);
                                        } else {
                                            const newVariations = [
                                                ...answerVariations,
                                            ];
                                            newVariations[index] = newContent;
                                            setAnswerVariations(newVariations);
                                        }
                                    }}
                                />
                            </Box>
                        ))}
                        <Button
                            onClick={() =>
                                setAnswerVariations([...answerVariations, ""])
                            }
                            variant="contained"
                            sx={{ mt: 2 }}
                        >
                            Add Answer Variation
                        </Button>
                    </Box>
                );

            case "True or False":
                return (
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        sx={{
                            backgroundColor: "rgb(237, 231, 230)",
                            padding: "20px",
                        }}
                        mb={2}
                    >
                        <FormControl fullWidth variant="outlined">
                            <InputLabel>Answer</InputLabel>
                            <Select
                                value={option1}
                                onChange={(e) => setOption1(e.target.value)}
                                label="Answer"
                            >
                                <MenuItem value="true">True</MenuItem>
                                <MenuItem value="false">False</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Container>
            <Container maxWidth="md">
                <Card variant="outlined">
                    <Snackbar
                        open={openSnackbar}
                        autoHideDuration={6000}
                        onClose={handleSnackbarClose}
                        anchorOrigin={{ vertical: "top", horizontal: "center" }}
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
                    <CardContent>
                        <Typography
                            variant="h5"
                            component="h2"
                            gutterBottom
                            textAlign="center"
                        >
                            Create Question
                        </Typography>
                        <Box display="flex" alignItems="center" mb={2}>
                            <FormControl
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                required
                            >
                                <InputLabel id="questionType-select-label">
                                    Question Type
                                </InputLabel>
                                <Select
                                    labelId="questionType-select-label"
                                    value={selectedQuestionType}
                                    onChange={handleQuestionTypeChange}
                                    label="QuestionType"
                                >
                                    {questionType.map((questiontype) => (
                                        <MenuItem
                                            key={questiontype._id}
                                            value={questiontype.name}
                                        >
                                            {questiontype.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <TextField
                            fullWidth
                            variant="outlined"
                            margin="normal"
                            label="Question Title"
                            value={questionTitle}
                            onChange={(e) => setQuestionTitle(e.target.value)}
                            required
                        />



                        <Box display="flex" alignItems="center" mb={2}>
                            <FormControl
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                required
                            >
                                <InputLabel id="grade-select-label">
                                    Grade
                                </InputLabel>
                                <Select
                                    labelId="grade-select-label"
                                    value={selectedGrade}
                                    onChange={handleGradeChange}
                                    label="Grade"
                                >
                                    {grade.map((grade) => (
                                        <MenuItem key={grade._id} value={grade}>
                                            {grade.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button
                                onClick={() =>
                                    setShowGradeFields(!showGradeFields)
                                }
                                style={{ marginLeft: "10px" }}
                            >
                                <AddIcon />
                            </Button>
                        </Box>

                        {showGradeFields && (
                            <>
                                <Box>
                                    <TextField
                                        sx={{ backgroundColor: "whitesmoke" }}
                                        fullWidth
                                        variant="outlined"
                                        margin="normal"
                                        label="Grade Name"
                                        value={gradeName}
                                        onChange={(e) =>
                                            setGradeName(e.target.value)
                                        }
                                        required
                                    />

                                    <Button
                                        onClick={handleGradeSave}
                                        style={{
                                            marginTop: "10px",
                                            backgroundColor: "#4caf50",
                                            color: "#fff",
                                        }}
                                    >
                                        Save Grade
                                    </Button>
                                </Box>
                            </>
                        )}


                        <Box display="flex" alignItems="center" mb={2}>
                            <FormControl
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                required
                            >
                                <InputLabel id="course-select-label">
                                    Courses
                                </InputLabel>
                                <Select
                                    labelId="course-select-label"
                                    value={selectedCourse}
                                    onChange={handleCourseChange}
                                    label="Course"
                                >
                                    {/* we are getting problem here  */}

                                    {courses.map((course) => (
                                        <MenuItem
                                            key={course._id}
                                            value={course}
                                        >
                                            {course.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        <Box display="flex" alignItems="center" mb={2}>
                            <FormControl
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                required
                            >
                                <InputLabel id="Chapter-select-label">
                                    Chapter
                                </InputLabel>
                                <Select
                                    labelId="Chapter-select-label"
                                    value={selectedChapter}
                                    onChange={handleChapterChange}
                                    label="Chapter"
                                >
                                    {courseChapters.map((chapter) => (
                                        <MenuItem
                                            key={chapter._id}
                                            value={chapter}
                                        >
                                            {chapter.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                        </Box>



 

                        <Box display="flex" alignItems="center" mb={2}>
                            <FormControl
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                required
                            >
                                <InputLabel id="questionDifficultyLevelType-select-label">
                                    Question Difficulty Level
                                </InputLabel>
                                <Select
                                    labelId="questionDifficultyLevelType-select-label"
                                    value={selectedDifficultyLevelType}
                                    onChange={handleDifficultyLevelTypeChange}
                                    label="QuestionDifficultyLevelType"
                                >
                                    {difficultyLevelType.map(
                                        (difficultyLevel) => (
                                            <MenuItem
                                                key={difficultyLevel._id}
                                                value={difficultyLevel.name}
                                            >
                                                {difficultyLevel.name}
                                            </MenuItem>
                                        )
                                    )}
                                </Select>
                            </FormControl>
                        </Box>
                    </CardContent>
                </Card>
            </Container>

            <Box
                sx={{
                    backgroundColor: "white",
                    borderWidth: "1px",
                    borderColor: "rgb(222, 217, 217)",
                    borderStyle: "solid",
                    padding: "20px",
                }}
            >
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    sx={{ backgroundColor: "lightgray", padding: "20px" }}
                    mb={2}
                >
                    <div ref={formRef1}>
                        <Typography
                            variant="h6"
                            component="h2"
                            gutterBottom
                            textAlign="center"
                        >
                            Question Stem
                        </Typography>
                        <JoditEditor
                            ref={editor1}
                            value={questionStemContent}
                            config={config}
                            tabIndex={1} // tabIndex of textarea
                            onBlur={(newContent) =>
                                setQuestionStemContent(newContent)
                            } // preferred to use only this option to update the content for performance reasons
                        />
                        {/* <Button
                                onClick={handleSubmit1}
                                style={{
                                    marginTop: "10px",
                                    backgroundColor: "#4caf50",
                                    color: "#fff",
                                }}
                            >
                                Submit Content
                            </Button> */}
                    </div>
                </Box>

                {renderAnswerSection()}

                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                        backgroundColor: "lightgray",
                        padding: "10px",
                    }}
                    mb={2}
                >
                    <div ref={formRef3} style={{ width: "90%" }}>
                        <Typography
                            variant="h6"
                            component="h2"
                            gutterBottom
                            textAlign="center"
                        >
                            Explanation
                        </Typography>
                        <JoditEditor
                            ref={editor3}
                            value={explanation}
                            config={config}
                            tabIndex={1} // tabIndex of textarea
                            onBlur={(newContent) => setExplanation(newContent)} // preferred to use only this option to update the content for performance reasons
                        />
                    </div>
                </Box>

                <Paper sx={{ padding: 2, marginBottom: 2 }}>
                    <Typography variant="h6" align="center">
                        Bulk Add Questions via CSV
                    </Typography>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: 2,
                        }}
                    >
                        <input
                            accept=".csv"
                            style={{ display: "none" }}
                            id="raised-button-file"
                            type="file"
                            onChange={handleFileUpload}
                        />
                        <label htmlFor="raised-button-file">
                            <Button
                                variant="contained"
                                component="span"
                                sx={{
                                    backgroundColor: "green",
                                    "&:hover": { backgroundColor: "darkgreen" },
                                }}
                            >
                                Upload CSV
                            </Button>
                        </label>
                        {csvFile && (
                            <Typography sx={{ ml: 2 }}>
                                {csvFile.name}
                            </Typography>
                        )}
                        <Button
                            variant="contained"
                            onClick={handleCSVSubmit}
                            sx={{
                                ml: 2,
                                backgroundColor: "green",
                                "&:hover": { backgroundColor: "darkgreen" },
                            }}
                        >
                            Process CSV
                        </Button>
                    </Box>
                </Paper>

                {csvData.length > 0 && (
                    <Paper sx={{ padding: 2, marginBottom: 2 }}>
                        <Typography variant="h6" align="center">
                            Processed CSV Data
                        </Typography>
                        <TableContainer component={Paper} sx={{ marginTop: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <StyledTableCell>
                                            Question type
                                        </StyledTableCell>
                                        <StyledTableCell>
                                            Question title
                                        </StyledTableCell>
                 
                                        <StyledTableCell>grade</StyledTableCell>
                                        <StyledTableCell>
                                            gradeName
                                        </StyledTableCell>
                                        
                                        <StyledTableCell>
                                            course
                                        </StyledTableCell>
                                        <StyledTableCell>
                                            courseName
                                        </StyledTableCell>
                                        <StyledTableCell>
                                            chapter
                                        </StyledTableCell>
                                        <StyledTableCell>
                                            chapterName
                                        </StyledTableCell>
                                        <StyledTableCell>
                                            difficultyLevel
                                        </StyledTableCell>
                                        <StyledTableCell>
                                            questionStem
                                        </StyledTableCell>
                                        <StyledTableCell>
                                            explanation
                                        </StyledTableCell>
                                        {renderTableCellsOfHeader(csvData[0])}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {csvData.map((question, index) => (
                                        <StyledTableRow key={index}>
                                            <TableCell>
                                                {question.questionType}
                                            </TableCell>
                                            <TableCell>
                                                {question.questionTitle}
                                            </TableCell>
                          
                                    
                                            <TableCell>
                                                {question.grade}
                                            </TableCell>
                                            <TableCell>
                                                {question.gradeName}
                                            </TableCell>

                                            <TableCell>
                                                {question.course}
                                            </TableCell>
                                            <TableCell>
                                                {question.courseName}
                                            </TableCell>
                                            <TableCell>
                                                {question.chapter}
                                            </TableCell>
                                            <TableCell>
                                                {question.chapterName}
                                            </TableCell>
                                            <TableCell>
                                                {question.difficultyLevel}
                                            </TableCell>
                                            <TableCell>
                                                {question.questionStem}
                                            </TableCell>
                                            <TableCell>
                                                {question.explanation}
                                            </TableCell>
                                            {renderTableCellsOfBody(question)}
                                        </StyledTableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}
                <Button
                    onClick={handleQuestionSave}
                    disabled={loading}
                    style={{
                        marginLeft: 2,
                        backgroundColor: "green",
                        color: "#fff",
                        cursor: loading ? "wait" : "pointer",
                    }}
                >
                    {loading ? "Saving..." : "Save Question"}
                </Button>
            </Box>
        </Container>
    );
};

export default CreateQuestion;
