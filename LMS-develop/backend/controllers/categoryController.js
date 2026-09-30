const Category = require('../models/Category');
const SubCategory=require('../models/SubCategory');
const Course=require('../models/Course')
const Lesson=require('../models/Lesson')

// Controller function to handle category creation
exports.createCategory = async (req, res) => {
  const { name, description } = req.body;

  try {
    // Create a new category
    const newCategory = new Category({ name, description });
    await newCategory.save();

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Server error' });
  }
};



//To get all the categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate({
        path: 'subcategories',
        populate: {
          path: 'courses',
          model: 'Course',
          populate: {
            path: 'chapters',
            model: 'Chapter',
            populate: {
              path: 'lessons',
              model: 'Lesson' // Assuming 'Chapter' is your model name for chapters
            } // Assuming 'Chapter' is your model name for chapters
          }
        }
      })
      .exec();

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.fetchAllCategoriesForQuestionBase = async (req, res) => {
  try {
    const categories = await Category.find().select('name description');
    

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Server error' });
  }
};


  // Controller function to get a specific category by ID
exports.getCategoryById = async (req, res) => {
    const categoryId = req.params.id;
  
    try {
      const categories = await Category.findById(categoryId)
        .populate({
          path: 'subcategories',
        populate: {
          path: 'courses',
          model: 'Course',
          populate: {
            path: 'chapters',
            model: 'Chapter',
            populate: {
              path: 'lessons',
              model: 'Lesson' // Assuming 'Chapter' is your model name for chapters
            }  // Assuming 'Chapter' is your model name for chapters
          }
        }
        })
        .exec();
  
      res.json(categories);
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };


  exports.getSubCategoriesByCategoryId = async (req, res) => {
    const categoryId = req.params.id;
  
    try {
      const category = await Category.findById(categoryId)
        .populate({
          path: 'subcategories',
        model:'SubCategory',
        select: 'name description _id',
        })
        .exec();
  
      res.json(category ? category.subcategories : []);
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };  

//update category

exports.updateCategory = async (req, res) => {
  const categoryId = req.params.id;
  const { name, description, subcategoriesToRemove } = req.body;

  try {
    // Find the category by ID
    let category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Update category fields
    if (name) {
      category.name = name;
      // Update subcategories' categoryName
      await SubCategory.updateMany(
        { category: categoryId },
        { categoryName: name },
        { multi: true }
      );
    }

    if (description) {
      category.description = description;
      // Update subcategories' categoryDescription
      await SubCategory.updateMany(
        { category: categoryId },
        { categoryDescription: description },
        { multi: true }
      );
    }

    // Remove subcategories from the category's subcategories array
    if (subcategoriesToRemove && subcategoriesToRemove.length > 0) {
      await Promise.all(subcategoriesToRemove.map(async (subcategoryId) => {
        // Remove subcategory from the category's subcategories array
        category.subcategories.pull(subcategoryId);

        // Update the actual subcategory document to remove category details
        await SubCategory.findByIdAndUpdate(subcategoryId, {
          $unset: { category: "", categoryName: "", categoryDescription: "" }
        });

        // Optionally, delete the actual subcategory document from the SubCategory collection
        // await SubCategory.findByIdAndDelete(subcategoryId); // Uncomment if you want to delete the subcategory document
      }));
    }

    await category.save();

    res.status(200).json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

//delete a category
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Find and delete the category
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Remove the category reference from subcategories
    await SubCategory.updateMany(
      { category: id },
      {
        $unset: { category: "" },
        $set: {
          categoryName: "",
          categoryDescription: ""
        }
      }
    );

    res.status(200).json({ message: 'Category and its references in subcategories removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};