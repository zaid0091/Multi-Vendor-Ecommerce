/**
 * WishlistContext — manages wishlist state globally.
 * Only active when the user is authenticated as a customer.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { wishlistAPI } from '../api'
import { useAuth } from './AuthContext'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const [wishlistIds, setWishlistIds] = useState(new Set())
  const [loading, setLoading] = useState(false)

  const fetchWishlist = useCallback(async () => {
    if (!user || user.role !== 'customer') {
      setWishlistIds(new Set())
      return
    }
    try {
      const { data } = await wishlistAPI.list()
      setWishlistIds(new Set(data.map(item => item.product.id)))
    } catch {
      setWishlistIds(new Set())
    }
  }, [user])

  useEffect(() => {
    // Wait until auth has finished resolving before deciding to fetch or clear.
    // Without this guard, the context sees user=null on first render and skips
    // the fetch — so wishlist is empty after a page refresh even though the
    // user is still logged in.
    if (authLoading) return
    fetchWishlist()
  }, [authLoading, fetchWishlist])

  const toggle = useCallback(async (productId) => {
    if (!user || user.role !== 'customer') return
    const isWishlisted = wishlistIds.has(productId)
    // Optimistic update
    setWishlistIds(prev => {
      const next = new Set(prev)
      isWishlisted ? next.delete(productId) : next.add(productId)
      return next
    })
    try {
      if (isWishlisted) {
        await wishlistAPI.remove(productId)
      } else {
        await wishlistAPI.add(productId)
      }
    } catch {
      // Revert on failure
      setWishlistIds(prev => {
        const next = new Set(prev)
        isWishlisted ? next.add(productId) : next.delete(productId)
        return next
      })
    }
  }, [user, wishlistIds])

  const isWishlisted = useCallback((productId) => wishlistIds.has(productId), [wishlistIds])

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggle, isWishlisted, fetchWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider')
  return ctx
}
