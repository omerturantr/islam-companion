export type WisdomEntry = {
  text: string;
  reference: string;
};

export type DailyWisdom = {
  verse: WisdomEntry;
  hadith: WisdomEntry;
};

const VERSES: WisdomEntry[] = [
  {
    text: 'Allah does not burden a soul beyond what it can bear.',
    reference: 'Quran 2:286',
  },
  {
    text: 'Surely in the remembrance of Allah do hearts find rest.',
    reference: 'Quran 13:28',
  },
  {
    text: 'Indeed, with hardship comes ease.',
    reference: 'Quran 94:5-6',
  },
  {
    text: 'Do not despair of the mercy of Allah. Indeed, Allah forgives all sins.',
    reference: 'Quran 39:53',
  },
  {
    text: 'Seek help through patience and prayer.',
    reference: 'Quran 2:153',
  },
  {
    text: 'If Allah helps you, none can overcome you.',
    reference: 'Quran 3:160',
  },
  {
    text: 'If you are grateful, I will surely increase you.',
    reference: 'Quran 14:7',
  },
];

const HADITHS: WisdomEntry[] = [
  {
    text: 'Actions are judged by intentions.',
    reference: 'Sahih al-Bukhari, Sahih Muslim',
  },
  {
    text: 'The best of you are those who learn the Quran and teach it.',
    reference: 'Sahih al-Bukhari',
  },
  {
    text: 'Allah is kind and loves kindness in all matters.',
    reference: 'Sahih al-Bukhari, Sahih Muslim',
  },
  {
    text: 'Smiling at your brother is charity.',
    reference: 'Jami` at-Tirmidhi',
  },
  {
    text: 'Make things easy and do not make them difficult.',
    reference: 'Sahih al-Bukhari, Sahih Muslim',
  },
  {
    text: 'Whoever believes in Allah and the Last Day should speak good or remain silent.',
    reference: 'Sahih al-Bukhari, Sahih Muslim',
  },
  {
    text: 'None of you truly believes until he loves for his brother what he loves for himself.',
    reference: 'Sahih al-Bukhari, Sahih Muslim',
  },
];

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export const getDailyWisdom = (date: Date): DailyWisdom => {
  const seed = hashString(dayKey(date));
  const verse = VERSES[seed % VERSES.length];
  const hadith = HADITHS[(seed + 7) % HADITHS.length];
  return { verse, hadith };
};
