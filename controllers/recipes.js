const express = require('express');
const router = express.Router();

const User = require('../models/user.js');
const Recipe = require('../models/recipe.js');
const isSignedIn = require('../middleware/is-signed-in');
const Ingredient = require('../models/ingredient.js');

// router logic 
// Index route: Show all recipes for the logged-in user
router.get('/', isSignedIn, async (req, res) => {
    try {
        const userRecipes = await Recipe.find({ owner: req.session.user._id }); 
        // Find user's recipes
        res.render('recipes/index.ejs', { recipes: userRecipes }); // Pass recipes to view
    } catch (err) {
        console.error("🔴 Error fetching recipes:", err);
        res.redirect('/');
    }
})

// Show "New Recipe" form
router.get('/new', isSignedIn, async (req, res) => {
    try {
        const allIngredients = await Ingredient.find(); // Fetch all ingredients
        res.render('recipes/new.ejs', { ingredients: allIngredients }); // ✅ FIX: Pass ingredients to view
    } catch (error) {
        console.error("🔴 Error fetching ingredients:", error);
        res.redirect('/recipes');
    }
});

// Create a new recipe (POST /recipes)
router.post('/', isSignedIn, async (req, res) => {
    try {
        console.log("🟢 Raw Request Body:", req.body); // Debugging

        let ingredientIds = req.body.ingredients || []; // Get selected ingredient IDs
        if (!Array.isArray(ingredientIds)) {
            ingredientIds = [ingredientIds]; // Convert single selection into an array
        }

        // Handle new ingredient inputs
        if (req.body.newIngredients) {
            let newIngredientNames = req.body.newIngredients;

            if (!Array.isArray(newIngredientNames)) {
                newIngredientNames = [newIngredientNames]; // Convert single input to an array
            }

            for (const ingredientName of newIngredientNames) {
                if (ingredientName.trim() !== "") {
                    let existingIngredient = await Ingredient.findOne({ name: ingredientName.trim() });

                    if (!existingIngredient) {
                        existingIngredient = await Ingredient.create({ name: ingredientName.trim() });
                        console.log(`✅ New ingredient added: ${ingredientName.trim()}`);
                    }

                    ingredientIds.push(existingIngredient._id.toString());
                }
            }
        }

        // Debugging: Log selected ingredient IDs
        console.log("🟢 Final Ingredient IDs:", ingredientIds);

        // Create the recipe with selected and new ingredients
        const newRecipe = new Recipe({
            name: req.body.name,
            instructions: req.body.instructions,
            owner: req.session.user._id,
            ingredients: ingredientIds, 
        });

        await newRecipe.save();
        console.log("✅ Recipe saved successfully:", newRecipe);
        res.redirect('/recipes');
    } catch (error) {
        console.error("🔴 Error saving recipe:", error);
        res.redirect('/');
    }
});

// Show a specific recipe (GET /recipes/:recipeId)
router.get('/:id', isSignedIn, async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
    
        if (!recipe) {
            return res.send('Recipe not found.');
        }
    
        res.render('recipes/show.ejs', { recipe });
        } catch (error) {
        console.error("🔴 Error fetching recipe:", error);
        res.redirect('/recipes');
    }
});

// Delete a recipe (DELETE /recipes/:id)
router.delete('/:id', isSignedIn, async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
    
        if (!recipe) {
            return res.send('Recipe not found.');
        }
    
        // Access control: Ensure only the owner can delete
        if (!recipe.owner.equals(req.session.user._id)) {
            return res.send('Unauthorized: You can only delete your own recipes.');
        }

        await Recipe.deleteOne({ _id: req.params.id });
    
        console.log(`✅ Recipe deleted: ${recipe.name}`);
        res.redirect('/recipes');
    } catch (error) {
        console.error("🔴 Error deleting recipe:", error);
        res.redirect('/recipes');
    }
});

// Show edit form for a specific recipe (GET /recipes/:id/edit)
router.get('/:id/edit', isSignedIn, async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id).populate('ingredients'); // Populate ingredients
        const allIngredients = await Ingredient.find(); // ✅ Fetch all ingredients

        if (!recipe) return res.send('Recipe not found.');
        if (!recipe.owner.equals(req.session.user._id)) return res.send('Unauthorized: You can only edit your own recipes.');

        res.render('recipes/edit.ejs', { recipe, allIngredients }); // ✅ Pass `allIngredients` to the view
    } catch (error) {
        console.error("🔴 Error fetching recipe for edit:", error);
        res.redirect('/recipes');
    }
});

// Update a recipe (PUT /recipes/:id)
router.put('/:id', isSignedIn, async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
    
        if (!recipe) {
            return res.send('Recipe not found.');
        }
    
        // Access control: Ensure only the owner can update
        if (!recipe.owner.equals(req.session.user._id)) {
            return res.send('Unauthorized: You can only edit your own recipes.');
        }
    
        let ingredientIds = req.body.ingredients;
        if (!ingredientIds) {
        ingredientIds = []; // If no ingredients were selected, reset the array
        } else if (!Array.isArray(ingredientIds)) {
        ingredientIds = [ingredientIds]; // Convert single selection to an array
    }

        // Update recipe fields
        recipe.name = req.body.name;
        recipe.instructions = req.body.instructions;
        recipe.ingredients = ingredientIds; // Update ingredients
        await recipe.save(); // Save updated recipe
    
        console.log(`✅ Recipe updated: ${recipe.name}`);
        res.redirect(`/recipes/${recipe._id}`); // Redirect to the updated recipe's page
    } catch (error) {
        console.error("🔴 Error updating recipe:", error);
        res.redirect('/recipes');
    }
});

module.exports = router;
