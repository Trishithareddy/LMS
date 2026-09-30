const Chapter = require("../models/Chapter");
const VideoContent = require("../models/VideoContent");
const Vimeo = require('@vimeo/vimeo').Vimeo;
const Course=require('../models/Course')

// Function to add a video to a chapter.
const client = new Vimeo(
    process.env.VIMEO_CLIENT_ID,
    process.env.VIMEO_CLIENT_SECRET,
    process.env.VIMEO_ACCESS_TOKEN
);

const extractVimeoId = (url) => {
    const regex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

// Helper function to get video duration
const getVideoDuration = (videoId) => {
    return new Promise((resolve, reject) => {
        client.request({
            method: 'GET',
            path: `/videos/${videoId}`
        }, (error, body) => {
            if (error) {
                reject(error);
            } else {
                resolve(body.duration); // Duration in seconds
            }
        });
    });
};






exports.createVideo = async (req, res) => {
    const { chapterId } = req.params;
    const { videoTitle, videoUrl } = req.body;

    if (!chapterId) {
        return res.status(400).json({ error: "Chapter ID cannot be empty!" });
    }
    if (!(videoTitle || videoUrl)) {
        return res
            .status(400)
            .json({ error: "Video Title and Video URL cannot be empty!" });
    }

    try {
        // Extract Vimeo video ID and get duration
        const vimeoId = extractVimeoId(videoUrl);
        if (!vimeoId) {
            return res.status(400).json({ error: "Invalid Vimeo URL" });
        }

        // Get video duration
        const videoDuration = await getVideoDuration(vimeoId);

        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            return res.status(404).json({
                error: `No chapter found for provided Chapter ID: ${chapterId}`,
            });
        }

        // Create and save the new video with its expected time
        const newVideo = new VideoContent({
            videoTitle,
            videoUrl,
            chapter: chapterId,
            expectedTime: videoDuration
        });
        await newVideo.save();

        // Add video to chapter's videoLessons array
        chapter.videoLessons.push(newVideo);

        // Recalculate total video expected time for the chapter
        const allChapterVideos = await VideoContent.find({
            _id: { $in: chapter.videoLessons }
        });
        
        // Sum up expected times of all videos
        const totalVideoExpectedTime = allChapterVideos.reduce((sum, video) => 
            sum + (video.expectedTime || 0), 0
        );

        // Store the total in chapter
        const previousExpectedTime = chapter.videoExpectedtime || 0;
        chapter.videoExpectedtime = totalVideoExpectedTime;
        await chapter.save();

        // Update course expected time with the difference
        if (chapter.course) {
            const timeDifference = totalVideoExpectedTime - previousExpectedTime;
            await Course.findByIdAndUpdate(
                chapter.course,
                {
                    $inc: { courseExpectedtime: timeDifference }
                },
                { new: true }
            );
        }

        return res.status(200).json({
            message: "Video Lesson Created Successfully",
            videoLesson: newVideo,
            chapterVideoExpectedTime: chapter.videoExpectedtime
        });
    } catch (error) {
        console.error("Error adding videoLesson to chapter:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getVideo = async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        return res.status(400).json({ error: "Video ID cannot be empty" });
    }

    try {
        const video = await VideoContent.findById(videoId);

        if (!video) {
            return res
                .status(404)
                .json({ error: "No video found with provided Video ID." });
        }

        return res.status(200).json({
            message: "Video fetched successfully!",
            video,
        });
    } catch (error) {
        console.error("Error getting video:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Function to update a video.
exports.updateVideo = async (req, res) => {
    const { videoId } = req.params;
    const { videoTitle, videoUrl } = req.body;

    if (!videoId) {
        return res.status(400).json({ error: "Video ID cannot be empty!" });
    }

    if (!(videoTitle || videoUrl)) {
        return res
            .status(400)
            .json({ error: "Video Title or Video URL cannot be empty!" });
    }

    try {
        const video = await VideoContent.findByIdAndUpdate(
            videoId,
            { $set: { videoTitle, videoUrl } },
            { new: true }
        );

        if (!video) {
            return res
                .status(404)
                .json({ error: "No video found with provided Video ID." });
        }

        return res.status(200).json({
            message: "Video updated successfully!",
            updatedVideo: video,
        });
    } catch (error) {
        console.error("Error updating video:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Function to delete a video.
exports.deleteVideo = async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        return res.status(400).json({ error: "Video ID cannot be empty." });
    }

    try {
        const video = await VideoContent.findById(videoId);

        if (!video) {
            return res
                .status(404)
                .json({ error: "No video found with the provided Video ID." });
        }

        const chapter = await Chapter.findById(video.chapter);

        if (!chapter) {
            return res
                .status(404)
                .json({ error: "No chapter found for this video." });
        }

        // Remove the video reference from the chapter's videoLessons array
        chapter.videoLessons = chapter.videoLessons.filter(
            (lessonId) => lessonId.toString() !== videoId
        );

        await chapter.save();
        await VideoContent.findByIdAndDelete(videoId);

        return res.status(200).json({
            message: "Video deleted successfully!",
        });
    } catch (error) {
        console.error("Error deleting the video:", error);
        res.status(500).json({ error: "Server Error!" });
    }
};

// Function to get all videos by chapter ID.
exports.getAllVideosByChapterId = async (req, res) => {
    const { chapterId } = req.params;

    if (!chapterId) {
        return res.status(400).json({ error: "Chapter ID cannot be empty." });
    }

    try {
        const chapter = await Chapter.findById(chapterId).populate(
            "videoLessons"
        );
        

        if (!chapter) {
            return res
                .status(404)
                .json({ error: "No chapter found with provided Chapter ID." });
        }

        return res.status(200).json({
            message: "Video lessons fetched successfully.",
            videoLessons: chapter.videoLessons,
        });
    } catch (error) {
        console.error("Error fetching video lessons:", error);
        res.status(500).json({ error: "Server Error!" });
    }
};
