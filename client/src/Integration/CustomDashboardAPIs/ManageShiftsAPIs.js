import axios from "axios";

export const fetchShiftData = async () => {
  const url = "/getAllShifts";

  try {
    const res = await axios.get(url, {
      withCredentials: true,
      credentials: "include",
    });

    return res;
  } catch (error) {
    console.log("error:", error);
  }
};

export const addShiftAPI = async (payload) => {
  console.log("payload:", payload);
  const url = "/addShift";

  try {
    const res = await axios.post(url, {
      withCredentials: true,
      credentials: "include",
      ...payload,
    });

    console.log("res:", res);

    // return res;
  } catch (error) {
    console.log("error:", error);
  }
};

export const updateShiftAPI = async (payload) => {
  console.log("payload:", payload);
  const url = "/addShift";

  try {
    const res = await axios.put(url, {
      withCredentials: true,
      credentials: "include",
      payload,
    });

    return res;
  } catch (error) {
    console.log("error:", error);
  }
};

export const deleteShiftAPI = async (payload) => {
  console.log("payload:", payload);
  const url = "/addShift";

  try {
    const res = await axios.delete(url, {
      withCredentials: true,
      credentials: "include",
      payload,
    });

    console.log("res:", res);

    return res;
  } catch (error) {
    console.log("error:", error);
  }
};
