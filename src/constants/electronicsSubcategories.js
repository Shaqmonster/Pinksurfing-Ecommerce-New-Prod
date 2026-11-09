/** Display order + UI metadata for Electronics subcategories (matches filter.json). */
import {
  HiOutlineDesktopComputer,
  HiOutlineChip,
  HiOutlineLightningBolt,
} from "react-icons/hi";
import {
  IoHardwareChipOutline,
  IoHeadsetOutline,
  IoCubeOutline,
  IoPhonePortraitOutline,
} from "react-icons/io5";
import { MdOutlineLaptopMac, MdOutlineCable } from "react-icons/md";

export const ELECTRONICS_SUBCATEGORY_ORDER = [
  "computer-parts",
  "memory-semiconductors",
  "ssds-storage",
  "computers-laptops",
  "smartphones",
  "audio",
  "oem-bulk-electronics",
  "other-electronics",
];

export const ELECTRONICS_SUBCATEGORY_META = {
  "computer-parts": {
    Icon: HiOutlineDesktopComputer,
    description: "CPUs, GPUs, motherboards, PSUs & PC components",
    gradient: "from-blue-600 to-cyan-500",
  },
  "memory-semiconductors": {
    Icon: HiOutlineChip,
    description: "DDR5 RAM, semiconductors, ICs & memory modules",
    gradient: "from-purple-600 to-pink-600",
  },
  "ssds-storage": {
    Icon: HiOutlineLightningBolt,
    description: "NVMe SSDs, SATA drives, flash & enterprise storage",
    gradient: "from-violet-600 to-fuchsia-500",
  },
  "computers-laptops": {
    Icon: MdOutlineLaptopMac,
    description: "Laptops, desktops, workstations & mini PCs",
    gradient: "from-indigo-600 to-blue-500",
  },
  smartphones: {
    Icon: IoPhonePortraitOutline,
    description: "Phones, tablets, wearables & mobile accessories",
    gradient: "from-rose-600 to-orange-500",
  },
  audio: {
    Icon: IoHeadsetOutline,
    description: "Headphones, speakers, earbuds & home audio",
    gradient: "from-emerald-600 to-teal-500",
  },
  "oem-bulk-electronics": {
    Icon: IoCubeOutline,
    description: "OEM lots, bulk memory, SSDs & industrial electronics",
    gradient: "from-amber-600 to-yellow-500",
  },
  "other-electronics": {
    Icon: MdOutlineCable,
    description: "Accessories, components & other electronics",
    gradient: "from-slate-600 to-gray-500",
  },
};

export function sortElectronicsSubcategories(subcategories = []) {
  const orderIndex = Object.fromEntries(
    ELECTRONICS_SUBCATEGORY_ORDER.map((slug, index) => [slug, index])
  );
  return [...subcategories].sort((a, b) => {
    const aIdx = orderIndex[a.slug ?? a.id] ?? 999;
    const bIdx = orderIndex[b.slug ?? b.id] ?? 999;
    if (aIdx !== bIdx) return aIdx - bIdx;
    return (a.name || "").localeCompare(b.name || "");
  });
}

export function getElectronicsSubMeta(slug) {
  return (
    ELECTRONICS_SUBCATEGORY_META[slug] || {
      Icon: IoHardwareChipOutline,
      description: "Browse listings in this category",
      gradient: "from-purple-600 to-pink-600",
    }
  );
}
