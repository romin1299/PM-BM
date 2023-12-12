import React, { useState } from "react";

import Button from "@mui/material/Button";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";

import { Box, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import axios from "axios";
import { blueGrey } from "@mui/material/colors";
import MuiDeleteDialog from "./MuiDeleteButtonAndDialog";

import "./ManageShifts.scss";

const initialState = {
  shiftName: "",
  shiftStartTime: "",
  shiftEndTime: "",
};

const shiftOfBM = [
  { _id: 1, shiftName: "A", shiftStartTime: "06:00", shiftEndTime: "14:30" },
  { _id: 2, shiftName: "B", shiftStartTime: "14:15", shiftEndTime: "22:45" },
  { _id: 3, shiftName: "C", shiftStartTime: "22:45", shiftEndTime: "06:15" },
];

const CustomManageShifts = () => {
  const [shifts, setShifts] = useState(shiftOfBM);
  const [isAdding, setIsAdding] = useState(false);
  const [editedShift, setEditedShift] = useState(null);
  const [newShift, setNewShift] = useState({});

  React.useEffect(() => {
    fetchShiftData();
  }, []);

  const fetchShiftData = async () => {
    const url = "/getAllShifts";

    try {
      const res = await axios.get(url, {
        withCredentials: true,
        credentials: "include",
      });

      // console.log("fetch shifts res:", res);
      setShifts(res?.data?.getShifts);
    } catch (error) {
      console.log("error:", error);
    }
  };

  const addShiftAPI = async (payload) => {
    const url = "/addShift";

    try {
      await axios.post(url, {
        withCredentials: true,
        credentials: "include",
        ...payload,
      });
    } catch (error) {
      console.log("error:", error);
    }

    fetchShiftData();
  };

  const updateShiftAPI = async (payload) => {
    console.log("update payload:", payload);
    const url = `/updateShift/${payload._id}`;

    try {
      await axios.patch(url, {
        withCredentials: true,
        credentials: "include",
        ...payload,
      });
    } catch (error) {
      console.log("error:", error);
    }

    fetchShiftData();
  };

  const deleteShiftAPI = async (id) => {
    const url = `/deleteShift/${id}`;

    try {
      await axios.patch(url, {
        withCredentials: true,
        credentials: "include",
      });
    } catch (error) {
      console.log("error:", error);
    }

    fetchShiftData();
  };

  const addShift = async () => {
    if (
      newShift.shiftName &&
      newShift.shiftStartTime &&
      newShift.shiftEndTime
    ) {
      console.log("newShift:", newShift);
      addShiftAPI(newShift);

      setShifts([...shifts, newShift]);
      setNewShift(initialState);
      setIsAdding(false);
    }
  };

  const updateShift = () => {
    if (
      editedShift.shiftName &&
      editedShift.shiftStartTime &&
      editedShift.shiftEndTime
    ) {
      const updatedShifts = shifts?.map((shift) =>
        shift._id === editedShift._id ? editedShift : shift
      );
      updateShiftAPI(editedShift);
      setShifts(updatedShifts);
      setEditedShift(null);
    }
  };

  const cancelEdit = () => {
    setNewShift(initialState);
    setEditedShift(null);
    setIsAdding(false);
  };

  const shiftFieldsArray = [
    { key: "shiftName", name: "Shift", type: "text" },
    { key: "shiftStartTime", name: "Start Time", type: "time" },
    { key: "shiftEndTime", name: "End Time", type: "time" },
  ];

  const renderInputFieldTable = (currentShift, field) => {
    return (
      <td style={{ padding: "0px 4px" }} key={currentShift._id}>
        <input
          autoFocus={field.key === "shiftName" && true}
          type={field.type}
          value={currentShift[field.key]}
          onChange={(e) => {
            if (isAdding)
              setNewShift({
                ...currentShift,
                [field.key]: e.target.value,
              });
            else
              setEditedShift({
                ...currentShift,
                [field.key]: e.target.value,
              });
          }}
        />
      </td>
    );
  };

  const actionStyle = {
    display: "flex",
    flexWrap: "noWrap",
    gap: "5px",
  };

  const IconRender = ({ Icon, onClick, tooltipTitle, type }) => {
    return (
      <Tooltip
        // title={tooltipTitle}
        aria-label={tooltipTitle}
        disableInteractive
      >
        <IconButton size="small" type={type || "button"} onClick={onClick}>
          <Icon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };

  return (
    <div className="cell p-3">
      <Typography variant="h4" fontSize={"1.5rem"} fontWeight={500} mb={1}>
        Manage Shifts
      </Typography>

      <Paper variant="outlined" sx={{}}>
        <Box display="flex" justifyContent="end" p={1}>
          <Button
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditedShift(null);
              setIsAdding(true);
            }}
          >
            Add New Shift
          </Button>
        </Box>

        <form>
          <table className="shifts-table" style={{ width: "100%" }}>
            <thead>
              {shiftFieldsArray?.map((shift, index) => (
                <th key={index} style={{ maxWidth: "100px" }}>
                  {shift.name}
                </th>
              ))}
              <th>Actions</th>
            </thead>

            <tbody>
              {shifts?.map((shift, index) =>
                editedShift && editedShift._id === shift._id ? (
                  <tr key={index}>
                    {shiftFieldsArray?.map((field) =>
                      renderInputFieldTable(editedShift, field)
                    )}
                    <td style={actionStyle}>
                      <IconRender
                        Icon={SaveIcon}
                        onClick={updateShift}
                        tooltipTitle="Save Changes"
                        type="submit"
                      />

                      <IconRender
                        Icon={CancelIcon}
                        onClick={cancelEdit}
                        tooltipTitle="Cancel"
                      />
                    </td>
                  </tr>
                ) : (
                  <tr>
                    {shiftFieldsArray?.map((field, index) => (
                      <td key={index}>{shift[field.key]}</td>
                    ))}
                    <td style={actionStyle}>
                      <IconRender
                        Icon={EditIcon}
                        onClick={() => {
                          setIsAdding(false);
                          setEditedShift(shift);
                        }}
                        tooltipTitle="Edit Shift"
                      />

                      <MuiDeleteDialog
                        disableTooltip
                        item={shift}
                        handleSubmit={() => {
                          deleteShiftAPI(shift._id);
                        }}
                        warningText={
                          <div>
                            Do you really want to delete Shift{" "}
                            <b style={{ textDecoration: "underline" }}>
                              {shift.shiftName}
                            </b>
                            ?
                          </div>
                        }
                      />
                    </td>
                  </tr>
                )
              )}

              {isAdding && (
                <tr>
                  {shiftFieldsArray?.map((field) =>
                    renderInputFieldTable(newShift, field)
                  )}
                  <td style={actionStyle}>
                    <IconRender
                      Icon={SaveIcon}
                      onClick={() => addShift(newShift)}
                      tooltipTitle="Add Shift"
                      type="submit"
                    />

                    <IconRender
                      Icon={CancelIcon}
                      onClick={cancelEdit}
                      tooltipTitle="Cancel"
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </form>

        {shifts.length <= 0 && !isAdding && (
          <Box
            className=" h-100"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            minHeight={100}
            bgcolor={blueGrey[100]}
          >
            <Typography variant="h5" component="h5" textAlign="center">
              No Data Found
            </Typography>
          </Box>
        )}
      </Paper>
    </div>
  );
};

export default CustomManageShifts;
