import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";

const downloadFile = async (bodyData, fileType, header, fileName) => {
  try {
    if (fileType === "csv") {
      const blob = new Blob(bodyData, {
        type: "text/csv;charset=utf-8;",
      });

      saveAs(blob, fileName + ".csv");
    } else {
      const doc = new jsPDF();

      doc.autoTable({
        head: [header],
        body: bodyData,
      });

      doc.save(fileName + ".pdf");
    }
  } catch (error) {
    console.error("Error downloading data:", error);
  }
};

export default downloadFile;
