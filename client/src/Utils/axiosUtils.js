import axios from "axios";
import tryCatch from "./tryCatch";

export const axiosPostOrPatch = async ({
  apiType = "post",
  url = "",
  axiosBody = {},
  axiosProps: { params, headers } = { params: {}, headers: {} },
}) =>
  await tryCatch(
    axios[apiType](url, axiosBody, {
      params,
      headers: {
        "x-no-compression": true,
        ...headers,
      },
    })
  );

export const axiosGetOrDelete = async ({
  apiType = "get",
  url = "",
  axiosProps: { params, headers } = { params: {}, headers: {} },
}) =>
  await tryCatch(
    axios[apiType](url, {
      params,
      headers: {
        "x-no-compression": apiType === "delete",
        ...headers,
      },
    })
  );
