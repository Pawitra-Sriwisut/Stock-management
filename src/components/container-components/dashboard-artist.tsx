"use client";
import { Card, Col, Row, Table } from "antd";
import { useEffect, useState } from "react";
import NumberFormat from "../util-components/NumberFormat";
import { closeLoading, openLoading } from "../util-components/pageLoading";

export default function DashboardArtist() {
  const [dataSource, setDataSource] = useState([]);
  const columns = [
    {
      title: "ชื่อนักวาด",
      dataIndex: "artistName",
      key: "artistName",
    },
    {
      title: "ยอดรวม",
      dataIndex: "total",
      key: "total",
      render: (_: any, record: any) => (
        <>
          <NumberFormat value={record.total} precision={2} />
        </>
      ),
    },
  ];

  const getDashboardArtistList = () => {
    openLoading();
    fetch(window.location.origin + "/api/dashboard-artist", {
      method: "GET", // หรือ "POST", "PUT" แล้วแต่กรณี
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store", // ห้ามใช้ cache
        // ใส่ header อื่นๆ ได้ตามต้องการ เช่น
        // Authorization: "Bearer <token>",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // แปลงข้อมูลเป็น JSON
      })
      .then((data) => {
        setDataSource(data);
        closeLoading();
      })
      .catch((error) => {
        closeLoading();
        console.error("There was a problem with the fetch operation:", error);
      });
  };

  useEffect(() => {
    getDashboardArtistList();
  }, []);

  return (
    <>
      <div style={{ padding: "10px" }}>
        <Card className="mb-2 p-2" title="Dashboard" size="small">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Table
                bordered
                dataSource={dataSource}
                columns={columns}
                rowKey="_id"
                pagination={{ pageSize: 10 }}
              />
            </Col>
          </Row>
        </Card>
      </div>
    </>
  );
}
