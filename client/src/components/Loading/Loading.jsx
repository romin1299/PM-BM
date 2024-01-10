import React from "react";
import { Skeleton, Typography } from "@mui/material";
import PulseLoader from "react-spinners/PulseLoader";

const Loading = (props) => {
  const { sx } = props;
  return (
    <Skeleton
      variant="rectangular"
      component="div"
      animation="false"
      width={"100%"}
      height={300}
      {...props}
      sx={{
        borderRadius: "6px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        "&.MuiSkeleton-root > *": {
          visibility: "visible",
        },
        ...sx,
      }}
    >
      <Typography
        variant="h5"
        fontWeight={500}
        color={"#004b5b"}
        component="div"
        visibility="visible"
      >
        Loading
      </Typography>

      <PulseLoader
        color={"#004b5b"}
        loading={true}
        cssOverride={{
          display: "block",
          margin: "0 auto",
          borderColor: "red",
          visibility: "visible",
        }}
        size={10}
        speedMultiplier={0.6}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
    </Skeleton>
  );
};

export default Loading;
