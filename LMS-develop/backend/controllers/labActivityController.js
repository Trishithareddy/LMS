const mongoose = require("mongoose");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const { CloudPDF } = require("@cloudpdf/api");
require("dotenv").config();

// models
const LabActivity = require("../models/LabActivity");
const Chapter = require("../models/Chapter");

// cloudpdf
const cloudPDF = new CloudPDF({
    apiKey: process.env.CLOUDPDF_API_KEY,
    cloudName: process.env.CLOUDPDF_CLOUD_NAME,
    signingSecret: process.env.CLOUDPDF_SECRET_KEY,
});

// Controller to add PDF by CloudPDF document ID
exports.addLabActivityByCloudPdfDocumentId = async (req, res) => {
    const { chapterId, cloudPdfDocumentId, name } = req.body;

    if (!chapterId) {
        return res.status(400).json({ error: "ChapterId not found" });
    }

    if (!cloudPdfDocumentId) {
        return res.status(400).json({ error: "cloudPdfDocumentId not found" });
    }

    try {
        // First check if chapter exists
        const existingChapter = await Chapter.findById(chapterId);
        if (!existingChapter) {
            return res.status(404).json({
                error: "No chapter found with the provided chapter id."
            });
        }

        // Find or create LabActivity for this chapter
        let labActivity = await LabActivity.findOne({ chapterId });
        
        if (!labActivity) {
            labActivity = new LabActivity({
                chapterId,
                pdfs: []
            });
        }

        // Add new PDF to the array
        labActivity.pdfs.push({
            name: name || `Lab PDF ${labActivity.pdfs.length + 1}`,
            pdfId: cloudPdfDocumentId,
            pdfText: null
        });

        await labActivity.save();

        res.status(200).json({
            success: true,
            message: "Lab Activity PDF added successfully.",
            labActivity: labActivity,
        });
    } catch (error) {
        console.error("Error adding Lab Activity PDF by document Id:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Controller to add PDF file
exports.addLabActivity = async (req, res) => {
    axios.defaults.maxContentLength = Infinity;
    axios.defaults.maxBodyLength = Infinity;

    const { chapterId, name } = req.body;
    const pdf = req.file;  // From multer middleware

    if (!chapterId) {
        return res.status(400).json({ error: "ChapterId not found" });
    }

    if (!pdf) {
        return res.status(400).json({ error: "PDF File not found" });
    }

    try {
        // First check if chapter exists
        const existingChapter = await Chapter.findById(chapterId);
        if (!existingChapter) {
            return res.status(404).json({
                error: "No chapter found with the provided chapter id."
            });
        }

        // Read the file from multer path
        const dataBuffer = await fs.promises.readFile(pdf.path);

        // Upload to CloudPDF
        // 1. Create document in CloudPDF
        const createDocResponse = await axios.post(
            "https://api.cloudpdf.io/v2/documents",
            {
                name: pdf.originalname,
                description: `Lab Activity PDF for chapter ${chapterId}`,
                defaultPermissions: {
                    search: false,
                    selection: false,
                    public: true,
                    download: "NotAllowed",
                },
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-Authorization": process.env.CLOUDPDF_API_KEY,
                },
            }
        );

        const document = createDocResponse.data;

        // 2. Upload file to pre-signed URL
        const uploadUrl = document.file.uploadUrl;

        await axios.put(uploadUrl, dataBuffer, {
            headers: {
                "Content-Type": "application/pdf",
            },
            onUploadProgress: (e) => {
                const percentComplete = Math.round((e.loaded * 100) / e.total);
            },
        });

        // 3. Notify CloudPDF that upload is complete
        await axios.patch(
            `https://api.cloudpdf.io/v2/documents/${document.id}/files/${document.file.id}`,
            {
                uploadCompleted: true,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-Authorization": process.env.CLOUDPDF_API_KEY,
                },
            }
        );

        // 4. Get the processed document information
        const processedDocResponse = await axios.get(
            `https://api.cloudpdf.io/v2/documents/${document.id}`,
            {
                headers: {
                    "X-Authorization": process.env.CLOUDPDF_API_KEY,
                },
            }
        );

        const processedDocument = processedDocResponse.data;

        const ID = processedDocument.id;
        const FILEID = processedDocument.file.id;

        const pdfDocumentIdToBeStoredResponse = await axios.get(
            `https://api.cloudpdf.io/v2/documents/${ID}/files/${FILEID}`,
            {
                headers: {
                    "X-Authorization": process.env.CLOUDPDF_API_KEY,
                },
            }
        );

        const pdfDocumentIdToBeStored = pdfDocumentIdToBeStoredResponse.data;
        const pdfDocumentId = pdfDocumentIdToBeStored.documentId;

        // Upload to ChatPDF using form-data
        const formData = new FormData();
        formData.append('file', fs.createReadStream(pdf.path));

        const chatPdfResponse = await axios.post(
            "https://api.chatpdf.com/v1/sources/add-file",
            formData,
            {
                headers: {
                    "x-api-key": process.env.CHATPDF_API_KEY,
                    ...formData.getHeaders()
                }
            }
        );

        const chatPdfSourceId = chatPdfResponse.data.sourceId;

        // Find or create LabActivity for this chapter
        let labActivity = await LabActivity.findOne({ chapterId });
        
        if (!labActivity) {
            labActivity = new LabActivity({
                chapterId,
                pdfs: []
            });
        }

        // Add new PDF to the array
        labActivity.pdfs.push({
            name: name || pdf.originalname,
            pdfId: pdfDocumentId,
            pdfText: chatPdfSourceId
        });

        await labActivity.save();

        // Clean up temporary file
        try {
            await fs.promises.unlink(pdf.path);
        } catch (unlinkError) {
            console.error('Error deleting temporary file:', unlinkError);
        }

        res.status(200).json({
            success: true,
            message: "Lab Activity PDF added successfully.",
            labActivity: labActivity
        });

    } catch (error) {
        // Clean up on error
        try {
            if (pdf && pdf.path) {
                await fs.promises.unlink(pdf.path);
            }
        } catch (unlinkError) {
            console.error('Error deleting temporary file:', unlinkError);
        }

        console.error("Error adding Lab Activity PDF:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};

// Get Lab Activity by Chapter ID
exports.getLabActivity = async (req, res) => {
    const { chapterId } = req.params;

    if (!chapterId) {
        return res.status(400).json({ error: "ChapterId not found" });
    }

    try {
        const labActivity = await LabActivity.findOne({ chapterId })
            .populate('chapterId');

        if (!labActivity) {
            return res.status(404).json({
                success: false,
                message: "No lab activity found for this chapter"
            });
        }

        res.status(200).json({
            success: true,
            labActivity
        });
    } catch (error) {
        console.error("Error fetching lab activity:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};

// Delete PDF from Lab Activity
exports.deleteLabActivityPdf = async (req, res) => {
    const { chapterId, pdfId, name } = req.body;

    if (!chapterId) {
        return res.status(400).json({ error: "ChapterId not found" });
    }

    if (!pdfId) {
        return res.status(400).json({ error: "PDF ID not found" });
    }

    if (!name) {
        return res.status(400).json({ error: "PDF name not found" });
    }

    try {
        // Find the lab activity document and remove the specific PDF from the pdfs array
        const labActivity = await LabActivity.findOneAndUpdate(
            { chapterId },
            { 
                $pull: { 
                    pdfs: { 
                        pdfId: pdfId, 
                        name: name 
                    } 
                } 
            },
            { new: true }
        );

        if (!labActivity) {
            return res.status(404).json({
                success: false,
                message: "No lab activity found for this chapter"
            });
        }

        res.status(200).json({
            success: true,
            message: "PDF deleted successfully from lab activity",
            labActivity
        });

    } catch (error) {
        console.error("Error deleting PDF from lab activity:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};


