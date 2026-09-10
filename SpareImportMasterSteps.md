Step 0 — reset counters
mongosh DENSO-PM-BM --eval 'db.plants.updateMany({}, {$set:{spareMasterUniqueIDSeq:0}}); db.lines.updateMany({}, {$set:{requestSheetNoSpare:0}})'

Step 1 — import masters
node scripts/importSpareMaster.js "Old Master data/dbo_VM_PartsMaster-All Data31-08-2026.xlsx" --commit --tm-no=89898

Step 2 — reorder sheets + skipped report
node scripts/generateReorderSheets.js --commit --tm-no=89898
Expected from the verified scratch run:

Step 1 created 17667 · failed 0 · DNHAP1-0000001 … DNHAP1-0017667
Step 2 candidates 1438 · eligible 508 · created 508 · skipped 930
skipped report written to: ...\Old Master data\reorder-skipped.xlsx
