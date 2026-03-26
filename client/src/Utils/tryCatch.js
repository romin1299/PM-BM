import toastifyContainer from "./toastifyContainer";

const tryCatch = async (prop) => {
  try {
    const response = await prop;

    const { data, status } = response;

    if (data?.showToast) {
      toastifyContainer({
        type: status === 201 || status === 200 ? "success" : "warn",
        message: data?.message,
      });
    }

    return data;
  } catch ({ response }) {
    if (response?.data?.showToast) {
      toastifyContainer({
        type: response?.status === 500 ? "error" : "warn",
        message: response?.data?.message,
      });
    }

    return { isError: true };
  }
};

export default tryCatch;
