import { useState, useEffect } from "react";
import axios from "axios";

import tryCatch from "../Utils/tryCatch";

const useSafeGetRequest = ({
  url = "",
  referenceArrayForUseEffect = [],
  initialState = {},
  axiosConfig = {},
}) => {
  const [responseData, setResponseData] = useState(initialState);

  useEffect(() => {
    setResponseData((responseData) => ({
      ...responseData,
      isLoading: true,
    }));

    const controller = new AbortController();
    axiosConfig["signal"] = controller.signal;

    (async () => {
      const response = await tryCatch(axios.get(url, axiosConfig));

      if (!response?.isError) {
        return setResponseData({
          ...initialState,
          isLoading: false,
          data: response,
        });
      }

      setResponseData({
        ...initialState,
        isLoading: false,
        isError: response?.isError,
      });
    })();

    return () => {
      controller.abort();
    };
  }, referenceArrayForUseEffect);

  return [responseData, setResponseData];
};

export default useSafeGetRequest;
