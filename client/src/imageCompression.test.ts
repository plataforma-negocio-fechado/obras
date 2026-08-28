import { describe, expect, it } from "vitest";
import { MAX_EVIDENCE_BYTES, MAX_EVIDENCE_DIMENSION, dataUrlBytes } from "@/imageCompression";

describe("imageCompression", () => {
  it("mantém um limite operacional de dimensão e tamanho", () => {
    expect(MAX_EVIDENCE_DIMENSION).toBe(1600);
    expect(MAX_EVIDENCE_BYTES).toBe(1_500_000);
  });

  it("calcula o tamanho aproximado do conteúdo Base64", () => {
    expect(dataUrlBytes("data:image/jpeg;base64,AAAA")).toBe(3);
    expect(dataUrlBytes("data:image/jpeg;base64,")).toBe(0);
  });
});
