import { ArrowUpRight, Pin, ShoppingBag } from "lucide-react";
import type { Product } from "../../types";
import { httpUrl, money, platformLabels } from "../../utils/format";
import { trackClick } from "../../services/analytics.service";
import { Photo } from "../shared/Ui";
export default function ProductCard({ product }: { product: Product }) {
  const url = httpUrl(product.affiliate_url);
  const discount =
    product.price !== null &&
    product.original_price &&
    product.original_price > product.price
      ? Math.round((1 - product.price / product.original_price) * 100)
      : 0;
  const track = () => {
    if (url)
      void trackClick(product.id).catch(() => {
        /* A failed event must never block the affiliate link. */
      });
  };
  return (
    <a
      className={`product-card ${!url ? "unavailable" : ""}`}
      href={url || undefined}
      target="_blank"
      rel="sponsored noopener noreferrer"
      aria-label={`${product.name} — ${url ? `Xem trên ${platformLabels[product.platform]}` : "Link đang cập nhật"}`}
      onClick={track}
      onAuxClick={(event) => {
        if (event.button === 1) track();
      }}
    >
      <div className="product-image-wrap">
        <Photo
          src={product.image_url}
          alt={product.name}
          className="product-image"
        />
        {product.is_pinned && (
          <span className="pin-badge">
            <Pin size={11} fill="currentColor" />
            Chủ nhà chọn
          </span>
        )}
        {discount > 0 && <span className="discount-badge">−{discount}%</span>}
      </div>
      <div className="product-info">
        <span className={`platform-label ${product.platform}`}>
          <ShoppingBag size={11} />
          {platformLabels[product.platform]}
        </span>
        <h3>{product.name}</h3>
        <div className="product-price">
          {product.price !== null ? (
            <strong>{money(product.price)}</strong>
          ) : (
            <span className="no-price">Xem giá tại cửa hàng</span>
          )}
          {product.original_price !== null &&
            product.price !== null &&
            product.original_price > product.price && (
              <del>{money(product.original_price)}</del>
            )}
        </div>
        <span className="product-cta">
          {url ? "Xem sản phẩm" : "Link đang cập nhật"}
          <ArrowUpRight size={15} />
        </span>
      </div>
    </a>
  );
}
