var cron = require('node-cron');

exports.dummyCron = async () => {
  console.log("**************");

  cron.schedule('* * * * * *',()=>{
    console.log("cron ............")
  })
};
