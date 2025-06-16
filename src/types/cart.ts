export interface DetailPayment {
  totalPriceNonPromotion: number;
  totalPricePromotion: DetailPromotion[];
  totalPrice: number;
}

export interface DetailPromotion {
  promotionName: string;
  setsAvailable: number;
  totalPrice: number;
}
