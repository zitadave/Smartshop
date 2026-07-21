import { useCallback } from 'react';
import { useStore } from '@/stores/AppStore';
import type { Product, ToastType } from '@/types';
import { toast } from '@/components/Toast';

export function useCart() {
  const { cart, addToCart, removeFromCart, updateCartQty, clearCart, getCartCount, getCartTotal } = useStore();

  const add = useCallback((product: Product, qty = 1) => {
    addToCart(product, qty);
    toast(`🛒 ${product.nameEn} added`, 'cart');
  }, [addToCart]);

  const remove = useCallback((id: number) => {
    removeFromCart(id);
    toast('Item removed', 'info');
  }, [removeFromCart]);

  const updateQty = useCallback((id: number, qty: number) => {
    updateCartQty(id, qty);
  }, [updateCartQty]);

  return {
    items: cart,
    count: getCartCount(),
    total: getCartTotal(),
    add,
    remove,
    updateQty,
    clear: clearCart,
  };
}
