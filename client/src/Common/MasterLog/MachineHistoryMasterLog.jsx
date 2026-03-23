import React from "react";
// import { Modal } from "react-bootstrap";

import MasterLogTable from "./MasterLogTable";

const MachineHistoryMasterLog = () => {
  return (
    <MasterLogTable
      flagForTogglingFilter="based-on-machine"
      selectedValue={selectedRow?.machines?.[0]?._id}
      selectedYear={selectedYear}
      selectedMonth={selectedMonth}
    />
    // <Modal
    //   {...modelProp}
    // //   fullscreen
    //   size="xl"
    //   aria-labelledby="contained-modal-title-vcenter"
    //   centered
    // >
    //   <Modal.Header closeButton>
    //     <Modal.Title id="contained-modal-title-vcenter">
    //       {selectedRow?.machines?.[0]?.machine_code}
    //     </Modal.Title>
    //   </Modal.Header>
    //   <Modal.Body className="container">
    //     <MasterLogTable
    //       flagForTogglingFilter="based-on-machine"
    //       selectedValue={selectedRow?.machines?.[0]?._id}
    //       selectedYear={selectedYear}
    //       selectedMonth={selectedMonth}
    //     />
    //   </Modal.Body>
    // </Modal>
  );
};

export default MachineHistoryMasterLog;
