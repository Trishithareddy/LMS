import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Button } from "@mui/material";

function RenderQuizTab({ chapterId }) {
    const [chapterQuiz, setChapterQuiz] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchChapterQuiz = async () => {
            if (!chapterId) return;

            setIsLoading(true);
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/chapter-quiz/get-chapter-quizstatus/${chapterId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                // console.log("Quiz data response ", response.data);
                const quizData = response.data?.result;
                setChapterQuiz(quizData);

            } catch (error) {
                console.error("Error fetching quiz:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchChapterQuiz();
    }, [chapterId]);

    if (isLoading) {
        return (
            <div className="text-center mt-5">
                Loading quiz information...
            </div>
        );
    }

    return (
        <div className="max-w-2xl bg-gray-100 shadow-2xl rounded-2xl mx-auto p-10 flex flex-col
         items-center justify-center gap-4 mt-5">

            {/* Message Section */}
            {chapterQuiz ? (
                <div>
                    {!chapterQuiz?.attempted ? (
                        <div>
                            Test your skills by attempting the quiz prepared for this chapter.
                            Click on the "Attempt Quiz" button to get started!
                        </div>
                    ) : (
                        <div>
                            You have already attempted the quiz for this chapter.
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center">
                    No quiz available for this chapter.
                </div>
            )}

            {/* Button Section */}
            {chapterQuiz && (
                !chapterQuiz.attempted ? (
                    <Link to={`/student-dashboard/chapter-quiz-attempt/${chapterId}`}>
                        <Button variant="contained" color="primary">
                            Attempt Quiz
                        </Button>
                    </Link>
                ) : (
                    <div className="flex justify-between items-center gap-6">
                        <Link to={`/student-dashboard/chapter-quiz-result/${chapterQuiz?.attemptId}`}>
                            <Button variant="contained" color="primary">
                                View Result
                            </Button>
                        </Link>
                        <Button variant="contained" color="secondary" disabled={chapterQuiz.allowReattempt}>
                            <Link to={`/student-dashboard/chapter-quiz-attempt/${chapterQuiz._id}`}>
                                Reattempt Quiz
                            </Link>
                        </Button>

                    </div>
                )
            )}
        </div>
    );
}

export default RenderQuizTab;