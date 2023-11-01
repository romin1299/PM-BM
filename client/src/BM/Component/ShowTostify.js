import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const SuccessToast = async (props) => {
  await toast.success(`${props}`, {
    position: "top-right",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "light",
  });
};

export const UnknownErrorToast = (props) => {
  toast.error("Some error occurred!", {
    position: "top-right",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "light",
  });
};

// export const AlreadyExistsToast = (props) => {
//     toast.warn(`${props}`, {
//         position: "top-right",
//         autoClose: 2000,
//         hideProgressBar: false,
//         closeOnClick: false,
//         pauseOnHover: false,
//         draggable: true,
//         progress: undefined,
//         theme: "light",
//     });
// }

export const KnownBackendErrorToast = (props) => {
  toast.warn(`${props}`, {
    position: "top-right",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "light",
  });
};

export const WarningToast = (props) => {
  toast.warn(`${props}`, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
  });
};
