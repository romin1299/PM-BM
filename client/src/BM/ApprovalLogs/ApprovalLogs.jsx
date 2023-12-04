import React, { useEffect, useState } from "react";
import { Table } from "antd";
import moment from "moment-timezone";

const ApprovalLogs = () => {
  const [approvalLogs, setApprovalLogs] = useState([]);
  // const [approverHeaderList, setApproverHeaderList] = useState([]);

  const [columns, setColumns] = useState([]);

  let MTD_HOSS = "MTD HOSS";

  let commonColumns = [
    {
      title: "Line",
      dataIndex: "line",
      filters: [
        {
          text: "Jjjoe",
          value: "Joe",
        },
        {
          text: "Jim",
          value: "Jim",
        },
      ],
      // specify the condition of filtering result
      // here is that finding the name started with `value`
      onFilter: (value, record) => record.name.indexOf(value) === 0,
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
      fixed: "left",
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
      fixed: "left",
      width: "15%",
    },
    {
      title: "Machine Name",
      dataIndex: "machineName",
      filters: [
        {
          text: "London",
          value: "London",
        },
        {
          text: "New York",
          value: "New York",
        },
      ],
      onFilter: (value, record) => record.machineNo.indexOf(value) === 0,
      fixed: "left",
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
      fixed: "left",
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
      fixed: "left",
      width: "15%",
    },
    {
      title: "Assign User",
      dataIndex: "assignUser",
      fixed: "left",
      width: "15%",
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
                </span>
                <br />
              </>
            )
          ),

        width: "25%",
      });
    });

    setColumns(commonColumns.concat(mergedApprovalListArrayForTable));
  };

  const getApprovalLogDetails = async () => {
    try {
      const res = await fetch("/getApprovalLogDetails", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
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
    getApprovalLogDetails();
  }, []);

  const onChange = (pagination, filters, sorter, extra) => {
    console.log("params", pagination, filters, sorter, extra);
  };

  return (
    <>
      <Table
        columns={columns}
        dataSource={approvalLogs}
        onChange={onChange}
        // width={"100%"}
        scroll={{ x: 2000, y: 630 }}
        pagination={false}
      />
    </>
  );
};

export default ApprovalLogs;
