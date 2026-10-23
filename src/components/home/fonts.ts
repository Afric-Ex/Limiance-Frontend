import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

export const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
// Numerals: tabular, so live prices never shift the layout.
export const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });