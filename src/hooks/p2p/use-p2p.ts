import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { p2p, p2pKey } from "../../services/p2p";
import type { EditP2POrderInput } from "../../lib/p2p-ws";
import { AddP2PReviewPayload, CreateOrder, CreatePaymentMethod, P2PChatMessage, P2PMatchOrder, P2PReleaseOrder } from "../../types/p2p";
import toast from "react-hot-toast";
import { useP2PAdsFeed } from "./use-p2p-realtime";

function getErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;
  const message = data?.message ?? data?.error ?? error?.message;
  if (Array.isArray(message)) return message[0] || fallback;
  if (typeof message === "string" && message.trim()) return message;
  return fallback;
}

export const useOrderListings = (params: any) => {
  useP2PAdsFeed();
  return useQuery({
    queryKey: p2pKey.fetchOrderListing(params),
    queryFn: () => p2p.fetchOrderListing(params),
  });
};

export const useUserAds = (params: any) => {
  return useQuery({
    queryKey: p2pKey.userOrders(params),
    queryFn: () => p2p.userOrders(params),
  });
};

export const useAdvertiserInfo = () => {
  return useQuery({
    queryKey: p2pKey.advertiserInfo,
    queryFn: p2p.advertiserInfo,
    retry: false, // Do not retry if the user is not an advertiser (will return 400 or 404 typically)
  });
};

export const useBecomeAdvertiser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: p2p.becomeAdvertiser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: p2pKey.advertiserInfo });
      toast.success("Successfully registered as an advertiser");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to register as advertiser");
    },
  });
};

export const useCreateAd = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrder) => {
      const cached: any = queryClient.getQueryData(p2pKey.paymentMethods());
      const methods: any[] = cached?.data?.data ?? [];
      if (methods.length === 0) return p2p.createOrder(data);
      const names = data.paymentMethod.map((id) => {
        const method = methods.find((entry: any) => entry.id === id);
        return method?.data?.bankName || method?.method || id;
      });
      return p2p.createOrder(data, names);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: p2pKey.userOrdersRoot });
      toast.success("Ad created successfully");
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to create ad"));
    },
  });
};

export const useMatchOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: P2PMatchOrder) => p2p.matchOrder(data),
    onSuccess: (res: any) => {
      const payload = res?.data;
      const matchId =
        payload?.orderMatchId ??
        payload?.data?.id ??
        payload?.id ??
        payload?.data?.data?.id ??
        payload?._id ??
        payload?.data?._id;
      const match =
        payload?.orderMatch ??
        payload?.order_match ??
        (payload?.data?.asset ? payload.data : undefined) ??
        (payload?.data?.data?.asset ? payload.data.data : undefined);
      if (matchId && match) {
        queryClient.setQueryData(p2pKey.matchedOrder(matchId), {
          data: {
            statusCode: 200,
            success: true,
            message: "",
            data: match,
          },
        });
      }
      queryClient.invalidateQueries({ queryKey: p2pKey.allMatchedOrdersRoot });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to create order"));
    },
  });
};

export const useGetMatchedOrder = (
  id: string,
  options?: { refetchInterval?: number | false }
) => {
  return useQuery({
    queryKey: p2pKey.matchedOrder(id),
    queryFn: () => p2p.getMatchedOrder(id),
    enabled: !!id,
    refetchInterval: options?.refetchInterval ?? false,
  });
};

export const useUpdateMatchedOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { orderMatchId: string; status: string; [key: string]: unknown }) => {
      const response: any = await p2p.updateMatchedOrder(data);
      const body = response?.data;

      // Backend may return success:false inside a 200 response.
      // Make it a real mutation failure so per-call onSuccess callbacks do not run.
      if (body && body.success === false) {
        const failure = new Error(body.error || body.message || "Failed to update order");
        (failure as any).response = { status: body.statusCode, data: body };
        throw failure;
      }

      return response;
    },
    onSuccess: (_response: any, variables) => {
      queryClient.invalidateQueries({ queryKey: p2pKey.matchedOrder(variables.orderMatchId) });
      queryClient.invalidateQueries({ queryKey: p2pKey.allMatchedOrdersRoot });
      toast.success(getP2PUpdateSuccessMessage(variables.status));
    },
    onError: (error: any, variables) => {
      const data = error?.response?.data;
      const backendError = data?.error || data?.message || error?.message || "";
      toast.error(mapP2PError(backendError, error?.response?.status ?? data?.statusCode, variables?.status));
    },
  });
};

function mapP2PError(err: string, httpStatus?: number, requestedStatus?: string): string {
  const requested = requestedStatus?.toUpperCase();
  if (httpStatus === 404) return "Order match not found. Refresh your P2P orders and open the latest trade before trying again.";
  if (!err) return requested === "CANCELLED" ? "Failed to cancel order" : "Failed to update order";
  const e = err.toLowerCase();
  if (e.includes("expiry") || e.includes("expired") || e.includes("dispute before")) return "Payment window has expired. You can no longer confirm payment for this order.";
  if (e.includes("self") || e.includes("selfmatch")) return "You cannot confirm payment on your own ad.";
  if (e.includes("already fulfilled") || e.includes("already completed")) return "This order has already been completed.";
  if (e.includes("cancelled")) return "This order has been cancelled.";
  if (e.includes("unauthorized")) return "You are not authorized to update this order.";
  if (e.includes("not found")) return "Order not found.";
  if (e.includes("invalid status")) return "Invalid order status sent to server.";
  if (requested === "FULFILLED" && (e.includes("internal error") || httpStatus === 400)) {
    return "Payment confirmation was rejected by the backend. Refresh the order; if it still fails, this trade is hitting the backend P2P fulfilment rule.";
  }
  if (requested === "CANCELLED" && (e.includes("internal error") || httpStatus === 400)) {
    return "This order cannot be cancelled in its current state. Refresh the order and check whether payment was already confirmed.";
  }
  return err || "Failed to update order status. Please try again.";
}

function getP2PUpdateSuccessMessage(status: string): string {
  const normalizedStatus = status.toUpperCase();
  if (normalizedStatus === "CANCELLED") return "Order cancelled successfully";
  if (normalizedStatus === "DISPUTED") return "Order disputed successfully";
  if (normalizedStatus === "FULFILLED") return "Payment confirmed successfully";
  return "Order updated successfully";
}


export const useRequestReleaseCode = () => {
  return useMutation({
    mutationFn: (id: string) => p2p.getReleaseCode(id),
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to send verification code"));
    },
  });
};

export const useReleaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: P2PReleaseOrder) => p2p.releaseOrder(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: p2pKey.matchedOrder(variables.id) });
      queryClient.invalidateQueries({ queryKey: p2pKey.allMatchedOrdersRoot });
      toast.success("Crypto released successfully");
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to release crypto"));
    },
  });
};

export const useAddReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddP2PReviewPayload) => p2p.addReview(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: p2pKey.matchedOrder(variables.orderMatchId) });
      queryClient.invalidateQueries({ queryKey: p2pKey.allMatchedOrdersRoot });
      toast.success("Feedback submitted");
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to submit feedback"));
    },
  });
};

export const usePaymentMethods = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: p2pKey.paymentMethods(),
    queryFn: p2p.fetchPaymentMethod,
    enabled: options?.enabled ?? true,
  });
};

export const useAddPaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePaymentMethod) => p2p.addPaymentMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: p2pKey.paymentMethods() });
      toast.success("Payment method added successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to add payment method");
    },
  });
};

export const useDeactivateSingleOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => p2p.deactivateSingleOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: p2pKey.userOrdersRoot });
      toast.success("Ad status updated");
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to update ad status"));
    },
  });
};

export const useReactivateSingleOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => p2p.reactivateSingleOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: p2pKey.userOrdersRoot });
      toast.success("Ad status updated");
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to update ad status"));
    },
  });
};

export const useBulkToggleAds = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: "deactivate" | "reactivate") =>
      p2p.toggleAllOrders(action),
    onSuccess: (_response, action) => {
      queryClient.invalidateQueries({ queryKey: p2pKey.userOrdersRoot });
      toast.success(
        action === "deactivate"
          ? "All ads paused successfully"
          : "All ads resumed successfully"
      );
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to update ads"));
    },
  });
};

export const useEditAd = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditP2POrderInput }) =>
      p2p.editOrder(id, data),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: p2pKey.userOrdersRoot });
      queryClient.invalidateQueries({ queryKey: p2pKey.orderById(variables.id) });
      toast.success("Ad updated successfully");
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Failed to update ad"));
    },
  });
};

export const useAllMatchedOrders = (params?: any) => {
  return useQuery({
    queryKey: p2pKey.allMatchedOrders(params),
    queryFn: () => p2p.getAllMatchedOrders(params),
  });
};

export const useFetchChats = (
  chatId: string,
  options?: { refetchInterval?: number | false }
) => {
  return useQuery({
    queryKey: p2pKey.chatMessages(chatId),
    queryFn: () => p2p.fetchChatMessages(chatId),
    enabled: !!chatId,
    refetchInterval: options?.refetchInterval,
  });
};

export const useSendChatMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { chatId: string; content: string }) => p2p.sendMessage(data),
    onSuccess: (message: any, variables) => {
      if (!message?.content) return;
      queryClient.setQueryData<{ data: P2PChatMessage[] }>(
        p2pKey.chatMessages(variables.chatId),
        (current) => {
          const list = current?.data ?? [];
          const id = String(
            message.id ??
              `${variables.chatId}:${message.senderId ?? ""}:${message.createdAt ?? ""}:${message.content}`
          );
          if (list.some((entry) => entry.id === id)) return current;
          return {
            data: [
              ...list,
              {
                id,
                content: String(message.content),
                senderId: String(message.senderId ?? ""),
                senderName:
                  typeof message.senderName === "string" && message.senderName.trim()
                    ? message.senderName.trim()
                    : undefined,
                createdAt: String(
                  message.createdAt ?? new Date().toISOString()
                ),
              },
            ],
          };
        }
      );
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to send message");
    },
  });
};

export const useGetDisputedOrders = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: p2pKey.disputedOrders,
    queryFn: () => p2p.getDisputedOrders(params),
  });
};
