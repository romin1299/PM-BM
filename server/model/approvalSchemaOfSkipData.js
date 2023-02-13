const mongoose = require('mongoose')

const approvalSchemaOfSkipData = new mongoose.Schema({

    section_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sections'
    },
    subSection_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubSections'
    },
    approvalID: {
        type: String
    },
    reasonForDelayOfTL: {
        type: String
    },
    skippedDataApprovalSender: {
        senderTLNo: {
            type: Number
        },
        senderTLName: {
            type: String
        },
        senderTLEmail: {
            type: String
        },

    },
    assignAndApprovedHOSlist: {
        assignMTDHOSname: {
            type: String
        },
        assignMTDHOSemail: {
            type: String
        },
    },
    assignAndApprovedMTDHODlist: {
        assignMTDHODname: {
            type: String
        },
        assignMTDHODemail: {
            type: String
        },
    },
    assignAndApprovedPRDHOSlist: {
        assignPRDHOSname: {
            type: String
        },
        assignPRDHOSemail: {
            type: String
        },
    },
    assignAndApprovedPRDHODlist: {
        assignPRDHODname: {
            type: String
        },
        assignPRDHODemail: {
            type: String
        },
    },
    approvalStatusOfMTDHOS: {
        type: String
    },
    approvalStatusOfMTDHOD: {
        type: String
    },
    approvalStatusOfPRDHOS: {
        type: String
    },
    approvalStatusOfPRDHOD: {
        type: String
    },
    rejectedRemarksOfSkipPMMachines: {
        type: String
    }
})

const ApprovalOfSkipPM = new mongoose.model('ApprovalOfSkipPM', approvalSchemaOfSkipData);
module.exports = ApprovalOfSkipPM;