import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";

import Login from "./Components/Login";
import ProtectedRoute from "./Components/ProtectedRoute";
import VerifyBadge from "./Components/VerifyBadges.jsx";

// Teacher Compone
import TeacherDashboard from "./Components/Teacher/TeacherDashboard";
import TeacherLabActivity from "./Components/Teacher/TeacherComponents/TeacherLabActivity.jsx";
import BatchStudents from "./Components/Teacher/TeacherComponents/BatchStudents.jsx";
import CompleteQuiz1 from "./Components/Teacher/TeacherComponents/CompleteQuiz1.jsx";
import TeacherAnnouncements from "./Components/Teacher/TeacherComponents/TeacherAnnouncements.jsx";
import SubmittedQuizzes from "./Components/Teacher/TeacherComponents/SubmittedQuizzes.jsx";
import TeacherBatchDetails from "./Components/Teacher/TeacherComponents/TeacherBatchDetails.jsx";
import TeacherBatches from "./Components/Teacher/TeacherComponents/TeacherBatches.jsx";
import TeacherInsideFolder from "./Components/Teacher/TeacherComponents/TeacherInsideFolder.jsx";
import TeacherResources from "./Components/Teacher/TeacherComponents/TeacherResources.jsx";
import ViewStudentDetails from "./Components/Teacher/TeacherComponents/ViewStudentDetails.jsx";
import Course from "./Components/Teacher/TeacherComponents/Course.jsx";
import QuestionForm from "./Components/Teacher/TeacherComponents/QuestionForm.jsx";
import TeachersProjects from "./Components/Teacher/TeacherComponents/TeacherProjects.jsx";
import StudentList from "./Components/Teacher/TeacherComponents/StudentList.jsx";
import StudentPage from "./Components/Teacher/TeacherComponents/StudentPage.jsx";
import AiraLessonPlan from "./Components/Teacher/TeacherComponents/AiraLessonPlanGenerator.jsx";

//Admin
import CandidatesToBatch from "./Components/Admin/AdminComponents/Batch/CandidatesToBatch.jsx";
import CourseToBatch from "./Components/Admin/AdminComponents/Batch/CourseToBatch.jsx";
import CreateBatch from "./Components/Admin/AdminComponents/Batch/CreateBatch";
import DeassignCandidatesFromBatch from "./Components/Admin/AdminComponents/Batch/DeassignCandidatesfromBatch.jsx";
import DeassignCourses from "./Components/Admin/AdminComponents/Batch/DeassignCourses.jsx";
import ViewBatch from "./Components/Admin/AdminComponents/Batch/ViewBatch.jsx";
import UpdateBatch from "./Components/Admin/AdminComponents/Batch/UpdateBatch.jsx";
import DeleteBatch from "./Components/Admin/AdminComponents/Batch/DeleteBatch.jsx";
import CreateSchools from "./Components/Admin/AdminComponents/CreateSchools";
import DeleteSchools from "./Components/Admin/AdminComponents/DeleteSchools.jsx";
import AddEbook from "./Components/Admin/AdminComponents/ManageCourse/AddEbook.jsx";
import AddLabActivity from "./Components/Admin/AdminComponents/ManageCourse/AddLabActivity.jsx";

import ChapterMainSection from "./Components/Admin/AdminComponents/ManageCourse/ChapterMainSection.jsx";
import EditCourse from "./Components/Admin/AdminComponents/ManageCourse/EditCourse.jsx";
import InsideFolder from "./Components/Admin/AdminComponents/ManageCourse/InsideFolder.jsx";
import Lesson from "./Components/Admin/AdminComponents/ManageCourse/Lesson.jsx";
import MainSection from "./Components/Admin/AdminComponents/ManageCourse/MainSection.jsx";
import Resources from "./Components/Admin/AdminComponents/ManageCourse/Resources.jsx";
import UpdateCourses from "./Components/Admin/AdminComponents/ManageCourse/UpdateCourses.jsx";
import VideoLessons from "./Components/Admin/AdminComponents/ManageCourse/VideoLessons.jsx";
import ViewCourses from "./Components/Admin/AdminComponents/ManageCourse/ViewCourses.jsx";
import ViewInsideFolder from "./Components/Admin/AdminComponents/ManageCourse/ViewInsideFolder.jsx";
import ViewResources from "./Components/Admin/AdminComponents/ManageCourse/ViewResources.jsx";
import Worksheet from "./Components/Admin/AdminComponents/ManageCourse/Worksheet.jsx";
import ViewSchools from "./Components/Admin/AdminComponents/ViewSchools";
import UpdateSchool from "./Components/Admin/AdminComponents/UpdateSchools.jsx";
import AdminDashboard from "./Components/Admin/AdminDashboard";
import AdminOverview from "./Components/Admin/AdminOverview.jsx";
import SchoolUsageReports from "./Components/Admin/SchoolUsageReports.jsx";
import BulkAddStudents from "./Components/Admin/BulkAddStudents";
import BulkAddTeachers from "./Components/Admin/BulkAddTeachers";
import CompleteQuestion from "./Components/Admin/CompleteQuestion.jsx";
import CompleteQuiz from "./Components/Admin/CompleteQuiz.jsx";
import EditQuestion from "./Components/Admin/EditQuestion.jsx";
import EditQuiz from "./Components/Admin/EditQuiz.jsx";
import QuestionBaseTabs from "./Components/Admin/QuestionBaseTabs.jsx";
import ViewStudents from "./Components/Admin/ViewStudents.jsx";
import ViewTeachers from "./Components/Admin/ViewTeachers.jsx";
import DuplicateCourses from "./Components/Admin/AdminComponents/ManageCourse/DuplicateCourses.jsx";
import ScratchSection from "./Components/Admin/AdminComponents/Scratch-Section/ScratchSection.jsx";
import AllBatches from "./Components/Admin/AdminComponents/ManageCourse/ManageProgress/AllBatches.jsx";
import ChapterDetails from "./Components/Admin/AdminComponents/ManageCourse/ManageProgress/ChapterDetails.jsx";
import ChaptersWithinCourse from "./Components/Admin/AdminComponents/ManageCourse/ManageProgress/ChaptersWithinCourse.jsx";
import CoursesWithinBatch from "./Components/Admin/AdminComponents/ManageCourse/ManageProgress/CoursesWithinBatch.jsx";
import Terminal from "./Components/Admin/AdminComponents/ManageCourse/Terminal.jsx";
import DeleteMultipleStudents from "./Components/Admin/DeleteBulkStudents.jsx";
import DeleteMultipleTeachers from "./Components/Admin/DeleteBulkTeachers.jsx";

// Student Components
import { BreadcrumbProvider } from "./Components/BreadcrumbContext.jsx";
import HTMLTerminal from "./Components/IndependentTerminals/HtmlCss.jsx";
import JavaScriptTerminal from "./Components/IndependentTerminals/Javascript.jsx";
import PythonTerminal from "./Components/IndependentTerminals/Python.jsx";
import AttemptQuiz from "./Components/Student/StudentComponents/AttemptQuiz.jsx";
import LessonWorksheetPracticePage from "./Components/Student/StudentComponents/LessonWorksheetPracticePage.jsx";
import MyLearning from "./Components/Student/StudentComponents/MyLearning.jsx";
import StudentAnnouncements from "./Components/Student/StudentComponents/StudentAnnouncements.jsx";
import StudentAttendance from "./Components/Student/StudentComponents/StudentAttendance.jsx";
import StudentAssessments from "./Components/Student/StudentComponents/StudentAssessments.jsx";
import StudentCourse from "./Components/Student/StudentComponents/StudentCourse";
import StudentProjects from "./Components/Student/StudentComponents/StudentProjects.jsx";
import StudentDashboard from "./Components/Student/StudentDashboard";
import StudentLabActivity from "./Components/Student/StudentComponents/StudentLabActivity.jsx";
import StudentHome from "./Components/Student/StudentComponents/StudentHome.jsx";

// Scratch URLS
import ScratchTerminal from "./Components/IndependentTerminals/ScratchTerminal.jsx";
// import DestinationModal from "./Components/Modal.jsx";
import ViewScratchProjects from "./Components/Admin/AdminComponents/Scratch-Section/ViewScratchProjects.jsx";
import QuestionsAvl from "./Components/Admin/QuetionsAvl.jsx";
import UpdateScratchProjects from "./Components/Admin/AdminComponents/Scratch-Section/UpdateScratchProjects.jsx";
import EditScratchProject from "./Components/Admin/AdminComponents/Scratch-Section/EditScratchProject.jsx";
import ProjectPractice from "./Components/Student/StudentComponents/ProjectPractice.jsx";
import CreateSchoolAdmin from "./Components/SchoolAdmin/CreateSchoolAdmin.jsx";
import UpdateSchoolAdmin from "./Components/SchoolAdmin/UpdateSchoolAdmin.jsx";
import AssignTobatch from "./Components/SchoolAdmin/AssignTobatch.jsx";
import ViewSchoolAdmin from "./Components/SchoolAdmin/ViewSchoolAdmin.jsx";
import EditSchoolAdmin from "./Components/SchoolAdmin/EditSchoolAdmin.jsx";
import SchoolAdminDashboard from "./Components/SchoolAdmin/SchoolAdminDashboard/SchoolAdminDashboard.jsx";
import SuperAdminLogin from "./Components/SuperAdminLogin.jsx";
import StudentResources from "./Components/Student/StudentComponents/StudentResource.jsx";
import StudentInsideFolder from "./Components/Student/StudentComponents/StudentInsideFolder.jsx";
import QuizResult from "./Components/Student/StudentQuizSection/components/QuizResult.jsx";
import QuizAttemptWrapper from "./Components/Student/StudentQuizSection/components/QuizAttemptWrapper.jsx";
import ViewQuizDetails from "./Components/Admin/ViewQuizDetails.jsx";
import QuizList from "./Components/Student/StudentQuizSection/components/QuizList.jsx";
import StudentQuizView from "./Components/Student/StudentQuizSection/components/StudentQuizView.jsx";
import QuizTabs from "./Components/Admin/QuizTabs.jsx";
import AssessmentCenter from "./Components/Teacher/TeacherComponents/AssessmentCenter.jsx";
import LiveQuizJoin from "./Components/Student/StudentQuizSection/components/LiveQuizJoin.jsx";
import LoginV2 from "./Components/LoginSection/Login.jsx";
import TeacherBadges from "./Components/Teacher/TeacherComponents/TeacherBadges.jsx";
import StudentBadges from "./Components/Student/StudentComponents/StudentBadges.jsx";
import SkillTest from "./Components/Admin/AdminComponents/ManageCourse/ViewCoursesComponents/SkillTest.jsx";
import BadgeList from "./Components/Admin/AdminComponents/Badges/BadgesList.jsx";
import CreateBadge from "./Components/Admin/AdminComponents/Badges/CreateBadge.jsx";
import EditBadge from "./Components/Admin/AdminComponents/Badges/EditBadge.jsx";
import AssignBadgeToCourse from "./Components/Admin/AdminComponents/Badges/AssignBadgeToCourse.jsx";
import AwardBadge from "./Components/Admin/AdminComponents/Badges/AwardBadge.jsx";
import ChapterQuiz from "./Components/Admin/AdminComponents/Chapter-Quiz/ChapterQuiz.jsx";
import ChapterQuizInStudent from "./Components/Student/StudentComponents/ChapterQuizInStudent.jsx";
import ChapterQuizResultInStudent from "./Components/Student/StudentComponents/ChapterQuizResultInStudent.jsx";
import TeacherHome from "./Components/Teacher/TeacherComponents/TeacherHome.jsx";
import TeacherAttendance from "./Components/Teacher/TeacherComponents/TeacherAttendance.jsx";
import TeacherAssignments from "./Components/Teacher/TeacherComponents/TeacherAssignments.jsx";
import StudentAssignments from "./Components/Student/StudentComponents/StudentAssignments.jsx";
import SubmittedQuizCard from "./Components/Teacher/TeacherComponents/SubmittedQuizCard.jsx";
import AiraLessonPlanGenerator from "./Components/Teacher/TeacherComponents/AiraLessonPlanGenerator.jsx";

function App() {
    return (
        <Router>
            <Routes>
                {/* Base Routes */}
                <Route path="/" element={<Login />} />
                {/* <Route path="/verifybadges" element={<VerifyBadge />} /> */}
                <Route path="/verify" element={<VerifyBadge />} />

                <Route path="/super-admin" element={<SuperAdminLogin />} />

                {/* <Route path="/modal" element={<DestinationModal />} /> */}
                <Route path="test/QuestionsAvl" element={<QuestionsAvl />} />
                <Route
                    path="resources/folder/:id"
                    element={<TeacherInsideFolder />}
                />

                {/* School Admin Routes */}
                <Route
                    path="/school-admin-dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["school-admin"]}>
                            <SchoolAdminDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Admin Routes */}
                <Route
                    path="/admin-dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                            <BreadcrumbProvider>
                                <AdminDashboard />
                            </BreadcrumbProvider>
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<AdminOverview />} />
                    <Route path="school-usage-reports" element={<SchoolUsageReports />} />
                    <Route
                        path="bulk-add-students"
                        element={<BulkAddStudents />}
                    />
                    <Route
                        path="bulk-add-teachers"
                        element={<BulkAddTeachers />}
                    />
                    <Route
                        path="delete-bulk-students"
                        element={<DeleteMultipleStudents />}
                    />
                    <Route
                        path="delete-bulk-teachers"
                        element={<DeleteMultipleTeachers />}
                    />
                    <Route path="create-schools" element={<CreateSchools />} />
                    <Route path="view-schools" element={<ViewSchools />} />
                    <Route path="update-schools" element={<UpdateSchool />} />
                    <Route path="delete-batch" element={<DeleteBatch />} />
                    <Route path="delete-schools" element={<DeleteSchools />} />
                    <Route path="create-batch" element={<CreateBatch />} />
                    <Route path="create-course" element={<MainSection />} />
                    <Route path="lesson-slides" element={<Lesson />} />
                    <Route path="add-ebook" element={<AddEbook />} />
                    <Route
                        path="add-lab-activity"
                        element={<AddLabActivity />}
                    />
                    <Route path="terminal" element={<Terminal />} />
                    <Route path="add-worksheet" element={<Worksheet />} />
                    <Route path="video" element={<VideoLessons />} />
                    <Route
                        path="question-base-tabs"
                        element={<QuestionBaseTabs />}
                    />
                    <Route
                        path="complete-question"
                        element={<CompleteQuestion />}
                    />
                    <Route path="edit-question" element={<EditQuestion />} />
                    <Route path="quiz-tabs" element={<QuizTabs />} />
                    <Route path="skill-test" element={<SkillTest />} />
                    <Route path="add-resources" element={<Resources />} />
                    <Route
                        path="add-worksheet-new/folder/:id"
                        element={<InsideFolder />}
                    />
                    <Route path="view-resources" element={<ViewResources />} />
                    <Route
                        path="view/inside/folder/:id"
                        element={<ViewInsideFolder />}
                    />
                    <Route
                        path="create-chapter"
                        element={<ChapterMainSection />}
                    />
                    <Route
                        path="create-chapterquiz/:chapterId"
                        element={<ChapterQuiz />}
                    />
                    <Route
                        path="assign-candidates-to-batch"
                        element={<CandidatesToBatch />}
                    />
                    <Route
                        path="assign-courses-to-batch"
                        element={<CourseToBatch />}
                    />
                    <Route path="view-batch" element={<ViewBatch />} />
                    <Route path="update-batch" element={<UpdateBatch />} />
                    <Route path="view-students" element={<ViewStudents />} />
                    <Route path="view-Teachers" element={<ViewTeachers />} />
                    <Route path="view-Courses" element={<ViewCourses />} />
                    <Route path="update-Courses" element={<UpdateCourses />} />
                    <Route path="edit-course" element={<EditCourse />} />
                    <Route
                        path="duplicate-course"
                        element={<DuplicateCourses />}
                    />
                    <Route
                        path="deassign-Candidates"
                        element={<DeassignCandidatesFromBatch />}
                    />
                    <Route
                        path="deassign-Courses"
                        element={<DeassignCourses />}
                    />
                    <Route
                        path="manageCourse-allbatches"
                        element={<AllBatches />}
                    />
                    <Route
                        path="coursesWithinBatch/:batchId"
                        element={<CoursesWithinBatch />}
                    />
                    <Route
                        path="chaptersWithinCourse/:courseId"
                        element={<ChaptersWithinCourse />}
                    />
                    <Route
                        path="chapterDetails/:chapterId"
                        element={<ChapterDetails />}
                    />
                    <Route path="badges" element={<BadgeList />} />
                    <Route path="badges/create" element={<CreateBadge />} />
                    <Route path="badges/:id/edit" element={<EditBadge />} />
                    <Route path="create-scratch" element={<ScratchSection />} />
                    <Route
                        path="view-scratch"
                        element={<ViewScratchProjects />}
                    />
                    <Route
                        path="update-scratch"
                        element={<UpdateScratchProjects />}
                    />
                    <Route
                        path="edit-scratch"
                        element={<EditScratchProject />}
                    />
                    // school admin routes
                    <Route
                        path="create-school-admin"
                        element={<CreateSchoolAdmin />}
                    />
                    <Route
                        path="view-school-admin"
                        element={<ViewSchoolAdmin />}
                    />
                    <Route
                        path="update-school-admin"
                        element={<UpdateSchoolAdmin />}
                    />
                    <Route
                        path="assign-school-admin"
                        element={<AssignTobatch />}
                    />
                    <Route
                        path="edit-school-admin"
                        element={<EditSchoolAdmin />}
                    />
                </Route>

                {/* Student Routes */}
                <Route
                    path="/student-dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["student"]}>
                            <BreadcrumbProvider>
                                <StudentDashboard />
                            </BreadcrumbProvider>
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<StudentHome />} />
                    {/* <Route index element={<StudentDashboardContent />} /> */}
                    <Route
                        path="courses/my-learning-tabs"
                        element={<LessonWorksheetPracticePage />}
                    />
                    <Route path="courses" element={<StudentCourse />} />
                    <Route path="assessments" element={<QuizList />} />
                    <Route path="attendance" element={<StudentAttendance />} />
                    <Route path="live-quiz" element={<LiveQuizJoin />} />
                    <Route path="quiz-result" element={<QuizResult />} />
                    <Route
                        path="quiz/:quizId"
                        element={<QuizAttemptWrapper />}
                    />
                    <Route
                        path="announcements"
                        element={<StudentAnnouncements />}
                    />
                    <Route path="badges" element={<StudentBadges />} />
                    <Route path="assignments" element={<StudentAssignments />} />
                    <Route path="attempt-quiz" element={<AttemptQuiz />} />
                    <Route
                        path="quiz-result/:quizId"
                        element={<StudentQuizView />}
                    />

                    <Route
                        path="projects-Practice"
                        element={<ProjectPractice />}
                    />
                    <Route
                        path="students-lab-activity"
                        element={<StudentLabActivity />}
                    />

                    <Route path="resources" element={<StudentResources />} />
                    <Route
                        path="resources/folder/:id"
                        element={<StudentInsideFolder />}
                    />

                    <Route
                        path="chapter-quiz-attempt/:id"
                        element={<ChapterQuizInStudent />}
                    />
                    <Route
                        path="chapter-quiz-result/:attemptId"
                        element={<ChapterQuizResultInStudent />}
                    />
                </Route>

                <Route
                    path="/my-learning"
                    element={
                        <ProtectedRoute allowedRoles={["student"]}>
                            <BreadcrumbProvider>
                                <MyLearning />
                            </BreadcrumbProvider>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/my-learning1"
                    element={
                        // <ProtectedRoute allowedRoles={['student']}>
                        <BreadcrumbProvider>
                            <Course />
                        </BreadcrumbProvider>
                        // </ProtectedRoute>
                    }
                />

                {/* Teacher Routes */}
                <Route
                    path="/teacher-dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["teacher"]}>
                            <BreadcrumbProvider>
                                <TeacherDashboard />
                            </BreadcrumbProvider>
                        </ProtectedRoute>
                    }
                >
                   <Route index element={<TeacherHome />} />                   {/*} <Route index element={<TeacherDashboardContent />} />*/}
                    <Route path="badges" element={<TeacherBadges />} />

                    {/* 
                    <Route index element={<TeacherDashboardContent />} /> */}

                    <Route path="batches" element={<TeacherBatches />} />
                    <Route
                        path="studentDetails"
                        element={<ViewStudentDetails />}
                    />
                    <Route path="resources" element={<TeacherResources />} />
                    <Route
                        path="resources/folder/:id"
                        element={<TeacherInsideFolder />}
                    />
                    <Route
                        path="/teacher-dashboard/aira-lesson-plan-generator"
                        element={<AiraLessonPlanGenerator />}
                    />
                    <Route path="attendance" element={<TeacherAttendance />} />
                    <Route path="assignments" element={<TeacherAssignments />} />

                    {/* <Route path="students" element={<BatchStudents />} /> */}
                    <Route path="students" element={<StudentPage />} />
                    <Route path="student-list" element={<StudentList />} />
                    <Route
                        path="submitted-quiz"
                        element={<SubmittedQuizCard />}
                    />
                    <Route
                        path="announcements"
                        element={<TeacherAnnouncements />}
                    />

                    <Route path="complete-quiz" element={<CompleteQuiz1 />} />

                    <Route
                        path="batchdetails"
                        element={<TeacherBatchDetails />}
                    />

                    <Route path="projects" element={<TeachersProjects />} />

                    <Route
                        path="teacher-lab-activity"
                        element={<TeacherLabActivity />}
                    />

                    <Route
                        path="question-paper-generator"
                        element={<QuestionForm />}
                    />

                    <Route
                        path="complete-question"
                        element={<CompleteQuestion />}
                    />
                    <Route path="quiz-tabs" element={<QuizTabs />} />
                    <Route
                        path="assessment-center"
                        element={<AssessmentCenter />}
                    />
                    <Route path="complete-quiz" element={<CompleteQuiz />} />
                    <Route path="edit-question" element={<EditQuestion />} />
                    <Route path="edit-quiz" element={<EditQuiz />} />

                    <Route
                        path="quiz-details/:id"
                        element={<ViewQuizDetails />}
                    />
                    <Route
                        path="quiz-result/:quizId"
                        element={<StudentQuizView />}
                    />
                    <Route
                        path="quiz-submit-details/:quizId"
                        element={<SubmittedQuizzes />}
                    />

                    <Route path="quiz-tabs/sample" element={<QuizTabs />} />
                    <Route path="quiz-tabs/custom" element={<QuizTabs />} />
                </Route>

                {/* Public routes */}
                <Route
                    path="/terminal/terminal-python"
                    element={<PythonTerminal />}
                />
                <Route
                    path="/terminal/terminal-js"
                    element={<JavaScriptTerminal />}
                />
                <Route
                    path="/terminal/terminal-html"
                    element={<HTMLTerminal />}
                />
                <Route
                    path="/terminal/scratch-html"
                    element={<ScratchTerminal />}
                />
            </Routes>
        </Router>
    );
}

export default App;
