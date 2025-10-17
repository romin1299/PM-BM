import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Slide from "@mui/material/Slide";
import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton, Tooltip } from "@mui/material";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function MuiDeleteDialog({
  item,
  handleSubmit,
  context,
  notEditable,
}) {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDelete = () => {
    console.log("item:", item);
    handleSubmit(item.name, item._id, item.parentCategoryId);
    setOpen(false);
  };

  return (
    <React.Fragment>
      <Tooltip title="Delete" disableInteractive>
        <IconButton
          size="small"
          onClick={handleClickOpen}
          disabled={notEditable}
        >
          <DeleteIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle>{"Delete Confirmation"}</DialogTitle>
        <DialogContent>
          <DialogContentText
            id="alert-dialog-slide-description"
            className="alert alert-danger mt-2"
          >
            Do you really want to delete{" "}
            <b style={{ textDecoration: "underline" }}>{item.name}</b> category?
          </DialogContentText>
        </DialogContent>
        <DialogActions className="mb-2">
          <Button variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
