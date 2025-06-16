import { Button, InputNumber, Space } from "antd";
import React, { useState } from "react";

interface CurrencyFormatProps {
  value: number; // ค่าตัวเลขที่ต้องการฟอร์แมต
  thousandSeparator?: boolean; // ตัวเลือกในการใส่คอมม่าแยกหลักพัน
  precision?: number;
  className?: string;
}

const NumberFormat: React.FC<CurrencyFormatProps> = ({
  value,
  precision = 0,
  className = "",
}) => {
  // ฟังก์ชันที่ใช้ฟอร์แมตตัวเลข
  const formatCurrency = (amount: number): string => {
    let number = parseFloat(amount?.toString());

    // ใช้ toLocaleString() เพื่อเพิ่มคอมมาในหลักพัน
    let formattedNumber = number.toLocaleString();

    return calNum(formattedNumber);
  };

  const calNum = (value: any) => {
    // แปลง value เป็นตัวเลข float
    let num = parseFloat(value.replace(/,/g, ""));

    // ปัดทศนิยมให้มี 2 ตำแหน่ง
    num = Math.round(num * 100) / 100;

    // ใช้ toLocaleString เพื่อเพิ่มเครื่องหมายคอมม่าในหลักพัน
    return num.toLocaleString("en-US", {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
  };

  const formattedValue = formatCurrency(value);

  return <span className={className}>{formattedValue}</span>;
};

export default NumberFormat;
