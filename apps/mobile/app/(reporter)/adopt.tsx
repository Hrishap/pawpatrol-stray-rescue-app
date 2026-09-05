import { useTranslation } from 'react-i18next';

import { ComingSoon } from '@/components/ComingSoon';

export default function AdoptScreen() {
  const { t } = useTranslation();
  return <ComingSoon title={`${t('readyAdoption')} — lands in M4`} />;
}
