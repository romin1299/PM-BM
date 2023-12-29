// Generates an array of random numbers for dummy data set
export const getRandomDataArray = (arrayLength, min = 30, max = 30) => {
  return Array.from({ length: arrayLength }, () =>
    Math.floor(Math.random() * (max - min) + min)
  );
};
