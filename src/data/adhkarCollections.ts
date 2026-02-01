export type AdhkarCollection = {
  id: string;
  title: string;
  url: string;
};

export type AdhkarCategory = {
  id: string;
  title: string;
  items: AdhkarCollection[];
};

export const prayerCollections: AdhkarCategory[] = [
  {
    id: 'prayers-dua',
    title: 'Prayers & Duas',
    items: [
      {
        id: 'quranic-duas',
        title: 'Qur’anic Duas',
        url: 'https://lifewithallah.com/dhikr-dua/main-adhkar/quranic-duas/',
      },
      {
        id: 'sunnah-duas',
        title: 'Sunnah Duas',
        url: 'https://lifewithallah.com/dhikr-dua/main-adhkar/sunnah-duas/',
      },
      {
        id: 'salah',
        title: 'Salah',
        url: 'https://lifewithallah.com/dhikr-dua/main-adhkar/salah/',
      },
      {
        id: 'after-salah',
        title: 'After Salah',
        url: 'https://lifewithallah.com/dhikr-dua/main-adhkar/after-salah/',
      },
    ],
  },
];

export const zikrCollections: AdhkarCategory[] = [
  {
    id: 'main-adhkar',
    title: 'Main Adhkar',
    items: [
      {
        id: 'morning',
        title: 'Morning Adhkar',
        url: 'https://lifewithallah.com/dhikr-dua/main-adhkar/morning/',
      },
      {
        id: 'evening',
        title: 'Evening Adhkar',
        url: 'https://lifewithallah.com/dhikr-dua/main-adhkar/evening/',
      },
      {
        id: 'before-sleep',
        title: 'Before Sleep',
        url: 'https://lifewithallah.com/dhikr-dua/main-adhkar/before-sleep/',
      },
      {
        id: 'ruqyah-illness',
        title: 'Ruqyah & Illness',
        url: 'https://lifewithallah.com/dhikr-dua/main-adhkar/ruqyah-and-illness-quran/',
      },
      {
        id: 'praises',
        title: 'Praises of Allah',
        url: 'https://lifewithallah.com/dhikr-dua/main-adhkar/praises-of-allah/',
      },
      {
        id: 'salawat',
        title: 'Salawat',
        url: 'https://lifewithallah.com/dhikr-dua/main-adhkar/salawat/',
      },
      {
        id: 'names-of-allah',
        title: 'Names of Allah',
        url: 'https://lifewithallah.com/dhikr-dua/main-adhkar/name-of-allah/',
      },
      {
        id: 'istighfar',
        title: 'Istighfar',
        url: 'https://lifewithallah.com/dhikr-dua/main-adhkar/istighfar/',
      },
    ],
  },
  {
    id: 'other-adhkar',
    title: 'Other Adhkar',
    items: [
      {
        id: 'waking-up',
        title: 'Waking up',
        url: 'https://lifewithallah.com/dhikr-dua/other-adhkar/waking-up/',
      },
      {
        id: 'nightmares',
        title: 'Nightmares',
        url: 'https://lifewithallah.com/dhikr-dua/other-adhkar/nightmares/',
      },
      {
        id: 'clothes',
        title: 'Clothes',
        url: 'https://lifewithallah.com/dhikr-dua/other-adhkar/clothes/',
      },
      {
        id: 'lavatory-wudu',
        title: 'Lavatory & Wudu',
        url: 'https://lifewithallah.com/dhikr-dua/other-adhkar/lavatory-and-wudu/',
      },
      {
        id: 'home',
        title: 'Home',
        url: 'https://lifewithallah.com/dhikr-dua/other-adhkar/home/',
      },
      {
        id: 'adhan-masjid',
        title: 'Adhan & Masjid',
        url: 'https://lifewithallah.com/dhikr-dua/other-adhkar/adhan-and-masjid/',
      },
      {
        id: 'istikharah',
        title: 'Istikharah',
        url: 'https://lifewithallah.com/dhikr-dua/other-adhkar/istikharah/',
      },
      {
        id: 'gatherings',
        title: 'Gatherings',
        url: 'https://lifewithallah.com/dhikr-dua/other-adhkar/gatherings/',
      },
      {
        id: 'food-drink',
        title: 'Food & Drink',
        url: 'https://lifewithallah.com/dhikr-dua/other-adhkar/food-and-drink/',
      },
      {
        id: 'travel',
        title: 'Travel',
        url: 'https://lifewithallah.com/dhikr-dua/other-adhkar/travel/',
      },
      {
        id: 'death',
        title: 'Death',
        url: 'https://lifewithallah.com/dhikr-dua/other-adhkar/death/',
      },
      {
        id: 'nature',
        title: 'Nature',
        url: 'https://lifewithallah.com/dhikr-dua/other-adhkar/nature/',
      },
      {
        id: 'social',
        title: 'Social Interactions',
        url: 'https://lifewithallah.com/dhikr-dua/other-adhkar/social-interactions/',
      },
      {
        id: 'iman',
        title: 'Protection of Iman',
        url: 'https://lifewithallah.com/dhikr-dua/other-adhkar/protection-of-iman/',
      },
      {
        id: 'difficulties-happiness',
        title: 'Difficulties & Happiness',
        url: 'https://lifewithallah.com/dhikr-dua/other-adhkar/difficulties-and-happiness/',
      },
      {
        id: 'hajj-umrah',
        title: 'Hajj & Umrah',
        url: 'https://lifewithallah.com/dhikr-dua/other-adhkar/hajj-and-umrah/',
      },
      {
        id: 'money-shopping',
        title: 'Money & Shopping',
        url: 'https://lifewithallah.com/dhikr-dua/other-adhkar/money-and-shopping/',
      },
      {
        id: 'marriage-children',
        title: 'Marriage & Children',
        url: 'https://lifewithallah.com/dhikr-dua/other-adhkar/marriage-and-children/',
      },
    ],
  },
];
