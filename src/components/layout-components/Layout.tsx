"use client";
import { Badge, Button, Layout, Menu, MenuProps } from "antd";
import { Content, Footer, Header } from "antd/es/layout/layout";
import { ReactElement, ReactNode, useEffect, useState } from "react";
import {
  ProductOutlined,
  HomeOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import useStore from "@/src/store/store";
import usePriceStore from "@/src/store/price-in-cart-store";
import CurrencyFormat from "../util-components/CurrencyFormat";
import {
  AlertConfirm,
  AlertError,
  AlertSuccess,
} from "../util-components/AlertConfirm";
import { closeLoading, openLoading } from "../util-components/pageLoading";
import useDataArtistStore from "@/src/store/data-artist-store";

interface Props {
  children: ReactNode;
}

export default function LayoutComponent({ children }: Props): ReactElement {
  const { priceInCart } = usePriceStore();
  const { productInCart, setProductInCart } = useStore();
  const { artistsData, setArtistsData } = useDataArtistStore();
  const router = useRouter();
  const pathname = usePathname();
  const showFooter = pathname === "/stock/cart";
  const items: any[] = [
    {
      label: "Home",
      key: "home",
      icon: <HomeOutlined />,
    },
    {
      label: "Product Setting",
      key: "product-setting",
      icon: <ProductOutlined />,
    },
    {
      label: "Promotion Setting",
      key: "promotion-setting",
      icon: <DollarOutlined />,
    },
    {
      label: "Master Setting",
      key: "master-setting",
      icon: <SettingOutlined />,
    },
    {
      label: "Order",
      key: "order",
      icon: <FileTextOutlined />,
    },
    {
      label: "Order Setting",
      key: "order-setting",
      icon: <FileTextOutlined />,
    },
  ];

  const [current, setCurrent] = useState<any>("home");

  const onClick: MenuProps["onClick"] = (e) => {
    setCurrent(e.key === "dashboard-artist" ? "home" : e.key);
    router.push(e.key, { scroll: false });
  };

  useEffect(() => {
    const length = pathname.length || 0;
    if (length > 0 && pathname.indexOf("/stock") > -1) {
      setCurrent(pathname.substring(9, length));
    }
  }, []);

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
                closeLoading();
                AlertSuccess("สั่งซื้อสินค้าสำเร็จ!").then(() => {
                  router.replace("/stock/home");
                  setProductInCart([]);
                  setArtistsData({});
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

  return (
    <>
      <Layout>
        <Header className="header bg-white">
          <div className="header-box">
            <Menu
              style={{ flex: 1 }}
              onClick={onClick}
              selectedKeys={[current]}
              mode="horizontal"
              items={items}
            />

            <Button
              onClick={() => {
                setCurrent(null);
                router.push("cart", { scroll: false });
              }}
              color="default"
              variant="link"
              className="mr-2 text-[16px]"
            >
              {productInCart?.length > 0 ? (
                <Badge
                  overflowCount={999}
                  count={productInCart.reduce(
                    (sum: any, item: any) => sum + item.quantity,
                    0
                  )}
                >
                  <ShoppingCartOutlined />
                </Badge>
              ) : (
                <ShoppingCartOutlined />
              )}
            </Button>
          </div>
        </Header>
        <Content
          style={{ backgroundColor: "rgb(216 216 216)", paddingBottom: 80 }}
        >
          {children}
        </Content>
        {showFooter && (
          <Footer
            className="footer-layout"
            style={{
              position: "fixed",
              bottom: 0,
              width: "100%",
              textAlign: "center",
            }}
          >
            <div className="float-right">
              <span className="text-[18px]">รวม</span>
              <span className="text-[18px] text-red-500 ml-2">
                <CurrencyFormat value={priceInCart || 0} />
              </span>
              <Button
                type="primary"
                className="ml-2"
                onClick={() => {
                  if (productInCart?.length > 0) onSubmit();
                  else {
                    AlertError("กรุณาเพิ่มสินค้าลงรถเข็นอย่างน้อย 1 ชิ้น").then(
                      () => {}
                    );
                  }
                }}
              >
                สั่งซื้อสินค้า
              </Button>
            </div>
          </Footer>
        )}
      </Layout>
    </>
  );
}
