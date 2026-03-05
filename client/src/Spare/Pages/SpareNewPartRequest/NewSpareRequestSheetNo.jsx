import { useEffect } from "react";
import { axiosGetOrDelete } from "../../Utils/axiosUtils";

const NewSpareRequestSheetNo = ({ selectedLine, watch, setValue }) => {
  useEffect(() => {
    (async () => {
      const { isError, requestSheetNo } = await axiosGetOrDelete({
        url: "/v1/spare/spareRequestSheet/newSheetNo",
        axiosProps: {
          params: {
            selectedLine,
          },
        },
      });
      if (!isError) return setValue("requestSheetNo", requestSheetNo);
    })();
  }, [selectedLine]);

  return watch("requestSheetNo");
};

export default NewSpareRequestSheetNo;
