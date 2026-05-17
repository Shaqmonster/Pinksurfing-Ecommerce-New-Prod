import { ethers } from "ethers";
import { routerAbi } from "../abis/routerAbi";
import { servicesAbi } from "../abis/servicesAbi";
import { getSharedGigHubProvider, withRpcRetry } from "./gighubRpc";

const routerAddress = import.meta.env.VITE_ROUTER_ADDRESS;

export function getGigHubProvider() {
  return getSharedGigHubProvider();
}

export async function getGigHubContracts({ signer }) {
  if (!routerAddress || routerAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error("Missing router address. Set VITE_ROUTER_ADDRESS.");
  }
  const provider = signer?.provider || getGigHubProvider();
  const routerCode = await withRpcRetry(() => provider.getCode(routerAddress));
  if (!routerCode || routerCode === "0x") {
    throw new Error("Router contract is not deployed at VITE_ROUTER_ADDRESS. Redeploy contracts or update env.");
  }
  const router = new ethers.Contract(routerAddress, routerAbi, signer);
  const servicesEscrowAddr = await router.servicesEscrow();
  const servicesCode = await withRpcRetry(() => provider.getCode(servicesEscrowAddr));
  if (!servicesCode || servicesCode === "0x") {
    throw new Error("ServicesEscrow contract missing at router.servicesEscrow(). Check deployment + env.");
  }
  const services = new ethers.Contract(servicesEscrowAddr, servicesAbi, signer);
  return { router, services, servicesEscrowAddr, routerAddress };
}

