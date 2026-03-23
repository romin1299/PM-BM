import { theme } from "antd";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";

const downloadFile = async (head, bodyData, fileType, header, fileName) => {
  try {
    if (fileType === "csv") {
      const blob = new Blob(bodyData, {
        type: "text/csv;charset=utf-8;",
        // endings:'native'
      });

      saveAs(blob, fileName + ".csv");
    } else {
      const doc = new jsPDF("l");
      doc.text(fileName, 15, 10);

      doc.autoTable({
        // head: [header],
       
        body: [head],

        theme: "grid",
      });

      doc.autoTable({
        head: [header],
        body: bodyData,
        theme: "grid",
      });

      doc.save(fileName + ".pdf");
    }
  } catch (error) {
    console.error("Error downloading data:", error);
  }
};

export default downloadFile;
