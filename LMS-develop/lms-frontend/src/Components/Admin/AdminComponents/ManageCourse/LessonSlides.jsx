import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import {
    Box,
    IconButton,
    Typography,
    Card,
    CardContent,
    RadioGroup,
    FormControlLabel,
    CardActions,
    Radio,
    Button,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import "swiper/css";
import "swiper/css/navigation";
import { Keyboard, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const LessonSlides = ({
    lessonSlides,
    onSlideChange,
    enableKeyboardFullScreen = true,
}) => {
    
    const swiperRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showArrows, setShowArrows] = useState(false);
    const timeoutRef = useRef(null);
    const [optedAnswer, setOptedAnswer] = useState("");
    const [showAnswer, setShowAnswer] = useState(false);
    const [correctOrNot, setCorrectOrNot] = useState(false);
    let htmlData = lessonSlides || [];

    const handleAnswer = (event) => {
        setOptedAnswer(event.target.value);
    };

    const submitQuestion = (question) => {
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

        const handleKeyPress = (event) => {
            if (
                enableKeyboardFullScreen &&
                (event.key === "f" || event.key === "F")
            ) {
                handleFullScreen();
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("keydown", handleKeyPress);

        return () => {
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange
            );
            document.removeEventListener("keydown", handleKeyPress);
        };
    }, []);

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
        const iframes = document.querySelectorAll("iframe");
        iframes.forEach((iframe) => {
            if (
                iframe.src.includes("youtube.com") ||
                iframe.src.includes("youtu.be")
            ) {
                try {
                    iframe.contentWindow.postMessage(
                        '{"event":"command","func":"pauseVideo","args":""}',
                        "*"
                    );
                } catch (error) {
                    console.error(`Error pausing YouTube video:`, error);
                }
            } else if (iframe.src.includes("vimeo.com")) {
                try {
                    iframe.contentWindow.postMessage('{"method":"pause"}', "*");
                } catch (error) {
                    console.error(`Error pausing Vimeo video:`, error);
                }
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
                        if (onSlideChange) {
                            onSlideChange(swiper.activeIndex);
                            setOptedAnswer("");
                            setCorrectOrNot(false);
                            setShowAnswer(false);
                        }
                    }}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                    }}
                >
                    <Carousel>
                        {htmlData.map((html, index) => (
                            <SwiperSlide key={index}>
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
                                            {/* <Box
                                                sx={{
                                                    backgroundColor: "yellow",
                                                    padding: "10px",
                                                    display: "flex",
                                                    flexDirection: "row",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Typography
                                                    variant="h6"
                                                    component="div"
                                                    gutterBottom
                                                >
                                                    {
                                                        html.selectedQuestion
                                                            .questionTitle
                                                    }
                                                </Typography>
                                            </Box> */}

                                            <Card
                                                sx={{
                                                    width: "80%",
                                                    margin: "auto",
                                                    mt: 4,
                                                    borderRadius:'10px'
                                                }}
                                            >
                                                <CardContent>
                                                    <Typography
                                                        variant="body1"
                                                        gutterBottom
                                                    >
                                                        <Box
                                                            sx={{
                                                                display: "flex",
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
                                                            optedAnswer || ""
                                                        }
                                                        onChange={handleAnswer}
                                                    >
                                                        {html.selectedQuestion.options.map(
                                                            (option, index) => (
                                                                <FormControlLabel
                                                                    key={index}
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
                                                        position: "relative",
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            gap: 1,
                                                        }}
                                                    >
                                                        <Button
                                                            onClick={() =>
                                                                submitQuestion(
                                                                    html.selectedQuestion
                                                                )
                                                            }
                                                        >
                                                            Submit
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
                                                                    Wrong Answer
                                                                </p>
                                                            )}
                                                        </>
                                                    )}
                                                </CardActions>
                                            </Card>
                                        </>
                                    </div>
                                )}
                            </SwiperSlide>
                        ))}
                    </Carousel>
                </Swiper>
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
                                    backgroundColor: "rgba(76, 175, 80, 0.2)", // Subtle green background on hover
                                    borderRadius: "50%", // Ensure rounded appearance
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
                                    backgroundColor: "rgba(76, 175, 80, 0.3)", // Slightly darker green on hover
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
                    // sx={{ color: isFullscreen ? "#388E3C" : "#4CAF50" }}
                    sx={{
                        color: "#4CAF50",
                        "&:hover": {
                            color: "#388E3C",
                            backgroundColor: "rgba(76, 175, 80, 0.2)", // Optional: adds a subtle background color on hover
                        },
                        transition:
                            "color 0.3s ease, background-color 0.3s ease", // Smooth transition effect
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
        </Box>
    );
};

export default LessonSlides;
