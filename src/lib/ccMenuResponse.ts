import type { DayMenu, MenuResponse } from '@/types/menuTypes';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isDayMenu(value: unknown): value is DayMenu {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.name === 'string'
    && isStringArray(value.plateLunch)
    && isStringArray(value.grabAndGo)
    && typeof value.specialMessage === 'string';
}

export function isMenuResponse(value: unknown): value is MenuResponse {
  if (!isRecord(value)) {
    return false;
  }
  return Array.isArray(value.weekOne) && value.weekOne.every(isDayMenu)
    && Array.isArray(value.weekTwo) && value.weekTwo.every(isDayMenu);
}

export function unwrapJsonText(content: string): string {
  const trimmed = content.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return fenced?.[1]?.trim() ?? trimmed;
}

export function parseCcMenuJson(content: string): MenuResponse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(unwrapJsonText(content));
  } catch (parseError) {
    throw new Error(
      `Failed to parse CC menu JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
    );
  }
  if (!isMenuResponse(parsed)) {
    throw new Error('Campus Center PDF JSON did not match the menu schema.');
  }
  return parsed;
}
