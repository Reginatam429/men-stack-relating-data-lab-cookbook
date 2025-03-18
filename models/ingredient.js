const mongoose = require('mongoose');

const ingredientSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, // Prevent duplicate ingredients in the database
    }
});

const Ingredient = mongoose.model('Ingredient', ingredientSchema);

module.exports = Ingredient;