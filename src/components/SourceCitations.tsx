"use client";

import { openExternal } from "@/lib/toss/external";

type Props = {
  citations: string[];
};

export function SourceCitations({ citations }: Props) {
  if (!citations.length) return null;
  const unique = Array.from(new Set(citations));
  return (
    <div className="mt-4 text-sm">
      <h3 className="font-semibold mb-1">참고한 공식 출처</h3>
      <ul className="list-disc pl-5 space-y-0.5">
        {unique.map((url) => (
          <li key={url}>
            <a
              href={url}
              onClick={(e) => {
                e.preventDefault();
                openExternal(url);
              }}
              className="break-all"
            >
              {url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
