import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import { Box, IconButton, Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import "swiper/css";
import { Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const LessonSlides = ({ lessonSlides }) => {
    const swiperRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);

    const handleFullScreen = () => {
        const element = document.querySelector(".slides-container");
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            element.requestFullscreen();
        }
    };

    const handleNext = () => {
        swiperRef.current?.swiper.slideNext();
    };

    const handlePrev = () => {
        swiperRef.current?.swiper.slidePrev();
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
            >
                <Swiper
                    ref={swiperRef}
                    modules={[Keyboard]}
                    keyboard={{ enabled: true }}
                    navigation={false}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                    }}
                >
                    {lessonSlides.map((slide, index) => (
                        <SwiperSlide key={index}>
                            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                                <Box sx={{ flex: 1, overflow: "auto" }}>
                                    <div
                                        dangerouslySetInnerHTML={{ __html: slide.content }}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            transform: "scale(0.7)",
                                        }}
                                    />
                                </Box>
                                {slide.speakerNotes && (
                                    <Box 
                                        sx={{ 
                                            padding: "10px", 
                                            backgroundColor: "#f0f0f0", 
                                            borderTop: "1px solid #ccc",
                                            maxHeight: "30%",
                                            overflow: "auto"
                                        }}
                                    >
                                        <Typography variant="h6">Speaker Notes:</Typography>
                                        <Typography>{slide.speakerNotes}</Typography>
                                    </Box>
                                )}
                            </Box>
                        </SwiperSlide>
                    ))}
                </Swiper>
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
                        '&:hover': {
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        },
                    }}
                >
                    <ArrowBackIosIcon />
                </IconButton>
                <IconButton 
                    onClick={handleFullScreen} 
                    sx={{ 
                        color: "#4CAF50",
                        '&:hover': {
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        },
                    }}
                >
                    {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
                <IconButton 
                    onClick={handleNext} 
                    sx={{ 
                        color: "#4CAF50",
                        '&:hover': {
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        },
                    }}
                >
                    <ArrowForwardIosIcon />
                </IconButton>
            </Box>
        </Box>
    );
};

export default LessonSlides;