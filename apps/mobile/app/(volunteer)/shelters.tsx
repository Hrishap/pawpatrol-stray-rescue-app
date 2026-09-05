import { useTranslation } from 'react-i18next';

import { ComingSoon } from '@/components/ComingSoon';

export default function VolunteerShelters() {
  const { t } = useTranslation();
  return <ComingSoon title={`${t('sheltersVets')} — lands in M4`} />;
}
