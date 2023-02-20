import React, { useState, useEffect, useContext } from "react";
import RoutingContext from "../../../context/routing/RoutingContext";
import "./index.css";

import LoadingAnimation from "../../Reports/ReportComponents/LoadingAnimation";
import NotFound from "../../Reports/ReportComponents/NotFound";
import Footer from "../../../components/Footer/Footer";
import { Row, Col } from "react-bootstrap";

// import "./tableColor.scss"

function PMSheetApproval() {
  const context = useContext(RoutingContext);

  const [stateForAnimationAndNotFound, setStateForAnimationAndNotFound] =
    useState(<LoadingAnimation />);

  const [sectionOrSubSectionDropdownList, setSectionOrSubSectionDropdownList] =
    useState([]);

  const [selectedSectionOrSubSection, setSelectedSectionOrSubSection] =
    useState(0);

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
        // console.log(data);
        setTableData(data.machineDataOfPrepAndPlanApproval);
        setStateForAnimationAndNotFound(<NotFound />);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postPlantToGetSectionDataBasedOnDashboardLevel = async () => {
    // setSubSection(undefined);
    try {
      const res = await fetch(
        "/postPlantToGetSectionDataBasedOnDashboardLevel",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plant: context.plant_data,
          }),
        }
      );
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log("-------------$$$$$$$$$$$$-->", data);
        setSectionOrSubSectionDropdownList(data?.sectionDataArray);

        // getDataOfSkippedApprovalStatus(data?.sectionDataArray?.[0]);

        postSectionToGetPMSheetApprovalData(sectionOrSubSectionDropdownList?.[selectedSectionOrSubSection] || data?.sectionDataArray?.[0]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postSectionToGetPMSheetApprovalData = async (sectionData) => {
    setStateForAnimationAndNotFound(<LoadingAnimation />);
    try {
      const res = await fetch("/postSectionToGetPMSheetApprovalData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: sectionData,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        setTableData(data.machineDataOfPrepAndPlanApproval);
        setStateForAnimationAndNotFound(<NotFound />);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (context?.user_type !== "Plant-Admin") {
      postSectionToGetAllDataForMainDashboard();
    }
  }, []);

  useEffect(() => {
    if (context?.user_type === "Plant-Admin") {
      postPlantToGetSectionDataBasedOnDashboardLevel();
    }
  }, []);

  useEffect(() => {
    if (context?.user_type === "Plant-Admin") {
      postSectionToGetPMSheetApprovalData(
        sectionOrSubSectionDropdownList?.[selectedSectionOrSubSection]
      );
    }
  }, [selectedSectionOrSubSection]);
  return (
    <>
      {context?.user_type === "Plant-Admin" && context?.tm_grade === "HOD" ? (
        <Row className="p-2 mt-3">
          <Col sm={12} lg={3}>
            <span>
              <b>Section:&nbsp; &nbsp;</b>
            </span>
            <select
              class="form-select form-select-sm"
              aria-label=".form-select-sm example"
              style={{ width: "63%" }}
              id="standard-select-currency"
              name="selectedSectionOrSubSection"
              className="textField"
              value={selectedSectionOrSubSection}
              onChange={(e) => {
                setSelectedSectionOrSubSection(e.target.value);
              }}
              // fullWidth
              select // label="Select"
              autoComplete="off"
              variant="standard"
            >
              <option selected disabled value="">
                Please select
              </option>
              {sectionOrSubSectionDropdownList?.map((option, index) => {
                return <option value={index}>{option?.section_name}</option>;
              })}
            </select>
          </Col>
          <Col sm={12} lg={3}>
            <button
              class="btn-primary1 w-50"
              onClick={() => window.location.reload()}
            >
              Reset
            </button>
          </Col>
        </Row>
      ) : (
        ""
      )}
      {tableData?.length > 0 ? (
        <div className="container-fluid" style={{ overflow: "auto" }}>
          <h4 style={{ padding: "1rem 0 0 0" }}>PM Sheet Approval</h4>

          <table className="ar-table pmSheetApprovalTableCol">
            <thead className="mt-5">
              <tr className="bg-button">
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
                  <th
                    className={
                      "ar-table-thead-header4 td-padding bg-light-button text-dark font-weight-normal"
                    }
                  >
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
                    {index?.checkSheet_data?.sender_tm_name?.map(
                      (value, idx) => (
                        <p>
                          {value}-
                          {index?.checkSheet_data?.preparation_TL_date[idx]}
                        </p>
                      )
                    )}
                  </td>
                  <td className="td-padding">
                    {index?.checkSheet_data?.tl_approval_status?.map(
                      (value, idx) => (
                        <p>
                          <b>{value}</b>-
                          {index?.checkSheet_data?.assign_TL_name[idx]}-
                          {
                            index?.checkSheet_data?.preparation_TL_HOSS_date[
                              idx
                            ]
                          }
                          ,{" "}
                          {value === "Rejected"
                            ? `Remarks: ${index?.checkSheet_data?.rejected_remarks[idx]}`
                            : ""}
                        </p>
                      )
                    )}
                  </td>
                  <td className="td-padding">
                    {index?.checkSheet_data?.hos_approval_status?.map(
                      (value, idx) => (
                        <p>
                          <b>{value}</b>-
                          {index?.checkSheet_data?.assign_HOS_name[idx]}-
                          {index?.checkSheet_data?.preparation_HOS_date[idx]},{" "}
                          {value === "Rejected"
                            ? `Remarks: ${index?.checkSheet_data?.rejected_remarks[idx]}`
                            : ""}
                        </p>
                      )
                    )}
                  </td>
                  <td className="td-padding">
                    {index?.checkSheet_data?.plan_prepared_tm_name?.map(
                      (value, idx) => (
                        <p>
                          {value}-
                          {index?.checkSheet_data?.planning_TL_date[idx]}
                        </p>
                      )
                    )}
                  </td>
                  <td className="td-padding">
                    {index?.checkSheet_data?.prd_tl_approval_status?.map(
                      (value, idx) => (
                        <p>
                          <b>{value}</b>-
                          {index?.checkSheet_data?.assign_PRD_TL_name[idx]}-
                          {index?.checkSheet_data?.planning_PRD_TL_date[idx]},{" "}
                          {value === "Rejected"
                            ? `Remarks: ${index?.checkSheet_data?.rejected_remarks[idx]}`
                            : ""}
                        </p>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="container-fluid d-flex justify-content-center align-items-center p-5"
          // style={{ height: "100vh" }}
        >
          {stateForAnimationAndNotFound}
          {/* <LoadingAnimation /> */}
        </div>
      )}
      <br />
      <br />
      <br />
      <Footer />
    </>
  );
}

export default PMSheetApproval;
