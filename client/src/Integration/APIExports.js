// All fetch APIs

import fetchPlantInfo from "./AllFetchApis/fetchPlantInfo.js"
import postPlantToGetSectionInfo from "./AllFetchApis/postPlantToGetSectionInfo.js"
import postSectionToGetSubSectionInfo from "./AllFetchApis/postSectionToGetSubSectionInfo.js"

// Plant ADD,Update,Delete APIS

import postNewPlant from "./PlantAPIs/postNewPlant.js"
import updatePlant from "./PlantAPIs/updatePlant.js"
import deletePlant from "./PlantAPIs/deletePlant.js"

// Section ADD,Update,Delete APIS

import newSection from "./SectionAPIs/newSection.js"
import updateSection from "./SectionAPIs/updateSection.js"
import deleteSection from "./SectionAPIs/deleteSection.js"

// SubSection ADD,Update,Delete APIS

import newSubSection from "./SubSectionAPIs/newSubSection.js"
import updateSubSection from "./SubSectionAPIs/updateSubSection.js"
import deleteSubSection from "./SubSectionAPIs/deleteSubSection.js"

// Cell ADD,Update,Delete APIS

import newCell from "./CellAPIs/newCell.js"
import updateCell from "./CellAPIs/updateCell.js"
import deleteCell from "./CellAPIs/deleteCell.js"

// Line ADD,Update,Delete APIS

import newLine from "./LineAPIs/newLine.js"
import updateLine from "./LineAPIs/updateLine.js"
import deleteLine from "./LineAPIs/deleteLine.js"

// Machine Update,Delete APIs

import deleteMachine from "./MachineAPIs/deleteMachine.js"
import updateMachine from "./MachineAPIs/updateMachine.js"

// Planning Phase 

import updateSelectedMachineCheckSheetTableRowData from "./PlanningPhase/updateSelectedMachineChecksheetTableRowData.js"

// Financial year list 
import fetchFinancialYears from "./AllFetchApis/fetchFinancialYears.js"

//user APIs
import fetchLoggedUserDetails from "./UserAPIs/fetchLoggedUserDetails.js"


export {

    //Common fetch APIS

    fetchPlantInfo,
    postPlantToGetSectionInfo,
    postSectionToGetSubSectionInfo,

    postNewPlant, updatePlant, deletePlant,
    newSection, updateSection, deleteSection,
    newSubSection, updateSubSection, deleteSubSection,
    newCell, deleteCell, updateCell,
    newLine, updateLine, deleteLine,
    updateMachine, deleteMachine, fetchFinancialYears,

    // planning 

    updateSelectedMachineCheckSheetTableRowData,

    //user
    fetchLoggedUserDetails
}