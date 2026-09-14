import {
  MOCK_NETWORK_FEE,
  MOCK_MINIMUM_DEPOSIT,
  MOCK_MINIMUM_WITHDRAWAL,
} from "./data/wallet-data";

const delay = (ms = 600) => new Promise((res) => setTimeout(res, ms));

export const mockAsset = {
  networkFee: async (params: { chain: string; token: string }) => {
    await delay();
    const fee = MOCK_NETWORK_FEE[params.chain]?.[params.token] ?? "1.00";
    return { data: { fee }, statusCode: 200, success: true, message: "OK" };
  },

  minimumDeposit: async (params: { token: string }) => {
    await delay();
    const minimum = MOCK_MINIMUM_DEPOSIT[params.token] ?? "10.00";
    return { data: { minimum }, statusCode: 200, success: true, message: "OK" };
  },

  minimumWithdrawal: async (params: { token: string }) => {
    await delay();
    const minimum = MOCK_MINIMUM_WITHDRAWAL[params.token] ?? "5.00";
    return { data: { minimum }, statusCode: 200, success: true, message: "OK" };
  },
};
