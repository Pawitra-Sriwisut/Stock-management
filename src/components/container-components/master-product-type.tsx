import { getFormConfig } from "@/src/constants/form";
import { Button, Col, Form, Input, Modal, Row, Table } from "antd";
import { useEffect, useState } from "react";
import { AlertConfirm } from "../util-components/AlertConfirm";
import { closeLoading, openLoading } from "../util-components/pageLoading";

export default function MasterProductType() {
  const [dataSource, setDataSource] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState<any>({});
  const [form] = Form.useForm();

  const getProductTypeList = () => {
    openLoading();
    fetch(window.location.origin + "/api/productTypes")
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
    getProductTypeList();
  }, []);

  const showModal = () => {
    setData(null);
    setIsModalOpen(true);
  };

  const handleOk = () => {
    form.validateFields().then((val: any) => {
      openLoading();
      if (!data?._id) {
        fetch(window.location.origin + "/api/productTypes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: val.name,
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
            getProductTypeList();
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
      } else {
        fetch(window.location.origin + "/api/productTypes", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: data?._id,
            name: val.name,
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
            getProductTypeList();
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

  const handleKeyPress = (e: any)=> {
    if (e.key === 'Enter') {
      handleOk();
    }
  }

  const columns = [
    {
      title: "ประเภทของสินค้า",
      dataIndex: "name",
      key: "name",
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
              form.setFieldValue("name", record.name);
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
                  fetch(window.location.origin + "/api/productTypes", {
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
                      getProductTypeList();
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

  return (
    <>
      <div style={{ padding: 10 }}>
        <Button className="float-right mb-2" type="primary" onClick={showModal}>
          เพิ่ม
        </Button>
        <Table bordered dataSource={dataSource} columns={columns} rowKey="_id" pagination={{ pageSize: 10 }} />
      </div>
      <Modal
        title="เพิ่มประเภทของสินค้า"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form {...getFormConfig()} form={form} onValuesChange={() => {}}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item
                name="name"
                label="ชื่อประเภทของสินค้า"
                rules={[
                  {
                    required: true,
                    message: "กรุณาระบุชื่อประเภทของสินค้า!",
                  },
                ]}
              >
                <Input placeholder="ชื่อประเภทของสินค้า" onKeyDown={handleKeyPress} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}
