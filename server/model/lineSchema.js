const mongoose = require('mongoose')

const lineSchema = new mongoose.Schema({
    line_id: {
        type: String
    },
    line_name: {
        type: String
    },
    cell_names: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cells'
    },
    line_sequence: {
        type: Number
    },
})

const Line = new mongoose.model('Lines', lineSchema);
module.exports = Line;