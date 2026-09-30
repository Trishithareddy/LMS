import React, { useEffect, useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import LessonSlides from "./LessonSlides";
import WorksheetKeys from "./WorksheetKeys";
import Ebook from "./Ebook";
import Practice from "./Practice";
import { useLocation, useNavigate } from "react-router-dom";

// Define an array of tabs with their labels and values
// to make tabs dynamic based on admin provided details
const tabs = [
    { label: "Lesson", value: "lesson" },
    { label: "Worksheet", value: "worksheet" },
    { label: "Ebook", value: "Ebook" },
    { label: "Practice", value: "practice" },
];

function LessonWorksheetPracticePage() {
    const [value, setValue] = React.useState(tabs[0].value);
    const [chapterDetailsRecieved, setChapterDetailsRecieved] = useState({});
    const [lessonSlides, setLessonSlides] = useState([]);

    const location = useLocation();
    useEffect(() => {
        if (location.state) {
            
            setChapterDetailsRecieved(location.state.chapterDetails);
        }
    }, [location]);

    useEffect(() => {
         

        // Extract the first key (assuming there's only one key in the object)
        const firstKey = Object.keys(chapterDetailsRecieved)[0];

        if (firstKey) {

            const lessonSlidesExtracted =
                chapterDetailsRecieved[firstKey].lessons[0]?.slides;
            setLessonSlides(lessonSlidesExtracted);
        } else {
            console.log("No key found in chapterDetailsRecieved");
        }
    }, [chapterDetailsRecieved]);

    const handleChange = (event, newValue) => {
        // Function to handle tab change
        setValue(newValue);
    };

    // Function to render text description based on selected tab
    const renderTabDescription = () => {
        switch (value) {
            case "lesson":
                return <LessonSlides lessonSlides={lessonSlides} />;
            case "worksheet":
                return <WorksheetKeys />;
            case "practice":
                return <Practice />;
            case "Ebook":
                return <Ebook />;
            default:
                return null;
        }
    };

    return (
        <>
            <Box sx={{ backgroundColor: "red", display: "contents" }}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <Tabs
                        value={value}
                        onChange={handleChange}
                        textColor="secondary"
                        indicatorColor="secondary"
                        aria-label="tabs example"
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ flexWrap: "wrap" }}
                    >
                        {tabs.map((tab) => (
                            <Tab
                                key={tab.value}
                                value={tab.value}
                                label={tab.label}
                                sx={{ flex: "1 1 auto" }}
                            />
                        ))}
                    </Tabs>
                </Box>
                <Box>
                    {renderTabDescription()}
                    {/* Render text description based on selected tab */}
                </Box>
            </Box>
        </>
    );
}

export default LessonWorksheetPracticePage;

