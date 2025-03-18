const express = require('express');
const router = express.Router();

const Ingredient = require('../models/ingredient.js');

// logic
// Show all ingredients and provide a form to add new ones
router.get('/', async (req, res) => {
    try {
        const ingredients = await Ingredient.find();
        res.render('ingredients/index.ejs', { ingredients });
    } catch (error) {
        console.error("🔴 Error fetching ingredients:", error);
        res.redirect('/');
    }
});

// Create a new ingredient (POST /ingredients)
router.post('/', async (req, res) => {
    try {
        const existingIngredient = await Ingredient.findOne({ name: req.body.name.trim() });
    
        if (existingIngredient) {
            return res.send('Ingredient already exists.');
        }
    
        const newIngredient = new Ingredient({ name: req.body.name.trim() });
        await newIngredient.save();
    
        console.log(`✅ Ingredient created: ${newIngredient.name}`);
        res.redirect('/ingredients');
    } catch (error) {
        console.error("🔴 Error adding ingredient:", error);
        res.redirect('/');
    }
});

module.exports = router;