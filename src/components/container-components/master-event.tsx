import { getFormConfig } from "@/src/constants/form";
import { Button, Checkbox, Col, Form, Input, Modal, Row, Table } from "antd";
import { useEffect, useState } from "react";
import { AlertConfirm } from "../util-components/AlertConfirm";
import { closeLoading, openLoading } from "../util-components/pageLoading";

export default function MasterEvent() {
  const [dataSource, setDataSource] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState<any>({});
  const [form] = Form.useForm();

  const getEventList = () => {
    openLoading();
    fetch(window.location.origin + "/api/events")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // แปลงข้อมูลเป็น JSON
      })
      .then((data) => {
        closeLoading();
        setDataSource(data);
      })
      .catch((error) => {
        closeLoading();
        console.error("There was a problem with the fetch operation:", error);
      });
  };

  useEffect(() => {
    getEventList();
  }, []);

  const showModal = () => {
    setData(null);
    setIsModalOpen(true);
  };

  const handleOk = () => {
    form.validateFields().then((val: any) => {
      openLoading();
      if (!data?._id) {
        fetch(window.location.origin + "/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: val.name,
            isMainEvent: val.isMainEvent || false,
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
            getEventList();
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
        fetch(window.location.origin + "/api/events", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: data?._id,
            name: val.name,
            isMainEvent: val.isMainEvent || false,
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
            getEventList();
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

  const columns = [
    {
      title: "ชื่อ",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "อีเว้นท์หลัก",
      dataIndex: "isMainEvent",
      key: "isMainEvent",
      render: (_: any, record: any) => (
        <>
          <span>{record?.isMainEvent ? "ใช่" : "ไม่"}</span>
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
                  fetch(window.location.origin + "/api/events", {
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
                      getEventList();
                    })
                    .catch((error) => {
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
        <Table
          bordered
          dataSource={dataSource}
          columns={columns}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </div>
      <Modal
        title="เพิ่มอีเว้นท์"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form {...getFormConfig()} form={form} onValuesChange={() => {}}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item
                name="name"
                label="ชื่อ"
                rules={[
                  {
                    required: true,
                    message: "กรุณาระบุชื่อ!",
                  },
                ]}
              >
                <Input placeholder="ชื่อ" onKeyDown={handleKeyPress} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="isMainEvent" valuePropName="checked" label="อีเว้นท์หลัก" className="mt-[-25px]">
                <Checkbox />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}
