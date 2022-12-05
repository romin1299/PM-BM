const mongoose = require('mongoose')

const subSectionSchema = new mongoose.Schema({
    subSection_id: {
        type: String
    },
    subSection_name: {
        type: String
    },
    section_names: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sections'
    },
    subSection_sequence: {
        type: Number
    }
})

const SubSection = new mongoose.model('SubSections', subSectionSchema);
module.exports = SubSection;