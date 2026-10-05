import { Modal } from "../shared/Dialogs";
import { useState, type FormEvent } from "react";
import { useStoreMutation } from "../../hooks/useStoreData";
import { saveProduct } from "../../services/products.service";
import {
  uploadImage,
  removeUploadedImage,
} from "../../services/storage.service";
import { productSchema } from "../../lib/validation";
import type { Product, ProductInput, Category } from "../../types";
import {
  platformLabels,
  errorMessage,
  isRejectedWrite,
} from "../../utils/format";
import { Spinner } from "../shared/Ui";
import ImagePicker from "./ImagePicker";

export default function ProductForm({
  product,
  storeId,
  categories,
  onClose,
}: {
  product: Product | null;
  storeId: string;
  categories: Category[];
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");
  const mutation = useStoreMutation(
    async (values: ProductInput) => {
      let uploaded: Awaited<ReturnType<typeof uploadImage>> | null = null;
      try {
        if (file) {
          setStage("Đang nén và tải ảnh…");
          uploaded = await uploadImage(file, storeId, "product-images");
          values = { ...values, image_url: uploaded.url };
        }
        setStage("Đang lưu sản phẩm…");
        await saveProduct(values, product?.id);
      } catch (error) {
        if (uploaded && isRejectedWrite(error))
          await removeUploadedImage(uploaded.bucket, uploaded.path).catch(
            () => {},
          );
        throw error;
      } finally {
        setStage("");
      }
    },
    product ? "Đã cập nhật sản phẩm" : "Đã thêm sản phẩm",
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const number = (key: string) =>
      String(form.get(key)).trim() === "" ? null : Number(form.get(key));
    const parsed = productSchema.safeParse({
      store_id: storeId,
      name: form.get("name"),
      affiliate_url: form.get("affiliate_url"),
      image_url: product?.image_url || null,
      category_id: form.get("category_id"),
      platform: form.get("platform"),
      price: number("price"),
      original_price: number("original_price"),
      tags: String(form.get("tags"))
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      sort_order: Number(form.get("sort_order")),
      is_pinned: form.get("is_pinned") === "on",
      is_active: form.get("is_active") === "on",
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    try {
      await mutation.mutateAsync(parsed.data);
      onClose();
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  const busy = mutation.isPending;
  return (
    <Modal
      open
      onClose={onClose}
      busy={busy}
      title={product ? "Chỉnh sửa sản phẩm" : "Thêm một món đồ hay"}
      description="Điền thông tin và link affiliate. Khách sẽ mở trực tiếp link này từ cửa hàng."
    >
      <form onSubmit={(event) => void submit(event)}>
        <fieldset disabled={busy} className="form-fields">
          <ImagePicker
            existing={product?.image_url || null}
            file={file}
            onChange={setFile}
            disabled={busy}
          />
          <label className="field">
            Tên sản phẩm <span>*</span>
            <input
              name="name"
              defaultValue={product?.name}
              placeholder="Ví dụ: Bình gốm cho góc nhà xinh"
              required
              maxLength={200}
            />
          </label>
          <label className="field">
            Link affiliate <span>*</span>
            <input
              name="affiliate_url"
              type="url"
              defaultValue={product?.affiliate_url}
              placeholder="https://shope.ee/..."
              required
              maxLength={2048}
            />
          </label>
          <div className="form-row">
            <label className="field">
              Danh mục <span>*</span>
              <select
                name="category_id"
                defaultValue={product?.category_id || ""}
                required
              >
                <option value="" disabled>
                  Chọn danh mục
                </option>
                {categories.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                    {!c.is_active ? " (đang ẩn)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Nền tảng <span>*</span>
              <select
                name="platform"
                defaultValue={product?.platform || "shopee"}
              >
                {Object.entries(platformLabels).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label className="field">
              Giá hiện tại (₫)
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="Không bắt buộc"
                defaultValue={product?.price ?? ""}
              />
            </label>
            <label className="field">
              Giá gốc (₫)
              <input
                name="original_price"
                type="number"
                min="0"
                step="0.01"
                placeholder="Không bắt buộc"
                defaultValue={product?.original_price ?? ""}
              />
            </label>
          </div>
          <label className="field">
            Từ khóa tìm kiếm
            <input
              name="tags"
              defaultValue={product?.tags.join(", ")}
              placeholder="decor, bình hoa, gốm"
            />
            <small>
              Ngăn cách bằng dấu phẩy. Khách có thể tìm theo những từ khóa này.
            </small>
          </label>
          <label className="field">
            Thứ tự hiển thị
            <input
              name="sort_order"
              type="number"
              min="0"
              max="1000000"
              required
              defaultValue={product?.sort_order || 0}
            />
            <small>Số nhỏ hơn hiển thị trước. Sản phẩm ghim luôn ở đầu.</small>
          </label>
          <div className="check-row">
            <label>
              <input
                name="is_pinned"
                type="checkbox"
                defaultChecked={product?.is_pinned || false}
              />
              Ghim sản phẩm
            </label>
            <label>
              <input
                name="is_active"
                type="checkbox"
                defaultChecked={product?.is_active ?? true}
              />
              Hiển thị trên cửa hàng
            </label>
          </div>
        </fieldset>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            className="button primary"
            disabled={busy || !categories.length}
          >
            {busy && <Spinner />}
            {stage || "Lưu sản phẩm"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
