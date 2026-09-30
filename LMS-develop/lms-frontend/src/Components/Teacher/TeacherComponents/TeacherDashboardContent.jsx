// import {
//     Box,
//     Card,
//     Grid,
//     Typography,
//     LinearProgress,
//     Breadcrumbs,
//     Link,
// } from "@mui/material";
// import { ChartDataProvider } from "@mui/x-charts/ChartDataProvider";
// import { ChartsSurface } from "@mui/x-charts/ChartsSurface";
// import { LinePlot, MarkPlot } from "@mui/x-charts/LineChart";
// import { ChartsLegend } from "@mui/x-charts/ChartsLegend";
// import { ChartsTooltip } from "@mui/x-charts/ChartsTooltip";
// import { ChartsXAxis } from "@mui/x-charts/ChartsXAxis";
// import { ChartsYAxis } from "@mui/x-charts/ChartsYAxis";
// import { ChartsAxisHighlight } from "@mui/x-charts/ChartsAxisHighlight";
// import TeacherPerformanceOverview from "./TeacherPerformanceOverview";

// const pData = [3, 2, 2.5, 2, 3, 4, 2.5];
// const xLabels = [
//     "July",
//     "August",
//     "September",
//     "October",
//     "November",
//     "December",
//     "January",
// ];

// const coursesProg = [
//     {
//         batch: "SuperCoder 2.0",
//         course: "SuperCoder 2.0 Level 3",
//         progress: 33,
//     },
//     {
//         batch: "SuperCoder 2.0",
//         course: "SuperCoder 2.0 Level 5",
//         progress: 45,
//     },
//     {
//         batch: "SuperCoder 2.0",
//         course: "SuperCoder 2.0 Level 6",
//         progress: 56,
//     },
//     {
//         batch: "SuperCoder 2.0",
//         course: "SuperCoder 2.0 Level 7",
//         progress: 23,
//     },
//     {
//         batch: "SuperCoder 2.0",
//         course: "SuperCoder 2.0 Level 8",
//         progress: 24,
//     },
//     {
//         batch: "HappyCoder 2.0",
//         course: "HappyCoder 2.0 Level 3",
//         progress: 73,
//     },
//     {
//         batch: "HappyCoder 2.0",
//         course: "HappyCoder 2.0 Level 4",
//         progress: 54,
//     },
//     {
//         batch: "HappyCoder 2.0",
//         course: "HappyCoder 2.0 Level 5",
//         progress: 12,
//     },
//     {
//         batch: "HappyCoder 2.0",
//         course: "HappyCoder 2.0 Level 6",
//         progress: 88,
//     },
//     {
//         batch: "HappyCoder 2.0",
//         course: "HappyCoder 2.0 Level 7",
//         progress: 66,
//     },
//     {
//         batch: "HappyCoder 2.0",
//         course: "HappyCoder 2.0 Level 8",
//         progress: 58,
//     },
//     {
//         batch: "CreativeCoder 2.0",
//         course: "CreativeCoder 2.0 Level 3",
//         progress: 24,
//     },
//     {
//         batch: "CreativeCoder 2.0",
//         course: "CreativeCoder 2.0 Level 4",
//         progress: 39,
//     },
//     {
//         batch: "CreativeCoder 2.0",
//         course: "CreativeCoder 2.0 Level 5",
//         progress: 82,
//     },
//     {
//         batch: "CreativeCoder 2.0",
//         course: "CreativeCoder 2.0 Level 6",
//         progress: 38,
//     },
//     {
//         batch: "CreativeCoder 2.0",
//         course: "CreativeCoder 2.0 Level 7",
//         progress: 71,
//     },
//     {
//         batch: "CreativeCoder 2.0",
//         course: "CreativeCoder 2.0 Level 8",
//         progress: 49,
//     },
// ];

// const batchList = ["SuperCoder 2.0", "HappyCoder 2.0", "CreativeCoder 2.0"];

// function handleClick(event) {
//     event.preventDefault();
// }

// const CourseProgressCard = () => {
//     return (
//         <Card
//             sx={{
//                 padding: "20px",
//                 backgroundColor: "#ffffe3",
//                 maxWidth: "100%",
//                 display: "flex",
//                 flexDirection: "column",
//                 height: "300px",
//                 flexGrow: 1,
//                 "&:hover": { transform: "scale(1.05)" },
//                 transition: "transform 0.3s",
//                 // overflowY: "scroll",
//                 overflowY: "auto",
//             }}
//             className="custom-scrollbar"
//         >
//             <Typography variant="h5" component="h3" gutterBottom>
//                 Course Progress
//             </Typography>

//             {batchList.map((batch) => (
//                 <div key={batch}>
//                     <Typography
//                         variant="body1"
//                         sx={{ paddingBottom: "10px", fontWeight: "600" }}
//                     >
//                         {batch}
//                     </Typography>

//                     {coursesProg
//                         .filter((crs) => crs.batch === batch)
//                         .map((crs) => (
//                             <Box
//                                 key={crs.course}
//                                 sx={{
//                                     marginBottom: "15px",
//                                     flexGrow: 1,
//                                     paddingLeft: "20px",
//                                 }}
//                             >
//                                 <Typography variant="body1">
//                                     {crs.course}
//                                 </Typography>

//                                 <LinearProgress
//                                     variant="determinate"
//                                     value={crs.progress}
//                                 />

//                                 <Typography variant="caption">
//                                     {crs.progress}%
//                                 </Typography>
//                             </Box>
//                         ))}
//                 </div>
//             ))}
//         </Card>
//     );
// };

// function TeacherDashboardContent() {
//     return (
//         <Box
//             sx={{
//                 width: "90%",
//                 margin: "0 auto",
//                 padding: { xs: "10px", md: "20px" },
//                 boxSizing: "border-box",
//             }}
//         >
//             <Grid container spacing={3}>
//                 <Grid
//                     item
//                     xs={12}
//                     md={6}
//                     sx={{ display: "flex", flexDirection: "column" }}
//                 >
//                     <Card
//                         sx={{
//                             padding: "20px",
//                             backgroundColor: "#fffde7",
//                             maxWidth: "100%",
//                             display: "flex",
//                             flexDirection: "column",
//                             flexGrow: 1,
//                             "&:hover": { transform: "scale(1.05)" },
//                             transition: "transform 0.3s",
//                             boxSizing: "border-box",
//                         }}
//                     >
//                         <Typography variant="h5" component="h3" gutterBottom>
//                             Announcements
//                         </Typography>
//                         <p className="opacity-70 mb-2">Post by Me</p>
//                         <Typography variant="body1">
//                             10/01/2026 Submit your homework by Monday 23rd
//                             January.
//                         </Typography>
//                     </Card>
//                 </Grid>
//                 <Grid
//                     item
//                     xs={12}
//                     md={6}
//                     sx={{ display: "flex", flexDirection: "column" }}
//                 >
//                     <CourseProgressCard />
//                 </Grid>
//                 <Grid
//                     item
//                     xs={12}
//                     md={6}
//                     sx={{ display: "flex", flexDirection: "column" }}
//                 >
//                     <Card
//                         sx={{
//                             padding: "20px",
//                             backgroundColor: "#fffde7",
//                             maxWidth: "100%",
//                             display: "flex",
//                             flexDirection: "column",
//                             flexGrow: 1,
//                             "&:hover": { transform: "scale(1.05)" },
//                             transition: "transform 0.3s",
//                             height: "300px",
//                         }}
//                     >
//                         <Typography variant="h5" component="h3" gutterBottom>
//                             Assessments
//                         </Typography>
//                         <Typography variant="body1">
//                             SuperCoder 2.0 Batch : Next assessment is due on
//                             21st January
//                         </Typography>
//                     </Card>
//                 </Grid>
//                 <Grid
//                     item
//                     xs={12}
//                     md={6}
//                     sx={{ display: "flex", flexDirection: "column" }}
//                 >
//                     <Card
//                         sx={{
//                             padding: "20px",
//                             backgroundColor: "#fffde7",
//                             maxWidth: "100%",
//                             display: "flex",
//                             flexDirection: "column",
//                             flexGrow: 1,
//                             "&:hover": { transform: "scale(1.05)" },
//                             transition: "transform 0.3s",
//                             height: "300px",
//                         }}
//                     >
//                         <Typography variant="h5" component="h3" gutterBottom>
//                             Learning Stats
//                         </Typography>
//                         <Box
//                             sx={{
//                                 width: "100%",
//                                 overflow: "auto",
//                                 display: "flex",
//                                 flexDirection: "column",
//                                 alignItems: "center",
//                             }}
//                         >
//                             <ChartDataProvider
//                                 height={300}
//                                 series={[
//                                     {
//                                         type: "line",
//                                         data: pData,
//                                         label: "Avg Login Per Hour",
//                                     },
//                                 ]}
//                                 xAxis={[{ scaleType: "point", data: xLabels }]}
//                                 yAxis={[{ width: 50 }]}
//                                 margin={{
//                                     top: 30,
//                                     right: 30,
//                                     bottom: 20,
//                                     left: 20,
//                                 }}
//                             >
                                
//                                 <ChartsLegend />
//                                 <ChartsTooltip />
//                                 <ChartsSurface>
//                                     <ChartsXAxis />
//                                     <ChartsYAxis />
//                                     <LinePlot />
//                                     <MarkPlot />
//                                     <ChartsAxisHighlight x="line" />
//                                 </ChartsSurface>
//                             </ChartDataProvider>
                            
//                         </Box>
//                     </Card>
//                 </Grid>
//             </Grid>
//             <TeacherPerformanceOverview />
//         </Box>
//     );
// }

// export default TeacherDashboardContent;
import { Box, Typography } from "@mui/material";

function TeacherDashboardContent() {
    return (
       <Box sx={{ height: 300 }}>
    Dashboard Chart
</Box>
    );
}

export default TeacherDashboardContent;