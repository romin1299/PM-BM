import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import MaterialTable from "@material-table/core";
import axios from "axios";
import FileDownload from "js-file-download";
import { Container, Row, Col } from "react-bootstrap";

import CustomHooksForBackNavigation, {
  MuiNavigateBack,
} from "../ButtonComponents/CustomHooksForBackNavigation";
import {
  YearDropdown,
  MonthDropdown,
} from "../../BM/Reports/ManHourReport/SubComponents/LineSelectionDropdown";

import BDRequestSheetTable from "../../BM/Reports/Common/DailyBDRequestSheetTable";
import tableIcons from "../../components/MatrialTableIcon";
import ReportTitleBar from "../../BM/Reports/Common/ReportTitleBar";

import {
  MaterialTableOptions,
  MaterialTableSX,
  MaterialTableStyle,
} from "../../BM/Utils/TableUtils/MaterialTableProps";
import { Box } from "@material-ui/core";

const PMHistory = ({ machine_code, selectedYear, selectedMonth }) => {
  let columns = [
    {
      title: "Sr. No.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
    },
    {
      title: "Schedule Month",
      field: "schedule_month",
    },
    {
      title: "Cell/Product",
      field: "cell_name",
    },
    {
      title: "Line",
      field: "line_name",
    },
    {
      title: "Machine",
      field: "machine_name",
    },
    {
      title: "M/c.No",
      field: "machine_Id",
    },
    {
      title: "Inspection Point",
      field: "inception_point",
    },
    {
      title: "Date-Time",
      field: "date",
    },
    {
      title: "Remarks",
      field: "remarks",
    },
    {
      title: "Abnormality",
      field: "abnormality",
    },
    {
      title: "Abnormality Remarks",
      field: "abnormality_remarks",
    },
    {
      title: "Abnormality Status",
      field: "abnormality_status",
    },
    {
      title: "Action Details",
      field: "actionDetailsOfAbnormalityClose",
    },
    {
      title: "Target",
      field: "target",
    },
    {
      title: "Spare Used",
      field: "spare_used",
    },
    {
      title: "P Name",
      field: "part_name",
    },
    {
      title: "Part No",
      field: "part_no",
    },
    {
      title: "Cost",
      field: "part_cost",
    },
    {
      title: "Done By",
      field: "done_by",
    },
    {
      title: "Photo",
      field: "uploaded_file_name",
      render: (rowData) => (
        <button
          style={{
            backgroundColor: "transparent",
            border: "none",
            color: "#0A58CA",
            textDecoration: "underline",
          }}
          onClick={() => {
            try {
              axios({
                url: `/downloadUploadedImage/${rowData?.uploaded_file_name}`,
                method: "GET",
                responseType: "blob",
              }).then((res) => {
                FileDownload(res.data, rowData?.uploaded_file_name);
              });
            } catch (error) {
              console.log(error);
            }
          }}
        >
          {rowData?.uploaded_file_name}
        </button>
      ),
    },
  ];

  const [pmHistory, setPmHistory] = useState([]);

  const getMachineHistory = async () => {
    try {
      const res = await fetch(
        `/getMachineHistory/?machineInfo.machine_Id=${machine_code}&&current_year=${selectedYear}&&${
          selectedMonth && `schedule_month=${selectedMonth}`
        }`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, pmHistory } = await res.json();

      if (res?.status === 201) {
        setPmHistory(pmHistory);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getMachineHistory();
  }, [machine_code, selectedYear, selectedMonth]);

  return (
    <div>
      <Box className="mt-1 cell p-0 border-0">
        <MaterialTable
          localization={{
            header: {
              actions: "Actions",
            },
          }}
          actions={[]}
          icons={tableIcons}
          columns={columns}
          data={pmHistory}
          editable={{}}
          options={{
            ...MaterialTableOptions,
            pageSize: 5,
          }}
          style={MaterialTableStyle}
          sx={MaterialTableSX}
        />
      </Box>
    </div>
  );
};

const BMHistory = ({ machine_code, search, selectedYear, selectedMonth }) => {
  const [requestSheetHistoryData, setRequestSheetHistoryData] = useState([]);

  const getRequestSheetHistoryBasedOnMachine = async () => {
    try {
      const res = await fetch(
        `/getRequestSheetHistoryBasedOnMachine/${search}&&selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, requestSheetData } = await res.json();

      if (res?.status === 201) {
        setRequestSheetHistoryData(requestSheetData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getRequestSheetHistoryBasedOnMachine();
  }, [machine_code, selectedYear, selectedMonth]);

  return (
    <div>
      <BDRequestSheetTable
        requestSheetData={requestSheetHistoryData}
        downloadFileName={"MTTR trend"}
        selectedYear={selectedYear}
      />
    </div>
  );
};

const pageInfo = {
  "bm-history": (prop) => <BMHistory {...prop} />,
  "pm-history": (prop) => <PMHistory {...prop} />,
};

const HistoryFormateTable = () => {
  const { page, machine_code } = useParams();

  const { search } = useLocation();

  const [selectedYear, setSelectedYear] = useState(
    new Date().getMonth() < 3
      ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
      : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
  );
  const [selectedMonth, setSelectedMonth] = useState("");

  return (
    <Container fluid>
      <ReportTitleBar
        title={machine_code}
        PreTools={<MuiNavigateBack />}
        Toolbar={
          <Col className="col-auto">
            <YearDropdown
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
            />
            &nbsp;
            <MonthDropdown
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
          </Col>
        }
      />

      <Row>
        {pageInfo?.[page]({
          machine_code,
          search,
          selectedYear,
          selectedMonth,
        })}
      </Row>
    </Container>
  );
};

export default HistoryFormateTable;
