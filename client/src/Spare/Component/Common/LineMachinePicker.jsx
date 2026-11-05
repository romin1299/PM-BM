import React from "react";
import ChartsToolbar from "../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";

/**
 * One line → machine selection block (the same section → sub-section → cell →
 * line → machine cascade the request-sheet form uses). The change request
 * renders two of these (NEW and OLD); the delete request renders one.
 */
const LineMachinePicker = ({ label, state, dispatch, selectedMachine }) => (
  <div className="border p-2 mb-2">
    <small className="fw-bold d-block mb-1">{label}</small>
    <ChartsToolbar
      baseUrlForFiltering="/getFiltrationValue/all-filtration"
      queryParams={{ moduleType: "Spare" }}
      reduceState={state}
      reducerDispatch={dispatch}
      sectionFiltration
      subSectionFiltration
      cellFiltration
      lineFiltration
      machineFiltration
    />
    {selectedMachine && (
      <small className="text-muted d-block mt-1">
        Selected machine: {selectedMachine?.machine_name}
      </small>
    )}
  </div>
);

export default LineMachinePicker;
