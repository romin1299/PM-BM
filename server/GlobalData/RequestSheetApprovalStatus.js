exports.APPROVAL_LIST_OF_MINOR_MAJOR_OF_BM = [
  {
    key: "MTD_TL",
    value: "MTD TL",
    priority: 1,
  },
  {
    key: "MTD_HOSS",
    value: "MTD HOSS",
    priority: 2,
  },
  {
    key: "PRD_TL",
    value: "PRD TL",
    priority: 3,
  },
  {
    key: "MTD_HOS",
    value: "MTD HOS",
    priority: 4,
  },
  {
    key: "PRD_HOS",
    value: "PRD HOS",
    priority: 5,
  },
  {
    key: "MTD_HOD",
    value: "MTD HOD",
    priority: 6,
  },
  {
    key: "PRD_HOD",
    value: "PRD HOD",
    priority: 7,
  },
];


exports.NAME_OF_THE_COMPANY = 'DNHA';

exports.LIST_OF_COMPANY = ['DNHA', 'DNIN'];

exports.CM_PLANNED_STATUS =[
  'Planned',
  'In progress',
  'Completed',
  'Done with delay'
]

exports.currentYear =
  new Date().getMonth() < 3
    ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
    : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;