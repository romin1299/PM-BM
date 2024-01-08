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
import ChartTitleBar from "../Common/ChartTitleBar";
import "./TmMttrScoreCrudTable.scss";

const initialState = {
  score: "",
  from: "",
  to: "",
};

const tmSkillMeasures = [
  { _id: 1, score: 4, from: 0, to: 0.5 },
  { _id: 2, score: 3, from: 0.5, to: 0.75 },
  { _id: 3, score: 2, from: 0.75, to: 1.0 },
  { _id: 4, score: 1, from: 1.0, to: "n" },
];

const skillMeasuresFields = [
  { key: "from", name: "From", type: "number" },
  { key: "to", name: "To", type: "number" },
  { key: "score", name: "Score", type: "number" },
];

const actionStyle = {
  display: "flex",
  flexWrap: "noWrap",
  gap: "5px",
};

const TmMttrSkillScoreCrud = ({
  selectedSection,
  selectedSubSection,
  setHighestScore,
}) => {
  const [skillScore, setSkillScore] = React.useState(tmSkillMeasures);
  const [isAdding, setIsAdding] = useState(false);
  const [editedScore, setEditedScore] = useState(null);
  const [newSkillScore, setNewSkillScore] = useState({});

  let baseQuery = `?selectedSection=${selectedSection}&&selectedSubSection=${selectedSubSection}`;

  React.useEffect(() => {
    if (selectedSection || selectedSubSection) {
      fetchScoreData();
    }
  }, [selectedSection, selectedSubSection]);

  const fetchScoreData = async () => {
    const url = `/tmMTTRSkill/getScore/${baseQuery}`;

    try {
      const res = await axios.get(url, {
        withCredentials: true,
        credentials: "include",
      });

      if (res.status === 201) {
        setSkillScore(res?.data?.allScore);
        setHighestScore(res?.data?.maxScore);
      }
    } catch (error) {
      console.log("error:", error);
    }
  };

  const addScoreAPI = async (payload) => {
    const url = `/tmMTTRSkill/addNewScore/${baseQuery}`;

    try {
      const res = await axios.post(url, payload);

      if (res.status === 201) {
        setSkillScore([...skillScore, payload]);
        setHighestScore(res?.data?.maxScore);
      }
      setNewSkillScore(initialState);
      setIsAdding(false);
    } catch (error) {
      console.log("error:", error);
    }
  };

  const updateScoreAPI = async () => {
    const url = `/tmMTTRSkill/updateScore/${editedScore._id}/${baseQuery}`;

    try {
      const res = await axios.patch(url, editedScore);

      const updatedScores = skillScore?.map((score) =>
        score._id === editedScore._id ? editedScore : score
      );

      setHighestScore(res?.data?.maxScore);

      setSkillScore(updatedScores);

      setEditedScore(null);
    } catch (error) {
      console.log("error:", error);
    }
  };

  const deleteScoreAPI = async (id) => {
    const url = `/tmMTTRSkill/deleteScore/${id}/${baseQuery}`;

    try {
      await axios.delete(url);

      const updatedScores = skillScore?.filter((score) => score._id !== id);

      setSkillScore(updatedScores);
    } catch (error) {
      console.log("error:", error);
    }
  };

  const cancelEdit = () => {
    setNewSkillScore(initialState);
    setEditedScore(null);
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
              setNewSkillScore({
                ...currentScore,
                [field.key]: e.target.value,
              });
            else
              setEditedScore({
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
        <IconButton size="small" type={type || "button"} onClick={onClick}>
          <Icon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };

  return (
    <Paper variant="outlined" sx={{ mt: 2 }}>
      <Box display="flex" justifyContent="end" p={1}>
        <Button
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditedScore(null);
            setIsAdding(true);
          }}
        >
          Add New Score
        </Button>
      </Box>

      <form onSubmit={(e) => e.preventDefault()}>
        <table className="tm-mttr-score-table" style={{ width: "100%" }}>
          <thead>
            {skillMeasuresFields?.map((score, index) => (
              <th key={index} style={{ maxWidth: "100px" }}>
                {score.name}
              </th>
            ))}
            <th>Actions</th>
          </thead>

          <tbody>
            {skillScore?.map((score, index) =>
              editedScore && editedScore._id === score._id ? (
                <tr key={index}>
                  {skillMeasuresFields?.map((field) =>
                    renderInputFieldTable(editedScore, field)
                  )}
                  <td style={actionStyle}>
                    <IconRender
                      Icon={SaveIcon}
                      onClick={updateScoreAPI}
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
                  {skillMeasuresFields?.map((field, index) => (
                    <td key={index}>{score[field.key]}</td>
                  ))}
                  <td style={actionStyle}>
                    <IconRender
                      Icon={EditIcon}
                      onClick={() => {
                        setIsAdding(false);
                        setEditedScore(score);
                      }}
                      tooltipTitle="Edit Score"
                    />

                    <MuiDeleteDialog
                      disableTooltip
                      item={score}
                      handleSubmit={() => {
                        deleteScoreAPI(score._id);
                      }}
                      warningText={
                        <div>
                          Do you really want to delete Score{" "}
                          <b style={{ textDecoration: "underline" }}>
                            {score.score}
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
                {skillMeasuresFields?.map((field) =>
                  renderInputFieldTable(newSkillScore, field)
                )}
                <td style={actionStyle}>
                  <IconRender
                    Icon={SaveIcon}
                    onClick={() => addScoreAPI(newSkillScore)}
                    tooltipTitle="Add Score"
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

      {skillScore?.length <= 0 && !isAdding && (
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
  );
};

const TmSkillScoreTable = () => {
  const tmSkillMeasures = [
    { _id: 1, score: 4, from: 0, to: 0.5 },
    { _id: 2, score: 3, from: 0.5, to: 0.75 },
    { _id: 3, score: 2, from: 0.75, to: 1.0 },
    { _id: 4, score: 1, from: 1.0, to: "n" },
  ];

  const skillMeasuresFields = [
    { key: "from", name: "From", type: "time" },
    { key: "to", name: "To", type: "time" },
    { key: "score", name: "Score", type: "text" },
  ];

  return (
    <Paper variant="outlined" sx={{ mt: 2 }}>
      <table className="tm-mttr-score-table" style={{ width: "100%" }}>
        <thead>
          {skillMeasuresFields?.map((shift, index) => (
            <th key={index} style={{ maxWidth: "100px" }}>
              {shift.name}
            </th>
          ))}
        </thead>

        <tbody>
          {tmSkillMeasures?.map((shift, index) => (
            <tr>
              {skillMeasuresFields?.map((field, index) => (
                <td
                  key={index}
                  style={field.key === "score" ? { fontWeight: "600" } : null}
                >
                  {shift[field.key]}
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
export default TmMttrSkillScoreCrud;
