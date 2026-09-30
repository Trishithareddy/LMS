import {
    Box,
    Card,
    Grid,
    Typography,
    LinearProgress,
    Breadcrumbs,
    Link,
} from "@mui/material";
import { useState, useEffect } from "react";
import axios from "axios";


const courses = [
    {
        name: "Mathematics",
        progress: 80,
        breadcrumb: [
            "Chapter 1",
            "Variables",
            "Try It",
            "Try It",
            "Try It",
            "Try It",
            "Try It",
            "Try It",
            "Try It",
            "Try It",
            "Try It",
            "Try It",
            "Try It",
            "Try It",
            "Try It",
            "Try It",
        ],
    },
];

function handleClick(event) {
    event.preventDefault();

}

const courseProg = [
    {
        id: 1,
        persentage: 33
    },
    {
        id: 2,
        persentage: 43
    },
    {
        id: 3,
        persentage: 56
    },
    {
        id: 4,
        persentage: 22
    },
    {
        id: 5,
        persentage: 9
    },
    {
        id: 6,
        persentage: 42
    },
    {
        id: 8,
        persentage: 15
    },
    {
        id: 9,
        persentage: 75
    },
    {
        id: 10,
        persentage: 48
    },
    {
        id: 11,
        persentage: 28
    },
    {
        id: 12,
        persentage: 38
    },
    {
        id: 13,
        persentage: 12
    },
    {
        id: 14,
        persentage: 4
    },
    {
        id: 15,
        persentage: 8
    },
    {
        id: 16,
        persentage: 48
    },
    {
        id: 17,
        persentage: 18
    },
    {
        id: 18,
        persentage: 80
    },
    {
        id: 19,
        persentage: 48
    },
    {
        id: 20,
        persentage: 39
    },
]


const CourseProgressCard = () => {

    const [coursesData, setCoursesData] = useState(null)

    useEffect(() => {
        const fetchdata = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/student/profile`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // console.log("response", response.data)
                const data = response.data?.student
                const courseData = data.courses

                setCoursesData(courseData)

            } catch (err) {
                console.error("Error fetching student data:", err);
            }
        };
        fetchdata();
    }, []);

 
    return (
        <Card
            sx={{
                padding: "20px",
                backgroundColor: "#ffffe3",
                maxWidth: "100%",
                display: "flex",
                flexDirection: "column",
                // height: "100%",
                flexGrow: 1,
                "&:hover": { transform: "scale(1.05)" },
                transition: "transform 0.3s",
                // overflowY: "scroll",
                overflowY: "auto",
                height: '200px'

            }} className="custom-scrollbar"

        >
            <Typography variant="h5" component="h3" gutterBottom>
                Course Progress
            </Typography>
            {coursesData?.map((course, index) => (
                <Box key={index} sx={{ marginBottom: "15px", flexGrow: 1, }}>
                    <Typography variant="body1">{course.name}</Typography>
                    {/* <Breadcrumbs
                        aria-label="breadcrumb"
                        sx={{ marginBottom: "10px" }}
                    >
                        {course.breadcrumb.map((crumb, i) => (
                            <Link
                                key={i}
                                underline="hover"
                                color={
                                    i === course.breadcrumb.length - 1
                                        ? "text.primary"
                                        : "inherit"
                                }
                                href="#"
                                onClick={handleClick}
                            >
                                {crumb}
                            </Link>
                        ))}
                    </Breadcrumbs> */}
                    <LinearProgress
                        variant="determinate"
                        value={courseProg[course.courseId % 10].persentage}
                    />
                    <Typography variant="caption">
                        {courseProg[course.courseId % 10].persentage}%
                    </Typography>
                </Box>
            ))}
        </Card>
    );
};

function StudentDashboardContent() {
    return (
        <Box
            sx={{
                width: "90%",
                margin: "0 auto",
                padding: { xs: "10px", md: "20px" },
            }}
        >
            <Grid container spacing={3}>
                <Grid
                    item
                    xs={12}
                    md={6}
                    sx={{ display: "flex", flexDirection: "column" }}
                >
                    <Card
                        sx={{
                            padding: "20px",
                            backgroundColor: "#ffffe3",
                            maxWidth: "100%",
                            display: "flex",
                            flexDirection: "column",
                            flexGrow: 1,
                            "&:hover": { transform: "scale(1.05)" },
                            transition: "transform 0.3s",
                            height: '300px'

                        }}
                    >
                        <Typography variant="h5" component="h3" gutterBottom>
                            Announcements
                        </Typography>
                    
                        <Typography variant="body1">
                           10/01/2026  Submit your homework by Monday 23rd January.
                        </Typography>

                    </Card>
                </Grid>
                <Grid
                    item
                    xs={12}
                    md={6}
                    sx={{ display: "flex", flexDirection: "column" }}
                >
                    <CourseProgressCard />
                </Grid>
                <Grid
                    item
                    xs={12}
                    md={6}
                    sx={{ display: "flex", flexDirection: "column" }}
                >
                    <Card
                        sx={{
                            padding: "20px",
                            backgroundColor: "#ffffe3",
                            maxWidth: "100%",
                            display: "flex",
                            flexDirection: "column",
                            flexGrow: 1,
                            "&:hover": { transform: "scale(1.05)" },
                            transition: "transform 0.3s",
                            height: '300px'

                        }}
                    >
                        <Typography variant="h5" component="h3" gutterBottom>
                            Assessments
                        </Typography>
                        <Typography variant="body1">
                            Your next assessment is due on 5th February.
                        </Typography>
                    </Card>
                </Grid>
                <Grid
                    item
                    xs={12}
                    md={6}
                    sx={{ display: "flex", flexDirection: "column" }}
                >
                    <Card
                        sx={{
                            padding: "20px",
                            backgroundColor: "#ffffe3",
                            maxWidth: "100%",
                            display: "flex",
                            flexDirection: "column",
                            flexGrow: 1,
                            "&:hover": { transform: "scale(1.05)" },
                            transition: "transform 0.3s",
                            height: '300px'

                        }}
                    >
                        <Typography variant="h5" component="h3" gutterBottom>
                            My Learning
                        </Typography>
                        <Typography variant="body1">
                            {/* You have 3 new courses to explore. Lorem ipsum dolor
                            sit amet consectetur adipisicing elit. Dicta tempora
                            iusto pariatur ipsam, odit voluptas error dolor
                            molestias. Dicta vitae, suscipit, dolor animi eaque
                            exercitationem unde blanditiis inventore soluta ut
                            accusamus maxime rerum odit fuga. */}
                        </Typography>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default StudentDashboardContent;
