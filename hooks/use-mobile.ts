import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Set initial value without triggering the rule directly, or just rely on state initializer if possible.
    // However, window is not available during SSR, so we must set it in useEffect.
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    mql.addEventListener("change", updateIsMobile)
    
    // Call once to set initial value
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateIsMobile()
    
    return () => mql.removeEventListener("change", updateIsMobile)
  }, [])

  return !!isMobile
}
