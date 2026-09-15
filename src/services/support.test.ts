vi.mock("../lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  apiRoot: { get: vi.fn(), post: vi.fn() },
}));

import { api } from "../lib/axios";
import { supportKeys, supportService } from "./support";

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);

const axiosResponse = (data: unknown, status = 200) => ({
  data,
  status,
  statusText: "OK",
  headers: {},
  config: {},
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("supportKeys", () => {
  it("declares the expected query keys", () => {
    expect(supportKeys.all).toEqual(["support"]);
    expect(supportKeys.tickets()).toEqual(["support", "tickets"]);
    expect(supportKeys.ticket("t1")).toEqual(["support", "ticket", "t1"]);
  });
});

describe("supportService.createTicket", () => {
  it("posts the ticket payload and resolves with the full response", async () => {
    const response = axiosResponse({ data: { ticket: { id: "t1" } } });
    mockPost.mockResolvedValueOnce(response);
    const payload = { subject: "Lost funds", category: "withdrawal", message: "Please help" };
    const result = await supportService.createTicket(payload);
    expect(mockPost).toHaveBeenCalledWith("trading/support/tickets", payload);
    expect(result).toEqual(response);
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("ticket create failed"));
    await expect(
      supportService.createTicket({ subject: "s", category: "c", message: "m" })
    ).rejects.toThrow("ticket create failed");
  });
});

describe("supportService.listTickets", () => {
  it("fetches the user tickets", async () => {
    const response = axiosResponse({ data: { tickets: [] } });
    mockGet.mockResolvedValueOnce(response);
    const result = await supportService.listTickets();
    expect(mockGet).toHaveBeenCalledWith("trading/support/tickets");
    expect(result).toEqual(response);
  });

  it("rejects when the request fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("list tickets failed"));
    await expect(supportService.listTickets()).rejects.toThrow("list tickets failed");
  });
});

describe("supportService.getTicket", () => {
  it("fetches the ticket by id", async () => {
    const response = axiosResponse({ data: { ticket: { id: "t42" } } });
    mockGet.mockResolvedValueOnce(response);
    const result = await supportService.getTicket("t42");
    expect(mockGet).toHaveBeenCalledWith("trading/support/tickets/t42");
    expect(result).toEqual(response);
  });

  it("rejects when the request fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("get ticket failed"));
    await expect(supportService.getTicket("t42")).rejects.toThrow("get ticket failed");
  });
});

describe("supportService.replyTicket", () => {
  it("posts the reply to the ticket thread", async () => {
    const response = axiosResponse({ data: { success: true } });
    mockPost.mockResolvedValueOnce(response);
    const result = await supportService.replyTicket("t9", { message: "Thanks" });
    expect(mockPost).toHaveBeenCalledWith("trading/support/tickets/t9/reply", {
      message: "Thanks",
    });
    expect(result).toEqual(response);
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("reply failed"));
    await expect(supportService.replyTicket("t9", { message: "hi" })).rejects.toThrow(
      "reply failed"
    );
  });
});