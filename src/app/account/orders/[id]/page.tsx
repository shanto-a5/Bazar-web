import { OrderDetail } from "./order-detail";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const { id } = await params;
  const { placed } = await searchParams;

  return <OrderDetail id={id} placed={placed === "1"} />;
}
