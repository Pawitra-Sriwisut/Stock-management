import { create } from "zustand";

// กำหนดประเภทของ state ที่จะใช้
interface StoreState {
  priceInCart: any;
  setPriceInCart: (newPrice: any) => void;
}

// สร้าง store ด้วย Zustand พร้อมกับประเภทของ state
const usePriceStore = create<StoreState>((set) => ({
  priceInCart: 0, // ข้อมูลเริ่มต้น
  setPriceInCart: (newPrice) => set({ priceInCart: newPrice }), // ฟังก์ชันในการเปลี่ยนแปลงข้อมูล
}));

export default usePriceStore;
