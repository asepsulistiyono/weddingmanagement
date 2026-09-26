import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'id' | 'en';

export interface Translations {
  common: {
    and: string;
    at: string;
    close: string;
    copy: string;
    copied: string;
    loading: string;
    onlineGuests: string;
    realtimeActive: string;
    connecting: string;
  };
  cover: {
    celebration: string;
    to: string;
    honoredGuest: string;
    person: string;
    apology: string;
    open: string;
    date: string;
  };
  nav: {
    home: string;
    couple: string;
    events: string;
    gallery: string;
    rsvp: string;
    wishes: string;
    gift: string;
    qr: string;
    adminLogin: string;
    admin: string;
  };
  hero: {
    eyebrow: string;
    invitationText: string;
    dateLocation: string;
    countdownTitle: string;
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
    saveCalendar: string;
  };
  couple: {
    eyebrow: string;
    title: string;
    subtitle: string;
    holyVerse: string;
    verseText: string;
    verseSource: string;
    groomBadge: string;
    brideBadge: string;
    sonOf: string;
    daughterOf: string;
    father: string;
    mother: string;
    and: string;
  };
  events: {
    eyebrow: string;
    title: string;
    subtitle: string;
    dayDate: string;
    time: string;
    venue: string;
    openMaps: string;
    dresscode: string;
    dresscodeVal: string;
    mapHeader: string;
    mapTitle: string;
    mapDesc: string;
    routeGuide: string;
    copyAddress: string;
    addressCopied: string;
  };
  story: {
    eyebrow: string;
    title: string;
    subtitle: string;
    galleryEyebrow: string;
    galleryTitle: string;
    gallerySubtitle: string;
    openFullGallery: string;
    photos: string;
    firstMeetTitle: string;
    firstMeetDesc: string;
    engagementTitle: string;
    engagementDesc: string;
    weddingDayTitle: string;
    weddingDayDesc: string;
    marriageTitle: string;
    marriageDesc: string;
  };
  galleryPage: {
    title: string;
    subtitle: string;
    allCategories: string;
    prewedding: string;
    engagement: string;
    romantic: string;
    weddingDay: string;
    slideshowPlay: string;
    slideshowPause: string;
    sharePhoto: string;
    linkCopied: string;
    photoOf: string;
    emptyCategory: string;
    moments: string;
  };
  rsvp: {
    eyebrow: string;
    title: string;
    subtitle: string;
    thankYou: string;
    confirmedFor: string;
    recordedAs: string;
    changeResponse: string;
    changeRsvp: string;
    fullName: string;
    nameLabel: string;
    fullNamePlaceholder: string;
    namePlaceholder: string;
    allocatedBadge: string;
    allocatedPax: string;
    statusLabel: string;
    attendanceLabel: string;
    attending: string;
    attendingDesc: string;
    notAttending: string;
    notAttendingDesc: string;
    tentative: string;
    tentativeDesc: string;
    paxLabel: string;
    paxUnit: string;
    person: string;
    notesLabel: string;
    notesPlaceholder: string;
    submitBtn: string;
    submitButton: string;
    submitting: string;
    fillNameAlert: string;
  };
  wishes: {
    title: string;
    subtitle: string;
    sendWishHeader: string;
    yourName: string;
    yourNamePlaceholder: string;
    yourWish: string;
    yourWishPlaceholder: string;
    sendWishBtn: string;
    sendWish: string;
    sending: string;
    sendingWish: string;
    filter: string;
    filterAll: string;
    filterAttending: string;
    filterPinned: string;
    messages: string;
    allWishes: string;
    pinnedWishes: string;
    pinned: string;
    attendingWishes: string;
    replyFromCouple: string;
    coupleReply: string;
    pinnedBadge: string;
    emptyWishes: string;
    successSent: string;
    fillRequiredAlert: string;
    verifiedWish: string;
    realtimeActive: string;
    connecting: string;
    onlineGuests: string;
    newWishAlert: string;
    closeAlert: string;
    wishSentSuccess: string;
    attendanceStatus: string;
    wishLabel: string;
    wishPlaceholder: string;
    realtimeNotice: string;
  };
  gifts: {
    eyebrow: string;
    tag: string;
    title: string;
    subtitle: string;
    accNumber: string;
    accountNumber: string;
    accName: string;
    recipientName: string;
    copyAcc: string;
    copyAccount: string;
    accCopied: string;
    accountCopied: string;
    deliveryTitle: string;
    deliveryDesc: string;
    recipient: string;
    physicalGiftAddress: string;
    copyAddress: string;
    addressCopied: string;
    confirmWa: string;
  };
  gift: {
    eyebrow: string;
    tag: string;
    title: string;
    subtitle: string;
    accNumber: string;
    accountNumber: string;
    accName: string;
    recipientName: string;
    copyAcc: string;
    copyAccount: string;
    accCopied: string;
    accountCopied: string;
    deliveryTitle: string;
    deliveryDesc: string;
    recipient: string;
    physicalGiftAddress: string;
    copyAddress: string;
    addressCopied: string;
    confirmWa: string;
  };
  qr: {
    title: string;
    subtitle: string;
    guestNameLabel: string;
    generalGuest: string;
    checkedIn: string;
    verified: string;
  };
  footer: {
    closing: string;
    family: string;
    bigFamily: string;
    rights: string;
    adminDashboard: string;
    adminPanel: string;
    thankYou: string;
    withJoy: string;
    allRights: string;
    openAdmin: string;
    adminLogin: string;
  };
  announcement: {
    label: string;
  };
}

export const dictionary: Record<Language, Translations> = {
  id: {
    common: {
      and: 'dan',
      at: 'Di',
      close: 'Tutup',
      copy: 'Salin',
      copied: 'Tersalin',
      loading: 'Memuat...',
      onlineGuests: 'Tamu Online',
      realtimeActive: 'Real-Time Aktif',
      connecting: 'Menghubungkan...'
    },
    cover: {
      celebration: 'The Wedding Celebration',
      to: 'Kepada Yth. Bapak/Ibu/Saudara/i',
      honoredGuest: 'Tamu Undangan Terhormat',
      person: 'Orang',
      apology: '*Mohon maaf bila ada kesalahan dalam penulisan nama/gelar',
      open: 'Buka Undangan',
      date: 'Sabtu, 24 Oktober 2026 • Jakarta'
    },
    nav: {
      home: 'Beranda',
      couple: 'Mempelai',
      events: 'Acara',
      gallery: 'Galeri',
      rsvp: 'RSVP',
      wishes: 'Ucapan',
      gift: 'Kado',
      qr: 'QR Pass',
      adminLogin: 'Login Admin',
      admin: 'Admin'
    },
    hero: {
      eyebrow: "Walimatul 'Ursy",
      invitationText: 'Kami mengundang Bapak/Ibu/Saudara/i untuk hadir & memberikan doa restu pada hari istimewa kami',
      dateLocation: 'Sabtu, 24 Oktober 2026 • Jakarta',
      countdownTitle: 'Menghitung Hari Menuju Hari Bahagia',
      days: 'Hari',
      hours: 'Jam',
      minutes: 'Menit',
      seconds: 'Detik',
      saveCalendar: 'Simpan Tanggal ke Google Calendar'
    },
    couple: {
      eyebrow: 'Pasangan Mempelai',
      title: 'Mempelai Pria & Wanita',
      subtitle: "Dengan memohon rahmat dan ridho Allah Subhanahu Wa Ta'ala, kami bermaksud mengikat janji suci pernikahan kami.",
      holyVerse: 'Ayat Suci',
      verseText: 'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.',
      verseSource: 'QS. Ar-Rum: 21',
      groomBadge: 'Mempelai Pria',
      brideBadge: 'Mempelai Wanita',
      sonOf: 'Putra pertama dari',
      daughterOf: 'Putri bungsu dari',
      father: 'Bpk.',
      mother: 'Ibu',
      and: '&'
    },
    events: {
      eyebrow: 'Waktu & Tempat',
      title: 'Rangkaian Acara',
      subtitle: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir pada rangkaian acara kami.',
      dayDate: 'Hari & Tanggal',
      time: 'Waktu Pelaksanaan',
      venue: 'Lokasi / Gedung',
      openMaps: 'Buka Google Maps',
      dresscode: 'Dresscode Tamu:',
      dresscodeVal: 'Formal / Batik / Earth Tone & Pastel Elegant',
      mapHeader: 'Peta Interaktif Google Maps',
      mapTitle: 'Navigasi & Lokasi Pernikahan',
      mapDesc: 'Klik penanda pada peta untuk melihat detail rute, waktu, dan panduan perjalanan menuju lokasi acara.',
      routeGuide: 'Petunjuk Rute',
      copyAddress: 'Salin Alamat',
      addressCopied: 'Alamat Disalin!'
    },
    story: {
      eyebrow: 'Kisah Kasih',
      title: 'Cerita Cinta Kami',
      subtitle: 'Setiap kisah cinta itu indah, namun kisah kami adalah yang paling berharga bagi kami berdua.',
      galleryEyebrow: 'Potret Kebahagiaan',
      galleryTitle: 'Galeri Kenangan',
      gallerySubtitle: 'Kumpulan momen manis perjalanan cinta kami dari awal pertemuan, lamaran, hingga menuju hari bahagia.',
      openFullGallery: 'Buka Halaman Galeri Foto Lengkap',
      photos: 'Foto',
      firstMeetTitle: 'Pertemuan Pertama',
      firstMeetDesc: 'Takdir mempertemukan kami pertama kali di kampus saat kegiatan seminar nasional.',
      engagementTitle: 'Hari Lamaran',
      engagementDesc: 'Dengan restu kedua keluarga, kami mantap melangkah ke jenjang yang lebih serius.',
      weddingDayTitle: 'Menuju Hari Bahagia',
      weddingDayDesc: 'Bismillah, kami siap mengarungi bahtera rumah tangga bersama selamanya.',
      marriageTitle: 'Ikatan Suci Pernikahan',
      marriageDesc: 'Menyatukan dua hati dan dua keluarga dalam ikatan pernikahan yang suci.'
    },
    galleryPage: {
      title: 'Galeri Foto Pernikahan',
      subtitle: 'Dokumentasi perjalanan kisah cinta dan potret kebahagiaan kami berdua.',
      allCategories: 'Semua',
      prewedding: 'Prewedding',
      engagement: 'Lamaran',
      romantic: 'Momen Romantis',
      weddingDay: 'Akad & Resepsi',
      slideshowPlay: 'Mulai Slideshow',
      slideshowPause: 'Jeda Slideshow',
      sharePhoto: 'Bagikan Foto',
      linkCopied: 'Tautan foto disalin!',
      photoOf: 'dari',
      emptyCategory: 'Belum ada foto pada kategori ini.',
      moments: 'Momen'
    },
    rsvp: {
      eyebrow: 'Konfirmasi Kehadiran',
      title: 'Reservasi Tempat (RSVP)',
      subtitle: 'Mohon konfirmasi kehadiran Anda demi kelancaran persiapan jamuan kami.',
      thankYou: 'Terima Kasih atas Konfirmasinya!',
      confirmedFor: 'Konfirmasi kehadiran untuk',
      recordedAs: 'telah berhasil dicatat',
      changeResponse: 'Ubah Konfirmasi Kehadiran',
      changeRsvp: 'Ubah Konfirmasi Kehadiran',
      fullName: 'Nama Lengkap Tamu',
      nameLabel: 'Nama Lengkap Tamu',
      fullNamePlaceholder: 'Masukkan nama lengkap Anda',
      namePlaceholder: 'Masukkan nama lengkap Anda',
      allocatedBadge: 'Tamu Terdaftar',
      allocatedPax: 'Alokasi {pax} Tamu',
      statusLabel: 'Status Konfirmasi Kehadiran',
      attendanceLabel: 'Pilihan Konfirmasi Kehadiran',
      attending: 'Akan Hadir',
      attendingDesc: 'Dengan senang hati saya akan hadir',
      notAttending: 'Tidak Hadir',
      notAttendingDesc: 'Mohon maaf belum dapat hadir',
      tentative: 'Masih Ragu',
      tentativeDesc: 'Akan dikonfirmasi mendekati hari H',
      paxLabel: 'Jumlah Tamu Hadir (Pax)',
      paxUnit: 'Orang',
      person: 'Orang',
      notesLabel: 'Pesan Tambahan / Catatan Khusus',
      notesPlaceholder: 'Contoh: Hadir bersama pasangan, mohon info parkir...',
      submitBtn: 'Kirim Konfirmasi Kehadiran',
      submitButton: 'Kirim Konfirmasi Kehadiran',
      submitting: 'Mengirim...',
      fillNameAlert: 'Mohon cantumkan nama Anda.'
    },
    wishes: {
      title: 'Ucapan Selamat & Doa Restu',
      subtitle: 'Tuliskan pesan hangat, doa, dan harapan tulus untuk kedua mempelai secara langsung.',
      sendWishHeader: 'Kirimkan Doa & Ucapan Anda',
      yourName: 'Nama Anda',
      yourNamePlaceholder: 'Nama lengkap atau panggilan...',
      yourWish: 'Pesan Ucapan & Doa Restu',
      yourWishPlaceholder: 'Tuliskan doa terbaik dan harapan indah untuk kedua mempelai...',
      sendWishBtn: 'Kirim Ucapan Sekarang',
      sendWish: 'Kirim Ucapan Sekarang',
      sending: 'Mengirim...',
      sendingWish: 'Mengirimkan Doa...',
      filter: 'Filter Ucapan',
      filterAll: 'Semua',
      filterAttending: 'Akan Hadir',
      filterPinned: 'Disematkan',
      messages: 'pesan doa',
      allWishes: 'Semua Ucapan',
      pinnedWishes: 'Disematkan',
      pinned: 'Disematkan',
      attendingWishes: 'Hadir',
      replyFromCouple: 'Balasan dari Mempelai',
      coupleReply: 'Balasan dari Kedua Mempelai',
      pinnedBadge: 'Disematkan oleh Mempelai',
      emptyWishes: 'Belum ada ucapan. Jadilah yang pertama memberikan doa restu!',
      successSent: 'Terima kasih! Ucapan Anda telah disiarkan secara langsung.',
      fillRequiredAlert: 'Nama dan pesan ucapan wajib diisi.',
      verifiedWish: 'Terkonfirmasi Tamu Undangan',
      realtimeActive: 'Live Real-Time',
      connecting: 'Menghubungkan...',
      onlineGuests: 'Tamu Online',
      newWishAlert: 'Doa restu baru saja diterima!',
      closeAlert: 'Tutup',
      wishSentSuccess: 'Doa restu Anda berhasil dikirim!',
      attendanceStatus: 'Status Kehadiran',
      wishLabel: 'Pesan Doa & Ucapan',
      wishPlaceholder: 'Tuliskan doa terbaik dan ucapan hangat untuk kedua mempelai...',
      realtimeNotice: 'Pesan Anda akan langsung tampil secara real-time.'
    },
    gifts: {
      eyebrow: 'Tanda Kasih',
      tag: 'Tanda Kasih',
      title: 'Amplop Digital & Kado',
      subtitle: 'Doa restu Anda merupakan karunia terindah bagi kami. Namun jika Anda bermaksud memberikan tanda kasih, kami menyediakan kemudahan berikut:',
      accNumber: 'Nomor Rekening',
      accountNumber: 'Nomor Rekening',
      accName: 'Atas Nama:',
      recipientName: 'Atas Nama',
      copyAcc: 'Salin Nomor Rekening',
      copyAccount: 'Salin Nomor Rekening',
      accCopied: 'Nomor Rekening Disalin!',
      accountCopied: 'Nomor Rekening Disalin!',
      deliveryTitle: 'Kirim Kado Fisik ke Alamat',
      deliveryDesc: 'Bagi yang ingin mengirimkan kado fisik atau hampers secara langsung ke kediaman mempelai:',
      recipient: 'Penerima:',
      physicalGiftAddress: 'Alamat Pengiriman Kado Fisik',
      copyAddress: 'Salin Alamat Lengkap',
      addressCopied: 'Alamat Disalin!',
      confirmWa: 'Konfirmasi Kiriman Kado via WhatsApp'
    },
    gift: {
      eyebrow: 'Tanda Kasih',
      tag: 'Tanda Kasih',
      title: 'Amplop Digital & Kado',
      subtitle: 'Doa restu Anda merupakan karunia terindah bagi kami. Namun jika Anda bermaksud memberikan tanda kasih, kami menyediakan kemudahan berikut:',
      accNumber: 'Nomor Rekening',
      accountNumber: 'Nomor Rekening',
      accName: 'Atas Nama:',
      recipientName: 'Atas Nama',
      copyAcc: 'Salin Nomor Rekening',
      copyAccount: 'Salin Nomor Rekening',
      accCopied: 'Nomor Rekening Disalin!',
      accountCopied: 'Nomor Rekening Disalin!',
      deliveryTitle: 'Kirim Kado Fisik ke Alamat',
      deliveryDesc: 'Bagi yang ingin mengirimkan kado fisik atau hampers secara langsung ke kediaman mempelai:',
      recipient: 'Penerima:',
      physicalGiftAddress: 'Alamat Pengiriman Kado Fisik',
      copyAddress: 'Salin Alamat Lengkap',
      addressCopied: 'Alamat Disalin!',
      confirmWa: 'Konfirmasi Kiriman Kado via WhatsApp'
    },
    qr: {
      title: 'QR Pass Undangan Digital',
      subtitle: 'Tunjukkan kode QR ini ke petugas meja resepsi saat tiba di lokasi acara untuk proses check-in cepat.',
      guestNameLabel: 'Nama Tamu Undangan',
      generalGuest: 'Tamu Umum / Sahabat Mempelai',
      checkedIn: 'Sudah Check-In',
      verified: 'Terverifikasi Buku Tamu Digital'
    },
    footer: {
      closing: 'Ungkapan terima kasih yang tulus dari lubuk hati kami atas kehadiran, doa, dan restu yang Anda berikan pada hari bahagia kami.',
      family: 'Kami yang berbahagia,',
      bigFamily: 'Keluarga Besar Bpk. H. Bambang Sudiro & Bpk. Ir. H. Ahmad Fauzi',
      rights: 'All rights reserved.',
      adminDashboard: 'Buka Dashboard Admin',
      adminPanel: 'Panel Admin & Super Admin',
      thankYou: 'Terima Kasih',
      withJoy: 'Dengan Penuh Rasa Syukur & Bahagia',
      allRights: 'Hak cipta dilindungi undang-undang.',
      openAdmin: 'Buka Dashboard Admin',
      adminLogin: 'Masuk Admin WO'
    },
    announcement: {
      label: 'Pengumuman:'
    }
  },
  en: {
    common: {
      and: 'and',
      at: 'At',
      close: 'Close',
      copy: 'Copy',
      copied: 'Copied',
      loading: 'Loading...',
      onlineGuests: 'Guests Online',
      realtimeActive: 'Live Real-Time',
      connecting: 'Connecting...'
    },
    cover: {
      celebration: 'The Wedding Celebration',
      to: 'Cordially Invited',
      honoredGuest: 'Distinguished Guest',
      person: 'Person(s)',
      apology: '*We sincerely apologize for any misspelling of name or title',
      open: 'Open Invitation',
      date: 'Saturday, October 24, 2026 • Jakarta'
    },
    nav: {
      home: 'Home',
      couple: 'Couple',
      events: 'Events',
      gallery: 'Gallery',
      rsvp: 'RSVP',
      wishes: 'Wishes',
      gift: 'Gifts',
      qr: 'QR Pass',
      adminLogin: 'Admin Login',
      admin: 'Admin'
    },
    hero: {
      eyebrow: 'Holy Matrimony & Wedding Celebration',
      invitationText: 'We cordially invite you to celebrate our union and bestow your warm blessings upon our special day',
      dateLocation: 'Saturday, October 24, 2026 • Jakarta',
      countdownTitle: 'Counting Down to Our Wedding Day',
      days: 'Days',
      hours: 'Hours',
      minutes: 'Minutes',
      seconds: 'Seconds',
      saveCalendar: 'Save Date to Google Calendar'
    },
    couple: {
      eyebrow: 'The Happy Couple',
      title: 'The Groom & The Bride',
      subtitle: 'By seeking the grace and blessings of God Almighty, we joyfully invite you to witness our sacred vows of love and devotion.',
      holyVerse: 'Sacred Verse',
      verseText: 'And among His signs is that He created for you spouses from among yourselves, that you may find tranquility in them; and He placed between you affection and mercy.',
      verseSource: 'Quran Surah Ar-Rum: 21',
      groomBadge: 'The Groom',
      brideBadge: 'The Bride',
      sonOf: 'First son of',
      daughterOf: 'Youngest daughter of',
      father: 'Mr.',
      mother: 'Mrs.',
      and: '&'
    },
    events: {
      eyebrow: 'Date & Venue',
      title: 'Wedding Events',
      subtitle: 'It is our greatest honor and joy to welcome you to the celebration of our sacred matrimony and wedding reception.',
      dayDate: 'Day & Date',
      time: 'Time Schedule',
      venue: 'Location & Venue',
      openMaps: 'Open Google Maps',
      dresscode: 'Guest Dresscode:',
      dresscodeVal: 'Formal / Batik / Earth Tone & Pastel Elegant',
      mapHeader: 'Interactive Google Maps',
      mapTitle: 'Wedding Venue Navigation',
      mapDesc: 'Click the markers on the map to explore event routes, time details, and turn-by-turn directions.',
      routeGuide: 'Get Directions',
      copyAddress: 'Copy Address',
      addressCopied: 'Address Copied!'
    },
    story: {
      eyebrow: 'Our Love Story',
      title: 'How Our Journey Began',
      subtitle: 'Every love story is beautiful, but ours is our absolute favorite chapter.',
      galleryEyebrow: 'Captured Memories',
      galleryTitle: 'Photo Gallery',
      gallerySubtitle: 'A collection of cherished moments from our first meet, sweet proposal, to our wedding celebration.',
      openFullGallery: 'View Complete Photo Gallery',
      photos: 'Photos',
      firstMeetTitle: 'First Encounter',
      firstMeetDesc: 'Destiny brought us together at our university during an academic seminar.',
      engagementTitle: 'The Proposal',
      engagementDesc: 'With the blessings of our parents, we took our solemn step toward forever.',
      weddingDayTitle: 'To Forever & Beyond',
      weddingDayDesc: 'With gratitude, we begin our lifelong journey hand in hand.',
      marriageTitle: 'Holy Matrimony',
      marriageDesc: 'Uniting two souls and two families in holy and eternal marriage.'
    },
    galleryPage: {
      title: 'Wedding Photo Gallery',
      subtitle: 'A photographic journey celebrating our love story and memorable milestones.',
      allCategories: 'All Photos',
      prewedding: 'Prewedding',
      engagement: 'Engagement',
      romantic: 'Romance',
      weddingDay: 'Wedding Day',
      slideshowPlay: 'Play Slideshow',
      slideshowPause: 'Pause Slideshow',
      sharePhoto: 'Share Photo',
      linkCopied: 'Photo link copied!',
      photoOf: 'of',
      emptyCategory: 'No photos in this category yet.',
      moments: 'Moments'
    },
    rsvp: {
      eyebrow: 'Attendance Confirmation',
      title: 'RSVP Confirmation',
      subtitle: 'Kindly confirm your attendance so we may prepare the warmest welcome and seating for you.',
      thankYou: 'Thank You for Your Confirmation!',
      confirmedFor: 'Attendance confirmation for',
      recordedAs: 'has been successfully recorded',
      changeResponse: 'Update RSVP Response',
      changeRsvp: 'Update RSVP Response',
      fullName: 'Full Guest Name',
      nameLabel: 'Full Guest Name',
      fullNamePlaceholder: 'Enter your full name',
      namePlaceholder: 'Enter your full name',
      allocatedBadge: 'Registered Guest',
      allocatedPax: 'Allocated for {pax} Guest(s)',
      statusLabel: 'Attendance Confirmation',
      attendanceLabel: 'Attendance Confirmation Option',
      attending: 'Will Attend',
      attendingDesc: 'Joyfully accepting the invitation',
      notAttending: 'Unable to Attend',
      notAttendingDesc: 'Regretfully declining with warmest regards',
      tentative: 'Tentative',
      tentativeDesc: 'Will confirm closer to the date',
      paxLabel: 'Number of Attending Guests (Pax)',
      paxUnit: 'Guest(s)',
      person: 'Guest(s)',
      notesLabel: 'Special Notes / Dietary Requirements',
      notesPlaceholder: 'e.g., Attending with partner, parking query...',
      submitBtn: 'Submit RSVP Confirmation',
      submitButton: 'Submit RSVP Confirmation',
      submitting: 'Submitting...',
      fillNameAlert: 'Please provide your name.'
    },
    wishes: {
      title: 'Wishes & Prayers',
      subtitle: 'Send your heartfelt prayers, wishes, and warmest congratulations to the happy couple.',
      sendWishHeader: 'Send Your Warm Wishes',
      yourName: 'Your Name',
      yourNamePlaceholder: 'Full name or nickname...',
      yourWish: 'Message & Prayers',
      yourWishPlaceholder: 'Write your heartfelt congratulations and prayers for the couple...',
      sendWishBtn: 'Send Wish Now',
      sendWish: 'Send Wish Now',
      sending: 'Sending...',
      sendingWish: 'Sending your wishes...',
      filter: 'Filter Wishes',
      filterAll: 'All',
      filterAttending: 'Attending',
      filterPinned: 'Pinned',
      messages: 'messages',
      allWishes: 'All Wishes',
      pinnedWishes: 'Pinned',
      pinned: 'Pinned',
      attendingWishes: 'Attending',
      replyFromCouple: 'Reply from Couple',
      coupleReply: 'Reply from the Couple',
      pinnedBadge: 'Pinned by the Couple',
      emptyWishes: 'No wishes yet. Be the first to bestow your blessings!',
      successSent: 'Thank you! Your wish has been posted in real-time.',
      fillRequiredAlert: 'Name and message are required.',
      verifiedWish: 'Verified Guest Wish',
      realtimeActive: 'Live Real-Time',
      connecting: 'Connecting...',
      onlineGuests: 'Guests Online',
      newWishAlert: 'A new wish was just received!',
      closeAlert: 'Close',
      wishSentSuccess: 'Your wish was sent successfully!',
      attendanceStatus: 'Attendance Status',
      wishLabel: 'Wishes & Congratulations',
      wishPlaceholder: 'Write your heartfelt congratulations and warm prayers...',
      realtimeNotice: 'Your message will appear live in real-time.'
    },
    gifts: {
      eyebrow: 'Wedding Gift',
      tag: 'Wedding Gift',
      title: 'Digital Envelope & Gifts',
      subtitle: 'Your presence and prayers are the greatest gifts of all. If you wish to send a wedding gift, you may do so through:',
      accNumber: 'Account Number',
      accountNumber: 'Account Number',
      accName: 'Account Holder:',
      recipientName: 'Account Holder',
      copyAcc: 'Copy Account Number',
      copyAccount: 'Copy Account Number',
      accCopied: 'Account Number Copied!',
      accountCopied: 'Account Number Copied!',
      deliveryTitle: 'Send Physical Gift to Residence',
      deliveryDesc: 'For family and friends wishing to deliver parcels, flowers, or gifts to our address:',
      recipient: 'Recipient:',
      physicalGiftAddress: 'Physical Gift Delivery Address',
      copyAddress: 'Copy Delivery Address',
      addressCopied: 'Address Copied!',
      confirmWa: 'Confirm Gift Delivery via WhatsApp'
    },
    gift: {
      eyebrow: 'Wedding Gift',
      tag: 'Wedding Gift',
      title: 'Digital Envelope & Gifts',
      subtitle: 'Your presence and prayers are the greatest gifts of all. If you wish to send a wedding gift, you may do so through:',
      accNumber: 'Account Number',
      accountNumber: 'Account Number',
      accName: 'Account Holder:',
      recipientName: 'Account Holder',
      copyAcc: 'Copy Account Number',
      copyAccount: 'Copy Account Number',
      accCopied: 'Account Number Copied!',
      accountCopied: 'Account Number Copied!',
      deliveryTitle: 'Send Physical Gift to Residence',
      deliveryDesc: 'For family and friends wishing to deliver parcels, flowers, or gifts to our address:',
      recipient: 'Recipient:',
      physicalGiftAddress: 'Physical Gift Delivery Address',
      copyAddress: 'Copy Delivery Address',
      addressCopied: 'Address Copied!',
      confirmWa: 'Confirm Gift Delivery via WhatsApp'
    },
    qr: {
      title: 'Digital Invitation QR Pass',
      subtitle: 'Present this QR pass at the reception counter upon arrival for priority check-in.',
      guestNameLabel: 'Guest Full Name',
      generalGuest: 'Honored Guest',
      checkedIn: 'Checked In',
      verified: 'Verified Digital Guestbook Pass'
    },
    footer: {
      closing: 'Our deepest and heartfelt gratitude for your gracious presence, prayers, and blessings on our wedding day.',
      family: 'Warmest regards,',
      bigFamily: 'The Families of Mr. H. Bambang Sudiro & Mr. Ir. H. Ahmad Fauzi',
      rights: 'All rights reserved.',
      adminDashboard: 'Open Admin Dashboard',
      adminPanel: 'Admin & Super Admin Panel',
      thankYou: 'Thank You',
      withJoy: 'With Joy & Heartfelt Gratitude',
      allRights: 'All rights reserved.',
      openAdmin: 'Open Admin Dashboard',
      adminLogin: 'Admin Login'
    },
    announcement: {
      label: 'Announcement:'
    }
  }
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get('lang');
      if (urlLang === 'en' || urlLang === 'id') {
        return urlLang;
      }
      const saved = localStorage.getItem('wedding_invitation_lang') as Language;
      if (saved === 'en' || saved === 'id') {
        return saved;
      }
    }
    return 'id';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wedding_invitation_lang', newLang);
      document.documentElement.lang = newLang;
    }
  };

  const toggleLang = () => {
    setLang(lang === 'id' ? 'en' : 'id');
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t: dictionary[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
