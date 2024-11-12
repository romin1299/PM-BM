import * as React from "react";
// import { useTheme } from "@mui/material/styles";
import MobileStepper from "@mui/material/MobileStepper";
import Button from "@mui/material/Button";
// import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
// import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";

const PaginationForLTPM = ({
  // setVisibleYears,
  // visibleYears,
  yearsOfLTPM,
  setLTPMData,
}) => {
  // const theme = useTheme();
  const [activeStep, setActiveStep] = React.useState(0);
  const handleNext = () => {
    if (activeStep < yearsOfLTPM.length - 1) {
      setActiveStep((prevStep) => prevStep + 1);
      // setVisibleYears((prevYears) => [
      //   ...prevYears,
      //   yearsOfLTPM[activeStep + 1],
      // ]);

      setLTPMData((LTPMData) => ({
        ...LTPMData,
        yearList: [...LTPMData?.yearList, yearsOfLTPM[activeStep + 1]],
      }));
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prevStep) => prevStep - 1);
      // setVisibleYears((prevYears) => [
      //   yearsOfLTPM[activeStep - 1], // add the previous year
      //   ...prevYears.slice(0, -1), // remove the most recent year
      // ]);

      setLTPMData((LTPMData) => ({
        ...LTPMData,
        yearList: [yearsOfLTPM[activeStep + 1], ...LTPMData?.yearList],
      }));
    }
  };
  return (
    <div>
      <MobileStepper
        variant="dots"
        steps={yearsOfLTPM.length}
        position="static"
        activeStep={activeStep}
        nextButton={
          <Button
            size="small"
            onClick={handleNext}
            disabled={activeStep === yearsOfLTPM.length - 1}
          >
            Next
          </Button>
        }
        backButton={
          <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
            Back
          </Button>
        }
      />
      {/* <div style={{ display: "flex", marginTop: "10px" }}>
        {visibleYears.map((year, index) => (
          <div
            key={index}
            style={{
              marginRight: "8px",
              padding: "8px",
              background: activeStep === index ? "blue" : "gray",
              color: "white",
            }}
          >
            {year}
          </div>
        ))}
      </div> */}
    </div>
  );
};

export default PaginationForLTPM;
