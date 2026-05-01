import { memo, useMemo } from "react";
import useSafeGetRequest from "../../../CustomHooks/useSafeGetRequest";
import Loading from "../../../components/Loading/Loading";
import DataNotFound from "../../../BM/Reports/Common/DataNotFound";

const DEFAULT_INITIAL_STATE = { isLoading: true, isError: false, data: {} };
const DEFAULT_AXIOS_CONFIG = {};
const DEFAULT_DEPS = [];

const WithLoadingAndError = memo(({ requestProps, PropComponent }) => {
  const stableRequestProps = useMemo(() => {
    return {
      url: requestProps?.url || "/v1/spare/spareRequestSheet/summery",
      axiosConfig: requestProps?.axiosConfig || DEFAULT_AXIOS_CONFIG,
      referenceArrayForUseEffect:
        requestProps?.referenceArrayForUseEffect || DEFAULT_DEPS,
      initialState: requestProps?.initialState || DEFAULT_INITIAL_STATE,
    };
  }, [
    requestProps?.url,
    requestProps?.axiosConfig,
    requestProps?.referenceArrayForUseEffect,
    requestProps?.initialState,
  ]);

  const [{ isLoading, isError, data }] = useSafeGetRequest(stableRequestProps);

  if (isLoading) return <Loading />;
  if (isError) return <DataNotFound />;
  return <PropComponent {...data} />;
});

export default WithLoadingAndError;
