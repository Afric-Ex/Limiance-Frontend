import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { p2p, p2pKey } from "../../services/p2p";
import { AddP2PReviewPayload, CreateOrder, CreatePaymentMethod, P2PMatchOrder, P2PReleaseOrder } from "../../types/p2p";
import toast from "react-hot-toast";

export const useOrderListings = (params: any) => {
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
    mutationFn: (data: CreateOrder) => p2p.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: p2pKey.userOrders() });
      toast.success("Ad created successfully");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message;
      if (Array.isArray(message)) {
        toast.error(message[0] || "Validation failed");
      } else {
        toast.error(message || "Failed to create ad");
      }
    },
  });
};

export const useMatchOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: P2PMatchOrder) => p2p.matchOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: p2pKey.allMatchedOrders() });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create order");
    },
  });
};

export const useGetMatchedOrder = (id: string) => {
  return useQuery({
    queryKey: p2pKey.matchedOrder(id),
    queryFn: () => p2p.getMatchedOrder(id),
    enabled: !!id,
    refetchInterval: 5000, // Refetch every 5s to keep status fresh
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
    onSuccess: (response: any, variables) => {
      queryClient.invalidateQueries({ queryKey: p2pKey.matchedOrder(variables.orderMatchId) });
      toast.success(getP2PUpdateSuccessMessage(variables.status));
    },
    onError: (error: any, variables) => {
      const data = error?.response?.data;
      const backendError = data?.error || data?.message || "";
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


export const useGetReleaseCode = (id: string) => {
  return useQuery({
    queryKey: p2pKey.releaseCode(id),
    queryFn: () => p2p.getReleaseCode(id),
    enabled: false, // Only fetch on explicit refetch/call
  });
};

export const useReleaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: P2PReleaseOrder) => p2p.releaseOrder(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: p2pKey.matchedOrder(variables.id) });
      toast.success("Crypto released successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to release crypto");
    },
  });
};

export const useAddReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddP2PReviewPayload) => p2p.addReview(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: p2pKey.matchedOrder(variables.orderMatchId) });
      queryClient.invalidateQueries({ queryKey: p2pKey.allMatchedOrders() });
      toast.success("Feedback submitted");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to submit feedback");
    },
  });
};

export const usePaymentMethods = () => {
  return useQuery({
    queryKey: p2pKey.paymentMethods(),
    queryFn: p2p.fetchPaymentMethod,
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
      queryClient.invalidateQueries({ queryKey: p2pKey.userOrders() });
      toast.success("Ad status updated");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update ad status");
    },
  });
};

export const useReactivateSingleOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => p2p.reactivateSingleOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: p2pKey.userOrders() });
      toast.success("Ad status updated");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update ad status");
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: p2pKey.chatMessages(variables.chatId) });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to send message");
    },
  });
};

export const useGetDisputedOrders = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: p2pKey.disputedOrders,
    queryFn: () => p2p.getDisputedOrders(params),
  });
};
