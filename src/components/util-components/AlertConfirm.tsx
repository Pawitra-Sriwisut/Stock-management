import Swal from "sweetalert2";

export const AlertConfirm = async (text: string): Promise<any> => {
  return await Swal.fire({
    title: "ยืนยัน?",
    text: text,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "ยืนยัน",
    cancelButtonText: "ยกเลิก",
  });
};

export const AlertSuccess = async (text: string): Promise<any> => {
  return await Swal.fire({
    title: text,
    icon: "success",
    showCancelButton: false,
    confirmButtonText: "ยืนยัน",
  });
};

export const AlertError = async (text: string): Promise<any> => {
  return await Swal.fire({
    title: text,
    icon: "error",
    showCancelButton: false,
    confirmButtonText: "ยืนยัน",
  });
};
