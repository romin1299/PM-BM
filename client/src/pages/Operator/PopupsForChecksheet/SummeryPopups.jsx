import React, { useEffect, useState } from "react";
import MaterialTable from "@material-table/core";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import LoadingAnimation from "../../Reports/ReportComponents/LoadingAnimation";
import NotFound from "../../Reports/ReportComponents/NotFound";

const SummeryPopups = ({ close, machineData }) => {
  // const tableData = machineData?.checkSheet_data?.checkSheet;
  const [tableData, setTableData] = useState([]);

  const [loadingAnimationState, setLoadingAnimationState] = useState(
    <LoadingAnimation />
  );
  const postMachineToGetAllDataForSummary = async () => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/postMachineToGetAllDataForSummary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          machine_code: machineData?.machine_code,
          selectedYear: machineData?.checkSheet_data?.current_year,
        }),
      });
      const data = await res.json();
      console.log(data);
      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // setLineData(data.lineData);
        setTableData(data.logHistoryAllData);
        setLoadingAnimationState(<NotFound />);
      }
    } catch (error) {
      console.log(error);
    }
  };
  console.log(tableData);
  const monthKeyArray = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  // const financialYearWiseMonthKeyArray = [
  //   "Apr",
  //   "May",
  //   "June",
  //   "July",
  //   "Aug",
  //   "Sep",
  //   "Oct",
  //   "Nov",
  //   "Dec",
  //   "Jan",
  //   "Feb",
  //   "Mar",
  // ];

  let monthForCompareSystemMonth = monthKeyArray[new Date().getMonth()];

  // console.log(
  //   machineData?.checkSheet_data?.implemetation_mtd_tl_approval_status?.[
  //     monthForCompareSystemMonth
  //   ]?.at(-1),
  //   machineData?.checkSheet_data?.implemetation_mtd_hos_approval_status?.[
  //     monthForCompareSystemMonth
  //   ]?.at(-1)
  // );

  const subSectionHeader = [
    {
      title: "Month",
      field: "schedule_month",
      // render: (rowData) => financialYearWiseMonthKeyArray[rowData?.start_month],
      width: "5%",
    },
    {
      title: "Sr. No.",
      render: (rowData) => `${rowData?.tableData.id + 1}`,
      // align: "center",
      width: "6%",
    },
    {
      title: "Inspection Item",
      field: "inspection_parent_name",
      editable: "false",
    },
    {
      title: "Remarks",
      field: "remarks",
      editable: "false",
    },
    {
      title: "Abnormality{Yes/No}",
      // render: (rowData) =>
      //   rowData?.abnormalityDetails
      //     ? rowData?.abnormalityDetails[monthForCompareSystemMonth]
      //         ?.abnormalityRemarks
      //       ? "Yes"
      //       : ""
      //     : "",
      // width: "5%",
      field: "abnormality",
    },
    {
      title: "Ab. Remarks",
      field: `abnormalityRemarks`,
      // render: (rowData) =>
      //   rowData?.abnormalityDetails
      //     ? rowData?.abnormalityDetails[monthForCompareSystemMonth]
      //         ?.abnormalityRemarks
      //     : "",
    },
    {
      title: "Status",
      // render: (rowData) =>
      //   rowData?.abnormalityDetails
      //     ? rowData?.abnormalityDetails[monthForCompareSystemMonth]
      //         ?.abnormalityStatus
      //     : "",
      width: "5%",

      field: "abnormalityStatus",
    },
    {
      title: "T.D",
      // render: (rowData) =>
      //   rowData?.abnormalityDetails
      //     ? rowData?.abnormalityDetails[monthForCompareSystemMonth]?.targetDate
      //     : "",
      field: "targetDate",
    },
    {
      title: "Spare{Yes/No}",
      // render: (rowData) =>
      //   rowData?.spareDetails
      //     ? rowData?.spareDetails[monthForCompareSystemMonth]?.spareParts
      //     : "",
      field: "spareParts",
      width: "5%",
    },
    {
      title: "P. Name",
      // render: (rowData) =>
      //   rowData?.spareDetails
      //     ? rowData?.spareDetails[monthForCompareSystemMonth]?.partName
      //     : "",
      field: "partName",
    },
    {
      title: "P. No",
      // render: (rowData) =>
      //   rowData?.spareDetails
      //     ? rowData?.spareDetails[monthForCompareSystemMonth]?.partNo
      //     : "",
      field: "partNo",
    },
    {
      title: "Cost",
      // render: (rowData) =>
      //   rowData?.spareDetails
      //     ? rowData?.spareDetails[monthForCompareSystemMonth]?.cost
      //     : "",
      field: "cost",
    },
    {
      title: "TM",
      // render: (rowData) =>
      //   rowData?.inspectionCompletionBy
      //     ? rowData?.inspectionCompletionBy[monthForCompareSystemMonth]
      //     : "",
      field: "doneBy",
    },
    {
      title: "Date",
      // render: (rowData) =>
      //   rowData?.inspectionCompletionBy
      //     ? rowData?.inspectionCompletionBy[monthForCompareSystemMonth]
      //     : "",
      field: "completionDateOfInspection",
    },
  ];

  const submitRemarksAfterTLOrHosRejection = async (updatedRow, oldRow) => {
    try {
      const res = await fetch("/submitRemarksAfterTLOrHosRejection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          machineData,
          updatedRow,
          monthForCompareSystemMonth,
        }),
      });

      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid");
      } else {
        console.log("Remarks Added Successful");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    postMachineToGetAllDataForSummary();
  }, []);

  // console.log(machineData);
  return (
    <>
      <div className="summeryPopupsCss">
        <div className="row">
          <div className="col-11"></div>
          <div className="col-1">
            <button className="btn-closeForChecksheet" onClick={close}>
              Close
            </button>
          </div>
        </div>
        <br />
        <br />
        <div>
          {tableData?.length > 0 ? (
            <MaterialTable
              localization={{
                header: {
                  actions: "Actions",
                },
                // toolbar: {
                //   exportCSVName: "Export some Excel format",
                //   exportPDFName: "Export as pdf!!"
                // }
              }}
              actions={[]}
              columns={subSectionHeader}
              data={tableData}
              title="Summary Data of All Month"
              // tableRef={this.tableRef.current.onQueryChange()}

              // editable={
              //   machineData?.checkSheet_data?.implemetation_mtd_tl_approval_status?.[
              //     monthForCompareSystemMonth
              //   ]?.at(-1) === "Rejected" ||
              //   machineData?.checkSheet_data?.implemetation_mtd_hos_approval_status?.[
              //     monthForCompareSystemMonth
              //   ]?.at(-1) === "Rejected"
              //     ? {
              //         onRowUpdate: (updatedRow, oldRow) =>
              //           new Promise((resolve, reject) => {
              //             const index = oldRow.tableData.id;
              //             const updatedRows = [...tableData];
              //             updatedRows[index] = updatedRow;
              //             //call the update user function and pass the user data
              //             // updateUserInfo(updatedRow);

              //             console.log(updatedRow);

              //             submitRemarksAfterTLOrHosRejection(updatedRow, oldRow);
              //             setTimeout(() => {
              //               // setRefKey2((refKey2) => refKey2 + 1);
              //               resolve();
              //             }, 500);
              //             //refreshPage();
              //           }),
              //       }
              //     : ""
              // }
              options={{
                showTitle: true,
                paging: false,
                sorting: true,
                search: true,
                filtering: false,
                exportButton: true,
                exportAllData: true,
                draggable: false,
                actionsColumnIndex: -1,
                pageSize: 10,
                pageSizeOptions: false,
                paginationType: "stepped",
                addRowPosition: "first",
                headerStyle: {
                  // color: "red",
                  position: "sticky",
                  top: "0",
                  fontWeight: "bold",
                  // backgroundColor: "#E6232A",
                },

                maxBodyHeight: "50vh",
                rowStyle: {
                  // fontStyle:'bold'

                  // boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
                  // color:"rgba(255,255,255,0.8)",
                  borderRadius: "5px",
                  border: "1px solid black",
                  // WebkitBackdropFilter: "blur( 2px )",
                  borderBottom: "black !important",
                  background: "rgba(255,255,255,0)",
                  // backdropFilter: "blur(5px)",
                  // fontSize: "12px",
                },
                cellStyle: {
                  border: "1px solid black",
                },
                headerStyle: {
                  border: "1px solid black",
                  fontSize: "13px",
                  fontWeight: "bold",
                },
              }}
            />
          ) : (
            <div
              className="container-fluid d-flex justify-content-center align-items-center p-5"
            // style={{ height: "100vh" }}
            >
              {loadingAnimationState}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SummeryPopups;
