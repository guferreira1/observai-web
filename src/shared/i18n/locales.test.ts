import { describe, expect, it } from "vitest";

import { getLocaleFromPathname, stripLocaleFromPathname, withLocalePath } from "@/shared/i18n/locales";

describe("locale path helpers", () => {
  it("detects supported locale prefixes", () => {
    expect(getLocaleFromPathname("/pt-BR/dashboard")).toBe("pt-BR");
    expect(getLocaleFromPathname("/en/analyses/new")).toBe("en");
    expect(getLocaleFromPathname("/dashboard")).toBeNull();
  });

  it("strips supported locale prefixes", () => {
    expect(stripLocaleFromPathname("/pt-BR/dashboard")).toBe("/dashboard");
    expect(stripLocaleFromPathname("/en")).toBe("/");
    expect(stripLocaleFromPathname("/history")).toBe("/history");
  });

  it("adds the requested locale without duplicating existing prefixes", () => {
    expect(withLocalePath("/dashboard", "pt-BR")).toBe("/pt-BR/dashboard");
    expect(withLocalePath("/en/history", "pt-BR")).toBe("/pt-BR/history");
    expect(withLocalePath("/", "en")).toBe("/en");
  });
});
