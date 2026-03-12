// services/api.js
export async function fetchTransactions() {
  return [
    { id: "TX-1001", amount: "R1,500", time: "15:13 PM" },
    { id: "TX-1002", amount: "R900", time: "16:25 PM" },
    { id: "TX-1003", amount: "R300", time: "17:40 PM" },
  ];
}
