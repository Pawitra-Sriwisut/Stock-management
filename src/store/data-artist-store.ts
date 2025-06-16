import { create } from "zustand";

// กำหนดประเภทของ state ที่จะใช้
interface StoreState {
  artistsData: any;
  setArtistsData: (newPrice: any) => void;
}

// สร้าง store ด้วย Zustand พร้อมกับประเภทของ state
const useDataArtistStore = create<StoreState>((set) => ({
  artistsData: {}, // ข้อมูลเริ่มต้น
  setArtistsData: (newData) => set({ artistsData: newData }), // ฟังก์ชันในการเปลี่ยนแปลงข้อมูล
}));

export default useDataArtistStore;
