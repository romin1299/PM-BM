const mongoose = require('mongoose')

const cellSchema = new mongoose.Schema({
    cell_id: {
        type: String
    },
    cell_name: {
        type: String
    },
    subSection_names: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubSections'
    },
    cell_sequence: {
        type: Number
    }
})

const Cell = new mongoose.model('Cells', cellSchema);
module.exports = Cell;