import { Box, Paper, Typography } from "@mui/material";
import React, { useContext, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { CircularSkillChart } from "./CircularSkillChart";
import TmMttrSkillScoreCrud, {
  TmSkillScoreTable,
} from "./TMMttrSkillScoreCrud";
import RoutingContext from "../../../context/routing/RoutingContext";
import Loading from "../../../components/Loading/Loading";

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

const TmMttrSkillScore = (prop) => {
  const [highestScore, setHighestScore] = useState(0);
  const { loading } = prop;

  const context = useContext(RoutingContext);

  // console.log(prop?.pieChartData);

  if (loading) {
    return (
      <Box className="cell p-3">
        <Loading height={200} />
      </Box>
    );
  }

  return (
    <Box className="cell p-3">
      <Row className="gx-3">
        {prop?.pieChartData?.map((tm, index) => (
          <Col
            // lg={1}
            md={2}
            sm={3}
            xs={4}
            key={index}
          >
            <Box className="aleart alert-primary border">
              <Typography variant="h6" textAlign="center">
                {tm.tm_name}
              </Typography>
              <Typography variant="body2" fontSize={16} textAlign="center">
                {tm.tm_no}
              </Typography>
              <Box>
                <CircularSkillChart
                  score={tm.score}
                  highestScore={highestScore}
                />
              </Box>
              <Typography variant="h6" textAlign="center">
                {tm.hours}
              </Typography>
            </Box>
          </Col>
        ))}
      </Row>

      <Row className="gx-3">
        <Col xs={12} md={6} lg={4}>
          {context.tm_grade === "HOD" || context.tm_grade === "HOS" ? (
            <TmMttrSkillScoreCrud {...prop} setHighestScore={setHighestScore} />
          ) : (
            <TmSkillScoreTable {...prop} setHighestScore={setHighestScore} />
          )}
        </Col>
      </Row>
    </Box>
  );
};

export default TmMttrSkillScore;
