import { Spin } from "antd";
import Swal from "sweetalert2";

export const openLoading = () => {
  Swal.fire({
    allowOutsideClick: false, // ป้องกันไม่ให้คลิกนอกหน้าต่าง
    allowEscapeKey: false, // ป้องกันไม่ให้กด escape
    didOpen: () => {
      Swal.showLoading(); // แสดง loading spinner
    },
    width: "100%",
    heightAuto: false, // ป้องกันไม่ให้ความสูงถูกปรับอัตโนมัติ
    padding: "5em", // เพิ่ม padding เพื่อให้โหลดแบบกลางหน้าจอ
    showCloseButton: false, // ซ่อนปุ่มปิด
    showConfirmButton: false, // ซ่อนปุ่มยืนยัน
    customClass: {
      popup: "full-screen-popup", // class สำหรับปรับแต่งสไตล์
    },
    background: 'none',
    backdrop: `rgba(250, 250, 250, 0.65)`,
    html: '<div className="centered-container"><Spin size="large" /></div>', // ใช้ Spin จาก antd แสดง loading spinner
  });
};

export const closeLoading = () => {
  Swal.close();
};
