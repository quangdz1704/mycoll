import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getStore } from '../services/store.service';
import { getProducts } from '../services/products.service';
import { getCategories } from '../services/categories.service';
import { errorMessage } from '../utils/format';

export function useStoreData(admin = false) {
  const store = useQuery({ queryKey: ['store'], queryFn: getStore });
  const scope = admin ? 'admin' : 'public';
  const products = useQuery({ queryKey: [scope, 'products', store.data?.id], queryFn: () => getProducts(store.data!.id, admin), enabled: !!store.data });
  const categories = useQuery({ queryKey: [scope, 'categories', store.data?.id], queryFn: () => getCategories(store.data!.id, admin), enabled: !!store.data });
  return { store, products, categories, loading: store.isPending || products.isPending || categories.isPending,
    error: store.error || products.error || categories.error, retry: () => { void store.refetch(); void products.refetch(); void categories.refetch(); } };
}
export function useStoreMutation<T>(action: (input: T) => Promise<unknown>, message: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: action,
    onSuccess: async () => {
      await Promise.all(['store', 'public', 'admin'].map(key => client.invalidateQueries({ queryKey: [key] })));
      toast.success(message);
    },
    onError: error => toast.error(errorMessage(error)),
  });
}
