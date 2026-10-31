import { useEffect, useMemo, useState } from 'react'
import { createDefaultServiceCategories, getVisibleServiceCategories } from '../../constants/websiteServices.js'
import { observeWebsiteServices } from '../../models/websiteServiceModel.js'

export default function useWebsiteServices() {
  const [categories, setCategories] = useState(createDefaultServiceCategories)
  useEffect(() => observeWebsiteServices(
    (catalog) => setCategories(catalog.categories),
    () => { /* Keep the initial public catalog available if the network is unavailable. */ },
  ), [])
  return useMemo(() => getVisibleServiceCategories(categories), [categories])
}
