import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ChatMarkdown } from "@/features/chat/components/chat-markdown";

function renderMarkdown(content: string) {
  return renderToStaticMarkup(createElement(ChatMarkdown, { content }));
}

describe("ChatMarkdown", () => {
  it("renders basic assistant markdown", () => {
    const markup = renderMarkdown("### Findings\n- **API** latency increased\n- Inspect `trace-1`");

    expect(markup).toContain("<h4");
    expect(markup).toContain("<ul");
    expect(markup).toContain("<strong>API</strong>");
    expect(markup).toContain("<code");
  });

  it("keeps raw HTML escaped", () => {
    const markup = renderMarkdown("<img src=x onerror=alert(1)>");

    expect(markup).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(markup).not.toContain("<img");
  });

  it("does not render unsafe markdown links", () => {
    const markup = renderMarkdown("[bad](javascript:alert(1)) and [good](https://example.com)");

    expect(markup).not.toContain('href="javascript:alert');
    expect(markup).toContain('href="https://example.com"');
  });
});
