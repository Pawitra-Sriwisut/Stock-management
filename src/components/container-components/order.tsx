"use client";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Table,
} from "antd";
import { useEffect, useState } from "react";
import NumberFormat from "../util-components/NumberFormat";
import { closeLoading, openLoading } from "../util-components/pageLoading";
import { SearchOutlined } from "@ant-design/icons";

export default function Order() {
  const [dataSource, setDataSource] = useState([]);
  const [searchText, setSearchText] = useState("");

  const handleSearch = (e: any) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
  };

  const filteredData = dataSource.filter(
    (item: any) =>
      item.productName.toLowerCase().includes(searchText) ||
      item.artistName.toLowerCase().includes(searchText) ||
      item.productTypeName.toLowerCase().includes(searchText)
  );
  const columns = [
    {
      title: "สินค้า",
      dataIndex: "productName",
      key: "productName",
      width: 300
    },
    {
      title: "จำนวน",
      dataIndex: "quantity",
      key: "quantity",
      render: (_: any, record: any) => (
        <>
          {record.quantity && (
            <NumberFormat value={record.quantity} precision={0} />
          )}
        </>
      ),
    },
    {
      title: "รูปภาพสินค้า",
      dataIndex: "imageURL",
      key: "imageURL",
      render: (_: any, record: any) => (
        <>
          <img
            style={{ width: 100, height: 100 }}
            alt={record.productName}
            src={record.imageURL || "/assets/images/no-image.jpg"}
          />
        </>
      ),
    },
  ];

  const getOrderList = () => {
    openLoading();
    fetch(window.location.origin + "/api/dashboard-order")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // แปลงข้อมูลเป็น JSON
      })
      .then((data) => {
        const combinedProducts: any = [];
        const productMap = new Map();

        // Loop through all orders and their products
        data.forEach((order: any) => {
          order.products.forEach((product: any) => {
            if (productMap.has(product._id)) {
              // If product already exists, update the quantity
              const existingProduct = productMap.get(product._id);
              existingProduct.quantity += product.quantity;
            } else {
              // Otherwise, add new product to map
              productMap.set(product._id, { ...product });
            }
          });
        });

        // Convert map back to array
        productMap.forEach((product) => combinedProducts.push(product));

        setDataSource(combinedProducts);
        closeLoading();
      })
      .catch((error) => {
        closeLoading();
        console.error("There was a problem with the fetch operation:", error);
      });
  };

  useEffect(() => {
    getOrderList();
  }, []);

  return (
    <>
      <div style={{ padding: "10px" }}>
        <Card className="mb-2 p-2" title="จำนวนที่ขายสินค้า" size="small">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Input
                addonBefore={<SearchOutlined />}
                placeholder="ค้นหา"
                value={searchText}
                onChange={handleSearch}
                style={{ marginBottom: 16 }}
              />
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Table
                bordered
                dataSource={filteredData}
                columns={columns}
                rowKey="_id"
              />
            </Col>
          </Row>
        </Card>
      </div>
    </>
  );
}
