import React from "react";
import { useNavigate } from "react-router-dom";
import { Container } from "react-bootstrap";
import { Button } from "@mui/material";

const ActivityStatusDashboardOfCM = () => {
  const navigate = useNavigate();

  const handleGenerateBMNavigation = async () => {
    navigate(`/cm/generateCMRequestSheetMainDashboard`);
  };

  return (
    <>
      <Container fluid>
        <div>ActivityStatusDashboardOfCM</div>
        <Button
          variant="contained"
          disableElevation
          onClick={handleGenerateBMNavigation}
          sx={{
            fontWeight: 400,
            bgcolor: "#004b5b",
            "&:hover": { bgcolor: "#026378" },
          }}
        >
          Generate CM Request-Sheet
        </Button>
      </Container>
    </>
  );
};

export default ActivityStatusDashboardOfCM;
