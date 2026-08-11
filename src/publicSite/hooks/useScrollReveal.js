import { useEffect } from 'react'

function useScrollReveal() {
  useEffect(() => {
    const root = document.querySelector('.public-site')
    const elements = document.querySelectorAll('[data-reveal]')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'))
      return undefined
    }

    root?.classList.add('public-reveal-ready')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )

    elements.forEach((element) => observer.observe(element))
    return () => {
      observer.disconnect()
      root?.classList.remove('public-reveal-ready')
    }
  }, [])
}

export default useScrollReveal
