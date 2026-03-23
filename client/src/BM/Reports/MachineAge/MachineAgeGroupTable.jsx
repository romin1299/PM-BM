import React, { useState } from "react";

import Button from "@mui/material/Button";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";

import { Box, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import axios from "axios";
import { blueGrey } from "@mui/material/colors";

import MuiDeleteDialog from "../../Customized/CustomizedShifts/MuiDeleteButtonAndDialog";
// import "./TmMttrScoreCrudTable.scss";

const initialState = {
  group: "",
  from: "",
  to: "",
};

const machineGroupFields = [
  { key: "from", name: "From", type: "number" },
  { key: "to", name: "To", type: "number" },
  { key: "group", name: "Group", type: "text" },
];

const actionStyle = {
  display: "flex",
  flexWrap: "noWrap",
  gap: "5px",
};

const MachineAgeGroupTable = ({
  selectedSection,
  selectedSubSection,
  groupData,
  setGroupData,
  setGetDataForOtherComponentBasedOnMachineAgeGroupChange,
  notEditable,
}) => {
  // const [data, setData] = React.useState([
  //   { _id: "", group: 0, from: 0, to: 0 },
  // ]);
  const [isAdding, setIsAdding] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [newData, setNewData] = useState({});

  let baseQuery = `?selectedSection=${selectedSection}&&selectedSubSection=${selectedSubSection}`;
  React.useEffect(() => {
    if (selectedSection || selectedSubSection) {
      fetchData();
    }
  }, [selectedSection, selectedSubSection]);

  const fetchData = async () => {
    const url = `/getYearGroup/machineAge/${baseQuery}`;

    try {
      const res = await axios.get(url, {
        withCredentials: true,
        credentials: "include",
      });
      if (res.status === 201) {
        setGroupData(res?.data?.yearGroups);
      }
    } catch (error) {
      console.log("error:", error);
    }
  };

  const addAPI = async (payload) => {
    const url = `/addYearGroup/machineAge/${baseQuery}`;

    try {
      const res = await axios.post(url, payload);

      if (res.status === 201) {
        setGroupData([...groupData, payload]);
        setGetDataForOtherComponentBasedOnMachineAgeGroupChange(true);
      }
      setNewData(initialState);
      setIsAdding(false);
    } catch (error) {
      console.log("error:", error);
    }

    fetchData();
  };

  const updateAPI = async () => {
    const url = `/updateYearGroup/machineAge/${editedData._id}/${baseQuery}`;

    try {
      const res = await axios.patch(url, editedData);

      if (res?.status === 201) {
        const updatedScores = groupData?.map((group) =>
          group._id === editedData._id ? editedData : group
        );
        setGroupData(updatedScores);
        setGetDataForOtherComponentBasedOnMachineAgeGroupChange(true);
      }

      setEditedData(null);
    } catch (error) {
      console.log("error:", error);
    }

    fetchData();
  };

  const deleteAPI = async (id) => {
    const url = `/deleteYearGroup/machineAge/${id}/${baseQuery}`;

    try {
      const res = await axios.delete(url);

      if (res.status === 201) {
        const updatedScores = groupData?.filter((group) => group._id !== id);
        setGroupData(updatedScores);
        setGetDataForOtherComponentBasedOnMachineAgeGroupChange(true);
      }
    } catch (error) {
      console.log("error:", error);
    }

    fetchData();
  };

  const cancelEdit = () => {
    setNewData(initialState);
    setEditedData(null);
    setIsAdding(false);
  };

  const renderInputFieldTable = (currentScore, field) => {
    return (
      <td style={{ padding: "0px 4px" }} key={currentScore._id}>
        <input
          autoFocus={field.key === "from" && true}
          type={field.type}
          value={currentScore[field.key]}
          style={{ width: "60px" }}
          onChange={(e) => {
            if (isAdding)
              setNewData({
                ...currentScore,
                [field.key]: e.target.value,
              });
            else
              setEditedData({
                ...currentScore,
                [field.key]: e.target.value,
              });
          }}
        />
      </td>
    );
  };

  const IconRender = ({ Icon, onClick, tooltipTitle, type }) => {
    return (
      <Tooltip
        // title={tooltipTitle}
        aria-label={tooltipTitle}
        disableInteractive
      >
        <IconButton
          size="small"
          type={type || "button"}
          onClick={onClick}
          disabled={notEditable}
        >
          <Icon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };

  return (
    <Box className="cell p-3">
      <Paper variant="outlined">
        <Box display="flex" justifyContent="end" p={1}>
          <Button
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditedData(null);
              setIsAdding(true);
            }}
            disabled={notEditable}
          >
            Add New Group
          </Button>
        </Box>

        <form onSubmit={(e) => e.preventDefault()}>
          <table className="tm-mttr-score-table" style={{ width: "100%" }}>
            <thead>
              {machineGroupFields?.map((group, index) => (
                <th key={index} style={{ maxWidth: "100px" }}>
                  {group.name}
                </th>
              ))}
              <th>Actions</th>
            </thead>

            <tbody>
              {groupData?.map((group, index) =>
                editedData && editedData._id === group._id ? (
                  <tr key={index}>
                    {machineGroupFields?.map((field) =>
                      renderInputFieldTable(editedData, field)
                    )}
                    <td style={actionStyle}>
                      <IconRender
                        Icon={SaveIcon}
                        onClick={updateAPI}
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
                    {machineGroupFields?.map((field, index) => (
                      <td key={index}>{group[field.key]}</td>
                    ))}
                    <td style={actionStyle}>
                      <IconRender
                        Icon={EditIcon}
                        onClick={() => {
                          setIsAdding(false);
                          setEditedData(group);
                        }}
                        tooltipTitle="Edit Group"
                      />

                      <MuiDeleteDialog
                        disableTooltip
                        item={group}
                        handleSubmit={() => {
                          deleteAPI(group._id);
                        }}
                        notEditable
                        warningText={
                          <div>
                            Do you really want to delete Group{" "}
                            <b style={{ textDecoration: "underline" }}>
                              {group.group}
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
                  {machineGroupFields?.map((field) =>
                    renderInputFieldTable(newData, field)
                  )}
                  <td style={actionStyle}>
                    <IconRender
                      Icon={SaveIcon}
                      onClick={() => addAPI(newData)}
                      tooltipTitle="Add Group"
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

        {groupData?.length <= 0 && !isAdding && (
          <Box
            className="h-100"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            minHeight={100}
            bgcolor={"#e2e3e5"}
          >
            <Typography variant="h5" component="h5" textAlign="center">
              No Data Found
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

const TmSkillScoreTable = ({ selectedSection, selectedSubSection }) => {
  const [data, setData] = React.useState([
    { _id: "", group: 0, from: 0, to: 0 },
  ]);

  let baseQuery = `?selectedSection=${selectedSection}&&selectedSubSection=${selectedSubSection}`;

  const fetchData = async () => {
    const url = `/getYearGroup/machineAge/${baseQuery}`;

    try {
      const res = await axios.get(url, {
        withCredentials: true,
        credentials: "include",
      });

      if (res.status === 201) {
        setData(res?.data?.allScore);
      }
    } catch (error) {
      console.log("error:", error);
    }
  };

  React.useEffect(() => {
    if (selectedSection || selectedSubSection) {
      fetchData();
    }
  }, [selectedSection, selectedSubSection]);

  return (
    <Paper variant="outlined" sx={{ mt: 2 }}>
      <table className="tm-mttr-group-table" style={{ width: "100%" }}>
        <thead>
          {machineGroupFields?.map((shift, index) => (
            <th key={index} style={{ maxWidth: "100px" }}>
              {shift.name}
            </th>
          ))}
        </thead>

        <tbody>
          {data?.map((group, index) => (
            <tr>
              {machineGroupFields?.map((field, index) => (
                <td
                  key={index}
                  style={field.key === "group" ? { fontWeight: "600" } : null}
                >
                  {group[field.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Paper>
  );
};

export { TmSkillScoreTable };
export default MachineAgeGroupTable;
