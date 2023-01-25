import React from "react";
import ClipLoader from "react-spinners/ClipLoader";

const LoadingAnimation = () => {
  return (
    <ClipLoader
      color="#002D37"
      loading={true}
      // style={{ color: "while" }}
      // cssOverride={override}
      size={50}
      aria-label="Loading Spinner"
      data-testid="loader"
    />
  );
};

export default LoadingAnimation;
