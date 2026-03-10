type ConsoleMethod = "log" | "info" | "warn" | "error"

let consolee: any = {};
const METHODS: ConsoleMethod[] = ["log", "info", "warn", "error"]

/**
 * In development, mirror browser console calls to the Node server console.
 * This keeps logs visible in the dev terminal instead of (or in addition to) the browser devtools.
 */
export function installServerConsoleBridge() {
  //if (typeof window === "undefined") return
  // Only run when Vite dev server is active
  //if (!import.meta.env.DEV) return

  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/+$/, "")
  const endpoint = `${apiBase}/api/v1/debug/client-log`

 

  const originalConsole: Partial<Record<ConsoleMethod, (...args: any[]) => void>> = {}

  METHODS.forEach((method) => {
    const orig = console[method]?.bind(console) ?? (() => {})
    originalConsole[method] = orig

    consolee[method] = (...args: any[]) => {
      // Keep browser console output as usual
      orig(...args)

      const payload = {
        level: method,
        message: args
          .map((a) => {
            try {
              if (typeof a === "string") return a
              return JSON.stringify(a)
            } catch {
              return String(a)
            }
          })
          .join(" "),
        timestamp: new Date().toISOString(),
      }

      try {
       
       fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            keepalive: true,
          }).then(() => {
            
          }).catch(() => {
            // Ignore network/logging errors
             
          })
      } catch {
        // Swallow any unexpected errors
      }
    }
  })
}

