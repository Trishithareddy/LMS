import {
    Alert,
    Box,
    Button,
    Snackbar,
    Tab,
    Tabs,
    TextField,
    IconButton,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Modal,
    TableHead,
    TableRow,
    TableCell,
    TableSortLabel,
    Table,
} from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Folder } from "@mui/icons-material";
import ResourceFolder from "./ResourceFolder";
import CloudPdfViewer from "@cloudpdf/viewer";
import File from "./File";

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
    const [files, setFiles] = useState([]);
    const [chapterId, setChapterId] = useState("");
    const [documentId, setDocumentId] = useState("");
    const [fileName, setFileName] = useState("");
    const { id } = useParams();
    const [value, setValue] = useState("folders");
    const handleClose = () => setOpen(false);
    const location = useLocation();
    const [documentId1, setDocumentId1] = useState("");
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [message, setMessage] = useState("");
    const [alertType, setAlertType] = useState("success");
    const [open, setOpen] = useState(false);
    const [folderName, setFolderName] = useState(null);
    const [parentId, setParentId] = useState("");
    const [allFolders, setAllFolders] = useState([]);
    const [order, setOrder] = useState(false);
    const [isFileModalOpen, setIsFileModalOpen] = useState(false);
    const viewerRef = useRef(null);
    const [ok, setOk] = useState(false);
    const [sortConfig, setSortConfig] = useState([]);
    const [openSort, setOpenSort] = React.useState(null);
    const handleCloseSort = () => setOpenSort(null);
    const [sortClick, setSortClick] = useState("");
    

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
            const token = localStorage.getItem("token");
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${
                        import.meta.env.VITE_API_URL
                    }/chapters/get/folders/${chapterId}/${id}`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const orderedFolders = response.data.folders.sort((a, b) => {
                    return b.name.localeCompare(a.name); // Descending order
                });

                setAllFolders(orderedFolders);
            } catch (error) {
                console.error("Error fetching folders:", error);
                setAllFolders([]);
            }
        };
        fetchFolders();
    }, [chapterId, id]);

    useEffect(() => {
        const fetchFolders = async () => {
            const token = localStorage.getItem("token");
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${
                        import.meta.env.VITE_API_URL
                    }/chapters/get/files/${chapterId}/${id}`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            'Authorization':`Bearer ${token}`
                        },
                    }
                );
                setParentId(id);
                const orderedFiles = response.data.files.sort((a, b) => {
                    return b.name.localeCompare(a.name); // Descending order
                });
                setFiles(orderedFiles);
            } catch (error) {
                console.error("Error fetching folders:", error);
                setFiles([]);
            }
        };
        fetchFolders();
    }, [chapterId, id]);

    const handleChangeFolderName = (event) => {
        setFolderName(event.target.value);
    };

    const changeParentId = (id) => {
        setParentId(id);
    };

    const handleCreate = async () => {
        let folderdata = {};
        folderdata["name"] = folderName;
        folderdata["parent_id"] = id;
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
                        Authorization: `Bearer ${token}`,
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

    const folderCreation = () => {
        setOpen(true);
    };

    useEffect(() => {
        if (location.state) {
            
            setChapterId(location.state.chapterId);
        }
    }, [location]);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    function orderChange() {
        const orderedFiles = files.sort((a, b) => {
            if (order === false) {
                return a.name.localeCompare(b.name); // Ascending order
            } else {
                return b.name.localeCompare(a.name); // Descending order
            }
        });
        const orderedFolders = allFolders.sort((a, b) => {
            if (order === false) {
                return a.name.localeCompare(b.name); // Ascending order
            } else {
                return b.name.localeCompare(a.name); // Descending order
            }
        });
        setFiles(orderedFiles);
        setAllFolders(orderedFolders);
        setOrder(!order);
    }

    const folders = () => {
        if (!chapterId) {
            console.error("Error: Chapter ID is not available.");
            return;
        }

        const handleAddFileByDocumentId = async () => {
            const data = {
                chapterId: chapterId,
                fileUrl: documentId1,
                name: fileName,
                folder_id: id,
            };

            try {
                const token = localStorage.getItem("token");
                const response = await axios.post(
                    `${
                        import.meta.env.VITE_API_URL
                    }/chapters/addFileBy/documentId`,
                    data,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                setDocumentId1("");
                setFileName("");
                setMessage("File Added");
                setAlertType("success");
                setOpenSnackbar(true);
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } catch (error) {
                setMessage("Error adding File");
                setAlertType("error");
                setOpenSnackbar(true);
                console.error("Error adding file:", error);
            }
        };

        return (
            <Box sx={{ marginTop: "20px" }}>
                <Box sx={{ marginTop: "20px" }}>
                    <Box sx={{ backgroundColor: "lightgrey", padding: "20px" }}>
                        <Typography sx={{ marginBottom: "10px" }}>
                            File Name
                        </Typography>
                        <TextField
                            value={fileName}
                            fullWidth
                            variant="outlined"
                            type="text"
                            label="Name of the File"
                            onChange={(e) => setFileName(e.target.value)}
                            sx={{ marginBottom: "20px" }}
                        />
                        <div id="XXX"></div>
                        <Typography sx={{ marginBottom: "10px" }}>
                            Upload Document Id
                        </Typography>
                        <TextField
                            value={documentId1}
                            fullWidth
                            variant="outlined"
                            type="text"
                            label="Document Id"
                            onChange={(e) => {
                                setDocumentId1(e.target.value);
                            }}
                        />
                        <Button
                            variant="contained"
                            sx={{ marginTop: "10px" }}
                            onClick={handleAddFileByDocumentId}
                        >
                            Add File
                        </Button>
                    </Box>
                    {/* {error && (
                        <Typography color="error" mt={2}>
                            {error}
                        </Typography>
                    )} */}
                </Box>
                <Box
                    onClick={() => folderCreation()}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        backgroundColor: "lightgrey",
                        marginTop: "20px",
                        marginBottom: "20px",
                    }}
                >
                    <IconButton color="primary">
                        <Folder style={{ fontSize: 40 }} />
                    </IconButton>
                    <Typography variant="h6" style={{ marginLeft: "10px" }}>
                        Create Folder
                    </Typography>
                </Box>

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

                {(allFolders.length !== 0 || files.length !== 0) && (
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
                                <TableCell align="right">
                                    <IconButton size="small">
                                        <MoreVertIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                            {allFolders.length !== 0 &&
                                allFolders.map((every) => (
                                    <ResourceFolder
                                        details={every}
                                        key={every._id}
                                        chapterId={chapterId}
                                        changeParentId={changeParentId}
                                    />
                                ))}
                            {files.length !== 0 &&
                                files.map((every) => (
                                    <File
                                        details={every}
                                        key={every._id}
                                        chapterId={chapterId}
                                        openDocumentId={openDocumentId}
                                    />
                                ))}
                        </TableHead>
                    </Table>
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

    const questionPaperGenerator = () => {
        if (!chapterId) {
            console.error("Error: Chapter ID is not available.");
            return;
        }

        return (
            <Typography sx={{ marginBottom: "10px" }}>
                Coming Soon...
            </Typography>
        );
    };

    const renderTabs = () => {
        if (value === "folders") {
            return folders();
        }

        if (value === "question-paper-generator") {
            return questionPaperGenerator();
        }
    };

    return (
        <Box
            sx={{
                width: "80%",
                marginLeft: "10%",
                marginBottom: "20px",
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
                <Tab value="folders" label="Folders" />
                <Tab
                    value="question-paper-generator"
                    label="Question Paper Generator"
                />
            </Tabs>
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
