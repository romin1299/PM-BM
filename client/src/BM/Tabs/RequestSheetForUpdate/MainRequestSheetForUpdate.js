import React, { useEffect, useState } from "react";
import PRDRequestSheetForUpdate from "./PRDRequestSheetForUpdate";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import MTDRequestSheet from "../RequestSheet/MTDRequestSheet";

function MyTable() {
  const navigate = useNavigate();

  const { machine_code, requestSheetID, generateType, selectedYear } =
    useParams();
  const [selectedMachineDetails, setMachineDetails] = useState("");
  const [requestSheetDataOfBM, setRequestSheetDataOfBM] = useState("");

  const [machineStatus, setMachineStatus] = useState({
    pmStatusData: "",
    bmStatusData: "",
  });

  const [searchParams] = useSearchParams();
  const flagForTogglingFilter = searchParams.get("flagForTogglingFilter");
  const selectedValue = searchParams.get("selectedValue");

  const [approvalListOfBM, setApprovalListOfBM] = useState([]);
  const [supportingTMList, setSupportingTMList] = useState([]);
  const getMachineDetails = async () => {
    try {
      const res = await fetch(
        `/getMachineDetailsOnScanningRequest/?machine_code=${machine_code}&&current_year=${selectedYear}`,
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
          flagForTogglingFilter={flagForTogglingFilter}
          selectedValue={selectedValue}
        />
      </div>
    </div>
  );
}

export default MyTable;
