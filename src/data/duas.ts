export type Dua = {
  id: string;
  title: string;
  titleTranslations?: Partial<Record<'en' | 'tr' | 'ar', string>>;
  arabic: string;
  translation: string;
  translationTranslations?: Partial<Record<'en' | 'tr' | 'ar', string>>;
  source?: string;
};

export const duas: Dua[] = [
  {
    id: 'morning',
    title: 'Morning Remembrance',
    titleTranslations: {
      tr: 'Sabah Zikri',
      ar: 'أذكار الصباح',
    },
    arabic:
      'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا',
    translation:
      'O Allah, I ask You for beneficial knowledge, good provision, and accepted deeds.',
    translationTranslations: {
      tr: 'Allah’ım! Faydalı ilim, güzel rızık ve kabul edilmiş amel isterim.',
      ar: 'اللهم إني أسألك علمًا نافعًا ورزقًا طيبًا وعملاً متقبلاً.',
    },
    source: 'Hisn al-Muslim',
  },
  {
    id: 'sleep',
    title: 'Before Sleep',
    titleTranslations: {
      tr: 'Uyumadan Önce',
      ar: 'قبل النوم',
    },
    arabic: 'اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا',
    translation: 'O Allah, in Your name I die and I live.',
    translationTranslations: {
      tr: 'Allah’ım! Senin adınla ölür ve dirilirim.',
      ar: 'اللهم باسمك أموت وأحيا.',
    },
    source: 'Sahih al-Bukhari',
  },
  {
    id: 'travel',
    title: 'Travel',
    titleTranslations: {
      tr: 'Yolculuk Duası',
      ar: 'دعاء السفر',
    },
    arabic:
      'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ',
    translation:
      'Glory to the One who made this subservient to us, and we could not have done it by ourselves.',
    translationTranslations: {
      tr: 'Bunu bize boyun eğdiren Allah’ı tesbih ederiz; biz bunu yapamazdık.',
      ar: 'سبحان الذي سخر لنا هذا وما كنا له مقرنين.',
    },
    source: 'Quran 43:13',
  },
  {
    id: 'after-prayer',
    title: 'After Prayer',
    titleTranslations: {
      tr: 'Namazdan Sonra',
      ar: 'بعد الصلاة',
    },
    arabic:
      'أستغفر الله، أستغفر الله، أستغفر الله. اللهم أنت السلام ومنك السلام تباركت يا ذا الجلال والإكرام',
    translation:
      'I seek Allah’s forgiveness (three times). O Allah, You are Peace and from You comes peace. Blessed are You, O Possessor of majesty and honor.',
    translationTranslations: {
      tr: 'Üç kez istiğfar ederim. Allah’ım, Sen Selâm’sın, selâm Sendendir. Celâl ve ikram sahibi Allah’ım, mübareksin.',
      ar: 'أستغفر الله ثلاثًا. اللهم أنت السلام ومنك السلام تباركت يا ذا الجلال والإكرام.',
    },
    source: 'Sahih Muslim',
  },
  {
    id: 'anxiety',
    title: 'Relief from Anxiety',
    titleTranslations: {
      tr: 'Kaygıdan Sığınma',
      ar: 'دعاء الهم والحزن',
    },
    arabic:
      'اللهم إني أعوذ بك من الهم والحزن، والعجز والكسل، والبخل والجبن، وضلع الدين وغلبة الرجال',
    translation:
      'O Allah, I seek refuge in You from worry and grief, from incapacity and laziness, from miserliness and cowardice, and from being heavily in debt and from being overpowered by men.',
    translationTranslations: {
      tr: 'Allah’ım! Kederden ve hüzünden, acizlik ve tembellikten, cimrilik ve korkaklıktan, ağır borçtan ve insanların baskısından Sana sığınırım.',
      ar: 'اللهم إني أعوذ بك من الهم والحزن، والعجز والكسل، والبخل والجبن، وضلع الدين وغلبة الرجال.',
    },
    source: 'Sahih al-Bukhari',
  },
  {
    id: 'guidance',
    title: 'Guidance and Mercy',
    titleTranslations: {
      tr: 'Hidayet ve Rahmet',
      ar: 'الهداية والرحمة',
    },
    arabic:
      'ربنا لا تزغ قلوبنا بعد إذ هديتنا وهب لنا من لدنك رحمة إنك أنت الوهاب',
    translation:
      'Our Lord, do not let our hearts deviate after You have guided us and grant us mercy from Yourself. Indeed, You are the Bestower.',
    translationTranslations: {
      tr: 'Rabbimiz! Bizi hidayete erdirdikten sonra kalplerimizi eğriltme; bize katından rahmet ver. Şüphesiz Sen çok bağışlayansın.',
      ar: 'ربنا لا تزغ قلوبنا بعد إذ هديتنا وهب لنا من لدنك رحمة إنك أنت الوهاب.',
    },
    source: 'Quran 3:8',
  },
  {
    id: 'enter-home',
    title: 'Entering Home',
    titleTranslations: {
      tr: 'Eve Girerken',
      ar: 'دعاء دخول المنزل',
    },
    arabic: 'بسم الله ولجنا وبسم الله خرجنا وعلى ربنا توكلنا',
    translation:
      'In the name of Allah we enter, in the name of Allah we leave, and upon our Lord we rely.',
    translationTranslations: {
      tr: 'Allah’ın adıyla girdik, Allah’ın adıyla çıktık; Rabbimize tevekkül ettik.',
      ar: 'بسم الله ولجنا وبسم الله خرجنا وعلى ربنا توكلنا.',
    },
    source: 'Sunan Abi Dawud',
  },
];
