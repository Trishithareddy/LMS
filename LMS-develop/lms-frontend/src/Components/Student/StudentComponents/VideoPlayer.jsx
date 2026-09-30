import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Box, IconButton } from '@mui/material';
import Player from '@vimeo/player';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';

const VideoPlayer = ({ chapterId, studentId, videoLessons, currentVideoIndex, onVideoChange,timeInterval }) => {
    const [timeSpentOnVideo, setTimeSpentOnVideo] = useState(0);
    const [lastSavedTime, setLastSavedTime] = useState(0);

    const timeSpentRef = useRef(0);
    const lastSavedTimeRef = useRef(0);
    const timerRef = useRef(null);
    const positionCheckerRef = useRef(null);
    const lastTimestampRef = useRef(null);
    const playerRef = useRef(null);
    const vimeoPlayerRef = useRef(null);
    const isTimeCountingEnabled = useRef(false);
    const hasReachedLastSavedTime = useRef(false);
    const lastCheckedTime = useRef(0);
    const isVideoPlaying = useRef(false);

    // Fetch time interval when component mounts
    

    const updateTimes = (newTime) => {
        
        setTimeSpentOnVideo(newTime);
        setLastSavedTime(newTime);
        lastSavedTimeRef.current = newTime;
    };

    const fetchVideoProgress = async (videoIndex) => {
        try {
            const token = localStorage.getItem('token');
          
            
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/progress/getvideoprogress/${studentId}/${videoIndex}/${chapterId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            if (response.data.success) {
                const timeSpent = response.data.data.timeSpent || 0;
               
                updateTimes(timeSpent);
                hasReachedLastSavedTime.current = false;
                return timeSpent;
            }
            return 0;
        } catch (error) {
            console.error('Error fetching video progress:', error);
            return 0;
        }
    };

    const updateVideoTime = async (timeSpent) => {

        const token = localStorage.getItem('token');
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/progress/videoprogress`, {
                chapterId,
                studentId,
                videoIndex: currentVideoIndex,
                videoTimeSpent: timeSpent
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            if (response.data.success) {
                const updatedTimeSpent = response.data.data.videoProgress.timeSpent;
                updateTimes(updatedTimeSpent);
            }
        } catch (error) {
            console.error('Error updating video time:', error);
        }
    };

    const checkPosition = async () => {
        if (!vimeoPlayerRef.current) return;
        
        try {
            const currentTime = await vimeoPlayerRef.current.getCurrentTime();
            const TOLERANCE = 1;
            
            const isPlayingContinuously = Math.abs(currentTime - lastCheckedTime.current) <= 1.1;
            lastCheckedTime.current = currentTime;
    
            if (!hasReachedLastSavedTime.current) {
                if (lastSavedTimeRef.current === 0) {
                   
                    hasReachedLastSavedTime.current = true;
                    isTimeCountingEnabled.current = true;
                    if (isVideoPlaying.current) {

                        startTimeCounter();
                    }
                    return;
                }

                const isBeforeSavedTime = currentTime <= (lastSavedTimeRef.current + TOLERANCE);
                
                if (currentTime >= lastSavedTimeRef.current && isPlayingContinuously && isBeforeSavedTime) {
                   
                    hasReachedLastSavedTime.current = true;
                    isTimeCountingEnabled.current = true;
                    if (isVideoPlaying.current) {
                       
                        startTimeCounter();
                    } else {
                        console.log('Video is paused - Waiting for play to start counting');
                    }
                } else if (currentTime > (lastSavedTimeRef.current + TOLERANCE)) {
                    isTimeCountingEnabled.current = false;
                }
            }
            else if (currentTime < (lastSavedTimeRef.current - TOLERANCE)) {
                
                hasReachedLastSavedTime.current = false;
                isTimeCountingEnabled.current = false;
            }
        } catch (error) {
            console.error('Error checking position:', error);
        }
    };

    const startTimer = () => {
       
        
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        if (positionCheckerRef.current) {
            clearInterval(positionCheckerRef.current);
        }
    
        lastCheckedTime.current = 0;
        if (lastSavedTimeRef.current === 0) {
            hasReachedLastSavedTime.current = true;
            isTimeCountingEnabled.current = true;
        }
        positionCheckerRef.current = setInterval(checkPosition, 1000);
    };

    const startTimeCounter = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    
    
        lastTimestampRef.current = Date.now();
        timeSpentRef.current = 0;
    
        timerRef.current = setInterval(async () => {
            if (!isVideoPlaying.current) {
               
                clearInterval(timerRef.current);
                return;
            }
            const currentTime = await vimeoPlayerRef.current.getCurrentTime();
            timeSpentRef.current += timeInterval;
            lastTimestampRef.current = Date.now();

            updateVideoTime(timeInterval);
        }, timeInterval * 1000);
    };

    const stopTimer = async () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        if (positionCheckerRef.current) {
            clearInterval(positionCheckerRef.current);
        }
        
        if (hasReachedLastSavedTime.current && isTimeCountingEnabled.current && lastTimestampRef.current) {
            const currentTime = await vimeoPlayerRef.current.getCurrentTime();
            if (currentTime > lastSavedTimeRef.current) {
                const timeSinceLastUpdate = Math.min(
                    Math.floor((Date.now() - lastTimestampRef.current) / 1000),
                    timeInterval
                );
                
                if (timeSinceLastUpdate > 0 && timeSinceLastUpdate < timeInterval) {
                 
                    await updateVideoTime(timeSinceLastUpdate);
                }
            }
        }
        
        timeSpentRef.current = 0;
        lastTimestampRef.current = null;
    };

    const handleSeek = async (data) => {
     
        hasReachedLastSavedTime.current = false;
        isTimeCountingEnabled.current = false;
        await checkPosition();
    };

    useEffect(() => {  
        const initializeVimeoPlayer = async () => {
            if (videoLessons.length > 0) {
                const iframe = document.querySelector('iframe');
                if (iframe) {
                    vimeoPlayerRef.current = new Player(iframe);
                    vimeoPlayerRef.current.off('*');
        
                    const initialTimeSpent = await fetchVideoProgress(currentVideoIndex);
                    hasReachedLastSavedTime.current = initialTimeSpent === 0;
                    isTimeCountingEnabled.current = initialTimeSpent === 0;
                    lastSavedTimeRef.current = initialTimeSpent;
        
                    vimeoPlayerRef.current.on('loaded', async () => {
                      
                        await vimeoPlayerRef.current.setCurrentTime(initialTimeSpent);
                        checkPosition();
                        
                        if (initialTimeSpent === 0) {
                            hasReachedLastSavedTime.current = true;
                            isTimeCountingEnabled.current = true;
                        }
                    });
        
                    vimeoPlayerRef.current.on('play', async () => {
                        isVideoPlaying.current = true;
                        if (lastSavedTimeRef.current === 0 || 
                            (hasReachedLastSavedTime.current && isTimeCountingEnabled.current)) {
                            startTimer();
                            startTimeCounter();
                        }
                    });
                    
                    vimeoPlayerRef.current.on('pause', async () => {
                        if (!isVideoPlaying.current) return;
                        const currentTime = await vimeoPlayerRef.current.getCurrentTime();
                        isVideoPlaying.current = false;
                        await stopTimer();
                    });

                    vimeoPlayerRef.current.on('ended', () => {
                    
                        isVideoPlaying.current = false;
                        stopTimer();
                    });

                    vimeoPlayerRef.current.on('seeked', handleSeek);

                    vimeoPlayerRef.current.on('loaded', () => {
                        
                        checkPosition();
                    });

                    vimeoPlayerRef.current.on('error', (error) => {
                        console.error('Vimeo player error:', error);
                    });
                } else {
                    console.error('No iframe found for Vimeo player initialization');
                }
            }
        };

        initializeVimeoPlayer();

        return () => {
           
            stopTimer();
            if (vimeoPlayerRef.current) {
                vimeoPlayerRef.current.off('play');
                vimeoPlayerRef.current.off('pause');
                vimeoPlayerRef.current.off('ended');
                vimeoPlayerRef.current.off('seeked');
                vimeoPlayerRef.current.off('loaded');
                vimeoPlayerRef.current.off('error');
            }
        };
    }, [currentVideoIndex, videoLessons, chapterId, studentId]);

    const handleVideoChange = async (newIndex) => {
        
        await stopTimer();
        onVideoChange(newIndex);
        hasReachedLastSavedTime.current = false;
        isTimeCountingEnabled.current = false;
        isVideoPlaying.current = false;
    };

    const handlePreviousVideo = () => {
        if (currentVideoIndex > 0) {
           
            handleVideoChange(currentVideoIndex - 1);
        } else {
            console.log('Already at first video, cannot go previous');
        }
    };

    const handleNextVideo = () => {
        if (currentVideoIndex < videoLessons.length - 1) {
        
            handleVideoChange(currentVideoIndex + 1);
        } else {
            console.log('Already at last video, cannot go next');
        }
    };

    return (
        <Box
            sx={{
                margin: "5px auto",
                width: "100%",
                maxWidth: "100%",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: {
                    xs: "0 20px",
                    sm: "0 150px",
                    md: "0 200px",
                },
                boxSizing: "border-box",
            }}
        >
            {videoLessons.length > 0 && (
                <>
                    <Box
                        dangerouslySetInnerHTML={{
                            __html: videoLessons[currentVideoIndex].videoUrl,
                        }}
                        sx={{
                            width: "100%",
                            maxWidth: { xs: "100%", sm: "90%" },
                            backgroundColor: "black",
                            borderRadius: "5px",
                            overflow: "hidden",
                        }}
                    />
                    <Box
                        sx={{
                            marginTop: 1,
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            maxWidth: { xs: "100%", sm: "90%" },
                        }}
                    >
                        <IconButton
                            onClick={handlePreviousVideo}
                            disabled={currentVideoIndex === 0}
                            sx={{
                                color: "#4CAF50",
                                backgroundColor: "transparent",
                                "&:hover": {
                                    backgroundColor: "rgba(76, 175, 80, 0.1)",
                                    borderColor: "#388E3C",
                                    color: "#388E3C",
                                },
                                "&:disabled": {
                                    opacity: 0.5,
                                    cursor: "not-allowed",
                                },
                                transition: "all 0.3s ease",
                                padding: "8px",
                            }}
                        >
                            <ArrowBackIosIcon />
                        </IconButton>
                        <IconButton
                            onClick={handleNextVideo}
                            disabled={currentVideoIndex === videoLessons.length - 1}
                            sx={{
                                color: "#4CAF50",
                                backgroundColor: "transparent",
                                "&:hover": {
                                    backgroundColor: "rgba(76, 175, 80, 0.1)",
                                    borderColor: "#388E3C",
                                    color: "#388E3C",
                                },
                                "&:disabled": {
                                    opacity: 0.5,
                                    cursor: "not-allowed",
                                },
                                transition: "all 0.3s ease",
                                padding: "8px",
                            }}
                        >
                            <ArrowForwardIosIcon />
                        </IconButton>
                    </Box>
                </>
            )}
        </Box>
    );
};

export default VideoPlayer;