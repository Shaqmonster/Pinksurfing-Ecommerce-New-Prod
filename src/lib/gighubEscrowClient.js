import { ethers } from "ethers";
import { routerAbi } from "../abis/routerAbi";
import { servicesAbi } from "../abis/servicesAbi";

const routerAddress = import.meta.env.VITE_ROUTER_ADDRESS;
const rpcUrl = import.meta.env.VITE_ESCROW_RPC_URL || import.meta.env.VITE_RPC_URL;
const chainId = Number(import.meta.env.VITE_ESCROW_CHAIN_ID || 0) || undefined;

export function getGigHubProvider() {
  if (!rpcUrl) {
    throw new Error("Missing RPC URL. Set VITE_ESCROW_RPC_URL (or VITE_RPC_URL).");
  }
  const p = new ethers.JsonRpcProvider(rpcUrl, chainId);
  return p;
}

export async function getGigHubContracts({ signer }) {
  if (!routerAddress || routerAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error("Missing router address. Set VITE_ROUTER_ADDRESS.");
  }
  const provider = signer?.provider || getGigHubProvider();
  const routerCode = await provider.getCode(routerAddress);
  if (!routerCode || routerCode === "0x") {
    throw new Error("Router contract is not deployed at VITE_ROUTER_ADDRESS. Redeploy contracts or update env.");
  }
  const router = new ethers.Contract(routerAddress, routerAbi, signer);
  const servicesEscrowAddr = await router.servicesEscrow();
  const servicesCode = await provider.getCode(servicesEscrowAddr);
  if (!servicesCode || servicesCode === "0x") {
    throw new Error("ServicesEscrow contract missing at router.servicesEscrow(). Check deployment + env.");
  }
  const services = new ethers.Contract(servicesEscrowAddr, servicesAbi, signer);
  return { router, services, servicesEscrowAddr, routerAddress };
}

