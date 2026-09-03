import { describe, expect, it } from "vitest";
import { getPwaRegistration } from "./pwa";

describe("registro do aplicativo instalável", () => {
  it("mantém o service worker dentro do subdiretório real do GitHub Pages", () => {
    expect(getPwaRegistration("/obras/")).toEqual({
      url: "/obras/sw.js",
      scope: "/obras/",
    });
  });

  it("normaliza a barra final do caminho base", () => {
    expect(getPwaRegistration("/obras")).toEqual({
      url: "/obras/sw.js",
      scope: "/obras/",
    });
  });

  it("continua funcionando em domínio raiz", () => {
    expect(getPwaRegistration("/")).toEqual({ url: "/sw.js", scope: "/" });
  });
});
