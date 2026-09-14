import { MOCK_STAKING_PRODUCTS, MOCK_MY_STAKING } from "./data/earn-data";

const delay = (ms = 600) => new Promise((res) => setTimeout(res, ms));

// mutable state
let myStaking = [...MOCK_MY_STAKING];
let nextPosId = 100;

export const mockEarn = {
  fetchProducts: async () => {
    await delay();
    return {
      data: MOCK_STAKING_PRODUCTS,
      statusCode: 200,
      success: true,
      message: "OK",
    };
  },

  subscribe: async (data: { productId: string; amount: string }) => {
    await delay(800);
    const product = MOCK_STAKING_PRODUCTS.find((p) => p.id === data.productId);
    if (!product) {
      throw {
        response: {
          data: { error: "Product not found" },
          status: 404,
        },
      };
    }
    const id = `stake_pos_${++nextPosId}`;
    const position = {
      id,
      productId: data.productId,
      asset: product.asset,
      image: product.image,
      amount: data.amount,
      earned: "0.00",
      apy: product.apy,
      startDate: new Date().toISOString(),
      endDate: new Date(
        Date.now() + product.lockDays * 86400000
      ).toISOString(),
      lockDays: product.lockDays,
      type: product.type as "fixed",
      status: "active" as const,
    };
    myStaking.push(position);
    return {
      data: position,
      statusCode: 200,
      success: true,
      message: "Staking subscription created",
    };
  },

  unstake: async (data: { subscriptionId: string }) => {
    await delay(800);
    myStaking = myStaking.filter((p) => p.id !== data.subscriptionId);
    return {
      data: { subscriptionId: data.subscriptionId, unstaked: true },
      statusCode: 200,
      success: true,
      message: "Unstaked successfully",
    };
  },

  myPositions: async () => {
    await delay();
    return {
      data: myStaking,
      statusCode: 200,
      success: true,
      message: "OK",
    };
  },
};
