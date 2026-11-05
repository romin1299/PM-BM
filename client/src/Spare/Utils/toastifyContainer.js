import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * High-emphasis toast: red, larger type and a longer dwell.
 *
 * Used for a refusal the reader has to actually read — the duplicate /
 * already-ordered message names every conflicting part and the request-sheet
 * it sits on, which the compact default toast wraps into an unreadable block.
 */
const ALERT_STYLE = {
  backgroundColor: "#c62828",
  color: "#ffffff",
  fontSize: "1.15rem",
  fontWeight: 600,
  lineHeight: 1.5,
  minHeight: "6rem",
  padding: "1.25rem 1.5rem",
  borderRadius: "0.5rem",
  boxShadow: "0 6px 24px rgba(198, 40, 40, 0.35)",
};

const ALERT_AUTO_CLOSE = 9000;

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
  /**
   * "alert" renders the toast as a large red error and keeps it up longer.
   * The server asks for it per response (`toastVariant`), so a refusal can be
   * made prominent without the client matching on its wording.
   */
  variant,
}) => {
  const isAlert = variant === "alert";

  toast[isAlert ? "error" : type](message, {
    position,
    autoClose: isAlert ? ALERT_AUTO_CLOSE : autoClose,
    hideProgressBar,
    closeOnClick,
    pauseOnHover,
    draggable,
    progress,
    // Dark theme keeps the close button and progress bar legible on red, and
    // the standard error icon would sit red-on-red: the fill already carries
    // the severity.
    theme: isAlert ? "dark" : theme,
    ...(isAlert
      ? {
          icon: false,
          style: ALERT_STYLE,
          progressStyle: { background: "rgba(255, 255, 255, 0.85)" },
        }
      : {}),
  });
};

export default toastifyContainer;
