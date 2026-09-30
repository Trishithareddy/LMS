import { useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Grid,
    List,
    ListItem,
    ListItemText,
    Divider,
    Box,
    Card,
    CircularProgress,
    CardContent
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CloseIcon from '@mui/icons-material/Close';
import  toast from "react-hot-toast"


const CompleteQuestion = ({ open, onClose, questionId }) => {
    const [question, setQuestion] = useState("");
    const location = useLocation()
    const navigate = useNavigate();
    const id = questionId || location.state?.questionId || location.state?.id;
    const isPageMode = typeof open === "undefined";
    const effectiveOpen = isPageMode || open;
    const [isLoading, setIsLoading] = useState(false);

    const fetchCompleteQuestion = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/questionBase/get/questionDetails/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

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

            response.data.question.createdAt = createdDate.toLocaleString("en-IN", dateConvertion);
            response.data.question.updatedAt = updatedDate.toLocaleString("en-IN", dateConvertion);

            setQuestion(response.data.question);
        } catch (error) {
            console.error("Error fetching Question:", error);
            toast.error("Error fetching Question");
        }
        finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (effectiveOpen && id) {
            fetchCompleteQuestion();
        }
    }, [effectiveOpen, id]);

    const handleClose = () => {
        if (onClose) {
            onClose();
            return;
        }
        navigate("/admin-dashboard/question-base-tabs");
    };

    const renderAnswer = () => {
        if (!question) return null;

        switch (question.questionType) {
            case "MCQ":
                return (
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" color="textSecondary">
                            <strong>Options:</strong>
                        </Typography>
                        <List dense>
                            {question.options.map((option, index) => (
                                <ListItem key={index}>
                                    <ListItemText
                                        primary={
                                            <Box>
                                                <div style={{
                                                    display: "flex",
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    backgroundColor: question.answerKey === (index + 1).toString() ? '#e3f2fd' : 'transparent',
                                                    padding: '8px',
                                                    borderRadius: '4px'
                                                }}>
                                                    <Typography variant="body1" style={{ marginRight: "10px" }}>
                                                        {String.fromCharCode(65 + index)})
                                                    </Typography>
                                                    <span dangerouslySetInnerHTML={{ __html: option.option }} />
                                                </div>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                        <Typography variant="subtitle1" color="primary" style={{ marginTop: '16px' }}>
                            <strong>Correct Answer: </strong>
                            {question?.answer}
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
                        <Box sx={{ mt: 1, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                            <div dangerouslySetInnerHTML={{ __html: question.answer }} />
                        </Box>
                    </Grid>
                );

            case "Very Short Answer":
                return (
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" color="textSecondary">
                            <strong>Main Answer:</strong>
                        </Typography>
                        <Box sx={{ mt: 1, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                            <div dangerouslySetInnerHTML={{ __html: question.answer }} />
                        </Box>

                        {question.variations && question.variations.length > 0 && (
                            <>
                                <Typography variant="subtitle1" color="textSecondary" sx={{ mt: 2 }}>
                                    <strong>Alternative Answers:</strong>
                                </Typography>
                                <List dense>
                                    {question.variations.map((variation, index) => (
                                        <ListItem key={index}>
                                            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, width: '100%' }}>
                                                <div dangerouslySetInnerHTML={{ __html: variation }} />
                                            </Box>
                                        </ListItem>
                                    ))}
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
                        <Box sx={{
                            mt: 1,
                            p: 2,
                            bgcolor: question.answer ? '#e8f5e9' : '#ffebee',
                            borderRadius: 1,
                            fontWeight: 'bold'
                        }}>
                            {question.answer ? "True" : "False"}
                        </Box>
                    </Grid>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={effectiveOpen} onClose={handleClose} maxWidth="md" fullWidth>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px" }}>
                <Typography variant="h6">Question Details</Typography>
                <Button onClick={handleClose} color="primary" startIcon={<CloseIcon />}>
                    Close
                </Button>
            </div>

            {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
                    <CircularProgress />
                </div>
            ) : (
                <DialogContent dividers>
                    {question && (
                        <Card sx={{ boxShadow: "none" }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom color="primary">
                                    Question Type: {question.questionType}
                                </Typography>
                                <Divider sx={{ marginY: 2 }} />

                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <Typography variant="h6" color="textSecondary" gutterBottom>
                                            Question
                                        </Typography>
                                        <Box sx={{ bgcolor: "#fafafa", p: 2, borderRadius: 1 }}>
                                            <div dangerouslySetInnerHTML={{ __html: question.questionStem }} />
                                        </Box>
                                    </Grid>

                                    {renderAnswer()}

                                    <Grid item xs={12}>
                                        <Typography variant="h6" color="textSecondary" gutterBottom>
                                            Explanation
                                        </Typography>
                                        <Box sx={{ bgcolor: "#fafafa", p: 2, borderRadius: 1 }}>
                                            <div dangerouslySetInnerHTML={{ __html: question.explanation }} />
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}
                </DialogContent>
            )}
        </Dialog>
    );
};

export default CompleteQuestion;
