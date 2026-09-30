const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Course=require('../models/Course')

// Controller function to create a subcategory
exports.createSubcategory = async (req, res) => {
  const { categoryId } = req.params;
  const { name, description } = req.body;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const newSubcategory = new SubCategory({
      name,
      description,
      category: categoryId,
      categoryName: category.name,
      categoryDescription: category.description,
      // courses: [] // Initialize with an empty array for courses
    });

    await newSubcategory.save();

    category.subcategories.push(newSubcategory._id);
    await category.save();

    res.status(201).json(newSubcategory);
  } catch (error) {
    console.error('Error creating subcategory:', error);
    res.status(500).json({ error: 'Server error' });
  }
};



//get All subcategories
exports.getAllchaptersBySubCategoryId = async (req, res) => {
  const subCategoryId = req.params.subCategoryId;
  try {
    const subcategoryChapters = await SubCategory.findById(subCategoryId)
      .populate({
        path: 'courses',
        populate: {
          path: 'chapters',
          model: 'Chapter',
          select:'name _id chapterId'
        }
      })
      .exec();
      const allChapters = subcategoryChapters.courses.flatMap(course => course.chapters);

    res.json(allChapters);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllCoursesBySubCategoryId = async (req, res) => {
  const subCategoryId = req.params.subCategoryId;
  try {
    const subcategory= await SubCategory.findById(subCategoryId)
    .populate({
      path: 'courses',
    model:'Course',
    select: 'name description _id courseId',
    })
      .exec();
      const allCourses = subcategory.courses

    res.json(allCourses);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.getAllSubcategories = async (req, res) => {
  try {
    const subcategories = await SubCategory.find()
      .populate({
        path: 'courses',
        populate: {
          path: 'chapters',
          model: 'Chapter',
          populate: {
            path: 'lessons',
            model: 'Lesson' // Assuming 'Chapter' is your model name for chapters
          }  // Assuming 'Chapter' is your model name for chapters
        }
      })
      .exec();

    res.json(subcategories);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.addExistingSubcategoryToCategory = async (req, res) => {
  const { categoryId } = req.params;
  const { subcategoryId } = req.body;

  try {
    // Check if the parent category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if the subcategory exists
    const subcategory = await SubCategory.findById(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    if (!category.subcategories.includes(subcategoryId)) {
      category.subcategories.push(subcategoryId);
      await category.save();
    }

    subcategory.category = categoryId;
    subcategory.categoryName = category.name;
    subcategory.categoryDescription = category.description;
    await subcategory.save();

    res.status(200).json({ message: 'Subcategory added to category successfully' });
  } catch (error) {
    console.error('Error adding subcategory to category:', error);
    res.status(500).json({ error: 'Server error' });
  }
};





// Controller function to get an individual subcategory by ID
exports.getSubcategoryById = async (req, res) => {
  const { subCategoryId } = req.params;

  try {
    // Find the subcategory by ID and populate courses and their chapters
    const subcategory = await SubCategory.findById(subCategoryId)
      .populate({
        path: 'courses',
        populate: {
          path: 'chapters',
          model: 'Chapter',
          populate: {
            path: 'lessons',
            model: 'Lesson' // Assuming 'Chapter' is your model name for chapters
          }  // Assuming 'Chapter' is your model name for chapters
        }
      })
      .exec();

    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    res.json(subcategory);
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    res.status(500).json({ error: 'Server error' });
  }
};



//update subcategory


exports.updateSubcategory = async (req, res) => {
  const subcategoryId = req.params.id;
  const { name, description, coursesToRemove } = req.body;

  try {
    // Find the subcategory by ID
    let subcategory = await SubCategory.findById(subcategoryId);

    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    // Update subcategory fields
    if (name) {
      subcategory.name = name;
      // Update courses' subCategoryName
      await Course.updateMany(
        { subCategory: subcategoryId },
        { subCategoryName: name },
        { multi: true }
      );
    }

    if (description) {
      subcategory.description = description;
      // Update courses' subCategoryDescription
      await Course.updateMany(
        { subCategory: subcategoryId },
        { subCategoryDescription: description },
        { multi: true }
      );
    }

    // Remove courses from the subcategory's courses array
    if (coursesToRemove && coursesToRemove.length > 0) {
      await Promise.all(coursesToRemove.map(async (courseId) => {
        // Remove course from the subcategory's courses array
        subcategory.courses.pull(courseId);

        // Update the actual course document to remove subcategory details
        await Course.findByIdAndUpdate(courseId, {
          $unset: { 
            subCategory: "",
            subCategoryName: "",
            subCategoryDescription: ""
          }
        });

        // Optionally, delete the actual course document from the Course collection
        // await Course.findByIdAndDelete(courseId); // Uncomment if you want to delete the course document
      }));
    }

    await subcategory.save();

    res.status(200).json(subcategory);
  } catch (error) {
    console.error('Error updating subcategory:', error);
    res.status(500).json({ error: 'Server error' });
  }
};



//delete subcategory
exports.deleteSubcategory = async (req, res) => {
  const { subCategoryId } = req.params;

  try {
    // Find and delete the subcategory
    const subcategory = await SubCategory.findByIdAndDelete(subCategoryId);

    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    // Remove the subcategory reference from the corresponding category
    await Category.updateOne(
      { _id: subcategory.category },
      { $pull: { subcategories: subCategoryId } }
    );

    // Remove the subcategory information from the corresponding courses
    await Course.updateMany(
      { subCategory: subCategoryId },
      {
        $unset: { subCategory: "" },
        $set: {
          subCategoryName: "",
          subCategoryDescription: ""
        }
      }
    );

    res.status(200).json({ message: 'Subcategory and its references removed successfully' });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({ error: 'Server error' });
  }
};