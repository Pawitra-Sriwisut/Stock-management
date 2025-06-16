import { Button, InputNumber, Space } from "antd";
import React, { useState } from "react";

interface CurrencyFormatProps {
  value: number; // ค่าตัวเลขที่ต้องการฟอร์แมต
  prefix?: string; // ตัวเลือกสัญลักษณ์ที่จะแสดง (เช่น ฿)
  thousandSeparator?: boolean; // ตัวเลือกในการใส่คอมม่าแยกหลักพัน
  displayType?: "text" | "input"; // กำหนดว่าแสดงผลเป็น text หรือ input
  className?: string;
}

const CurrencyFormat: React.FC<CurrencyFormatProps> = ({
  value,
  prefix = "฿",
  displayType = "text",
  className = "",
}) => {
  const [valueInput, setValueInput] = useState<any>(value);

  const handleIncrease = () => {
    if (valueInput < 999) setValueInput(valueInput + 1); // Increase value by 1
    else setValueInput(999); // Increase value by 1
  };

  const handleDecrease = () => {
    if (valueInput > 1) setValueInput(valueInput - 1); // Decrease value by 1
    else setValueInput(1); // Decrease value by 1
  };

  // ฟังก์ชันที่ใช้ฟอร์แมตตัวเลข
  const formatCurrency = (amount: number): string => {
    const formattedAmount =
      prefix === "฿"
        ? new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB", // สามารถปรับเป็นสกุลเงินอื่นได้
            minimumFractionDigits: 0, // ไม่ต้องแสดงทศนิยม
          }).format(amount)
        : new Intl.NumberFormat("th-TH", {
            style: "decimal", // ใช้รูปแบบ decimal (ไม่ใช่สกุลเงิน)
            minimumFractionDigits: 0, // ไม่แสดงทศนิยม
            maximumFractionDigits: 0, // สามารถกำหนดทศนิยมได้สูงสุด 2 หลัก
          }).format(amount);

    return formattedAmount;
  };

  const formattedValue = formatCurrency(value);

  return displayType === "input" ? (
    // ถ้า displayType เป็น 'input', เราจะให้ผู้ใช้กรอกตัวเลขได้
    <Space>
      <Button onClick={handleDecrease} style={{ width: 50 }}>
        -
      </Button>
      <InputNumber
        value={valueInput}
        onChange={setValueInput}
        min={1}
        max={999}
        style={{ width: 50 }}
      />
      <Button onClick={handleIncrease} style={{ width: 50 }}>
        +
      </Button>
    </Space>
  ) : (
    // ถ้า displayType เป็น 'text', จะแสดงเป็นข้อความ
    <span className={className}>{formattedValue}</span>
  );
};

export default CurrencyFormat;
