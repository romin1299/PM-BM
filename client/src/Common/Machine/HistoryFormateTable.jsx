import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import MaterialTable from "@material-table/core";
import axios from "axios";
import FileDownload from "js-file-download";
import { Container, Row } from "react-bootstrap";

import { MuiNavigateBack } from "../ButtonComponents/CustomHooksForBackNavigation";
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
import { Box, Paper } from "@material-ui/core";
import { MachineNameTypography } from "./MachineDocument";

const PMHistory = ({
  machine_code,
  selectedYear,
  selectedMonth,
  filters = null,
}) => {
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
          title={filters}
          options={{
            ...MaterialTableOptions,
            showTitle: true,
            pageSize: 5,
          }}
          style={MaterialTableStyle}
          sx={MaterialTableSX}
        />
      </Box>
    </div>
  );
};

const BMHistory = ({
  machine_code,
  search,
  selectedYear,
  selectedMonth,
  filters = null,
}) => {
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
        filters={filters}
      />
    </div>
  );
};

const pageInfo = {
  "bm-history": (prop) => <BMHistory {...prop} />,
  "pm-history": (prop) => <PMHistory {...prop} />,
};
const pageNames = {
  "bm-history": "BM History",
  "pm-history": "PM History",
};

const HistoryFormateTable = () => {
  const { page, machine_code } = useParams();

  const { search, state } = useLocation();
  const machineName = state?.selectedMachineDetails?.machine_name;

  const [selectedYear, setSelectedYear] = useState(
    new Date().getMonth() < 3
      ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
      : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
  );
  const [selectedMonth, setSelectedMonth] = useState("");

  const TimeFiltersComponent = () => {
    return (
      <div className="py-2 px-2">
        <YearDropdown
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
        />
        &nbsp;
        <MonthDropdown
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
        />
      </div>
    );
  };

  return (
    <Container fluid>
      <ReportTitleBar
        title={pageNames?.[page]}
        PreTools={<MuiNavigateBack />}
        Toolbar={
          <MachineNameTypography
            machineCode={machine_code}
            machineName={machineName}
          />
        }
      />
      {/* 
      <Row className="cell p-3 mt-3 gap-2 g-0 align-items-center">
        <Col className="d-flex align-items-center gap-2">
          <MuiNavigateBack />

          <Typography noWrap variant="body2" component="div">
            <Typography
              noWrap
              variant="h4"
              component="h4"
              sx={{
                "&.MuiTypography-root": {
                  mb: "-4px",
                  ml: "-1px",
                  fontSize: 24,
                  fontWeight: 600,
                },
              }}
            >
              {pageNames?.[page]}
            </Typography>
            {machineName}
          </Typography>
        </Col>
      </Row> */}

      <Row>
        {pageInfo?.[page]({
          machine_code,
          search,
          selectedYear,
          selectedMonth,
          filters: <TimeFiltersComponent />,
        })}
      </Row>
    </Container>
  );
};

export default HistoryFormateTable;
