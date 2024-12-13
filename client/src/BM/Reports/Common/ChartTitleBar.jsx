import { Divider, Typography } from "@mui/material";
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

const ChartTitleBar = (props) => {
  const {
    title,
    Toolbar,
    titleProps,
    disableDivider = false,
    ...restProps
  } = props;

  return (
    <>
      <Row
        className="align-items-center gx-2"
        style={{ marginBottom: "0.5rem" }}
      >
        {title && (
          <Col className="d-flex align-items-center">
            <Typography
              noWrap
              className="col"
              variant="h5"
              component="h5"
              fontSize={20}
              fontWeight={400}
              {...titleProps}
              {...restProps}
            >
              {title}
            </Typography>
          </Col>
        )}

        {Toolbar && Toolbar}
      </Row>

      {!disableDivider && <Divider sx={{ mb: 2, borderColor: "black" }} />}
    </>
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
          // variant="outlined"
          id="basic-button"
          aria-haspopup="true"
          aria-controls={open ? "basic-menu" : undefined}
          aria-expanded={open ? "true" : undefined}
          sx={{ minWidth: "auto", p: "4px 6px" }}
          // size="small"
          onClick={handleClick}
        >
          <DownloadIcon
            fontSize="small"
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
export default ChartTitleBar;
