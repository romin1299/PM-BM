cd D:\LiveProjects\DENSO\denso_pm_bm_V1\server

1. Delete existing masters and spare request sheets, reset the spare sheet-number counters
   mongosh "mongodb://127.0.0.1:27017/DENSO-PM-BM" --eval "db.sparemasters.deleteMany({}); db.requestsheetofspares.deleteMany({}); db.lines.updateMany({}, { $set: { requestSheetNoSpare: 0 } })"

2. Import masters — dry run first, then commit
   node scripts/importSpareMaster.js "Old Master data/dbo_VM_PartsMaster-All Data31-08-2026.xlsx" --tm-no=89898
   node scripts/importSpareMaster.js "Old Master data/dbo_VM_PartsMaster-All Data31-08-2026.xlsx" --commit --tm-no=89898

3. Generate reorder request sheets — dry run, then commit
   node scripts/generateReorderSheets.js --tm-no=89898
   node scripts/generateReorderSheets.js --commit --tm-no=89898
