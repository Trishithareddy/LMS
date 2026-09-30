import AddIcon from "@mui/icons-material/Add";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
    TablePagination,
    Chip,
    Grid,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import Stack from "@mui/material/Stack";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const EditQuiz = () => {
    const location = useLocation();
    const id = location.state.quizId;

    const quizLevels = [
        { _id: 1, name: "Chapter Level" },
        { _id: 2, name: "Lesson Level" },
    ];
    const quizType = [{ _id: 1, name: "MCQ" }];
    const [selectedQuizLevel, setSelectedQuizLevel] = useState("");
    const [selectedQuizType, setSelectedQuizType] = useState("");

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

    const [quizCode, setQuizCode] = useState("");
    const [quizTitle, setQuizTitle] = useState("");

    const [showConceptFields, setShowConceptFields] = useState(false);
    const [concepts, setConcepts] = useState([]);
    const [conceptName, setConceptName] = useState("");
    const [selectedConcept, setSelectedConcept] = useState([]);
    const [conceptsPopulated, setConceptsPopulated] = useState([]);

    const [showChapterFields, setShowChapterFields] = useState(false);
    const [chapters, setChapters] = useState([]);
    const [chapterName, setChapterName] = useState("");
    const [selectedChapter, setSelectedChapter] = useState("");

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    const [questions, setQuestions] = useState([]);
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [page, setPage] = useState(0);
    const [searchTags, setSearchTags] = useState({});
    const [currentField, setCurrentField] = useState("questionId");
    const [currentInput, setCurrentInput] = useState("");
    const [getAllBatches, setGetAllBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState("");
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState("");

    const fetchCompleteQuiz = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${
                    import.meta.env.VITE_API_URL
                }/quizV2Final/editGet/quizDetails/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            
            setQuizCode(response.data.quiz.quizCode);
            setQuizTitle(response.data.quiz.quizTitle);
            setSelectedQuizLevel(response.data.quiz.quizLevel);
            setSelectedQuizType(response.data.quiz.quizType);
            setQuiz(response.data.quiz);
            setSelectedQuestions(response.data.quiz.questionsSelected || []);
            setSelectedConcept(response.data.quiz.concepts);

        } catch (error) {
            console.error("Error fetching Question:", error);
            alert("Error fetching Question");
        }
    };

    useEffect(() => {
        fetchCompleteQuiz();
        fetchAllBatches();
    }, []);

    const fetchAllBatches = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/teacher/get/AllBatches`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            
            const allBatch = response.data.teacher.batches;
            
            setGetAllBatches(allBatch);
        } catch (error) {
            console.error("Error fetching batches:", error);
        }
    };

    const handleBatchChange = (e) => {
        const batchId = e.target.value;
   

        const batch = getAllBatches.find((b) => b._id === batchId);

        if (batch) {
            setSelectedBatch(batch);
  
            setCourses(batch.courses);
        }
    };

    const fetchSelectedSelectElements = async () => {
        const optedCategory = categories.find(
            (category) => category._id.toString() === quiz.category.toString()
        );

        setSelectedCategory(optedCategory || null);
        fetchSubcategories(optedCategory._id);
    };

    useEffect(() => {
        fetchSelectedSelectElements();
    }, [quiz]);

    const fetchSelectedSubCategory = async () => {
        const optedSubCategory = subcategories.find(
            (subcategory) =>
                subcategory._id.toString() === quiz.subCategory.toString()
        );

        setSelectedSubcategory(optedSubCategory);
        // fetchChapters(optedSubCategory._id);
        // fetchAllCourses(optedSubCategory._id);
    };

    useEffect(() => {
        fetchSelectedSubCategory();
    }, [subcategories]);

    // const fetchSelectedChapter = async () => {
    //     const optedChapter = chapters.find(
    //         (chapter) =>
    //             chapter._id.toString() === quiz.chapterLabelled.toString()
    //     );
    //     setSelectedChapter(optedChapter);
    // };

    // useEffect(() => {
    //     fetchSelectedChapter();
    // }, [chapters]);

    const ViewQuestionDetails = (id) => {
        navigate("/admin-dashboard/complete-question", {
            state: {
                questionId: id,
            },
        });
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
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

    const fetchAllFilteredQuestions = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${
                    import.meta.env.VITE_API_URL
                }/questionBase/filter/questionBases`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params: searchTags,
                }
            );
            setQuestions(response.data);
        } catch (error) {
            console.error("Error fetching Questions:", error);
            alert("Error fetching Questions");
        }
    };

    useEffect(() => {
        fetchAllFilteredQuestions();
    }, [searchTags]);

    const fetchConceptsFromQuestions = async (data) => {
        let conceptsFromSelectedQuestions = [];

        for (let ele of data) {
            conceptsFromSelectedQuestions.push(...ele.concepts);
        }
        const uniqueData = conceptsFromSelectedQuestions.filter(
            (item, index, self) =>
                index === self.findIndex((t) => t._id === item._id)
        );

        const filteredUniqueData = uniqueData.filter(
            (item) =>
                !selectedConcept.some(
                    (selectedConcept) => selectedConcept._id === item._id
                )
        );

        let finalConcepts = [...concepts, ...filteredUniqueData];

        const uniqueConceptsData = finalConcepts.filter(
            (item, index, self) =>
                index === self.findIndex((t) => t._id === item._id)
        );

        setConceptsPopulated(uniqueConceptsData);
    };

    const handleCheckboxChange = (question, check) => {
        if (
            selectedQuestions.some(
                (selectedQuestion) => selectedQuestion._id === question._id
            )
        ) {
            setSelectedQuestions(
                selectedQuestions.filter((every) => every._id !== question._id)
            );
            fetchConceptsFromQuestions(
                selectedQuestions.filter((every) => every._id !== question._id)
            );
        } else {
            setSelectedQuestions([...selectedQuestions, question]);
            fetchConceptsFromQuestions([...selectedQuestions, question]);
        }
    };

    const handleQuizLevelChange = (e) => {
        setSelectedQuizLevel(e.target.value);
    };

    const handleQuizTypeChange = (e) => {
        setSelectedQuizType(e.target.value);
    };

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

    // const fetchAllCourses = async (subCategoryId) => {
    //     try {
    //         const token = localStorage.getItem("token");
    //         const response = await axios.get(
    //             `${
    //                 import.meta.env.VITE_API_URL
    //             }/subcategories/courses/${subCategoryId}`,
    //             {
    //                 headers: {
    //                     Authorization: `Bearer ${token}`,
    //                 },
    //             }
    //         );

    //         setCourses(response.data);
    //     } catch (error) {
    //         console.error("Error fetching Courses:", error);
    //         alert("Error fetching Courses");
    //     }
    // };

    // const fetchChapters = async (subCategoryId) => {
    //     try {
    //         const token = localStorage.getItem("token");
    //         const response = await axios.get(
    //             `${
    //                 import.meta.env.VITE_API_URL
    //             }/subcategories/chapters/${subCategoryId}`,
    //             {
    //                 headers: {
    //                     Authorization: `Bearer ${token}`,
    //                 },
    //             }
    //         );

    //         setChapters(response.data);
    //     } catch (error) {
    //         console.error("Error fetching chapters:", error);
    //     }
    // };

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
        fetchSubcategories(e.target.value._id);
    };

    const handleSubcategoryChange = (e) => {
        setSelectedSubcategory(e.target.value);
    };

    const handleChapterChange = (e) => {
        setSelectedChapter(e.target.value);
    };
    const handleCourseChange = (e) => {
        const selectedId = e.target.value;
        setSelectedCourse(selectedId);

        const selected = courses.find((c) => c._id === selectedId._id);

       
        setChapters(selected?.chapters);
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
            setChapters([
                ...chapters,
                { _id: response.data._id, name: response.data.name },
            ]);
        } catch (error) {
            console.error("Error creating Chapter:", error);
            handleSnackbarOpen("Error occured while creating Chapter", "error");
        }

        setChapterName("");

        // fetchChapters(selectedSubcategory._id);
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
            setConcepts([
                ...concepts,
                { _id: response.data._id, name: response.data.name },
            ]);
        } catch (error) {
            console.error("Error creating Concept right:", error);
            handleSnackbarOpen("Error occured while creating Concept", "error");
        }

        setConceptName("");
    };
    useEffect(() => {
        fetchConceptsFromQuestions(selectedQuestions);
    }, [concepts, selectedQuestions]);

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
            // fetchAllCategories();
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

    const handleOnChangeConcept = (event, newValue) => {
        
        setSelectedConcept(newValue); // Update state with selected options
    };

    const fetchAllQuestions = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/questionBase/get/allQuestions`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setQuestions(response.data.questions);
        } catch (error) {
            console.error("Error fetching Questions:", error);
            alert("Error fetching Questions");
        }
    };

    useEffect(() => {
        fetchAllQuestions();
    }, []);

    const handleUpdateQuiz = async () => {
        if (
            !quizCode ||
            !quizTitle ||
            !selectedCategory ||
            !selectedSubcategory ||
            !selectedChapter ||
            !selectedConcept ||
            !selectedQuizLevel ||
            !selectedQuestions
        ) {
            handleSnackbarOpen("All fields are required", "error");
            return;
        }
        let conceptsSelected = selectedConcept.map((every) => ({
            _id: every._id,
        }));
        let questionsSelected = selectedQuestions.map((every) => ({
            _id: every._id,
        }));
        let quizData = {
            quizCode: quizCode,
            quizTitle: quizTitle,
            quizType: selectedQuizType,
            category: selectedCategory._id,
            categoryName: selectedCategory.name,
            categoryDescription: selectedCategory.description,
            subCategory: selectedSubcategory._id,
            subCategoryName: selectedSubcategory.name,
            subcategoryDescription: selectedSubcategory.description,
            chapterLabelled: selectedChapter._id,
            chapterLabelledName: selectedChapter.name,
            concepts: conceptsSelected,
            lessonTopic: null,
            quizLevel: selectedQuizLevel,
            questionsSelected: questionsSelected,
        };
        try {
            const token = localStorage.getItem("token");
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/quizV2Final/update/quiz/${id}`,
                quizData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            handleSnackbarOpen("Quiz updated successfully", "success");
            setTimeout(() => {
                navigate("/teacher-dashboard/quiz-tabs");
            }, 500);
        } catch (error) {
            console.error("Error editing Quiz:", error);
            handleSnackbarOpen("Error occured while editing Quiz", "error");
            return;
        }
        setQuizCode("");
        setQuizTitle("");
        setSelectedQuizType("");
        setSelectedCategory("");
        setSelectedSubcategory("");
        setSelectedCourse("");
        setSelectedChapter("");
        setSelectedConcept([]);
        setSelectedQuizLevel("");
        setSelectedQuestions([]);
    };

    return (
        <>
            <Container>
                <Container maxWidth="md">
                    <Card variant="outlined">
                        <Snackbar
                            open={openSnackbar}
                            autoHideDuration={6000}
                            onClose={handleSnackbarClose}
                            anchorOrigin={{
                                vertical: "top",
                                horizontal: "center",
                            }}
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
                                Edit Quiz
                            </Typography>
                            <Box display="flex" alignItems="center" mb={2}>
                                <FormControl
                                    fullWidth
                                    variant="outlined"
                                    margin="normal"
                                    required
                                >
                                    <InputLabel id="quizLevel-select-label">
                                        Quiz Level
                                    </InputLabel>
                                    <Select
                                        labelId="quizLevel-select-label"
                                        value={selectedQuizLevel}
                                        onChange={handleQuizLevelChange}
                                        label="QuizLevel"
                                    >
                                        {quizLevels.map((quizLevel) => (
                                            <MenuItem
                                                key={quizLevel._id}
                                                value={quizLevel.name}
                                            >
                                                {quizLevel.name}
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
                                    <InputLabel id="quizType-select-label">
                                        Quiz Type
                                    </InputLabel>
                                    <Select
                                        labelId="quizType-select-label"
                                        value={selectedQuizType}
                                        onChange={handleQuizTypeChange}
                                        label="QuizType"
                                    >
                                        {quizType.map((quizType) => (
                                            <MenuItem
                                                key={quizType._id}
                                                value={quizType.name}
                                            >
                                                {quizType.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                            <TextField
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                label="Quiz Code"
                                value={quizCode}
                                onChange={(e) => setQuizCode(e.target.value)}
                                required
                            />
                            <TextField
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                label="Quiz Title"
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                                required
                            />

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
                                        setShowCategoryFields(
                                            !showCategoryFields
                                        )
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
                                            sx={{
                                                backgroundColor: "whitesmoke",
                                            }}
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
                                            sx={{
                                                backgroundColor: "whitesmoke",
                                            }}
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
                                    <InputLabel id="Batches-select-label">
                                        Batches
                                    </InputLabel>
                                    <Select
                                        labelId="Batches-select-label"
                                        value={selectedBatch?._id || ""} // or "" to avoid uncontrolled warning
                                        onChange={handleBatchChange}
                                        label="Batches"
                                    >
                                        {getAllBatches.map((btc) => (
                                            <MenuItem
                                                key={btc._id}
                                                value={btc._id}
                                            >
                                                {btc.batchName}
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
                                    <InputLabel id="course-select-label">
                                        Courses
                                    </InputLabel>
                                    <Select
                                        labelId="course-select-label"
                                        value={selectedCourse}
                                        onChange={handleCourseChange}
                                        label="Course"
                                    >
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
                                            sx={{
                                                backgroundColor: "whitesmoke",
                                            }}
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

                            <Stack
                                spacing={3}
                                sx={{ marginBottom: "20px", marginTop: "20px" }}
                            >
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
                                        options={conceptsPopulated || []}
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
                                            setShowConceptFields(
                                                !showConceptFields
                                            )
                                        }
                                        style={{
                                            marginLeft: "10px",
                                            width: "5%",
                                        }}
                                    >
                                        <AddIcon />
                                    </Button>
                                </Box>
                            </Stack>

                            {showConceptFields && (
                                <>
                                    <Box>
                                        <TextField
                                            sx={{
                                                backgroundColor: "whitesmoke",
                                            }}
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
            </Container>
            <Typography
                variant="h4"
                gutterBottom
                align="center"
                sx={{ marginTop: "10px" }}
            >
                Filter Questions
            </Typography>

            <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
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
                            <MenuItem value="questionId">Question Id</MenuItem>
                            <MenuItem value="questionType">
                                Question Type
                            </MenuItem>
                            <MenuItem value="questionTitle">
                                Question Title
                            </MenuItem>
                            <MenuItem value="categoryName">
                                Category Name
                            </MenuItem>
                            <MenuItem value="subCategoryName">
                                Subcategory Name
                            </MenuItem>
                            <MenuItem value="chapterName">
                                Chapter Name
                            </MenuItem>
                            <MenuItem value="concept">Concept Name</MenuItem>
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
            <TableContainer component={Paper}>
                <Table aria-label="simple table">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "green" }}>
                            <TableCell sx={{ color: "white" }} align="center">
                                Select Question
                            </TableCell>
                            <TableCell sx={{ color: "white" }} align="center">
                                Question ID
                            </TableCell>
                            <TableCell sx={{ color: "white" }} align="center">
                                Question Type
                            </TableCell>
                            <TableCell sx={{ color: "white" }} align="center">
                                Question Title
                            </TableCell>

                            <TableCell sx={{ color: "white" }} align="center">
                                Category Name
                            </TableCell>
                            <TableCell sx={{ color: "white" }} align="center">
                                SubCategory Name
                            </TableCell>
                            <TableCell sx={{ color: "white" }} align="center">
                                Chapter Name
                            </TableCell>
                            <TableCell sx={{ color: "white" }} align="center">
                                Concepts name
                            </TableCell>
                            <TableCell sx={{ color: "white" }} align="center">
                                Question Stem
                            </TableCell>
                            <TableCell sx={{ color: "white" }} align="center">
                                Actions
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {questions
                            .slice(
                                page * rowsPerPage,
                                page * rowsPerPage + rowsPerPage
                            )
                            .map((question) => (
                                <TableRow key={question.questionId}>
                                    <TableCell align="center">
                                        <Checkbox
                                            checked={
                                                Array.isArray(
                                                    selectedQuestions
                                                ) &&
                                                selectedQuestions.some(
                                                    (selectedQuestion) =>
                                                        selectedQuestion._id ===
                                                        question._id
                                                )
                                            }
                                            onChange={(event) =>
                                                handleCheckboxChange(
                                                    question,
                                                    event.target.checked
                                                )
                                            }
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        {question.questionId}
                                    </TableCell>
                                    <TableCell component="th" scope="row">
                                        {question.questionType}
                                    </TableCell>

                                    <TableCell align="center">
                                        {question.questionTitle}
                                    </TableCell>

                                    <TableCell align="center">
                                        {question.categoryName}
                                    </TableCell>
                                    <TableCell align="center">
                                        {question.subCategoryName}
                                    </TableCell>
                                    <TableCell align="center">
                                        {question.chapterName}
                                    </TableCell>
                                    <TableCell align="center">
                                        {question.concepts.length > 0 &&
                                            question.concepts.map((every) => (
                                                <li>{every.name}</li>
                                            ))}
                                    </TableCell>
                                    <TableCell align="center">
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: question.questionStem,
                                            }}
                                        />
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
                                                onClick={() =>
                                                    ViewQuestionDetails(
                                                        question._id
                                                    )
                                                }
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
            <Box sx={{ display: "flex", justifyContent: "center" }}>
                <TablePagination
                    rowsPerPageOptions={[10, 20, 30, 40]}
                    component="div"
                    count={questions.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Box>

            <Typography variant="h4" gutterBottom align="center">
                Selected Questions
            </Typography>
            <TableContainer component={Paper}>
                <Table aria-label="simple table">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "green" }}>
                            <TableCell sx={{ color: "white" }} align="center">
                                Question ID
                            </TableCell>
                            <TableCell sx={{ color: "white" }} align="center">
                                Question Type
                            </TableCell>
                            <TableCell sx={{ color: "white" }} align="center">
                                Question Title
                            </TableCell>

                            <TableCell sx={{ color: "white" }} align="center">
                                Category Name
                            </TableCell>
                            <TableCell sx={{ color: "white" }} align="center">
                                SubCategory Name
                            </TableCell>
                            <TableCell sx={{ color: "white" }} align="center">
                                Chapter Name
                            </TableCell>
                            <TableCell sx={{ color: "white" }} align="center">
                                Concepts name
                            </TableCell>
                            <TableCell sx={{ color: "white" }} align="center">
                                Question Stem
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Array.isArray(selectedQuestions) &&
                            selectedQuestions?.map((question) => (
                                <TableRow key={question.questionId}>
                                    <TableCell align="center">
                                        {question.questionId}
                                    </TableCell>
                                    <TableCell component="th" scope="row">
                                        {question.questionType}
                                    </TableCell>

                                    <TableCell align="center">
                                        {question.questionTitle}
                                    </TableCell>

                                    <TableCell align="center">
                                        {question.categoryName}
                                    </TableCell>
                                    <TableCell align="center">
                                        {question.subCategoryName}
                                    </TableCell>
                                    <TableCell align="center">
                                        {question.chapterName}
                                    </TableCell>
                                    <TableCell align="center">
                                        {question.concepts.length > 0 &&
                                            question.concepts.map((every) => (
                                                <li>{every.name}</li>
                                            ))}
                                    </TableCell>
                                    <TableCell align="center">
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: question.questionStem,
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box sx={{ textAlign: "center" }}>
                <Button
                    onClick={handleUpdateQuiz}
                    style={{
                        marginTop: "10px",
                        backgroundColor: "#4caf50",
                        color: "#fff",
                    }}
                >
                    Edit Quiz
                </Button>
            </Box>
        </>
    );
};

export default EditQuiz;
