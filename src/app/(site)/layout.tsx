import Sidebar from "@/components/shell/Sidebar";
import BottomNav from "@/components/shell/BottomNav";
import CartPanel from "@/components/cart/CartPanel";
import FloatingWhatsApp from "@/components/shell/FloatingWhatsApp";
import Toast from "@/components/shell/Toast";
import ItemSheet from "@/components/food/ItemSheet";
import ExtrasModal from "@/components/food/ExtrasModal";
import SiteFrame from "@/components/shell/SiteFrame";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Sidebar />
      <SiteFrame>
        <main className="pb-32 lg:pb-12">{children}</main>
      </SiteFrame>
      <CartPanel />
      <BottomNav />
      <FloatingWhatsApp />
      <ItemSheet />
      <ExtrasModal />
      <Toast />
    </>
  );
}
