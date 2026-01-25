export type Dua = {
  id: string;
  title: string;
  arabic: string;
  translation: string;
  source?: string;
};

export const duas: Dua[] = [
  {
    id: 'morning',
    title: 'Morning Remembrance',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا',
    translation:
      'O Allah, I ask You for beneficial knowledge, good provision, and accepted deeds.',
    source: 'Hisn al-Muslim',
  },
  {
    id: 'sleep',
    title: 'Before Sleep',
    arabic: 'اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا',
    translation: 'O Allah, in Your name I die and I live.',
    source: 'Sahih al-Bukhari',
  },
  {
    id: 'travel',
    title: 'Travel',
    arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ',
    translation:
      'Glory to the One who made this subservient to us, and we could not have done it by ourselves.',
    source: 'Quran 43:13',
  },
];
