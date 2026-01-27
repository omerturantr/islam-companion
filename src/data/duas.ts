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
  {
    id: 'evening',
    title: 'Evening Remembrance',
    titleTranslations: {
      tr: 'Akşam Zikri',
      ar: 'أذكار المساء',
    },
    arabic: 'اللهم بك أمسينا وبك أصبحنا وبك نحيا وبك نموت وإليك النشور',
    translation:
      'O Allah, by You we enter the evening and by You we enter the morning, by You we live and by You we die, and to You is the resurrection.',
    translationTranslations: {
      tr: 'Allah’ım! Seninle akşama girdik, Seninle sabaha çıktık; Seninle yaşar, Seninle ölürüz. Dönüş Sana.',
      ar: 'اللهم بك أمسينا وبك أصبحنا وبك نحيا وبك نموت وإليك النشور.',
    },
  },
  {
    id: 'waking-up',
    title: 'Upon Waking',
    titleTranslations: {
      tr: 'Uyanınca',
      ar: 'عند الاستيقاظ',
    },
    arabic: 'الحمد لله الذي أحيانا بعد ما أماتنا وإليه النشور',
    translation:
      'All praise is for Allah who gave us life after causing us to die, and to Him is the resurrection.',
    translationTranslations: {
      tr: 'Bizi öldürdükten sonra dirilten Allah’a hamdolsun. Dönüş O’nadır.',
      ar: 'الحمد لله الذي أحيانا بعد ما أماتنا وإليه النشور.',
    },
  },
  {
    id: 'before-eating',
    title: 'Before Eating',
    titleTranslations: {
      tr: 'Yemekten Önce',
      ar: 'قبل الطعام',
    },
    arabic: 'بسم الله',
    translation: 'In the name of Allah.',
    translationTranslations: {
      tr: 'Allah’ın adıyla.',
      ar: 'بسم الله.',
    },
  },
  {
    id: 'after-eating',
    title: 'After Eating',
    titleTranslations: {
      tr: 'Yemekten Sonra',
      ar: 'بعد الطعام',
    },
    arabic: 'الحمد لله الذي أطعمنا وسقانا وجعلنا مسلمين',
    translation:
      'All praise is for Allah who fed us, gave us drink, and made us Muslims.',
    translationTranslations: {
      tr: 'Bizi yediren, içiren ve Müslüman yapan Allah’a hamdolsun.',
      ar: 'الحمد لله الذي أطعمنا وسقانا وجعلنا مسلمين.',
    },
  },
  {
    id: 'enter-restroom',
    title: 'Entering the Restroom',
    titleTranslations: {
      tr: 'Tuvalete Girerken',
      ar: 'دعاء دخول الخلاء',
    },
    arabic: 'اللهم إني أعوذ بك من الخبث والخبائث',
    translation:
      'O Allah, I seek refuge in You from male and female devils.',
    translationTranslations: {
      tr: 'Allah’ım! Erkek ve dişi şeytanlardan Sana sığınırım.',
      ar: 'اللهم إني أعوذ بك من الخبث والخبائث.',
    },
  },
  {
    id: 'leave-restroom',
    title: 'Leaving the Restroom',
    titleTranslations: {
      tr: 'Tuvaletten Çıkınca',
      ar: 'دعاء الخروج من الخلاء',
    },
    arabic: 'غفرانك',
    translation: 'I seek Your forgiveness.',
    translationTranslations: {
      tr: 'Mağfiretini dilerim.',
      ar: 'غفرانك.',
    },
  },
  {
    id: 'enter-mosque',
    title: 'Entering the Mosque',
    titleTranslations: {
      tr: 'Camiye Girerken',
      ar: 'دعاء دخول المسجد',
    },
    arabic: 'اللهم افتح لي أبواب رحمتك',
    translation: 'O Allah, open for me the gates of Your mercy.',
    translationTranslations: {
      tr: 'Allah’ım! Rahmet kapılarını bana aç.',
      ar: 'اللهم افتح لي أبواب رحمتك.',
    },
  },
  {
    id: 'leave-mosque',
    title: 'Leaving the Mosque',
    titleTranslations: {
      tr: 'Camiden Çıkınca',
      ar: 'دعاء الخروج من المسجد',
    },
    arabic: 'اللهم إني أسألك من فضلك',
    translation: 'O Allah, I ask You for Your فضل (bounty).',
    translationTranslations: {
      tr: 'Allah’ım! Lütfundan isterim.',
      ar: 'اللهم إني أسألك من فضلك.',
    },
  },
  {
    id: 'protection-evil',
    title: 'Protection from Evil',
    titleTranslations: {
      tr: 'Kötülükten Korunma',
      ar: 'الاستعاذة من الشر',
    },
    arabic: 'أعوذ بكلمات الله التامات من شر ما خلق',
    translation:
      'I seek refuge in the perfect words of Allah from the evil of what He created.',
    translationTranslations: {
      tr: 'Allah’ın mükemmel kelimelerine, yarattıklarının şerrinden sığınırım.',
      ar: 'أعوذ بكلمات الله التامات من شر ما خلق.',
    },
  },
  {
    id: 'morning-protection',
    title: 'Morning/Evening Protection',
    titleTranslations: {
      tr: 'Sabah/Akşam Korunma',
      ar: 'حفظ الصباح والمساء',
    },
    arabic:
      'بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم',
    translation:
      'In the name of Allah, with whose name nothing can harm on earth or in heaven, and He is the All-Hearing, All-Knowing.',
    translationTranslations: {
      tr: 'Yerde ve gökte O’nun adıyla hiçbir şey zarar veremez. O işiten ve bilendir.',
      ar: 'بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم.',
    },
  },
  {
    id: 'guidance-simple',
    title: 'Guidance',
    titleTranslations: {
      tr: 'Hidayet',
      ar: 'الهداية',
    },
    arabic: 'اللهم اهدني وسددني',
    translation: 'O Allah, guide me and keep me steadfast.',
    translationTranslations: {
      tr: 'Allah’ım! Bana hidayet ver ve beni doğrult.',
      ar: 'اللهم اهدني وسددني.',
    },
  },
  {
    id: 'for-parents',
    title: 'For Parents',
    titleTranslations: {
      tr: 'Anne-Baba İçin',
      ar: 'للوالدين',
    },
    arabic: 'رب ارحمهما كما ربياني صغيرا',
    translation:
      'My Lord, have mercy upon them as they brought me up when I was small.',
    translationTranslations: {
      tr: 'Rabbim! Beni küçükken yetiştirdikleri gibi onlara merhamet et.',
      ar: 'رب ارحمهما كما ربياني صغيرا.',
    },
  },
  {
    id: 'forgiveness',
    title: 'Seeking Forgiveness',
    titleTranslations: {
      tr: 'Bağışlanma',
      ar: 'الاستغفار',
    },
    arabic: 'رب اغفر لي وتب علي إنك أنت التواب الرحيم',
    translation:
      'My Lord, forgive me and accept my repentance. Indeed, You are the Accepting of repentance, the Merciful.',
    translationTranslations: {
      tr: 'Rabbim! Beni bağışla ve tövbemi kabul et. Şüphesiz Sen tövbeleri kabul eden, merhametlisin.',
      ar: 'رب اغفر لي وتب علي إنك أنت التواب الرحيم.',
    },
  },
  {
    id: 'patience',
    title: 'Patience and Steadfastness',
    titleTranslations: {
      tr: 'Sabır ve Sebat',
      ar: 'الصبر والثبات',
    },
    arabic: 'ربنا أفرغ علينا صبرا وثبت أقدامنا',
    translation:
      'Our Lord, pour upon us patience and make our feet firm.',
    translationTranslations: {
      tr: 'Rabbimiz! Üzerimize sabır yağdır ve ayaklarımızı sağlam kıl.',
      ar: 'ربنا أفرغ علينا صبرا وثبت أقدامنا.',
    },
  },
  {
    id: 'gratitude',
    title: 'Gratitude',
    titleTranslations: {
      tr: 'Şükür',
      ar: 'الشكر',
    },
    arabic: 'الحمد لله على كل حال',
    translation: 'All praise is for Allah in every circumstance.',
    translationTranslations: {
      tr: 'Her hâl için Allah’a hamdolsun.',
      ar: 'الحمد لله على كل حال.',
    },
  },
];
