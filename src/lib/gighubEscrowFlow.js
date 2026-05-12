import { ethers } from "ethers";
import { getGigHubContracts, getGigHubProvider } from "./gighubEscrowClient";
import { servicesInitialWei } from "./servicesEscrowMath";

const MAP_KEY = "ps_gighub_order_escrow_map_v1";

function readMap() {
  try {
    const raw = localStorage.getItem(MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeMap(map) {
  localStorage.setItem(MAP_KEY, JSON.stringify(map));
}

export function getEscrowIdForOrder(orderId) {
  const map = readMap();
  return map[String(orderId)]?.escrowId || null;
}

export function setEscrowIdForOrder(orderId, escrowId) {
  const map = readMap();
  const current = map[String(orderId)] || {};
  map[String(orderId)] = {
    ...current,
    orderId,
    escrowId,
    updatedAt: new Date().toISOString(),
  };
  writeMap(map);
}

function saveOrderEscrow(orderId, payload) {
  const map = readMap();
  map[String(orderId)] = payload;
  writeMap(map);
}

function deriveMilestoneDeadlines(deliveryDays = 1) {
  return deriveMilestoneDeadlinesWithCount(deliveryDays, 2);
}

function deriveMilestoneDeadlinesWithCount(deliveryDays = 1, milestoneCount = 2) {
  const now = Math.floor(Date.now() / 1000);
  const d = Number(deliveryDays || 1);
  const n = Number(milestoneCount || 2);
  if (![2, 4, 6].includes(n)) {
    throw new Error("Milestones must be 2, 4, or 6.");
  }
  const totalSeconds = Math.max(2, Math.floor(d * 86400));
  const arr = [];
  for (let i = 1; i <= n; i++) {
    const step = Math.max(1, Math.floor((totalSeconds * i) / n));
    arr.push(BigInt(now + step));
  }
  return arr;
}

export async function createServicesEscrowForGigOrder({
  order,
  gig,
  wallet,
  sellerAddress,
  milestoneCount = 2,
  escrowEth,
}) {
  if (!wallet) throw new Error("Wallet not connected.");
  if (!ethers.isAddress(sellerAddress)) {
    throw new Error("Seller wallet address is missing/invalid.");
  }

  const provider = getGigHubProvider();
  const signer = wallet.connect(provider);
  const { router, servicesEscrowAddr, routerAddress } = await getGigHubContracts({ signer });

  // Backend order totals are fiat (USD-like), not ETH.
  // For local chain demos, use configurable ETH amount per order.
  const configuredEth = escrowEth ?? import.meta.env.VITE_GIGHUB_DEMO_ORDER_ETH ?? 1;
  const demoEth = Number(configuredEth);
  if (!Number.isFinite(demoEth) || demoEth <= 0) {
    throw new Error("Invalid escrow ETH amount.");
  }
  const totalWei = ethers.parseEther(String(demoEth));
  const deadlines = deriveMilestoneDeadlinesWithCount(order?.package?.delivery_days, milestoneCount);

  const initialWei = servicesInitialWei(totalWei);
  const buyerBal = await provider.getBalance(wallet.address);
  if (buyerBal < initialWei) {
    throw new Error(
      `Insufficient funds for escrow init. Need ${ethers.formatEther(initialWei)} ETH, wallet has ${ethers.formatEther(
        buyerBal
      )} ETH.`
    );
  }
  const tx = await router.createEscrow(3, sellerAddress, totalWei, deadlines, { value: initialWei });
  const receipt = await tx.wait();

  const parsed = receipt?.logs
    ?.map((l) => {
      try {
        return router.interface.parseLog(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .find((p) => p.name === "RoutedEscrowCreated");

  const escrowId = parsed?.args?.escrowId;
  if (!escrowId) throw new Error("Escrow created but escrowId not found in logs.");

  saveOrderEscrow(order.id, {
    escrowId,
    txHash: tx.hash,
    orderId: order.id,
    gigId: gig?.id,
    routerAddress,
    servicesEscrowAddr,
    sellerAddress,
    totalWei: totalWei.toString(),
    createdAt: new Date().toISOString(),
  });

  return { escrowId, txHash: tx.hash, servicesEscrowAddr, routerAddress };
}

