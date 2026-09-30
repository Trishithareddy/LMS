import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Avatar,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  IconButton,
} from "@mui/material";
import {
  ArrowBack,
  Groups,
  CalendarToday,
  Schedule,
  Edit,
  Email,
  Phone,
} from "@mui/icons-material";

const BatchDetails = ({
  batch,
  onBack,
  onEditStudent,
  onEditTeacher,
  fetchData,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [studentPage, setStudentPage] = useState(0);
  const [teacherPage, setTeacherPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const batchStudents = batch.students;
  const batchTeachers = batch.teachers;

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleChangePage = (event, newPage) => {
    setStudentPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const handleChangePageTeacher = (event, newPage) => {
    setTeacherPage(newPage);
  };

  const handleChangeRowsPerPageTeacher = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setTeacherPage(0);
  };

  const handleEditStudent = async (student) => {
    await onEditStudent(student);
  };

  const handleEditTeacher = async (teacher) => {
    await onEditTeacher(teacher);
  };

  return (

    <>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={onBack}
          sx={{ mb: 3, color: "#2E7D32" }}
        >
          Back to Batches
        </Button>

        <Card elevation={2} sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Avatar
                  sx={{
                    backgroundColor: "#2E7D32",
                    width: 56,
                    height: 56,
                  }}
                >
                  <Groups sx={{ fontSize: 32 }} />
                </Avatar>

                <Box>
                  <Typography
                    variant="h4"
                    component="h1"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    {batch.batchName}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    {batch.courses[0].name}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label="active"
                sx={{
                  backgroundColor: "#2E7D32",
                  color: "white",
                  fontWeight: "bold",
                }}
              />
            </Box>

            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
              {batch.courses[0].description}
            </Typography>

          </CardContent>
        </Card>

        <Card elevation={2}>
          <CardContent sx={{ p: 0 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                "& .MuiTab-root.Mui-selected": {
                  color: "#2E7D32",
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#2E7D32",
                },
              }}
            >
              <Tab label={`Students (${batchStudents.length})`} />
              <Tab label={`Teachers (${batchTeachers.length})`} />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {activeTab === 0 && (
                <Box>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    Assigned Students
                  </Typography>
                  <TableContainer component={Paper} elevation={0}>
                    <Table>
                      <TableHead>
                        <TableRow
                          sx={{
                            backgroundColor: "#F5F5F5",
                          }}
                        >
                          <TableCell>
                            <strong>Name</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Grade</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Section</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Username</strong>
                          </TableCell>

                          <TableCell>
                            <strong>Status</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Actions</strong>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {batchStudents
                          .slice(
                            studentPage * rowsPerPage,
                            studentPage * rowsPerPage +
                            rowsPerPage
                          )
                          .map((student) => (
                            <TableRow
                              key={student.id}
                              hover
                            >
                              <TableCell>
                                {student.name}
                              </TableCell>

                              <TableCell>
                                <Chip
                                  label={
                                    student.class
                                  }
                                  size="small"
                                  sx={{
                                    backgroundColor:
                                      "#E8F5E8",
                                    color: "#2E7D32",
                                    fontWeight:
                                      "bold",
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                {student.section}
                              </TableCell>
                              <TableCell>
                                {student.username}
                              </TableCell>

                              <TableCell>
                                <Chip
                                  label={
                                    student.isActive
                                      ? "active"
                                      : "inactive"
                                  }
                                  size="small"
                                  sx={{
                                    backgroundColor:
                                      student.isActive ===
                                        "active"
                                        ? "#FFEBEE"
                                        : "#E8F5E8",
                                    color:
                                      student.isActive ===
                                        "active"
                                        ? "#D32F2F"
                                        : "#2E7D32",
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  onClick={() => {
                                    handleEditStudent(
                                      student
                                    )
                                  }}
                                  sx={{
                                    color: "#2E7D32",
                                  }}
                                >
                                  <Edit />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[10, 25]}
                    component="div"
                    count={batchStudents.length}
                    rowsPerPage={rowsPerPage}
                    page={studentPage}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={
                      handleChangeRowsPerPage
                    }
                  />
                </Box>
              )}

              {activeTab === 1 && (
                <Box>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    Assigned Teachers
                  </Typography>
                  <TableContainer component={Paper} elevation={0}>
                    <Table>
                      <TableHead>
                        <TableRow
                          sx={{
                            backgroundColor: "#F5F5F5",
                          }}
                        >
                          <TableCell>
                            <strong>Name</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Subject</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Username</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Status</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Actions</strong>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {batchTeachers
                          .slice(
                            teacherPage * rowsPerPage,
                            teacherPage * rowsPerPage +
                            rowsPerPage
                          )
                          .map((t) => (
                            <TableRow
                              key={t._id}
                              hover
                            >
                              <TableCell>
                                {t.teacher?.name}
                              </TableCell>
                              <TableCell>
                                Computer Sceince
                              </TableCell>
                              <TableCell>
                                {t.teacher?.username}
                              </TableCell>

                              <TableCell>
                                <Chip
                                  label="active"
                                  size="small"
                                  sx={{
                                    backgroundColor:
                                      "active" ===
                                        "active"
                                        ? "#E8F5E8"
                                        : "#FFEBEE",
                                    color:
                                      "active" ===
                                        "active"
                                        ? "#2E7D32"
                                        : "#D32F2F",
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  onClick={() => {
                                    handleEditTeacher(
                                      t.teacher
                                    )
                                  }}
                                  sx={{
                                    color: "#2E7D32",
                                  }}
                                >
                                  <Edit />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[10, 25]}
                    component="div"
                    count={batchTeachers.length}
                    rowsPerPage={rowsPerPage}
                    page={teacherPage}
                    onPageChange={handleChangePageTeacher}
                    onRowsPerPageChange={
                      handleChangeRowsPerPageTeacher
                    }
                  />
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </>



  );
};

export default BatchDetails;
