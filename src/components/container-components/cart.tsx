"use client";
import {
  Button,
  Card,
  Col,
  Form,
  FormInstance,
  InputNumber,
  Row,
  Space,
  Spin,
  Table,
} from "antd";
import CurrencyFormat from "../util-components/CurrencyFormat";
import React, { useContext, useEffect, useState } from "react";
import useStore from "@/src/store/store";
import { AlertConfirm } from "../util-components/AlertConfirm";
import usePriceStore from "@/src/store/price-in-cart-store";
import Loading from "../util-components/Loading";
import useDataArtistStore from "@/src/store/data-artist-store";
import { DetailPayment, DetailPromotion } from "@/src/types/cart";

const EditableContext = React.createContext<FormInstance<any> | null>(null);

const EditableRow: React.FC<any> = ({ ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

const EditableCell: React.FC<React.PropsWithChildren<any>> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const form = useContext(EditableContext)!;

  useEffect(() => {
    form.setFieldsValue({ [dataIndex]: record?.quantity });
  }, []);

  const save = async () => {
    try {
      const values = await form.validateFields();
      if (values["quantity"] < 1) {
        values["quantity"] = 1;
        form.setFieldsValue({ [dataIndex]: 1 });
      }
      if (values["quantity"] > 999) {
        values["quantity"] = 999;
        form.setFieldsValue({ [dataIndex]: 999 });
      }
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log("Save failed:", errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = (
      <Space>
        <Button
          onClick={async () => {
            try {
              const values = await form.validateFields();
              if (values["quantity"] > 1) {
                values["quantity"] = values["quantity"] - 1;
                form.setFieldsValue({ [dataIndex]: values?.quantity });
                handleSave({ ...record, ...values });
              }
            } catch (errInfo) {
              console.log("Save failed:", errInfo);
            }
          }}
          style={{ width: 50 }}
        >
          -
        </Button>
        <Form.Item
          style={{ margin: 0 }}
          name={dataIndex}
          rules={[{ required: true, message: `${title} is required.` }]}
        >
          <InputNumber controls={false} onPressEnter={save} onBlur={save} />
        </Form.Item>
        <Button
          onClick={async () => {
            try {
              const values = await form.validateFields();
              if (values["quantity"] < 999) {
                values["quantity"] = values["quantity"] + 1;
                form.setFieldsValue({ [dataIndex]: values?.quantity });
                handleSave({ ...record, ...values });
              }
            } catch (errInfo) {
              console.log("Save failed:", errInfo);
            }
          }}
          style={{ width: 50 }}
        >
          +
        </Button>
      </Space>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};

export default function Cart() {
  const { productInCart, setProductInCart } = useStore();
  const { setPriceInCart } = usePriceStore();
  const { setArtistsData } = useDataArtistStore();
  const [dataSource, setDataSource] = useState(productInCart);
  const [dataSourcePromotion, setDataSourcePromotion] = useState([]);
  const [detailPayment, setDetailPayment] = useState<DetailPayment>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getPromotionList();
  }, []);

  const calculatePrice = (data: any, product?: any) => {
    let totalPriceNonPromotion = 0;
    let totalPrice = 0;
    let detailPromotion: DetailPromotion[] = [];
    let promoItems: any[] = [];
    let nonPromoItems: any[] = [];

    // แยกสินค้าที่เข้าร่วมโปรโมชั่นและสินค้าที่ไม่เข้าร่วม
    let products = [];
    products = !!product ? product : productInCart;
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

    setArtistsData(artistsData);

    // คำนวณราคาสินค้าที่ไม่เข้าร่วมโปรโมชั่น
    totalPrice += nonPromoItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    totalPriceNonPromotion += totalPrice;

    // แยกสินค้าตามโปรโมชั่น
    let promoData: any = {}; // เก็บข้อมูลการใช้โปรโมชั่น

    promoItems.forEach((item) => {
      if (!promoData[item.promotionId]) {
        promoData[item.promotionId] = [];
      }
      promoData[item.promotionId].push(item);
    });

    for (let promotionId in promoData) {
      const promo: any = data.find((p: any) => p._id === promotionId);
      if (promo) {
        const items = promoData[promotionId];
        const totalItems = items.reduce(
          (sum: any, item: any) => sum + item.quantity,
          0
        );

        // คำนวณจำนวนชุดโปรที่ใช้ได้ (โปรโมชัน 3 ชิ้น = 100 บาท)
        const setsAvailable = Math.floor(totalItems / promo.quantity); // promo.quantity = 3

        if (setsAvailable > 0)
          detailPromotion.push({
            promotionName: promo.promotionName,
            setsAvailable: setsAvailable,
            totalPrice: setsAvailable * promo.price,
          });

        // ราคาสำหรับชุดโปร
        totalPrice += setsAvailable * promo.price;

        // คำนวณสินค้าที่เหลือ (ถ้ามี)
        const remainingItems = totalItems % promo.quantity;
        totalPrice += remainingItems * items[0].price; // คำนวณราคาสินค้าที่เหลือ
        totalPriceNonPromotion += remainingItems * items[0].price;
      }
    }

    setPriceInCart(totalPrice || 0);
    setDetailPayment({
      totalPriceNonPromotion: totalPriceNonPromotion,
      totalPricePromotion: detailPromotion,
      totalPrice: totalPrice,
    });
  };

  const getPromotionList = () => {
    fetch(window.location.origin + "/api/promotions-setting")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // แปลงข้อมูลเป็น JSON
      })
      .then((data) => {
        console.log(data);
        
        setIsLoading(false);
        setDataSourcePromotion(data);
        calculatePrice(data);
        window.scrollTo(0, document.body.scrollHeight);
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  };

  const handleSave = (row: any) => {
    const newData = [...dataSource];
    const index = newData.findIndex((item: any) => row._id === item._id);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    setProductInCart([...newData]);
    setDataSource(newData);
    calculatePrice(dataSourcePromotion, newData);
  };

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  const defaultColumns = [
    {
      title: "สินค้า",
      dataIndex: "productName",
      key: "productName",
      render: (_: any, record: any) => (
        <>
          <div className="product-description-table">
            <img
              style={{ width: 70, height: 70 }}
              alt={record.productName}
              src={record.imageURL || "/assets/images/no-image.jpg"}
            />
            <span className="ml-2">{record.productName}</span>
          </div>
        </>
      ),
    },
    {
      title: "ราคา",
      dataIndex: "price",
      key: "price",
      render: (_: any, record: any) => (
        <>
          <CurrencyFormat value={record.price} />
        </>
      ),
    },
    {
      title: "จำนวน",
      dataIndex: "quantity",
      key: "quantity",
      editable: true,
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (_: any, record: any) => (
        <>
          <CurrencyFormat
            className="text-red-500"
            value={record.price * record.quantity}
          />
        </>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (_: any, record: any) => (
        <>
          <Button
            type="primary"
            danger
            onClick={() => {
              AlertConfirm("ต้องการลบข้อมูลนี้ใช่หรือไม่").then((res) => {
                if (res?.isConfirmed) {
                  let list = productInCart;
                  list = list.filter((item: any) => item._id !== record._id);
                  setProductInCart(list);
                  setDataSource(list);
                  calculatePrice(dataSourcePromotion, list);
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

  const columns = defaultColumns.map((col: any) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: any) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });

  return (
    <div>
      {!isLoading ? (
        <div className="p-1">
          <Card className="mb-2 responsive-table" size="small">
            <Table
              components={components}
              rowClassName={() => "editable-row"}
              dataSource={dataSource}
              columns={columns}
              pagination={false}
              showHeader={false}
              rowKey="_id"
            />
          </Card>
          <Card title="รายละเอียด" className="mb-2" size="small">
            {(detailPayment?.totalPricePromotion?.length || 0) > 0 && (
              <Row gutter={[16, 16]}>
                {detailPayment?.totalPricePromotion?.map((x: any) => (
                  <>
                    <Col offset={6} span={12} className="text-[18px]">
                      <span>
                        {x.promotionName} จำนวน {x.setsAvailable} ชุด :{" "}
                      </span>
                    </Col>
                    <Col span={4} className="text-[18px]">
                      <span>
                        <CurrencyFormat
                          className="text-red-500"
                          value={x.totalPrice || 0}
                        />
                      </span>
                    </Col>
                  </>
                ))}
              </Row>
            )}
            {(detailPayment?.totalPriceNonPromotion || 0) > 0 && (
              <Row gutter={[16, 16]} className="mt-[16px] mb-[16px]">
                <Col offset={6} span={12} className="text-[18px]">
                  <span>ราคาสินค้าอื่นๆ : </span>
                </Col>
                <Col span={6} className="text-[18px]">
                  <span>
                    <CurrencyFormat
                      className="text-red-500"
                      value={detailPayment?.totalPriceNonPromotion || 0}
                    />
                  </span>
                </Col>
              </Row>
            )}
          </Card>
        </div>
      ) : (
        <>
          <Loading />
        </>
      )}
    </div>
  );
}
