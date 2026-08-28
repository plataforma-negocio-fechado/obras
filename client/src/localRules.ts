export type FrontProductionState = {
  executed: number;
  planned: number;
  progress: number;
  status: string;
};

export function productionProgress(executed: number, planned: number) {
  if (!Number.isFinite(planned) || planned <= 0) return 0;

  return Math.min(
    100,
    Math.max(
      0,
      Math.round((Math.max(0, executed) / planned) * 100)
    )
  );
}

export function applyProduction(
  state: FrontProductionState,
  production: number
): FrontProductionState {
  const safeProduction = Number.isFinite(production)
    ? Math.max(0, production)
    : 0;

  const executed = state.executed + safeProduction;
  const progress = productionProgress(executed, state.planned);

  return {
    ...state,
    executed,
    progress,
    status:
      progress >= 100
        ? "Concluída"
        : safeProduction > 0
          ? "Em execução"
          : state.status,
  };
}

export function removeProduction(
  state: FrontProductionState,
  production: number
): FrontProductionState {
  const safeProduction = Number.isFinite(production)
    ? Math.max(0, production)
    : 0;

  const executed = Math.max(0, state.executed - safeProduction);
  const progress = productionProgress(executed, state.planned);

  return {
    ...state,
    executed,
    progress,
  };
}

export function sameLabel(a: string, b: string) {
  return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
}

export function appendMissingByLabel<T extends { title: string }>(
  existing: T[],
  required: T[]
) {
  const missing = required.filter(
    (item) =>
      !existing.some((candidate) =>
        sameLabel(candidate.title, item.title)
      )
  );

  return [...existing, ...missing];
}
