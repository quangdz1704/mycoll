import { Modal, Confirm } from '../../components/shared/Dialogs';
import { useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, GripVertical, Tags } from 'lucide-react';
import type { Category, CategoryInput } from '../../types';
import { categorySchema } from '../../lib/validation';
import { saveCategory, deleteCategory } from '../../services/categories.service';
import { useStoreData, useStoreMutation } from '../../hooks/useStoreData';
import { slugify, errorMessage } from '../../utils/format';
import { Spinner, Loading, ErrorState, Empty, Toggle } from '../../components/shared/Ui';
function CategoryForm({ category, storeId, onClose }: { category: Category | null; storeId: string; onClose: () => void }) {
  const [name, setName] = useState(category?.name || '');
  const [slug, setSlug] = useState(category?.slug || '');
  const [customSlug, setCustomSlug] = useState(!!category);
  const [error, setError] = useState('');
  const mutation = useStoreMutation((values: CategoryInput) => saveCategory(values, category?.id), category ? 'Đã cập nhật danh mục' : 'Đã thêm danh mục');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    const parsed = categorySchema.safeParse({ store_id: storeId, name, slug, sort_order: Number(form.get('sort_order')), is_active: form.get('is_active') === 'on' });
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    try { await mutation.mutateAsync(parsed.data); onClose(); } catch (error) { setError(errorMessage(error)); }
  }
  return <Modal open title={category ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'} description="Giúp khách tìm được món đồ cần thiết nhanh hơn." onClose={onClose} busy={mutation.isPending}><form onSubmit={e => void submit(e)}><fieldset className="form-fields" disabled={mutation.isPending}><label className="field">Tên danh mục *<input value={name} onChange={e => { setName(e.target.value); if (!customSlug) setSlug(slugify(e.target.value)); }} required maxLength={80} placeholder="Ví dụ: Đồ bếp" /></label><label className="field">Slug<input value={slug} onChange={e => { setSlug(e.target.value); setCustomSlug(true); }} required maxLength={100} placeholder="do-bep" /></label><label className="field">Thứ tự hiển thị<input name="sort_order" type="number" min="0" max="1000000" required defaultValue={category?.sort_order || 0} /></label><label className="checkbox-label"><input name="is_active" type="checkbox" defaultChecked={category?.is_active ?? true} />Hiển thị danh mục</label><small className="muted">Ẩn danh mục sẽ ẩn các sản phẩm bên trong khỏi storefront.</small></fieldset>{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><button type="button" className="button secondary" disabled={mutation.isPending} onClick={onClose}>Hủy</button><button className="button primary" disabled={mutation.isPending}>{mutation.isPending && <Spinner />}Lưu danh mục</button></div></form></Modal>;
}
export default function Categories() {
  const data = useStoreData(true);
  const [editing, setEditing] = useState<Category | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const toggle = useStoreMutation((category: Category) => saveCategory({ ...category, is_active: !category.is_active }, category.id), 'Đã cập nhật danh mục');
  const remove = useStoreMutation(deleteCategory, 'Đã xóa danh mục');
  if (data.error) return <ErrorState retry={data.retry} />;
  if (data.loading) return <Loading />;
  const counts = new Map<string, number>();
  for (const product of data.products.data || []) counts.set(product.category_id, (counts.get(product.category_id) || 0) + 1);
  const inUse = deleting ? counts.get(deleting.id) || 0 : 0;
  return <><header className="admin-page-header"><div><span className="eyebrow">MỖI MÓN ĐỒ, MỘT GÓC RIÊNG</span><h1>Danh mục <span className="heading-count">{data.categories.data?.length}</span></h1><p>Sắp xếp cửa hàng gọn gàng, tìm kiếm dễ dàng.</p></div><button className="button primary" onClick={() => setEditing(null)}><Plus size={17} />Thêm danh mục</button></header><section className="admin-panel">{data.categories.data?.length ? <div className="category-list">{data.categories.data.map(category => <div className="category-row" key={category.id}><span className="category-order" title={`Thứ tự: ${category.sort_order}`}><GripVertical size={17} /><small>{category.sort_order}</small></span><span className="category-symbol"><Tags size={20} /></span><div className="category-info"><strong>{category.name}</strong><small>/{category.slug} · {counts.get(category.id) || 0} sản phẩm</small></div><Toggle label={`Hiển thị ${category.name}`} checked={category.is_active} disabled={toggle.isPending} onChange={() => toggle.mutate(category)} /><div className="row-actions"><button className="icon-button" aria-label={`Sửa ${category.name}`} onClick={() => setEditing(category)}><Pencil size={17} /></button><button className="icon-button delete-button" aria-label={`Xóa ${category.name}`} onClick={() => setDeleting(category)}><Trash2 size={17} /></button></div></div>)}</div> : <Empty title="Cửa hàng cần những góc nhỏ" description="Thêm danh mục đầu tiên để bắt đầu đăng sản phẩm."><button className="button primary" onClick={() => setEditing(null)}><Plus size={16} />Thêm danh mục đầu tiên</button></Empty>}</section>{editing !== undefined && <CategoryForm key={editing?.id || 'new'} category={editing} storeId={data.store.data!.id} onClose={() => setEditing(undefined)} />}{inUse > 0 ? <Modal open={!!deleting} title="Danh mục đang có sản phẩm" description={`“${deleting?.name}” có ${inUse} sản phẩm. Chuyển chúng sang danh mục khác hoặc xóa sản phẩm trước. Bạn cũng có thể tắt hiển thị danh mục.`} onClose={() => setDeleting(null)}><div className="form-actions"><button className="button primary" onClick={() => setDeleting(null)}>Đã hiểu</button></div></Modal> : <Confirm open={!!deleting} title="Xóa danh mục?" description={`Danh mục “${deleting?.name || ''}” sẽ bị xóa vĩnh viễn.`} busy={remove.isPending} onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting) remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) }); }} />}</>;
}
