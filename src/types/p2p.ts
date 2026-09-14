export interface CreateOrder {
  type: "Buy" | "Sell";
  asset: string;
  assetLogo?: string;
  fiat: string;
  fixedPrice: string;
  paymentDuration: string;
  minQuantity: string;
  numberLinked: boolean;
  emailLinked: boolean;
  daysSinceAccountCreation: string;
  completedOrders: string;
  allCompletedOrders: string;
  selectedCountry: string;
  maxQuantity: string;
  remark: string;
  paymentMethod: string[];
  floatingPrice: boolean;
  quantity: string;
}

export interface CreateOrderResponse {
  statusCode: number;
  error: string;
  message: string;
  success: boolean;
  data: CreateOrderResponseDatum[];
}

export interface CreateOrderResponseDatum {
  id: string;
  type: string;
  asset: string;
  minQuantity: number;
  maxQuantity: number;
  paymentMethod: string;
  fulfilled: boolean;
  fulfilledAt: Date;
  creator: string;
  floatingPrice: boolean;
  fixedPrice: number;
  created: Date;
  active: boolean;
  matchList: null;
}

export interface CreatePaymentMethod {
  accountNumber: string;
  bankName: string;
  accountName: string;
  method: string;
}
export interface CreatePaymentMethodResponse {
  accountNumber: string;
  bankName: string;
  accountName: string;
}

export interface PaymentMethodsResponse {
  statusCode: number;
  message: string;
  error: string;
  success: boolean;
  data: {
    id: string;
    method: string;
    userId: string;
    data: {
      accountName: string;
      accountNumber: string;
      bankName: string;
    };
    createdAt: string;
  }[];
  totalPages: string;
  currentPage: string;
  totalRecords: string;
}

export interface UserAds {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    id: string;
    type: string;
    asset: string;
    fiat: string;
    price: number;
    floatingPrice: boolean;
    paymentDuration: string;
    minQuantity: number;
    maxQuantity: number;
    numberLinked: boolean;
    availableQuantity: string;
    quantity: number;
    completedOrders: number;
    allCompletedOrders: number;
    emailLinked: boolean;
    daysSinceAccountCreation: number;
    selectedCountry: string;
    remark: string;
    paymentMethod: {
      id: string;
      method: string;
      userId: string;
      data: {
        accountName: string;
        accountNumber: string;
        bankName: string;
      };
      createdAt: string;
    }[];
    advertiser: {
      id: string;
      firstName: string;
      lastName: string;
      photo: string;
      active: boolean;
      verified: boolean;
      totalOrdersCompleted: string;
      completionPercentage: string;
      rating: string;
    };
    createdAt: string;
    active: boolean;
    orderMatchCount: number;
    fulfilled: false;
    fulfilledAt: string;
  }[];
  totalPages: string;
  currentPage: string;
  totalRecords: string;
  error: string;
}

export interface P2POrderListings {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    id: string;
    type: string;
    asset: string;
    fiat: string;
    price: number;
    floatingPrice: boolean;
    paymentDuration: string;
    minQuantity: number;
    maxQuantity: number;
    numberLinked: boolean;
    availableQuantity: string;
    quantity: number;
    completedOrders: number;
    allCompletedOrders: number;
    emailLinked: boolean;
    daysSinceAccountCreation: number;
    selectedCountry: string;
    remark: string;
    paymentMethod: {
      id: string;
      method: string;
      userId: string;
      data: {
        accountName: string;
        accountNumber: string;
        bankName: string;
      };
      createdAt: string;
    }[];
    advertiser: {
      id: string;
      firstName: string;
      lastName: string;
      photo: string;
      active: boolean;
      verified: boolean;
      totalOrdersCompleted: string;
      completionPercentage: string;
      rating: string;
    };
    createdAt: string;
    active: boolean;
    orderMatchCount: number;
    fulfilled: false;
    fulfilledAt: string;
  }[];
  totalPages: string;
  currentPage: string;
  totalRecords: string;
  error: string;
}

export interface AllOrder {
  statusCode: number;
  error: string;
  message: string;
  success: boolean;
  data: AllOrderDatum[];
}

export interface AllOrderDatum {
  id: string;
  type: string;
  asset: string;
  fiat: string;
  fixedPrice: string;
  paymentDuration: string;
  minQuantity: string;
  maxQuantity: string;
  numberLinked: boolean;
  fulfilled: boolean;
  fulfilledAt: Date;
  emailLinked: boolean;
  daysSinceAccountCreation: string;
  selectedCountry: string;
  remark: string;
  paymentMethod: string;
  floatingPrice: boolean;
  creator: AllOrderCreator;
  createdAt: Date;
  active: boolean;
  matchList: null;
}

export interface AllOrderCreator {
  id: string;
  fullName: string;
  photo: string;
  active: boolean;
  verified: boolean;
  totalOrdersCompleted: number;
  completionPercentage: number;
  rating: number;
}

export interface AdvertiserInfo {
  statusCode: number;
  error: string;
  message: string;
  success: boolean;
  data: {
    id: string;
    firstName: string;
    lastName: string;
    photo: string;
    active: boolean;
    verified: boolean;
    totalOrdersCompleted: string;
    completionPercentage: string;
    rating: string;
  };
}

export interface P2PMatchOrder {
  orderId: string;
  paymentMethodId: string;
  quantity: number;
}

export interface P2PReleaseOrder {
  id: string;
  releaseCode: string;
  totpCode?: string;
}

export interface P2PChatMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

export interface P2PChatMessagesResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: P2PChatMessage[] | null;
  totalPages: string;
  currentPage: string;
  totalRecords: string;
  error: string;
}

export interface AddP2PReviewPayload {
  orderMatchId: string;
  rating: number;
  review?: string;
}
