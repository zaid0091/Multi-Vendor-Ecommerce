import React, { createContext, useContext, useState, useEffect } from 'react'
import { cartAPI } from '../api'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchCart = async () => {
    if (!user || user.role !== 'customer') return
    try {
      setLoading(true)
      const { data } = await cartAPI.get()
      setCart(data)
    } catch {
      setCart(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Wait until auth has finished resolving before deciding to fetch or clear.
    // Without this guard, the context sees user=null on first render and skips
    // the fetch — so cart is empty after a page refresh even though the user
    // is still logged in.
    if (authLoading) return
    if (!user || user.role !== 'customer') {
      setCart(null)
      return
    }
    fetchCart()
  }, [user, authLoading])

  const addToCart = async (product_id, quantity = 1) => {
    await cartAPI.add(product_id, quantity)
    await fetchCart()
  }

  const updateItem = async (item_id, quantity) => {
    await cartAPI.update(item_id, quantity)
    await fetchCart()
  }

  const removeItem = async (item_id) => {
    await cartAPI.remove(item_id)
    await fetchCart()
  }

  const clearCart = async () => {
    await cartAPI.clear()
    await fetchCart()
  }

  const itemCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0

  return (
    <CartContext.Provider value={{ cart, loading, itemCount, addToCart, updateItem, removeItem, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
