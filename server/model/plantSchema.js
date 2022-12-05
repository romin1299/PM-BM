const mongoose = require('mongoose')

const plantSchema = new mongoose.Schema({
    plant_id: {
        type: String
    },
    plant_name: {
        type: String
    },
})

const Plant = new mongoose.model('Plants', plantSchema);
module.exports = Plant;

