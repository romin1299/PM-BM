import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const exportPDF = (elementId, name, onclone) => {
  const domElement = document.getElementById(elementId);

  const options = {
    onclone,
    scale: 4,
    windowWidth: 1600,
  };

  html2canvas(domElement, options).then((canvas) => {
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "pt", "a4");
    var pageWidth = pdf.internal.pageSize.getWidth();
    var pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${name}_${timeStamp()}.pdf`);
  });
};

//get the date and time
const timeStamp = () => {
  let date = new Date();
  let getTime = date
    .toLocaleTimeString("en-IN", {
      hour12: true,
    })
    .replace(/(.*)\D\d+/, "$1");
  const year = date.getFullYear(); // 2019
  const month = date.getMonth() + 1;
  const day = date.getDate(); // 23

  return `${day}/${month}/${year}-${getTime}`;
};

// funciton with old logic
const oldLogicForPDFDownload = (name) => {
  var jsPdf = new jsPDF("p", "pt", "a1");
  var htmlElement = document.getElementById("request-sheet-target");
  // document.querySelector("table-scrolling").style.
  // you need to load html2canvas (and dompurify if you pass a string to html)
  const opt = {
    margin: [60, 80, 70, 80],
    autoPaging: "text",
    html2canvas: {
      removeContainer: false,
      // onclone: (document) => {
      //   document.getElementById("rs-top-btns").style.display = "none";
      //   document.getElementById("rs-denso-logo").style.display = "block";
      // },
      allowTaint: true,
      dpi: 300,
      letterRendering: true,
      logging: false,
      // scale: 1,

      // width: 1440,
      // windowWidth: 1440,
    },

    callback: function (jsPdf) {
      jsPdf.save(`${name}_${timeStamp()}`);
      // to open the generated PDF in browser window
      // window.open(jsPdf.output("bloburl"));
    },

    elementHandlers: {
      "#rs-top-btns": function (element, renderer) {
        return true;
      },
    },
  };

  jsPdf.html(htmlElement, opt);
};
