import "../../globals.css"
import LayoutComponent from "@/src/components/layout-components/Layout";

export const metadata = {
  title: "Stock",
  description: "Stock Management",
};

export default function SubLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LayoutComponent>{children}</LayoutComponent>
    </>
  );
}
