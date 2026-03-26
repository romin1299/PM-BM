import React from "react";
import useSafeGetRequest from "../../../CustomHooks/useSafeGetRequest";

import Loading from "../../../components/Loading/Loading";
import DataNotFound from "../../../BM/Reports/Common/DataNotFound";

const WithLoadingAndError = ({
  requestProps = {
    url: "/v1/spare/spareKPI/spareSheetsSummery",
    axiosConfig: {},
    referenceArrayForUseEffect: [],
    initialState: {
      isLoading: true,
      isError: false,
      data: {},
    },
  },
  PropComponent = () => <></>,
}) => {
  const [{ isLoading, isError, data }] = useSafeGetRequest(requestProps);
  if (isLoading) return <Loading />;
  if (isError) return <DataNotFound />;
  return <PropComponent {...data} />;
};

export default WithLoadingAndError;
