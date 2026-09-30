import CloudPdfViewer from "@cloudpdf/viewer";
import { Folder } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CircularProgress from '@mui/material/CircularProgress';
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Modal,
    Snackbar,
    Tab,
    Table,
    TableCell,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography
} from "@mui/material";
import axios from "axios";
import React, { useEffect, useRef, useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import ViewResourceFolder from "./ViewResourceFolder";

import ViewFile from "./ViewFile";

import { BreadcrumbContext } from "../../../BreadcrumbContext";

const style1 = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 300,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
    display: "flex",
    flexDirection: "column",
};

function AddWorksheet() {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [files, setFiles] = useState([]);
    const [chapterId, setChapterId] = useState("");
    const [documentId, setDocumentId] = useState("");

    const [value, setValue] = useState("folders");
    const handleClose = () => setOpen(false);
    const location = useLocation();
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [message, setMessage] = useState("");
    const [alertType, setAlertType] = useState("success");
    const [open, setOpen] = useState(false);
    const [folderName, setFolderName] = useState(null);
    const [parentId, setParentId] = useState(null);
    const [allFolders, setAllFolders] = useState([]);
    const [isFileModalOpen, setIsFileModalOpen] = useState(false);
    const viewerRef = useRef(null);
    const [ok, setOk] = useState(false);
    const [isLoading, setIsLoading] = useState({
        folders: false,
        files: false,
    });
    const [sortConfig, setSortConfig] = useState([]);
    const [openSort, setOpenSort] = React.useState(null);
    const handleCloseSort = () => setOpenSort(null);
    const [sortClick, setSortClick] = useState("");

    useEffect(() => {
        setBreadcrumbTrail([
            { name: 'Admin Dashboard', path: '/admin-dashboard' },
            { name: 'View Courses', path: '/admin-dashboard/view-courses' },
            { name: "View Resources", path: "/admin-dashboard/view-resources" },
        ]);
    }, []);
    

    const handleSortClick = (property) => {
        setOpenSort(true);
        setSortClick(property);
    };

    const handleSortRequest = (property, order) => {
        if (order === "none") {
            setSortConfig(
                sortConfig.filter((every) => every.property !== property)
            );
            handleCloseSort();
            return;
        }
        setSortConfig((prevConfig) => {
            const existingConfig = prevConfig.find(
                (config) => config.property === property
            );

            let newConfig;
            if (existingConfig) {
                // Toggle the order for this column
                newConfig = {
                    property,
                    direction: order,
                };

                let removePrevConfig = prevConfig.filter(
                    (every) => every.property !== property
                );
                // Replace the existing config
                const configurationOk = [...removePrevConfig, newConfig];

                const x = sortArrayByMultipleColumns(files, configurationOk);

                setFiles(x);
                const y = sortArrayByMultipleColumns(allFolders, configurationOk);

                setAllFolders(y);
                handleCloseSort();

                return configurationOk;
            } else {
                // Add new column sort config if not previously sorted
                newConfig = { property, direction: order };
                const configurationOk = [...prevConfig, newConfig];
                const x = sortArrayByMultipleColumns(files, configurationOk);

                setFiles(x);
                const y = sortArrayByMultipleColumns(allFolders, configurationOk);

                setAllFolders(y);

                handleCloseSort();
                return configurationOk;
            }
        });
    };
    const sortArrayByMultipleColumns = (array, sortConfig) => {
        // Create a comparison function that checks each sort configuration in order
        const compareValues = (a, b, config) => {
            const { property, direction } = config;

            let aValue, bValue;

            // Handle special string properties
            if (property === "updatedAt") {
                const dateA = new Date(a["updatedAt"]).getTime();

                const dateB = new Date(b["updatedAt"]).getTime();

                // Compare the timestamps based on the specified order
                if (direction === "ascending") {
                    return dateA - dateB;
                } else {
                    return dateB - dateA;
                }
            }
            
            aValue = a[property];
            bValue = b[property];

            
            // Handle string values
            if (typeof aValue === "string" && typeof bValue === "string") {
                return direction === "ascending"
                    ? aValue.toLowerCase().localeCompare(bValue.toLowerCase())
                    : bValue.toLowerCase().localeCompare(aValue.toLowerCase());
            }
            return 0;
        };

        let ok = [...array];
        let x;

        for (const config of sortConfig) {
            x = [...ok].sort((a, b) => {
                const comparison = compareValues(a, b, config);
                if (comparison !== 0) {
                    return comparison;
                }

                return 0;
            });
        }

        return x;
    };


    useEffect(() => {
        if (location.state) {
          
            setChapterId(location.state.chapterId);
        }
    }, [location]);

    const openDocumentId = (id) => {
        setDocumentId(id);
        setIsFileModalOpen(true);
    };

    const handleCloseModal = () => {
        setOk(false);
        setIsFileModalOpen(false);
        setDocumentId("");
        if (viewerRef.current) {
            viewerRef.current.innerHTML = "";
        }
    };

    useEffect(() => {
        const initializeViewer = async () => {
            if (documentId) {
                if (viewerRef) {
                    try {
                        await CloudPdfViewer(
                            {
                                documentId: documentId,
                                darkMode: false,
                                enableDownload: true,
                                enablePrinting: true,
                            },
                            viewerRef.current
                        );
                    } catch (error) {
                        console.error("Error initializing PDF viewer:", error);
                    }
                }
            }
        };

        if (documentId) {
            initializeViewer();
        }

        // Cleanup function
        return () => {
            if (viewerRef.current) {
                viewerRef.current.innerHTML = "";
            }
        };
    }, [documentId, isFileModalOpen, ok]);

    useEffect(() => {
        const ok1 = async () => {
            setOk(true);
        };
        if (documentId) {
            ok1();
        }
    }, [documentId]);

    useEffect(() => {
        const fetchFolders = async () => {
            if (!chapterId) {
                return;
            }

            setIsLoading((prev) => ({ ...prev, folders: true }));
            const token = localStorage.getItem("token");

            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${
                        import.meta.env.VITE_API_URL
                    }/chapters/get/folders/${chapterId}/${parentId}`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                        },
                    }
                );

                // Check if response.data exists and has folders property
                if (response.data && Array.isArray(response.data.folders)) {
                    const orderedFolders = response.data.folders.sort(
                        (a, b) => {
                            return b.name.localeCompare(a.name);
                        }
                    );
                    setAllFolders(orderedFolders);
                } else {
                    setAllFolders([]);
                }
            } catch (error) {
                console.error(
                    "Error fetching folders:",
                    error.response || error
                );
                setAllFolders([]);
                // Optionally show error to user
                setMessage("Failed to fetch folders");
                setAlertType("error");
                setOpenSnackbar(true);
            } finally {
                setIsLoading((prev) => ({ ...prev, folders: false }));
            }
        };
        fetchFolders();
    }, [chapterId, parentId]); // Added parentId as dependency

    useEffect(() => {
        const fetchFiles = async () => {
            if (!chapterId) {
                return;
            }

            setIsLoading((prev) => ({ ...prev, files: true }));
            const token = localStorage.getItem("token");
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${
                        import.meta.env.VITE_API_URL
                    }/chapters/get/files/${chapterId}/${parentId}`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            'Authorization':`Bearer ${token}`
                        },
                    }
                );

                // Check if response.data exists and has files property
                if (response.data && Array.isArray(response.data.files)) {
                    const orderedFiles = response.data.files.sort((a, b) => {
                        return b.name.localeCompare(a.name);
                    });
                    setFiles(orderedFiles);
                } else {
 
                    setFiles([]);
                }
            } catch (error) {
                console.error("Error fetching files:", error.response || error);
                setFiles([]);
                // Optionally show error to user
                setMessage("Failed to fetch files");
                setAlertType("error");
                setOpenSnackbar(true);
            } finally {
                setIsLoading((prev) => ({ ...prev, files: false }));
            }
        };
        fetchFiles();
    }, [chapterId, parentId]); // Added parentId as dependency

    const handleChangeFolderName = (event) => {
        setFolderName(event.target.value);
    };

    const changeParentId = (id) => {
        setParentId(id);
    };

    const handleCreate = async () => {
        let folderdata = {};
        folderdata["name"] = folderName;
        folderdata["parent_id"] = parentId;
        folderdata["color"] = "black";
        folderdata["chapterId"] = chapterId;
        
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/chapters/create/folder`,
                folderdata,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );

            setMessage("Folder Created");
            setAlertType("success");
            setOpenSnackbar(true);
            setOpen(false);
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            setMessage("Error creating folder");
            setAlertType("error");
            setOpenSnackbar(true);
            setError("Failed to create folder. Please try again.");
        }
    };


    const handleChange = (event, newValue) => {
        setValue(newValue);
    };



    const folders = () => {
        
        if (!chapterId) {
            return <div>Waiting for chapter ID...</div>;
        }

        return (
            <Box sx={{ marginTop: "20px" }}>
                

                <Dialog
                    open={isFileModalOpen}
                    onClose={handleCloseModal}
                    maxWidth={false}
                    PaperProps={{
                        sx: {
                            width: "90vw",
                            height: "90vh",
                            maxWidth: "none",
                            maxHeight: "none",
                        },
                    }}
                >
                    <DialogTitle
                        sx={{
                            m: 0,
                            p: 2,
                            display: "flex",
                            justifyContent: "flex-end",
                        }}
                    >
                        <IconButton
                            onClick={handleCloseModal}
                            sx={{
                                color: "grey.500",
                                "&:hover": {
                                    color: "grey.800",
                                },
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent
                        sx={{
                            p: 0,
                            height: "100%",
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            ref={viewerRef}
                            sx={{
                                width: "100%",
                                height: "100%",
                                minHeight: "500px", // Add minimum height
                                display: "block", // Ensure it's displayed
                                visibility: "visible", // Ensure it's visible
                                "& iframe": {
                                    width: "100%",
                                    height: "100%",
                                    border: "none",
                                },
                            }}
                        />
                    </DialogContent>
                </Dialog>             

                {/* First check loading states */}
                {isLoading.folders || isLoading.files ? (
                    <CircularProgress />
                ) : // If not loading, check if we have any content to show
                allFolders.length > 0 || files.length > 0 ? (
                    <Table sx={{ width: "90%", margin: "auto" }}>
                        <TableHead>
                            <TableRow>
                            <TableCell
                                sx={{
                                    
                                    color: "black",
                                    fontWeight: "600",
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        alignItems: "center",
                                    }}
                                >
                                    <Box>
                                        <Typography sx={{marginRight:'10px'}}>Name</Typography>
                                    </Box>
                                    <Box>
                                        <IconButton
                                            onClick={() =>
                                                handleSortClick("name")
                                            }
                                        >
                                            <FilterAltIcon />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </TableCell>

                            <TableCell
                                sx={{
                                    
                                    color: "black",
                                    fontWeight: "600",
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        alignItems: "center",
                                    }}
                                >
                                    <Box>
                                        <Typography sx={{marginRight:'10px'}}>Last modified</Typography>
                                    </Box>
                                    <Box>
                                        <IconButton
                                            onClick={() =>
                                                handleSortClick("updatedAt")
                                            }
                                        >
                                            <FilterAltIcon />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </TableCell>
                                <TableCell>File size</TableCell>
                                
                            </TableRow>
                            {/* Render folders */}
                            {allFolders.map((every) => (
                                <ViewResourceFolder
                                    details={every}
                                    key={every._id}
                                    chapterId={chapterId}
                                    changeParentId={changeParentId}
                                />
                            ))}
                            {/* Render files */}
                            {files.map((every) => (
                                <ViewFile
                                    details={every}
                                    key={every._id}
                                    chapterId={chapterId}
                                    openDocumentId={openDocumentId}
                                />
                            ))}
                        </TableHead>
                    </Table>
                ) : (
                    // Show empty state message if no content
                    <Typography
                        sx={{
                            textAlign: "center",
                            mt: 4,
                            color: "text.secondary",
                        }}
                    >
                        No folders or files found in this location
                    </Typography>
                )}

                <Modal
                    open={open === true}
                    onClose={handleClose}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                >
                    <Dialog open={open} onClose={handleClose}>
                        <DialogTitle>
                            <Typography variant="h6">New Folder</Typography>
                        </DialogTitle>

                        <DialogContent>
                            <TextField
                                label="Enter folder name"
                                variant="outlined"
                                fullWidth
                                value={folderName}
                                onChange={handleChangeFolderName}
                                sx={{ marginTop: "15px" }}
                            />
                        </DialogContent>

                        <DialogActions>
                            <Button
                                onClick={handleClose}
                                color="primary"
                                variant="outlined"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreate}
                                color="primary"
                                variant="contained"
                            >
                                Create
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Modal>

                <Modal
                open={openSort === true}
                onClose={handleCloseSort}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style1}>
                    {/* <Typography>Sort by : {sortClick}</Typography> */}
                    <Button
                        sx={{ marginTop: "20px", display: "inline-block" }}
                        onClick={() =>
                            handleSortRequest(sortClick, "ascending")
                        }
                    >
                        Sort in ascending order
                    </Button>
                    <Button
                        sx={{ marginTop: "20px", display: "inline-block" }}
                        onClick={() =>
                            handleSortRequest(sortClick, "descending")
                        }
                    >
                        Sort in descending order
                    </Button>
                    <Button
                        sx={{ marginTop: "20px", display: "inline-block" }}
                        onClick={() => handleSortRequest(sortClick, "none")}
                    >
                        None
                    </Button>
                </Box>
            </Modal>
            </Box>
        );
    };

    // const questionPaperGenerator = () => {
    //     if (!chapterId) {
    //         console.error("Error: Chapter ID is not available.");
    //         return;
    //     }

    //     return (
    //         <Typography sx={{ marginBottom: "10px" }}>
    //             Coming Soon...
    //         </Typography>
    //     );
    // };

    const renderTabs = () => {
        if (value === "folders") {
            return folders();
        }

        // if (value === "question-paper-generator") {
        //     return questionPaperGenerator();
        // }
    };

    return (
        <Box
            sx={{
                width: "80%",
                marginLeft: "10%",
                marginBottom: "20px",
            }}
        >
            {/* <Tabs
                value={value}
                onChange={handleChange}
                textColor="secondary"
                indicatorColor="secondary"
                aria-label="tabs example"
                variant="scrollable"
                scrollButtons="auto"
                sx={{ flexWrap: "wrap" }}
            >
                <Tab value="folders" label="Folders" />
                <Tab
                    value="question-paper-generator"
                    label="Question Paper Generator"
                />
            </Tabs> */}
            
            {renderTabs()}
            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setOpenSnackbar(false)}
                    severity={alertType}
                    sx={{ width: "100%" }}
                >
                    {message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default AddWorksheet;
