import { useMemo } from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";

import {
  MaterialTableOptions,
  MaterialTableStyle,
  MaterialTableSX,
} from "../../BM/Utils/TableUtils/MaterialTableProps";
import tableIcons from "../../components/MatrialTableIcon";
import DescriptionIcon from "@mui/icons-material/Description";
import { ExportCsv, ExportPdf } from "@material-table/exporters";
import MaterialTable from "@material-table/core";
import WithLoadingAndError from "./Common/WithLoadingAndError";

const defaultTableProps = {
  exportMenu: {
    exportFileNamePrefix: "Approval List of Request-Sheet",
  },
};

const serialNumberColumn = {
  title: "Sr. No.",
  render: (rowData) => `${rowData.tableData.id + 1}`,
  editable: false,
  width: "5%",
};

/**
 * Columns used when a caller does not supply its own. Built by a function rather
 * than held as a shared constant because MaterialTable writes bookkeeping onto the
 * column objects it is given, so every table instance needs its own copy.
 */
const buildRequestSheetColumns = () => [
  serialNumberColumn,
  { title: "Request No", field: "requestSheetNo" },
  { title: "Product", field: "cell.cell_name" },
  { title: "Line", field: "line.line_name" },
  { title: "Machine No", field: "machine.machine_code" },
  { title: "Machine Name", field: "machine.machine_name" },
  { title: "RS Status", field: "requestSheetStatus" },
  { title: "Budget Status", field: "budget.budgetStatus" },
];

const defaultRowAction = {
  tooltip: "Update Action",
  toPath: (rowData) => `/spare/spareNewPartRequest/?_id=${rowData?._id}`,
};

const TableComponent = ({ tableData, tableProps = defaultTableProps }) => {
  const navigate = useNavigate();

  /**
   * A caller can pass its own `columns` and `rowAction`; passing `rowAction: null`
   * gives a read-only table. Copied per instance for the same reason the defaults
   * are built by a function.
   */
  const columns = useMemo(
    () => (tableProps?.columns ?? buildRequestSheetColumns()).map((column) => ({ ...column })),
    [tableProps?.columns],
  );

  const actions = useMemo(() => {
    const rowAction =
      tableProps?.rowAction === undefined ? defaultRowAction : tableProps.rowAction;

    if (!rowAction) return [];

    return [
      {
        icon: () => <DescriptionIcon className="text-primary" />,
        tooltip: rowAction.tooltip ?? "Update Action",
        position: "row",
        onClick: (event, selectedRow) => navigate(rowAction.toPath(selectedRow)),
      },
    ];
  }, [tableProps?.rowAction, navigate]);

  const options = useMemo(() => {
    const fileName = `${tableProps?.exportMenu?.exportFileNamePrefix} ${moment().format("DD-MM-YYYY")}`;

    return {
      ...MaterialTableOptions,
      pageSize: tableProps?.pageSize ?? 50,
      exportMenu: [
        {
          label: "Export PDF",
          exportFunc: (cols, data) => ExportPdf(cols, data, fileName),
        },
        {
          label: "Export CSV",
          exportFunc: (cols, data) => ExportCsv(cols, data, fileName),
        },
      ],
    };
  }, [tableProps?.exportMenu?.exportFileNamePrefix, tableProps?.pageSize]);

  return (
    <MaterialTable
      localization={{
        header: {
          actions: "Actions",
        },
      }}
      actions={actions}
      icons={tableIcons}
      columns={columns}
      data={tableData}
      editable={{}}
      options={options}
      style={MaterialTableStyle}
      sx={MaterialTableSX}
    />
  );
};

const SpareSheetTable = ({
  flagForTogglingFilter,
  selectedValue,
  selectedYear,
  url = `/v1/spare/spareRequestSheet/approval`,
  tableProps = defaultTableProps,
}) => {
  return (
    <WithLoadingAndError
      requestProps={{
        url,
        axiosConfig: {
          params: {
            flagForTogglingFilter,
            selectedValue,
            selectedYear,
          },
        },
        referenceArrayForUseEffect: [
          flagForTogglingFilter,
          selectedValue,
          selectedYear,
        ],
        initialState: {
          isLoading: true,
          isError: false,
          data: {
            tableData: [],
          },
        },
      }}
      PropComponent={(prop) => (
        <TableComponent {...prop} tableProps={tableProps} />
      )}
    />
  );
};

export default SpareSheetTable;
