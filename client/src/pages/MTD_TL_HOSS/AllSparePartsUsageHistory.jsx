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
import { CSVLink } from "react-csv";
import { Button } from "@mui/material";

const AllSparePartsUsageHistory = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";
  const context = useContext(RoutingContext);

  const [allSparePartsUsageData, setAllSparePartsUsageData] = useState([]);

  const [fromAndToCost, setFromAndToCost] = useState({
    fromCost: 0,
    toCost: 0,
  });

  const styleForDeleteButton = {
    backgroundColor: "transparent",
    border: "none",
    textDecoration: "underline",
  };

  let columns = [
    {
      label: "Date",
      key: "totalSpareDataUsageHistory.date",
    },
    {
      label: "Line",
      key: "line",
    },
    {
      label: "Machine",
      key: "machine_name",
    },
    {
      label: "M/c.No",
      key: "machine_code",
    },
    {
      label: "Category",
      key: "type",
    },
    {
      label: "P Name",
      key: "totalSpareDataUsageHistory.partName",
    },
    {
      label: "Part No",
      key: "totalSpareDataUsageHistory.partNo",
    },
    {
      label: "Used By",
      key: "doneBy",
    },
    {
      label: "Cost",
      key: "totalSpareDataUsageHistory.cost",
    },
    {
      label: "Abnormality",
      key: "abnormality",
    },
    {
      label: "Spare Part",
      key: "totalSpareDataUsageHistory.spareParts",
    },
  ];

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

  const setDateFormatCommon = (value) => {
    if (
      moment(value, "D/M/YYYY - hh:mm A", true).isValid() ||
      moment(value, "D/M/YYYY - h:mm a", true).isValid()
    ) {
      return moment(value, "D/M/YYYY - hh:mm A").format("DD-MM-YYYY THH:mm");
    }
    if (moment(value, "YYYY-MM-DDTHH:mm", true).isValid()) {
      return value;
    }
    if (moment(value, "YYYY-MM-DD", true).isValid()) {
      return moment(value, "YYYY-MM-DD").format("DD-MM-YYYY [T]HH:mm");
    }
    return value;
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
        return setDateFormatCommon(value);
      },
      defaultSortOrder: "descend",
      sorter: (valueA, valueB) => {
        const dateA = setDateFormatCommon(
          valueA?.totalSpareDataUsageHistory?.date
        );
        const dateB = setDateFormatCommon(
          valueB?.totalSpareDataUsageHistory?.date
        );

        if (
          moment(dateA, "DD-MM-YYYY THH:mm").unix() <
          moment(dateB, "DD-MM-YYYY THH:mm").unix()
        )
          return -1;
        else if (
          moment(dateA, "DD-MM-YYYY THH:mm").unix() >
          moment(dateB, "DD-MM-YYYY THH:mm").unix()
        )
          return 1;

        return 0;
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
      sorter: (a, b) => {
        const costA = a?.totalSpareDataUsageHistory?.cost;
        const costB = b?.totalSpareDataUsageHistory?.cost;

        let comparison = 0;

        if (costA < costB) {
          comparison = -1;
        } else if (costA > costB) {
          comparison = 1;
        }
        return comparison;
      },
    },

    {
      title: "Abnormality",
      dataIndex: "abnormality",
    },

    {
      title: "Spare Part",
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

  const filterOutCostDataBasedOnUserInput = () => {
    if (fromAndToCost?.fromCost && fromAndToCost?.toCost) {
      let filteredData = allSparePartsUsageData?.filter((item) => {
        if (
          fromAndToCost?.fromCost <= item?.totalSpareDataUsageHistory.cost &&
          fromAndToCost?.toCost >= item?.totalSpareDataUsageHistory.cost
        ) {
          return item;
        }
      });
      setAllSparePartsUsageData(filteredData);
    } else if (fromAndToCost?.fromCost) {
      let filteredData = allSparePartsUsageData?.filter((item) => {
        if (fromAndToCost?.fromCost <= item?.totalSpareDataUsageHistory.cost) {
          return item;
        }
      });
      setAllSparePartsUsageData(filteredData);
    } else {
      getAllSpareUsageHistoryDetails();
    }
  };

  return (
    <>
      <ToastContainer />
      <Container fluid>
        <BMTitlebar
          title="Spare Usage History"
          Toolbar={
            <>
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
              <div className="col-auto mt-2">
                <CSVLink
                  headers={columns}
                  className="downloadCSV text-decoration-none"
                  data={allSparePartsUsageData ? allSparePartsUsageData : []}
                  filename={`All_Spare_Usage_History`}
                  style={{
                    textDecoration: "none",
                    color: "white",
                    // fontSize: "1rem",
                  }}
                >
                  {/* <FileDownloadIcon style={{ fontSize: "1.15rem" }} /> */}
                  CSV
                </CSVLink>
              </div>

              <div className="col-auto m-1">
                <span>
                  <b>From Value </b>
                </span>
                <input
                  type="number"
                  name="fromCost"
                  id="fromCost"
                  className="w-25"
                  onChange={(e) =>
                    setFromAndToCost({
                      ...fromAndToCost,
                      fromCost: e.target.value,
                    })
                  }
                />
                {/* </div>
              <div className="col-auto m-1"> */}
                &nbsp;
                <span>
                  <b>To Value </b>
                </span>
                <input
                  type="number"
                  name="toCost"
                  id="toCost"
                  className="w-25"
                  onChange={(e) =>
                    setFromAndToCost({
                      ...fromAndToCost,
                      toCost: e.target.value,
                    })
                  }
                />
                <Button
                  size="small"
                  disableElevation
                  className="bg-button"
                  variant="contained"
                  type="submit"
                  sx={{
                    ml: 1,
                    minWidth: "30px",
                    height: "30px",
                    paddingInline: "10px",
                  }}
                  onClick={filterOutCostDataBasedOnUserInput}
                >
                  Go
                </Button>
              </div>
            </>
          }
        />
        <ConfigProvider
          theme={{
            components: {
              Table: {
                headerBg: "#0fa3b1",
                fontWeightStrong: 700,
                borderColor: "#9f9f9f",
                fontSize: 18,
                fontSizeIcon: 15,
                opacityLoading: 2.65,
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
