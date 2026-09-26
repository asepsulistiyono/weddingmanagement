import type { ReligionFormat, InvitationFormatConfig } from '../types.ts';

export interface ReligionPresetDetail {
  id: ReligionFormat;
  name: string;
  badge: string;
  iconText: string;
  tagline: string;
  accentColor: string;
  description: string;
  config: InvitationFormatConfig;
  configEn: InvitationFormatConfig;
  alternativeVerses?: Array<{
    label: string;
    text: string;
    source: string;
  }>;
}

export const RELIGION_PRESETS: Record<ReligionFormat, ReligionPresetDetail> = {
  islam: {
    id: 'islam',
    name: 'Islam',
    badge: '🕌 Nuansa Islami',
    iconText: '🕌',
    tagline: 'Akad Nikah & Walimatul \'Ursy dengan nilai-nilai syar\'i yang khidmat',
    accentColor: 'emerald',
    description: 'Format islami diawali salam dan basmalah, mukadimah ayat suci Ar-Rum: 21, prosesi Akad Nikah, serta doa restu keberkahan sakinah mawaddah warahmah.',
    config: {
      religion: 'islam',
      openingGreeting: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
      openingSubtext: "Dengan memohon rahmat dan ridho Allah Subhanahu Wa Ta'ala, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk menghadiri syukuran pernikahan kami:",
      holyVerse: {
        label: "Ayat Suci Al-Qur'an",
        text: "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda bagi kaum yang berpikir.",
        source: "QS. Ar-Rum: 21"
      },
      ceremonyName: 'Akad Nikah',
      receptionName: "Walimatul 'Ursy / Resepsi",
      closingGreeting: "Wassalamu'alaikum Warahmatullahi Wabarakatuh",
      closingBlessing: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu bagi kedua mempelai."
    },
    configEn: {
      religion: 'islam',
      openingGreeting: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
      openingSubtext: "By seeking the grace and blessings of Allah Subhanahu Wa Ta'ala, we cordially invite you to celebrate our sacred wedding union:",
      holyVerse: {
        label: "Sacred Quran Verse",
        text: "And among His signs is that He created for you spouses from among yourselves, that you may find tranquility in them; and He placed between you affection and mercy. Indeed in that are signs for a people who reflect.",
        source: "Quran Surah Ar-Rum: 21"
      },
      ceremonyName: 'Akad Nikah (Holy Matrimony)',
      receptionName: "Walimatul 'Ursy / Wedding Reception",
      closingGreeting: "Wassalamu'alaikum Warahmatullahi Wabarakatuh",
      closingBlessing: "It is our greatest honor and joy to welcome your gracious presence and heartfelt prayers of blessing for the newly wedded couple."
    },
    alternativeVerses: [
      {
        label: "Ayat Suci Al-Qur'an",
        text: "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri...",
        source: "QS. Ar-Rum: 21"
      },
      {
        label: "Hadits Riwayat Thabrani",
        text: "Barangsiapa menikah, maka ia telah menyempurnakan separuh agamanya. Dan hendaklah ia bertakwa kepada Allah dalam memelihara yang separuhnya lagi.",
        source: "HR. Ath-Thabrani"
      },
      {
        label: "Ayat Suci Al-Qur'an",
        text: "Dan segala sesuatu Kami ciptakan berpasang-pasangan agar kamu mengingat kebesaran Allah.",
        source: "QS. Adz-Dzariyat: 49"
      }
    ]
  },

  kristen: {
    id: 'kristen',
    name: 'Kristen / Katolik',
    badge: '✝️ Nuansa Kristiani',
    iconText: '✝️',
    tagline: 'Pemberkatan Nikah Kudus (Holy Matrimony) dalam kasih Kristus',
    accentColor: 'indigo',
    description: 'Format kristiani berpusat pada kasih agape Kristus, janji suci yang dipersatukan Allah dalam Matius 19:6, dan tata upacara ibadah pemberkatan kudus.',
    config: {
      religion: 'kristen',
      openingGreeting: 'Salam Sejahtera dalam Kasih Tuhan Yesus Kristus',
      openingSubtext: 'Atas kasih karunia dan penyertaan Tuhan Yang Maha Pengasih, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk menjadi saksi ikatan suci pernikahan kami:',
      holyVerse: {
        label: 'Ayat Suci Alkitab',
        text: 'Demikianlah mereka bukan lagi dua, melainkan satu. Karena itu, apa yang telah dipersatukan Allah, tidak boleh diceraikan manusia.',
        source: 'Matius 19:6'
      },
      ceremonyName: 'Pemberkatan Kudus (Holy Matrimony)',
      receptionName: 'Resepsi Pernikahan',
      closingGreeting: 'Damai dan Kasih Kristus Menyertai Kita Semua',
      closingBlessing: 'Kehadiran serta doa restu Bapak/Ibu/Saudara/i sekalian adalah berkat dan sukacita terindah bagi awal perjalanan bahtera rumah tangga kami.'
    },
    configEn: {
      religion: 'kristen',
      openingGreeting: 'Peace and Grace in our Lord Jesus Christ',
      openingSubtext: 'By the gracious mercy and fellowship of our Loving Lord God, we cordially invite you to witness the sacred bond of our holy matrimony:',
      holyVerse: {
        label: 'Sacred Bible Scripture',
        text: 'So they are no longer two, but one flesh. Therefore what God has joined together, let no one separate.',
        source: 'Matthew 19:6'
      },
      ceremonyName: 'Holy Matrimony Blessing',
      receptionName: 'Wedding Reception',
      closingGreeting: 'May the Peace and Love of Christ Be with Us All',
      closingBlessing: 'Your esteemed presence and prayers are the most precious blessings and joy as we embark upon the journey of our married life.'
    },
    alternativeVerses: [
      {
        label: 'Ayat Suci Alkitab',
        text: 'Demikianlah mereka bukan lagi dua, melainkan satu. Karena itu, apa yang telah dipersatukan Allah, tidak boleh diceraikan manusia.',
        source: 'Matius 19:6'
      },
      {
        label: 'Ayat Suci Alkitab',
        text: 'Kasih itu sabar; kasih itu murah hati; ia tidak cemburu. Ia tidak memegahkan diri dan tidak sombong. Kasih menutupi segala sesuatu, percaya segala sesuatu, mengharapkan segala sesuatu, sabar menanggung segala sesuatu.',
        source: '1 Korintus 13:4,7'
      },
      {
        label: 'Ayat Suci Alkitab',
        text: 'Berdua lebih baik dari pada seorang diri, karena mereka menerima upah yang baik dalam jerih payah mereka. Karena kalau mereka jatuh, yang seorang mengangkat temannya.',
        source: 'Pengkhotbah 4:9-10'
      }
    ]
  },

  hindu: {
    id: 'hindu',
    name: 'Hindu',
    badge: '🕉️ Nuansa Hindu',
    iconText: '🕉️',
    tagline: 'Upacara Pawiwahan yang agung dengan asung kertha wara nugraha Sang Hyang Widhi',
    accentColor: 'amber',
    description: 'Format hindu kental dengan doa Om Swastyastu, sloka suci Rg Veda tentang kerukunan dan kelanggengan hidup berumah tangga, dan upacara Pawiwahan.',
    config: {
      religion: 'hindu',
      openingGreeting: 'Om Swastyastu',
      openingSubtext: 'Atas asung kertha wara nugraha Ida Sang Hyang Widhi Wasa / Tuhan Yang Maha Esa, kami sekeluarga bermaksud menyelenggarakan Upacara Pawiwahan (Pernikahan) putra-putri kami:',
      holyVerse: {
        label: 'Sloka Suci Rg Veda',
        text: 'Ihaiva stam ma vi yaustam visvam ayur vyasnutam, kridantau putrair naptrbhih modamanau sve grhe. (Wahai pasangan pengantin, semoga kalian senantiasa bersatu tak terpisahkan, mengecap usia penuh, bergembira bersama anak dan cucu dalam rumah tangga yang damai dan sejahtera).',
        source: 'Rg Veda X.85.42'
      },
      ceremonyName: 'Upacara Pawiwahan',
      receptionName: 'Resepsi Pawiwahan',
      closingGreeting: 'Om Shanti, Shanti, Shanti Om',
      closingBlessing: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami sekeluarga apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu kepada kedua mempelai.'
    },
    configEn: {
      religion: 'hindu',
      openingGreeting: 'Om Swastyastu',
      openingSubtext: 'By the divine grace and blessings of Ida Sang Hyang Widhi Wasa / God Almighty, our family cordially invites you to the sacred Pawiwahan wedding ceremony of our children:',
      holyVerse: {
        label: 'Sacred Sloka of Rg Veda',
        text: 'May you never be separated; may you live together through your full span of years, rejoicing with your children and grandchildren in a blissful and peaceful home.',
        source: 'Rg Veda X.85.42'
      },
      ceremonyName: 'Pawiwahan Ceremony',
      receptionName: 'Pawiwahan Reception',
      closingGreeting: 'Om Shanti, Shanti, Shanti Om',
      closingBlessing: 'It is a great honor and immense joy for our family to receive your presence and heartfelt blessings for the bride and groom.'
    },
    alternativeVerses: [
      {
        label: 'Sloka Suci Rg Veda',
        text: 'Ihaiva stam ma vi yaustam visvam ayur vyasnutam, kridantau putrair naptrbhih modamanau sve grhe.',
        source: 'Rg Veda X.85.42'
      },
      {
        label: 'Kitab Manawa Dharmasastra',
        text: 'Hendaklah hubungan suami dan istri ini senantiasa berlangsung seumur hidup, tidak terpecahkan dan keduanya tidak melanggar kewajiban masing-masing.',
        source: 'Manawa Dharmasastra IX.101'
      }
    ]
  },

  buddha: {
    id: 'buddha',
    name: 'Buddha',
    badge: '☸️ Nuansa Buddhis',
    iconText: '☸️',
    tagline: 'Pemberkatan Nikah Buddhis berlandaskan Dhamma dan kasih sayang',
    accentColor: 'orange',
    description: 'Format buddhis dibuka dengan Namo Buddhaya, bimbingan kebajikan Samajivina Sutta tentang keselarasan iman dan kebijaksanaan, serta doa berkah Sabbe Satta.',
    config: {
      religion: 'buddha',
      openingGreeting: 'Namo Buddhaya',
      openingSubtext: 'Dengan rasa syukur dan memohon berkah dari Sang Tiratana (Buddha, Dhamma, Sangha), kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri ikatan pernikahan suci kami:',
      holyVerse: {
        label: 'Petikan Sutta / Anguttara Nikaya',
        text: 'Bila dua insan saling mencintai dan bertekad hidup bersama, bila keduanya memiliki keyakinan yang sepadan, kebajikan yang sepadan, kemurahan hati yang sepadan, dan kebijaksanaan yang sepadan, maka mereka akan senantiasa harmonis dan berbahagia bersama.',
        source: 'Samajivina Sutta (Anguttara Nikaya 4.55)'
      },
      ceremonyName: 'Pemberkatan Nikah Buddhis',
      receptionName: 'Resepsi Pernikahan',
      closingGreeting: 'Sabbe Satta Bhavantu Sukhitatta (Semoga Semua Makhluk Berbahagia)',
      closingBlessing: 'Kehadiran serta doa restu yang tulus dari Bapak/Ibu/Saudara/i sekalian merupakan berkah dan kehormatan yang tak terhingga bagi kami sekeluarga.'
    },
    configEn: {
      religion: 'buddha',
      openingGreeting: 'Namo Buddhaya',
      openingSubtext: 'With deep gratitude and seeking the blessings of the Triple Gem (Buddha, Dhamma, Sangha), we cordially invite you to celebrate our sacred wedding matrimony:',
      holyVerse: {
        label: 'Excerpt from the Sutta / Anguttara Nikaya',
        text: 'If two individuals cherish each other and wish to live together, matching in faith, virtuous conduct, generosity, and wisdom, they shall abide in harmony and lasting joy.',
        source: 'Samajivina Sutta (Anguttara Nikaya 4.55)'
      },
      ceremonyName: 'Buddhist Matrimony Blessing',
      receptionName: 'Wedding Reception',
      closingGreeting: 'Sabbe Satta Bhavantu Sukhitatta (May All Beings Be Peaceful and Happy)',
      closingBlessing: 'Your presence and sincere blessings are an invaluable gift and boundless honor to our entire family.'
    },
    alternativeVerses: [
      {
        label: 'Petikan Sutta / Anguttara Nikaya',
        text: 'Bila dua insan saling mencintai dan bertekad hidup bersama dengan keyakinan, kebajikan, kedermawanan, dan kebijaksanaan yang sepadan, mereka akan senantiasa berbahagia.',
        source: 'Samajivina Sutta'
      },
      {
        label: 'Syair Kitab Dhammapada',
        text: 'Kebajikan yang dipupuk bersama bagaikan wewangian yang merebak menentang arah angin; ia membawa kebahagiaan dalam kehidupan ini dan seterusnya.',
        source: 'Dhammapada: 54'
      }
    ]
  },

  konghucu: {
    id: 'konghucu',
    name: 'Konghucu',
    badge: '☯️ Nuansa Konghucu',
    iconText: '☯️',
    tagline: 'Upacara Li Yuan berlandaskan kebajikan Tian dan harmoni keluarga',
    accentColor: 'rose',
    description: 'Format konghucu berakar pada kebajikan Tian (Wei De Dong Tian), petikan kitab Zhong Yong mengenai awal kebajikan seorang Junzi dalam rumah tangga, dan upacara Li Yuan.',
    config: {
      religion: 'konghucu',
      openingGreeting: 'Wei De Dong Tian (Hanya Kebajikan Tian Berkenan)',
      openingSubtext: 'Dengan memohon bimbingan dan berkah kebajikan Tian Yang Maha Esa serta para Nabi dan Suci, kami bermaksud melaksanakan upacara pernikahan suci putra-putri kami:',
      holyVerse: {
        label: 'Kitab Suci Si Shu (Zhong Yong)',
        text: 'Jalan Suci seorang Junzi (insan berbudi luhur) berawal dari kehidupan suami-istri yang penuh keselarasan; bila telah dibina dengan kebajikan sejati, sinarnya akan menerangi dan membawa berkah bagi seisi semesta.',
        source: 'Kitab Zhong Yong XII:4'
      },
      ceremonyName: 'Upacara Li Yuan (Pemberkatan Litang / Kelenteng)',
      receptionName: 'Resepsi Pernikahan',
      closingGreeting: 'Shanzai. Xian You Yi De (Hanya Ada Satu Kebajikan)',
      closingBlessing: 'Merupakan kehormatan dan sukacita yang mendalam bagi kami sekeluarga atas kehadiran dan doa restu Bapak/Ibu/Saudara/i sekalian.'
    },
    configEn: {
      religion: 'konghucu',
      openingGreeting: 'Wei De Dong Tian (Only Virtue Moves Heaven)',
      openingSubtext: 'Seeking the benevolent guidance and blessings of Almighty Tian, the Holy Prophets and Sages, we cordially invite you to the sacred marriage ceremony of our children:',
      holyVerse: {
        label: 'Sacred Scripture Si Shu (Zhong Yong)',
        text: 'The Dao of a noble soul begins with harmony between husband and wife; when cultivated with genuine virtue, its radiant light illuminates and blesses all of creation.',
        source: 'Kitab Zhong Yong XII:4'
      },
      ceremonyName: 'Li Yuan Ceremony (Temple Blessing)',
      receptionName: 'Wedding Reception',
      closingGreeting: 'Shanzai. Xian You Yi De (There is Only One Virtue)',
      closingBlessing: 'It is our family’s deep honor and profound joy to welcome your gracious presence and heartfelt blessings.'
    },
    alternativeVerses: [
      {
        label: 'Kitab Suci Si Shu (Zhong Yong)',
        text: 'Jalan Suci seorang Junzi berawal dari kehidupan suami-istri yang penuh keselarasan; bila telah dibina dengan kebajikan sejati, sinarnya akan menerangi seisi alam.',
        source: 'Kitab Zhong Yong XII:4'
      },
      {
        label: 'Kitab Suci Shi Jing (Kitab Sanjak)',
        text: 'Istri dan anak-anak hidup rukun mesra, laksana kecapi dan harpa berpadu dalam harmoni merdu; demikianlah keluarga bahagia yang diberkahi langit.',
        source: 'Kitab Shi Jing II.I.IV.7'
      }
    ]
  },

  universal: {
    id: 'universal',
    name: 'Universal / Nasional',
    badge: '🕊️ Netral & Elegan',
    iconText: '🕊️',
    tagline: 'Janji Suci pernikahan yang inklusif, hangat, dan berkelas untuk semua kalangan',
    accentColor: 'stone',
    description: 'Format universal dirancang netral, inklusif, dan puitis tanpa terikat denominasi tertentu. Cocok untuk pernikahan bertema modern, multikultural, atau resepsi umum.',
    config: {
      religion: 'universal',
      openingGreeting: 'Salam Damai dan Sejahtera Bagi Kita Semua',
      openingSubtext: 'Dengan penuh rasa syukur dan sukacita, kami bermaksud merayakan momen istimewa penyatuan cinta dan komitmen suci kami bersama keluarga serta sahabat terkasih:',
      holyVerse: {
        label: 'Untaian Kasih & Komitmen Suci',
        text: 'Cinta sejati bukan sekadar saling memandang, melainkan memandang bersama ke arah masa depan yang sama, saling merawat, menghormati, dan melangkah bersama dalam kasih selamanya.',
        source: 'Untaian Mutiara Kasih'
      },
      ceremonyName: 'Janji Suci Pernikahan (Ceremony)',
      receptionName: 'Resepsi Pernikahan',
      closingGreeting: 'Salam Hangat dan Penuh Cinta Kasih',
      closingBlessing: 'Kehadiran dan doa restu dari Bapak/Ibu/Saudara/i sekalian adalah karunia yang sangat berarti dalam lembaran baru perjalanan hidup kami berdua.'
    },
    configEn: {
      religion: 'universal',
      openingGreeting: 'Peace and Warm Greetings to Everyone',
      openingSubtext: 'With joyful hearts and deep gratitude, we warmly invite you to celebrate the sacred union of our love alongside our cherished family and friends:',
      holyVerse: {
        label: 'Words of Love & Commitment',
        text: 'True love is not just looking at one another, but looking together in the same direction, caring, honoring, and walking hand in hand through life forever.',
        source: 'Reflection on Everlasting Love'
      },
      ceremonyName: 'Wedding Vows & Matrimony',
      receptionName: 'Wedding Reception',
      closingGreeting: 'Warmest Regards and Sincere Love',
      closingBlessing: 'Your presence, prayers, and warm wishes are an invaluable gift as we open this new chapter of our journey together.'
    },
    alternativeVerses: [
      {
        label: 'Untaian Kasih & Komitmen Suci',
        text: 'Cinta sejati bukan sekadar saling memandang, melainkan memandang bersama ke arah masa depan yang sama, saling merawat, menghormati, dan melangkah bersama dalam kasih selamanya.',
        source: 'Untaian Mutiara Kasih'
      },
      {
        label: 'Kata Mutiara Kehidupan',
        text: 'Pernikahan bukanlah mencari kesempurnaan, melainkan tentang dua jiwa yang memilih untuk saling melengkapi, saling memaafkan, dan saling setia melewati setiap musim kehidupan.',
        source: 'Refleksi Perjalanan Cinta'
      }
    ]
  }
};

export const RELIGION_LIST: ReligionFormat[] = [
  'islam',
  'kristen',
  'hindu',
  'buddha',
  'konghucu',
  'universal'
];

/**
 * Returns the fully localized invitation format configuration.
 * When lang is 'en', handles automatic intelligent translation of standard Indonesian
 * religion opening subtexts, verses, ceremonies, and blessings into English.
 */
export function getTranslatedInvitationFormat(
  format: InvitationFormatConfig | undefined,
  lang: 'id' | 'en'
): InvitationFormatConfig {
  const religion = format?.religion || 'islam';
  const preset = RELIGION_PRESETS[religion] || RELIGION_PRESETS.islam;

  if (lang !== 'en') {
    return {
      religion,
      openingGreeting: format?.openingGreeting || preset.config.openingGreeting,
      openingSubtext: format?.openingSubtext || preset.config.openingSubtext,
      holyVerse: {
        label: format?.holyVerse?.label || preset.config.holyVerse?.label || "Ayat Suci",
        text: format?.holyVerse?.text || preset.config.holyVerse?.text || '',
        source: format?.holyVerse?.source || preset.config.holyVerse?.source || ''
      },
      ceremonyName: format?.ceremonyName || preset.config.ceremonyName,
      receptionName: format?.receptionName || preset.config.receptionName,
      closingGreeting: format?.closingGreeting || preset.config.closingGreeting,
      closingBlessing: format?.closingBlessing || preset.config.closingBlessing
    };
  }

  // English translation mode
  const en = preset.configEn;

  // Intelligent translation of opening subtext
  let openingSubtext = en.openingSubtext;
  if (format?.openingSubtext) {
    const s = format.openingSubtext.toLowerCase();
    if (s.includes('dengan memohon rahmat') || s.includes('rahmat dan ridho') || s.includes('syukuran pernikahan')) {
      openingSubtext = "By seeking the grace and blessings of Allah Subhanahu Wa Ta'ala, we cordially invite you to celebrate our sacred wedding union:";
    } else if (s.includes('kasih karunia') || s.includes('penyertaan tuhan')) {
      openingSubtext = "By the gracious mercy and fellowship of our Loving Lord God, we cordially invite you to witness the sacred bond of our holy matrimony:";
    } else if (s.includes('asung kertha') || s.includes('pawiwahan')) {
      openingSubtext = "By the divine grace and blessings of Ida Sang Hyang Widhi Wasa / God Almighty, our family cordially invites you to the sacred Pawiwahan wedding ceremony of our children:";
    } else if (s.includes('tiratana') || s.includes('buddha') || s.includes('dhamma')) {
      openingSubtext = "With deep gratitude and seeking the blessings of the Triple Gem (Buddha, Dhamma, Sangha), we cordially invite you to celebrate our sacred wedding matrimony:";
    } else if (s.includes('bimbingan dan berkah') || s.includes('tian')) {
      openingSubtext = "Seeking the benevolent guidance and blessings of Almighty Tian, the Holy Prophets and Sages, we cordially invite you to the sacred marriage ceremony of our children:";
    } else if (s.includes('rasa syukur') || s.includes('momen istimewa') || s.includes('penyatuan cinta')) {
      openingSubtext = "With joyful hearts and deep gratitude, we warmly invite you to celebrate the sacred union of our love alongside our cherished family and friends:";
    } else {
      openingSubtext = en.openingSubtext;
    }
  }

  // Intelligent translation of closing blessing
  let closingBlessing = en.closingBlessing;
  if (format?.closingBlessing) {
    const b = format.closingBlessing.toLowerCase();
    if (b.includes('kehormatan dan kebahagiaan') || b.includes('doa restu') || b.includes('berkenan hadir')) {
      closingBlessing = "It is our greatest honor and joy to welcome your gracious presence and heartfelt blessings for the newly wedded couple.";
    } else if (b.includes('sukacita terindah') || b.includes('berkat dan sukacita')) {
      closingBlessing = "Your esteemed presence and prayers are the most precious blessings and joy as we embark upon the journey of our married life.";
    } else {
      closingBlessing = en.closingBlessing;
    }
  }

  // Intelligent translation of holy verse
  let holyVerse = en.holyVerse;
  if (format?.holyVerse?.source?.includes('19:6') || format?.holyVerse?.source?.includes('Matius')) {
    holyVerse = RELIGION_PRESETS.kristen.configEn.holyVerse;
  } else if (format?.holyVerse?.source?.includes('Ar-Rum') || format?.holyVerse?.label?.toLowerCase().includes("al-qur'an")) {
    holyVerse = RELIGION_PRESETS.islam.configEn.holyVerse;
  } else if (format?.holyVerse?.source?.includes('Veda')) {
    holyVerse = RELIGION_PRESETS.hindu.configEn.holyVerse;
  } else if (format?.holyVerse?.source?.includes('Sutta') || format?.holyVerse?.source?.includes('Nikaya')) {
    holyVerse = RELIGION_PRESETS.buddha.configEn.holyVerse;
  } else if (format?.holyVerse?.source?.includes('Zhong') || format?.holyVerse?.source?.includes('Shi Jing')) {
    holyVerse = RELIGION_PRESETS.konghucu.configEn.holyVerse;
  } else if (format?.holyVerse?.source?.includes('Kasih') || format?.holyVerse?.source?.includes('Mutiara')) {
    holyVerse = RELIGION_PRESETS.universal.configEn.holyVerse;
  }

  return {
    religion,
    openingGreeting: en.openingGreeting || format?.openingGreeting || preset.config.openingGreeting,
    openingSubtext,
    holyVerse: holyVerse || en.holyVerse,
    ceremonyName: en.ceremonyName || format?.ceremonyName || preset.config.ceremonyName,
    receptionName: en.receptionName || format?.receptionName || preset.config.receptionName,
    closingGreeting: en.closingGreeting || format?.closingGreeting || preset.config.closingGreeting,
    closingBlessing
  };
}
