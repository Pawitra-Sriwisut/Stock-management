"use client";

import {
  Button,
  Card,
  Col,
  Form,
  FormInstance,
  Input,
  InputNumber,
  List,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Table,
} from "antd";
import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import useStore from "@/src/store/store";
import CurrencyFormat from "../util-components/CurrencyFormat";
import Loading from "../util-components/Loading";
import usePriceStore from "@/src/store/price-in-cart-store";
import useDataArtistStore from "@/src/store/data-artist-store";
import {
  AlertConfirm,
  AlertError,
  AlertSuccess,
} from "../util-components/AlertConfirm";
import { closeLoading, openLoading } from "../util-components/pageLoading";
import React from "react";
import "react-perfect-scrollbar/dist/css/styles.css";
import PerfectScrollbar from "react-perfect-scrollbar";
const { Option } = Select;

export default function Home() {
  const { priceInCart, setPriceInCart } = usePriceStore();
  const { productInCart, setProductInCart } = useStore();
  const { artistsData, setArtistsData } = useDataArtistStore();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSourceArtist, setDataSourceArtist] = useState([]);
  const [dataSourceProductType, setDataSourceProductType] = useState([]);
  const [dataSourcePromotion, setDataSourcePromotion] = useState([]);
  const [detailPayment, setDetailPayment] = useState<any>({});
  const [scrollEl, setScrollEl] = useState<any>();
  const [isMobile, setIsMobile] = useState(false);
  const [dataSource, setDataSource] = useState(productInCart);

  const EditableContext = React.createContext<FormInstance<any> | null>(null);

  const EditableRow: React.FC<any> = ({ ...props }) => {
    const [formQuantity] = Form.useForm();
    return (
      <Form form={formQuantity} component={false}>
        <EditableContext.Provider value={formQuantity}>
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
    }, [dataSource]);

    const save = async () => {
      try {
        const values = await form.validateFields();
        const item: any = products?.find((x: any) => x._id === record._id);
        if (values["quantity"] < 1) {
          values["quantity"] = 1;
          form.setFieldsValue({ [dataIndex]: 1 });
        }
        if (values["quantity"] > 999) {
          values["quantity"] = 999;
          form.setFieldsValue({ [dataIndex]: 999 });
        }
        if (!!item?.quantity && values["quantity"] > item?.quantity) {
          values["quantity"] = item?.quantity;
          form.setFieldsValue({ [dataIndex]: item?.quantity });
        }
        handleSave({ ...record, ...values });
      } catch (errInfo) {
        console.log("Save failed:", errInfo);
      }
    };

    let childNode = children;
    if (editable) {
      childNode = (
        <>
          <div className="flex flex-col items-center">
            <div className="flex items-center">
              <Button
                size="small"
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
                style={{ width: 20, padding: 0 }}
              >
                -
              </Button>
              <Form.Item
                style={{ margin: 0 }}
                name={dataIndex}
                rules={[{ required: true, message: `${title} is required.` }]}
              >
                <InputNumber
                  size="small"
                  style={{ width: 35, fontSize: 10 }}
                  controls={false}
                  onPressEnter={save}
                  onBlur={save}
                />
              </Form.Item>
              <Button
                size="small"
                onClick={async () => {
                  try {
                    const values = await form.validateFields();
                    const item: any = products?.find(
                      (x: any) => x._id === record._id
                    );
                    if (values["quantity"] < 999) {
                      values["quantity"] = values["quantity"] + 1;
                      form.setFieldsValue({ [dataIndex]: values?.quantity });
                    }
                    if (
                      !!item?.quantity &&
                      values["quantity"] > item?.quantity
                    ) {
                      values["quantity"] = item?.quantity;
                      form.setFieldsValue({ [dataIndex]: item?.quantity });
                    }
                    handleSave({ ...record, ...values });
                  } catch (errInfo) {
                    console.log("Save failed:", errInfo);
                  }
                }}
                style={{ width: 20, padding: 0 }}
              >
                +
              </Button>
            </div>
            <CurrencyFormat className="text-[10px]" value={record.price} />
          </div>
        </>
      );
    }

    return <td {...restProps}>{childNode}</td>;
  };

  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth <= 768);
    }
  }, []);

  const calculatePrice = (data: any, product?: any) => {
    let totalPriceNonPromotion = 0;
    let totalPrice = 0;
    let detailPromotion = [];
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
        setDataSourcePromotion(data);
        calculatePrice(data);
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  };

  const getProductList = (isLoading?: boolean) => {
    fetch(window.location.origin + "/api/products")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // แปลงข้อมูลเป็น JSON
      })
      .then((data) => {
        setProducts(data);
        setCurrentProduct(data);
        setIsLoading(false);
        if (isLoading) closeLoading();
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    getArtistList();
    getProductTypeList();
    getPromotionList();
    getProductList();
  }, []);

  const [form] = Form.useForm();
  const [currentProduct, setCurrentProduct] = useState([]);

  const onSearchChange = () => {
    const searchParam = form.getFieldsValue();
    let result = [...products];
    if (!!searchParam?.search) {
      result = [
        ...result.filter((product: any) =>
          product.productName
            .toLowerCase()
            .includes(searchParam?.search.toLowerCase())
        ),
      ];
    }
    if (searchParam?.artistId?.length > 0) {
      result = result.filter((item: any) =>
        searchParam?.artistId.includes(item.artistId)
      );
    }
    if (searchParam?.productTypeId?.length > 0) {
      result = result.filter((item: any) =>
        searchParam?.productTypeId.includes(item.productTypeId)
      );
    }
    setCurrentProduct(result);
  };

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

  const onSubmit = () => {
    AlertConfirm("ต้องการยืนยันคำสั่งซื้อนี้ใช่หรือไม่").then((res) => {
      if (res?.isConfirmed) {
        openLoading();
        fetch(window.location.origin + "/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            totalPrice: priceInCart,
            products: productInCart,
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Network response was not ok");
            }
            return response.json(); // แปลงข้อมูลเป็น JSON
          })
          .then(() => {
            fetch(window.location.origin + "/api/calculate-money", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                artistsData: artistsData,
                isDelete: false
              }),
            })
              .then((response) => {
                if (!response.ok) {
                  throw new Error("Network response was not ok");
                }
                return response.json(); // แปลงข้อมูลเป็น JSON
              })
              .then(() => {
                AlertSuccess("สั่งซื้อสินค้าสำเร็จ!").then(() => {
                  setProductInCart([]);
                  setArtistsData({});
                  setDataSource([]);
                  setDetailPayment({});
                  setPriceInCart(0);
                  getProductList(true);
                  form.resetFields();
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
  };

  const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
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
      align: "center",
      width: 80,
      render: (_: any, record: any) => (
        <>
          <img
            style={{ width: 70, height: 70 }}
            alt={record.productName}
            src={record.imageURL || "/assets/images/no-image.jpg"}
          />
        </>
      ),
    },
    {
      title: "จำนวนสินค้า",
      dataIndex: "quantity",
      key: "quantity",
      width: 120,
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
      width: 70,
      render: (_: any, record: any) => (
        <>
          <Button
            size="small"
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
    <>
      {isLoading ? (
        <Loading />
      ) : (
        <>
          {isMobile ? (
            // แสดง div สำหรับมือถือ
            <>
              <div style={{ padding: "10px" }}>
                {/* ชื่อหัวข้อของหน้า */}
                <Card className="mb-2 p-2" title="ช่องค้นหาสินค้า" size="small">
                  <Form
                    {...layout}
                    form={form}
                    onValuesChange={() => {
                      onSearchChange();
                    }}
                  >
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={24} md={24} lg={16}>
                        <Form.Item name="search" label="ชื่อสินค้า">
                          <Input placeholder="ชื่อสินค้า" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={24} md={24} lg={16}>
                        <Form.Item name="productTypeId" label="ประเภทของสินค้า">
                          <Select
                            mode="multiple"
                            showSearch
                            allowClear
                            style={{ width: "100%" }}
                            placeholder="ประเภทของสินค้า"
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
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={24} md={24} lg={16}>
                        <Form.Item name="artistId" label="นักวาด">
                          <Select
                            mode="multiple"
                            showSearch
                            allowClear
                            style={{ width: "100%" }}
                            placeholder="นักวาด"
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
                  </Form>
                </Card>

                {/* แสดงสินค้าในรูปแบบ Grid */}
                <Row gutter={[16, 16]}>
                  {currentProduct.map((product: any) => (
                    <Col xs={12} sm={12} md={6} lg={4} key={product._id}>
                      <Card
                        styles={{
                          body: {
                            maxHeight: 200, // สไตล์สำหรับ body ของการ์ด
                          },
                        }}
                        style={{
                          cursor:
                            product.quantity !== 0 ? "pointer" : "not-allowed",
                        }}
                        hoverable
                        cover={
                          <img
                            className="h-[230px]"
                            alt={product.productName}
                            src={product.imageURL || "/assets/images/no-image.jpg"}
                          />
                        } // ใส่ภาพสินค้า
                        onClick={() => {
                          if (product.quantity === 0) return;

                          const item = productInCart.find(
                            (item: any) => item._id === product._id
                          );

                          if (!!item) {
                            if (product.quantity === item.quantity) return;
                            // ถ้าเจอ item ที่มี id ตรงกับ targetId, อัพเดตค่าฟิลด์
                            Object.assign(item, {
                              ...product,
                              quantity: item.quantity + 1,
                            });
                          } else {
                            // ถ้าไม่เจอ item ที่มี id ตรงกับ targetId, เพิ่ม item ใหม่เข้าไปใน array
                            productInCart.push({
                              ...product,
                              quantity: 1,
                            });
                          }
                          setProductInCart(productInCart);
                        }}
                      >
                        <Card.Meta
                          title={product.productName}
                          description={
                            <>
                              <div className="text-black">
                                นักวาด : {product.artistName}
                              </div>
                              <div className="text-black">
                                ประเภทของสินค้า : {product.productTypeName}
                              </div>
                              <CurrencyFormat
                                className="text-red-500 text-[16px]"
                                value={product.price}
                              />
                              <br />
                              {product?.productTypeId !==
                                "67467e4267f91bd0117809d8" && (
                                <div className="float-right text-black">
                                  คงเหลือ {product.quantity}
                                </div>
                              )}
                            </>
                          }
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            </>
          ) : (
            <>
              <div className="flex" style={{ padding: "10px" }}>
                <div className="basis-3/4">
                  {/* ชื่อหัวข้อของหน้า */}
                  <Card
                    className="mb-2 p-2"
                    title="ช่องค้นหาสินค้า"
                    size="small"
                  >
                    <Form
                      {...layout}
                      form={form}
                      onValuesChange={() => {
                        onSearchChange();
                      }}
                    >
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={24} md={24} lg={16}>
                          <Form.Item name="search" label="ชื่อสินค้า">
                            <Input placeholder="ชื่อสินค้า" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={24} md={24} lg={16}>
                          <Form.Item
                            name="productTypeId"
                            label="ประเภทของสินค้า"
                          >
                            <Select
                              mode="multiple"
                              showSearch
                              allowClear
                              style={{ width: "100%" }}
                              placeholder="ประเภทของสินค้า"
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
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={24} md={24} lg={16}>
                          <Form.Item name="artistId" label="นักวาด">
                            <Select
                              mode="multiple"
                              showSearch
                              allowClear
                              style={{ width: "100%" }}
                              placeholder="นักวาด"
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
                    </Form>
                  </Card>

                  {/* แสดงสินค้าในรูปแบบ Grid */}
                  <Row gutter={[16, 16]}>
                    {currentProduct.map((product: any) => (
                      <Col xs={12} sm={12} md={6} lg={6} key={product._id}>
                        <Card
                          styles={{
                            body: {
                              maxHeight: 200, // สไตล์สำหรับ body ของการ์ด
                            },
                          }}
                          style={{
                            cursor:
                              product.quantity !== 0
                                ? "pointer"
                                : "not-allowed",
                          }}
                          hoverable
                          cover={
                            <img
                              className="h-[230px]"
                              alt={product.productName}
                              src={product.imageURL || "/assets/images/no-image.jpg"}
                            />
                          } // ใส่ภาพสินค้า
                          onClick={() => {
                            if (product.quantity === 0) return;

                            const item = productInCart.find(
                              (item: any) => item._id === product._id
                            );

                            if (!!item) {
                              if (product.quantity === item.quantity) return;
                              // ถ้าเจอ item ที่มี id ตรงกับ targetId, อัพเดตค่าฟิลด์
                              Object.assign(item, {
                                ...product,
                                quantity: item.quantity + 1,
                              });
                            } else {
                              // ถ้าไม่เจอ item ที่มี id ตรงกับ targetId, เพิ่ม item ใหม่เข้าไปใน array
                              productInCart.push({
                                ...product,
                                quantity: 1,
                              });
                            }
                            setProductInCart(productInCart);
                            calculatePrice(dataSourcePromotion, productInCart);
                            setDataSource(productInCart);
                            if (!item && scrollEl) {
                              setTimeout(() => {
                                scrollEl.scrollTop = scrollEl.scrollHeight;
                              }, 100);
                            }
                          }}
                        >
                          <Card.Meta
                            title={product.productName}
                            description={
                              <>
                                <div className="text-black">
                                  นักวาด : {product.artistName}
                                </div>
                                <div className="text-black">
                                  ประเภทของสินค้า : {product.productTypeName}
                                </div>
                                <CurrencyFormat
                                  className="text-red-500 text-[14px]"
                                  value={product.price}
                                />
                                <br />
                                {product?.productTypeId !==
                                  "67467e4267f91bd0117809d8" && (
                                  <div className="float-right text-black">
                                    คงเหลือ {product.quantity}
                                  </div>
                                )}
                              </>
                            }
                          />
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
                <div className="basis-1/4 ml-2 mr-2">
                  <Card
                    className="fixed h-[calc(100vh-85px)] w-1/4"
                    title="ตะกร้าสินค้า"
                    size="small"
                    styles={{
                      body: {
                        padding: 0, // สไตล์สำหรับ body ของการ์ด
                      },
                    }}
                  >
                    <div className="h-[calc(100vh-200px)]">
                      <div
                        style={{
                          height: "55%",
                          marginBottom: "1rem",
                        }}
                      >
                        <PerfectScrollbar
                          containerRef={(ref) => {
                            setScrollEl(ref);
                          }}
                          style={{
                            height: "100%",
                          }}
                        >
                          <Table
                            size="small"
                            components={components}
                            rowClassName={() => "editable-row"}
                            dataSource={dataSource}
                            columns={columns}
                            pagination={false}
                            showHeader={false}
                            rowKey="_id"
                          />
                        </PerfectScrollbar>
                      </div>
                      <span className="ml-3 mb-2 font-bold">รายละเอียด</span>
                      <div
                        style={{
                          height: "35%",
                        }}
                      >
                        <PerfectScrollbar
                          style={{
                            height: "100%",
                          }}
                        >
                          <Card className="mb-2" size="small">
                            {detailPayment?.totalPricePromotion?.length > 0 && (
                              <Row gutter={[16, 16]} key={"row-first"}>
                                {detailPayment?.totalPricePromotion?.map(
                                  (x: any) => (
                                    <>
                                      <Col span={18} className="text-[14px]">
                                        <span>
                                          {x.promotionName} จำนวน{" "}
                                          {x.setsAvailable} ชุด :{" "}
                                        </span>
                                      </Col>
                                      <Col span={6} className="text-[14px]">
                                        <span>
                                          <CurrencyFormat
                                            className="text-red-500"
                                            value={x.totalPrice || 0}
                                          />
                                        </span>
                                      </Col>
                                    </>
                                  )
                                )}
                              </Row>
                            )}
                            {detailPayment?.totalPriceNonPromotion > 0 && (
                              <Row
                                gutter={[16, 16]}
                                className="mt-[16px] mb-[16px]"
                              >
                                <Col span={18} className="text-[14px]">
                                  <span>ราคาสินค้าอื่นๆ : </span>
                                </Col>
                                <Col span={6} className="text-[14px]">
                                  <span>
                                    <CurrencyFormat
                                      className="text-red-500"
                                      value={
                                        detailPayment?.totalPriceNonPromotion ||
                                        0
                                      }
                                    />
                                  </span>
                                </Col>
                              </Row>
                            )}
                          </Card>
                        </PerfectScrollbar>
                      </div>
                    </div>
                    <div className="fixed bottom-7 right-6">
                      <span className="text-[14px]">รวม</span>
                      <span className="text-[14px] text-red-500 ml-2">
                        <CurrencyFormat value={priceInCart || 0} />
                      </span>
                      <Button
                        type="primary"
                        className="ml-2"
                        onClick={() => {
                          if (productInCart?.length > 0) onSubmit();
                          else {
                            AlertError(
                              "กรุณาเพิ่มสินค้าลงรถเข็นอย่างน้อย 1 ชิ้น"
                            ).then(() => {});
                          }
                        }}
                      >
                        สั่งซื้อสินค้า
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
