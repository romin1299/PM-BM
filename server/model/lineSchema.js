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

    annualPmScheduleApproval: [{

        current_year: { type: String },

        mtdTlId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users'
        },

        mtdHos: {
            mtdHosId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Users'
            },
            mtdHosApprovalStatus: {
                type: String
            }
        },

        mtdHod: {
            mtdHodId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Users'
            },
            mtdHodApprovalStatus: {
                type: String
            }
        },

        prdHos: {
            prdHosId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Users'
            },
            prdHosApprovalStatus: {
                type: String
            }
        },
    }]
})

const Line = new mongoose.model('Lines', lineSchema);
module.exports = Line;