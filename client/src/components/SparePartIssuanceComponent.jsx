import React, { useState } from "react";
import SparePartsRequestForm from "../BM/SparePartsRequest/SparePartsRequestForm";

const SparePartIssuanceComponent = ({ machineParentHierarchy }) => {
  const [sparePartsRequestModal, setSparePartsRequestModal] = useState(false);

  const handleSparePartsModelState = (propRow) =>
    setSparePartsRequestModal(
      (sparePartsRequestModal) => !sparePartsRequestModal,
    );

  return (
    <div>
      <button
        type="Button"
        className="bg-warning text-white border-0"
        onClick={() => handleSparePartsModelState()}
      >
        Spare
      </button>

      {sparePartsRequestModal && (
        <SparePartsRequestForm
          issuedFrom="PM"
          machineParentHierarchy={machineParentHierarchy}
          modelProp={{
            show: sparePartsRequestModal,
            onHide: handleSparePartsModelState,
          }}
        />
      )}
    </div>
  );
};

export default SparePartIssuanceComponent;
