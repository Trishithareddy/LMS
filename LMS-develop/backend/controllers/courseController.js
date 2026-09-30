const Course = require("../models/Course");
const SubCategory = require("../models/SubCategory");
const Chapter = require("../models/Chapter");
const Lesson = require("../models/Lesson");
const VideoContent = require("../models/VideoContent");
const Concept = require("../models/Concept");
const Batch = require("../models/Batch");
const Folder = require("../models/Folder");
const File = require("../models/File");
const LabActivity = require("../models/LabActivity");
const ChapterQuiz = require("../models/ChapterwiseQuiz");
const SkillTest = require("../models/SkillTest");
const mongoose = require("mongoose");
const cloudinary = require("../middleware/cloudinary"); // Adjust path as needed

const cloneResourceTree = async (oldChapterId, newChapterId) => {
    const [folders, files] = await Promise.all([
        Folder.find({ chapterId: oldChapterId }).lean(),
        File.find({ chapterId: oldChapterId }).lean(),
    ]);

    const folderIdMap = new Map();

    for (const folder of folders) {
        const clonedFolder = await Folder.create({
            name: folder.name,
            parent_id: null,
            color: folder.color,
            chapterId: newChapterId,
        });
        folderIdMap.set(String(folder._id), clonedFolder._id);
    }

    for (const folder of folders) {
        if (!folder.parent_id) continue;
        const newParentId = folderIdMap.get(String(folder.parent_id));
        const newFolderId = folderIdMap.get(String(folder._id));
        if (newParentId && newFolderId) {
            await Folder.findByIdAndUpdate(newFolderId, {
                $set: { parent_id: newParentId },
            });
        }
    }

    if (files.length) {
        await File.insertMany(
            files.map((file) => ({
                name: file.name,
                folder_id: file.folder_id
                    ? folderIdMap.get(String(file.folder_id)) || null
                    : null,
                fileUrl: file.fileUrl,
                chapterId: newChapterId,
                isActive: file.isActive,
            })),
        );
    }
};

const cloneLabActivity = async (oldChapterId, newChapterId) => {
    const labActivity = await LabActivity.findOne({ chapterId: oldChapterId }).lean();
    if (!labActivity) return null;

    const clonedLabActivity = await LabActivity.create({
        chapterId: newChapterId,
        pdfs: (labActivity.pdfs || []).map((pdf) => ({
            name: pdf.name,
            pdfId: pdf.pdfId,
            pdfText: pdf.pdfText,
        })),
    });

    return clonedLabActivity._id;
};

const cloneSkillTest = async (skillTestId, newCourseId, newChapterId) => {
    if (!skillTestId) return null;

    const skillTest = await SkillTest.findById(skillTestId).lean();
    if (!skillTest) return null;

    const clonedSkillTest = await SkillTest.create({
        courseId: newCourseId,
        chapterId: newChapterId,
        title: skillTest.title,
        instructions: skillTest.instructions,
        questions: skillTest.questions || [],
        enabled: skillTest.enabled,
        passingPercentage: skillTest.passingPercentage,
    });

    return clonedSkillTest._id;
};

const cloneChapterQuiz = async (quizId, oldChapter, newChapter) => {
    if (!quizId) return null;

    const quiz = await ChapterQuiz.findById(quizId).lean();
    if (!quiz) return null;

    const oldChapterId = String(oldChapter._id);
    const assignedChapters = (quiz.assignedChapters || []).map((chapterId) =>
        String(chapterId) === oldChapterId ? newChapter._id : chapterId,
    );

    const clonedQuiz = await ChapterQuiz.create({
        title: `${quiz.title} (Copy)`,
        totalMarks: quiz.totalMarks,
        timeLimit: quiz.timeLimit,
        status: quiz.status,
        allowReattempt: quiz.allowReattempt,
        showCorrectAnswers: quiz.showCorrectAnswers,
        passingPercentage: quiz.passingPercentage,
        questions: quiz.questions || [],
        createdBy: quiz.createdBy,
        assignedChapter: quiz.assignedChapter ? newChapter._id : null,
        assignedChapters: assignedChapters.length ? assignedChapters : [newChapter._id],
        chapterNames: (quiz.chapterNames || []).length
            ? quiz.chapterNames.map((name) =>
                  name === oldChapter.name ? newChapter.name : name,
              )
            : [newChapter.name],
    });

    return clonedQuiz._id;
};

exports.createCourse = async (req, res) => {
    const { subCategoryId } = req.params;
    const { name, description, published } = req.body;
    const imageFile = req.file;

    try {
        // Check if the subcategory exists
        const subcategory = await SubCategory.findById(subCategoryId);
        if (!subcategory) {
            return res.status(404).json({ error: "Subcategory not found" });
        }

        let imageUrl = "";
        if (imageFile) {
            const result = await cloudinary.uploader.upload(imageFile.path);
            imageUrl = result.secure_url;
        }

        const newCourse = new Course({
            name,
            description,
            subCategory: subCategoryId,
            subCategoryName: subcategory.name,
            subCategoryDescription: subcategory.description,
            imageUrl, // Include the image URL
            published: published !== undefined ? published : false, // Default to false if not provided
        });

        // Save the course
        await newCourse.save();

        // Add the course to the subcategory's courses 


        subcategory.courses.push(newCourse._id);
        await subcategory.save();

        res.status(201).json(newCourse);
    } catch (error) {
        console.error("Error creating course:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getAllCourses = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 25);
        const skip = (page - 1) * limit;

        const { name } = req.query;

        // Build query
        const query = {};
        if (name) {
            query.name = { $regex: name, $options: "i" };
        }

        // Parallel execution (faster)
        const [courses, total] = await Promise.all([
            Course.find(query)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Course.countDocuments(query)
        ]);

        return res.status(200).json({
            success: true,
            data: courses,
            pagination: {
                page,
                limit,
                totalDocuments: total,
                totalPages: Math.ceil(total / limit),
            },
        });

    } catch (error) {
        console.error("Error fetching courses:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
// GET /api/courses/paginated
exports.getCoursesPaginated = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [courses, total] = await Promise.all([
            Course.find()
                .select("name description chapters published subCategoryName createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Course.countDocuments(),
        ]);

        res.json({
            data: courses.map(c => ({
                ...c,
                chaptersCount: c.chapters?.length || 0,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (err) {
        console.error("Pagination error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getCourseById = async (req, res) => {
    const { courseId } = req.params;

    try {
        // Find the course by ID and populate its chapters
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        res.json(course);
    } catch (error) {
        console.error("Error fetching course:", error);
        res.status(500).json({ error: "Server error" });
    }
};

//update the course

exports.updateCourse = async (req, res) => {
    const courseId = req.params.id;
    const { name, description, chaptersToRemove, published } = req.body;
    const imageFile = req.file;


    try {
        // Find the course by ID
        let course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        // Update course fields
        if (name) {
            course.name = name;
            // Update chapters' courseName
            await Chapter.updateMany(
                { course: courseId },
                { courseName: name },
                { multi: true }
            );
        }

        if (imageFile) {
            const result = await cloudinary.uploader.upload(imageFile.path);
            course.imageUrl = result.secure_url;
        }

        if (description) {
            course.description = description;
            await Chapter.updateMany(
                { course: courseId },
                { courseDescription: description },
                { multi: true }
            );
        }

        if (published !== undefined) {
            course.published = published;
        }

        if (chaptersToRemove && chaptersToRemove.length > 0) {
            await Promise.all(
                chaptersToRemove.map(async (chapterId) => {
                    course.chapters.pull(chapterId);

                    await Chapter.findByIdAndUpdate(chapterId, {
                        $unset: {
                            course: "",
                            courseName: "",
                            courseDescription: "",
                        },
                    });

                    // await Chapter.findByIdAndDelete(chapterId); // Uncomment if you want to delete the chapter document
                })
            );
        }

        await course.save();

        res.status(200).json(course);
    } catch (error) {
        console.error("Error updating course:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// add a existing course which is not present in any subcategory to a catrogry
exports.addExistingCourseToSubcategory = async (req, res) => {
    const { subCategoryId } = req.params;
    const { courseId } = req.body;

    try {
        // Check if the subcategory exists
        const subCategory = await SubCategory.findById(subCategoryId);
        if (!subCategory) {
            return res.status(404).json({ error: "Subcategory not found" });
        }

        // Check if the course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        if (!subCategory.courses.includes(courseId)) {
            subCategory.courses.push(courseId);
            await subCategory.save();
        }

        course.subCategory = subCategoryId;
        course.subCategoryName = subCategory.name;
        course.subCategoryDescription = subCategory.description;
        await course.save();

        res.status(200).json({
            message: "Course added to subcategory successfully",
        });
    } catch (error) {
        console.error("Error adding course to subcategory:", error);
        res.status(500).json({ error: "Server error" });
    }
};


exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the course
        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Find all chapters of the course
        const chapters = await Chapter.find({
            _id: { $in: course.chapters },
        });

        // Collect all lesson IDs from all chapters
        const lessonIds = chapters.reduce(
            (acc, chapter) => [...acc, ...chapter.lessons],
            []
        );

        // Delete all lessons
        await Lesson.deleteMany({ _id: { $in: lessonIds } });

        // Delete all chapters
        await Chapter.deleteMany({ _id: { $in: course.chapters } });

        // Remove course from batches
        await Batch.updateMany(
            { courses: course._id },
            { $pull: { courses: course._id } }
        );

        // Remove course from subcategory
        if (course.subCategory) {
            await SubCategory.updateOne(
                { _id: course.subCategory },
                { $pull: { courses: course._id } }
            );
        }

        // Delete the course
        await Course.findByIdAndDelete(id);

        res.status(200).json({
            message: "Course and all associated data deleted successfully",
        });
    } catch (error) {
        console.error("Error in deleteCourse:", error);
        res.status(500).json({
            message: "Error deleting course",
            error: error.message,
        });
    }
};

// controller for duplication of course
exports.duplicateCourse = async (req, res) => {
    try {
        const { courseId } = req.params; // This will be an ObjectId


        // Convert courseId to ObjectId
        const courseObjectId = new mongoose.Types.ObjectId(courseId);

        // Fetch the original course using _id (ObjectId) instead of courseId (Number)
        const originalCourse = await Course.findById(courseObjectId)
            .populate({
                path: 'chapters',
                populate: [
                    { path: 'lessons' },
                    { path: 'videoLessons' },
                    { path: 'concepts' }
                ]
            });

        if (!originalCourse) {

            return res.status(404).json({ message: 'Course not found' });
        }


        // Step 1: Create a new course document
        const newCourse = new Course({
            name: originalCourse.name + " (Copy)", // Rename duplicated course
            description: originalCourse.description,
            imageUrl: originalCourse.imageUrl,
            subCategory: originalCourse.subCategory,
            subCategoryName: originalCourse.subCategoryName,
            subCategoryDescription: originalCourse.subCategoryDescription,
            published: false, // Set duplicated course to unpublished
            courseExpectedtime: originalCourse.courseExpectedtime
        });

        await newCourse.save();


        let newChapters = [];

        // Step 2: Duplicate Chapters
        for (const chapter of originalCourse.chapters) {

            // Create the new chapter first so every copied child points to the
            // duplicated chapter, not the original one.
            const newChapter = new Chapter({
                name: chapter.name + " (Copy)",
                subCategory: chapter.subCategory,
                subCategoryName: chapter.subCategoryName,
                subCategoryDescription: chapter.subCategoryDescription,
                course: newCourse._id,
                courseName: newCourse.name,
                courseDescription: newCourse.description,
                lessons: [],
                videoLessons: [],
                concepts: [],
                Ebook: chapter.Ebook,
                EbookExpectedtime: chapter.EbookExpectedtime,
                pdfText: chapter.pdfText,
                worksheet: chapter.worksheet,
                terminalEnabled: chapter.terminalEnabled,
                terminalOptions: chapter.terminalOptions,
                links: chapter.links,
                linksEnabled: chapter.linksEnabled,
                chapterExpectedtime: chapter.chapterExpectedtime,
                videoExpectedtime: chapter.videoExpectedtime,
                qbChapterId: chapter.qbChapterId || chapter._id,
                instructionsText: chapter.instructionsText,
                badgeId: chapter.badgeId,
            });

            await newChapter.save();

            const newLessons = [];
            const newVideos = [];
            const newConcepts = [];

            // Step 3: Duplicate Lessons
            for (const lesson of chapter.lessons) {
                let newSlides = lesson.slides.map(slide => ({
                    content: slide.content,
                    speakerNotes: slide.speakerNotes,
                    slideType: slide.slideType,
                    expectedTime: slide.expectedTime,
                    selectedQuestion: slide.selectedQuestion,
                    quizId: slide.quizId
                }));

                const newLesson = new Lesson({
                    chapterId: newChapter._id,
                    lessonName: lesson.lessonName,
                    lessonExpectedtime: lesson.lessonExpectedtime,
                    slides: newSlides
                });

                await newLesson.save();

                newLessons.push(newLesson._id);
            }

            // Step 4: Duplicate Videos
            for (const video of chapter.videoLessons) {
                const newVideo = new VideoContent({
                    videoTitle: video.videoTitle,
                    videoUrl: video.videoUrl,
                    chapter: newChapter._id,
                    expectedTime: video.expectedTime
                });

                await newVideo.save();

                newVideos.push(newVideo._id);
            }

            // Step 5: Duplicate Concepts
            for (const concept of chapter.concepts) {
                const newConcept = new Concept({
                    name: concept.name, // Keep the same concept name
                    chapter: newChapter._id,
                    chapterName: newChapter.name
                });

                await newConcept.save();
                newConcepts.push(newConcept._id);
            }

            newChapter.lessons = newLessons;
            newChapter.videoLessons = newVideos;
            newChapter.concepts = newConcepts;
            newChapter.labActivity = await cloneLabActivity(chapter._id, newChapter._id);
            newChapter.skillTest = await cloneSkillTest(
                chapter.skillTest,
                newCourse._id,
                newChapter._id,
            );
            newChapter.skillTestEnabled = chapter.skillTestEnabled;
            newChapter.ChapterQuiz = await cloneChapterQuiz(
                chapter.ChapterQuiz,
                chapter,
                newChapter,
            );
            await newChapter.save();

            await cloneResourceTree(chapter._id, newChapter._id);

            newChapters.push(newChapter._id);
        }

        // Step 7: Update the duplicated course with new chapters
        newCourse.chapters = newChapters;
        await newCourse.save();

        // Step 8: Add the new course to the same subcategory as the original course
        await SubCategory.findByIdAndUpdate(
            newCourse.subCategory,
            { $push: { courses: newCourse._id } }
        );

        res.status(201).json({ message: 'Course duplicated successfully', newCourse });
    } catch (error) {
        console.error("Error duplicating course:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
