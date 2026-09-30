import { Box, Container, Paper, Tab, Tabs, Typography } from "@mui/material";

import React, { useState } from "react";
import ChapterEbook from "./ChapterEbook";
import ChapterLessons from "./ChapterLessons";
import ChapterVideos from "./ChapterVideos";

const ChapterDetails = () => {
  const [value, setValue] = useState("lesson");

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const renderTabContent = () => {
    switch (value) {
        case "lesson":
            return <ChapterLessons />;

      case "video":
        return <ChapterVideos/>

      case "ebook":
        return <ChapterEbook/>

      case "practice":
        return <Typography variant="h6">Practice Content Here</Typography>;

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center">
          Chapter Details
        </Typography>

        {/* Toggle Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
                value={value}
                onChange={handleChange}
                textColor="secondary"
                indicatorColor="secondary"
                aria-label="Chapter Tabs"
                variant="scrollable"
                scrollButtons="auto"
                sx={{ display: "flex" }}
            >
                <Tab
                label="Lessons"
                value="lesson"
                sx={{ flex: "1 1 auto" }}
                />
                <Tab
                label="Videos"
                value="video"
                sx={{ flex: "1 1 auto" }}
                />
                <Tab
                label="Ebook"
                value="ebook"
                sx={{ flex: "1 1 auto" }}
                />
                <Tab
                label="Practice"
                value="practice"
                sx={{ flex: "1 1 auto" }}
                />
            </Tabs>
            </Box>
        {/* Tab Content */}
        <Box sx={{ flexGrow: 1, mt: 3 }}>{renderTabContent()}</Box>
      </Paper>
    </Container>
  );
};

export default ChapterDetails;
