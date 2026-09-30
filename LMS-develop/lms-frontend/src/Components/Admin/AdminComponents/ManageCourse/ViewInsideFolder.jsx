import CloudPdfViewer from "@cloudpdf/viewer";
import CloseIcon from "@mui/icons-material/Close";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Modal,
    Tab,
    Table,
    TableCell,
    TableHead,
    TableRow,
    Tabs,
    Typography
} from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import File from "./File";
import ResourceFolder from "./ViewResourceFolder";
// import QuestionForm from "./QuestionForm";

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
    const [isFileModalOpen, setIsFileModalOpen] = useState(false);
    const viewerRef = useRef(null);
    const [ok, setOk] = useState(false);
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const { id } = useParams();
    const [files, setFiles] = useState([]);
    const [chapterId, setChapterId] = useState(location.state.chapterId);
    const [documentId, setDocumentId] = useState("");

    const [displayFile, setDisplayFile] = useState(false);

    const [value, setValue] = useState("folders");

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [parentId, setParentId] = useState("");
    const [allFolders, setAllFolders] = useState([]);
    const [order, setOrder] = useState(false);
    const [loading, setLoading]=useState(true)
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
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `${
                        import.meta.env.VITE_API_URL
                    }/chapters/get/folders/${chapterId}/${id}`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            'Authorization': `Bearer ${token}`
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
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `${
                        import.meta.env.VITE_API_URL
                    }/chapters/get/files/${chapterId}/${id}`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            'Authorization': `Bearer ${token}`
                        },
                    }
                );
                setParentId(id);
                const orderedFiles = response.data.files.sort((a, b) => {
                    return b.name.localeCompare(a.name); // Descending order
                });

                setFiles(orderedFiles);
                setLoading(false)
            } catch (error) {
                console.error("Error fetching folders:", error);
                setFiles([]);
            }
        };
        fetchFolders();
    }, [chapterId, id]);

    const changeParentId = (id) => {
        setParentId(id);
    };

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

                {allFolders.length === 0 && files.length === 0 && (
                    <p style={{ fontSize: "20px" }}>
                        Nothing is available here currently.
                    </p>
                )}

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
    //         <QuestionForm chapterId={chapterId}/>
                
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
        <>
        {loading && 
            <Box sx={{width: "100%",
                height: "60vh",
                display:'flex',
                flexDirection:'column',
                justifyContent:'center',
                alignItems:'center'
                }}>
            <CircularProgress />
            </Box>
            }
            {!loading &&
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
                {/* <Tab
                    value="question-paper-generator"
                    label="Question Paper Generator"
                /> */}
            </Tabs>
            {renderTabs()}
        </Box>
        }
            </>
    );
}

export default AddWorksheet;
