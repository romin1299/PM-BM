// Generates an array of random numbers for dummy data set
export const getRandomDataArray = (arrayLength, min = 30, max = 30) => {
  return Array.from({ length: arrayLength }, () =>
    Math.floor(Math.random() * (max - min) + min)
  );
};

export const getRandomColorsArray = (
  arrayLength,
  colorOptions = ["green", "red"]
) => {
  return Array.from({ length: arrayLength }, () => {
    let index = Math.floor(Math.random() * colorOptions.length);

    return colorOptions[index];
  });
};
