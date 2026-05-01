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
    if (!url) return;

    setResponseData((responseData) => ({
      ...responseData,
      isLoading: true,
    }));

    let isCancelled = false;
    const controller = new AbortController();

    (async () => {
      const response = await tryCatch(
        axios.get(url, { ...axiosConfig, signal: controller.signal }),
      );

      if (isCancelled) return;

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
      isCancelled = true;
      controller.abort();
    };
  }, [url, ...referenceArrayForUseEffect]);

  return [responseData, setResponseData];
};

export default useSafeGetRequest;

// import { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import tryCatch from "../Utils/tryCatch";

// const useSafeGetRequest = ({
//   url = "",
//   referenceArrayForUseEffect = [],
//   initialState = {},
//   axiosConfig = {},
// }) => {
//   const [responseData, setResponseData] = useState(() => ({
//     ...initialState,
//     isLoading: true,
//     isError: false,
//     data: null,
//   }));

//   // Stable refs
//   const axiosConfigRef = useRef(axiosConfig);
//   const initialStateRef = useRef(initialState);

//   useEffect(() => {
//     axiosConfigRef.current = axiosConfig;
//   }, [axiosConfig]);

//   useEffect(() => {
//     initialStateRef.current = initialState;
//   }, [initialState]);

//   useEffect(() => {
//     if (!url) return;

//     let isCancelled = false;
//     const controller = new AbortController();

//     setResponseData((prev) => ({
//       ...prev,
//       isLoading: true,
//       isError: false,
//     }));

//     (async () => {
//       const response = await tryCatch(
//         axios.get(url, {
//           ...axiosConfigRef.current,
//           signal: controller.signal,
//         }),
//       );

//       if (isCancelled) return;

//       if (!response?.isError) {
//         setResponseData((prev) => ({
//           ...prev,
//           isLoading: false,
//           isError: false,
//           data: response,
//         }));
//       } else {
//         setResponseData((prev) => ({
//           ...prev,
//           isLoading: false,
//           isError: true,
//         }));
//       }
//     })();

//     return () => {
//       isCancelled = true;
//       controller.abort();
//     };
//   }, [url, ...referenceArrayForUseEffect]);

//   return [responseData, setResponseData];
// };

// export default useSafeGetRequest;
