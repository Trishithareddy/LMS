import {
    Card,
    CardActionArea,
    CardContent,
    Grid,
    Typography,
} from "@mui/material";
import React from "react";
import { Link } from "react-router-dom";

const AdminCards = () => {
    const cards = [
        {
            title: "Bulk add Students",
            content: "This functionality allows to add students in bulk",
            link: "/admin-dashboard/Bulk-Add-Students",
        },
        {
            title: "Bulk add Teachers",
            content: "This functionality allows to add teachers in bulk",
            link: "/admin-dashboard/Bulk-Add-Teachers",
        },
        {
            title: "Create School",
            content: "This functionality allows to create a School",
            link: "/admin-dashboard/Create-Schools",
        },
        {
            title: "Get All Schools",
            content:
                "This functionality allows to get information of all Schools",
            link: "/admin-dashboard/ViewSchools",
        },
        {
            title: "Create Batch",
            content: "This allows to create a batch",
            link: "/admin-dashboard/CreateBatch",
        },
        {
            title: "Assign students and teachers to batch",
            content:
                "This functionality allows to add students and teachers to a batch",
            link: "/Studs-Teacher-To-Batch",
        },
        {
            title: "Deassign students/teachers from batch",
            content:
                "This functionality deassigns teachers and students from batch",
            link: "/page9",
        },
        {
            title: "Assign courses to Batch",
            content: "This functionality allows to assign a course to a batch",
            link: "/page7",
        },
        {
            title: "DeAssign courses from Batch",
            content:
                "This functionality allows to deassign a course from a batch",
            link: "/page8",
        },
        {
            title: "Create Quiz",
            content: "This functionality allows to create quiz",
            link: "/page10",
        },
        {
            title: "Assign Quiz to batch",
            content: "This functionality assign quiz to batches",
            link: "/page11",
        },
        {
            title: "DeAssign Quiz from batch",
            content: "This functionality deassigns quiz to batches",
            link: "/page12",
        },
    ];

    return (
        <Grid container spacing={2} sx={{ flex: 1 }}>
            {cards.map((card, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card
                        sx={{
                            transition: "transform 0.3s",
                            "&:hover": { transform: "scale(1.05)" },
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            backgroundColor: "#fffde7",
                        }}
                    >
                        <CardActionArea
                            component={Link}
                            to={card.link}
                            sx={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <CardContent
                                sx={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    textAlign: "center",
                                }}
                            >
                                <Typography variant="h5" component="div">
                                    {card.title}
                                </Typography>
                                <Typography
                                    sx={{ mb: 1.5 }}
                                    color="text.secondary"
                                >
                                    {card.subtitle}
                                </Typography>
                                <Typography variant="body2">
                                    {card.content}
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

export default AdminCards;
