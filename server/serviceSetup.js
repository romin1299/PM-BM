var Service = require("node-windows").Service;

// Create a new service object
var svc = new Service({
  name: "Denso PM-BM Software",
  description: "Denso-IMOPS",
  script: "D:\\Romin\\Projects\\DENSO BM\\denso_pm_bm\\server\\app.js",
  nodeOptions: ["--harmony", "--max_old_space_size=4096"],
  //, workingDirectory: '...'
//   allowServiceLogon: true,
});

// -------------------------------------------------------------------------
//            FOR ADDING SERVICE
// -------------------------------------------------------------------------
svc.on("install", function () {
svc.start();
});

svc.install();

// -------------------------------------------------------------------------
//            FOR DELETING SERVICE
// -------------------------------------------------------------------------
// svc.on('uninstall',function(){
//   console.log('Uninstall complete.');
//   console.log('The service exists: ',svc.exists);
// });

// svc.uninstall();