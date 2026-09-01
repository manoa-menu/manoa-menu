/** True when the hours chip means the venue is open right now. */
export function isCurrentlyOpenStatus(status: string): boolean {
  const normalized = status.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (/\bclosed\b/.test(normalized) || /\bclosing\b/.test(normalized)) {
    return false;
  }
  if (/\bopening\b/.test(normalized) || /\bopens\b/.test(normalized)) {
    return false;
  }
  return /\bopen\b/.test(normalized);
}

export function getTranslatedOpenStatus(status: string, language: string): string {
  if (isCurrentlyOpenStatus(status)) {
    switch (language) {
      case 'Japanese':
        return '営業中';
      case 'Korean':
        return '영업 중';
      case 'Chinese':
        return '营业中';
      default:
        return 'Open';
    }
  }
  switch (language) {
    case 'Japanese':
      return '営業終了';
    case 'Korean':
      return '영업 종료';
    case 'Chinese':
      return '已打烊';
    default:
      return 'Closed';
  }
}
