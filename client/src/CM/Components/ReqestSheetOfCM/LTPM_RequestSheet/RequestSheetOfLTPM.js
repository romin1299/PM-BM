import axios from "axios";
import React, { useEffect, useState, useContext } from "react";
import { Container, Row, Col } from "react-bootstrap";
import DataNotFound from "../../../../BM/Reports/Common/DataNotFound";
import Loading from "../../../../components/Loading/Loading";
import ExistingMachineReqSheetView from "../ExistingMachineRequestSheet/ExistingMachineReqSheetView";
import RoutingContext from "../../../../context/routing/RoutingContext";
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
    lineId: "",
    LTPMApproval: {},
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

  const handleSetState = (otherData) =>
    setLTPMData((LTPMData) => ({
      ...LTPMData,
      loading: false,
      ...otherData,
    }));

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

      handleSetState(res?.data);
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
                          <PlanningApproval
                            {...LTPMData?.LTPMApproval?.planningApproval}
                            preparationApprovalAndPlanPreparationMTD_HOS={
                              LTPMData?.LTPMApproval
                                ?.preparationApprovalAndPlanPreparationMTD_HOS
                            }
                            lineId={LTPMData?.lineId}
                            handleSetState={handleSetState}
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
                          <td className="ar-table-col1"></td>
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
                          />
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
                              onClick={() => getDataOfLTPM()}
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

const PreparationApproval = ({
  lineId,
  handleSetState,
  status,
  preparedByMTD_TL,
  checkByMTD_TL,
  preparationApprovalAndPlanPreparationMTD_HOS,
}) => {
  if (!status && preparedByMTD_TL?.tm_name) {
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
        />
      </th>
      <th className="approvalName" colSpan={2} rowSpan={5}>
        <ViewOrApproveComponent
          user={checkByMTD_TL}
          lineId={lineId}
          handleSetState={handleSetState}
          status={status}
          statusForConditionCheck="Check for MTD TL"
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
}) => {
  if (status === "Under approval of MTD HOS") {
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

const ViewOrApproveComponent = ({
  user,
  lineId,
  handleSetState,
  status,
  statusForConditionCheck,
  phase = "Preparation",
}) => {
  const context = useContext(RoutingContext);

  if (context?._id !== user?.userRef || status !== statusForConditionCheck) {
    return <>{user?.tm_name}</>;
  }

  const handleSubmit = async () => {
    try {
      const response = await axios.patch(`/acceptApproval/${phase}/${lineId}`, {
        status,
      });

      if (response.status === 201) {
        handleSetState(response?.data);
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
