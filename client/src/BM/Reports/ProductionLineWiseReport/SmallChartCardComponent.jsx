import { Box, Divider, Typography } from "@mui/material";
import React, { Children } from "react";
import { Col, Row } from "react-bootstrap";

import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import Tooltip from "@mui/material/Tooltip";

const SmallChartCardComponent = ({ title, children, Toolbar }) => {
  return (
    <Box className="cell p-3">
      <Row>
        <Typography
          className="col"
          variant="h6"
          component="h6"
          fontSize={20}
          fontWeight={400}
        >
          {title}
        </Typography>

        {Toolbar && Toolbar}
      </Row>

      <Divider sx={{ mb: 1, borderColor: "black" }} />

      {children}
    </Box>
  );
};

export function ChartDownloadMenu({
  handleDownloadPPTX,
  handleDownloadCSV,
  handleDownloadPDF,
  handleDownloadImage,
}) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <Tooltip title="Download">
        <Button
          disableElevation
          size="small"
          variant="contained"
          id="basic-button"
          aria-haspopup="true"
          aria-controls={open ? "basic-menu" : undefined}
          aria-expanded={open ? "true" : undefined}
          sx={{ minWidth: "auto" }}
          // size="small"
          onClick={handleClick}
        >
          <DownloadIcon
          // fontSize="small"
          // style={{ color: "white" }}
          />
        </Button>
      </Tooltip>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
        // anchorOrigin={{
        //   vertical: "bottom",
        //   horizontal: "right",
        // }}
        // transformOrigin={{
        //   horizontal: "right",
        // }}
      >
        {handleDownloadPPTX && (
          <MenuItem onClick={handleDownloadPPTX}>
            <ListItemIcon>
              <DescriptionIcon className="text-warning" />
            </ListItemIcon>
            <ListItemText>PPTX</ListItemText>
          </MenuItem>
        )}

        {handleDownloadCSV && (
          <MenuItem onClick={handleDownloadCSV}>
            <ListItemIcon>
              <DescriptionIcon className="text-success" />
            </ListItemIcon>
            <ListItemText>CSV</ListItemText>
          </MenuItem>
        )}

        {handleDownloadPDF && (
          <MenuItem onClick={handleDownloadPDF}>
            <ListItemIcon>
              <PictureAsPdfIcon className="text-danger" />
            </ListItemIcon>
            <ListItemText>PDF</ListItemText>
          </MenuItem>
        )}

        {handleDownloadImage && (
          <MenuItem onClick={handleDownloadImage}>
            <ListItemIcon>
              <ImageIcon className="text-primary" />
            </ListItemIcon>
            <ListItemText>Image</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </div>
  );
}
export default SmallChartCardComponent;
