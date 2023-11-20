import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import {
  GridRowModes,
  DataGrid,
  GridToolbarContainer,
  GridActionsCellItem,
  GridRowEditStopReasons,
} from "@mui/x-data-grid";



import { randomId, randomArrayItem } from "@mui/x-data-grid-generator";

const roles = ["Market", "Finance", "Development"];
const randomRole = () => {
  return randomArrayItem(roles);
};

const shiftOfBM = [
  { id: 1, shiftName: "A", shiftStartTime: "06:00", shiftEndTime: "14:30" },
  { id: 2, shiftName: "B", shiftStartTime: "14:15", shiftEndTime: "22:45" },
  { id: 3, shiftName: "C", shiftStartTime: "22:45", shiftEndTime: "06:15" },
];

function EditToolbar(props) {
  const { setRows, setRowModesModel } = props;

  const handleClick = () => {
    const id = randomId();
    setRows((oldRows) => [
      ...oldRows,
      { id, shiftName: "", shiftStartTime: "", shiftEndTime: "" },
    ]);
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: "shiftName" },
    }));
  };

  return (
    <GridToolbarContainer sx={{ justifyContent: "flex-end" }}>
      <Button color="primary" startIcon={<AddIcon />} onClick={handleClick}>
        Add New Shift
      </Button>
    </GridToolbarContainer>
  );
}

export default function ManageShifts() {
  const [rows, setRows] = React.useState(shiftOfBM);
  const [rowModesModel, setRowModesModel] = React.useState({});

  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleDeleteClick = (id) => () => {
    setRows(rows.filter((row) => row.id !== id));
  };

  const handleCancelClick = (id) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });

    const editedRow = rows.find((row) => row.id === id);
    if (editedRow.isNew) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const processRowUpdate = (newRow) => {
    const updatedRow = { ...newRow, isNew: false };
    setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
    return updatedRow;
  };

  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const columns = [
    {
      field: "shiftName",
      headerName: "Shift",
      minWidth: 30,
      // maxWidth: 100,
      // width: 180,
      editable: true,
    },
    {
      field: "shiftStartTime",
      headerName: "Start Time",
      type: "time",
      width: 120,
      renderCell: (params) => {
        const isInEditMode =
          rowModesModel[params.row.id]?.mode === GridRowModes.Edit;

        return (
          <input
            type="time"
            value={params.row.shiftStartTime}
            disabled={!isInEditMode}
            onChange={(e) => {
              if (isInEditMode) {
                const updatedRow = {
                  ...params.row,
                  shiftStartTime: e.target.value,
                };
                processRowUpdate(updatedRow);
              }
            }}
          />
        );
      },
    },
    {
      field: "shiftEndTime",
      headerName: "End Time",
      type: "time",
      width: 120,
      renderCell: (params) => {
        const isInEditMode =
          rowModesModel[params.row.id]?.mode === GridRowModes.Edit;

        return (
          <input
            type="time"
            value={params.row.shiftEndTime}
            disabled={!isInEditMode}
            onChange={(e) => {
              if (isInEditMode) {
                const updatedRow = {
                  ...params.row,
                  shiftEndTime: e.target.value,
                };
                processRowUpdate(updatedRow);
              }
            }}
          />
        );
      },
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      //   maxWidth: 100,
      //   width: 80,
      cellClassName: "actions",
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              icon={<SaveIcon />}
              label="Save"
              sx={{
                color: "primary.main",
              }}
              onClick={handleSaveClick(id)}
            />,
            <GridActionsCellItem
              icon={<CancelIcon />}
              label="Cancel"
              className="textPrimary"
              onClick={handleCancelClick(id)}
              color="inherit"
            />,
          ];
        }

        return [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleDeleteClick(id)}
            color="inherit"
          />,
        ];
      },
    },
  ];

  return (
    <div
      className="cell p-3 mt-2 mb-2"
      style={{
        width: "100%",
      }}
    >
      <h4>Manage Shifts</h4>

      <Box
        sx={{
          height: "100%",
          width: "100%",
          "& .actions": {
            color: "text.secondary",
          },
          "& .textPrimary": {
            color: "text.primary",
          },
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          autoHeight
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={handleRowModesModelChange}
          onRowEditStop={handleRowEditStop}
          processRowUpdate={processRowUpdate}
          slots={{
            toolbar: EditToolbar,
          }}
          slotProps={{
            toolbar: { setRows, setRowModesModel },
          }}
          hideFooter
        />
      </Box>
    </div>
  );
}
