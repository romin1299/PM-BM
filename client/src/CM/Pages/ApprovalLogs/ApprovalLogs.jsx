import React, { useEffect, useState, useReducer } from "react";
import { Table, ConfigProvider } from "antd";
import ChartsToolbar from "../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState,
  reducer,
} from "../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";

import { Container } from "react-bootstrap";
import BMTitlebar from "../../../BM/Component/BMTitlebar";
import axios from "axios";
const ApprovalLogs = () => {
  const [approvalLogs, setApprovalLogs] = useState([]);

  const renderApprovalUser = (userArray) =>
    userArray?.map((value) => (
      <>
        <span>
          <b>{value?.approvalStatus}</b> -{value?.tm_name},
          {value?.approvalDateAndTime}
          {value?.approvalStatus === "Rejected" && (
            <>
              {", "}
              <b>Remarks:</b> {value?.rejectedRemarks}
            </>
          )}
        </span>
        <br />
      </>
    ));

  let commonColumns = [
    {
      title: "Cell",
      dataIndex: "cell",

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
      width: "7%",
      // sortDirections: ["descend"],
    },
    {
      title: "Line",
      dataIndex: "line",

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
      width: "7%",
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
      width: "7%",
    },
    {
      title: "Machine Name",
      dataIndex: "machineName",
      // fixed: "left",
      width: "7%",
    },
    {
      title: "Request-Sheet No.",
      dataIndex: "requestSheetNoOfCM",
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
      width: "10%",
    },
    {
      title: "Planned Date",
      // dataIndex: "current_commonDataFilledByAssignUser.plannedDateAndTimeOfCM",
      render: (text, record) => (
        <span>
          {record?.current_commonDataFilledByAssignUser?.plannedDateAndTimeOfCM}
        </span>
      ),
      sorter: (a, b) => {
        let comparison = 0;
        if (
          a.current_commonDataFilledByAssignUser?.plannedDateAndTimeOfCM <
          b.current_commonDataFilledByAssignUser?.plannedDateAndTimeOfCM
        ) {
          comparison = 1;
        } else if (
          a.current_commonDataFilledByAssignUser?.plannedDateAndTimeOfCM >
          b.current_commonDataFilledByAssignUser?.plannedDateAndTimeOfCM
        ) {
          comparison = -1;
        }
        return comparison;
      },
      // fixed: "left",
      width: "7%",
    },
    {
      title: "Assign User",
      //   dataIndex: "assignUserForCM",
      render: (text, record) => (
        <span>
          {record?.current_commonDataFilledByAssignUser?.assignUserForCM?.map(
            (value) => (
              <span>{value.tm_name},</span>
            )
          )}
        </span>
      ),
      // fixed: "left",
      width: "7%",
    },

    {
      title: "MTD TL",
      render: (text, record) =>
        renderApprovalUser(
          record?.current_commonDataFilledByAssignUser?.approvalOfMTD_TL
        ),
      width: "20%",
    },
    {
      title: "MTD HOS",
      render: (text, record) =>
        renderApprovalUser(
          record?.current_commonDataFilledByAssignUser?.approvalOfMTD_HOS
        ),

      width: "20%",
    },
    {
      title: "PRD TL",
      render: (text, record) =>
        renderApprovalUser(
          record?.current_commonDataFilledByAssignUser?.approvalOfPRD_TL
        ),

      width: "20%",
    },
  ];
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

  const getApprovalLogDetails = async () => {
    try {
      const response = await axios.get(
        `/getApprovalLogsForCM/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}&&selectedMonth=${reduceState?.selectedMonth}`
      );
      setApprovalLogs(response?.data?.approvalDataLogs);
      console.log(response.data);
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
      <ConfigProvider
        theme={{
          components: {
            Table: {
              headerBg: "#0fa3b1",
              borderColor: "#9f9f9f",
              fontWeightStrong: 700,
              fontSize: 18,
              fontSizeIcon: 15,
              opacityLoading: 2.65,
            },
          },
        }}
      >
        <Table
          columns={commonColumns}
          //   dataSource={searchResult?.length > 0 ? searchResult : approvalLogs}
          dataSource={approvalLogs}
          //   onChange={onChange}
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
