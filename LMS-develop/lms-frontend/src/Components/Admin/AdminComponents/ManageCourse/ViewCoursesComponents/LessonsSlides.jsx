import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import {
    Box,
    IconButton,
    Paper,
    Typography,
    Card,
    CardContent,
    RadioGroup,
    Radio,
    FormControlLabel,
    CardActions,
    Button,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import "swiper/css";
import "swiper/css/navigation";
import { Keyboard, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const LessonSlides = ({ lessonSlides }) => {
    const swiperRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showArrows, setShowArrows] = useState(false);
    const timeoutRef = useRef(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [optedAnswer, setOptedAnswer] = useState("");
    const [showAnswer, setShowAnswer] = useState(false);
    const [correctOrNot, setCorrectOrNot] = useState(false);

    let htmlData = lessonSlides || [];

    const handleAnswer = (event) => {
        setOptedAnswer(event.target.value);
    };

    const submitQuestion = (question, quizId) => {
        if (parseInt(question.answerKey) === parseInt(optedAnswer)) {
            setShowAnswer(true);
            setCorrectOrNot(true);
        } else {
            setShowAnswer(true);
            setCorrectOrNot(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        // const handleKeyPress = (event) => {
        //     if (event.key === "f" || event.key === "F") {
        //         handleFullScreen();
        //     }
        // };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        // document.addEventListener("keydown", handleKeyPress);

        return () => {
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange
            );
            // document.removeEventListener("keydown", handleKeyPress);
        };
    }, []);

    useEffect(() => {
        const adjustVideoIframes = () => {
            const iframes = document.querySelectorAll(
                '.swiper-slide iframe[src*="vimeo.com"], .swiper-slide iframe[src*="youtube.com"]'
            );
            iframes.forEach((iframe) => {
                const slide = iframe.closest(".swiper-slide");
                if (slide) {
                    const slideWidth = slide.clientWidth;
                    const slideHeight = slide.clientHeight;
                    const aspectRatio = 16 / 9;

                    let width, height;
                    if (slideWidth / slideHeight > aspectRatio) {
                        height = slideHeight;
                        width = height * aspectRatio;
                    } else {
                        width = slideWidth;
                        height = width / aspectRatio;
                    }

                    iframe.style.width = `${width}px`;
                    iframe.style.height = `${height}px`;
                    iframe.style.maxWidth = "100%";
                    iframe.style.maxHeight = "100%";
                }
            });
        };

        adjustVideoIframes();
        window.addEventListener("resize", adjustVideoIframes);

        return () => {
            window.removeEventListener("resize", adjustVideoIframes);
        };
    }, [lessonSlides]);

    const handleNext = () => {
        swiperRef.current?.swiper.slideNext();
    };

    const handlePrev = () => {
        swiperRef.current?.swiper.slidePrev();
    };

    const handleFullScreen = () => {
        const element = document.querySelector(".slides-container");
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            element.requestFullscreen();
        }
    };

    const showArrowsTemporarily = () => {
        setShowArrows(true);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setShowArrows(false);
        }, 3000);
    };

    const pauseAllVideos = () => {
        const iframes = document.querySelectorAll(
            '.swiper-slide iframe[src*="vimeo.com"], .swiper-slide iframe[src*="youtube.com"]'
        );
        iframes.forEach((iframe) => {
            if (iframe.src.includes("vimeo.com")) {
                iframe.contentWindow.postMessage('{"method":"pause"}', "*");
            }
            if (iframe.src.includes("youtube.com")) {
                iframe.contentWindow.postMessage(
                    '{"event":"command","func":"pauseVideo","args":""}',
                    "*"
                );
            }
        });
    };

    return (
        <Box
            className="container"
            sx={{
                width: "80%",
                minHeight: "100vh",
                margin: "0 auto",
                paddingTop: "20px",
                "@media (max-width: 600px)": {
                    width: "95vw",
                },
            }}
        >
            <Box
                className="slides-container"
                sx={{
                    position: "relative",
                    overflow: "hidden",
                    width: "100%",
                    paddingBottom: "56.25%", // 16:9 aspect ratio
                    backgroundColor: "whitesmoke",
                    border: "1px solid black",
                }}
                onMouseMove={isFullscreen ? showArrowsTemporarily : undefined}
            >
                {lessonSlides && lessonSlides.length > 0 ? (
                    <Swiper
                        ref={swiperRef}
                        modules={[Navigation, Keyboard]}
                        navigation={{
                            prevEl: ".swiper-button-prev",
                            nextEl: ".swiper-button-next",
                        }}
                        keyboard={{
                            enabled: true,
                        }}
                        onSlideChange={(swiper) => {
                            pauseAllVideos();
                            setOptedAnswer("");
                            setCorrectOrNot(false);
                            setShowAnswer(false);
                            setCurrentSlideIndex(swiper.activeIndex);
                        }}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                        }}
                    >
                        {htmlData.map((html, index) => (
                            <SwiperSlide key={index}>
                                <Box
                                    sx={{
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <Box sx={{ flex: 1, overflow: "auto" }}>
                                        {(html.slideType === undefined ||
                                            html.slideType === "Reading") && (
                                                <div
                                                    dangerouslySetInnerHTML={{
                                                        __html: html.content,
                                                    }}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        transform: "scale(0.7)",
                                                    }}
                                                />
                                            )}
                                        {html.slideType === "Quiz" && (
                                            <div
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    transform: "scale(0.7)",
                                                }}
                                            >
                                                <>
                                                    <Box
                                                        sx={{
                                                            backgroundColor:
                                                                "yellow",
                                                            padding: "10px",
                                                            display: "flex",
                                                            flexDirection:
                                                                "row",
                                                            justifyContent:
                                                                "center",
                                                            alignItems:
                                                                "center",
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="h6"
                                                            component="div"
                                                            gutterBottom
                                                        >
                                                            {
                                                                html
                                                                    .selectedQuestion
                                                                    .questionTitle
                                                            }
                                                        </Typography>
                                                    </Box>

                                                    <Card
                                                        sx={{
                                                            width: "80%",
                                                            margin: "auto",
                                                            mt: 4,
                                                        }}
                                                    >
                                                        <CardContent>
                                                            <Typography
                                                                variant="body1"
                                                                gutterBottom
                                                            >
                                                                <Box
                                                                    sx={{
                                                                        display:
                                                                            "flex",
                                                                        flexDirection:
                                                                            "row",
                                                                    }}
                                                                >
                                                                    <span
                                                                        style={{
                                                                            marginRight:
                                                                                "10px",
                                                                        }}
                                                                    >
                                                                        Q)
                                                                    </span>
                                                                    <span
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: html
                                                                                .selectedQuestion
                                                                                .questionStem,
                                                                        }}
                                                                    />
                                                                </Box>
                                                            </Typography>
                                                            <RadioGroup
                                                                value={
                                                                    optedAnswer ||
                                                                    ""
                                                                }
                                                                onChange={
                                                                    handleAnswer
                                                                }
                                                            >
                                                                {html.selectedQuestion.options.map(
                                                                    (
                                                                        option,
                                                                        index
                                                                    ) => (
                                                                        <FormControlLabel
                                                                            key={
                                                                                index
                                                                            }
                                                                            value={option.optionNumber.toString()}
                                                                            control={
                                                                                <Radio />
                                                                            }
                                                                            label={
                                                                                <div
                                                                                    style={{
                                                                                        display:
                                                                                            "flex",
                                                                                        flexDirection:
                                                                                            "row",
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
                                                                    )
                                                                )}
                                                            </RadioGroup>
                                                        </CardContent>
                                                        <CardActions
                                                            sx={{
                                                                justifyContent:
                                                                    "flex-end",
                                                                px: 2,
                                                                pb: {
                                                                    xs: "40px",
                                                                    xl: 2,
                                                                },
                                                                position:
                                                                    "relative",
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    display:
                                                                        "flex",
                                                                    gap: 1,
                                                                }}
                                                            >
                                                                <Button
                                                                    onClick={() =>
                                                                        submitQuestion(
                                                                            html.selectedQuestion,
                                                                            html.quizId
                                                                        )
                                                                    }
                                                                >
                                                                    Submit Quiz
                                                                </Button>
                                                            </Box>
                                                            {showAnswer && (
                                                                <>
                                                                    {correctOrNot ? (
                                                                        <p>
                                                                            Correct
                                                                            Answer
                                                                        </p>
                                                                    ) : (
                                                                        <p>
                                                                            Wrong
                                                                            Answer
                                                                        </p>
                                                                    )}
                                                                </>
                                                            )}
                                                        </CardActions>
                                                    </Card>
                                                </>
                                            </div>
                                        )}
                                    </Box>
                                </Box>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                ) : (
                    <Typography
                        variant="h6"
                        sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                        }}
                    >
                        No slides available
                    </Typography>
                )}
                {isFullscreen && (
                    <>
                        <Box
                            onClick={handlePrev}
                            sx={{
                                opacity: showArrows ? 1 : 0,
                                transition: "opacity 0.3s ease-in-out",
                                position: "absolute",
                                top: "50%",
                                left: "10px",
                                zIndex: 10,
                                transform: "translateY(-50%)",
                                cursor: "pointer",
                                "&:hover": {
                                    backgroundColor: "rgba(76, 175, 80, 0.2)",
                                    borderRadius: "50%",
                                },
                            }}
                        >
                            <ArrowBackIosIcon
                                sx={{
                                    fontSize: "30px",
                                    color: "#4CAF50",
                                    "&:hover": {
                                        color: "#388E3C",
                                    },
                                    transition: "color 0.3s ease",
                                }}
                            />
                        </Box>
                        <Box
                            onClick={handleNext}
                            sx={{
                                opacity: showArrows ? 1 : 0,
                                transition: "opacity 0.3s ease-in-out",
                                position: "absolute",
                                top: "50%",
                                right: "0px",
                                zIndex: 10,
                                transform: "translateY(-50%)",
                                cursor: "pointer",
                                "&:hover": {
                                    backgroundColor: "rgba(76, 175, 80, 0.2)",
                                    borderRadius: "50%",
                                },
                            }}
                        >
                            <ArrowForwardIosIcon
                                sx={{
                                    fontSize: "30px",
                                    color: "#4CAF50",
                                    "&:hover": {
                                        color: "#388E3C",
                                    },
                                    transition: "color 0.3s ease",
                                }}
                            />
                        </Box>
                        <IconButton
                            onClick={handleFullScreen}
                            sx={{
                                opacity: showArrows ? 1 : 0,
                                position: "absolute",
                                top: 8,
                                right: 8,
                                zIndex: 10,
                                "&:hover": {
                                    backgroundColor: "rgba(76, 175, 80, 0.3)",
                                },
                            }}
                        >
                            <FullscreenExitIcon
                                sx={{
                                    fontSize: "30px",
                                    color: "#4CAF50",
                                    "&:hover": {
                                        color: "#388E3C",
                                    },
                                    transition: "color 0.3s ease",
                                }}
                            />
                        </IconButton>
                    </>
                )}
            </Box>
            <Box
                className="slidebuttons"
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "20px",
                    "@media (max-width: 600px)": {
                        flexDirection: "row",
                        alignItems: "center",
                        gap: "10px",
                        width: "100%",
                    },
                }}
            >
                <IconButton
                    onClick={handlePrev}
                    sx={{
                        color: "#4CAF50",
                        "&:hover": {
                            color: "#388E3C",
                            backgroundColor: "rgba(76, 175, 80, 0.2)",
                        },
                        transition:
                            "color 0.3s ease, background-color 0.3s ease",
                    }}
                >
                    <ArrowBackIosIcon />
                </IconButton>
                <IconButton
                    onClick={handleFullScreen}
                    sx={{
                        color: "#4CAF50",
                        "&:hover": {
                            color: "#388E3C",
                            backgroundColor: "rgba(76, 175, 80, 0.2)",
                        },
                        transition:
                            "color 0.3s ease, background-color 0.3s ease",
                    }}
                >
                    {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
                <IconButton
                    onClick={handleNext}
                    sx={{
                        color: "#4CAF50",
                        "&:hover": {
                            color: "#388E3C",
                            backgroundColor: "rgba(76, 175, 80, 0.2)",
                        },
                        transition:
                            "color 0.3s ease, background-color 0.3s ease",
                    }}
                >
                    <ArrowForwardIosIcon />
                </IconButton>
            </Box>
            {lessonSlides &&
                lessonSlides.length > 0 &&
                lessonSlides[currentSlideIndex]?.speakerNotes && (
                    <Paper
                        elevation={3}
                        sx={{
                            mt: 2,
                            p: 2,
                            bgcolor: "background.paper",
                            color: "text.primary",
                            border: (theme) => `1px solid ${theme.palette.divider}`,
                            maxHeight: 200,
                            overflowY: "auto",
                        }}
                    >
                        <Typography
                            variant="h6"
                            sx={{
                                color: "text.primary",
                                fontWeight: 700,
                            }}
                        >
                            Speaker Notes:
                        </Typography>

                        <Typography
                            sx={{
                                color: "text.primary",
                            }}
                        >
                            {lessonSlides[currentSlideIndex]?.speakerNotes}
                        </Typography>
                    </Paper>
                )}
        </Box>
    );
};

export default LessonSlides;
