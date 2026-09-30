import React, { useEffect, useRef, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
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
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import Stack from "@mui/material/Stack";
import axios from "axios";

const EditQuestion = () => {
    const [question, setQuestion] = useState("");
    const location = useLocation();
    const id = location.state?.questionId || location.state?.id;

    const questionType = [
        { _id: 1, name: "MCQ" },
        { _id: 2, name: "Short Answer" },
        { _id: 3, name: "Fill In the Blanks" },
        { _id: 4, name: "Long Answer" },
        { _id: 5, name: "Very Short Answer" },
        { _id: 6, name: "True or False" },
    ];
    const answerKey = [
        { answer: "A", _id: 1 },
        { answer: "B", _id: 2 },
        { answer: "C", _id: 3 },
        { answer: "D", _id: 4 },
    ];

    const [selectedQuestionType, setSelectedQuestionType] = useState("");

    const [board, setBoard] = useState([]);
    const [showBoardFields, setShowBoardFields] = useState(false);
    const [boardName, setBoardName] = useState("");
    const [boardDescription, setBoardDescription] = useState("");
    const [selectedBoard, setSelectedBoard] = useState("");

    const [grade, setGrade] = useState([]);
    const [showGradeFields, setShowGradeFields] = useState(false);
    const [gradeName, setGradeName] = useState("");
    const [selectedGrade, setSelectedGrade] = useState("");

    const [showCategoryFields, setShowCategoryFields] = useState(false);
    const [categoryName, setCategoryName] = useState("");
    const [categoryDescription, setCategoryDescription] = useState("");
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");

    const [showSubcategoryFields, setShowSubcategoryFields] = useState(false);
    const [subcategoryName, setSubcategoryName] = useState("");
    const [subcategoryDescription, setSubcategoryDescription] = useState("");
    const [subcategories, setSubcategories] = useState([]);
    const [selectedSubcategory, setSelectedSubcategory] = useState("");

    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [selectedCourseName, setSelectedCourseName] = useState("");

    const [questionTitle, setQuestionTitle] = useState("");

    const [showConceptFields, setShowConceptFields] = useState(false);
    const [concepts, setConcepts] = useState([]);
    const [conceptName, setConceptName] = useState("");
    const [selectedConcept, setSelectedConcept] = useState([]);

    const [showChapterFields, setShowChapterFields] = useState(false);
    const [chapters, setChapters] = useState([]);
    const [chapterName, setChapterName] = useState("");
    const [selectedChapter, setSelectedChapter] = useState("");

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    const [questionStemContent, setQuestionStemContent] = useState("");
    const [option1, setOption1] = useState("");
    const [optionLD1, setOptionLD1] = useState("");
    const [optionWeightage1, setOptionWeightage1] = useState("");
    const [option2, setOption2] = useState("");
    const [optionLD2, setOptionLD2] = useState("");
    const [optionWeightage2, setOptionWeightage2] = useState("");
    const [option3, setOption3] = useState("");
    const [optionLD3, setOptionLD3] = useState("");
    const [optionWeightage3, setOptionWeightage3] = useState("");
    const [option4, setOption4] = useState("");
    const [optionLD4, setOptionLD4] = useState("");
    const [optionWeightage4, setOptionWeightage4] = useState("");

    const [selectedAnswerKey, setSelectedAnswerKey] = useState("");
    const [explanation, setExplanation] = useState("");
    const [answerVariations, setAnswerVariations] = useState([]);

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

    const getEntityId = (value) => {
        if (!value) return "";
        return typeof value === "object" ? value._id || "" : value;
    };

    const fetchBoards = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/questionBase/get/allBoards`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setBoard(response.data.boards);
        } catch (error) {
            console.error("Error fetching boards:", error);
             showSnackbar("Error fetching Boards", "error");
            setBoard([]);
        }
    };

    useEffect(() => {
        const initializeData = async () => {
            await fetchBoards();
        };
        initializeData();
    }, []);

    const handleSnackbarOpen = (message, severity) => {
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

    const fetchAllCategories = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${
                    import.meta.env.VITE_API_URL
                }/categories/fetch/allCategories`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setCategories(response.data);
        } catch (error) {
            console.error("Error fetching boards:", error);
            alert("Error fetching Categories");
            setCategories([]);
        }
    };

    useEffect(() => {
        fetchAllCategories();
    }, []);

    const fetchSubcategories = async (categoryId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${
                    import.meta.env.VITE_API_URL
                }/categories/getSubCategories/${categoryId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setSubcategories(response.data);
        } catch (error) {
            console.error("Error fetching subcategories:", error);
        }
    };

    const fetchAllCourses = async (subCategoryId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${
                    import.meta.env.VITE_API_URL
                }/subcategories/courses/${subCategoryId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setCourses(response.data);
        } catch (error) {
            console.error("Error fetching Courses:", error);
            alert("Error fetching Courses");
        }
    };

    const fetchChapters = async (subCategoryId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${
                    import.meta.env.VITE_API_URL
                }/subcategories/chapters/${subCategoryId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setChapters(response.data);
        } catch (error) {
            console.error("Error fetching chapters:", error);
        }
    };

    const fetchConcepts = async (chapterId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${
                    import.meta.env.VITE_API_URL
                }/questionBase/get/allConcepts/${chapterId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setConcepts(response.data);
        } catch (error) {
            console.error("Error fetching concepts:", error);
        }
    };

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
        fetchSubcategories(e.target.value._id);
    };

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
            alert("Error fetching Boards");
            setGrade([]);
        }
    };

    useEffect(() => {
        fetchGrades();
    }, []);

    const handleQuestionTypeChange = (e) => {
        setSelectedQuestionType(e.target.value);
    };

    const handleBoardChange = (e) => {
        const selectedBoardId = e.target.value;
        const selectedBoardObject = board.find(
            (b) => b._id === selectedBoardId
        );
        setSelectedBoard(selectedBoardObject || null);
    };

    const handleGradeChange = (e) => {
        setSelectedGrade(e.target.value);
    };

    const handleSubcategoryChange = (e) => {
        setSelectedSubcategory(e.target.value);
        fetchAllCourses(e.target.value._id);
        fetchChapters(e.target.value._id);
    };

    const handleChapterChange = (e) => {
        setSelectedChapter(e.target.value);
        fetchConcepts(e.target.value._id);
    };
    const handleCourseChange = (e) => {
        const courseId = e.target.value;
        const selectedCourseObj = courses.find(
            (course) => course._id === courseId
        );
        setSelectedCourse(selectedCourseObj);
        setSelectedCourseName(selectedCourseObj?.name || "");
    };

    const handleBoardSave = async () => {
        const data = {
            boardName: boardName,
            boardDescription: boardDescription,
        };
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/questionBase/board/create`,
                data,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            handleSnackbarOpen("Board created successfully", "success");
            fetchBoards();
        } catch (error) {
            console.error("Error creating Board:", error);
            handleSnackbarOpen("Error occured while creating board", "error");
        }
        setBoardName("");
        setBoardDescription("");
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
            handleSnackbarOpen("Error occured while creating Grade", "error");
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
            handleSnackbarOpen("Error occured while creating Chapter", "error");
        }

        setChapterName("");
        fetchChapters(selectedSubcategory._id);
    };

    const handleConceptSave = async () => {
        if (!selectedChapter) {
            handleSnackbarOpen("Please select a Chapter", "error");
            return;
        }
        const data = { name: conceptName };
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/questionBase/concept/create/${
                    selectedChapter._id
                }`,
                data,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            handleSnackbarOpen("Concept created successfully", "success");
            fetchConcepts(selectedChapter._id);
        } catch (error) {
            console.error("Error creating Concept right:", error);
            handleSnackbarOpen("Error occured while creating Concept", "error");
        }

        setConceptName("");
    };

    const handleCategorySave = async () => {
        const data = { name: categoryName, description: categoryDescription };
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/categories/addCategory`,
                data,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            handleSnackbarOpen("Category created successfully", "success");
            fetchAllCategories();
        } catch (error) {
            console.error("Error creating Category:", error);
            handleSnackbarOpen(
                "Error occured while creating Category",
                "error"
            );
        }

        setCategoryName("");
        setCategoryDescription("");
    };

    const handleSubcategorySave = async () => {
        if (!selectedCategory) {
            handleSnackbarOpen("Please select a Category", "error");
            return;
        }
        const data = {
            name: subcategoryName,
            description: subcategoryDescription,
        };
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/subcategories/${
                    selectedCategory._id
                }/subcategories`,
                data,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            handleSnackbarOpen("Subcategory created successfully", "success");
            fetchSubcategories(selectedCategory._id);
        } catch (error) {
            console.error("Error creating Subcategory:", error);
            handleSnackbarOpen(
                "Error occured while creating Subcategory",
                "error"
            );
        }

        setSubcategoryName("");
        setSubcategoryDescription("");
    };

    const handleAnswerKeyChange = (e) => {
        setSelectedAnswerKey(e.target.value);
    };

    const handleOnChangeConcept = (event, newValue) => {
        setSelectedConcept(newValue); // Update state with selected options
    };
    // ... (keep all existing state and config code) ...

    // Add these functions after the config declaration but before renderAnswerSection

    const fetchCompleteQuestion = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${
                    import.meta.env.VITE_API_URL
                }/questionBase/get/questionDetails/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const responseQuestion = response.data.question;
            
            setQuestion(responseQuestion);
            setQuestionTitle(responseQuestion.questionTitle);
            setSelectedQuestionType(responseQuestion.questionType);
            setQuestionStemContent(responseQuestion.questionStem);
            setExplanation(responseQuestion.explanation);
            setSelectedCourse(responseQuestion.course);
            setSelectedCourseName(responseQuestion.courseName);

            // Handle different question types
            switch (responseQuestion.questionType) {
                case "MCQ":
                    setOption1(responseQuestion.options?.[0]?.option || "");
                    setOption2(responseQuestion.options?.[1]?.option || "");
                    setOption3(responseQuestion.options?.[2]?.option || "");
                    setOption4(responseQuestion.options?.[3]?.option || "");
                    setOptionLD1(responseQuestion.options?.[0]?.optionLD || "");
                    setOptionLD2(responseQuestion.options?.[1]?.optionLD || "");
                    setOptionLD3(responseQuestion.options?.[2]?.optionLD || "");
                    setOptionLD4(responseQuestion.options?.[3]?.optionLD || "");
                    setOptionWeightage1(
                        responseQuestion.options?.[0]?.optionWeightage || ""
                    );
                    setOptionWeightage2(
                        responseQuestion.options?.[1]?.optionWeightage || ""
                    );
                    setOptionWeightage3(
                        responseQuestion.options?.[2]?.optionWeightage || ""
                    );
                    setOptionWeightage4(
                        responseQuestion.options?.[3]?.optionWeightage || ""
                    );
                    setSelectedAnswerKey(
                        responseQuestion.answerKey === "1"
                            ? "A"
                            : responseQuestion.answerKey === "2"
                            ? "B"
                            : responseQuestion.answerKey === "3"
                            ? "C"
                            : "D"
                    );
                    break;

                case "Very Short Answer":
                    setOption1(responseQuestion.answer);
                    if (
                        responseQuestion.answerVariations &&
                        responseQuestion.answerVariations.length > 0
                    ) {
                        setAnswerVariations(responseQuestion.answerVariations);
                    }
                    break;

                case "True or False":
                    setOption1(responseQuestion.answer.toString());
                    break;

                default:
                    setOption1(responseQuestion.answer || "");
                    break;
            }
        } catch (error) {
            console.error("Error fetching Question:", error);
            handleSnackbarOpen("Error fetching question details", "error");
        }
    };

    const fetchSelectedSelectElements = async () => {
        try {
            if (!question) return;

            // Find and set board
            const optedBoard = board.find(
                (board) => board._id.toString() === getEntityId(question.board).toString()
            );
            setSelectedBoard(optedBoard || null);

            // Find and set grade
            const optedGrade = grade.find(
                (grade) => grade._id.toString() === getEntityId(question.grade).toString()
            );
            setSelectedGrade(optedGrade || null);

            // Find and set category
            const optedCategory = categories.find(
                (category) =>
                    category._id.toString() === getEntityId(question.category).toString()
            );
            setSelectedCategory(optedCategory || null);
            if (optedCategory) {
                await fetchSubcategories(optedCategory._id);
            }
        } catch (error) {
            console.error("Error setting selected elements:", error);
            handleSnackbarOpen("Error initializing form selections", "error");
        }
    };

    const fetchSelectedSubCategory = async () => {
        try {
            if (!question || subcategories.length === 0) return;

            const optedSubCategory = subcategories.find(
                (subcategory) =>
                    subcategory._id.toString() ===
                    getEntityId(question.subCategory).toString()
            );
            setSelectedSubcategory(optedSubCategory || null);

            if (optedSubCategory) {
                await fetchChapters(optedSubCategory._id);
                await fetchAllCourses(optedSubCategory._id);

                if (question.course) {
                    // Wait for courses to be populated
                    const optedCourse = courses.find(
                        (course) =>
                            course._id.toString() === getEntityId(question.course).toString()
                    );
                    if (optedCourse) {
                        setSelectedCourse(optedCourse);
                        setSelectedCourseName(optedCourse.name);
                    }
                }
            }
        } catch (error) {
            console.error("Error setting subcategory:", error);
            handleSnackbarOpen("Error initializing subcategory", "error");
        }
    };

    useEffect(() => {
        if (courses.length > 0 && question?.course) {
            const optedCourse = courses.find(
                (course) => course._id.toString() === getEntityId(question.course).toString()
            );
            if (optedCourse) {
                setSelectedCourse(optedCourse);
                setSelectedCourseName(optedCourse.name);
            }
        }
    }, [courses, question]);

    const fetchSelectedChapter = async () => {
        try {
            if (!question || chapters.length === 0) return;

            const optedChapter = chapters.find(
                (chapter) =>
                    chapter._id.toString() === getEntityId(question.chapter).toString()
            );
            setSelectedChapter(optedChapter || null);

            if (optedChapter) {
                await fetchConcepts(optedChapter._id);
            }
        } catch (error) {
            console.error("Error setting chapter:", error);
            handleSnackbarOpen("Error initializing chapter", "error");
        }
    };

    const fetchSelectedConcepts = async () => {
        try {
            if (!question || concepts.length === 0) return;

            const optedConcepts = concepts.filter((concept) =>
                (question.concepts || []).some(
                    (qConcept) => getEntityId(qConcept) === concept._id
                )
            );
            setSelectedConcept(optedConcepts);
        } catch (error) {
            console.error("Error setting concepts:", error);
            handleSnackbarOpen("Error initializing concepts", "error");
        }
    };

    // Add these useEffect hooks after all the function declarations
    useEffect(() => {
        fetchCompleteQuestion();
    }, []);

    useEffect(() => {
        if (question) {
            fetchSelectedSelectElements();
        }
    }, [question, board, grade, categories]);

    useEffect(() => {
        if (subcategories.length > 0) {
            fetchSelectedSubCategory();
        }
    }, [subcategories]);

    useEffect(() => {
        if (chapters.length > 0) {
            fetchSelectedChapter();
        }
    }, [chapters]);

    useEffect(() => {
        if (concepts.length > 0) {
            fetchSelectedConcepts();
        }
    }, [concepts]);

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
                                        tabIndex={1}
                                        onBlur={(newContent) =>
                                            setOption1(newContent)
                                        }
                                    />
                                </div>
                            </Box>
                            <TextField
                                style={{ width: "100%" }}
                                variant="outlined"
                                margin="normal"
                                label="Option LD1"
                                value={optionLD1}
                                onChange={(e) => setOptionLD1(e.target.value)}
                                required
                            />
                            <TextField
                                style={{ width: "100%" }}
                                variant="outlined"
                                margin="normal"
                                label="Option Weightage1"
                                value={optionWeightage1}
                                onChange={(e) =>
                                    setOptionWeightage1(e.target.value)
                                }
                                required
                            />
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
                            <TextField
                                style={{ width: "100%" }}
                                variant="outlined"
                                margin="normal"
                                label="Option LD2"
                                value={optionLD2}
                                onChange={(e) => setOptionLD2(e.target.value)}
                                required
                            />
                            <TextField
                                style={{ width: "100%" }}
                                variant="outlined"
                                margin="normal"
                                label="Option Weightage2"
                                value={optionWeightage2}
                                onChange={(e) =>
                                    setOptionWeightage2(e.target.value)
                                }
                                required
                            />
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
                            <TextField
                                style={{ width: "100%" }}
                                variant="outlined"
                                margin="normal"
                                label="Option LD3"
                                value={optionLD3}
                                onChange={(e) => setOptionLD3(e.target.value)}
                                required
                            />
                            <TextField
                                style={{ width: "100%" }}
                                variant="outlined"
                                margin="normal"
                                label="Option Weightage3"
                                value={optionWeightage3}
                                onChange={(e) =>
                                    setOptionWeightage3(e.target.value)
                                }
                                required
                            />
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
                            <TextField
                                style={{ width: "100%" }}
                                variant="outlined"
                                margin="normal"
                                label="Option LD4"
                                value={optionLD4}
                                onChange={(e) => setOptionLD4(e.target.value)}
                                required
                            />
                            <TextField
                                style={{ width: "100%" }}
                                variant="outlined"
                                margin="normal"
                                label="Option Weightage4"
                                value={optionWeightage4}
                                onChange={(e) =>
                                    setOptionWeightage4(e.target.value)
                                }
                                required
                            />
                        </Box>

                        <Box display="flex" alignItems="center" mb={2}>
                            <FormControl
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                required
                            >
                                <InputLabel id="answerKey-select-label">
                                    Answer Key
                                </InputLabel>
                                <Select
                                    labelId="answerKey-select-label"
                                    value={selectedAnswerKey}
                                    onChange={handleAnswerKeyChange}
                                    label="AnswerKey"
                                >
                                    {answerKey.map((answerKeyEle) => (
                                        <MenuItem
                                            key={answerKeyEle._id}
                                            value={answerKeyEle.answer}
                                        >
                                            {answerKeyEle.answer}
                                        </MenuItem>
                                    ))}
                                </Select>
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
                        {/* Main Answer */}
                        <Box width="100%" mb={2}>
                            <Typography
                                variant="h6"
                                component="h2"
                                gutterBottom
                                textAlign="center"
                            >
                                Main Answer
                            </Typography>
                            <JoditEditor
                                value={option1}
                                config={config}
                                tabIndex={1}
                                onBlur={(newContent) => setOption1(newContent)}
                            />
                        </Box>

                        {/* Answer Variations */}
                        {answerVariations.map((variation, index) => (
                            <Box key={index} width="100%" mb={2}>
                                <Typography
                                    variant="h6"
                                    component="h2"
                                    gutterBottom
                                    textAlign="center"
                                >
                                    Variation {index + 1}
                                </Typography>
                                <JoditEditor
                                    value={variation}
                                    config={config}
                                    tabIndex={1}
                                    onBlur={(newContent) => {
                                        const newVariations = [
                                            ...answerVariations,
                                        ];
                                        newVariations[index] = newContent;
                                        setAnswerVariations(newVariations);
                                    }}
                                />
                            </Box>
                        ))}

                        {/* Add Variation Button */}
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

    const isHTMLContentEmpty = (content) => {
        // Remove HTML tags and whitespace
        const textContent = content.replace(/<[^>]*>/g, "").trim();
        return textContent === "";
    };

    const handleQuestionEdit = async () => {
        if (
            !selectedQuestionType ||
            !questionTitle ||
            !questionStemContent ||
            !explanation
        ) {
            handleSnackbarOpen("Please fill in all required fields", "error");
            return;
        }

        let editedData = {
            questionType: selectedQuestionType,  // Make sure this is included
            questionTitle,
            board: getEntityId(selectedBoard) || getEntityId(question.board) || undefined,
            boardName: selectedBoard?.boardName || question.boardName,
            boardDescription: selectedBoard?.boardDescription || question.boardDescription,
            grade: getEntityId(selectedGrade) || getEntityId(question.grade) || undefined,
            gradeName: selectedGrade?.name || question.gradeName,
            category: getEntityId(selectedCategory) || getEntityId(question.category) || undefined,
            categoryName: selectedCategory?.name || question.categoryName,
            categoryDescription: selectedCategory?.description || question.categoryDescription,
            subCategory: getEntityId(selectedSubcategory) || getEntityId(question.subCategory) || undefined,
            subCategoryName: selectedSubcategory?.name || question.subCategoryName,
            subCategoryDescription: selectedSubcategory?.description || question.subCategoryDescription,
            course: getEntityId(selectedCourse) || getEntityId(question.course) || undefined,
            courseName: selectedCourseName || question.courseName,
            chapter: getEntityId(selectedChapter) || getEntityId(question.chapter) || undefined,
            chapterName: selectedChapter?.name || question.chapterName,
            concepts: (selectedConcept || []).map((concept) => ({ _id: getEntityId(concept) })),
            questionStem: questionStemContent,
            explanation,
        };

        // Add type-specific data
        switch (selectedQuestionType) {
            // In the handleQuestionEdit function, update the MCQ case:
            case "MCQ":
                // Helper function to check if HTML content is empty
                

                if (
                    isHTMLContentEmpty(option1) ||
                    isHTMLContentEmpty(option2) ||
                    isHTMLContentEmpty(option3) ||
                    isHTMLContentEmpty(option4) ||
                    !selectedAnswerKey
                ) {
                    handleSnackbarOpen(
                        "Please fill in all MCQ options and select an answer key",
                        "error"
                    );
                    return;
                }
                editedData.options = [
                    {
                        optionNumber: 1,
                        option: option1,
                        optionWeightage: optionWeightage1 || undefined,
                        optionLD: optionLD1 || undefined,
                        _id: question.options?.[0]?._id,
                    },
                    {
                        optionNumber: 2,
                        option: option2,
                        optionWeightage: optionWeightage2 || undefined,
                        optionLD: optionLD2 || undefined,
                        _id: question.options?.[1]?._id,
                    },
                    {
                        optionNumber: 3,
                        option: option3,
                        optionWeightage: optionWeightage3 || undefined,
                        optionLD: optionLD3 || undefined,
                        _id: question.options?.[2]?._id,
                    },
                    {
                        optionNumber: 4,
                        option: option4,
                        optionWeightage: optionWeightage4 || undefined,
                        optionLD: optionLD4 || undefined,
                        _id: question.options?.[3]?._id,
                    },
                ];
                editedData.answerKey =
                    selectedAnswerKey === "A"
                        ? 1
                        : selectedAnswerKey === "B"
                        ? 2
                        : selectedAnswerKey === "C"
                        ? 3
                        : 4;
                break;

            case "Very Short Answer":
                if (!option1) {
                    handleSnackbarOpen("Please enter the main answer", "error");
                    return;
                }
                editedData.answer = option1;
                editedData.variations = answerVariations;
                break;

            case "True or False":
                if (!option1) {
                    handleSnackbarOpen("Please select true or false", "error");
                    return;
                }
                editedData.answer = option1;
                break;

            default:
                if (isHTMLContentEmpty(option1)) {
                    handleSnackbarOpen("Please enter the answer", "error");
                    return;
                }
                editedData = {
                    ...editedData,
                    answer: option1,
                    __t: selectedQuestionType  // Add discriminator key
                };
                
                break;
        }

        try {
            
            const token = localStorage.getItem("token");
            const response = await axios.put(
                `${
                    import.meta.env.VITE_API_URL
                }/questionBase/edit/questionBase/${id}`,
                editedData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            
            handleSnackbarOpen("Question updated successfully", "success");
            await fetchCompleteQuestion();
        } catch (error) {
            console.error("Error updating question:", error);
            handleSnackbarOpen(
                error.response?.data?.message || "Error updating question",
                "error"
            );
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
                            Edit Question
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
                                <InputLabel id="Board-select-label">
                                    Board
                                </InputLabel>
                                <Select
                                    labelId="Board-select-label"
                                    value={
                                        selectedBoard ? selectedBoard._id : ""
                                    }
                                    onChange={handleBoardChange}
                                    label="Board"
                                >
                                    {board.map((board) => (
                                        <MenuItem
                                            key={board._id}
                                            value={board._id}
                                        >
                                            {board.boardName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button
                                onClick={() =>
                                    setShowBoardFields(!showBoardFields)
                                }
                                style={{ marginLeft: "10px" }}
                            >
                                <AddIcon />
                            </Button>
                        </Box>

                        {showBoardFields && (
                            <>
                                <Box>
                                    <TextField
                                        sx={{ backgroundColor: "whitesmoke" }}
                                        fullWidth
                                        variant="outlined"
                                        margin="normal"
                                        label="Board Name"
                                        value={boardName}
                                        onChange={(e) =>
                                            setBoardName(e.target.value)
                                        }
                                        required
                                    />
                                    <TextField
                                        sx={{ backgroundColor: "whitesmoke" }}
                                        fullWidth
                                        variant="outlined"
                                        margin="normal"
                                        label="Board Description"
                                        value={boardDescription}
                                        onChange={(e) =>
                                            setBoardDescription(e.target.value)
                                        }
                                        multiline
                                        rows={2}
                                        required
                                    />

                                    <Button
                                        onClick={handleBoardSave}
                                        style={{
                                            marginTop: "10px",
                                            backgroundColor: "#4caf50",
                                            color: "#fff",
                                        }}
                                    >
                                        Save Board
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
                                <InputLabel id="category-select-label">
                                    Category
                                </InputLabel>
                                <Select
                                    labelId="category-select-label"
                                    value={selectedCategory}
                                    onChange={handleCategoryChange}
                                    label="Category"
                                >
                                    {categories.map((category) => (
                                        <MenuItem
                                            key={category._id}
                                            value={category}
                                        >
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button
                                onClick={() =>
                                    setShowCategoryFields(!showCategoryFields)
                                }
                                style={{ marginLeft: "10px" }}
                            >
                                <AddIcon />
                            </Button>
                        </Box>

                        {showCategoryFields && (
                            <>
                                <Box>
                                    <TextField
                                        sx={{ backgroundColor: "whitesmoke" }}
                                        fullWidth
                                        variant="outlined"
                                        margin="normal"
                                        label="Category Name"
                                        value={categoryName}
                                        onChange={(e) =>
                                            setCategoryName(e.target.value)
                                        }
                                        required
                                    />
                                    <TextField
                                        sx={{ backgroundColor: "whitesmoke" }}
                                        fullWidth
                                        variant="outlined"
                                        margin="normal"
                                        label="Category Description"
                                        value={categoryDescription}
                                        onChange={(e) =>
                                            setCategoryDescription(
                                                e.target.value
                                            )
                                        }
                                        multiline
                                        rows={2}
                                        required
                                    />
                                    <Button
                                        onClick={handleCategorySave}
                                        style={{
                                            marginTop: "10px",
                                            backgroundColor: "#4caf50",
                                            color: "#fff",
                                        }}
                                    >
                                        Save Category
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
                                <InputLabel id="subcategory-select-label">
                                    Subcategory
                                </InputLabel>
                                <Select
                                    labelId="subcategory-select-label"
                                    value={selectedSubcategory}
                                    onChange={handleSubcategoryChange}
                                    label="Subcategory"
                                >
                                    {subcategories.map((subcategory) => (
                                        <MenuItem
                                            key={subcategory._id}
                                            value={subcategory}
                                        >
                                            {subcategory.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button
                                onClick={() =>
                                    setShowSubcategoryFields(
                                        !showSubcategoryFields
                                    )
                                }
                                style={{ marginLeft: "10px" }}
                            >
                                <AddIcon />
                            </Button>
                        </Box>

                        {showSubcategoryFields && (
                            <>
                                <TextField
                                    sx={{ backgroundColor: "whitesmoke" }}
                                    fullWidth
                                    variant="outlined"
                                    margin="normal"
                                    label="Subcategory Name"
                                    value={subcategoryName}
                                    onChange={(e) =>
                                        setSubcategoryName(e.target.value)
                                    }
                                    required
                                />
                                <TextField
                                    sx={{ backgroundColor: "whitesmoke" }}
                                    fullWidth
                                    variant="outlined"
                                    margin="normal"
                                    label="Subcategory Description"
                                    value={subcategoryDescription}
                                    onChange={(e) =>
                                        setSubcategoryDescription(
                                            e.target.value
                                        )
                                    }
                                    multiline
                                    rows={2}
                                    required
                                />
                                <Button
                                    onClick={handleSubcategorySave}
                                    style={{
                                        marginTop: "10px",
                                        backgroundColor: "#4caf50",
                                        color: "#fff",
                                    }}
                                >
                                    Save Subcategory
                                </Button>
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
                                    value={
                                        selectedCourse ? selectedCourse._id : ""
                                    }
                                    onChange={handleCourseChange}
                                    label="Course"
                                >
                                    {courses.map((course) => (
                                        <MenuItem
                                            key={course._id}
                                            value={course._id}
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
                                    {chapters.map((chapter) => (
                                        <MenuItem
                                            key={chapter._id}
                                            value={chapter}
                                        >
                                            {chapter.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button
                                onClick={() =>
                                    setShowChapterFields(!showChapterFields)
                                }
                                style={{ marginLeft: "10px" }}
                            >
                                <AddIcon />
                            </Button>
                        </Box>

                        {showChapterFields && (
                            <>
                                <Box>
                                    <TextField
                                        sx={{ backgroundColor: "whitesmoke" }}
                                        fullWidth
                                        variant="outlined"
                                        margin="normal"
                                        label="Chapter Name"
                                        value={chapterName}
                                        onChange={(e) =>
                                            setChapterName(e.target.value)
                                        }
                                        required
                                    />

                                    <Button
                                        onClick={handleChapterSave}
                                        style={{
                                            marginTop: "10px",
                                            backgroundColor: "#4caf50",
                                            color: "#fff",
                                        }}
                                    >
                                        Save Chapter
                                    </Button>
                                </Box>
                            </>
                        )}

                        <Stack spacing={3} sx={{ marginBottom: "20px" }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
                                <Autocomplete
                                    sx={{ width: "90%" }}
                                    multiple
                                    id="tags-outlined"
                                    options={concepts || []}
                                    getOptionLabel={(option) => option.name}
                                    filterSelectedOptions
                                    value={selectedConcept}
                                    onChange={handleOnChangeConcept}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Concepts"
                                            placeholder="Concepts"
                                        />
                                    )}
                                />

                                <Button
                                    onClick={() =>
                                        setShowConceptFields(!showConceptFields)
                                    }
                                    style={{ marginLeft: "10px", width: "5%" }}
                                >
                                    <AddIcon />
                                </Button>
                            </Box>
                        </Stack>

                        {showConceptFields && (
                            <>
                                <Box>
                                    <TextField
                                        sx={{ backgroundColor: "whitesmoke" }}
                                        fullWidth
                                        variant="outlined"
                                        margin="normal"
                                        label="Concept Name"
                                        value={conceptName}
                                        onChange={(e) =>
                                            setConceptName(e.target.value)
                                        }
                                        required
                                    />

                                    <Button
                                        onClick={handleConceptSave}
                                        style={{
                                            marginTop: "10px",
                                            backgroundColor: "#4caf50",
                                            color: "#fff",
                                        }}
                                    >
                                        Save Concept
                                    </Button>
                                </Box>
                            </>
                        )}
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
                            tabIndex={1}
                            onBlur={(newContent) =>
                                setQuestionStemContent(newContent)
                            }
                        />
                    </div>
                </Box>

                {renderAnswerSection()}

                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    sx={{ backgroundColor: "lightgray", padding: "10px" }}
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
                            tabIndex={1}
                            onBlur={(newContent) => setExplanation(newContent)}
                        />
                    </div>
                </Box>

                <Button
                    onClick={handleQuestionEdit}
                    style={{
                        marginTop: "10px",
                        backgroundColor: "#4caf50",
                        color: "#fff",
                    }}
                >
                    Edit Question
                </Button>

                <Snackbar
                    autoHideDuration={6000}
                    anchorOrigin={{ vertical: "top", horizontal: "center" }}
                ></Snackbar>
            </Box>
        </Container>
    );
};

export default EditQuestion;
