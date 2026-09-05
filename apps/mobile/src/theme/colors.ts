// Design tokens lifted from design-reference/PAWPATROL_SPEC.md §6.
export const colors = {
  background: '#fbf6ea',
  canvas: '#e7ecdf',
  onboardingDark: '#163832',

  brand: '#1f5d50',
  brandHover: '#163832',
  textPrimary: '#17302b',

  textMuted40: 'rgba(23,48,43,0.4)',
  textMuted45: 'rgba(23,48,43,0.45)',
  textMuted50: 'rgba(23,48,43,0.5)',
  textMuted55: 'rgba(23,48,43,0.55)',
  textMuted60: 'rgba(23,48,43,0.6)',

  hairline06: 'rgba(23,48,43,0.06)',
  hairline08: 'rgba(23,48,43,0.08)',
  hairline10: 'rgba(23,48,43,0.1)',
  hairline12: 'rgba(23,48,43,0.12)',
  hairline15: 'rgba(23,48,43,0.15)',

  critical: '#de5b3e',
  criticalBg: '#fbeae5',
  attention: '#c9860f',
  attentionAlt: '#e3a13a',
  attentionBg: '#fbf0dc',
  monitoring: '#3f8a5e',
  monitoringAlt: '#4e9c6d',
  monitoringDark: '#2e6b4c',
  monitoringBg: '#e7f2ec',
  inProgress: '#3a6ea5',
  inProgressBg: '#e2ecf5',

  personBadgePalette: ['#1f5d50', '#c9860f', '#3a6ea5', '#8a4fae'] as const,

  mapCanvas: '#dfe6d4',
  mapGridLine: 'rgba(23,48,43,0.06)',
  chatBackground: '#f2ede0',

  toastBg: '#17302b',
  toastText: '#fbf6ea',

  white: '#ffffff',
} as const;

export function urgencyColor(urgency: 'critical' | 'attention' | 'monitoring') {
  switch (urgency) {
    case 'critical':
      return { color: colors.critical, bg: colors.criticalBg };
    case 'attention':
      return { color: colors.attention, bg: colors.attentionBg };
    case 'monitoring':
      return { color: colors.monitoring, bg: colors.monitoringBg };
  }
}

export function statusColor(
  status: 'open' | 'claimed' | 'in_progress' | 'pending_verification' | 'resolved',
) {
  switch (status) {
    case 'open':
      return { color: colors.critical, bg: colors.criticalBg };
    case 'claimed':
    case 'pending_verification':
      return { color: colors.attention, bg: colors.attentionBg };
    case 'in_progress':
      return { color: colors.inProgress, bg: colors.inProgressBg };
    case 'resolved':
      return { color: colors.monitoring, bg: colors.monitoringBg };
  }
}

export function personBadgeColor(name: string) {
  const code = name.trim().charCodeAt(0) || 0;
  return colors.personBadgePalette[code % colors.personBadgePalette.length];
}
