import { Confirm } from "../../components/shared/Dialogs";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Pin, PinOff } from "lucide-react";
import type { Product } from "../../types";
import { useStoreData, useStoreMutation } from "../../hooks/useStoreData";
import { patchProduct, deleteProduct } from "../../services/products.service";
import { filterProducts } from "../../utils/products";
import { money, platformLabels } from "../../utils/format";
import {
  Loading,
  ErrorState,
  Empty,
  Photo,
  Toggle,
} from "../../components/shared/Ui";
import ProductForm from "../../components/admin/ProductForm";
import { Link } from "react-router-dom";
export default function Products() {
  const data = useStoreData(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const toggle = useStoreMutation(
    ({
      id,
      values,
    }: {
      id: string;
      values: Pick<Partial<Product>, "is_active" | "is_pinned">;
    }) => patchProduct(id, values),
    "Đã cập nhật sản phẩm",
  );
  const remove = useStoreMutation(deleteProduct, "Đã xóa sản phẩm");
  const visible = useMemo(
    () =>
      filterProducts(data.products.data || [], search, category).filter(
        (p) => platform === "all" || p.platform === platform,
      ),
    [data.products.data, search, category, platform],
  );
  if (data.error) return <ErrorState retry={data.retry} />;
  if (data.loading) return <Loading label="Đang tải sản phẩm…" />;
  const categories = data.categories.data || [];
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));
  return (
    <>
      <header className="admin-page-header">
        <div>
          <span className="eyebrow">CHỌN LỌC BẰNG SỰ YÊU THÍCH</span>
          <h1>
            Sản phẩm{" "}
            <span className="heading-count">{data.products.data?.length}</span>
          </h1>
          <p>Quản lý những món đồ bạn muốn chia sẻ.</p>
        </div>
        <button
          className="button primary"
          disabled={!categories.length}
          onClick={() => setEditing(null)}
        >
          <Plus size={17} />
          Thêm sản phẩm
        </button>
      </header>
      {!categories.length && (
        <div className="notice">
          Tạo danh mục trước để thêm sản phẩm.{" "}
          <Link to="/admin/categories">Đến danh mục →</Link>
        </div>
      )}
      <section className="admin-panel">
        <div className="admin-filters">
          <label className="search-box">
            <Search size={18} />
            <input
              aria-label="Tìm sản phẩm quản trị"
              placeholder="Tìm sản phẩm…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            aria-label="Lọc danh mục"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Lọc nền tảng"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="all">Tất cả nền tảng</option>
            {Object.entries(platformLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {visible.length ? (
          <div className="product-management">
            <div className="management-header">
              <span>Sản phẩm</span>
              <span>Danh mục</span>
              <span>Giá</span>
              <span>Ghim</span>
              <span>Hiển thị</span>
              <span>Thao tác</span>
            </div>
            {visible.map((product) => (
              <div className="management-row" key={product.id}>
                <div className="management-product">
                  <Photo src={product.image_url} alt={product.name} />
                  <div>
                    <strong>{product.name}</strong>
                    <span className={`platform-label ${product.platform}`}>
                      {platformLabels[product.platform]}
                    </span>
                  </div>
                </div>
                <span className="cell-category">
                  {categoryNames.get(product.category_id)}
                </span>
                <span className="cell-price">
                  {product.price !== null ? money(product.price) : "—"}
                </span>
                <button
                  className={`icon-button pin-button ${product.is_pinned ? "selected" : ""}`}
                  aria-label={`${product.is_pinned ? "Bỏ ghim" : "Ghim"} ${product.name}`}
                  aria-pressed={product.is_pinned}
                  disabled={toggle.isPending}
                  onClick={() =>
                    toggle.mutate({
                      id: product.id,
                      values: { is_pinned: !product.is_pinned },
                    })
                  }
                >
                  {product.is_pinned ? (
                    <Pin size={17} fill="currentColor" />
                  ) : (
                    <PinOff size={17} />
                  )}
                </button>
                <Toggle
                  checked={product.is_active}
                  disabled={toggle.isPending}
                  label={`Hiển thị ${product.name}`}
                  onChange={() =>
                    toggle.mutate({
                      id: product.id,
                      values: { is_active: !product.is_active },
                    })
                  }
                />
                <div className="row-actions">
                  <button
                    className="icon-button"
                    aria-label={`Sửa ${product.name}`}
                    onClick={() => setEditing(product)}
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    className="icon-button delete-button"
                    aria-label={`Xóa ${product.name}`}
                    onClick={() => setDeleting(product)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title={
              data.products.data?.length
                ? "Không tìm thấy sản phẩm phù hợp"
                : "Bạn chưa thêm sản phẩm nào"
            }
            description="Những món đồ hay đang chờ được chia sẻ."
          >
            {categories.length > 0 && (
              <button
                className="button primary"
                onClick={() => setEditing(null)}
              >
                <Plus size={16} />
                Thêm sản phẩm đầu tiên
              </button>
            )}
          </Empty>
        )}
        <div className="table-footer">
          {visible.length} sản phẩm · Sản phẩm ghim được ưu tiên hiển thị
        </div>
      </section>
      {editing !== undefined && (
        <ProductForm
          key={editing?.id || "new"}
          product={editing}
          storeId={data.store.data!.id}
          categories={categories}
          onClose={() => setEditing(undefined)}
        />
      )}
      <Confirm
        open={!!deleting}
        title="Xóa sản phẩm này?"
        description={`“${deleting?.name || ""}” sẽ bị xóa cùng lịch sử click. Bạn có thể tắt hiển thị nếu muốn giữ dữ liệu.`}
        busy={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting)
            remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
        }}
      />
    </>
  );
}
