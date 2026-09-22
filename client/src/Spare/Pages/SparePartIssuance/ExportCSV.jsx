import React from "react";
import { axiosGetOrDelete } from "../../Utils/axiosUtils";
import { saveAs } from "file-saver";

const ExportCSV = ({ url, axiosParams }) => {
  const exportCSV = async () => {
    const { isError, tableData, fileName } = await axiosGetOrDelete({
      url,
      axiosProps: {
        params: axiosParams,
      },
    });
    // The request helper has already shown the error; an empty list must not
    // become a file that says "undefined".
    if (isError || !tableData) return;
    saveAs(
      new Blob([tableData], {
        type: "text/csv;charset=utf-8;",
      }),
      fileName,
    );
  };

  return (
    <div>
      <button
        type="button"
        className="btn bg-success"
        onClick={() => exportCSV()}
      >
        CSV
      </button>
    </div>
  );
};

export default ExportCSV;
