const Scratch = require('../models/Scratch');
const multer = require('multer');
const cloudinary = require("../middleware/cloudinary");
const fs = require('fs');
// Configure multer to store files in memory instead of disk

// Destination for storing uploaded files temporarily
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to allow only .sb3 and image files
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'ScratchFile') {
    if (!file.originalname.endsWith('.sb3')) {
      return cb(new Error('Only .sb3 files are allowed'), false);
    }
  } else if (file.fieldname === 'ScratchImage') {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedTypes.test(ext)) {
      return cb(new Error('Only image files are allowed'), false);
    }
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit
  }
});

const uploadFiles = upload.fields([
  { name: 'ScratchFile', maxCount: 1 },
  { name: 'ScratchImage', maxCount: 1 }
]);



//this is using multer and storing files in buffer
exports.createScratch = async (req, res) => {
  try {
    uploadFiles(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      try {
        // Get file buffers
        const scratchFileBuffer = req.files['ScratchFile'][0].buffer;
        const scratchImageBuffer = req.files['ScratchImage'][0].buffer;

        // Parse the SelectBlock data
        const selectBlockData = JSON.parse(req.body.SelectBlock);

        // Create new Scratch document
        const newScratch = new Scratch({
          ScratchTitle: req.body.ScratchTitle,
          ScratchDescription: req.body.ScratchDescription,
          ScratchInstruction: req.body.ScratchInstruction,
          ScratchFile: scratchFileBuffer,
          ScratchImage: scratchImageBuffer,
          SelectBlock: selectBlockData.SelectBlock
        });

        // Save to database
        const savedScratch = await newScratch.save();

        res.status(201).json({
          success: true,
          data: savedScratch,
          message: 'Scratch project created successfully'
        });

      } catch (error) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
//this store the files in cloudinary
exports.createScratchDocument = async (req, res) => {
  try {
    const {
      ScratchTitle,
      ScratchDescription,
      ScratchInstruction,
    } = req.body;

    const selectBlockData = JSON.parse(req.body.SelectBlock);

    const sb3File = req.files?.ScratchFile?.[0];
    const imageFile = req.files?.ScratchImage?.[0];

    if (!sb3File || !imageFile) {
      return res.status(400).json({
        message: "Both .sb3 and image files are required"
      });
    }

    // Upload .sb3 file to Cloudinary
    const sb3Result = await cloudinary.uploader.upload(sb3File.path, {
      resource_type: "raw",
      folder: "scratch_files"
    });

    // Upload image to Cloudinary
    const imageResult = await cloudinary.uploader.upload(imageFile.path, {
      folder: "scratch_images"
    });

    // Create document in MongoDB
    const newScratch = new Scratch({
      ScratchTitle: ScratchTitle.trim(),
      ScratchDescription: ScratchDescription.trim(),
      ScratchInstruction: ScratchInstruction.trim(),
      ScratchFile: sb3Result.secure_url,
      ScratchFilePublicId: sb3Result.public_id,
      ScratchImage: imageResult.secure_url,
      ScratchImagePublicId: imageResult.public_id,
      SelectBlock: selectBlockData.SelectBlock
    });

    await newScratch.save();

    // Cleanup uploaded temp files
    fs.unlinkSync(sb3File.path);
    fs.unlinkSync(imageFile.path);

    res.status(201).json({
      success: true,
      message: "Scratch project created successfully",
      data: newScratch
    });

  } catch (error) {
    // Cleanup temp files if they exist
    if (req.files) {
      Object.values(req.files).forEach(files => {
        files.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating Scratch project",
      error: error.message
    });
  }
};

// get all scratch projects 
exports.getAllScratchProjects = async (req, res) => {
  try {
    // Fetch only necessary fields
    const projects = await Scratch.find({}, {
      _id: 1,
      ScratchTitle: 1,
      ScratchDescription: 1,
      createdAt: 1
    });

    res.status(200).json({
      success: true,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// get scratch project by id
exports.getScratchProjectById = async (req, res) => {
  try {
    // Get the project id from params
    const { id } = req.params;

    // Find the project by id
    const project = await Scratch.findById(id, {
      _id: 1,
      ScratchTitle: 1,
      ScratchDescription: 1,
      ScratchInstruction: 1,
      ScratchFile: 1,
      SelectBlock: 1,
      createdAt: 1
    });

    // Check if project exists
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Scratch project not found"
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID format"
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// update scratch project by Id
exports.updateScratchProjectById = async (req, res) => {
  try {
    uploadFiles(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      try {
        const { id } = req.params;

        // Optional file buffers
        const scratchFileBuffer = req.files['ScratchFile']?.[0]?.buffer;
        const scratchImageBuffer = req.files['ScratchImage']?.[0]?.buffer;

        const selectBlockData = JSON.parse(req.body.SelectBlock);

        // Build update object conditionally
        const updateData  = {
          ScratchTitle: req.body.ScratchTitle,
          ScratchDescription: req.body.ScratchDescription,
          ScratchInstruction: req.body.ScratchInstruction,
          SelectBlock: selectBlockData.SelectBlock,
        };

        if (scratchImageBuffer) updateData.ScratchImage = scratchImageBuffer;
        if (scratchFileBuffer) updateData.ScratchFile = scratchFileBuffer;

        const updatedScratchProject = await Scratch.findByIdAndUpdate(id, updateData, { new: true });

        res.status(200).json({
          success: true,
          data: updatedScratchProject,
          message: "Scratch project updated successfully",
        });

      } catch (error) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// update updateScratchDocument
exports.updateScratchDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch existing document
    const existingScratch = await Scratch.findById(id);
    if (!existingScratch) {
      return res.status(404).json({ message: "Scratch project not found" });
    }

    const {
      ScratchTitle,
      ScratchDescription,
      ScratchInstruction,
    } = req.body;

    const selectBlockData = JSON.parse(req.body.SelectBlock);

    let updatedFields = {
      ScratchTitle: ScratchTitle.trim(),
      ScratchDescription: ScratchDescription.trim(),
      ScratchInstruction: ScratchInstruction.trim(),
      SelectBlock: selectBlockData.SelectBlock,
    };

    // Handle SB3 file update
    const sb3File = req.files?.ScratchFile?.[0];
    if (sb3File) {
      // Delete old sb3 file from Cloudinary
      if (existingScratch.ScratchFilePublicId) {
        await cloudinary.uploader.destroy(existingScratch.ScratchFilePublicId, {
          resource_type: "raw",
        });
      }

      const sb3Result = await cloudinary.uploader.upload(sb3File.path, {
        resource_type: "raw",
        folder: "scratch_files",
      });

      updatedFields.ScratchFile = sb3Result.secure_url;
      updatedFields.ScratchFilePublicId = sb3Result.public_id;

      fs.unlinkSync(sb3File.path);
    }

    // Handle image update
    const imageFile = req.files?.ScratchImage?.[0];
    if (imageFile) {
      // Delete old image from Cloudinary
      if (existingScratch.ScratchImagePublicId) {
        await cloudinary.uploader.destroy(existingScratch.ScratchImagePublicId);
      }

      const imageResult = await cloudinary.uploader.upload(imageFile.path, {
        folder: "scratch_images",
      });

      updatedFields.ScratchImage = imageResult.secure_url;
      updatedFields.ScratchImagePublicId = imageResult.public_id;

      fs.unlinkSync(imageFile.path);
    }

    // Update document
    const updatedScratch = await Scratch.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });

    res.status(200).json({
      message: "Scratch project updated successfully",
      data: updatedScratch,
    });

  } catch (error) {
    // Cleanup in case of error
    if (req.files) {
      Object.values(req.files).forEach(files => {
        files.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      });
    }

    res.status(500).json({
      message: "Failed to update Scratch project",
      error: error.message,
    });
  }
};

exports.deleteScratchById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the scratch project
    const scratch = await Scratch.findById(id);
    if (!scratch) {
      return res.status(404).json({
        success: false,
        message: 'Scratch project not found',
      });
    }

    // 2. Delete files from Cloudinary
    try {
      if (scratch.ScratchFilePublicId) {
        await cloudinary.uploader.destroy(scratch.ScratchFilePublicId, {
          resource_type: 'raw',
        });
      }

      if (scratch.ScratchImagePublicId) {
        await cloudinary.uploader.destroy(scratch.ScratchImagePublicId, {
          resource_type: 'image',
        });
      }
    } catch (cloudError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete files from Cloudinary',
        error: cloudError.message,
      });
    }

    // 3. Delete document from MongoDB
    await Scratch.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Scratch project deleted successfully',
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting scratch project',
      error: error.message,
    });
  }
};