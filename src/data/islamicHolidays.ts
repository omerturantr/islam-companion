export type IslamicHoliday = {
  id: string;
  name: string;
  hijriDate: string;
  summary: string;
};

export const ISLAMIC_HOLIDAYS: IslamicHoliday[] = [
  {
    id: 'hijri-new-year',
    name: 'Hijri New Year',
    hijriDate: '1 Muharram',
    summary: 'Start of the Islamic year.',
  },
  {
    id: 'ashura',
    name: 'Ashura',
    hijriDate: '10 Muharram',
    summary: 'Day of fasting and remembrance.',
  },
  {
    id: 'mawlid',
    name: 'Mawlid an-Nabi',
    hijriDate: '12 Rabi al-Awwal',
    summary: 'Commemoration of the Prophet’s birth.',
  },
  {
    id: 'ramadan-start',
    name: 'Start of Ramadan',
    hijriDate: '1 Ramadan',
    summary: 'Beginning of the fasting month.',
  },
  {
    id: 'laylat-al-qadr',
    name: 'Laylat al-Qadr',
    hijriDate: '27 Ramadan (observed)',
    summary: 'Night of Power in the last ten nights of Ramadan.',
  },
  {
    id: 'eid-al-fitr',
    name: 'Eid al-Fitr',
    hijriDate: '1 Shawwal',
    summary: 'Festival marking the end of Ramadan.',
  },
  {
    id: 'day-of-arafah',
    name: 'Day of Arafah',
    hijriDate: '9 Dhul Hijjah',
    summary: 'Day of fasting and reflection during Hajj.',
  },
  {
    id: 'eid-al-adha',
    name: 'Eid al-Adha',
    hijriDate: '10 Dhul Hijjah',
    summary: 'Festival of sacrifice during Hajj.',
  },
  {
    id: 'tashreeq',
    name: 'Days of Tashreeq',
    hijriDate: '11–13 Dhul Hijjah',
    summary: 'Days of remembrance following Eid al-Adha.',
  },
];
