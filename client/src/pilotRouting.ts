import { useCallback, useEffect, useState } from "react";

function normalizePath(value: string) {
  const path = value.split("?")[0].split("#")[0] || "/";
  if (path === "/") return "/";
  return `/${path.replace(/^\/+/, "").replace(/\/+$/, "")}`;
}

export function readPilotPath() {
  const hashPath = window.location.hash.replace(/^#/, "");
  if (hashPath) return normalizePath(hashPath);

  const pathname = normalizePath(window.location.pathname);
  const configuredBase = import.meta.env.BASE_URL.replace(/\/$/, "");
  const bases = [configuredBase, "/projeto-piloto-plataforma-negocio-fechado", "/obras"].filter(Boolean);

  for (const base of bases) {
    const normalizedBase = base === "/" ? "/" : normalizePath(base);
    if (pathname === normalizedBase || pathname === "") return "/";
    if (pathname.startsWith(`${normalizedBase}/`)) {
      return normalizePath(pathname.slice(normalizedBase.length)) || "/";
    }
  }

  return pathname || "/";
}

export function usePilotLocation() {
  const [path, setPath] = useState(readPilotPath);

  useEffect(() => {
    const onChange = () => setPath(readPilotPath());
    window.addEventListener("hashchange", onChange);
    window.addEventListener("popstate", onChange);
    return () => {
      window.removeEventListener("hashchange", onChange);
      window.removeEventListener("popstate", onChange);
    };
  }, []);

  const navigate = useCallback((next: string) => {
    const normalized = normalizePath(next);
    window.location.hash = normalized;
  }, []);

  return [path, navigate] as const;
}
