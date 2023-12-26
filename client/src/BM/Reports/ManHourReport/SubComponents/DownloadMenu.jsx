import * as React from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { ContentCut } from "@mui/icons-material";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import Tooltip from "@mui/material/Tooltip";

export default function DownloadMenu({
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
      <Tooltip title="Export">
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
          Export{" "}
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
        <MenuItem onClick={handleDownloadPPTX}>
          <ListItemIcon>
            <DescriptionIcon className="text-warning" />
          </ListItemIcon>
          <ListItemText>PPTX</ListItemText>
        </MenuItem>
        {/* <MenuItem onClick={handleDownloadCSV}>
          <ListItemIcon>
            <DescriptionIcon className="text-success" />
          </ListItemIcon>
          <ListItemText>CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDownloadPDF}>
          <ListItemIcon>
            <PictureAsPdfIcon className="text-danger" />
          </ListItemIcon>
          <ListItemText>PDF</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDownloadImage}>
          <ListItemIcon>
            <ImageIcon className="text-primary" />
          </ListItemIcon>
          <ListItemText>Image</ListItemText>
        </MenuItem> */}
      </Menu>
    </div>
  );
}
