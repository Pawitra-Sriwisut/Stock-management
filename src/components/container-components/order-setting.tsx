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
import CurrencyFormat from "../util-components/CurrencyFormat";
import { AlertConfirm, AlertSuccess } from "../util-components/AlertConfirm";

export default function OrderSetting() {
  const [dataSource, setDataSource] = useState<any>([]);
  const [searchText, setSearchText] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [dataSourcePromotion, setDataSourcePromotion] = useState([]);

  const getPromotionList = () => {
    fetch(window.location.origin + "/api/promotions-setting")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // แปลงข้อมูลเป็น JSON
      })
      .then((data) => {
        setDataSourcePromotion(data);
        window.scrollTo(0, document.body.scrollHeight);
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  };

  const calculatePrice = (data: any, product: any) => {
    let promoItems: any[] = [];
    let nonPromoItems: any[] = [];

    // แยกสินค้าที่เข้าร่วมโปรโมชั่นและสินค้าที่ไม่เข้าร่วม
    let products = [];
    products = product;
    for (let product of products) {
      if (product.promotionId) {
        promoItems.push(product); // สินค้าที่เข้าร่วมโปรโมชั่น
      } else {
        nonPromoItems.push(product); // สินค้าที่ไม่เข้าร่วมโปรโมชั่น
      }
    }

    let paymentByArtist: any = {};
    let promoDataByArtist: any = {};

    nonPromoItems.forEach((item) => {
      if (!paymentByArtist[item.artistId]) {
        paymentByArtist[item.artistId] = {
          total: 0,
        };
      }
      paymentByArtist[item.artistId] = {
        total:
          paymentByArtist[item.artistId].total + item.quantity * item.price,
      };
    });

    promoItems.forEach((item) => {
      if (!promoDataByArtist[item.artistId]) {
        promoDataByArtist[item.artistId] = [];
      }
      promoDataByArtist[item.artistId].push(item);
    });

    let remainingTotalItem: any = {};

    for (let artistId in promoDataByArtist) {
      const itemsPerArtist = promoDataByArtist[artistId];
      let dataPerArtist: any = {};
      itemsPerArtist.forEach((item: any) => {
        if (!dataPerArtist[item.promotionId]) {
          dataPerArtist[item.promotionId] = [];
        }
        dataPerArtist[item.promotionId].push(item);
      });
      for (let promotionId in dataPerArtist) {
        const promo: any = data.find(
          (p: any) => p._id.toString() === promotionId
        );
        if (promo) {
          const items = dataPerArtist[promotionId];
          const totalItems = items.reduce(
            (sum: any, item: any) => sum + item.quantity,
            0
          );

          // คำนวณจำนวนชุดโปรที่ใช้ได้ (โปรโมชัน 3 ชิ้น = 100 บาท)
          const setsAvailable = Math.floor(totalItems / promo.quantity); // promo.quantity = 3

          if (!paymentByArtist[artistId]) {
            paymentByArtist[artistId] = {
              total: 0,
            };
          }
          paymentByArtist[artistId] = {
            total:
              paymentByArtist[artistId].total + setsAvailable * promo.price,
          };
          const remainingItems = totalItems % promo.quantity;

          if (remainingItems > 0) {
            if (!remainingTotalItem[promotionId]) {
              remainingTotalItem[promotionId] = [];
            }
            remainingTotalItem[promotionId].push({
              artistId: artistId,
              remainingItems: remainingItems,
              price: items[0].price,
            });
          }
        }
      }
    }

    for (let promotionId in remainingTotalItem) {
      let totalRemaining = 0;
      const promo: any = data.find(
        (p: any) => p._id.toString() === promotionId
      );
      if (promo) {
        const items = remainingTotalItem[promotionId];
        const totalItems = items.reduce(
          (sum: any, item: any) => sum + item.remainingItems,
          0
        );

        const setsAvailable = Math.floor(totalItems / promo.quantity); // promo.quantity = 3
        totalRemaining += setsAvailable * promo.price;

        // คำนวณสินค้าที่เหลือ (ถ้ามี)
        const remainingItems = totalItems % promo.quantity;
        totalRemaining += remainingItems * items[0].price; // คำนวณราคาสินค้าที่เหลือ

        items.forEach((item: any) => {
          if (!paymentByArtist[item.artistId]) {
            paymentByArtist[item.artistId] = {
              total: 0,
            };
          }
          paymentByArtist[item.artistId] = {
            total:
              paymentByArtist[item.artistId].total +
              (totalRemaining / totalItems) * item.remainingItems,
          };
        });
      }
    }

    let artistsData = Object.keys(paymentByArtist).map((key) => ({
      artistId: key,
      total: paymentByArtist[key].total,
    }));

    return artistsData;
  };

  const handleSearch = (e: any) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
  };

  const filteredData = dataSource;
  const columns: any = [
    {
      title: "Order No.",
      dataIndex: "orderNo",
      key: "orderNo",
      render: (_: any, record: any) => {
        const index =
          (dataSource?.findIndex((x: any) => x._id === record?._id) || 0) + 1;
        return (
          <>
            <span>{"STM" + String(index).padStart(10, "0")}</span>
          </>
        );
      },
    },
    {
      title: "Product",
      dataIndex: "product",
      key: "product",
      render: (_: any, record: any) => (
        <>
          {record?.products?.map((value: any, index: any) => (
            <div className="flex justify-between whitespace-pre">
              <div style={{flex: 2}}>{`${index + 1}: ${value?.productName}`}</div>
              <div style={{flex: 1}}>{`ราคา: ${value?.price}`}</div>
              <div style={{flex: 1}}>{`จำนวน: ${value?.quantity}`}</div>
            </div>
          ))}
        </>
      ),
    },
    {
      title: "Total Price",
      dataIndex: "totalPrice",
      key: "totalPrice",
      align: "right",
      render: (_: any, record: any) => (
        <>
          <CurrencyFormat value={record.totalPrice} />
        </>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      align: "center",
      width: 200,
      render: (_: any, record: any) => (
        <>
          <Button
            type="primary"
            danger
            onClick={() => {
              AlertConfirm("ต้องการลบข้อมูลนี้ใช่หรือไม่").then((res) => {
                if (res?.isConfirmed) {
                  openLoading();
                  fetch(window.location.origin + "/api/dashboard-order", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(record),
                  })
                    .then((response) => {
                      if (!response.ok) {
                        throw new Error("Network response was not ok");
                      }
                      return response.json(); // แปลงข้อมูลเป็น JSON
                    })
                    .then(() => {
                      const artistsData = calculatePrice(
                        dataSourcePromotion,
                        record?.products
                      );
                      fetch(window.location.origin + "/api/calculate-money", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          artistsData: artistsData,
                          isDelete: true,
                        }),
                      })
                        .then((response) => {
                          if (!response.ok) {
                            throw new Error("Network response was not ok");
                          }
                          return response.json(); // แปลงข้อมูลเป็น JSON
                        })
                        .then(() => {
                          AlertSuccess("ลบรายการสำเร็จ!").then(() => {
                            getOrderList();
                          });
                        })
                        .catch((error) => {
                          closeLoading();
                          console.error(
                            "There was a problem with the fetch operation:",
                            error
                          );
                        });
                    })
                    .catch((error) => {
                      closeLoading();
                      console.error(
                        "There was a problem with the fetch operation:",
                        error
                      );
                    });
                }
              });
            }}
          >
            ลบ
          </Button>
        </>
      ),
    },
  ];

  const subColumns = [
    {
      title: "สินค้า",
      dataIndex: "productName",
      key: "productName",
      render: (_: any, record: any) => (
        <>
          <div className="flex items-center justify-evenly">
            <img
              style={{ width: 100, height: 100 }}
              alt={record.productName}
              src={record.imageURL || "/assets/images/no-image.jpg"}
            />
            <span>{record.productName}</span>
          </div>
        </>
      ),
    },
    {
      title: "จำนวน",
      dataIndex: "quantity",
      key: "quantity",
      width: 350,
      render: (_: any, record: any) => (
        <>
          {record.quantity && (
            <NumberFormat value={record.quantity} precision={0} />
          )}
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
        const totalPrice = data?.reduce(
          (sum: any, item: any) => sum + item.totalPrice,
          0
        );
        setDataSource(data);
        setTotalPrice(totalPrice || 0);
        closeLoading();
      })
      .catch((error) => {
        closeLoading();
        console.error("There was a problem with the fetch operation:", error);
      });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    getPromotionList();
    getOrderList();
  }, []);

  return (
    <>
      <div style={{ padding: "10px" }}>
        <Card className="mb-2 p-2" title="จัดการรายการสั่งซื้อ" size="small">
          {/* <Row gutter={[16, 16]}>
          <Col span={24}>
            <Input
              addonBefore={<SearchOutlined />}
              placeholder="ค้นหา"
              value={searchText}
              onChange={handleSearch}
              style={{ marginBottom: 16 }}
            />
          </Col>
        </Row> */}
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Table
                columns={columns}
                expandable={{
                  expandedRowRender: (record: any) => (
                    <Table
                      columns={subColumns}
                      rowKey="_id"
                      dataSource={record?.products}
                      pagination={false}
                    />
                  ),
                }}
                rowKey="_id"
                dataSource={filteredData}
                summary={() => {
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell
                        index={0}
                        colSpan={2}
                      ></Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <b>Total</b>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell className="text-right" index={2}>
                        <b>
                          <CurrencyFormat value={totalPrice} />
                        </b>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }}
              />
            </Col>
          </Row>
        </Card>
      </div>
    </>
  );
}
