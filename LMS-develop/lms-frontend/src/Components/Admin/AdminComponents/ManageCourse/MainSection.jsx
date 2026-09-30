import AddIcon from "@mui/icons-material/Add";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BreadcrumbContext } from "../../../BreadcrumbContext";

const MainSection = () => {
    const navigate = useNavigate();
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [courseName, setCourseName] = useState("");
    const [courseDescription, setCourseDescription] = useState("");
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubcategory, setSelectedSubcategory] = useState("");
    const [showCategoryFields, setShowCategoryFields] = useState(false);
    const [categoryName, setCategoryName] = useState("");
    const [categoryDescription, setCategoryDescription] = useState("");
    const [showSubcategoryFields, setShowSubcategoryFields] = useState(false);
    const [subcategoryName, setSubcategoryName] = useState("");
    const [subcategoryDescription, setSubcategoryDescription] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [alertType, setAlertType] = useState("success");
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const getToken = () => localStorage.getItem("token");

    useEffect(() => {
        setBreadcrumbTrail([
            { name: 'Admin Dashboard', path: '/admin-dashboard' },
            { name: 'Create Course', path: '/admin-dashboard/create-course' }
        ]);
    }, []);
    const fetchCategories = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/categories/getAllCategories`,
                {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                    },
                }
            );
            setCategories(response.data);

            
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchSubcategories = async (categoryId) => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/categories/getCategory/${categoryId}`,
                {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                    },
                }
            );


            setSubcategories(response.data.subcategories)
            
        } catch (error) {
            console.error("Error fetching subcategories:", error);
        }
    };

    useEffect(() => {
        fetchCategories();
       
    }, []);

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
        fetchSubcategories(e.target.value);
    };

    const handleCategorySave = async () => {
   

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/categories/addCategory`,
                { name: categoryName, description: categoryDescription },
                {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                    },
                }
            );
            

            setCategories([...categories, response.data]);
            setSelectedCategory(response.data._id); // Automatically select the new category
            setCategoryName("");
            setCategoryDescription("");
            setShowCategoryFields(false);
            setAlertType("success");
            setMessage(
                `Category "${response.data.name}" created successfully.`
            );
        } catch (error) {
            console.error(
                "Error creating category:",
                error.response?.data || error
            );
            setAlertType("error");
            setMessage("Error creating category.");
        } finally {
            setOpenSnackbar(true); // Show the Snackbar
        }
    };

    const handleSubcategorySave = async () => {
        if (!selectedCategory) {
            setAlertType("warning");
            setMessage("Please select a category first.");
            setOpenSnackbar(true); // Show the Snackbar
            return;
        }



        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/subcategories/${selectedCategory}/subcategories`,
                { name: subcategoryName, description: subcategoryDescription },
                {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                    },
                }
            );
            

            setSubcategories([...subcategories, response.data]);
            setSelectedSubcategory(response.data._id); // Automatically select the new subcategory
            setSubcategoryName("");
            setSubcategoryDescription("");
            setShowSubcategoryFields(false);
            setAlertType("success");
            setMessage(
                `Subcategory "${response.data.name}" created successfully.`
            );
        } catch (error) {
            console.error(
                "Error creating subcategory:",
                error.response?.data || error
            );
            setAlertType("error");
            setMessage("Error creating subcategory.");
        } finally {
            setOpenSnackbar(true); // Show the Snackbar
        }
    };

    const handleCourseSave = async () => {
        if (
            !selectedSubcategory ||
            !selectedCategory ||
            courseName === "" ||
            courseDescription === ""
        ) {
            setAlertType("warning");
            setMessage("Please fill the required fields.");
            setOpenSnackbar(true); // Show the Snackbar
            return;
        }



        setLoading(true);

        const formData = new FormData();
        formData.append("name", courseName);
        formData.append("description", courseDescription);
        formData.append("published", false);
        formData.append("image", file);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/courses/${selectedSubcategory}/addcourse`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setAlertType("success");
            setMessage(`Course "${response.data.name}" created successfully.`);
            setCourseName("");
            setCourseDescription("");
            setSelectedSubcategory("");
            setFile(null);
            navigate("/admin-dashboard/create-chapter?from=create-course", { 
                state: { 
                    courseId: response.data._id,
                    courseName: response.data.name 
                } 
            });
        } catch (error) {
            console.error(
                "Error creating course:",
                error.response?.data || error
            );
            setAlertType("error");
            setMessage("Error creating course.");
        } finally {
            setLoading(false);
            setOpenSnackbar(true); // Show the Snackbar
        }
    };

    return (
        <Container maxWidth="md">
            <Card variant="outlined">
                <CardContent>
                    <Typography
                        variant="h5"
                        component="h2"
                        gutterBottom
                        textAlign="center"
                    >
                        Create Course
                    </Typography>
                    <TextField
                        fullWidth
                        variant="outlined"
                        margin="normal"
                        label="Course Title"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        required
                    />
                    <TextField
                        fullWidth
                        variant="outlined"
                        margin="normal"
                        label="Course Description"
                        value={courseDescription}
                        onChange={(e) => setCourseDescription(e.target.value)}
                        multiline
                        rows={4}
                        required
                    />
                    <Box display="flex" alignItems="center" mb={2}>
                        <FormControl
                            fullWidth
                            variant="outlined"
                            margin="normal"
                            required
                        >
                            <InputLabel id="category-select-label">
                                Category
                            </InputLabel>
                            <Select
                                labelId="category-select-label"
                                value={selectedCategory}
                                onChange={handleCategoryChange}
                                label="Category"
                            >
                                {categories.map((category) => (
                                    <MenuItem
                                        key={category._id}
                                        value={category._id}
                                    >
                                        {category.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button
                            onClick={() =>
                                setShowCategoryFields(!showCategoryFields)
                            }
                            style={{ marginLeft: "10px" }}
                        >
                            <AddIcon />
                        </Button>
                    </Box>

                    {showCategoryFields && (
                        <>
                            <Box>
                                <TextField
                                    sx={{ backgroundColor: "whitesmoke" }}
                                    fullWidth
                                    variant="outlined"
                                    margin="normal"
                                    label="Category Name"
                                    value={categoryName}
                                    onChange={(e) =>
                                        setCategoryName(e.target.value)
                                    }
                                    required
                                />
                                <TextField
                                    sx={{ backgroundColor: "whitesmoke" }}
                                    fullWidth
                                    variant="outlined"
                                    margin="normal"
                                    label="Category Description"
                                    value={categoryDescription}
                                    onChange={(e) =>
                                        setCategoryDescription(e.target.value)
                                    }
                                    multiline
                                    rows={2}
                                    required
                                />
                                <Button
                                    onClick={handleCategorySave}
                                    style={{
                                        marginTop: "10px",
                                        backgroundColor: "#4caf50",
                                        color: "#fff",
                                    }}
                                >
                                    Save Category
                                </Button>
                            </Box>
                        </>
                    )}

                    <Box display="flex" alignItems="center" mb={2}>
                        <FormControl
                            fullWidth
                            variant="outlined"
                            margin="normal"
                            required
                        >
                            <InputLabel id="subcategory-select-label">
                                Subcategory
                            </InputLabel>
                            <Select
                                labelId="subcategory-select-label"
                                value={selectedSubcategory}
                                onChange={(e) =>
                                    setSelectedSubcategory(e.target.value)
                                }
                                label="Subcategory"
                            >

                              {/* we are getting problem here  */}

                                {subcategories.map((subcategory) => (
                                    <MenuItem
                                        key={subcategory._id}
                                        value={subcategory._id}
                                    >
                                        {subcategory.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button
                            onClick={() =>
                                setShowSubcategoryFields(!showSubcategoryFields)
                            }
                            style={{ marginLeft: "10px" }}
                        >
                            <AddIcon />
                        </Button>
                    </Box>

                    {showSubcategoryFields && (
                        <>
                            <TextField
                                sx={{ backgroundColor: "whitesmoke" }}
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                label="Subcategory Name"
                                value={subcategoryName}
                                onChange={(e) =>
                                    setSubcategoryName(e.target.value)
                                }
                                required
                            />
                            <TextField
                                sx={{ backgroundColor: "whitesmoke" }}
                                fullWidth
                                variant="outlined"
                                margin="normal"
                                label="Subcategory Description"
                                value={subcategoryDescription}
                                onChange={(e) =>
                                    setSubcategoryDescription(e.target.value)
                                }
                                multiline
                                rows={2}
                                required
                            />
                            <Button
                                onClick={handleSubcategorySave}
                                style={{
                                    marginTop: "10px",
                                    backgroundColor: "#4caf50",
                                    color: "#fff",
                                }}
                            >
                                Save Subcategory
                            </Button>
                        </>
                    )}

                    {loading && (
                        <Box display="flex" justifyContent="center" mt={2}>
                            <CircularProgress />
                        </Box>
                    )}

                    <Typography>Course Image</Typography>
                    <TextField
                        fullWidth
                        variant="outlined"
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                    />
                    <Button
                        onClick={handleCourseSave}
                        style={{
                            marginTop: "10px",
                            backgroundColor: "#4caf50",
                            color: "#fff",
                        }}
                    >
                        Save Course
                    </Button>

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
                </CardContent>
            </Card>
        </Container>
    );
};

export default MainSection;
