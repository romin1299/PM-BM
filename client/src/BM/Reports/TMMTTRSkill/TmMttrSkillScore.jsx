import { Box, Typography } from "@mui/material";
import React, { useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { CircularSkillChart } from "./CircularSkillChart";

const initialData = [
  {
    name: "Jaydev",
    tmNumber: "1166",
    skill: 4,
  },
  {
    name: "Jatindar",
    tmNumber: "788",
    skill: 1,
  },
  {
    name: "Manoj",
    tmNumber: "1377",
    skill: 2,
  },
];

const TmMttrSkillScore = () => {
  const [tmSkillData, setTmSkillData] = useState(initialData);
  return (
    <Box className="cell p-3">
      <Row className="gx-3">
        {tmSkillData?.map((tm, index) => (
          <Col
            // lg={1}
            md={2}
            sm={3}
            xs={4}
            key={index}
          >
            <Box className="aleart alert-primary border">
              <Typography variant="h6" textAlign="center">
                {tm.name}
              </Typography>
              <Typography variant="body2" fontSize={16} textAlign="center">
                {tm.tmNumber}
              </Typography>
              <Box>
                <CircularSkillChart score={tm.skill} />
              </Box>
              <Typography variant="h6" textAlign="center">
                {tm.skill}
              </Typography>
            </Box>
          </Col>
        ))}
      </Row>

      <TmSkillScoreCalculator />
    </Box>
  );
};

const TmSkillScoreCalculator = () => {
  const [tm, setTm] = React.useState({});

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
    <Row className="mt-3 gx-3">
      <Col sm={4}>
        <table className="shifts-table border" style={{ width: "100%" }}>
          <thead>
            {skillMeasuresFields?.map((shift, index) => (
              <th key={index} style={{ maxWidth: "100px" }}>
                {shift.name}
              </th>
            ))}
            {/* <th>Actions</th> */}
          </thead>

          <tbody>
            {tmSkillMeasures?.map((shift, index) => (
              <tr>
                {skillMeasuresFields?.map((field, index) => (
                  <td key={index}>{shift[field.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Col>
    </Row>
  );
};

export default TmMttrSkillScore;
