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
    Table,
    TableHead,
    Tabs,
} from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import File from "../../Teacher/TeacherComponents/File";
import ResourceFolder from "../../Teacher/TeacherComponents/ResourceFolder";
import { ArrowBack } from "@mui/icons-material";

function AddWorksheet() {
    const [isFileModalOpen, setIsFileModalOpen] = useState(false);
    const viewerRef = useRef(null);
    const [ok, setOk] = useState(false);
    const location = useLocation();
    const { id } = useParams();
    const [files, setFiles] = useState([]);
    const [chapterId, setChapterId] = useState(location.state.chapterId);
    const [documentId, setDocumentId] = useState("");
    const [value, setValue] = useState("folders");
    const [parentId, setParentId] = useState("");
    const [allFolders, setAllFolders] = useState([]);
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate();

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
                    `${import.meta.env.VITE_API_URL
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
                    `${import.meta.env.VITE_API_URL
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
             
                 const filteredFiles = orderedFiles.filter((item) => item.isActive === true);

                setFiles(filteredFiles);
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

    };


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

            </Box>
        );
    };



    const renderTabs = () => {
        if (value === "folders") {
            return folders();
        }
    };

    return (
        <>
            {loading &&
                <Box sx={{
                    width: "100%",
                    height: "60vh",
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
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
                        sx={{
                            borderBottom: 1,
                            borderColor: "divider",
                            marginBottom: "20px",
                        }}
                    >
                        <ArrowBack onClick={() => navigate(-1)} />
                    </Tabs>
                    {renderTabs()}
                </Box>
            }
        </>
    );
}

export default AddWorksheet;
