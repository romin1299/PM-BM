import { Box, Divider, Paper, Typography } from "@mui/material";

const MachineStatusBox = ({ title, bodyText1, bodyText2 }) => (
  <Paper variant="outlined" sx={{ borderColor: "#40694842" }}>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mt: "2px",
      }}
      p={"2px 8px"}
    >
      <Typography variant="body2" component="div" fontWeight={500}>
        {title}
      </Typography>
    </Box>

    <Divider sx={{ borderColor: "black" }} />
    <Box
      sx={{
        backgroundColor: "#c6efce",
        // height:"100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "32px",
        minWidth: "100px",
        maxWidth: "150px",
      }}
      className="text-break"
      p={"2px 8px"}
    >
      <Typography
        variant="body1"
        component="span"
        fontWeight={500}
        color="black"
      >
        {bodyText1}
      </Typography>

      <Typography variant="body2" component="span" color="black">
        {bodyText2}
      </Typography>
    </Box>
  </Paper>
);

export default MachineStatusBox;
