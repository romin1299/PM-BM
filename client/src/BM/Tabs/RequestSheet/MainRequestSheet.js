import React, { useEffect, useState, useContext } from "react";
import PRDRequestSheet from "./PRDRequestSheet";
import MTDRequestSheet from "./MTDRequestSheet";
import { useParams, useNavigate } from "react-router-dom";
import RoutingContext from "../../../context/routing/RoutingContext";

function MyTable() {
  const navigate = useNavigate();
  const context = useContext(RoutingContext);

  const { machine_code, generateType } = useParams();
  const [selectedMachineDetails, setMachineDetails] = useState("");
  const [approvalListOfBM, setApprovalListOfBM] = useState([]);

  const getMachineDetails = async () => {
    try {
      const res = await fetch(
        `/getMachineDetailsOnScanningRequest/${generateType}/?machine_code=${machine_code}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      if (res.status === 404) {
        if (generateType === "scanned") {
          navigate("/", { replace: true });
        } else {
          navigate("/bm/generateRequestSheetMainDashboard", { replace: true });
        }
      } else {
        const { machine, requestSheetApprovalList } = await res.json();
        // setMachine(machine);
        console.log(machine);

        setMachineDetails(machine);
        setApprovalListOfBM(requestSheetApprovalList);
        // setSelectedAttendee(breakDownAttendedBy);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getMachineDetails();
  }, [machine_code]);

  return (
    <>
      <div style={{ overflow: "scroll" }}>
        {context?.tm_department === "PRD" && (
          <PRDRequestSheet
            selectedMachineDetails={selectedMachineDetails}
            // approvalListOfBM={approvalListOfBM}
          />
        )}

        {/* need to add condition for PRD not able add data on MTD part */}
        {/* <MTDRequestSheet
        selectedMachineDetails={selectedMachineDetails}
        approvalListOfBM={approvalListOfBM}
      /> */}
      </div>
    </>
  );
}

export default MyTable;
