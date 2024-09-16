exports.gettingFYYear = (date) => {
  if (moment(new Date(date)).tz("Asia/Kolkata").month() < 3) {
    return `${moment(new Date(date)).tz("Asia/Kolkata").year() - 1}-${moment(
      new Date(date)
    )
      .tz("Asia/Kolkata")
      .year()}`;
  }

  return `${moment(new Date(date)).tz("Asia/Kolkata").year()}-${
    moment(new Date(date)).tz("Asia/Kolkata").year() + 1
  }`;
};
