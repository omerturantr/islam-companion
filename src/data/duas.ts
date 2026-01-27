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
  {
    id: 'after-prayer',
    title: 'After Prayer',
    arabic:
      'أستغفر الله، أستغفر الله، أستغفر الله. اللهم أنت السلام ومنك السلام تباركت يا ذا الجلال والإكرام',
    translation:
      'I seek Allah’s forgiveness (three times). O Allah, You are Peace and from You comes peace. Blessed are You, O Possessor of majesty and honor.',
    source: 'Sahih Muslim',
  },
  {
    id: 'anxiety',
    title: 'Relief from Anxiety',
    arabic:
      'اللهم إني أعوذ بك من الهم والحزن، والعجز والكسل، والبخل والجبن، وضلع الدين وغلبة الرجال',
    translation:
      'O Allah, I seek refuge in You from worry and grief, from incapacity and laziness, from miserliness and cowardice, and from being heavily in debt and from being overpowered by men.',
    source: 'Sahih al-Bukhari',
  },
  {
    id: 'guidance',
    title: 'Guidance and Mercy',
    arabic: 'ربنا لا تزغ قلوبنا بعد إذ هديتنا وهب لنا من لدنك رحمة إنك أنت الوهاب',
    translation:
      'Our Lord, do not let our hearts deviate after You have guided us and grant us mercy from Yourself. Indeed, You are the Bestower.',
    source: 'Quran 3:8',
  },
  {
    id: 'enter-home',
    title: 'Entering Home',
    arabic: 'بسم الله ولجنا وبسم الله خرجنا وعلى ربنا توكلنا',
    translation:
      'In the name of Allah we enter, in the name of Allah we leave, and upon our Lord we rely.',
    source: 'Sunan Abi Dawud',
  },
];
