"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

interface DocContentProps {
  content: string;
  lastUpdated?: string;
  audience?: "all" | "developer" | "non-developer";
}

function parseMarkdownToElements(markdown: string): React.ReactNode[] {
  const lines = markdown.trim().split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Version badge
    const versionMatch = line.trim().match(/^<version>(.*?)<\/version>$/);
    if (versionMatch) {
      elements.push(
        <span
          key={key++}
          className="inline-block mb-4 px-2 py-1 text-xs font-medium rounded bg-green-500/10 text-green-400 border border-green-500/20">
          {versionMatch[1]}
        </span>,
      );
      i++;
      continue;
    }

    // Headings
    const h1Match = line.match(/^# (.+)$/);
    if (h1Match) {
      const id = h1Match[1]
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      elements.push(
        <h1
          key={key++}
          id={id}
          className="text-3xl font-bold text-white mt-2 mb-6 scroll-mt-20">
          {h1Match[1]}
        </h1>,
      );
      i++;
      continue;
    }

    const h2Match = line.match(/^## (.+)$/);
    if (h2Match) {
      const id = h2Match[1]
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      elements.push(
        <h2
          key={key++}
          id={id}
          className="text-xl font-semibold text-white mt-10 mb-4 pb-2 border-b border-gray-800 scroll-mt-20">
          {h2Match[1]}
        </h2>,
      );
      i++;
      continue;
    }

    const h3Match = line.match(/^### (.+)$/);
    if (h3Match) {
      const id = h3Match[1]
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      elements.push(
        <h3
          key={key++}
          id={id}
          className="text-lg font-semibold text-white mt-8 mb-3 scroll-mt-20">
          {h3Match[1]}
        </h3>,
      );
      i++;
      continue;
    }

    // Code blocks
    const codeBlockMatch = line.match(/^```(\w*)$/);
    if (codeBlockMatch) {
      const lang = codeBlockMatch[1] || "text";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].match(/^```$/)) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <div
          key={key++}
          className="my-4 rounded-lg overflow-hidden border border-gray-800">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
            <span className="text-xs text-gray-500 font-mono">{lang}</span>
            <CopyButton text={codeLines.join("\n")} />
          </div>
          <pre className="p-4 bg-gray-900/50 overflow-x-auto">
            <code className="text-sm text-gray-300 font-mono leading-relaxed">
              {codeLines.join("\n")}
            </code>
          </pre>
        </div>,
      );
      continue;
    }

    // Tables
    if (line.includes("|") && line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].includes("|") &&
        lines[i].trim() !== ""
      ) {
        tableLines.push(lines[i]);
        i++;
      }

      if (tableLines.length >= 2) {
        const headerCells = tableLines[0]
          .split("|")
          .filter((c) => c.trim())
          .map((c) => c.trim());
        const bodyRows = tableLines.slice(2).map((row) =>
          row
            .split("|")
            .filter((c) => c.trim() !== "")
            .map((c) => c.trim()),
        );

        elements.push(
          <div
            key={key++}
            className="my-4 overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900">
                  {headerCells.map((cell, ci) => (
                    <th
                      key={ci}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {bodyRows.map((row, ri) => (
                  <tr
                    key={ri}
                    className="hover:bg-gray-900/50 transition-colors">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-3 text-gray-300">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
        continue;
      }
    }

    // Unordered list
    if (line.match(/^[-*] /)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        listItems.push(lines[i].replace(/^[-*] /, ""));
        i++;
      }
      elements.push(
        <ul key={key++} className="my-3 space-y-2">
          {listItems.map((item, li) => (
            <li key={li} className="flex items-start gap-2 text-gray-300">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\. /)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        listItems.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      elements.push(
        <ol key={key++} className="my-3 space-y-2 counter-reset-list">
          {listItems.map((item, li) => (
            <li key={li} className="flex items-start gap-3 text-gray-300">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-gray-800 text-green-400 text-xs flex items-center justify-center shrink-0 font-medium">
                {li + 1}
              </span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // Regular paragraph
    const paraLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].match(/^#{1,3} /) &&
      !lines[i].match(/^```/) &&
      !lines[i].match(/^[-*] /) &&
      !lines[i].match(/^\d+\. /) &&
      !(lines[i].includes("|") && lines[i].trim().startsWith("|"))
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    elements.push(
      <p key={key++} className="my-3 text-gray-300 leading-7">
        {renderInline(paraLines.join(" "))}
      </p>,
    );
  }

  return elements;
}

function renderInline(text: string): React.ReactNode {
  // Split by inline patterns and render
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let partKey = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(
          <React.Fragment key={partKey++}>
            {renderInlineCode(remaining.slice(0, boldMatch.index))}
          </React.Fragment>,
        );
      }
      parts.push(
        <strong key={partKey++} className="text-white font-semibold">
          {renderInlineCode(boldMatch[1])}
        </strong>,
      );
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // Inline code
    const codeMatch = remaining.match(/`(.+?)`/);
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(
          <React.Fragment key={partKey++}>
            {remaining.slice(0, codeMatch.index)}
          </React.Fragment>,
        );
      }
      parts.push(
        <code
          key={partKey++}
          className="px-1.5 py-0.5 rounded bg-gray-800 text-green-400 text-sm font-mono border border-gray-700">
          {codeMatch[1]}
        </code>,
      );
      remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
      continue;
    }

    // Link [text](url)
    const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/);
    if (linkMatch && linkMatch.index !== undefined) {
      if (linkMatch.index > 0) {
        parts.push(
          <React.Fragment key={partKey++}>
            {remaining.slice(0, linkMatch.index)}
          </React.Fragment>,
        );
      }
      const href = linkMatch[2];
      const isExternal =
        href.startsWith("http://") || href.startsWith("https://");
      parts.push(
        <a
          key={partKey++}
          href={href}
          className="text-green-400 hover:text-green-300 underline underline-offset-2 transition-colors"
          {...(isExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}>
          {linkMatch[1]}
        </a>,
      );
      remaining = remaining.slice(linkMatch.index + linkMatch[0].length);
      continue;
    }

    // No more inline formatting, push the rest
    parts.push(<React.Fragment key={partKey++}>{remaining}</React.Fragment>);
    break;
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function renderInlineCode(text: string): React.ReactNode {
  const codeMatch = text.match(/`(.+?)`/);
  if (codeMatch && codeMatch.index !== undefined) {
    const parts: React.ReactNode[] = [];
    if (codeMatch.index > 0) {
      parts.push(text.slice(0, codeMatch.index));
    }
    parts.push(
      <code
        key="code"
        className="px-1.5 py-0.5 rounded bg-gray-800 text-green-400 text-sm font-mono border border-gray-700">
        {codeMatch[1]}
      </code>,
    );
    const rest = text.slice(codeMatch.index + codeMatch[0].length);
    if (rest) {
      parts.push(renderInlineCode(rest));
    }
    return <>{parts}</>;
  }
  return text;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function DocContent({
  content,
  lastUpdated,
  audience,
}: DocContentProps) {
  const elements = parseMarkdownToElements(content);

  return (
    <div className="max-w-3xl">
      {/* Audience & date badge */}
      <div className="flex items-center gap-3 mb-4">
        {audience && audience !== "all" && (
          <Badge
            variant="outline"
            className={`text-xs ${
              audience === "developer"
                ? "border-blue-500/30 text-blue-400"
                : "border-purple-500/30 text-purple-400"
            }`}>
            {audience === "developer" ? "Developer" : "User Guide"}
          </Badge>
        )}
        {lastUpdated && (
          <span className="text-xs text-gray-600">
            Last updated: {lastUpdated}
          </span>
        )}
      </div>

      {/* Content */}
      <article className="prose prose-invert max-w-none">{elements}</article>
    </div>
  );
}
