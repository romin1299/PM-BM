import { Box, Tab, Tabs, Typography } from "@mui/material";
import React, { useState, useEffect } from "react";
import QrReader from "react-qr-reader";
import { useNavigate } from "react-router-dom";
import { denso_logo } from "../../modules/LoginModules";
import LoginCard from "./LoginCard";
import QRReaderByQrScanner from "../../BM/QR_codeReader/QR_ReaderByQrScanner";
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

const TabletLogin = () => {
  const [scanData, setScanData] = useState(false);
  const navigate = useNavigate();
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleScan = async (scannedMachineCode) => {
    if (scannedMachineCode?.data) {
      setScanData(false);
      navigate(`/loginAfterScanned/${scannedMachineCode?.data}`);
    }
  };
  const handleError = (err) => {
    console.error(err);
  };
  useEffect(() => {
    setScanData(true);
  }, []);

  const tabStyles = {
    // "&:MuiButtonBase-root": {
    //   borderRadius: "8px",
    // },
    "&:hover": {
      color: "#004B5B",
      opacity: 1,
    },
    "&.Mui-selected": {
      color: "white",
      backgroundColor: "#004B5B",
      fontWeight: "16px",
    },
    "&.Mui-focusVisible": {
      backgroundColor: "#d1eaff",
    },
  };

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: "background.paper",
        borderRadius: "8px",
      }}
    >
      <center>
        <img
          style={{ textAlign: "center", marginBottom: "1rem" }}
          className="denso_logo"
          src={denso_logo}
          alt=""
          srcSet=""
        />
      </center>
      <Tabs
        value={value}
        onChange={handleChange}
        indicatorColor="#004B5B"
        variant="fullWidth"
        // sx={{ borderRadius: "8px 8px 0px 0px" }}
        sx={{
          borderRadius: "8px",
          boxShadow: "inset 0px 0px 0px 1px #004B5B",
          MozBoxShadow: "inset 0px 0px 0px 1px #004B5B",
          WebkitBoxShadow: "inset 0px 0px 0px 1px #004B5B",
        }}
        centered
      >
        <Tab sx={tabStyles} label="Scan" />
        <Tab sx={tabStyles} label="Login" />
      </Tabs>
      <TabPanel value={value} index={0}>
        <p>{scanData}</p>
        <div className="headings">
          <h2
            style={{
              fontWeight: "600",
              textAlign: "center",
              margin: "1rem 0px 2rem 0px",
              // textTransform: "uppercase",
            }}
            className="text text-medium color-text"
          >
            Scan QR
          </h2>
        </div>
        {scanData && (
          <QRReaderByQrScanner handleScan={handleScan} />

          // <QrReader
          //   facingMode="environment"
          //   delay={1000}
          //   onScan={handleScan}
          //   onError={handleError}
          //   style={{ width: "100", height: "150" }}
          // />
        )}
      </TabPanel>
      <TabPanel value={value} index={1}>
        <LoginCard />
      </TabPanel>
    </Box>
  );
};

export default TabletLogin;
