"use client";

import { openExternal } from "@/lib/toss/external";

type Props = {
  citations: string[];
};

export function SourceCitations({ citations }: Props) {
  if (!citations.length) return null;
  const unique = Array.from(new Set(citations));
  return (
    <div className="border-t border-[color:var(--line)] pt-5 text-sm">
      <p className="eyebrow mb-3">Sources · 참고한 공식 출처</p>
      <ul className="space-y-2">
        {unique.map((url) => (
          <li key={url}>
            <a
              href={url}
              onClick={(e) => {
                e.preventDefault();
                openExternal(url);
              }}
              className="break-all text-[color:var(--ink)]"
            >
              {url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
