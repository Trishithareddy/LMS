import AddIcon from "@mui/icons-material/Add";
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Divider,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    List,
    ListItem,
    ListItemText,
    MenuItem,
    Modal,
    Paper,
    Radio,
    Select,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import axios from "axios";
import JoditEditor from "jodit-react";
import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import "swiper/css";
import "swiper/css/navigation";
import LessonSlides from "./LessonSlides";
import { BreadcrumbContext } from "../../../BreadcrumbContext";

const Lesson = () => {
    const slidesTypeArray = [
        { id: 1, name: "Reading" },
        { id: 2, name: "Quiz" },
    ];
    const quizType = [{ _id: 1, name: "MCQ" }];

    const location = useLocation();
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [slides, setSlides] = useState([]);
    const [content, setContent] = useState("");
    const [speakerNotes, setSpeakerNotes] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isInserting, setIsInserting] = useState(false);
    const [editIndex, setEditIndex] = useState(0);
    const [showStudentView, setShowStudentView] = useState(false);
    const [message, setMessage] = useState("");
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [alertType, setAlertType] = useState("success");
    const formRef = useRef(null);
    const editor = useRef(null);
    const [enableKeyboardFullScreen, setEnableKeyboardFullScreen] =
        useState(false);
    const [lesson, setLesson] = useState("");
    const [chapterDetails, setChapterDetails] = useState(null);

    const [selectedSlideType, setSelectedSlideType] = useState("");
    const [questions, setQuestions] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [page, setPage] = useState(0);
    const [searchTags, setSearchTags] = useState({});
    const [currentField, setCurrentField] = useState("questionId");
    const [currentInput, setCurrentInput] = useState("");
    const [hasActiveFilters, setHasActiveFilters] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [completeQuestion, setCompleteQuestion] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [lessonTopic, setLessonTopic] = useState("");
    const [showConceptFields, setShowConceptFields] = useState(false);
    const [concepts, setConcepts] = useState([]);
    const [conceptName, setConceptName] = useState("");
    const [selectedConcept, setSelectedConcept] = useState([]);
    const [selectedQuizType, setSelectedQuizType] = useState("");
    const [noOfSlidesQuestionsFetch, setNoOfSlidesQuestionsFetch] = useState(0);
    const [quizDataOfSlide, setQuizDataOfSlide] = useState(null);

    // 1. Add state for expectedTime
    const [expectedTime, setExpectedTime] = useState("");

    const quizLevel = "Lesson Level";

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Admin Dashboard", path: "/admin-dashboard" },
            { name: "Update Courses", path: "/admin-dashboard/update-courses" },
            {
                name: "Edit Course",
                path: "/admin-dashboard/edit-course",
                state: { courseData: location.state?.courseData },
            },
            {
                name: "Create Chapter",
                path: "/admin-dashboard/create-chapter",
                state: {
                    chapterId: location.state?.chapterId,
                    courseData: location.state?.courseData,
                    courseId: location.state?.courseId,
                    courseName: location.state?.courseName,
                    from1: location.state?.from,
                },
            },
            { name: "Lesson Slides", path: "/admin-dashboard/lesson-slides" },
        ]);
    }, [location]);

    const handleClose = () => setIsModalOpen(false);

    const handleQuizTypeChange = (e) => {
        setSelectedQuizType(e.target.value);
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

    useEffect(() => {
        if (chapterDetails && chapterDetails._id) {
            fetchConcepts(chapterDetails._id);
        }
    }, [chapterDetails]);

    const handleConceptSave = async () => {
        if (!chapterDetails) {
            handleSnackbarOpen("Please select a Chapter", "error");
            return;
        }
        const data = { name: conceptName };
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/questionBase/concept/create/${
                    chapterDetails._id
                }`,
                data,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            
            fetchConcepts(chapterDetails._id);
        } catch (error) {
            console.error("Error creating Concept right:", error);
        }

        setConceptName("");
    };

    const handleOnChangeConcept = (event, newValue) => {
        setSelectedConcept(newValue);
    };

    const fetchCompleteQuestion = async (id) => {
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

            // Format dates
            const dateConvertion = {
                timeZone: "Asia/Kolkata",
                hour12: false,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            };

            const createdDate = new Date(response.data.question.createdAt);
            const updatedDate = new Date(response.data.question.updatedAt);

            response.data.question.createdAt = createdDate.toLocaleString(
                "en-IN",
                dateConvertion
            );
            response.data.question.updatedAt = updatedDate.toLocaleString(
                "en-IN",
                dateConvertion
            );

            setCompleteQuestion(response.data.question);
        } catch (error) {
            console.error("Error fetching Question:", error);
            alert("Error fetching Question");
        }
    };

    const renderAnswer = () => {
        if (!completeQuestion) return null;

        switch (completeQuestion.questionType) {
            case "MCQ":
                return (
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" color="textSecondary">
                            <strong>Options:</strong>
                        </Typography>
                        <List dense>
                            {completeQuestion.options.map((option, index) => (
                                <ListItem key={index}>
                                    <ListItemText
                                        primary={
                                            <Box>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                        backgroundColor:
                                                            completeQuestion.answerKey ===
                                                            (
                                                                index + 1
                                                            ).toString()
                                                                ? "#e3f2fd"
                                                                : "transparent",
                                                        padding: "8px",
                                                        borderRadius: "4px",
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body1"
                                                        style={{
                                                            marginRight: "10px",
                                                        }}
                                                    >
                                                        {String.fromCharCode(
                                                            65 + index
                                                        )}
                                                        )
                                                    </Typography>
                                                    <span
                                                        dangerouslySetInnerHTML={{
                                                            __html: option.option,
                                                        }}
                                                    />
                                                </div>
                                                <Typography
                                                    variant="body2"
                                                    color="textSecondary"
                                                    style={{ marginTop: "4px" }}
                                                >
                                                    Learning Descriptor:{" "}
                                                    {option.optionLD}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    color="textSecondary"
                                                >
                                                    Weightage:{" "}
                                                    {option.optionWeightage}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                        <Typography
                            variant="subtitle1"
                            color="primary"
                            style={{ marginTop: "16px" }}
                        >
                            <strong>Correct Answer: </strong>
                            {String.fromCharCode(
                                64 + parseInt(completeQuestion.answerKey)
                            )}
                        </Typography>
                    </Grid>
                );

            case "Short Answer":
            case "Long Answer":
            case "Fill In the Blanks":
                return (
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" color="textSecondary">
                            <strong>Answer:</strong>
                        </Typography>
                        <Box
                            sx={{
                                mt: 1,
                                p: 2,
                                bgcolor: "#f5f5f5",
                                borderRadius: 1,
                            }}
                        >
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: completeQuestion.answer,
                                }}
                            />
                        </Box>
                    </Grid>
                );

            case "Very Short Answer":
                return (
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" color="textSecondary">
                            <strong>Main Answer:</strong>
                        </Typography>
                        <Box
                            sx={{
                                mt: 1,
                                p: 2,
                                bgcolor: "#f5f5f5",
                                borderRadius: 1,
                            }}
                        >
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: completeQuestion.answer,
                                }}
                            />
                        </Box>

                        {completeQuestion.variations &&
                            completeQuestion.variations.length > 0 && (
                                <>
                                    <Typography
                                        variant="subtitle1"
                                        color="textSecondary"
                                        sx={{ mt: 2 }}
                                    >
                                        <strong>Alternative Answers:</strong>
                                    </Typography>
                                    <List dense>
                                        {completeQuestion.variations.map(
                                            (variation, index) => (
                                                <ListItem key={index}>
                                                    <Box
                                                        sx={{
                                                            p: 2,
                                                            bgcolor: "#f5f5f5",
                                                            borderRadius: 1,
                                                            width: "100%",
                                                        }}
                                                    >
                                                        <div
                                                            dangerouslySetInnerHTML={{
                                                                __html: variation,
                                                            }}
                                                        />
                                                    </Box>
                                                </ListItem>
                                            )
                                        )}
                                    </List>
                                </>
                            )}
                    </Grid>
                );

            case "True or False":
                return (
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" color="textSecondary">
                            <strong>Answer:</strong>
                        </Typography>
                        <Box
                            sx={{
                                mt: 1,
                                p: 2,
                                bgcolor: completeQuestion.answer
                                    ? "#e8f5e9"
                                    : "#ffebee",
                                borderRadius: 1,
                                fontWeight: "bold",
                            }}
                        >
                            {completeQuestion.answer ? "True" : "False"}
                        </Box>
                    </Grid>
                );

            default:
                return null;
        }
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

    const checkForActiveFilters = (tags) => {
        return Object.values(tags).some(
            (value) =>
                value !== undefined &&
                value !== null &&
                value !== "" &&
                (!Array.isArray(value) || value.length > 0)
        );
    };

    const fetchAllFilteredQuestions = async () => {
        try {
            setIsLoading(true);
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
            console.error("Error fetching filtered Questions:", error);
            alert("Error fetching filtered Questions");
        } finally {
            setIsLoading(false);
        }
    };

    const ViewQuestionDetails = () => {
        setIsModalOpen(true);
    };

    const fetchAllQuestions = async () => {
        try {
            setIsLoading(true);
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
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const hasFilters = checkForActiveFilters(searchTags);
        setHasActiveFilters(hasFilters);

        if (hasFilters) {
            fetchAllFilteredQuestions();
        } else {
            fetchAllQuestions();
        }
    }, [searchTags]);

    const handleRadioChange = (question) => {
        setSelectedQuestion(question);
        fetchCompleteQuestion(question._id);
    };

    useEffect(() => {
        const fetchLessonDetails = async () => {
            if (location.state) {
                try {
                    const token = localStorage.getItem("token");
                    const response = await axios.get(
                        `${import.meta.env.VITE_API_URL}/chapters/${
                            location.state.lesson.chapterId
                        }`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );
                    
                    setChapterDetails(response.data);
                } catch (error) {
                    console.error("Error fetching lesson details:", error);
                }

                setLesson(location.state.lesson);
            }
        };

        fetchLessonDetails();
    }, [location]);

    useEffect(() => {
        

        const getQuizDetails = async () => {
            if (slides.length !== 0) {
                // Iterate over the slides array and modify the quiz slides with the quiz details
                await Promise.all(
                    slides.map(async (slide) => {
                        if (slide.slideType === "Quiz") {
                            try {
                                const token = localStorage.getItem("token");
                                const response = await axios.get(
                                    `${
                                        import.meta.env.VITE_API_URL
                                    }/questionBase/get/questionDetails/${
                                        slide.selectedQuestion
                                    }`,
                                    {
                                        headers: {
                                            Authorization: `Bearer ${token}`,
                                        },
                                    }
                                );

                                // Format dates
                                const dateConvertion = {
                                    timeZone: "Asia/Kolkata",
                                    hour12: false,
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                };

                                const createdDate = new Date(
                                    response.data.question.createdAt
                                );
                                const updatedDate = new Date(
                                    response.data.question.updatedAt
                                );

                                response.data.question.createdAt =
                                    createdDate.toLocaleString(
                                        "en-IN",
                                        dateConvertion
                                    );
                                response.data.question.updatedAt =
                                    updatedDate.toLocaleString(
                                        "en-IN",
                                        dateConvertion
                                    );

                                // Modify the original slide object by adding quizDetails
                                slide.selectedQuestion = response.data.question;
                            } catch (error) {
                                console.error(
                                    `Failed to fetch quiz details for quizId ${slide.quiz}:`,
                                    error
                                );
                            }
                        }
                    })
                );

                setSlides(slides);
                setNoOfSlidesQuestionsFetch(1);
                //   return slides;
            }
        };

        if (noOfSlidesQuestionsFetch === 0) {
            getQuizDetails();
        }
    }, [slides]);

    useEffect(() => {
        const fetchLessonDetails = async () => {
            if (lesson) {
                try {
                    
                    const token = localStorage.getItem("token");

                    const response = await axios.get(
                        `${import.meta.env.VITE_API_URL}/lessons/${lesson._id}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );
      

                    const existingSlides = response.data.slides;
        
                    setSlides(existingSlides);
                } catch (error) {
                    console.error("Error fetching lesson details:", error);
                    setMessage(
                        "Error fetching lesson details. Please try again."
                    );
                    setAlertType("error");
                    setOpenSnackbar(true);
                }
            }
        };

        fetchLessonDetails();
    }, [lesson]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setEnableKeyboardFullScreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange
            );
        };
    }, []);
    const token = localStorage.getItem("token");
    const config = useMemo(
        () => ({
            theme: "light",
            height: "350px",
            width: "100%",
            uploader: {
                insertImageAsBase64URI: false,
                url: `${import.meta.env.VITE_API_URL}/lessons/upload-image`,
                format: "json",
                headers: { Authorization: `Bearer ${token}` },
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

    const handleSlideTypeChange = (e) => {
        setSelectedSlideType(e.target.value);
    };

    const validateContent = () => {
        if (selectedSlideType === "") {
            setMessage("Select slide type");
            setAlertType("error");
            setOpenSnackbar(true);
            return false;
        }

        if (selectedSlideType === "Reading") {
            if (!content.trim()) {
                setMessage("Content cannot be empty!");
                setAlertType("error");
                setOpenSnackbar(true);
                return false;
            }
        }
        if (selectedSlideType === "Quiz") {
            if (selectedQuestion === null) {
                setMessage(`Please select question level  ${quizLevel}`);
                setAlertType("error");
                setOpenSnackbar(true);
                return false;
            }
        }

        return true;
    };

    const handleAddSlide = () => {
        let addedSlide = null;

        for (let ele of slides) {
            if (ele._id === undefined) {
                addedSlide = ele;
            }
        }

        if (addedSlide !== null) {
            setMessage(
                "Save slides before adding new slide, because you added one slide and not yet saved slides."
            );
            setAlertType("error");
            setOpenSnackbar(true);
            return;
        }
        if (validateContent()) {
            if (selectedSlideType === "Reading") {
                setSlides([
                    ...slides,
                    { content, speakerNotes, slideType: selectedSlideType, expectedTime: parseInt(expectedTime) || 0},
                ]);
                resetForm();
                setMessage("Slide added successfully!");
                setAlertType("success");
                setOpenSnackbar(true);
            } else {
                if (selectedQuestion === null || selectedQuizType === "") {
                    setMessage("Please enter all fields");
                    setAlertType("error");
                    setOpenSnackbar(true);
                    return;
                }
                let quizData = {};

                if (selectedSlideType === "Quiz") {
                    quizData["category"] =
                        chapterDetails.course.subCategory.category;
                    quizData["categoryName"] =
                        chapterDetails.course.subCategory.categoryName;
                    quizData["categoryDescription"] =
                        chapterDetails.course.subCategory.categoryDescription;
                    quizData["subCategory"] =
                        chapterDetails.course.subCategory._id;
                    quizData["subCategoryName"] =
                        chapterDetails.course.subCategoryName;
                    quizData["subCategoryDescription"] =
                        chapterDetails.course.subCategoryDescription;
                    let conceptsSelected = selectedConcept.map((every) => ({
                        _id: every._id,
                    }));
                    quizData["concepts"] = conceptsSelected;
                    quizData["quizType"] = selectedQuizType;
                    quizData["quizLevel"] = quizLevel;

                    let questionSelected = [{ _id: selectedQuestion._id }];
                    quizData["questionsSelected"] = questionSelected;
                    quizData["lessonTopic"] = lessonTopic;
                    (quizData["chapterLabelled"] = chapterDetails._id),
                        (quizData["chapterLabelledName"] = chapterDetails.name);
                    quizData["quizCode"] = `QuizCode-${Math.floor(
                        Math.random() * 1000
                    )}`;
                    quizData["quizTitle"] = `QuizTitle-${Math.floor(
                        Math.random() * 1000
                    )}`;
                }
                setQuizDataOfSlide(quizData);
                setSlides([
                    ...slides,
                    {
                        speakerNotes,
                        slideType: selectedSlideType,
                        selectedQuestion: completeQuestion,
                    },
                ]);
                setSelectedQuestion(null);
                setSelectedConcept([]);
                setSelectedQuizType("");
                setLessonTopic("");
                setSpeakerNotes("");
                setMessage("Slide added successfully!");
                setAlertType("success");
                setOpenSnackbar(true);
            }
        }
    };

    const handleEditSlide = () => {
        if (editIndex >= 0 && editIndex < slides.length) {
            setIsEditing(true);
            setIsInserting(false);
            setContent(slides[editIndex].content);
            setSpeakerNotes(slides[editIndex].speakerNotes || "");
            setExpectedTime(slides[editIndex].expectedTime?.toString() || "");
            formRef.current.scrollIntoView({ behavior: "smooth" });
        } else {
            setMessage("Invalid slide selected for editing.");
            setAlertType("error");
            setOpenSnackbar(true);
        }
    };

    const handleUpdateSlide = () => {
        if (validateContent()) {
            const updatedSlides = [...slides];
            updatedSlides[editIndex] = { content, speakerNotes, expectedTime: parseInt(expectedTime) || 0 };
            setSlides(updatedSlides);
            resetForm();
            setMessage("Slide updated successfully!");
            setAlertType("success");
            setOpenSnackbar(true);
        }
    };

    const handleDeleteSlide = () => {
        if (editIndex >= 0 && editIndex < slides.length) {
            const updatedSlides = slides.filter((_, i) => i !== editIndex);
            setSlides(updatedSlides);
            setMessage("Slide deleted successfully!");
            setAlertType("success");
            setOpenSnackbar(true);
            if (editIndex >= updatedSlides.length) {
                setEditIndex(Math.max(0, updatedSlides.length - 1));
            }
        } else {
            setMessage("Invalid slide selected for deletion.");
            setAlertType("error");
            setOpenSnackbar(true);
        }
    };

    const handleInsert = () => {
        setIsInserting(true);
        setIsEditing(false);
        setContent("");
        setSpeakerNotes("");
        setSelectedQuestion(null);
        formRef.current.scrollIntoView({ behavior: "smooth" });
    };

    const handleInsertSlideBefore = () => {
        let addedSlide = null;

        for (let ele of slides) {
            if (ele._id === undefined) {
                addedSlide = ele;
            }
        }

        if (addedSlide !== null) {
            setMessage(
                "Save slides before adding new slide, because you added one slide and not yet saved slides."
            );
            setAlertType("error");
            setOpenSnackbar(true);
            return;
        }
        if (validateContent()) {
            if (selectedSlideType === "Reading") {
                const newSlides = [...slides];
                const insertIndex = editIndex >= 0 ? editIndex : 0;
                newSlides.splice(insertIndex, 0, {
                    content,
                    speakerNotes,
                    slideType: selectedSlideType,
                    expectedTime: parseInt(expectedTime) || 0
                });
                setSlides(newSlides);
                resetForm();
                setEditIndex(insertIndex);
                setMessage("Slide added successfully!");
                setAlertType("success");
                setOpenSnackbar(true);
            } else {
                if (selectedQuestion === null || selectedQuizType === "") {
                    setMessage("Please enter all fields");
                    setAlertType("error");
                    setOpenSnackbar(true);
                    return;
                }
                let quizData = {};

                if (selectedSlideType === "Quiz") {
                    quizData["category"] =
                        chapterDetails.course.subCategory.category;
                    quizData["categoryName"] =
                        chapterDetails.course.subCategory.categoryName;
                    quizData["categoryDescription"] =
                        chapterDetails.course.subCategory.categoryDescription;
                    quizData["subCategory"] =
                        chapterDetails.course.subCategory._id;
                    quizData["subCategoryName"] =
                        chapterDetails.course.subCategoryName;
                    quizData["subCategoryDescription"] =
                        chapterDetails.course.subCategoryDescription;
                    let conceptsSelected = selectedConcept.map((every) => ({
                        _id: every._id,
                    }));
                    quizData["concepts"] = conceptsSelected;
                    quizData["quizType"] = selectedQuizType;
                    quizData["quizLevel"] = quizLevel;

                    let questionSelected = [{ _id: selectedQuestion._id }];
                    quizData["questionsSelected"] = questionSelected;
                    quizData["lessonTopic"] = lessonTopic;
                    (quizData["chapterLabelled"] = chapterDetails._id),
                        (quizData["chapterLabelledName"] = chapterDetails.name);
                    quizData["quizCode"] = `QuizCode-${Math.floor(
                        Math.random() * 1000
                    )}`;
                    quizData["quizTitle"] = `QuizTitle-${Math.floor(
                        Math.random() * 1000
                    )}`;
                }
                setQuizDataOfSlide(quizData);

                const newSlides = [...slides];
                const insertIndex = editIndex >= 0 ? editIndex : 0;
                newSlides.splice(insertIndex, 0, {
                    speakerNotes,
                    slideType: selectedSlideType,
                    selectedQuestion: completeQuestion,
                });
                setSlides(newSlides);
                setSelectedQuestion(null);
                setSelectedConcept([]);
                setSelectedQuizType("");
                setLessonTopic("");
                setSpeakerNotes("");
                resetForm();
                setEditIndex(insertIndex);
                setMessage("Slide added successfully!");
                setAlertType("success");
                setOpenSnackbar(true);
            }
        }
    };

    const handleInsertSlideAfter = () => {
        let addedSlide = null;

        for (let ele of slides) {
            if (ele._id === undefined) {
                addedSlide = ele;
            }
        }

        if (addedSlide !== null) {
            setMessage(
                "Save slides before adding new slide, because you added one slide and not yet saved slides."
            );
            setAlertType("error");
            setOpenSnackbar(true);
            return;
        }

        if (validateContent()) {
            if (selectedSlideType === "Reading") {
                const newSlides = [...slides];
                const insertIndex =
                    editIndex >= 0 ? editIndex + 1 : newSlides.length;
                newSlides.splice(insertIndex, 0, {
                    content,
                    speakerNotes,
                    slideType: selectedSlideType,
                    expectedTime: parseInt(expectedTime) || 0
                });
                setSlides(newSlides);
                resetForm();
                setEditIndex(insertIndex);
                setMessage("Slide added successfully!");
                setAlertType("success");
                setOpenSnackbar(true);
            } else {
                if (selectedQuestion === null || selectedQuizType === "") {
                    setMessage("Please enter all fields");
                    setAlertType("error");
                    setOpenSnackbar(true);
                    return;
                }
                let quizData = {};

                if (selectedSlideType === "Quiz") {
                    quizData["category"] =
                        chapterDetails.course.subCategory.category;
                    quizData["categoryName"] =
                        chapterDetails.course.subCategory.categoryName;
                    quizData["categoryDescription"] =
                        chapterDetails.course.subCategory.categoryDescription;
                    quizData["subCategory"] =
                        chapterDetails.course.subCategory._id;
                    quizData["subCategoryName"] =
                        chapterDetails.course.subCategoryName;
                    quizData["subCategoryDescription"] =
                        chapterDetails.course.subCategoryDescription;
                    let conceptsSelected = selectedConcept.map((every) => ({
                        _id: every._id,
                    }));
                    quizData["concepts"] = conceptsSelected;
                    quizData["quizType"] = selectedQuizType;
                    quizData["quizLevel"] = quizLevel;

                    let questionSelected = [{ _id: selectedQuestion._id }];
                    quizData["questionsSelected"] = questionSelected;
                    quizData["lessonTopic"] = lessonTopic;
                    (quizData["chapterLabelled"] = chapterDetails._id),
                        (quizData["chapterLabelledName"] = chapterDetails.name);
                    quizData["quizCode"] = `QuizCode-${Math.floor(
                        Math.random() * 1000
                    )}`;
                    quizData["quizTitle"] = `QuizTitle-${Math.floor(
                        Math.random() * 1000
                    )}`;
                }
                setQuizDataOfSlide(quizData);
                const newSlides = [...slides];
                const insertIndex =
                    editIndex >= 0 ? editIndex + 1 : newSlides.length;
                newSlides.splice(insertIndex, 0, {
                    speakerNotes,
                    slideType: selectedSlideType,
                    selectedQuestion: completeQuestion,
                });
                setSlides(newSlides);
                setSelectedQuestion(null);
                setSelectedConcept([]);
                setSelectedQuizType("");
                setLessonTopic("");
                setSpeakerNotes("");
                resetForm();
                setEditIndex(insertIndex);
                setMessage("Slide added successfully!");
                setAlertType("success");
                setOpenSnackbar(true);
            }
        }
    };

    const resetForm = () => {
        setContent("");
        setSpeakerNotes("");
        setExpectedTime("");
        setIsEditing(false);
        setIsInserting(false);
    };

    const handleSubmit = async () => {
        if (!location.state || !location.state.lesson._id) {
            setMessage("Lesson ID is missing!");
            setAlertType("error");
            setOpenSnackbar(true);
            return;
        }

        if (slides.length === 0) {
            setMessage("Please add slides!");
            setAlertType("error");
            setOpenSnackbar(true);
            return;
        }

        if (selectedSlideType === "Quiz") {
            let quizData = quizDataOfSlide;

            let createdQuiz;

            const token = localStorage.getItem("token");
            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/quizV2Final/create/quiz`,
                    quizData,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                createdQuiz = response.data.quiz;
                setQuizDataOfSlide(null);
            } catch (error) {
                console.error("Error creating Quiz:", error);
                return;
            }

            let addedSlide = null;

            for (let ele of slides) {
                if (ele._id === undefined) {
                    addedSlide = ele;
                }
            }

            try {
                let payload;
                if (addedSlide === null) {
                    payload = {
                        slides: slides,
                        lessonId: lesson._id,
                    };
                } else {
                    const filteredSlides = slides.filter(
                        (every) => every._id !== undefined
                    );
                    payload = {
                        slides: [
                            ...filteredSlides,
                            { ...addedSlide, quizId: createdQuiz._id },
                        ],
                        lessonId: lesson._id,
                    };
                }

                const response = await axios.put(
                    `${import.meta.env.VITE_API_URL}/lessons/lessons/${
                        lesson._id
                    }`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

            

                setSelectedSlideType("");
                setSlides([]);
                setMessage("Slides sent to backend successfully!");
                setAlertType("success");
                setOpenSnackbar(true);

                setTimeout(() => {
                    window.location.reload();
                }, 300);
            } catch (error) {
                console.error("Error sending slides to backend:", error);
                setMessage("Error sending slides to backend.");
                setAlertType("error");
                setOpenSnackbar(true);
            }
        }

        if (selectedSlideType === "Reading") {
            try {
                const token = localStorage.getItem("token");
                const payload = {
                    slides: slides,
                    lessonId: lesson._id,
                };

                const response = await axios.put(
                    `${import.meta.env.VITE_API_URL}/lessons/lessons/${
                        lesson._id
                    }`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

            

                setSelectedSlideType("");
                setSlides([]);
                setMessage("Slides sent to backend successfully!");
                setAlertType("success");
                setOpenSnackbar(true);

                setTimeout(() => {
                    window.location.reload();
                }, 300);
            } catch (error) {
                console.error("Error sending slides to backend:", error);
                setMessage("Error sending slides to backend.");
                setAlertType("error");
                setOpenSnackbar(true);
            }
        }
    };

    const handleStudentView = () => {
        if (slides.length === 0) {
            setMessage("Please add slides to preview.");
            setAlertType("error");
            setOpenSnackbar(true);
            return;
        }
        setShowStudentView(!showStudentView);
    };

    const onSlideChange = (activeIndex) => {
        setEditIndex(activeIndex);
        
    };

    return (
        <>
            <Container>
                <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ textAlign: "center" }}
                >
                    {lesson.lessonName || "Lesson Editor"}
                    <IconButton
                        onClick={() => {
                            handleLessonRenameOpenDialog();
                        }}
                        sx={{ ml: 2, mt: -0.5 }}
                    ></IconButton>
                </Typography>

                <Box display="flex" alignItems="center" mb={2}>
                    <FormControl
                        fullWidth
                        variant="outlined"
                        margin="normal"
                        required
                    >
                        <InputLabel id="slideType-select-label">
                            Slide type
                        </InputLabel>
                        <Select
                            labelId="slideType-select-label"
                            value={selectedSlideType}
                            onChange={handleSlideTypeChange}
                            label="SlideType"
                        >
                            {slidesTypeArray.map((slideType) => (
                                <MenuItem
                                    key={slideType._id}
                                    value={slideType.name}
                                >
                                    {slideType.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <div ref={formRef}>
                    <Card variant="outlined" sx={{ mb: 3 }}>
                        <CardContent>
                            {/* Add TextField here */}
                            <TextField
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                label="Expected Time (in seconds)"
                                type="number"
                                value={expectedTime}
                                onChange={(e) =>
                                    setExpectedTime(e.target.value)
                                }
                                required
                                sx={{ mt: 2 }}
                            />
                            {selectedSlideType === "Reading" && (
                                <JoditEditor
                                    ref={editor}
                                    value={content}
                                    config={config}
                                    onBlur={(newContent) =>
                                        setContent(newContent)
                                    }
                                />
                            )}
                            {selectedSlideType === "Quiz" && (
                                <>
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        mb={2}
                                    >
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

                                    <Typography
                                        variant="h4"
                                        gutterBottom
                                        align="center"
                                    >
                                        Filter Questions
                                    </Typography>

                                    <Box
                                        sx={{
                                            mb: 2,
                                            display: "flex",
                                            justifyContent: "center",
                                        }}
                                    >
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
                                                    onChange={(e) =>
                                                        setCurrentField(
                                                            e.target.value
                                                        )
                                                    }
                                                    fullWidth
                                                    size="small"
                                                >
                                                    <MenuItem value="questionId">
                                                        Question Id
                                                    </MenuItem>
                                                    <MenuItem value="questionType">
                                                        Question Type
                                                    </MenuItem>
                                                    <MenuItem value="questionTitle">
                                                        Question Title
                                                    </MenuItem>
                                                    <MenuItem value="boardName">
                                                        Board Name
                                                    </MenuItem>
                                                    <MenuItem value="gradeName">
                                                        Grade
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
                                                    <MenuItem value="concept">
                                                        Concept Name
                                                    </MenuItem>
                                                </Select>
                                            </Grid>
                                            <Grid item xs={12} sm={8}>
                                                <TextField
                                                    label={`Search by ${currentField}`}
                                                    variant="outlined"
                                                    value={currentInput}
                                                    onChange={(e) =>
                                                        setCurrentInput(
                                                            e.target.value
                                                        )
                                                    }
                                                    onKeyPress={handleAddTag}
                                                    fullWidth
                                                    size="small"
                                                />
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "center",
                                            mb: 2,
                                        }}
                                    >
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            sx={{
                                                flexWrap: "wrap",
                                                justifyContent: "center",
                                                maxWidth: "600px",
                                            }}
                                        >
                                            {Object.entries(searchTags).map(
                                                ([field, tags]) =>
                                                    tags.map((tag) => (
                                                        <Chip
                                                            key={`${field}-${tag}`}
                                                            label={`${field}: ${tag}`}
                                                            onDelete={() =>
                                                                handleDeleteTag(
                                                                    field,
                                                                    tag
                                                                )
                                                            }
                                                            sx={{ mb: 1 }}
                                                        />
                                                    ))
                                            )}
                                        </Stack>
                                    </Box>
                                    <TableContainer component={Paper}>
                                        <Table aria-label="simple table">
                                            <TableHead>
                                                <TableRow
                                                    sx={{
                                                        backgroundColor:
                                                            "green",
                                                    }}
                                                >
                                                    <TableCell
                                                        sx={{ color: "white" }}
                                                        align="center"
                                                    >
                                                        Select Question
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{ color: "white" }}
                                                        align="center"
                                                    >
                                                        Question ID
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{ color: "white" }}
                                                        align="center"
                                                    >
                                                        Question Type
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{ color: "white" }}
                                                        align="center"
                                                    >
                                                        Question Title
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{ color: "white" }}
                                                        align="center"
                                                    >
                                                        Board
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{ color: "white" }}
                                                        align="center"
                                                    >
                                                        Grade
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{ color: "white" }}
                                                        align="center"
                                                    >
                                                        Category Name
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{ color: "white" }}
                                                        align="center"
                                                    >
                                                        SubCategory Name
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
                                            {isLoading ? (
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "center",
                                                        padding: "20px",
                                                    }}
                                                >
                                                    <CircularProgress />
                                                </Box>
                                            ) : (
                                                <TableBody>
                                                    {questions
                                                        .slice(
                                                            page * rowsPerPage,
                                                            page * rowsPerPage +
                                                                rowsPerPage
                                                        )
                                                        .map((question) => (
                                                            <TableRow
                                                                key={
                                                                    question.questionId
                                                                }
                                                            >
                                                                <TableCell align="center">
                                                                    <Radio
                                                                        checked={
                                                                            selectedQuestion ===
                                                                            question
                                                                        }
                                                                        onChange={() =>
                                                                            handleRadioChange(
                                                                                question
                                                                            )
                                                                        }
                                                                        value={
                                                                            question
                                                                        }
                                                                    />
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    {
                                                                        question.questionId
                                                                    }
                                                                </TableCell>
                                                                <TableCell
                                                                    component="th"
                                                                    scope="row"
                                                                >
                                                                    {
                                                                        question.questionType
                                                                    }
                                                                </TableCell>

                                                                <TableCell align="center">
                                                                    {
                                                                        question.questionTitle
                                                                    }
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    {
                                                                        question.boardName
                                                                    }
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    {
                                                                        question.gradeName
                                                                    }
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    {
                                                                        question.categoryName
                                                                    }
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    {
                                                                        question.subCategoryName
                                                                    }
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    {
                                                                        question.chapterName
                                                                    }
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    {question
                                                                        .concepts
                                                                        .length >
                                                                        0 &&
                                                                        question.concepts.map(
                                                                            (
                                                                                every
                                                                            ) => (
                                                                                <li>
                                                                                    {
                                                                                        every.name
                                                                                    }
                                                                                </li>
                                                                            )
                                                                        )}
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    <Box
                                                                        sx={{
                                                                            display:
                                                                                "flex",
                                                                            justifyContent:
                                                                                "center",
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
                                            )}
                                        </Table>
                                    </TableContainer>

                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <TablePagination
                                            rowsPerPageOptions={[
                                                10, 20, 30, 40,
                                            ]}
                                            component="div"
                                            count={questions.length}
                                            rowsPerPage={rowsPerPage}
                                            page={page}
                                            onPageChange={handleChangePage}
                                            onRowsPerPageChange={
                                                handleChangeRowsPerPage
                                            }
                                        />
                                    </Box>

                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        margin="normal"
                                        label="Lesson topic"
                                        value={lessonTopic}
                                        onChange={(e) =>
                                            setLessonTopic(e.target.value)
                                        }
                                        required
                                    />

                                    <Stack
                                        spacing={3}
                                        sx={{ marginBottom: "20px" }}
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
                                                options={concepts || []}
                                                getOptionLabel={(option) =>
                                                    option.name
                                                }
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
                                                        backgroundColor:
                                                            "whitesmoke",
                                                    }}
                                                    fullWidth
                                                    variant="outlined"
                                                    margin="normal"
                                                    label="Concept Name"
                                                    value={conceptName}
                                                    onChange={(e) =>
                                                        setConceptName(
                                                            e.target.value
                                                        )
                                                    }
                                                    required
                                                />

                                                <Button
                                                    onClick={handleConceptSave}
                                                    style={{
                                                        marginTop: "10px",
                                                        backgroundColor:
                                                            "#4caf50",
                                                        color: "#fff",
                                                    }}
                                                >
                                                    Save Concept
                                                </Button>
                                            </Box>
                                        </>
                                    )}

                                    <Modal
                                        open={isModalOpen === true}
                                        onClose={handleClose}
                                        aria-labelledby="modal-modal-title"
                                        aria-describedby="modal-modal-description"
                                    >
                                        <>
                                            {Object.entries(completeQuestion)
                                                .length > 0 && (
                                                <Card
                                                    sx={{
                                                        maxWidth: 800,
                                                        maxHeight: "80vh", // Limit the height to 80% of viewport height
                                                        margin: "20px auto",
                                                        padding: "20px",
                                                        borderRadius: "12px",
                                                        boxShadow:
                                                            "0 4px 12px rgba(0, 0, 0, 0.1)",
                                                        overflowY: "auto", // Enables vertical scrolling when content overflows
                                                    }}
                                                >
                                                    <CardContent>
                                                        <Typography
                                                            variant="h5"
                                                            gutterBottom
                                                            color="primary"
                                                            fontWeight="bold"
                                                        >
                                                            Question Type:{" "}
                                                            {
                                                                completeQuestion.questionType
                                                            }
                                                        </Typography>

                                                        <Divider
                                                            sx={{ marginY: 2 }}
                                                        />

                                                        <Grid
                                                            container
                                                            spacing={3}
                                                        >
                                                            {/* Metadata Section */}
                                                            <Grid item xs={12}>
                                                                <Typography
                                                                    variant="h6"
                                                                    color="textSecondary"
                                                                    gutterBottom
                                                                >
                                                                    Question
                                                                    Details
                                                                </Typography>
                                                                <Grid
                                                                    container
                                                                    spacing={2}
                                                                >
                                                                    <Grid
                                                                        item
                                                                        xs={12}
                                                                    >
                                                                        <Typography variant="subtitle1">
                                                                            <strong>
                                                                                Question
                                                                                Title:
                                                                            </strong>{" "}
                                                                            {
                                                                                completeQuestion.questionTitle
                                                                            }
                                                                        </Typography>
                                                                    </Grid>
                                                                    <Grid
                                                                        item
                                                                        xs={12}
                                                                        sm={6}
                                                                    >
                                                                        <Typography variant="subtitle1">
                                                                            <strong>
                                                                                Question
                                                                                ID:
                                                                            </strong>{" "}
                                                                            {
                                                                                completeQuestion.questionId
                                                                            }
                                                                        </Typography>
                                                                    </Grid>
                                                                    <Grid
                                                                        item
                                                                        xs={12}
                                                                        sm={6}
                                                                    >
                                                                        <Typography variant="subtitle1">
                                                                            <strong>
                                                                                Board:
                                                                            </strong>{" "}
                                                                            {
                                                                                completeQuestion.boardName
                                                                            }
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="body2"
                                                                            color="textSecondary"
                                                                        >
                                                                            {
                                                                                completeQuestion.boardDescription
                                                                            }
                                                                        </Typography>
                                                                    </Grid>
                                                                    <Grid
                                                                        item
                                                                        xs={12}
                                                                        sm={6}
                                                                    >
                                                                        <Typography variant="subtitle1">
                                                                            <strong>
                                                                                Grade:
                                                                            </strong>{" "}
                                                                            {
                                                                                completeQuestion.gradeName
                                                                            }
                                                                        </Typography>
                                                                    </Grid>
                                                                </Grid>
                                                            </Grid>

                                                            <Grid item xs={12}>
                                                                <Divider />
                                                            </Grid>

                                                            {/* Category Information */}
                                                            <Grid item xs={12}>
                                                                <Typography
                                                                    variant="h6"
                                                                    color="textSecondary"
                                                                    gutterBottom
                                                                >
                                                                    Category
                                                                    Information
                                                                </Typography>
                                                                <Grid
                                                                    container
                                                                    spacing={2}
                                                                >
                                                                    <Grid
                                                                        item
                                                                        xs={12}
                                                                        sm={6}
                                                                    >
                                                                        <Typography variant="subtitle1">
                                                                            <strong>
                                                                                Category:
                                                                            </strong>{" "}
                                                                            {
                                                                                completeQuestion.categoryName
                                                                            }
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="body2"
                                                                            color="textSecondary"
                                                                        >
                                                                            {
                                                                                completeQuestion.categoryDescription
                                                                            }
                                                                        </Typography>
                                                                    </Grid>
                                                                    <Grid
                                                                        item
                                                                        xs={12}
                                                                        sm={6}
                                                                    >
                                                                        <Typography variant="subtitle1">
                                                                            <strong>
                                                                                Subcategory:
                                                                            </strong>{" "}
                                                                            {
                                                                                completeQuestion.subCategoryName
                                                                            }
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="body2"
                                                                            color="textSecondary"
                                                                        >
                                                                            {
                                                                                completeQuestion.subCategoryDescription
                                                                            }
                                                                        </Typography>
                                                                    </Grid>
                                                                </Grid>
                                                            </Grid>

                                                            <Grid item xs={12}>
                                                                <Divider />
                                                            </Grid>

                                                            {/* Chapter and Concepts */}
                                                            <Grid item xs={12}>
                                                                <Typography
                                                                    variant="h6"
                                                                    color="textSecondary"
                                                                    gutterBottom
                                                                >
                                                                    Chapter and
                                                                    Concepts
                                                                </Typography>
                                                                <Typography variant="subtitle1">
                                                                    <strong>
                                                                        Chapter:
                                                                    </strong>{" "}
                                                                    {
                                                                        completeQuestion.chapterName
                                                                    }
                                                                </Typography>
                                                                <Typography
                                                                    variant="subtitle1"
                                                                    sx={{
                                                                        mt: 1,
                                                                    }}
                                                                >
                                                                    <strong>
                                                                        Concepts:
                                                                    </strong>
                                                                </Typography>
                                                                <List dense>
                                                                    {completeQuestion.concepts.map(
                                                                        (
                                                                            concept,
                                                                            index
                                                                        ) => (
                                                                            <ListItem
                                                                                key={
                                                                                    index
                                                                                }
                                                                            >
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
                                                                <Divider />
                                                            </Grid>

                                                            {/* Question Content */}
                                                            <Grid item xs={12}>
                                                                <Typography
                                                                    variant="h6"
                                                                    color="textSecondary"
                                                                    gutterBottom
                                                                >
                                                                    Question
                                                                    Stem
                                                                </Typography>
                                                                <Box
                                                                    sx={{
                                                                        bgcolor:
                                                                            "#fafafa",
                                                                        p: 2,
                                                                        borderRadius: 1,
                                                                    }}
                                                                >
                                                                    <div
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: completeQuestion.questionStem,
                                                                        }}
                                                                    />
                                                                </Box>
                                                            </Grid>

                                                            {/* Answer Section */}
                                                            {renderAnswer()}

                                                            {/* Explanation */}
                                                            <Grid item xs={12}>
                                                                <Typography
                                                                    variant="h6"
                                                                    color="textSecondary"
                                                                    gutterBottom
                                                                >
                                                                    Explanation
                                                                </Typography>
                                                                <Box
                                                                    sx={{
                                                                        bgcolor:
                                                                            "#fafafa",
                                                                        p: 2,
                                                                        borderRadius: 1,
                                                                    }}
                                                                >
                                                                    <div
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: completeQuestion.explanation,
                                                                        }}
                                                                    />
                                                                </Box>
                                                            </Grid>

                                                            {/* Timestamps */}
                                                            <Grid item xs={12}>
                                                                <Divider
                                                                    sx={{
                                                                        my: 2,
                                                                    }}
                                                                />
                                                                <Typography
                                                                    variant="body2"
                                                                    color="textSecondary"
                                                                >
                                                                    <strong>
                                                                        Created:
                                                                    </strong>{" "}
                                                                    {
                                                                        completeQuestion.createdAt
                                                                    }
                                                                </Typography>
                                                                <Typography
                                                                    variant="body2"
                                                                    color="textSecondary"
                                                                >
                                                                    <strong>
                                                                        Last
                                                                        Updated:
                                                                    </strong>{" "}
                                                                    {
                                                                        completeQuestion.updatedAt
                                                                    }
                                                                </Typography>
                                                            </Grid>
                                                        </Grid>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </>
                                    </Modal>
                                </>
                            )}

                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                variant="outlined"
                                label="Speaker Notes"
                                value={speakerNotes}
                                onChange={(e) =>
                                    setSpeakerNotes(e.target.value)
                                }
                                sx={{ mt: 2 }}
                            />
                        </CardContent>

                        <CardActions
                            sx={{
                                justifyContent: "start",
                                flexWrap: "wrap",
                                gap: 1,
                            }}
                        >
                            {isEditing ? (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleUpdateSlide}
                                >
                                    Update Slide
                                </Button>
                            ) : isInserting ? (
                                <>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleInsertSlideBefore}
                                    >
                                        Insert Before
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleInsertSlideAfter}
                                    >
                                        Insert After
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleAddSlide}
                                >
                                    Add Slide
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleStudentView}
                            >
                                {showStudentView
                                    ? "Hide Student View"
                                    : "Show Student View"}
                            </Button>
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={handleSubmit}
                            >
                                Save Slides
                            </Button>
                        </CardActions>
                    </Card>
                </div>

                {showStudentView && (
                    <>
                        <LessonSlides
                            lessonSlides={slides.map((slide) => slide)}
                            onSlideChange={onSlideChange}
                            enableKeyboardFullScreen={enableKeyboardFullScreen}
                        />
                        <Box
                            sx={{
                                marginLeft: "10%",
                                display: "flex",
                                justifyContent: "left",
                                gap: 2,
                            }}
                        >
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => handleEditSlide()}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => handleDeleteSlide()}
                            >
                                Delete
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleInsert}
                            >
                                Insert
                            </Button>
                        </Box>
                        {slides[editIndex] && (
                            <Box sx={{ mt: 2, ml: "10%" }}>
                                <Typography variant="h6">
                                    Speaker Notes:
                                </Typography>
                                <Typography>
                                    {slides[editIndex].speakerNotes}
                                </Typography>
                            </Box>
                        )}
                    </>
                )}

                <Snackbar
                    open={openSnackbar}
                    autoHideDuration={6000}
                    onClose={() => setOpenSnackbar(false)}
                    anchorOrigin={{ vertical: "top", horizontal: "center" }}
                >
                    <Alert
                        onClose={() => setOpenSnackbar(false)}
                        severity={alertType}
                        sx={{ width: "100%" }}
                    >
                        {message}
                    </Alert>
                </Snackbar>
            </Container>
        </>
    );
};

export default Lesson;
