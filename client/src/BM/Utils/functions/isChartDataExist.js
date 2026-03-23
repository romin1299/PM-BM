export function isChartDataExist(data) {
  const isDataExists = data?.datasets?.some((item) => {
    if (item?.label !== "Target" && item?.data?.length > 0) return true;
    return false;
  });

  return isDataExists;
}
