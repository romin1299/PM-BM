import React, { useEffect, useState, useContext } from "react";
import PRDRequestSheet from "./PRDRequestSheet";
import MTDRequestSheet from "./MTDRequestSheet";
import { useParams, useNavigate } from "react-router-dom";
import RoutingContext from "../../../context/routing/RoutingContext";

function MyTable() {
  const navigate = useNavigate();
  const context = useContext(RoutingContext);

  const { machine_code, generateType, selectedYear } = useParams();
  const [selectedMachineDetails, setMachineDetails] = useState("");
  const [approvalListOfBM, setApprovalListOfBM] = useState([]);

  const [machineStatus, setMachineStatus] = useState({
    pmStatusData: "",
    bmStatusData: "",
  });

  const getMachineDetails = async () => {
    try {
      const res = await fetch(
        `/getMachineDetailsOnScanningRequest/${generateType}/?machine_code=${machine_code}&&current_year=${selectedYear}`,
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
        const {
          machine,
          requestSheetApprovalList,
          pmStatusData,
          bmStatusData,
        } = await res.json();

        setMachineDetails(machine);
        setApprovalListOfBM(requestSheetApprovalList);
        setMachineStatus({
          bmStatusData,
          pmStatusData,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getMachineDetails();
  }, [machine_code]);

  return (
    <div className="p-2">
      <div id="request-sheet-target" className="border border-dark">
        {context?.tm_department === "PRD" && (
          <PRDRequestSheet
            selectedMachineDetails={selectedMachineDetails}
            machineStatus={machineStatus}
            // approvalListOfBM={approvalListOfBM}
          />
        )}

        {/* need to add condition for PRD not able add data on MTD part */}
        {/* <MTDRequestSheet
        selectedMachineDetails={selectedMachineDetails}
        approvalListOfBM={approvalListOfBM}
      /> */}
      </div>
    </div>
  );
}

export default MyTable;
