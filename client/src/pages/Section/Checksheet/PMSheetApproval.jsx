import React, { useState, useEffect, useContext } from "react";
import RoutingContext from "../../../context/routing/RoutingContext";
import "./index.css";
import LoadingAnimation from "../../Reports/ReportComponents/LoadingAnimation";

// import "./tableColor.scss"

function PMSheetApproval() {
  const context = useContext(RoutingContext);

  const [tableData, setTableData] = useState([]);

  let columns = [
    {
      header: "Line",
      sort: "true",
    },
    {
      header: "Machine Code",
      sort: "true",
    },
    {
      header: "Machine Name",
      sort: "true",
    },
    {
      header: "Preparation",
      sort: "true",
    },
    {
      header: "Planning",
      sort: "true",
    },
  ];

  let columns1 = [
    {
      header: "TL Preparation",
      sort: "true",
    },
    {
      header: "TL/HOSS Checked",
      sort: "true",
    },
    {
      header: "HOS Approval",
      sort: "true",
    },
    {
      header: "MTD-TL Prepared",
      sort: "true",
    },
    {
      header: "PRD-TL Approval",
      sort: "true",
    },
  ];

  // console.log(context.section_data);
  const postSectionToGetAllDataForMainDashboard = async () => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/postSectionToGetAllData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: context.section_data,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        console.log(data);
        setTableData(data.machineDataOfPrepAndPlanApproval);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    postSectionToGetAllDataForMainDashboard();
  }, []);
  return (
    <>
    {tableData?.length > 0 ? (
      <div className="container-fluid" style={{ overflow: "auto" }}>
      <h4 style={{ padding: "1rem 0 0 0" }}>PM Sheet Approval</h4>

        <table className="ar-table pmSheetApprovalTableCol">
          <thead className="mt-5">
            <tr className="bg-button" >
              {columns.map((tColumn) => (
                <th
                  className={"ar-table-thead-header5 td-padding text-white"}
                  colSpan={
                    tColumn.header === "Preparation"
                      ? 3
                      : tColumn.header === "Planning"
                      ? 2
                      : 0
                  }
                >
                  {tColumn.header}
                </th>
              ))}
            </tr>
            <tr className="ar-table-thead-header4">
              <th></th>
              <th></th>
              <th></th>
              {columns1.map((tColumn) => (
                <th className={"ar-table-thead-header4 td-padding"}>
                  {tColumn.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData?.map((index) => (
              <tr className="ar-table-thead-header4 tableRowColor">
                <td className="td-padding">{index.line_names.line_name}</td>
                <td className="td-padding">{index.machine_code}</td>
                <td className="td-padding">{index.machine_name}</td>
                <td className="td-padding">
                  {/* {index.sender_tm_name[idx]}
                  <br />
                  {index.preparation_TL_date[idx]
                    } */}
                  {index?.checkSheet_data?.sender_tm_name?.map((value, idx) => (
                    <p>
                      {value}-{index?.checkSheet_data?.preparation_TL_date[idx]}
                    </p>
                  ))}
                </td>
                <td className="td-padding">
                  {index?.checkSheet_data?.tl_approval_status?.map((value, idx) => (
                    <p>
                      <b>{value}</b>-{index?.checkSheet_data?.assign_TL_name[idx]}-
                      {index?.checkSheet_data?.preparation_TL_HOSS_date[idx]},{" "}
                      {
                        value === "Rejected" ? `Remarks: ${index?.checkSheet_data?.rejected_remarks[idx]}` : ("")
                      }
                    </p>
                  ))}
                </td>
                <td className="td-padding">
                  {index?.checkSheet_data?.hos_approval_status?.map((value, idx) => (
                    <p>
                      <b>{value}</b>-{index?.checkSheet_data?.assign_HOS_name[idx]}-
                      {index?.checkSheet_data?.preparation_HOS_date[idx]},{" "}
                      {
                        value === "Rejected" ? `Remarks: ${index?.checkSheet_data?.rejected_remarks[idx]}` : ("")
                      }
                    </p>
                  ))}
                </td>
                <td className="td-padding">
                  {index?.checkSheet_data?.plan_prepared_tm_name?.map((value, idx) => (
                    <p>
                      {value}-{index?.checkSheet_data?.planning_TL_date[idx]}
                    </p>
                  ))}
                </td>
                <td className="td-padding">
                  {index?.checkSheet_data?.prd_tl_approval_status?.map((value, idx) => (
                    <p>
                      <b>{value}</b>-{index?.checkSheet_data?.assign_PRD_TL_name[idx]}-
                      {index?.checkSheet_data?.planning_PRD_TL_date[idx]},{" "}
                      {
                        value === "Rejected" ? `Remarks: ${index?.checkSheet_data?.rejected_remarks[idx]}` : ("")
                      }
                    </p>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      ) : (
        <div
          className="container-fluid d-flex justify-content-center align-items-center"
          style={{ height: "100vh" }}
        >
          <LoadingAnimation />
        </div>
      )}
    </>
  );
}

export default PMSheetApproval;
