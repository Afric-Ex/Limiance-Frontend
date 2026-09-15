import { useP2PStore, type Ad, type AdFilters, type P2POrder, type ChatMessage, type AdvertiserStatus } from "./p2p-store";

describe("p2p-store", () => {
  const defaultAdFilters: AdFilters = {
    type: "BUY",
    asset: "USDT",
    fiat: "USD",
    amount: "",
    paymentMethod: "All",
  };

  const makeAd = (overrides: Partial<Ad> = {}): Ad => ({
    id: "ad-1",
    type: "BUY",
    asset: "USDT",
    fiat: "USD",
    price: 1.0,
    availableQuantity: 100,
    minQuantity: 10,
    maxQuantity: 50,
    paymentMethods: ["bank"],
    advertiser: {
      id: "adv-1",
      name: "Merchant",
      verified: true,
      trades: 42,
      completionRate: 98,
      responseTime: "5m",
    },
    ...overrides,
  });

  const makeOrder = (overrides: Partial<P2POrder> = {}): P2POrder => ({
    id: "order-1",
    type: "BUY",
    asset: "USDT",
    fiat: "USD",
    price: 1.0,
    cryptoAmount: 10,
    fiatAmount: 10,
    status: "PENDING_PAYMENT",
    paymentWindowMinutes: 15,
    createdAt: "2026-01-01T00:00:00.000Z",
    counterparty: { id: "adv-1", name: "Merchant" },
    paymentMethod: { method: "bank", accountName: "A", accountNumber: "1", bankName: "Bank" },
    ...overrides,
  });

  const makeMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
    id: "msg-1",
    senderId: "adv-1",
    content: "hello",
    type: "text",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  });

  const makeAdvertiserStatus = (overrides: Partial<AdvertiserStatus> = {}): AdvertiserStatus => ({
    isAdvertiser: true,
    requirements: { kycLevel2: true, accountAgeDays: 30, fundingAccountActive: true },
    ...overrides,
  });

  const resetState = () => {
    useP2PStore.setState({
      ads: [],
      adsLoading: false,
      adFilters: defaultAdFilters,
      activeOrder: null,
      orderLoading: false,
      messages: [],
      isConnected: false,
      isChatLoading: false,
      counterpartyTyping: false,
      isAdvertiser: false,
      advertiserStatus: null,
      myAds: [],
      myAdsLoading: false,
    });
  };

  beforeEach(() => {
    resetState();
  });

  it("has the initial marketplace state", () => {
    const state = useP2PStore.getState();
    expect(state.ads).toEqual([]);
    expect(state.adsLoading).toBe(false);
    expect(state.adFilters).toEqual(defaultAdFilters);
  });

  it("setAdFilters merges partial filter updates", () => {
    useP2PStore.getState().setAdFilters({ asset: "BTC" });
    expect(useP2PStore.getState().adFilters).toEqual({ ...defaultAdFilters, asset: "BTC" });
    useP2PStore.getState().setAdFilters({ type: "SELL", amount: "250" });
    expect(useP2PStore.getState().adFilters).toEqual({
      type: "SELL",
      asset: "BTC",
      fiat: "USD",
      amount: "250",
      paymentMethod: "All",
    });
  });

  it("setAdFilters accepts every field in one call", () => {
    useP2PStore.getState().setAdFilters({
      type: "SELL",
      asset: "ETH",
      fiat: "EUR",
      amount: "100",
      paymentMethod: "card",
    });
    expect(useP2PStore.getState().adFilters).toEqual({
      type: "SELL",
      asset: "ETH",
      fiat: "EUR",
      amount: "100",
      paymentMethod: "card",
    });
  });

  it("fetchAds flips adsLoading on and back off", async () => {
    const seen: boolean[] = [];
    const unsubscribe = useP2PStore.subscribe((state, prev) => {
      if (prev.adsLoading !== state.adsLoading) seen.push(state.adsLoading);
    });
    await useP2PStore.getState().fetchAds();
    unsubscribe();
    expect(seen).toEqual([true, false]);
    expect(useP2PStore.getState().adsLoading).toBe(false);
  });

  it("has the initial active order state", () => {
    expect(useP2PStore.getState().activeOrder).toBeNull();
    expect(useP2PStore.getState().orderLoading).toBe(false);
  });

  it("fetchOrder flips orderLoading on and back off", async () => {
    const seen: boolean[] = [];
    const unsubscribe = useP2PStore.subscribe((state, prev) => {
      if (prev.orderLoading !== state.orderLoading) seen.push(state.orderLoading);
    });
    await useP2PStore.getState().fetchOrder("order-1");
    unsubscribe();
    expect(seen).toEqual([true, false]);
    expect(useP2PStore.getState().orderLoading).toBe(false);
  });

  it("updateOrderStatus leaves a null active order as null", () => {
    useP2PStore.getState().updateOrderStatus("RELEASED");
    expect(useP2PStore.getState().activeOrder).toBeNull();
  });

  it("updateOrderStatus updates the active order status", () => {
    useP2PStore.setState({ activeOrder: makeOrder() });
    useP2PStore.getState().updateOrderStatus("COMPLETED");
    expect(useP2PStore.getState().activeOrder?.status).toBe("COMPLETED");
  });

  it("has the initial chat state", () => {
    const state = useP2PStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.isConnected).toBe(false);
    expect(state.isChatLoading).toBe(false);
    expect(state.counterpartyTyping).toBe(false);
  });

  it("addMessage appends messages in order", () => {
    useP2PStore.getState().addMessage(makeMessage({ id: "m1", content: "first" }));
    useP2PStore.getState().addMessage(makeMessage({ id: "m2", content: "second", type: "system" }));
    expect(useP2PStore.getState().messages.map((m) => m.id)).toEqual(["m1", "m2"]);
  });

  it("sendMessage resolves without throwing", async () => {
    await expect(useP2PStore.getState().sendMessage("hi")).resolves.toBeUndefined();
    expect(useP2PStore.getState().messages).toEqual([]);
  });

  it("sendImage resolves without throwing", async () => {
    const file = new File(["bytes"], "photo.png", { type: "image/png" });
    await expect(useP2PStore.getState().sendImage(file)).resolves.toBeUndefined();
    expect(useP2PStore.getState().messages).toEqual([]);
  });

  it("setIsConnected toggles connection state", () => {
    useP2PStore.getState().setIsConnected(true);
    expect(useP2PStore.getState().isConnected).toBe(true);
    useP2PStore.getState().setIsConnected(false);
    expect(useP2PStore.getState().isConnected).toBe(false);
  });

  it("has the initial advertiser state", () => {
    expect(useP2PStore.getState().isAdvertiser).toBe(false);
    expect(useP2PStore.getState().advertiserStatus).toBeNull();
  });

  it("fetchAdvertiserStatus resolves without mutating state", async () => {
    useP2PStore.setState({ advertiserStatus: makeAdvertiserStatus() });
    await expect(useP2PStore.getState().fetchAdvertiserStatus()).resolves.toBeUndefined();
    expect(useP2PStore.getState().advertiserStatus).toEqual(makeAdvertiserStatus());
    expect(useP2PStore.getState().isAdvertiser).toBe(false);
  });

  it("has the initial my-ads state", () => {
    expect(useP2PStore.getState().myAds).toEqual([]);
    expect(useP2PStore.getState().myAdsLoading).toBe(false);
  });

  it("fetchMyAds flips myAdsLoading on and back off", async () => {
    useP2PStore.setState({ myAds: [makeAd()] });
    const seen: boolean[] = [];
    const unsubscribe = useP2PStore.subscribe((state, prev) => {
      if (prev.myAdsLoading !== state.myAdsLoading) seen.push(state.myAdsLoading);
    });
    await useP2PStore.getState().fetchMyAds();
    unsubscribe();
    expect(seen).toEqual([true, false]);
    expect(useP2PStore.getState().myAdsLoading).toBe(false);
    expect(useP2PStore.getState().myAds).toEqual([makeAd()]);
  });
});