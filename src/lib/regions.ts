import regionsData from "@/data/regions.json";

export type Sigungu = { code: string; name: string };
export type Sido = { code: string; name: string; sigungu: Sigungu[] };

export const SIDO_LIST: Sido[] = (regionsData as { sido: Sido[] }).sido;

export function findSido(code: string): Sido | undefined {
  return SIDO_LIST.find((s) => s.code === code);
}

export function findSigungu(
  sidoCode: string,
  sigunguCode: string,
): Sigungu | undefined {
  return findSido(sidoCode)?.sigungu.find((g) => g.code === sigunguCode);
}

export function sigunguByName(
  sidoName: string,
  sigunguName: string,
): { sido: Sido; sigungu: Sigungu } | undefined {
  const sido = SIDO_LIST.find((s) => s.name === sidoName);
  const sigungu = sido?.sigungu.find((g) => g.name === sigunguName);
  if (!sido || !sigungu) return undefined;
  return { sido, sigungu };
}
