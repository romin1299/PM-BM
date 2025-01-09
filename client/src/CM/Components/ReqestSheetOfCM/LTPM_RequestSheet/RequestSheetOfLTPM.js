import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";
import DataNotFound from "../../../../BM/Reports/Common/DataNotFound";
import Loading from "../../../../components/Loading/Loading";
import ExistingMachineReqSheetView from "../ExistingMachineRequestSheet/ExistingMachineReqSheetView";
// import PaginationForLTPM from "../../../../components/Pagination/PaginationForLTPM";
// import currentYear from "../../../../pages/Dashboard/DashboardComponent/currentYear";

const RequestSheetOfLTPM = ({ selectedLine, reduceState }) => {
  // const [dataOfLTPM, setDataOfLTPM] = useState([]);
  const currentYear = 2025;
  const yearsOfLTPM = Array.from({ length: 5 }, (_, i) => currentYear + i);
  // const [visibleYears, setVisibleYears] = useState(yearsOfLTPM.slice(0, 4));

  let columns = [
    "SN",
    "Machine No.",
    "Machine Name",
    "Inspection item",
    "Action",
    "Cycle",
    "Person in charge",
    "",
  ];

  const initialState = {
    loading: true,
    paginationCount: 0,
    yearList: yearsOfLTPM.slice(0, 4),
    quarterList: ["Q1", "Q2", "Q3", "Q4"],
    data: [],
  };

  const [LTPMData, setLTPMData] = useState(initialState);

  const defaultState = {
    cmReqSheetView: false,
    isEditable: false,
    selectedRowRequestSheetId: "",
    selectedQuarter: "",
  };

  const [selectedCMRequestSheetPopupData, setSelectedCMRequestSheetPopupData] =
    useState(defaultState);

  // const [loading, setLoading] = useState(true);

  const getDataOfLTPM = async (propPaginationCount = 0) => {
    // setLoading(true);

    setLTPMData(initialState);

    try {
      const url = `/LTPM/getDatOfLTPM/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}&&selectedMonth=${reduceState?.selectedMonth}&&paginationCount=${propPaginationCount}`;

      const res = await axios.get(url, {
        withCredentials: true,
        credentials: "include",
      });

      // setDataOfLTPM(res?.data?.resultOfLTPM);

      setLTPMData((LTPMData) => ({
        ...LTPMData,
        loading: false,
        ...res?.data,
        // data: res?.data?.resultOfLTPM,
      }));
    } catch (error) {
      console.log(error);

      setLTPMData({
        loading: false,
        ...initialState,
      });
    }
    // setLoading(false);
  };

  // let yearsOfLTPM = [
  //   new Date().getFullYear(),
  //   new Date().getFullYear() + 1,
  //   new Date().getFullYear() + 2,
  //   new Date().getFullYear() + 3,
  //   new Date().getFullYear() + 4,
  // ];

  // const currentYear = new Date().getFullYear();

  useEffect(() => {
    getDataOfLTPM();
  }, [
    reduceState?.selectedValue,
    reduceState.selectedYear,
    reduceState.selectedMonth,
  ]);

  const openModalOfRequestSheetOfCm = (_id, selectedQuarter) => {
    setSelectedCMRequestSheetPopupData((selectedCMRequestSheetPopupData) => ({
      ...selectedCMRequestSheetPopupData,
      cmReqSheetView: true,
      selectedRowRequestSheetId: _id,
      selectedQuarter,
    }));
  };

  const handlePopupStatus = () =>
    setSelectedCMRequestSheetPopupData(defaultState);

  const displayPlannedDataOfTheLTPM = (item, item1, years) => {
    const rows = []; // Accumulate all <td> elements here
    let yearFound = false; // Track if a matching year is found
    let yearAddition = `${years}-${years + 1}`;
    for (let i = 0; i < item1?.length; i++) {
      if (
        yearAddition ===
        item1?.[i]?.preAggregationTimeStampOfRequestSheet?.requestSheet_year
      ) {
        yearFound = true; // Mark the year as found

        for (let quarterValue of ["Q1", "Q2", "Q3", "Q4"]) {
          let quarterFound = false; // Track if the quarter matches

          for (
            let index = 0;
            index < item1?.[i]?.quarterlyDataOfTheCM?.length;
            index++
          ) {
            if (
              quarterValue ===
              item1?.[i]?.quarterlyDataOfTheCM?.[index]?.requestSheet_quarter
            ) {
              // Add the corresponding <td> element to rows
              rows.push(
                <td
                  className="ar-table-col"
                  key={`${yearAddition}-${quarterValue}`}
                >
                  {item1?.[i]?.quarterlyDataOfTheCM?.[index]
                    ?.statusOfPlannedCM === "Planned" && (
                    <button
                      type="button"
                      className="commonBtn viewRequestSheetOfCMBtn"
                      onClick={() => {
                        openModalOfRequestSheetOfCm(
                          item?._id?._id,
                          item1?.[i]?.quarterlyDataOfTheCM?.[index]
                            ?.requestSheet_quarter
                        );
                      }}
                    >
                      --&gt;
                    </button>
                  )}
                </td>
              );

              quarterFound = true; // Mark the quarter as matched
            }
          }

          // If the quarter is not found, add an empty <td>
          if (!quarterFound) {
            rows.push(
              <td
                className="ar-table-col"
                key={`${yearAddition}-${quarterValue}-empty`}
              >
                {/* Empty box for unmatched quarters */}
              </td>
            );
          }
        }

        break; // Exit the outer loop once the matching year is processed
      }
    }
    // If no matching year is found, add empty <td> elements for all four quarters
    if (!yearFound) {
      for (let quarterValue of ["Q1", "Q2", "Q3", "Q4"]) {
        rows.push(
          <td className="ar-table-col" key={`default-${quarterValue}`}>
            {/* Empty space */}
          </td>
        );
      }
    }

    return rows; // Return all accumulated rows
  };

  return (
    <>
      <div>
        {
          <>
            <div>
              <Container fluid>
                <Row>
                  <Col lg={6} md={6} sm={12} />
                  <Col lg={6} md={6} sm={12}>
                    <table className="ar-table tableCol1 ">
                      <thead>
                        <tr>
                          <th
                            className="ar-table-thead-header1 text-center"
                            // colSpan={2}
                            //  rowSpan={5}
                          >
                            PLAN ACCEPTANCE
                            <br />
                            (By PRD Section-in-charge)
                          </th>
                          <th
                            className="ar-table-thead-header1 text-center"
                            // colSpan={2}
                            //  rowSpan={5}
                          >
                            PLAN PREPARED
                            <br />
                            (By MTD Section-in-charge)
                          </th>
                        </tr>
                        <tr>
                          <th className="approvalName"></th>
                          <th className="approvalName"></th>
                        </tr>
                      </thead>
                    </table>
                  </Col>
                </Row>
              </Container>
            </div>
            <div>
              <Container fluid>
                <Row>
                  <Col className="table-scrolling">
                    <table className="ar-table tableCol">
                      <thead>
                        <tr>
                          <th
                            className="ar-table-thead-header1 headerPD"
                            // colSpan={2}
                            rowSpan={3}
                          >
                            <p>
                              Section Name :{" "}
                              {
                                LTPMData?.data?.[0]?.machineAllData?.section
                                  ?.section_name
                              }
                            </p>
                            <br />
                            <p>
                              Line Name :{" "}
                              {
                                LTPMData?.data?.[0]?.machineAllData?.line
                                  ?.line_name
                              }
                            </p>
                          </th>
                          <th
                            className="ar-table-thead-header1 headerPD  align-items-center"
                            colSpan={2}
                            style={{ textAlign: "center" }}
                            // rowSpan={2}
                          >
                            Approved by
                            <br />
                            (MTD HOS)
                          </th>
                          <th
                            className="ar-table-thead-header1 headerPD"
                            colSpan={2}
                            style={{ textAlign: "center" }}
                            // rowSpan={2}
                          >
                            Checked by
                            <br />
                            (MTD TL)
                          </th>
                          <th
                            className="ar-table-thead-header1 headerPD"
                            colSpan={2}
                            style={{ textAlign: "center" }}
                            // rowSpan={3}
                          >
                            Prepared by
                            <br />
                            (MTD TL)
                          </th>
                          {/* <th
                            className="ar-table-thead-header1 headerPD"
                            colSpan={2}
                            style={{ textAlign: "center" }}
                            // rowSpan={3}
                          >
                          </th> */}
                          <th className="ar-table-thead-header1">
                            Checked & Verify by
                            <br />
                            (MTD TL)
                          </th>
                          <td className="ar-table-col1"></td>
                        </tr>
                        <tr>
                          <th
                            className="approvalName"
                            colSpan={2}
                            rowSpan={5}
                          ></th>
                          <th
                            className="approvalName"
                            colSpan={2}
                            rowSpan={5}
                          ></th>
                          <th
                            className="approvalName"
                            colSpan={2}
                            rowSpan={5}
                          ></th>
                          {/* <th
                            className="approvalName"
                            colSpan={2}
                            rowSpan={5}
                          ></th> */}
                          <th className="ar-table-thead-header1">
                            Approved by
                            <br />
                            (MTD HOS)
                          </th>
                          <td className="ar-table-col1"></td>
                          <td className="ltpm-pagination" colSpan={3}>
                            <button
                              className="btn-pagination"
                              onClick={() =>
                                getDataOfLTPM(LTPMData?.paginationCount + 1)
                              }
                            >
                              Previous FY
                            </button>
                            &nbsp;
                            <button
                              className="btn-pagination"
                              onClick={() => getDataOfLTPM(0)}
                            >
                              Reset
                            </button>
                          </td>
                        </tr>
                      </thead>

                      {/* <PaginationForLTPM
                        // setVisibleYears={setVisibleYears}
                        // visibleYears={visibleYears}
                        yearsOfLTPM={yearsOfLTPM}
                        setLTPMData={setLTPMData}
                      /> */}
                      <thead>
                        <tr>
                          <th colSpan={8}></th>
                          {LTPMData?.yearList?.map((year, idx) => {
                            return (
                              <th
                                className="ar-table-col1"
                                colSpan={4}
                                key={idx}
                              >
                                {year}-{year + 1}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <thead className="mt-5">
                        <tr>
                          {columns
                            ?.concat(LTPMData?.quarterList)
                            ?.map((tColumn) => (
                              <th
                                className={
                                  tColumn === ""
                                    ? "ar-table-thead-header3"
                                    : "ar-table-thead-header"
                                }
                              >
                                {tColumn}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {LTPMData?.loading ? (
                          <Loading />
                        ) : LTPMData?.data?.length <= 0 ? (
                          <DataNotFound />
                        ) : (
                          LTPMData?.data?.map((item, index) => (
                            <React.Fragment key={index}>
                              <tr className="ar-table-row">
                                <td
                                  className="ar-table-col"
                                  rowSpan={item?.data?.length + 1}
                                >
                                  {++index}
                                </td>
                                <td
                                  rowSpan={item?.data?.length + 1}
                                  className="ar-table-col"
                                >
                                  {item?.machineAllData?.machine?.machine_code}
                                </td>
                                <td
                                  rowSpan={item?.data?.length + 1}
                                  className="ar-table-col"
                                >
                                  {item?.machineAllData?.machine?.machine_name}
                                </td>
                              </tr>

                              {item?.data?.map((item1, index) => (
                                <tr key={index}>
                                  <td className="ar-table-col">
                                    {item1?.inspectionItem}
                                  </td>
                                  <td className="ar-table-col">
                                    {item1?.actionForLTPM}
                                  </td>
                                  <td className="ar-table-col">
                                    {item1?.frequencyValue}
                                  </td>
                                  <td className="ar-table-col">
                                    {item1?.personForLTPM}
                                  </td>
                                  <td className="ar-table-thead-header3"></td>
                                  {LTPMData?.yearList?.map((years, idx) =>
                                    displayPlannedDataOfTheLTPM(
                                      item,
                                      item1?.commonDataFilledByAssignUser,
                                      years
                                    )
                                  )}
                                </tr>
                              ))}
                            </React.Fragment>
                          ))
                        )}
                      </tbody>
                    </table>
                  </Col>
                </Row>
              </Container>
            </div>
          </>
        }
      </div>

      {selectedCMRequestSheetPopupData?.cmReqSheetView && (
        <ExistingMachineReqSheetView
          handlePopupStatus={handlePopupStatus}
          selectedYear={reduceState?.selectedYear}
          {...selectedCMRequestSheetPopupData}
        />
      )}
    </>
  );
};

export default RequestSheetOfLTPM;
