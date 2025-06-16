"use client";
import {
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  Modal,
  Row,
  Select,
  Table,
} from "antd";
import { useEffect, useState } from "react";
import { AlertConfirm } from "../util-components/AlertConfirm";
import { getFormConfig } from "@/src/constants/form";
import NumberFormat from "../util-components/NumberFormat";
import { closeLoading, openLoading } from "../util-components/pageLoading";
const { Option } = Select;

export default function PromotionSetting() {
  const [dataSource, setDataSource] = useState([]);
  const [dataSourceProduct, setDataSourceProduct] = useState([]);
  const [dataSourcePromotion, setDataSourcePromotion] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState<any>({});
  const [form] = Form.useForm();
  const columns = [
    {
      title: "โปรโมชั่น",
      dataIndex: "promotionName",
      key: "promotionName",
      width: 250,
    },
    {
      title: "จำนวน",
      dataIndex: "quantity",
      key: "quantity",
      width: 120,
      render: (_: any, record: any) => (
        <>
          <NumberFormat value={record.quantity} precision={0} />
        </>
      ),
    },
    {
      title: "ราคา",
      dataIndex: "price",
      key: "price",
      width: 120,
      render: (_: any, record: any) => (
        <>
          <NumberFormat value={record.price} precision={2} />
        </>
      ),
    },
    {
      title: "สินค้า",
      dataIndex: "productList",
      key: "productList",
      render: (_: any, record: any) => (
        <>
          <span>{record?.productListName?.join(", ")}</span>
        </>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: 200,
      render: (_: any, record: any) => (
        <>
          <Button
            type="primary"
            className="mr-2"
            onClick={() => {
              setData(record);
              form.setFieldsValue(record);
              setIsModalOpen(true);
            }}
          >
            แก้ไข
          </Button>
          <Button
            type="primary"
            danger
            onClick={() => {
              AlertConfirm("ต้องการลบข้อมูลนี้ใช่หรือไม่").then((res) => {
                if (res?.isConfirmed) {
                  openLoading();
                  fetch(window.location.origin + "/api/promotions-setting", {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      id: record._id,
                    }),
                  })
                    .then((response) => {
                      if (!response.ok) {
                        throw new Error("Network response was not ok");
                      }
                      return response.json(); // แปลงข้อมูลเป็น JSON
                    })
                    .then(() => {
                      getPromotionList();
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

  const getPromotionList = () => {
    openLoading();
    fetch(window.location.origin + "/api/promotions-setting")
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

  const getMasterPromotionList = () => {
    fetch(window.location.origin + "/api/promotions")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // แปลงข้อมูลเป็น JSON
      })
      .then((data) => {
        setDataSourcePromotion(data);
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  };

  const getProductList = () => {
    fetch(window.location.origin + "/api/products")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // แปลงข้อมูลเป็น JSON
      })
      .then((data) => {
        setDataSourceProduct(data);
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  };

  useEffect(() => {
    getProductList();
    getPromotionList();
    getMasterPromotionList();
  }, []);

  const showModal = () => {
    setData(null);
    setIsModalOpen(true);
  };

  const handleOk = () => {
    form.validateFields().then((val: any) => {
      if (!data?._id) {
        openLoading();
        fetch(window.location.origin + "/api/promotions-setting", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            promotionId: val.promotionId,
            price: val.price,
            quantity: val.quantity,
            productList: val.productList,
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Network response was not ok");
            }
            return response.json(); // แปลงข้อมูลเป็น JSON
          })
          .then(() => {
            form.resetFields();
            getPromotionList();
            setData(null);
            setIsModalOpen(false);
            closeLoading();
          })
          .catch((error) => {
            closeLoading();
            console.error(
              "There was a problem with the fetch operation:",
              error
            );
          });
      } else {
        fetch(window.location.origin + "/api/promotions-setting", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: data?._id,
            promotionId: val.promotionId,
            price: val.price,
            quantity: val.quantity,
            productList: val.productList,
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Network response was not ok");
            }
            return response.json(); // แปลงข้อมูลเป็น JSON
          })
          .then(() => {
            form.resetFields();
            getPromotionList();
            setData(null);
            setIsModalOpen(false);
            closeLoading();
          })
          .catch((error) => {
            console.error(
              "There was a problem with the fetch operation:",
              error
            );
            closeLoading();
          });
      }
    });
  };

  const handleCancel = () => {
    form.resetFields();
    setData(null);
    setIsModalOpen(false);
  };

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter") {
      handleOk();
    }
  };

  return (
    <>
      <div style={{ padding: "10px" }}>
        <Card className="mb-2 p-2" title="จัดการโปรโมชั่น" size="small">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Button
                className="float-right mb-2"
                type="primary"
                onClick={showModal}
              >
                เพิ่ม
              </Button>
            </Col>
          </Row>
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
      <Modal
        maskClosable={false}
        title="เพิ่มรายละเอียดโปรโมชั่น"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form {...getFormConfig()} form={form} onValuesChange={() => {}}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item
                name="promotionId"
                label="โปรโมชั่น"
                rules={[
                  {
                    required: true,
                    message: "กรุณาระบุโปรโมชั่น!",
                  },
                ]}
              >
                <Select
                  showSearch
                  allowClear
                  style={{ width: "100%" }}
                  filterOption={(input: any, option: any) => {
                    return option.props.children
                      .toLowerCase()
                      .includes(input.toLowerCase());
                  }}
                >
                  {dataSourcePromotion?.map((option: any) => (
                    <Option key={option._id} value={option._id}>
                      {option.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item
                name="quantity"
                label="จำนวน"
                rules={[
                  {
                    required: true,
                    message: "กรุณาระบุจำนวน!",
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  precision={0}
                  style={{ width: "100%" }}
                  controls={false}
                  onKeyDown={handleKeyPress}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item
                name="price"
                label="ราคา"
                rules={[
                  {
                    required: true,
                    message: "กรุณาระบุราคา!",
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: "100%" }}
                  controls={false}
                  onKeyDown={handleKeyPress}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item
                name="productList"
                label="สินค้า"
                rules={[
                  {
                    required: true,
                    message: "กรุณาระบุสินค้า!",
                  },
                ]}
              >
                <Select
                  mode="multiple"
                  showSearch
                  allowClear
                  style={{ width: "100%" }}
                  filterOption={(input: any, option: any) => {
                    return option.props.children
                      .toLowerCase()
                      .includes(input.toLowerCase());
                  }}
                >
                  {dataSourceProduct?.map((option: any) => (
                    <Option key={option._id} value={option._id}>
                      {option.productName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}
