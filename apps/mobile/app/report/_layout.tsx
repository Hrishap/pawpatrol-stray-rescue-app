import { Stack } from 'expo-router';

import { ReportDraftProvider } from '@/hooks/useReportDraft';

export default function ReportLayout() {
  return (
    <ReportDraftProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ReportDraftProvider>
  );
}
