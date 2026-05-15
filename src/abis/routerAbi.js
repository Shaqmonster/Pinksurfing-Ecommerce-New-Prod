export const routerAbi = [
  {
    type: "function",
    name: "createEscrow",
    stateMutability: "payable",
    inputs: [
      { name: "productType", type: "uint8" },
      { name: "seller", type: "address" },
      { name: "totalAmount", type: "uint256" },
      { name: "milestoneDeadlines", type: "uint256[]" },
    ],
    outputs: [{ name: "escrowId", type: "bytes32" }],
  },
  {
    type: "function",
    name: "servicesEscrow",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "event",
    name: "RoutedEscrowCreated",
    inputs: [
      { name: "escrowId", type: "bytes32", indexed: true },
      { name: "productType", type: "uint8", indexed: false },
      { name: "buyer", type: "address", indexed: true },
      { name: "seller", type: "address", indexed: true },
    ],
  },
];

