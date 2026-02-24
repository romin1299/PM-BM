import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const toastifyContainer = ({
  type = "success",
  message = "",
  position = "top-right",
  autoClose = 2000,
  hideProgressBar = false,
  closeOnClick = false,
  pauseOnHover = false,
  draggable = true,
  progress = undefined,
  theme = "light",
}) => {
  toast[type](message, {
    position,
    autoClose,
    hideProgressBar,
    closeOnClick,
    pauseOnHover,
    draggable,
    progress,
    theme,
  });
};

export default toastifyContainer;
