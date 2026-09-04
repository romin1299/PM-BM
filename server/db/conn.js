const mongoose = require("mongoose");
const DB = process.env.DATABASE;

//connection with database
mongoose
  .connect(DB)
  .then(async () => {
    console.log("connection successful Mongodb");
    const RequestSheetOfSpare = require("../model/requestSheetDataOfSpare");
    const SpareMaster = require("../model/spareMasterSchema");
    await RequestSheetOfSpare.syncIndexes();
    await SpareMaster.createIndexes();
  })
  .catch(console.log);
