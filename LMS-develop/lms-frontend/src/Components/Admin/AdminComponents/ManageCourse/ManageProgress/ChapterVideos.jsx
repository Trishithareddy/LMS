import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import {
    Box,
    CircularProgress,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: "bold",
    backgroundColor: theme.palette.success.main, // Dark green color
    color: theme.palette.common.white,
    textAlign: "center",
    border: `1px solid ${theme.palette.divider}`, // Add borders for table structure
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": {
        backgroundColor: theme.palette.action.hover,
    },
    borderBottom: `1px solid ${theme.palette.divider}`, // Ensure row separation
}));

const CompactTableCell = styled(TableCell)({
    padding: "12px",
    textAlign: "center",
    border: "1px solid rgba(224, 224, 224, 1)", // Ensure column separation
});

const ChapterVideos = () => {
    const { chapterId } = useParams();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const videosPerPage = 3; // Show only 3 videos per page

    useEffect(() => {
        const fetchChapterVideos = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/video/chapter/${chapterId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

               

                if (response.data && response.data.videoLessons) {
                    setVideos(response.data.videoLessons);
                } else {
                    setError("No videos found for this chapter.");
                }
            } catch (err) {
                setError("Failed to fetch videos.");
            } finally {
                setLoading(false);
            }
        };

        fetchChapterVideos();
    }, [chapterId]);

    // Pagination logic
    const paginatedVideos = useMemo(() => {
        const startIndex = page * videosPerPage;
        return videos.slice(startIndex, startIndex + videosPerPage);
    }, [videos, page]);

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom align="center">
                Chapter Videos
            </Typography>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center">
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Typography color="error" align="center">{error}</Typography>
            ) : videos.length === 0 ? (
                <Typography align="center">No videos available for this chapter.</Typography>
            ) : (
                <TableContainer component={Paper} sx={{ mb: 3, borderRadius: 2 }}>
                    <Table size="medium">
                        <TableHead>
                            <TableRow>
                                <StyledTableCell sx={{ flex: 1 }}>Video</StyledTableCell>
                                <StyledTableCell sx={{ flex: 1 }}>Expected Time (secs)</StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedVideos.map((video) => (
                                <StyledTableRow key={video._id}>
                                    <CompactTableCell sx={{ width: "50%" }}>
                                        {/* Render embedded video player */}
                                        <div dangerouslySetInnerHTML={{ __html: video.videoUrl }} />
                                    </CompactTableCell>
                                    <CompactTableCell sx={{ width: "50%" }}>{video.expectedTime} secs</CompactTableCell>
                                </StyledTableRow>
                            ))}
                        </TableBody>
                    </Table>
                    
                </TableContainer>
            )}

            {/* Pagination Controls */}
            {videos.length > videosPerPage && (
    <Box display="flex" justifyContent="center" alignItems="center" mt={3}>
     
        
        <IconButton onClick={() => setPage((prev) => Math.max(prev - 1, 0))} disabled={page === 0}>
            <ArrowBackIosNewIcon />
        </IconButton>
        <Typography variant="body1" sx={{ mx: 2, color: 'text.primary' }}>
            Page {page + 1} of {Math.ceil(videos.length / videosPerPage)}
        </Typography>
        <IconButton
            onClick={() => setPage((prev) => prev + 1)}
            disabled={(page + 1) * videosPerPage >= videos.length}
        >
            <ArrowForwardIosIcon />
        </IconButton>
    </Box>
)}
        </Box>
    );
};

export default ChapterVideos;
