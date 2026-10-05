import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  CircleCheck,
  Tags,
  MousePointer2,
  Plus,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { useStoreData } from "../../hooks/useStoreData";
import { getAnalytics } from "../../services/analytics.service";
import { ErrorState, Loading, Empty, Photo } from "../../components/shared/Ui";
export default function Dashboard() {
  const data = useStoreData(true);
  const analytics = useQuery({
    queryKey: ["admin", "analytics", data.store.data?.id],
    queryFn: () => getAnalytics(data.store.data!.id),
    enabled: !!data.store.data,
  });
  if (data.error || analytics.error)
    return (
      <ErrorState
        retry={() => {
          data.retry();
          void analytics.refetch();
        }}
      />
    );
  if (data.loading || analytics.isPending) return <Loading />;
  const products = data.products.data || [];
  const metrics = [
    {
      label: "Tổng sản phẩm",
      value: products.length,
      icon: Package,
      color: "peach",
    },
    {
      label: "Đang hiển thị",
      value: products.filter(
        (p) =>
          p.is_active &&
          data.categories.data?.some(
            (c) => c.id === p.category_id && c.is_active,
          ),
      ).length,
      icon: CircleCheck,
      color: "green",
    },
    {
      label: "Danh mục",
      value: data.categories.data?.length || 0,
      icon: Tags,
      color: "purple",
    },
    {
      label: "Lượt click",
      value: analytics.data?.total_clicks || 0,
      icon: MousePointer2,
      color: "blue",
    },
  ];
  return (
    <>
      <header className="admin-page-header">
        <div>
          <span className="eyebrow">MỘT NGÀY MỚI, MỘT ĐIỀU HAY</span>
          <h1>
            Chào bạn, chủ nhà <span className="wave">✦</span>
          </h1>
          <p>Đây là những gì đang diễn ra tại {data.store.data?.name}.</p>
        </div>
        <Link className="button primary" to="/admin/products">
          <Plus size={17} />
          Thêm sản phẩm
        </Link>
      </header>
      <div className="metrics-grid">
        {metrics.map((metric) => (
          <div className="metric-card" key={metric.label}>
            <span className={`metric-icon ${metric.color}`}>
              <metric.icon size={22} />
            </span>
            <span>{metric.label}</span>
            <strong>{metric.value.toLocaleString("vi-VN")}</strong>
          </div>
        ))}
      </div>
      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>Sản phẩm được quan tâm</h2>
            <p>5 sản phẩm có nhiều lượt click nhất, từ trước đến nay.</p>
          </div>
          <MousePointer2 size={20} />
        </div>
        {analytics.data?.top_products.length ? (
          <div className="top-products">
            {analytics.data.top_products.map((product, index) => (
              <div className="top-product" key={product.id}>
                <span className="rank">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Photo src={product.image_url} alt={product.name} />
                <span>{product.name}</span>
                <strong>
                  {product.clicks.toLocaleString("vi-VN")} <small>click</small>
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title="Những lượt click đầu tiên đang chờ bạn"
            description="Chia sẻ link cửa hàng lên TikTok bio. Thống kê sẽ xuất hiện khi khách mở sản phẩm."
          />
        )}
      </section>
      <section className="admin-tip">
        <span className="tip-icon">
          <Sparkles size={24} />
        </span>
        <div>
          <h3>Góc nhỏ đã sẵn sàng đón khách</h3>
          <p>
            Thêm những món đồ bạn yêu thích, ghim sản phẩm nổi bật và chia sẻ
            cửa hàng của mình.
          </p>
        </div>
        <Link to="/" target="_blank" className="button secondary">
          Xem cửa hàng
          <ArrowUpRight size={17} />
        </Link>
      </section>
    </>
  );
}
