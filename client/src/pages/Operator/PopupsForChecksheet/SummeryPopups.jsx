import React from "react";
import MaterialTable from "@material-table/core";

const SummeryPopups = ({ close, tableData }) => {

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
  const financialYearWiseMonthKeyArray = ['Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

  let monthForCompareSystemMonth = monthKeyArray[new Date().getMonth()];
  const subSectionHeader = [
    {
      title: "Month",
      // field: "start_month",
      render: (rowData) => financialYearWiseMonthKeyArray[rowData?.start_month],
      width: "5%",

    },
    {
      title: "Sr. No",
      render: (rowData) => `${rowData?.tableData.id + 1}`,
      // align: "center",
      width: "5%",

    },
    {
      title: "Inspection Item",
      field: "inspection_parent_name",
    },
    {
      title: "Abnormality{Yes/No}",
      render: (rowData) =>
        rowData?.abnormalityDetails ? rowData?.abnormalityDetails[monthForCompareSystemMonth]?.abnormalityRemarks ? "Yes" : "" : "",
      width: "5%",
      
    },
    {
      title: "Ab. Remarks",
      // field: "planningTableAnimationArray2.abnormalityDetails.abnormalityRemarks",
      render: (rowData) =>
        rowData?.abnormalityDetails ? rowData?.abnormalityDetails[monthForCompareSystemMonth]?.abnormalityRemarks : ""
    },
    {
      title: "Status",
      render: (rowData) =>
        rowData?.abnormalityDetails?rowData?.abnormalityDetails[monthForCompareSystemMonth]?.abnormalityStatus : "",
      width: "5%",

      // field: "planningTableAnimationArray2.abnormalityDetails.abnormalityStatus",
    },
    {
      title: "T.D",
      render: (rowData) =>
        rowData?.abnormalityDetails?rowData?.abnormalityDetails[monthForCompareSystemMonth]?.targetDate: ""
      //   field: "",
    },
    {
      title: "Spare{Yes/No}",
      render: (rowData) =>
        rowData?.spareDetails?rowData?.spareDetails[monthForCompareSystemMonth]?.spareParts : "",
      //   field: "",
      width: "5%",

    },
    {
      title: "P. Name",
      render: (rowData) =>
        rowData?.spareDetails?rowData?.spareDetails[monthForCompareSystemMonth]?.partName : ""
    },
    {
      title: "P. No",
      render: (rowData) =>
        rowData?.spareDetails?rowData?.spareDetails[monthForCompareSystemMonth]?.partNo : ""
    },
    {
      title: "Cost",
      render: (rowData) =>
        rowData?.spareDetails?rowData?.spareDetails[monthForCompareSystemMonth]?.cost: ""
    },
    {
      title: "TM",
      //   field: "",
    },
  ];

  console.log(tableData)
  return (
    <>
      <div className="summeryPopupsCss">
        <div className="row">
          <div className="col-11"></div>
          <div className="col-1">
            <button
              className="btn-danger"
              onClick={close}
            >
              Close
            </button>
          </div>
        </div>
        <br />
        <br />
        <div>
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
            // actions={actions}
            columns={subSectionHeader}
            data={tableData}
            // title="User Management"
            // tableRef={this.tableRef.current.onQueryChange()}

            // editable={{
            //   onRowDelete: (selectedRow) =>
            //     new Promise((resolve, reject) => {
            //       const index = selectedRow.tableData.id;
            //       console.log(index);
            //       //   const updatedRows = [...subSectionList.subSectionsInfo];
            //       //   updatedRows.splice(index, 1);

            //       //call the delete user function and pass the user data
            //       // deleteUserInfo(selectedRow);
            //       //   deleteSubSection(selectedRow);
            //       setTimeout(() => {
            //         // setRefKey2((refKey2) => refKey2 + 1);
            //         resolve();
            //       }, 500);
            //     }),
            // }}
            options={{
              showTitle: false,
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

              maxBodyHeight: "70vh",
              rowStyle: {
                // fontStyle:'bold'

                boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
                // color:"rgba(255,255,255,0.8)",
                borderRadius: "5px",
                border: "1px solid rgba(255,255,255)",
                WebkitBackdropFilter: "blur( 2px )",
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(5px)",
              },
              headerStyle: {
                fontSize: "14px",
                fontWeight: "bold"
              }
            }}
          />
        </div>
      </div>
    </>
  );
};

export default SummeryPopups;
