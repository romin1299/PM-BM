import React, { useState, useEffect } from "react";
import moment from "moment";
import { Table, Input, ConfigProvider } from "antd";
import { Row, Col } from "react-bootstrap";
const Search = Input.Search;

const BDRequestSheetAntDesignTable = ({
  requestSheetData,
  downloadFileName,
}) => {
  const [searchResult, setSearchResult] = useState([]);

  // let SrNo = 0;
  const requestSheetHeader = [
    // {
    //   title: "Sr. No.",
    //   render: (text, record) => (SrNo = ++SrNo),
    // },
    {
      title: "Section",
      dataIndex: "sectionName",
    },
    {
      title: "Request No",
      dataIndex: "requestSheetNoOfBM",
    },
    {
      title: "Product",
      dataIndex: "cell",
    },
    {
      title: "Line",
      dataIndex: "line",
    },
    {
      title: "Machine No",
      dataIndex: "machineNo",
    },
    {
      title: "Machine Name",
      dataIndex: "machineName",
    },
    {
      title: "Problem",
      dataIndex: "problem",
      filters: requestSheetData?.map((obj) => ({
        value: obj?.problem,
        text: obj.problem,
      })),

      filterMode: "tree",
      filterSearch: true,
      onFilter: (value, record) => record.problem.startsWith(value),
    },
    {
      title: "Date-time",
      dataIndex: "problemOccurredDateAndTimeOfBM",
    },
    {
      title: "Work Order Status",
      dataIndex: "work_order_status",
    },
    {
      title: "R.S Status",
      dataIndex: "requestSheetStatus",
    },
  ];

  const onChange = (pagination, filters, sorter, extra) => {
    console.log("params", pagination, filters, sorter, extra);
  };

  const findSearchValue = (value) => {
    let searchResultFind = requestSheetData.filter((obj) => {
      return (
        obj?.sectionName?.toLowerCase()?.startsWith(value?.toLowerCase()) ||
        obj?.requestSheetNoOfBM
          ?.toLowerCase()
          ?.startsWith(value?.toLowerCase()) ||
        obj?.cell?.toLowerCase()?.startsWith(value?.toLowerCase()) ||
        obj?.line?.toLowerCase()?.startsWith(value?.toLowerCase()) ||
        obj?.machineNo?.toLowerCase()?.startsWith(value?.toLowerCase()) ||
        obj?.machineName?.toLowerCase()?.startsWith(value?.toLowerCase()) ||
        obj?.problem?.toLowerCase()?.startsWith(value?.toLowerCase()) ||
        obj?.problemOccurredDateAndTimeOfBM
          ?.toLowerCase()
          ?.startsWith(value?.toLowerCase()) ||
        obj?.work_order_status
          ?.toLowerCase()
          ?.startsWith(value?.toLowerCase()) ||
        obj?.requestSheetStatus?.toLowerCase()?.startsWith(value?.toLowerCase())
      );
    });
    setSearchResult(searchResultFind);
  };

  return (
    <>
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
              fontWeightStrong: 700,
              borderColor: "#9f9f9f",
            },
          },
        }}
      >
        <Table
          columns={requestSheetHeader}
          dataSource={
            searchResult?.length > 0 ? searchResult : requestSheetData
          }
          onChange={onChange}
          // width={"100%"}
          scroll={{ x: 2000 }}
          pagination={false}
          bordered
        />
      </ConfigProvider>
    </>
  );
};

export default BDRequestSheetAntDesignTable;
