import { useEffect, useState } from "react";

export type MemoryEvidence = {
  id: string;
  type: "texto" | "audio" | "foto" | "documento";
  name: string;
  dataUrl?: string;
};

export type MemoryEvent = {
  id: string;
  projectKey: string;
  title: string;
  summary: string;
  type: "produção" | "material" | "custo" | "máquina" | "equipe" | "ocorrência" | "ação" | "diário";
  createdAt: string;
  source: "web" | "campo";
  confirmed: boolean;
  evidence: MemoryEvidence[];
  metadata?: Record<string, string | number | undefined>;
};

const KEY = "nf-operational-memory-v1";
const PROJECT_KEY = "jardim-planalto";

function read(): MemoryEvent[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function write(events: MemoryEvent[]) {
  localStorage.setItem(KEY, JSON.stringify(events));
  window.dispatchEvent(new CustomEvent("nf-operational-memory-change"));
}

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function addMemoryEvent(event: Omit<MemoryEvent, "id" | "projectKey" | "createdAt">) {
  const next: MemoryEvent = { ...event, id: makeId("memory"), projectKey: PROJECT_KEY, createdAt: new Date().toISOString() };
  write([next, ...read()]);
  return next;
}

export function removeMemoryEvent(id: string) {
  write(read().filter((event) => event.id !== id));
}

export function useOperationalMemory() {
  const [events, setEvents] = useState<MemoryEvent[]>(read);
  useEffect(() => {
    const refresh = () => setEvents(read());
    window.addEventListener("nf-operational-memory-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("nf-operational-memory-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return events;
}

export function clearOperationalMemory() {
  write([]);
}
