import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Container,
    Typography,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Select,
    MenuItem,
    FormControl
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
} from '@mui/icons-material';

const ViewScratchProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('name');

    const SCRATCH_BASE_URL = 'https://myailab.opencs.in';

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError('No authentication token found');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/scratch/get-scratch`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

        

            // Check if response.data exists and has the expected structure
            if (response.data && Array.isArray(response.data.data)) {
                setProjects(response.data.data);
            } else {
                console.error('Unexpected API response structure:', response.data);
                setProjects([]);
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching projects:', err);
            setError(err.response?.data?.message || 'Failed to fetch projects');
            setLoading(false);
        }
    };

    const generateScratchUrl = (projectId) => {
        const token = localStorage.getItem("token");
        if (!token || !projectId) return '#';
        return `${import.meta.env.VITE_SCRATCH_URL}/${projectId}?token=${token}`;
    };

    const handleView = (projectId) => {
        if (!projectId) {
            console.error('No project ID provided');
            return;
        }
        const url = generateScratchUrl(projectId);
        if (url !== '#') {
            window.open(url, '_blank');
        }
    };

    // Safely filter projects with null checks
    const filteredProjects = React.useMemo(() => {
        if (!Array.isArray(projects)) return [];
        
        return projects.filter(project => {
            if (!project || typeof project.ScratchTitle !== 'string') return false;
            return project.ScratchTitle.toLowerCase().includes((searchQuery || '').toLowerCase());
        });
    }, [projects, searchQuery]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 3 }}>
                <Typography color="error">{error}</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 3, pb: 3 }}>
            <Typography 
                variant="h4" 
                component="h1" 
                align="center" 
                gutterBottom
                sx={{ mb: 4 }}
            >
                View Scratch Projects
            </Typography>

            <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                mb: 3,
                mx: 'auto',
                maxWidth: '800px'
            }}>
                <FormControl sx={{ minWidth: 120 }}>
                    <Select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        size="small"
                        sx={{ bgcolor: 'white' }}
                    >
                        <MenuItem value="name">Name</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ bgcolor: 'white' }}
                />
            </Box>

            <TableContainer component={Paper} elevation={1}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#2e7d32' }}>
                            <TableCell 
                                sx={{ 
                                    color: 'white', 
                                    fontWeight: 'bold',
                                    fontSize: '1rem'
                                }}
                            >
                                Course Name
                            </TableCell>
                            <TableCell 
                                sx={{ 
                                    color: 'white', 
                                    fontWeight: 'bold',
                                    fontSize: '1rem'
                                }}
                            >
                                Actions
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredProjects.length > 0 ? (
                            filteredProjects.map((project) => (
                                <TableRow 
                                    key={project._id || Math.random().toString()}
                                    sx={{ 
                                        '&:nth-of-type(odd)': { bgcolor: 'background.default' },
                                        '&:nth-of-type(even)': { bgcolor: 'action.hover' }
                                    }}
                                >
                                    <TableCell>{project.ScratchTitle}</TableCell>
                                    <TableCell>
                                        <IconButton 
                                            onClick={() => handleView(project._id)}
                                            size="small"
                                            sx={{ color: 'text.secondary' }}
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={2} align="center">
                                    No scratch projects found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default ViewScratchProjects;