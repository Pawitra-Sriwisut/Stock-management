"use client";
import { Card, Collapse, CollapseProps } from "antd";
import MasterArtist from "./master-artist";
import MasterPromotion from "./master-promotion";
import MasterProductType from "./master-product-type";
import MasterEvent from "./master-event";

export default function MasterSetting() {
  const items: CollapseProps["items"] = [
    {
      key: "1",
      label: "จัดการแก้ไขนักวาด",
      children: <MasterArtist />,
    },
    {
      key: "2",
      label: "จัดการแก้ไขประเภทของสินค้า",
      children: <MasterProductType />,
    },
    {
      key: "3",
      label: "จัดการแก้ไขโปรโมชั่น",
      children: <MasterPromotion />,
    },
    {
      key: "4",
      label: "จัดการแก้ไขอีเว้นท์",
      children: <MasterEvent />,
    },
  ];
  return (
    <div style={{ padding: "10px" }}>
      <Card className="mb-2 p-2" title="จัดการข้อมูล" size="small">
        <Collapse accordion items={items} />
      </Card>
    </div>
  );
}
