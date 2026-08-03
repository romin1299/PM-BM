import React from "react";
import { axiosGetOrDelete } from "../../Utils/axiosUtils";
import { saveAs } from "file-saver";

const ExportCSV = ({ url, axiosParams }) => {
  const exportCSV = async () => {
    const { tableData, fileName } = await axiosGetOrDelete({
      url,
      axiosProps: {
        params: axiosParams,
      },
    });
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
