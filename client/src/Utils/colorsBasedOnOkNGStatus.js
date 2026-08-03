import { green, red } from "@mui/material/colors";

const colorsBasedOnOkNGStatus = (status) =>
  status === "Ok" ? green[500] : red[500];

export default colorsBasedOnOkNGStatus;
