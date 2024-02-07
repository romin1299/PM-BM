import React, { useEffect, useState, useContext } from "react";
import PRDRequestSheetForUpdate from "./PRDRequestSheetForView";
import { useParams, useNavigate } from "react-router-dom";
import RoutingContext from "../../../context/routing/RoutingContext";
import MTDRequestSheet from "./MTDRequestSheetForView";

function MainRequestSheetForView() {
  const navigate = useNavigate();
  const context = useContext(RoutingContext);

  const { machine_code, requestSheetID, generateType, selectedYear } =
    useParams();
  const [selectedMachineDetails, setMachineDetails] = useState("");
  const [requestSheetDataOfBM, setRequestSheetDataOfBM] = useState("");

  const [approvalListOfBM, setApprovalListOfBM] = useState([]);
  const [supportingTMList, setSupportingTMList] = useState([]);

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
        // setMachine(machine);

        setMachineDetails(machine);
        setApprovalListOfBM(requestSheetApprovalList);
        setMachineStatus({
          bmStatusData,
          pmStatusData,
        });
        // setSelectedAttendee(breakDownAttendedBy);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getRequestSheetDetails = async () => {
    try {
      const res = await fetch(
        `/getMachineRequestSheetDetails/?_id=${requestSheetID}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const data = await res.json();
      if (res.status === 404) {
        console.log("error", data?.message);
      } else {
        setRequestSheetDataOfBM(data?.requestSheetData?.[0]);
        setSupportingTMList(data?.TLHOSS_and_TM_user_list);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getMachineDetails();
  }, [machine_code]);

  useEffect(() => {
    getRequestSheetDetails();
  }, [requestSheetID]);

  return (
    <div className="p-2">
      <div id="request-sheet-target" className="border border-dark">
        <PRDRequestSheetForUpdate
          // selectedMachineDetails={selectedMachineDetails}
          machineId={selectedMachineDetails?._id}
          requestSheetDataOfBM={requestSheetDataOfBM}
          machineStatus={machineStatus}
          // approvalListOfBM={approvalListOfBM}
        />

        {/* need to add condition for PRD not able add data on MTD part */}
        <MTDRequestSheet
          selectedMachineDetails={selectedMachineDetails}
          approvalListOfBM={approvalListOfBM}
          requestSheetDataOfBM={requestSheetDataOfBM}
          supportingTMList={supportingTMList}
        />
      </div>
    </div>
  );
}

export default MainRequestSheetForView;
