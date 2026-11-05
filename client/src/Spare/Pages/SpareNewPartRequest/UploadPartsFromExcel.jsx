import { memo, useCallback, useRef, useState } from "react";
import axios from "axios";
import { saveAs } from "file-saver";

import toastifyContainer from "../../Utils/toastifyContainer";

/**
 * Filling a request-sheet's parts from an Excel workbook.
 *
 * A requester with many parts keys them into the template once instead of
 * entering each on the form. The server reads and checks the file and hands back
 * the parts in the form's own shape; they are put on the form to be reviewed and
 * edited like any other, and nothing is saved until the sheet is submitted. A
 * file with any problem fills nothing, and its problems are listed by row so the
 * file can be corrected and uploaded again.
 */

const base = "/v1/spare/spareRequestSheet";
const TEMPLATE_FILE_NAME = "Spare_Part_Request_Template.xlsx";

const notify = (type, message) => toastifyContainer({ type, message });

const UploadPartsFromExcel = memo(
  ({ newPartFor, hasEnteredParts, onPartsRead }) => {
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [problems, setProblems] = useState([]);

    const handleDownloadTemplate = useCallback(async () => {
      try {
        const response = await axios.get(`${base}/template`, {
          responseType: "blob",
        });
        saveAs(response.data, TEMPLATE_FILE_NAME);
      } catch (error) {
        notify("error", "The template could not be downloaded");
      }
    }, []);

    const handleChooseFile = useCallback(() => {
      // Min / Max Quantity are only read for a stock-in request, so the type
      // has to be chosen before a file can be read.
      if (!newPartFor)
        return notify("warn", "Please select For use or For stock in first");

      fileInputRef.current?.click();
    }, [newPartFor]);

    const handleFile = useCallback(
      async (event) => {
        const file = event.target.files?.[0];
        // Cleared so choosing the same corrected file again still fires.
        event.target.value = "";
        if (!file) return;

        // The upload replaces the parts already on the form.
        if (
          hasEnteredParts &&
          !window.confirm(
            "Uploading replaces the parts already entered on this sheet. Continue?",
          )
        )
          return;

        const formData = new FormData();
        formData.append("file", file);

        setIsUploading(true);
        setProblems([]);

        try {
          const { data } = await axios.post(`${base}/importParts`, formData, {
            params: { newPartFor },
            headers: { "Content-Type": "multipart/form-data" },
          });

          onPartsRead(data.parts);
          notify("success", data.message);
        } catch (error) {
          const data = error?.response?.data;
          setProblems(data?.errors ?? []);
          notify("warn", data?.message ?? "The file could not be uploaded");
        } finally {
          setIsUploading(false);
        }
      },
      [newPartFor, hasEnteredParts, onPartsRead],
    );

    return (
      <div className="d-flex flex-column gap-1 w-100">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <small className="text-nowrap">Add many parts from Excel:</small>

          <button
            type="button"
            className="btn btn-sm bg-button"
            onClick={handleDownloadTemplate}
          >
            Download template
          </button>

          <button
            type="button"
            className="btn btn-sm bg-success"
            onClick={handleChooseFile}
            disabled={isUploading}
          >
            {isUploading ? "Reading..." : "Upload Excel"}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="d-none"
            onChange={handleFile}
          />
        </div>

        {problems.length > 0 && (
          <div className="text-error" style={{ fontSize: "13px" }}>
            <b>Fix these and upload the file again:</b>
            <ul className="mb-0">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  },
);

export default UploadPartsFromExcel;
