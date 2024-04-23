import React, { useEffect, useState, useReducer } from "react";
import { Table, Input, ConfigProvider } from "antd";
import moment from "moment-timezone";
import ChartsToolbar from "../Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState,
  reducer,
} from "../Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import { Container } from "react-bootstrap";
import BMTitlebar from "../Component/BMTitlebar";
import { Row, Col } from "react-bootstrap";
const Search = Input.Search;

const ApprovalLogs = () => {
  const [approvalLogs, setApprovalLogs] = useState([]);
  // const [approverHeaderList, setApproverHeaderList] = useState([]);

  const [columns, setColumns] = useState([]);
  const [searchResult, setSearchResult] = useState([]);

  let commonColumns = [
    {
      title: "Cell",
      dataIndex: "cell",
      // filters: [
      //   {
      //     text: "MA2",
      //     value: "MA2",
      //   },
      //   {
      //     text: "MA3",
      //     value: "MA3",
      //   },
      // ],
      // specify the condition of filtering result
      // here is that finding the name started with `value`
      // onFilter: (value, record) => record.line.indexOf(value) === 0,
      sorter: (a, b) => {
        const name1 = a.line.toUpperCase();
        const name2 = b.line.toUpperCase();

        let comparison = 0;

        if (name1 < name2) {
          comparison = 1;
        } else if (name1 > name2) {
          comparison = -1;
        }
        return comparison;
      },
      // fixed: "left",
      width: "15%",
      // sortDirections: ["descend"],
    },
    {
      title: "Line",
      dataIndex: "line",
      // filters: [
      //   {
      //     text: "MA2",
      //     value: "MA2",
      //   },
      //   {
      //     text: "MA3",
      //     value: "MA3",
      //   },
      // ],
      // specify the condition of filtering result
      // here is that finding the name started with `value`
      // onFilter: (value, record) => record.line.indexOf(value) === 0,
      sorter: (a, b) => {
        const name1 = a.line.toUpperCase();
        const name2 = b.line.toUpperCase();

        let comparison = 0;

        if (name1 < name2) {
          comparison = 1;
        } else if (name1 > name2) {
          comparison = -1;
        }
        return comparison;
      },
      // fixed: "left",
      width: "15%",
      // sortDirections: ["descend"],
    },
    {
      title: "Machine No.",
      dataIndex: "machineNo",
      defaultSortOrder: "descend",
      sorter: (a, b) => {
        const name1 = a.machineNo.toUpperCase();
        const name2 = b.machineNo.toUpperCase();

        let comparison = 0;

        if (name1 < name2) {
          comparison = 1;
        } else if (name1 > name2) {
          comparison = -1;
        }
        return comparison;
      },
      // fixed: "left",
      width: "15%",
    },
    {
      title: "Machine Name",
      dataIndex: "machineName",
      // fixed: "left",
      width: "15%",
    },
    {
      title: "Request-Sheet No.",
      dataIndex: "requestSheetNoOfBM",
      sorter: (a, b) => {
        const name1 = a.requestSheetNoOfBM.toUpperCase();
        const name2 = b.requestSheetNoOfBM.toUpperCase();

        let comparison = 0;

        if (name1 < name2) {
          comparison = 1;
        } else if (name1 > name2) {
          comparison = -1;
        }
        return comparison;
      },
      // fixed: "left",
      width: "20%",
    },
    {
      title: "Problem Ocurred",
      dataIndex: "problemOccurredDateAndTimeOfBMForTable",
      sorter: (a, b) => {
        let comparison = 0;

        if (
          a.problemOccurredDateAndTimeOfBMForTable <
          b.problemOccurredDateAndTimeOfBMForTable
        ) {
          comparison = 1;
        } else if (
          a.problemOccurredDateAndTimeOfBMForTable >
          b.problemOccurredDateAndTimeOfBMForTable
        ) {
          comparison = -1;
        }
        return comparison;
      },
      // fixed: "left",
      width: "15%",
    },
    {
      title: "Assign User",
      dataIndex: "assignUser",
      // fixed: "left",
      width: "15%",
      render: (text, record) => {
        return `${record?.assignUser}, ${
          record?.handOverUser ? record?.handOverUser : ""
        }`;
      },
    },
    // {
    //   title: "MTD TL",
    //   render: (text, record) =>
    //     record.approvalStatusOfMTD_TL?.map((value, idx) => (
    //       <>
    //         <span>
    //           <b> {value}</b> - {record?.approverNameLogOfMTD_TL?.[idx]} ,{" "}
    //           {moment(record.approvalDateAndTimeOfMTD_TL?.[idx])
    //             .tz("Asia/Kolkata")
    //             .format("DD-MM-YYYY THH:mm")}
    //         </span>
    //         <br />
    //       </>
    //     )),
    // },
    // {
    //   title: "MTD HOSS",
    //   render: (text, record) =>
    //     record[`approvalStatusOf${(MTD_HOSS).replace(" ", "_")}`]?.map((value, idx) => (
    //       <>
    //         <span>
    //           <b> {value} </b> - {record?.approverNameLogOfMTD_HOSS?.[idx]} ,{" "}
    //           {moment(record.approvalDateAndTimeOfMTD_HOSS?.[idx])
    //             .tz("Asia/Kolkata")
    //             .format("DD-MM-YYYY THH:mm")}
    //         </span>
    //         <br />
    //       </>
    //     )),
    // },
  ];

  const generateHeader = async (approverHeaderList) => {
    let mergedApprovalListArrayForTable = [];
    approverHeaderList?.map((valueOfApprover) => {
      mergedApprovalListArrayForTable.push({
        title: `${valueOfApprover}`,
        render: (text, record) =>
          record[`approvalStatusOf${valueOfApprover.replace(" ", "_")}`]?.map(
            (value, idx) => (
              <>
                <span>
                  <b> {value}</b> -{" "}
                  {
                    record[
                      `approverNameLogOf${valueOfApprover.replace(" ", "_")}`
                    ]?.[idx]
                  }{" "}
                  ,{" "}
                  {record[
                    `approvalDateAndTimeOf${valueOfApprover.replace(" ", "_")}`
                  ]?.[idx] &&
                    moment(
                      record[
                        `approvalDateAndTimeOf${valueOfApprover.replace(
                          " ",
                          "_"
                        )}`
                      ]?.[idx]
                    )
                      .tz("Asia/Kolkata")
                      .format("DD-MM-YYYY THH:mm")}
                  {value === "Rejected" && (
                    <>
                      {", "}
                      <b>Remarks:</b>{" "}
                      {record?.rejectedRemarksOfRequestSheet?.[idx]}
                    </>
                  )}
                </span>
                <br />
              </>
            )
          ),

        width: 300,
      });
    });

    setColumns(commonColumns.concat(mergedApprovalListArrayForTable));
  };

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

  const getApprovalLogDetails = async () => {
    try {
      const res = await fetch(
        // `/getApprovalLogDetails`,
        `/getApprovalLogDetails/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}&&selectedMonth=${reduceState?.selectedMonth}`,
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
        // setApproverHeaderList(data?.mergedApprovalListArray);
        generateHeader(data?.mergedApprovalListArray);
        setApprovalLogs(data?.approvalDataLogs);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (
      reduceState?.selectedValue
      // &&
      // (flagForTogglingFilter === "based-on-cell" ||
      //   flagForTogglingFilter === "based-on-line")
    ) {
      getApprovalLogDetails();
    }
  }, [
    reduceState?.selectedValue,
    reduceState?.selectedYear,
    reduceState?.selectedMonth,
  ]);

  const onChange = (pagination, filters, sorter, extra) => {
    console.log("params", pagination, filters, sorter, extra);
  };

  const findSearchValue = (value) => {
    let searchResultFind = approvalLogs.filter((obj) => {
      return obj?.requestSheetNoOfBM
        ?.toLowerCase()
        ?.startsWith(value?.toLowerCase());
    });
    setSearchResult(searchResultFind);
  };

  return (
    <Container fluid>
      <BMTitlebar
        title="Approval Logs"
        Toolbar={
          <ChartsToolbar
            baseUrlForFiltering={baseUrlForFiltering}
            reduceState={reduceState}
            reducerDispatch={reducerDispatch}
            monthFiltration
            yearFiltration
            sectionFiltration
            subSectionFiltration
            cellFiltration
            lineFiltration
            machineFiltration
            resetButtonFiltration
          />
        }
      />
      <Row className="p-1">
        <Col></Col>
        <Col xs={6}></Col>
        <Col>
          <Search
            allowClear
            placeholder="Search..."
            onSearch={(value) => findSearchValue(value)}
          />
        </Col>
      </Row>
      <ConfigProvider
        theme={{
          components: {
            Table: {
              headerBg: "#0fa3b1",
              borderColor: "#9f9f9f",
              fontWeightStrong: 700,
            },
          },
        }}
      >
        <Table
          columns={columns}
          dataSource={searchResult?.length > 0 ? searchResult : approvalLogs}
          onChange={onChange}
          // width={"100%"}
          scroll={{ x: 3000, y: 600 }}
          pagination={false}
          bordered
        />
      </ConfigProvider>
    </Container>
  );
};

export default ApprovalLogs;
