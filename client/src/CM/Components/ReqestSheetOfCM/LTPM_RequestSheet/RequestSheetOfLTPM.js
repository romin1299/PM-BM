import axios from "axios";
import React, { useEffect, useState, useContext } from "react";
import { Container, Row, Col, Modal } from "react-bootstrap";
import DataNotFound from "../../../../BM/Reports/Common/DataNotFound";
import Loading from "../../../../components/Loading/Loading";
import ExistingMachineReqSheetView from "../ExistingMachineRequestSheet/ExistingMachineReqSheetView";
import RoutingContext from "../../../../context/routing/RoutingContext";
// import PaginationForLTPM from "../../../../components/Pagination/PaginationForLTPM";
// import currentYear from "../../../../pages/Dashboard/DashboardComponent/currentYear";

const RequestSheetOfLTPM = ({ selectedLine, reduceState }) => {
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
    yearList: [],
    quarterList: ["Q1", "Q2", "Q3", "Q4"],
    data: [],
    quarterlyApprovalObj: [],
    lineId: "",
    LTPMApproval: {},
  };

  const context = useContext(RoutingContext);

  const [LTPMData, setLTPMData] = useState(initialState);

  const defaultState = {
    cmReqSheetView: false,
    isEditable: false,
    selectedRowRequestSheetId: "",
    selectedQuarter: "",
  };

  const [selectedCMRequestSheetPopupData, setSelectedCMRequestSheetPopupData] =
    useState(defaultState);

  const handleSetState = (otherData) =>
    setLTPMData((LTPMData) => ({
      ...LTPMData,
      loading: false,
      ...otherData,
    }));

  const getDataOfLTPM = async (propPaginationCount = 0) => {
    setLTPMData(initialState);

    try {
      const url = `/LTPM/getDatOfLTPM/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}&&selectedMonth=${reduceState?.selectedMonth}&&paginationCount=${propPaginationCount}`;

      const res = await axios.get(url, {
        withCredentials: true,
        credentials: "include",
      });

      handleSetState(res?.data);
    } catch (error) {
      console.log(error);

      setLTPMData({
        loading: false,
        ...initialState,
      });
    }
  };

  useEffect(() => {
    if (reduceState?.flagForTogglingFilter === "based-on-line") getDataOfLTPM();
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

  // const displayPlannedDataOfTheLTPM = (item, item1, year) => {
  //   const rows = []; // Accumulate all <td> elements here
  //   let yearFound = false; // Track if a matching year is found
  //   let yearAddition = year;
  //   for (let i = 0; i < item1?.length; i++) {
  //     if (
  //       yearAddition ===
  //       item1?.[i]?.preAggregationTimeStampOfRequestSheet?.requestSheet_year
  //     ) {
  //       yearFound = true; // Mark the year as found

  //       for (let quarterValue of ["Q1", "Q2", "Q3", "Q4"]) {
  //         let quarterFound = false; // Track if the quarter matches

  //         for (
  //           let index = 0;
  //           index < item1?.[i]?.quarterlyDataOfTheCM?.length;
  //           index++
  //         ) {
  //           if (
  //             quarterValue ===
  //             item1?.[i]?.quarterlyDataOfTheCM?.[index]?.requestSheet_quarter
  //           ) {
  //             // Add the corresponding <td> element to rows
  //             rows.push(
  //               <td
  //                 className="ar-table-col"
  //                 key={`${yearAddition}-${quarterValue}`}
  //               >
  //                 {item1?.[i]?.quarterlyDataOfTheCM?.[index]
  //                   ?.statusOfPlannedCM === "Planned" && (
  //                   <button
  //                     type="button"
  //                     className="commonBtn viewRequestSheetOfCMBtn"
  //                     onClick={() => {
  //                       openModalOfRequestSheetOfCm(
  //                         item?._id?._id,
  //                         item1?.[i]?.quarterlyDataOfTheCM?.[index]
  //                           ?.requestSheet_quarter
  //                       );
  //                     }}
  //                   >
  //                     --&gt;
  //                   </button>
  //                 )}
  //               </td>
  //             );

  //             quarterFound = true; // Mark the quarter as matched
  //           }
  //         }

  //         // If the quarter is not found, add an empty <td>
  //         if (!quarterFound) {
  //           rows.push(
  //             <td
  //               className="ar-table-col"
  //               key={`${yearAddition}-${quarterValue}-empty`}
  //             >
  //               {/* Empty box for unmatched quarters */}
  //             </td>
  //           );
  //         }
  //       }

  //       break; // Exit the outer loop once the matching year is processed
  //     }
  //   }
  //   // If no matching year is found, add empty <td> elements for all four quarters
  //   if (!yearFound) {
  //     for (let quarterValue of ["Q1", "Q2", "Q3", "Q4"]) {
  //       rows.push(
  //         <td className="ar-table-col" key={`default-${quarterValue}`}>
  //           {/* Empty space */}
  //         </td>
  //       );
  //     }
  //   }

  //   return rows; // Return all accumulated rows
  // };

  return (
    <>
      <div>
        {
          <>
            <div>
              <Container fluid>
                <Row>
                  <Col lg={6} md={6} sm={12}>
                    <td
                      className="ltpm-pagination d-flex align-items-center justify-content-center"
                      colSpan={3}
                    >
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
                  </Col>
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
                          <PlanningApproval
                            {...LTPMData?.LTPMApproval?.planningApproval}
                            preparationApprovalAndPlanPreparationMTD_HOS={
                              LTPMData?.LTPMApproval
                                ?.preparationApprovalAndPlanPreparationMTD_HOS
                            }
                            lineId={LTPMData?.lineId}
                            handleSetState={handleSetState}
                            context={context}
                          />
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

                          {LTPMData?.LTPMApproval?.planningApproval?.status ===
                          "Completed" ? (
                            LTPMData?.quarterlyApprovalObj?.map((item) => (
                              <td className="ar-table-col1">
                                {item?.checkAndVerifyByMTD_TL?.tm_name}
                              </td>
                            ))
                          ) : (
                            <EmptyQuarterlyApprovalMapping
                              arr={LTPMData?.quarterList}
                            />
                          )}
                        </tr>
                        <tr>
                          <PreparationApproval
                            {...LTPMData?.LTPMApproval?.preparationApproval}
                            preparationApprovalAndPlanPreparationMTD_HOS={
                              LTPMData?.LTPMApproval
                                ?.preparationApprovalAndPlanPreparationMTD_HOS
                            }
                            lineId={LTPMData?.lineId}
                            handleSetState={handleSetState}
                            context={context}
                          />
                          <th className="ar-table-thead-header1">
                            Approved by
                            <br />
                            (G.M.)
                          </th>

                          {LTPMData?.LTPMApproval?.planningApproval?.status ===
                          "Completed" ? (
                            <QuarterlyApproval
                              lineId={LTPMData?.lineId}
                              handleSetState={handleSetState}
                              userKey="MTD_HOD"
                              quarterlyApprovalObj={
                                LTPMData?.quarterlyApprovalObj
                              }
                              context={context}
                            />
                          ) : (
                            <EmptyQuarterlyApprovalMapping
                              arr={LTPMData?.quarterList}
                            />
                          )}
                        </tr>
                      </thead>

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
                                {year}
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
                                  {/* {LTPMData?.yearList?.map((year, idx) =>
                                    displayPlannedDataOfTheLTPM(
                                      item,
                                      item1?.commonDataFilledByAssignUser,
                                      year
                                    )
                                  )} */}

                                  {item1?.commonDataFilledByAssignUser?.map(
                                    (outer) =>
                                      outer?.quarterlyDataOfTheCM?.map(
                                        (inner) =>
                                          inner?.statusOfPlannedCM ===
                                          "Planned" ? (
                                            <td
                                              className="ar-table-col"
                                              key={`${outer?.preAggregationTimeStampOfRequestSheet?.requestSheet_year}-${inner?.requestSheet_quarter}-empty`}
                                            >
                                              <button
                                                type="button"
                                                className="commonBtn viewRequestSheetOfCMBtn"
                                                onClick={() => {
                                                  openModalOfRequestSheetOfCm(
                                                    item?._id?._id,
                                                    inner?.requestSheet_quarter
                                                  );
                                                }}
                                              >
                                                --&gt;
                                              </button>
                                            </td>
                                          ) : (
                                            <td
                                              className="ar-table-col"
                                              key={`${outer?.preAggregationTimeStampOfRequestSheet?.requestSheet_year}-${inner?.requestSheet_quarter}-empty`}
                                            ></td>
                                          )
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

const PreparationApproval = ({
  lineId,
  handleSetState,
  status,
  preparedByMTD_TL,
  checkByMTD_TL,
  preparationApprovalAndPlanPreparationMTD_HOS,
  context,
}) => {
  if (
    !status &&
    preparedByMTD_TL?.tm_name &&
    context?.user_type === "TL/HOSS" &&
    context?.tm_department === "MTD"
  ) {
    return (
      <SelectPreparationApproval
        preparedByMTD_TL={preparedByMTD_TL}
        lineId={lineId}
        handleSetState={handleSetState}
      />
    );
  }

  return (
    <>
      <th className="approvalName" colSpan={2} rowSpan={5}>
        <ViewOrApproveComponent
          user={preparationApprovalAndPlanPreparationMTD_HOS}
          lineId={lineId}
          handleSetState={handleSetState}
          status={status}
          statusForConditionCheck="Under approval of MTD HOS"
          context={context}
        />
      </th>
      <th className="approvalName" colSpan={2} rowSpan={5}>
        <ViewOrApproveComponent
          user={checkByMTD_TL}
          lineId={lineId}
          handleSetState={handleSetState}
          status={status}
          statusForConditionCheck="Check for MTD TL"
          context={context}
        />
      </th>
      <th className="approvalName" colSpan={2} rowSpan={5}>
        {preparedByMTD_TL?.tm_name}
      </th>
    </>
  );
};

const SelectPreparationApproval = ({
  preparedByMTD_TL,
  lineId,
  handleSetState,
}) => {
  const [dropdownUsers, setDropdownUsers] = useState({
    MTDHOSList: [],
    MTDTLList: [],
  });

  const [selectedUsers, setSelectedUsers] = useState({
    indexOfApprovedByMTD_HOS: 0,
    indexOfCheckByMTD_TL: 0,
  });

  const handleChange = ({ target }) => {
    const { name, value } = target;
    setSelectedUsers((selectedUsers) => ({
      ...selectedUsers,
      [name]: value * 1,
    }));
  };

  const getApprovalListOfCM = async () => {
    try {
      const response = await axios.get(
        `/getApprovalUserList/?departmentFilterForTL=MTD`
      );
      setDropdownUsers(response?.data?.userList);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getApprovalListOfCM();
  }, []);

  const handleSubmit = async () => {
    try {
      const response = await axios.patch(`/sendPreparationApproval/${lineId}`, {
        preparationApprovalAndPlanPreparationMTD_HOS:
          dropdownUsers?.MTDHOSList?.[selectedUsers?.indexOfApprovedByMTD_HOS],
        checkByMTD_TL:
          dropdownUsers?.MTDTLList?.[selectedUsers?.indexOfCheckByMTD_TL],
      });

      if (response.status === 201) {
        handleSetState(response?.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <th className="approvalName" colSpan={2} rowSpan={5}>
        <UserSelectionDropdown
          name="indexOfApprovedByMTD_HOS"
          onChange={handleChange}
          userArray={dropdownUsers?.MTDHOSList}
        />
        <button className="bg-button" onClick={handleSubmit}>
          Send Approval
        </button>
      </th>
      <th className="approvalName" colSpan={2} rowSpan={5}>
        <UserSelectionDropdown
          name="indexOfCheckByMTD_TL"
          onChange={handleChange}
          userArray={dropdownUsers?.MTDTLList}
        />
      </th>
      <th className="approvalName" colSpan={2} rowSpan={5}>
        {preparedByMTD_TL?.tm_name}
      </th>
    </>
  );
};

const PlanningApproval = ({
  status,
  preparationApprovalAndPlanPreparationMTD_HOS,
  planAcceptedByPRD_HOS,
  lineId,
  handleSetState,
  context,
}) => {
  if (
    status === "Under approval of MTD HOS" &&
    // context?.user_type === "TL/HOSS" &&
    context?.tm_department === "MTD"
  ) {
    return (
      <SelectPlanningApproval
        preparationApprovalAndPlanPreparationMTD_HOS={
          preparationApprovalAndPlanPreparationMTD_HOS
        }
        lineId={lineId}
        handleSetState={handleSetState}
      />
    );
  }

  return (
    <>
      <th className="approvalName">
        <ViewOrApproveComponent
          user={planAcceptedByPRD_HOS}
          lineId={lineId}
          handleSetState={handleSetState}
          status={status}
          statusForConditionCheck="Under approval of PRD HOS"
          phase="Planning"
          context={context}
        />
      </th>
      <th className="approvalName">
        {preparationApprovalAndPlanPreparationMTD_HOS?.tm_name}
      </th>
    </>
  );
};

const SelectPlanningApproval = ({
  preparationApprovalAndPlanPreparationMTD_HOS,
  lineId,
  handleSetState,
}) => {
  const [PRDHOSList, setPRDHOSList] = useState([]);
  const [indexOfPRD_HOS, setIndexOfPRD_HOS] = useState(0);

  const handleChange = ({ target }) => setIndexOfPRD_HOS(target?.value * 1);

  const getApprovalListOfCM = async () => {
    try {
      const response = await axios.get(
        `/getApprovalUserList/?departmentFilterForHOS=PRD`
      );
      setPRDHOSList(response?.data?.userList?.PRDHOSList);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getApprovalListOfCM();
  }, []);

  const handleSubmit = async () => {
    try {
      const response = await axios.patch(`/sendPlanningApproval/${lineId}`, {
        planAcceptedByPRD_HOS: PRDHOSList?.[indexOfPRD_HOS],
      });

      if (response.status === 201) {
        handleSetState(response?.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <th className="approvalName">
        <UserSelectionDropdown
          name="indexOfPRD_HOS"
          onChange={handleChange}
          userArray={PRDHOSList}
        />
        <button className="bg-button" onClick={handleSubmit}>
          Send Approval
        </button>
      </th>
      <th className="approvalName">
        {preparationApprovalAndPlanPreparationMTD_HOS?.tm_name}
      </th>
    </>
  );
};

const EmptyQuarterlyApprovalMapping = ({ arr }) =>
  arr?.map((item) => <td className="ar-table-col1"></td>);

const QuarterlyApproval = ({
  lineId,
  handleSetState,
  quarterlyApprovalObj,
  context,
}) => {
  const [dropdownUsers, setDropdownUsers] = useState({
    MTDHODList: [],
  });

  const getApprovalListOfCM = async () => {
    try {
      const response = await axios.get(
        `/getApprovalUserList/?departmentFilterForTL=MTD&&gradeFilter=HOD`
      );
      setDropdownUsers(response?.data?.userList);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getApprovalListOfCM();
  }, []);

  const handleQuarterlyApprovalUpdate = (
    approvalObj,
    basedOn = "sendApproval"
  ) =>
    handleSetState({
      quarterlyApprovalObj: quarterlyApprovalObj?.map((item) =>
        basedOn === "sendApproval"
          ? item?.preAggregationTimeStampOfRequestSheet?.requestSheet_year ===
              approvalObj?.preAggregationTimeStampOfRequestSheet
                ?.requestSheet_year &&
            item?.preAggregationTimeStampOfRequestSheet
              ?.requestSheet_quarter ===
              approvalObj?.preAggregationTimeStampOfRequestSheet
                ?.requestSheet_quarter
            ? approvalObj
            : item
          : item?._id === approvalObj?._idForParticularYearAndQuarter
          ? {
              ...item,
              approveByHOD: {
                ...item?.approveByHOD,
                approvalStatus: "Accepted",
              },
              status: "Completed",
            }
          : item
      ),
    });

  return quarterlyApprovalObj?.map((item) => {
    if (
      !item?.approveByHOD?.tm_name &&
      item?.count > 0 &&
      context?.user_type === "TL/HOSS" &&
      context?.tm_department === "MTD"
    ) {
      return (
        <QuarterlyApprovalButtonComponentMapping
          lineId={lineId}
          handleSetState={handleQuarterlyApprovalUpdate}
          MTDHODList={dropdownUsers?.MTDHODList}
          approvalObj={item}
          context={context}
        />
      );
    }

    return (
      <td className="ar-table-col1">
        <ViewOrApproveComponent
          user={item?.approveByHOD}
          lineId={lineId}
          handleSetState={handleQuarterlyApprovalUpdate}
          status={item?.status}
          statusForConditionCheck="Under approval of MTD HOD"
          phase="QuarterlyApproval"
          query={`_idForParticularYearAndQuarter=${item?._id}`}
          context={context}
        />
      </td>
    );
  });
};

const QuarterlyApprovalButtonComponentMapping = ({
  lineId,
  handleSetState,
  MTDHODList,
  approvalObj,
  context,
}) => {
  const [handlePopup, setHandlePopup] = useState(false);

  const handleChange = () => setHandlePopup((handlePopup) => !handlePopup);

  return (
    <td className="ar-table-col1">
      <button className="bg-button" onClick={handleChange}>
        Approval
      </button>

      <SelectParticularQuarterApproval
        lineId={lineId}
        handleSetState={handleSetState}
        MTDHODList={MTDHODList}
        handlePopup={handlePopup}
        handleChangePopupState={handleChange}
        approvalObj={approvalObj}
        context={context}
      />
    </td>
  );
};

const SelectParticularQuarterApproval = ({
  lineId,
  handleSetState,
  MTDHODList,
  handlePopup,
  handleChangePopupState,
  approvalObj,
  context,
}) => {
  const [selectedUsers, setSelectedUsers] = useState({
    indexOfApprovedByMTD_HOD: 0,
  });

  const handleChange = ({ target }) => {
    const { name, value } = target;
    setSelectedUsers((selectedUsers) => ({
      ...selectedUsers,
      [name]: value * 1,
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.patch(`/sendQuarterlyApproval/${lineId}`, {
        approvalObj,
        approveByHOD: MTDHODList?.[selectedUsers?.indexOfApprovedByMTD_HOD],
      });

      if (response.status === 201) {
        handleSetState(response?.data?.quarterlyApproval);
        handleChangePopupState();
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Modal show={handlePopup} onHide={handleChangePopupState} centered>
      <Modal.Header closeButton>
        <Modal.Title>HOD approval</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col>Check & Verify By (MTD TL): </Col>
          <Col>{context?.tm_name}</Col>
        </Row>
        <Row>
          <Col>Approved by (G.M.) </Col>
          <Col>
            <UserSelectionDropdown
              name="indexOfApprovedByMTD_HOD"
              onChange={handleChange}
              userArray={MTDHODList}
            />
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <button className="bg-button" onClick={handleSubmit}>
          Send Approval
        </button>
      </Modal.Footer>
    </Modal>
  );
};

const ViewOrApproveComponent = ({
  user,
  lineId,
  handleSetState,
  status,
  statusForConditionCheck,
  phase = "Preparation",
  query = "",
  context,
}) => {
  if (context?._id !== user?.userRef || status !== statusForConditionCheck) {
    if (!user?.tm_name) {
      return <></>;
    }
    return (
      <>
        <span>{user?.tm_name}</span>
        <br />
        <span>Status: {user?.approvalStatus}</span>
      </>
    );
  }

  const handleSubmit = async () => {
    try {
      const response = await axios.patch(
        `/acceptApproval/${phase}/${lineId}/?${query}`,
        {
          status,
        }
      );

      if (response.status === 201) {
        if (phase === "QuarterlyApproval") {
          return handleSetState(
            response?.data?.quarterlyApproval,
            "AcceptApproval"
          );
        }
        return handleSetState(response?.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <button className="bg-button" onClick={handleSubmit}>
      Accept
    </button>
  );
};

const UserSelectionDropdown = ({ name, onChange, userArray }) => {
  return (
    <select name={name} onChange={onChange}>
      <option selected disabled value="">
        Please Select
      </option>
      {userArray?.map((item, index) => (
        <option value={index}>{item?.tm_name}</option>
      ))}
    </select>
  );
};
