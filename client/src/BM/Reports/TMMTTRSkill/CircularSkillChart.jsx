import React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export const CircularSkillChart = ({ score = 1 }) => {
  const percentage = score * (100 / 4);

  return (
    <div style={{ padding: "10px" }}>
      <CircularProgressbar
        value={percentage}
        strokeWidth={50}
        styles={buildStyles({
          strokeLinecap: "butt",
        })}
      />
    </div>
  );
};
