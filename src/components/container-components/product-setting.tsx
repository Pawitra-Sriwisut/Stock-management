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
import { AlertConfirm } from "../util-components/AlertConfirm";
import { getFormConfig } from "@/src/constants/form";
import NumberFormat from "../util-components/NumberFormat";
import TextArea from "antd/es/input/TextArea";
import { SearchOutlined } from "@ant-design/icons";
import { closeLoading, openLoading } from "../util-components/pageLoading";
const { Option } = Select;

export default function ProductSetting() {
  const [dataSource, setDataSource] = useState([]);
  const [dataSourceArtist, setDataSourceArtist] = useState([]);
  const [dataSourceProductType, setDataSourceProductType] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState<any>({});
  const [valueForm, setValueForm] = useState<any>(null);
  const [form] = Form.useForm();
  const columns = [
    {
      title: "สินค้า",
      dataIndex: "productName",
      key: "productName",
    },
    {
      title: "ราคา",
      dataIndex: "price",
      key: "price",
      render: (_: any, record: any) => (
        <>
          <NumberFormat value={record.price} precision={2} />
        </>
      ),
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
      title: "ประเภทของสินค้า",
      dataIndex: "productTypeName",
      key: "productTypeName",
    },
    {
      title: "นักวาด",
      dataIndex: "artistName",
      key: "artistName",
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
              setValueForm(record);
              form.setFieldsValue({
                ...record,
                imageURL: convertToFileViewURL(record.imageURL),
              });
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
                  fetch(window.location.origin + "/api/products", {
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
                      getProductList();
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

  const getArtistList = () => {
    fetch(window.location.origin + "/api/artists")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // แปลงข้อมูลเป็น JSON
      })
      .then((data) => {
        setDataSourceArtist(data);
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  };

  const getProductTypeList = () => {
    fetch(window.location.origin + "/api/productTypes")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // แปลงข้อมูลเป็น JSON
      })
      .then((data) => {
        setDataSourceProductType(data);
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  };

  const getProductList = () => {
    openLoading();
    fetch(window.location.origin + "/api/products")
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
    getArtistList();
    getProductTypeList();
    getProductList();
  }, []);

  const showModal = () => {
    setData(null);
    setValueForm(null);
    setIsModalOpen(true);
  };

  const convertToThumbnailURL = (url: any) => {
    if (!url) return null;
    const regex = /\/d\/([a-zA-Z0-9_-]+)\//;
    const match = url.match(regex);

    if (match) {
      const fileId = match[1];
      return `https://drive.google.com/thumbnail?id=${fileId}`;
    } else {
      return null; // ในกรณีที่ไม่พบรูปแบบ URL ที่ถูกต้อง
    }
  };

  const convertToFileViewURL = (url: any) => {
    if (!url) return null;
    const regex = /thumbnail\?id=([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);

    if (match) {
      const fileId = match[1];
      return `https://drive.google.com/file/d/${fileId}/view?usp=drive_link`;
    } else {
      return null; // ในกรณีที่ไม่พบรูปแบบ URL ที่ถูกต้อง
    }
  };

  const handleOk = () => {
    form.validateFields().then((val: any) => {
      openLoading();
      if (!data?._id) {
        fetch(window.location.origin + "/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productName: val.productName,
            price: val.price,
            quantity: val.quantity,
            artistId: val.artistId,
            productTypeId: val.productTypeId,
            productList: val.productList,
            imageURL: convertToThumbnailURL(val.imageURL),
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
            getProductList();
            setData(null);
            setValueForm(null);
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
        fetch(window.location.origin + "/api/products", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: data?._id,
            productName: val.productName,
            price: val.price,
            quantity: val.quantity,
            artistId: val.artistId,
            productTypeId: val.productTypeId,
            productList: val.productList,
            imageURL: convertToThumbnailURL(val.imageURL),
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
            getProductList();
            setData(null);
            setValueForm(null);
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
      }
    });
  };

  const handleCancel = () => {
    form.resetFields();
    setData(null);
    setValueForm(null);
    setIsModalOpen(false);
  };

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

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter") {
      handleOk();
    }
  };

  const cancel = () => {};

  return (
    <>
      <div style={{ padding: "10px" }}>
        <Card className="mb-2 p-2" title="จัดการสินค้า" size="small">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Input
                addonBefore={<SearchOutlined />}
                placeholder="ค้นหา"
                value={searchText}
                onChange={handleSearch}
                style={{ marginBottom: 16 }}
              />
            </Col>
            <Col span={12}>
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
                dataSource={filteredData}
                columns={columns}
                rowKey="_id"
                pagination={{ onChange: cancel }}
              />
            </Col>
          </Row>
        </Card>
      </div>
      <Modal
        maskClosable={false}
        title="เพิ่มสินค้า"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form
          {...getFormConfig()}
          form={form}
          onValuesChange={(changeValue: any, allValue: any) => {
            setValueForm(allValue);
            if (allValue?.productTypeId === "67467e4267f91bd0117809d8") {
              form.setFieldValue("quantity", null);
            }
            form?.validateFields().then(() => {});
          }}
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item
                name="productName"
                label="ชื่อสินค้า"
                rules={[
                  {
                    required: true,
                    message: "กรุณาระบุชื่อสินค้า!",
                  },
                ]}
              >
                <Input
                  style={{ width: "100%" }}
                  placeholder="ชื่อสินค้า"
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
                name="quantity"
                label="จำนวน"
                rules={[
                  {
                    required:
                      valueForm?.productTypeId !== "67467e4267f91bd0117809d8",
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
                  disabled={
                    valueForm?.productTypeId === "67467e4267f91bd0117809d8"
                  }
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item
                name="productTypeId"
                label="ประเภทของสินค้า"
                rules={[
                  {
                    required: true,
                    message: "กรุณาระบุประเภทของสินค้า!",
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
                  {dataSourceProductType?.map((option: any) => (
                    <Option key={option._id} value={option._id}>
                      {option.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          {valueForm?.productTypeId === "67467e4267f91bd0117809d8" && (
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Form.Item
                  name="productList"
                  label="สินค้าที่อยู่ใน Set"
                  rules={[
                    {
                      required: true,
                      message: "กรุณาระบุสินค้าที่อยู่ใน Set!",
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
                    {dataSource?.map((option: any) => (
                      <Option key={option._id} value={option._id}>
                        {option.productName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item
                name="artistId"
                label="นักวาด"
                rules={[
                  {
                    required: true,
                    message: "กรุณาระบุนักวาด!",
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
                  {dataSourceArtist?.map((option: any) => (
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
              <Form.Item name="imageURL" label="ลิงค์รูปภาพสินค้า">
                <TextArea
                  rows={3}
                  style={{ width: "100%" }}
                  placeholder="ลิงค์รูปภาพสินค้า"
                  onKeyDown={handleKeyPress}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}
