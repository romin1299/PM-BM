import React from "react";
import ModalCMRequestSheetHistory from "./ModalCMRequestSheetHistory";
import { useState } from "react";

const ButtonCMRequestSheetHistory = (props) => {
  const [cmHistoryModal, setCmHistoryModal] = useState(false);

  const handleCMHistoryModal = () =>
    setCmHistoryModal((cmHistoryModal) => !cmHistoryModal);

  return (
    <>
      <button
        className="btn bg-warning"
        onClick={handleCMHistoryModal}
        type="button"
      >
        CM Request Sheet History
      </button>

      <ModalCMRequestSheetHistory
        {...props}
        modelProp={{
          show: cmHistoryModal,
          onHide: handleCMHistoryModal,
        }}
      />
    </>
  );
};

export default ButtonCMRequestSheetHistory;
