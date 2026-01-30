export type IslamicHoliday = {
  id: string;
  name: string;
  nameTranslations?: {
    tr?: string;
  };
  hijriDate: string;
  summary: string;
  summaryTranslations?: {
    tr?: string;
  };
};

export const ISLAMIC_HOLIDAYS: IslamicHoliday[] = [
  {
    id: 'hijri-new-year',
    name: 'Hijri New Year',
    nameTranslations: { tr: 'Hicrî Yılbaşı' },
    hijriDate: '1 Muharram',
    summary: 'Start of the Islamic year.',
    summaryTranslations: { tr: 'Hicrî yılın başlangıcı.' },
  },
  {
    id: 'ashura',
    name: 'Ashura',
    nameTranslations: { tr: 'Aşure Günü' },
    hijriDate: '10 Muharram',
    summary: 'Day of fasting and remembrance.',
    summaryTranslations: { tr: 'Oruç ve tefekkür günü.' },
  },
  {
    id: 'mawlid',
    name: 'Mawlid an-Nabi',
    nameTranslations: { tr: 'Mevlid Kandili' },
    hijriDate: '12 Rabi al-Awwal',
    summary: 'Commemoration of the Prophet’s birth.',
    summaryTranslations: { tr: 'Peygamberimizin doğumunun anıldığı gün.' },
  },
  {
    id: 'ramadan-start',
    name: 'Start of Ramadan',
    nameTranslations: { tr: 'Ramazan Başlangıcı' },
    hijriDate: '1 Ramadan',
    summary: 'Beginning of the fasting month.',
    summaryTranslations: { tr: 'Oruç ayının başlangıcı.' },
  },
  {
    id: 'laylat-al-qadr',
    name: 'Laylat al-Qadr',
    nameTranslations: { tr: 'Kadir Gecesi' },
    hijriDate: '27 Ramadan (observed)',
    summary: 'Night of Power in the last ten nights of Ramadan.',
    summaryTranslations: { tr: 'Ramazan’ın son on günündeki Kadir Gecesi.' },
  },
  {
    id: 'eid-al-fitr',
    name: 'Eid al-Fitr',
    nameTranslations: { tr: 'Ramazan Bayramı' },
    hijriDate: '1 Shawwal',
    summary: 'Festival marking the end of Ramadan.',
    summaryTranslations: { tr: 'Ramazan’ın bitişini müjdeleyen bayram.' },
  },
  {
    id: 'day-of-arafah',
    name: 'Day of Arafah',
    nameTranslations: { tr: 'Arefe Günü' },
    hijriDate: '9 Dhul Hijjah',
    summary: 'Day of fasting and reflection during Hajj.',
    summaryTranslations: { tr: 'Hac sırasında oruç ve tefekkür günü.' },
  },
  {
    id: 'eid-al-adha',
    name: 'Eid al-Adha',
    nameTranslations: { tr: 'Kurban Bayramı' },
    hijriDate: '10 Dhul Hijjah',
    summary: 'Festival of sacrifice during Hajj.',
    summaryTranslations: { tr: 'Hac dönemindeki kurban bayramı.' },
  },
  {
    id: 'tashreeq',
    name: 'Days of Tashreeq',
    nameTranslations: { tr: 'Teşrik Günleri' },
    hijriDate: '11–13 Dhul Hijjah',
    summary: 'Days of remembrance following Eid al-Adha.',
    summaryTranslations: { tr: 'Kurban Bayramı sonrası zikir günleri.' },
  },
];
