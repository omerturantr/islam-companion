export type IslamicHoliday = {
  id: string;
  name: string;
  nameTranslations?: {
    tr?: string;
    ar?: string;
  };
  hijriDate: string;
  hijriDateTranslations?: {
    tr?: string;
    ar?: string;
  };
  summary: string;
  summaryTranslations?: {
    tr?: string;
    ar?: string;
  };
};

export const ISLAMIC_HOLIDAYS: IslamicHoliday[] = [
  {
    id: 'hijri-new-year',
    name: 'Hijri New Year',
    nameTranslations: { tr: 'Hicrî Yılbaşı', ar: 'رأس السنة الهجرية' },
    hijriDate: '1 Muharram',
    hijriDateTranslations: { ar: '١ محرّم', tr: '1 Muharrem' },
    summary: 'Start of the Islamic year.',
    summaryTranslations: {
      tr: 'Hicrî yılın başlangıcı.',
      ar: 'بداية السنة الهجرية.',
    },
  },
  {
    id: 'ashura',
    name: 'Ashura',
    nameTranslations: { tr: 'Aşure Günü', ar: 'يوم عاشوراء' },
    hijriDate: '10 Muharram',
    hijriDateTranslations: { ar: '١٠ محرّم', tr: '10 Muharrem' },
    summary: 'Day of fasting and remembrance.',
    summaryTranslations: { tr: 'Oruç ve tefekkür günü.', ar: 'يوم للصيام والذكر.' },
  },
  {
    id: 'mawlid',
    name: 'Mawlid an-Nabi',
    nameTranslations: { tr: 'Mevlid Kandili', ar: 'المولد النبوي' },
    hijriDate: '12 Rabi al-Awwal',
    hijriDateTranslations: { ar: '١٢ ربيع الأوّل', tr: '12 Rebiülevvel' },
    summary: 'Commemoration of the Prophet’s birth.',
    summaryTranslations: {
      tr: 'Peygamberimizin doğumunun anıldığı gün.',
      ar: 'إحياء ذكرى مولد النبي ﷺ.',
    },
  },
  {
    id: 'ramadan-start',
    name: 'Start of Ramadan',
    nameTranslations: { tr: 'Ramazan Başlangıcı', ar: 'بداية رمضان' },
    hijriDate: '1 Ramadan',
    hijriDateTranslations: { ar: '١ رمضان', tr: '1 Ramazan' },
    summary: 'Beginning of the fasting month.',
    summaryTranslations: { tr: 'Oruç ayının başlangıcı.', ar: 'بداية شهر الصيام.' },
  },
  {
    id: 'laylat-al-qadr',
    name: 'Laylat al-Qadr',
    nameTranslations: { tr: 'Kadir Gecesi', ar: 'ليلة القدر' },
    hijriDate: '27 Ramadan (observed)',
    hijriDateTranslations: {
      ar: '٢٧ رمضان (تقريبًا)',
      tr: '27 Ramazan (tahmini)',
    },
    summary: 'Night of Power in the last ten nights of Ramadan.',
    summaryTranslations: {
      tr: 'Ramazan’ın son on günündeki Kadir Gecesi.',
      ar: 'ليلة القدر في العشر الأواخر من رمضان.',
    },
  },
  {
    id: 'eid-al-fitr',
    name: 'Eid al-Fitr',
    nameTranslations: { tr: 'Ramazan Bayramı', ar: 'عيد الفطر' },
    hijriDate: '1 Shawwal',
    hijriDateTranslations: { ar: '١ شوّال', tr: '1 Şevval' },
    summary: 'Festival marking the end of Ramadan.',
    summaryTranslations: {
      tr: 'Ramazan’ın bitişini müjdeleyen bayram.',
      ar: 'عيد يُعلن انتهاء رمضان.',
    },
  },
  {
    id: 'day-of-arafah',
    name: 'Day of Arafah',
    nameTranslations: { tr: 'Arefe Günü', ar: 'يوم عرفة' },
    hijriDate: '9 Dhul Hijjah',
    hijriDateTranslations: { ar: '٩ ذو الحجة', tr: '9 Zilhicce' },
    summary: 'Day of fasting and reflection during Hajj.',
    summaryTranslations: {
      tr: 'Hac sırasında oruç ve tefekkür günü.',
      ar: 'يوم للصيام والتأمل أثناء الحج.',
    },
  },
  {
    id: 'eid-al-adha',
    name: 'Eid al-Adha',
    nameTranslations: { tr: 'Kurban Bayramı', ar: 'عيد الأضحى' },
    hijriDate: '10 Dhul Hijjah',
    hijriDateTranslations: { ar: '١٠ ذو الحجة', tr: '10 Zilhicce' },
    summary: 'Festival of sacrifice during Hajj.',
    summaryTranslations: {
      tr: 'Hac dönemindeki kurban bayramı.',
      ar: 'عيد الأضحى خلال موسم الحج.',
    },
  },
  {
    id: 'tashreeq',
    name: 'Days of Tashreeq',
    nameTranslations: { tr: 'Teşrik Günleri', ar: 'أيام التشريق' },
    hijriDate: '11–13 Dhul Hijjah',
    hijriDateTranslations: { ar: '١١–١٣ ذو الحجة', tr: '11–13 Zilhicce' },
    summary: 'Days of remembrance following Eid al-Adha.',
    summaryTranslations: {
      tr: 'Kurban Bayramı sonrası zikir günleri.',
      ar: 'أيام ذكر بعد عيد الأضحى.',
    },
  },
];
