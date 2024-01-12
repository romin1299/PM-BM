export const commonDatalabels = {
  formatter: (value, context) => {
    return value !== 0 ? Math.round(value * 100) / 100 : null;
  },
  font: { weight: "bold", size: 10 },
  // color: "white",
  // color: (context) => context.dataset.type === "line" ? chartColors[3] : "gray",
  anchor: (context) => (context.dataset.type === "line" ? "end" : "center"),
  align: (context) => (context.dataset.type === "line" ? "top" : "center"),
  offset: (context) => (context.dataset.type === "line" ? -2 : 0),
};

export const barDatalabels = {
  formatter: (value, context) => {
    if (context.dataset.type === "bar") {
      return value !== 0 ? Math.round(value * 100) / 100 : null;
    }
    return null;
  },
  font: { weight: "bold", size: 10 },
  // color: (context) => {
  //   context.dataset.data.map((value, index) => {
  //     if (context.dataIndex === 0) console.log("value:", value);
  //     return "black";
  //   });
  // },
};

// export const roundedNoDatalabels = {
//   formatter: (value, context) => {
//     return `${Math.round(value * 100) / 100} (${
//       Math.round(category?.bdCount?.[context?.dataIndex] * 100) / 100
//     })`;
//   },
// };
