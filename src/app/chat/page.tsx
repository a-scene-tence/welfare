"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatStream } from "@/components/ChatStream";
import { UserProfileSchema, type UserProfile } from "@/lib/schema";

export default function ChatPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [byokKey, setByokKey] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("welfare:profile");
      if (!raw) {
        router.replace("/");
        return;
      }
      const parsed = UserProfileSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) {
        router.replace("/");
        return;
      }
      setProfile(parsed.data);
      const k = sessionStorage.getItem("welfare:byok");
      if (k) setByokKey(k);
    } catch {
      router.replace("/");
    }
  }, [router]);

  if (!profile) {
    return <p className="text-sm text-[var(--muted)]">불러오는 중…</p>;
  }
  return (
    <div className="space-y-3">
      <button
        onClick={() => router.push("/")}
        className="text-sm text-[var(--muted)] underline"
      >
        ← 입력 다시하기
      </button>
      <div className="rounded-md bg-white border border-[var(--border)] p-3 text-sm">
        <strong>요청 요약</strong> · {profile.region.sido} {profile.region.sigungu} ·{" "}
        {profile.age}세 · 가구원 {profile.household.size}명 ·{" "}
        {profile.marital.status === "married" ? "결혼" : "미혼/1인"}
      </div>
      <ChatStream profile={profile} byokKey={byokKey} />
    </div>
  );
}
