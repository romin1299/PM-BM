const mongoose = require('mongoose')

const machineSchema = mongoose.Schema({
    machine_code: {
        type: String
    },
    machine_name: {
        type: String
    },
    machine_nickname: {
        type: String
    },
    machine_sequence: {
        type: Number
    },
    installation_date: {
        type: String
    },
    maker_name: {
        type: String
    },
    maker_sr_no: {
        type: String
    },
    manufacturingDate: {
        type: String
    },
    isPM: {
        type: String
    },
    line_names: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lines"
    },
    checkSheet_data: [
        {
            current_year: { type: String },
            checkSheet: [
                {
                    tableRowId: {
                        type: Number
                    },
                    category: {
                        type: String
                    },
                    inspection_parent_name: {
                        type: String
                    },
                    inspection_point: {
                        type: String
                    },
                    judgement_criteria: {
                        type: String
                    },
                    action: {
                        type: String
                    },
                    cycle: {
                        type: String
                    },
                    personInCharge: {
                        type: String
                    },
                    PM_time: {
                        type: String
                    },
                    start_month: {
                        type: String
                    },
                    planningTableAnimationArray2:
                    {
                        Apr: { type: [String] },

                        May: { type: [String] },

                        June: { type: [String] },

                        July: { type: [String] },

                        Aug: { type: [String] },

                        Sep: { type: [String] },

                        Oct: { type: [String] },

                        Nov: { type: [String] },

                        Dec: { type: [String] },

                        Jan: { type: [String] },

                        Feb: { type: [String] },

                        Mar: { type: [String] },
                    },
                    abnormalityDetails:
                    {
                        Apr: {
                            abnormalityRemarks: { type: String, },
                            abnormalityStatus: { type: String, },
                            targetDate: { type: [String] },
                            PMuploadedImage: { type: String },
                            remarksOnClose: { type: String, },
                            doneDate: { type: String, },
                            doneBy: { type: String, },
                        },

                        May: {
                            abnormalityRemarks: { type: String, },
                            abnormalityStatus: { type: String, },
                            targetDate: { type: [String] },
                            PMuploadedImage: { type: String },
                            remarksOnClose: { type: String, },
                            doneDate: { type: String, },
                            doneBy: { type: String, },
                        },

                        June: {
                            abnormalityRemarks: { type: String, },
                            abnormalityStatus: { type: String, },
                            targetDate: { type: [String] },
                            PMuploadedImage: { type: String },
                            remarksOnClose: { type: String, },
                            doneDate: { type: String, },
                            doneBy: { type: String, },
                        },

                        July: {
                            abnormalityRemarks: { type: String, },
                            abnormalityStatus: { type: String, },
                            targetDate: { type: [String] },
                            PMuploadedImage: { type: String },
                            remarksOnClose: { type: String, },
                            doneDate: { type: String, },
                            doneBy: { type: String, },
                        },

                        Aug: {
                            abnormalityRemarks: { type: String, },
                            abnormalityStatus: { type: String, },
                            targetDate: { type: [String] },
                            PMuploadedImage: { type: String },
                            remarksOnClose: { type: String, },
                            doneDate: { type: String, },
                            doneBy: { type: String, },
                        },

                        Sep: {
                            abnormalityRemarks: { type: String, },
                            abnormalityStatus: { type: String, },
                            targetDate: { type: [String] },
                            PMuploadedImage: { type: String },
                            remarksOnClose: { type: String, },
                            doneDate: { type: String, },
                            doneBy: { type: String, },
                        },

                        Oct: {
                            abnormalityRemarks: { type: String, },
                            abnormalityStatus: { type: String, },
                            targetDate: { type: [String] },
                            PMuploadedImage: { type: String },
                            remarksOnClose: { type: String, },
                            doneDate: { type: String, },
                            doneBy: { type: String, },
                        },

                        Nov: {
                            abnormalityRemarks: { type: String, },
                            abnormalityStatus: { type: String, },
                            targetDate: { type: [String] },
                            PMuploadedImage: { type: String },
                            remarksOnClose: { type: String, },
                            doneDate: { type: String, },
                            doneBy: { type: String, },
                        },

                        Dec: {
                            abnormalityRemarks: { type: String, },
                            abnormalityStatus: { type: String, },
                            targetDate: { type: [String] },
                            PMuploadedImage: { type: String },
                            remarksOnClose: { type: String, },
                            doneDate: { type: String, },
                            doneBy: { type: String, },
                        },

                        Jan: {
                            abnormalityRemarks: { type: String, },
                            abnormalityStatus: { type: String, },
                            targetDate: { type: [String] },
                            PMuploadedImage: { type: String },
                            remarksOnClose: { type: String, },
                            doneDate: { type: String, },
                            doneBy: { type: String, },
                        },

                        Feb: {
                            abnormalityRemarks: { type: String, },
                            abnormalityStatus: { type: String, },
                            targetDate: { type: [String] },
                            PMuploadedImage: { type: String },
                            remarksOnClose: { type: String, },
                            doneDate: { type: String, },
                            doneBy: { type: String, },
                        },

                        Mar: {
                            abnormalityRemarks: { type: String, },
                            abnormalityStatus: { type: String, },
                            targetDate: { type: [String] },
                            PMuploadedImage: { type: String },
                            remarksOnClose: { type: String, },
                            doneDate: { type: String, },
                            doneBy: { type: String, },
                        },
                    },
                    spareDetails: {
                        Apr: {
                            spareParts: { type: String, },
                            partName: { type: String, },
                            partNo: { type: String, },
                            cost: { type: String, },
                        },

                        May: {
                            spareParts: { type: String, },
                            partName: { type: String, },
                            partNo: { type: String, },
                            cost: { type: String, },
                        },

                        June: {
                            spareParts: { type: String, },
                            partName: { type: String, },
                            partNo: { type: String, },
                            cost: { type: String, },
                        },

                        July: {
                            spareParts: { type: String, },
                            partName: { type: String, },
                            partNo: { type: String, },
                            cost: { type: String, },
                        },

                        Aug: {
                            spareParts: { type: String, },
                            partName: { type: String, },
                            partNo: { type: String, },
                            cost: { type: String, },
                        },

                        Sep: {
                            spareParts: { type: String, },
                            partName: { type: String, },
                            partNo: { type: String, },
                            cost: { type: String, },
                        },

                        Oct: {
                            spareParts: { type: String, },
                            partName: { type: String, },
                            partNo: { type: String, },
                            cost: { type: String, },
                        },

                        Nov: {
                            spareParts: { type: String, },
                            partName: { type: String, },
                            partNo: { type: String, },
                            cost: { type: String, },
                        },

                        Dec: {
                            spareParts: { type: String, },
                            partName: { type: String, },
                            partNo: { type: String, },
                            cost: { type: String, },
                        },

                        Jan: {
                            spareParts: { type: String, },
                            partName: { type: String, },
                            partNo: { type: String, },
                            cost: { type: String, },
                        },

                        Feb: {
                            spareParts: { type: String, },
                            partName: { type: String, },
                            partNo: { type: String, },
                            cost: { type: String, },
                        },

                        Mar: {
                            spareParts: { type: String, },
                            partName: { type: String, },
                            partNo: { type: String, },
                            cost: { type: String, },
                        },
                    },
                    PMOkImage: {
                        Apr: { type: String },

                        May: { type: String },

                        June: { type: String },

                        July: { type: String },

                        Aug: { type: String },

                        Sep: { type: String },

                        Oct: { type: String },

                        Nov: { type: String },

                        Dec: { type: String },

                        Jan: { type: String },

                        Feb: { type: String },

                        Mar: { type: String },
                    },
                    completionDateOfInspection: {
                        Apr: { type: String },

                        May: { type: String },

                        June: { type: String },

                        July: { type: String },

                        Aug: { type: String },

                        Sep: { type: String },

                        Oct: { type: String },

                        Nov: { type: String },

                        Dec: { type: String },

                        Jan: { type: String },

                        Feb: { type: String },

                        Mar: { type: String },
                    },
                    reasonForDelayWhenSkip: {
                        Apr: { type: String },

                        May: { type: String },

                        June: { type: String },

                        July: { type: String },

                        Aug: { type: String },

                        Sep: { type: String },

                        Oct: { type: String },

                        Nov: { type: String },

                        Dec: { type: String },

                        Jan: { type: String },

                        Feb: { type: String },

                        Mar: { type: String },
                    },
                    isAdded: {
                        type: Boolean
                    },
                    isEdited: {
                        type: Boolean
                    },
                    isDeleted: {
                        type: Boolean
                    },
                    flagForCount: {
                        type: Boolean
                    }
                }
            ],
            flagOfDoneWithDelayForOneMonth: {
                Apr: { type: Number },

                May: { type: Number },

                June: { type: Number },

                July: { type: Number },

                Aug: { type: Number },

                Sep: { type: Number },

                Oct: { type: Number },

                Nov: { type: Number },

                Dec: { type: Number },

                Jan: { type: Number },

                Feb: { type: Number },

                Mar: { type: Number },
            },
            completionTargetDate: {
                Apr: { type: String },

                May: { type: String },

                June: { type: String },

                July: { type: String },

                Aug: { type: String },

                Sep: { type: String },

                Oct: { type: String },

                Nov: { type: String },

                Dec: { type: String },

                Jan: { type: String },

                Feb: { type: String },

                Mar: { type: String },
            },
            dataSheet: {
                type: String
            },
            checksheet_status: {
                type: String
            },
            tl_approval_status: {
                type: [String]
            },
            hos_approval_status: {
                type: [String]
            },
            prd_tl_approval_status: {
                type: [String]
            },
            sender_tm_no: {
                type: [Number]
            },
            sender_tm_name: {
                type: [String]
            },
            plan_prepared_tm_no: {
                type: [Number]
            },
            plan_prepared_tm_name: {
                type: [String]
            },
            plan_prepared_email: {
                type: [String]
            },
            checkSheetSendingUser: {
                type: [String]
            },
            assign_TL: {
                type: [String]
            },
            assign_HOS: {
                type: [String]
            },
            assign_PRD_TL: {
                type: [String]
            },
            assign_TL_name: {
                type: [String]
            },
            assign_HOS_name: {
                type: [String]
            },
            assign_PRD_TL_name: {
                type: [String]
            },
            rejected_remarks: {
                type: [String]
            },
            approved_by_TL: {
                type: [String]
            },
            approved_by_PRD_TL: {
                type: [String]
            },
            approved_by_HOS: {
                type: [String]
            },
            preparation_TL_date: {
                type: [String]
            },
            preparation_TL_HOSS_date: {
                type: [String]
            },
            preparation_HOS_date: {
                type: [String]
            },
            planning_TL_date: {
                type: [String]
            },
            planning_PRD_TL_date: {
                type: [String]
            },
            // supportingOperatorList: {
            //     type: [String]
            // },
            totalPMTime: {
                Apr: {
                    totalWorkedPMTime: { type: Number },
                    supportingTMData: [
                        {
                            tm_name: { type: String },
                            tm_no: { type: Number },
                            workedTime: { type: Number }
                        }
                    ]
                },
                May: {
                    totalWorkedPMTime: { type: Number },
                    supportingTMData: [
                        {
                            tm_name: { type: String },
                            tm_no: { type: Number },
                            workedTime: { type: Number }
                        }
                    ]
                },
                June: {
                    totalWorkedPMTime: { type: Number },
                    supportingTMData: [
                        {
                            tm_name: { type: String },
                            tm_no: { type: Number },
                            workedTime: { type: Number }
                        }
                    ]
                },
                July: {
                    totalWorkedPMTime: { type: Number },
                    supportingTMData: [
                        {
                            tm_name: { type: String },
                            tm_no: { type: Number },
                            workedTime: { type: Number }
                        }
                    ]
                },
                Aug: {
                    totalWorkedPMTime: { type: Number },
                    supportingTMData: [
                        {
                            tm_name: { type: String },
                            tm_no: { type: Number },
                            workedTime: { type: Number }
                        }
                    ]
                },
                Sep: {
                    totalWorkedPMTime: { type: Number },
                    supportingTMData: [
                        {
                            tm_name: { type: String },
                            tm_no: { type: Number },
                            workedTime: { type: Number }
                        }
                    ]
                },
                Oct: {
                    totalWorkedPMTime: { type: Number },
                    supportingTMData: [
                        {
                            tm_name: { type: String },
                            tm_no: { type: Number },
                            workedTime: { type: Number }
                        }
                    ]
                },
                Nov: {
                    totalWorkedPMTime: { type: Number },
                    supportingTMData: [
                        {
                            tm_name: { type: String },
                            tm_no: { type: Number },
                            workedTime: { type: Number }
                        }
                    ]
                },
                Dec: {
                    totalWorkedPMTime: { type: Number },
                    supportingTMData: [
                        {
                            tm_name: { type: String },
                            tm_no: { type: Number },
                            workedTime: { type: Number }
                        }
                    ]
                },
                Jan: {
                    totalWorkedPMTime: { type: Number },
                    supportingTMData: [
                        {
                            tm_name: { type: String },
                            tm_no: { type: Number },
                            workedTime: { type: Number }
                        }
                    ]
                },
                Feb: {
                    totalWorkedPMTime: { type: Number },
                    supportingTMData: [
                        {
                            tm_name: { type: String },
                            tm_no: { type: Number },
                            workedTime: { type: Number }
                        }
                    ]
                },
                Mar: {
                    totalWorkedPMTime: { type: Number },
                    supportingTMData: [
                        {
                            tm_name: { type: String },
                            tm_no: { type: Number },
                            workedTime: { type: Number }
                        }
                    ]
                },
            },
            // finishedPMTime: {
            //     type: String
            // },
            PMworkedTMName: {
                Apr: { type: [String] },

                May: { type: [String] },

                June: { type: [String] },

                July: { type: [String] },

                Aug: { type: [String] },

                Sep: { type: [String] },

                Oct: { type: [String] },

                Nov: { type: [String] },

                Dec: { type: [String] },

                Jan: { type: [String] },

                Feb: { type: [String] },

                Mar: { type: [String] },
            },
            PMStatus: {
                Apr: { type: String },

                May: { type: String },

                June: { type: String },

                July: { type: String },

                Aug: { type: String },

                Sep: { type: String },

                Oct: { type: String },

                Nov: { type: String },

                Dec: { type: String },

                Jan: { type: String },

                Feb: { type: String },

                Mar: { type: String },
            },
            carriedPMStatus: {
                Apr: { type: String },

                May: { type: String },

                June: { type: String },

                July: { type: String },

                Aug: { type: String },

                Sep: { type: String },

                Oct: { type: String },

                Nov: { type: String },

                Dec: { type: String },

                Jan: { type: String },

                Feb: { type: String },

                Mar: { type: String },
            },
            PMDelayRemark: {
                Apr: { type: String },

                May: { type: String },

                June: { type: String },

                July: { type: String },

                Aug: { type: String },

                Sep: { type: String },

                Oct: { type: String },

                Nov: { type: String },

                Dec: { type: String },

                Jan: { type: String },

                Feb: { type: String },

                Mar: { type: String },
            },
            implemetation_completed_date: {
                Apr: { type: [String] },

                May: { type: [String] },

                June: { type: [String] },

                July: { type: [String] },

                Aug: { type: [String] },

                Sep: { type: [String] },

                Oct: { type: [String] },

                Nov: { type: [String] },

                Dec: { type: [String] },

                Jan: { type: [String] },

                Feb: { type: [String] },

                Mar: { type: [String] },
            },
            implemetation_completed_tm_no: {
                Apr: { type: [String] },

                May: { type: [String] },

                June: { type: [String] },

                July: { type: [String] },

                Aug: { type: [String] },

                Sep: { type: [String] },

                Oct: { type: [String] },

                Nov: { type: [String] },

                Dec: { type: [String] },

                Jan: { type: [String] },

                Feb: { type: [String] },

                Mar: { type: [String] },
            },
            implemetation_completed_tm_name: {
                Apr: { type: [String] },

                May: { type: [String] },

                June: { type: [String] },

                July: { type: [String] },

                Aug: { type: [String] },

                Sep: { type: [String] },

                Oct: { type: [String] },

                Nov: { type: [String] },

                Dec: { type: [String] },

                Jan: { type: [String] },

                Feb: { type: [String] },

                Mar: { type: [String] },
            },
            implementation_assign_PRD_TL: {
                Apr: { type: [String] },

                May: { type: [String] },

                June: { type: [String] },

                July: { type: [String] },

                Aug: { type: [String] },

                Sep: { type: [String] },

                Oct: { type: [String] },

                Nov: { type: [String] },

                Dec: { type: [String] },

                Jan: { type: [String] },

                Feb: { type: [String] },

                Mar: { type: [String] },
            },
            implementation_assign_MTD_TL: {
                Apr: { type: [String] },

                May: { type: [String] },

                June: { type: [String] },

                July: { type: [String] },

                Aug: { type: [String] },

                Sep: { type: [String] },

                Oct: { type: [String] },

                Nov: { type: [String] },

                Dec: { type: [String] },

                Jan: { type: [String] },

                Feb: { type: [String] },

                Mar: { type: [String] },
            },
            implementation_assign_MTD_HOS: {
                Apr: { type: [String] },

                May: { type: [String] },

                June: { type: [String] },

                July: { type: [String] },

                Aug: { type: [String] },

                Sep: { type: [String] },

                Oct: { type: [String] },

                Nov: { type: [String] },

                Dec: { type: [String] },

                Jan: { type: [String] },

                Feb: { type: [String] },

                Mar: { type: [String] },
            },
            implemetation_quality_remarks: {
                Apr: { type: [String] },

                May: { type: [String] },

                June: { type: [String] },

                July: { type: [String] },

                Aug: { type: [String] },

                Sep: { type: [String] },

                Oct: { type: [String] },

                Nov: { type: [String] },

                Dec: { type: [String] },

                Jan: { type: [String] },

                Feb: { type: [String] },

                Mar: { type: [String] },
            },
            implementation_rejected_remarks: {
                Apr: { type: [String] },

                May: { type: [String] },

                June: { type: [String] },

                July: { type: [String] },

                Aug: { type: [String] },

                Sep: { type: [String] },

                Oct: { type: [String] },

                Nov: { type: [String] },

                Dec: { type: [String] },

                Jan: { type: [String] },

                Feb: { type: [String] },

                Mar: { type: [String] },
            },
            implementation_approved_by_PRD_TL: {
                Apr: { type: [String] },

                May: { type: [String] },

                June: { type: [String] },

                July: { type: [String] },

                Aug: { type: [String] },

                Sep: { type: [String] },

                Oct: { type: [String] },

                Nov: { type: [String] },

                Dec: { type: [String] },

                Jan: { type: [String] },

                Feb: { type: [String] },

                Mar: { type: [String] },
            },
            implementation_approved_by_MTD_TL: {
                Apr: { type: [String] },

                May: { type: [String] },

                June: { type: [String] },

                July: { type: [String] },

                Aug: { type: [String] },

                Sep: { type: [String] },

                Oct: { type: [String] },

                Nov: { type: [String] },

                Dec: { type: [String] },

                Jan: { type: [String] },

                Feb: { type: [String] },

                Mar: { type: [String] },
            },
            implementation_approved_by_MTD_HOS: {
                Apr: { type: [String] },

                May: { type: [String] },

                June: { type: [String] },

                July: { type: [String] },

                Aug: { type: [String] },

                Sep: { type: [String] },

                Oct: { type: [String] },

                Nov: { type: [String] },

                Dec: { type: [String] },

                Jan: { type: [String] },

                Feb: { type: [String] },

                Mar: { type: [String] },
            },
            implementation_approved_PRD_TL_date: {
                Apr: { type: [String] },

                May: { type: [String] },

                June: { type: [String] },

                July: { type: [String] },

                Aug: { type: [String] },

                Sep: { type: [String] },

                Oct: { type: [String] },

                Nov: { type: [String] },

                Dec: { type: [String] },

                Jan: { type: [String] },

                Feb: { type: [String] },

                Mar: { type: [String] },
            },
            implementation_approved_MTD_TL_date: {
                Apr: { type: [String] },

                May: { type: [String] },

                June: { type: [String] },

                July: { type: [String] },

                Aug: { type: [String] },

                Sep: { type: [String] },

                Oct: { type: [String] },

                Nov: { type: [String] },

                Dec: { type: [String] },

                Jan: { type: [String] },

                Feb: { type: [String] },

                Mar: { type: [String] },
            },
            implementation_approved_MTD_HOS_date: {
                Apr: { type: [String] },

                May: { type: [String] },

                June: { type: [String] },

                July: { type: [String] },

                Aug: { type: [String] },

                Sep: { type: [String] },

                Oct: { type: [String] },

                Nov: { type: [String] },

                Dec: { type: [String] },

                Jan: { type: [String] },

                Feb: { type: [String] },

                Mar: { type: [String] },
            },
            implemetation_prd_tl_approval_status: {
                Apr: { type: [String] },

                May: { type: [String] },

                June: { type: [String] },

                July: { type: [String] },

                Aug: { type: [String] },

                Sep: { type: [String] },

                Oct: { type: [String] },

                Nov: { type: [String] },

                Dec: { type: [String] },

                Jan: { type: [String] },

                Feb: { type: [String] },

                Mar: { type: [String] },
            },
            implemetation_mtd_tl_approval_status: {
                Apr: { type: [String] },

                May: { type: [String] },

                June: { type: [String] },

                July: { type: [String] },

                Aug: { type: [String] },

                Sep: { type: [String] },

                Oct: { type: [String] },

                Nov: { type: [String] },

                Dec: { type: [String] },

                Jan: { type: [String] },

                Feb: { type: [String] },

                Mar: { type: [String] },
            },
            implemetation_mtd_hos_approval_status: {
                Apr: { type: [String] },

                May: { type: [String] },

                June: { type: [String] },

                July: { type: [String] },

                Aug: { type: [String] },

                Sep: { type: [String] },

                Oct: { type: [String] },

                Nov: { type: [String] },

                Dec: { type: [String] },

                Jan: { type: [String] },

                Feb: { type: [String] },

                Mar: { type: [String] },
            },
            revisionContentData:[
                {
                    revisionContent:{
                        type: String
                    },
                    revisionContentDate: {
                        type: String
                    },
                    revisedBy: {
                        type: String
                    }
                }
            ]
        }
    ]


})

const Machine = new mongoose.model('MachinesAllData', machineSchema);
module.exports = Machine;