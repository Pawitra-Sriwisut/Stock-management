import { create } from "zustand";

// กำหนดประเภทของ state ที่จะใช้
interface StoreState {
  productInCart: any;
  setProductInCart: (newProduct: any) => void;
}

// สร้าง store ด้วย Zustand พร้อมกับประเภทของ state
const useStore = create<StoreState>((set) => ({
  productInCart: [], // ข้อมูลเริ่มต้น
  setProductInCart: (newProduct) => set({ productInCart: newProduct }), // ฟังก์ชันในการเปลี่ยนแปลงข้อมูล
}));

export default useStore;
