import React, { type ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type ChatMarkdownProps = {
  content: string;
  className?: string;
};

type ParsedLink = {
  label: string;
  url: string;
};

const markdownLinkPattern = /^\[([^\]]+)\]\(([^)\s]+)\)$/;
const inlineTokenPattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

function isSafeMarkdownUrl(url: string) {
  try {
    const parsedUrl = new URL(url);

    return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:" || parsedUrl.protocol === "mailto:";
  } catch {
    return url.startsWith("/") && !url.startsWith("//");
  }
}

function parseMarkdownLink(token: string): ParsedLink | null {
  const linkMatch = token.match(markdownLinkPattern);

  if (!linkMatch) {
    return null;
  }

  const [, label, url] = linkMatch;

  if (!label || !url || !isSafeMarkdownUrl(url)) {
    return null;
  }

  return { label, url };
}

function renderInlineToken(token: string, key: string) {
  if (token.startsWith("`") && token.endsWith("`")) {
    return (
      <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
        {token.slice(1, -1)}
      </code>
    );
  }

  if (token.startsWith("**") && token.endsWith("**")) {
    return <strong key={key}>{renderInlineMarkdown(token.slice(2, -2), `${key}-strong`)}</strong>;
  }

  if (token.startsWith("*") && token.endsWith("*")) {
    return <em key={key}>{renderInlineMarkdown(token.slice(1, -1), `${key}-em`)}</em>;
  }

  const link = parseMarkdownLink(token);

  if (link) {
    return (
      <a
        key={key}
        href={link.url}
        target={link.url.startsWith("http") ? "_blank" : undefined}
        rel={link.url.startsWith("http") ? "noreferrer" : undefined}
        className="font-medium text-primary underline underline-offset-4"
      >
        {link.label}
      </a>
    );
  }

  return token;
}

function renderInlineMarkdown(content: string, keyPrefix: string): ReactNode[] {
  return content.split(inlineTokenPattern).map((token, tokenIndex) => {
    const key = `${keyPrefix}-${tokenIndex}`;

    return renderInlineToken(token, key);
  });
}

function trimTrailingBlankLines(lines: string[]) {
  const trimmedLines = [...lines];

  while (trimmedLines.at(-1) === "") {
    trimmedLines.pop();
  }

  return trimmedLines;
}

function renderParagraph(lines: string[], blockIndex: number) {
  return (
    <p key={`paragraph-${blockIndex}`} className="whitespace-pre-wrap text-sm leading-6">
      {renderInlineMarkdown(trimTrailingBlankLines(lines).join("\n"), `paragraph-${blockIndex}`)}
    </p>
  );
}

function renderList(lines: string[], blockIndex: number) {
  return (
    <ul key={`list-${blockIndex}`} className="list-disc space-y-1 pl-5 text-sm leading-6">
      {lines.map((line, lineIndex) => (
        <li key={`list-${blockIndex}-${lineIndex}`}>
          {renderInlineMarkdown(line.replace(/^[-*]\s+/, ""), `list-${blockIndex}-${lineIndex}`)}
        </li>
      ))}
    </ul>
  );
}

function renderHeading(line: string, blockIndex: number) {
  const headingText = line.replace(/^#{1,3}\s+/, "");

  return (
    <h4 key={`heading-${blockIndex}`} className="text-sm font-semibold leading-6">
      {renderInlineMarkdown(headingText, `heading-${blockIndex}`)}
    </h4>
  );
}

function renderMarkdownBlocks(content: string) {
  const blocks: ReactNode[] = [];
  let paragraphLines: string[] = [];
  let listLines: string[] = [];

  const flushParagraph = () => {
    if (trimTrailingBlankLines(paragraphLines).length === 0) {
      paragraphLines = [];
      return;
    }

    blocks.push(renderParagraph(paragraphLines, blocks.length));
    paragraphLines = [];
  };

  const flushList = () => {
    if (listLines.length === 0) {
      return;
    }

    blocks.push(renderList(listLines, blocks.length));
    listLines = [];
  };

  content.split("\n").forEach((line) => {
    if (/^#{1,3}\s+/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push(renderHeading(line, blocks.length));
      return;
    }

    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      listLines.push(line);
      return;
    }

    if (line.trim() === "") {
      flushList();
      paragraphLines.push(line);
      return;
    }

    flushList();
    paragraphLines.push(line);
  });

  flushParagraph();
  flushList();

  return blocks;
}

export function ChatMarkdown({ content, className }: ChatMarkdownProps) {
  return <div className={cn("space-y-3", className)}>{renderMarkdownBlocks(content)}</div>;
}
