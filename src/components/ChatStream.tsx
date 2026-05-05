"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { SourceCitations } from "./SourceCitations";
import type { UserProfile } from "@/lib/schema";

const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
  loading: () => <p className="text-sm text-[var(--muted)]">로딩 중…</p>,
});

type Props = {
  profile: UserProfile;
  byokKey?: string;
};

export function ChatStream({ profile, byokKey }: Props) {
  const [text, setText] = useState("");
  const [citations, setCitations] = useState<string[]>([]);
  const [searchCount, setSearchCount] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let stale = false;

    (async () => {
      try {
        const resp = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, messages: [], byokKey }),
        });
        if (stale) return;
        if (!resp.ok) {
          const errBody = await resp.json().catch(() => ({ error: "응답 오류" }));
          if (stale) return;
          setError(errBody.error ?? `HTTP ${resp.status}`);
          setDone(true);
          return;
        }
        const reader = resp.body?.getReader();
        if (!reader) {
          setError("스트리밍 본문이 비어있습니다.");
          setDone(true);
          return;
        }
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done: streamDone } = await reader.read();
          if (stale) return;
          if (streamDone) break;
          buffer += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buffer.indexOf("\n\n")) !== -1) {
            const chunk = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            if (!chunk.startsWith("data: ")) continue;
            try {
              const ev = JSON.parse(chunk.slice(6));
              if (ev.type === "text_delta" && typeof ev.text === "string") {
                setText((prev) => prev + ev.text);
              } else if (ev.type === "citation" && typeof ev.url === "string") {
                setCitations((prev) => [...prev, ev.url]);
              } else if (ev.type === "tool_use") {
                setSearchCount((prev) => prev + 1);
              } else if (ev.type === "error") {
                setError(ev.message ?? "오류 발생");
              } else if (ev.type === "done") {
                if (Array.isArray(ev.citations)) {
                  setCitations((prev) => Array.from(new Set([...prev, ...ev.citations])));
                }
                setDone(true);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
        if (!stale) setDone(true);
      } catch (err) {
        if (stale) return;
        setError((err as Error).message ?? "네트워크 오류");
        setDone(true);
      }
    })();

    return () => {
      stale = true;
    };
  }, [profile, byokKey]);

  return (
    <div className="space-y-4">
      <article className="prose-welfare bg-white border border-[var(--border)] rounded-lg p-4">
        {text ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
          >
            {text}
          </ReactMarkdown>
        ) : (
          <div className="text-sm text-[var(--muted)] space-y-1">
            <p>공식 출처를 검색해 답변을 준비하고 있습니다. 잠시만 기다려 주세요…</p>
            {searchCount > 0 && (
              <p className="text-xs">
                웹 검색 {searchCount}회 진행 중 · 응답 시작까지 최대 30~60초 소요될 수 있습니다.
              </p>
            )}
          </div>
        )}
        {!done && text && (
          <p className="text-xs text-[var(--muted)] mt-2">응답 작성 중…</p>
        )}
      </article>

      <SourceCitations citations={citations} />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm">
          오류: {error}
        </div>
      )}
    </div>
  );
}
