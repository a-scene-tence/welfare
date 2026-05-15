import { z } from "zod";

export const SituationEnum = z.enum([
  "none",
  "disability",
  "single_parent",
  "multicultural",
  "veteran",
  "north_korean_defector",
  "unemployed",
  "startup",
  "farmer",
  "pregnant",
  "caregiver",
  "student",
  "homeless",
]);
export type Situation = z.infer<typeof SituationEnum>;

export const SITUATION_LABELS: Record<Situation, string> = {
  none: "해당 없음",
  disability: "장애인 / 장애가구",
  single_parent: "한부모·조손 가정",
  multicultural: "다문화 가정",
  veteran: "국가유공자 / 보훈대상",
  north_korean_defector: "북한이탈주민",
  unemployed: "실직·구직 중",
  startup: "창업 준비·운영 중",
  farmer: "농어업 종사",
  pregnant: "임산부",
  caregiver: "가족 돌봄(간병·아이돌봄)",
  student: "학생 / 청소년",
  homeless: "주거 취약(쪽방·고시원·노숙 등)",
};

export const RegionSchema = z.object({
  sido: z.string().min(1),
  sigungu: z.string().min(1),
  sidoCode: z.string().regex(/^\d{2}$/, "시도 코드는 2자리 숫자여야 합니다."),
  sigunguCode: z.string().regex(/^\d{5}$/, "시군구 코드는 5자리 숫자여야 합니다."),
});
export type Region = z.infer<typeof RegionSchema>;

export const HouseholdSchema = z.object({
  size: z.number().int().min(1).max(10),
  annualIncomeKRW: z.number().int().min(0).max(1_000_000_000),
  assetsKRW: z.number().int().min(0).max(10_000_000_000).optional(),
});

export const MaritalSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("single") }),
  z.object({
    status: z.literal("married"),
    spouseAge: z.number().int().min(0).max(120),
    spouseAnnualIncomeKRW: z.number().int().min(0).max(1_000_000_000),
  }),
]);
export type Marital = z.infer<typeof MaritalSchema>;

export const ConsentSchema = z.object({
  disclaimer: z.literal(true, {
    errorMap: () => ({ message: "면책 사항에 동의해야 합니다." }),
  }),
  storeAnonymizedLog: z.boolean().default(false),
});

export const UserProfileSchema = z.object({
  region: RegionSchema,
  age: z.number().int().min(0).max(120),
  household: HouseholdSchema,
  marital: MaritalSchema,
  children: z
    .array(z.object({ age: z.number().int().min(0).max(40) }))
    .max(10)
    .default([]),
  situations: z.array(SituationEnum).default(["none"]),
  freeText: z.string().max(500).optional(),
  consent: ConsentSchema,
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatRequestSchema = z.object({
  profile: UserProfileSchema,
  messages: z.array(ChatMessageSchema).max(20).default([]),
  byokKey: z
    .string()
    .startsWith("sk-ant-")
    .max(200)
    .optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
