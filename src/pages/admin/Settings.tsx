import { useState, type FormEvent } from "react";
import { Save, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Store, StoreInput } from "../../types";
import { useQuery } from "@tanstack/react-query";
import { useStoreMutation } from "../../hooks/useStoreData";
import { getStore, updateStore } from "../../services/store.service";
import {
  uploadImage,
  removeUploadedImage,
} from "../../services/storage.service";
import { storeSchema } from "../../lib/validation";
import { errorMessage, isRejectedWrite } from "../../utils/format";
import {
  Photo,
  Loading,
  ErrorState,
  Spinner,
} from "../../components/shared/Ui";
import ImagePicker from "../../components/admin/ImagePicker";
function SettingsForm({ store }: { store: Store }) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState(store.name);
  const [bio, setBio] = useState(store.bio || "");
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");
  const mutation = useStoreMutation(async (values: StoreInput) => {
    let uploaded: Awaited<ReturnType<typeof uploadImage>> | null = null;
    try {
      if (file) {
        setStage("Đang tải ảnh…");
        uploaded = await uploadImage(file, store.id, "store-assets");
        values = { ...values, avatar_url: uploaded.url };
      }
      setStage("Đang lưu…");
      await updateStore(store.id, values);
      setFile(null);
    } catch (error) {
      if (uploaded && isRejectedWrite(error))
        await removeUploadedImage(uploaded.bucket, uploaded.path).catch(
          () => {},
        );
      throw error;
    } finally {
      setStage("");
    }
  }, "Đã cập nhật cửa hàng");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const parsed = storeSchema.safeParse({
      name,
      bio,
      avatar_url: store.avatar_url,
      tiktok_url: form.get("tiktok_url"),
      facebook_url: form.get("facebook_url"),
      instagram_url: form.get("instagram_url"),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    try {
      await mutation.mutateAsync(parsed.data);
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  return (
    <div className="settings-layout">
      <form
        className="admin-panel settings-form"
        onSubmit={(e) => void submit(e)}
      >
        <div className="panel-heading">
          <div>
            <h2>Thông tin cửa hàng</h2>
            <p>Một lời chào nhỏ đến những người ghé thăm.</p>
          </div>
        </div>
        <fieldset className="form-fields" disabled={mutation.isPending}>
          <ImagePicker
            avatar
            existing={store.avatar_url}
            file={file}
            onChange={setFile}
            disabled={mutation.isPending}
          />
          <label className="field">
            Tên cửa hàng *
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </label>
          <label className="field">
            Giới thiệu ngắn
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={3}
            />
            <small>{bio.length}/300 ký tự</small>
          </label>
          <div className="form-divider">KẾT NỐI MẠNG XÃ HỘI</div>
          <label className="field">
            TikTok
            <input
              name="tiktok_url"
              type="url"
              defaultValue={store.tiktok_url || ""}
              placeholder="https://www.tiktok.com/@..."
              maxLength={2048}
            />
          </label>
          <label className="field">
            Facebook
            <input
              name="facebook_url"
              type="url"
              defaultValue={store.facebook_url || ""}
              placeholder="https://www.facebook.com/..."
              maxLength={2048}
            />
          </label>
          <label className="field">
            Instagram
            <input
              name="instagram_url"
              type="url"
              defaultValue={store.instagram_url || ""}
              placeholder="https://www.instagram.com/..."
              maxLength={2048}
            />
          </label>
        </fieldset>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button className="button primary" disabled={mutation.isPending}>
            {mutation.isPending ? <Spinner /> : <Save size={16} />}
            {stage || "Lưu thay đổi"}
          </button>
        </div>
      </form>
      <aside>
        <section className="settings-preview">
          <span className="eyebrow">XEM TRƯỚC PROFILE</span>
          <Photo
            src={store.avatar_url}
            alt="Ảnh đại diện cửa hàng"
            className="avatar"
          />
          <h2>{name || "Tên cửa hàng"}</h2>
          <p>{bio || "Lời chào của bạn sẽ hiển thị ở đây."}</p>
          <span className="preview-note">Ảnh mới hiển thị sau khi lưu</span>
        </section>
        <p className="settings-note">
          Các thay đổi được cập nhật trên storefront sau khi lưu.
        </p>
      </aside>
    </div>
  );
}
export default function Settings() {
  const store = useQuery({ queryKey: ["store"], queryFn: getStore });
  if (store.error) return <ErrorState retry={() => void store.refetch()} />;
  if (store.isPending) return <Loading />;
  return (
    <>
      <header className="admin-page-header">
        <div>
          <span className="eyebrow">CHÚT CÁ TÍNH CỦA CHỦ NHÀ</span>
          <h1>Cửa hàng của bạn</h1>
          <p>Chăm chút profile và những kết nối của mình.</p>
        </div>
        <Link to="/" target="_blank" className="button secondary">
          Xem cửa hàng
          <ArrowUpRight size={17} />
        </Link>
      </header>
      <SettingsForm store={store.data} />
    </>
  );
}
