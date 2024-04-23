import React, { useReducer, useEffect, useState, useContext } from "react";
import ChartsToolbar from "../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState,
  reducer,
} from "../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import BMTitlebar from "../../BM/Component/BMTitlebar";
import { Container } from "react-bootstrap";
import { Table, Input, ConfigProvider } from "antd";
import moment from "moment";
import RoutingContext from "../../context/routing/RoutingContext";
import DeleteIcon from "@mui/icons-material/Delete";
import { ToastContainer } from "react-toastify";
import { SuccessToast } from "../../BM/Component/ShowTostify";

const AllSparePartsUsageHistory = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";
  const context = useContext(RoutingContext);

  const [allSparePartsUsageData, setAllSparePartsUsageData] = useState([]);

  const styleForDeleteButton = {
    backgroundColor: "transparent",
    border: "none",
    textDecoration: "underline",
  };

  const deleteCategoryPoint = async (rowValue) => {
    // console.log(rowValue);
    setAllSparePartsUsageData(
      allSparePartsUsageData?.filter((item) => {
        return item._id !== rowValue?._id;
      })
    );

    try {
      const res = await fetch("/deleteCategoryPoint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rowValue,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        SuccessToast(data?.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  let allSpareHistoryTableHeader = [
    {
      title: "Sr. No.",
      render: (value, item, idx) => {
        return ++idx;
      },
      width: 60,
    },
    {
      title: "Date",
      dataIndex: ["totalSpareDataUsageHistory", "date"],
      render: (value) => {
        if (moment(value, "YYYY-MM-DD", true).isValid()) {
          return moment(value).format("D/M/YYYY - hh:mm A");
        } else {
          return value;
        }
      },
    },
    {
      title: "Line",
      dataIndex: "line",
    },
    {
      title: "Machine",
      dataIndex: "machine_name",
    },
    {
      title: "Machine No.",
      dataIndex: "machine_code",
    },
    {
      title: "Category",
      dataIndex: "type",
      filters: [
        {
          value: "PM",
          text: "PM",
        },
        {
          value: "BM",
          text: "BM",
        },
        {
          value: "CM",
          text: "CM",
        },
        {
          value: "Corrective",
          text: "Corrective",
        },
        {
          value: "Predictive",
          text: "Predictive",
        },
        {
          value: "Kaizen",
          text: "Kaizen",
        },
      ],
      filterMode: "tree",
      filterSearch: true,
      onFilter: (value, record) =>
        record?.totalSpareDataUsageHistory?.type?.startsWith(value),
    },
    {
      title: "Part Name",
      dataIndex: ["totalSpareDataUsageHistory", "partName"],
    },
    {
      title: "Part No.",
      dataIndex: ["totalSpareDataUsageHistory", "partNo"],
    },

    {
      title: "Used By",
      dataIndex: "doneBy",
    },

    {
      title: "Cost",
      dataIndex: ["totalSpareDataUsageHistory", "cost"],
    },

    {
      title: "Abnormality",
      dataIndex: "abnormality",
    },

    {
      title: "SparePart",
      dataIndex: ["totalSpareDataUsageHistory", "spareParts"],
    },
    {
      title: "Action",
      dataIndex: "",
      width: 66,
      render: (value) => (
        <>
          {context?.user_type === "Section-Admin" ? (
            value?.type !== "PM" && value?.type !== "BM" ? (
              <button
                style={styleForDeleteButton}
                onClick={() => deleteCategoryPoint(value)}
              >
                <DeleteIcon />
              </button>
            ) : (
              ""
            )
          ) : context?.user_type !== "Operator" &&
            context?.tm_department !== "PRD" ? (
            value?.type !== "PM" && value?.type !== "BM" ? (
              <button
                style={styleForDeleteButton}
                onClick={() => deleteCategoryPoint(value)}
              >
                <DeleteIcon />
              </button>
            ) : (
              ""
            )
          ) : (
            ""
          )}
        </>
      ),
    },
  ];

  const getAllSpareUsageHistoryDetails = async () => {
    try {
      const res = await fetch(
        `/common/getAllSpareUsageHistoryDetails/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}&&selectedMonth=${reduceState?.selectedMonth}`,
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
        setAllSparePartsUsageData(data?.GetAllSpareConsumption);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (reduceState?.selectedValue) {
      getAllSpareUsageHistoryDetails();
    }
  }, [
    reduceState?.selectedValue,
    reduceState?.selectedYear,
    reduceState?.selectedMonth,
  ]);

  return (
    <>
      <ToastContainer />
      <Container fluid>
        <BMTitlebar
          title="Spare Usage History"
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
                fontWeightStrong: 700,
                borderColor: "#9f9f9f",
              },
            },
          }}
        >
          <Table
            columns={allSpareHistoryTableHeader}
            dataSource={allSparePartsUsageData}
            // width={"100%"}
            scroll={{ x: 1000 }}
            pagination={false}
            bordered
            summary={(value) => {
              let sumOfCost = 0;
              value?.map((costPfSpare) => {
                sumOfCost += costPfSpare?.totalSpareDataUsageHistory?.cost;
              });
              return (
                <Table.Summary fixed={"top"}>
                  <Table.Summary.Row>
                    <Table.Summary.Cell
                      index={0}
                      colSpan={9}
                    ></Table.Summary.Cell>
                    <Table.Summary.Cell index={9} className="bg-info">
                      {sumOfCost}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell
                      index={0}
                      colSpan={3}
                    ></Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
            sticky={true}
          />
        </ConfigProvider>
      </Container>
    </>
  );
};

export default AllSparePartsUsageHistory;
