import { Injectable, signal } from '@angular/core';

export type Language = 'en' | 'my';

const DICTIONARY: Record<string, Record<Language, string>> = {
  // Navigation
  'nav.home': { en: 'Home', my: 'ပင်မစာမျက်နှာ' },
  'nav.comics': { en: 'Comics', my: 'ကာတွန်းများ' },
  'nav.books': { en: 'Books & Loans', my: 'စာအုပ်ငှားရမ်းခြင်း' },
  'nav.circulation': { en: 'Circulation Desk', my: 'စာကြည့်တိုက် ကောင်တာ' },
  'nav.admin': { en: 'Admin Portal', my: 'စီမံခန့်ခွဲရေး' },
  'nav.profile': { en: 'My Profile', my: 'ကျွန်ုပ် ပရိုဖိုင်' },
  'nav.login': { en: 'Sign In', my: 'အကောင့်ဝင်ရန်' },
  'nav.logout': { en: 'Sign Out', my: 'အကောင့်ထွက်ရန်' },
  'nav.notifications': { en: 'Notifications', my: 'သတိပေးချက်များ' },
  'nav.markAllRead': { en: 'Mark all as read', my: 'အားလုံးဖတ်ပြီးမှတ်ရန်' },
  'nav.noNotifications': { en: 'No notifications', my: 'သတိပေးချက် မရှိပါ' },

  // Reader
  'reader.readingMode': { en: 'Reading Mode', my: 'ဖတ်ရှုမှု ပုံစံ' },
  'reader.vertical': { en: 'Webtoon (Vertical)', my: 'ဝဘ်တွန်း (အောက်သို့ဆွဲဖတ်)' },
  'reader.single': { en: 'Single Page', my: 'တစ်မျက်နှာချင်း' },
  'reader.double': { en: 'Double Page', my: 'နှစ်မျက်နှာတွဲ' },
  'reader.download': { en: 'Download Offline', my: 'အင်တာနက်မလိုဘဲ ဖတ်ရန် ဒေါင်းလုဒ်' },
  'reader.downloaded': { en: 'Downloaded (Offline Ready)', my: 'ဒေါင်းလုဒ်ပြီးပါပြီ' },
  'reader.bookmark': { en: 'Add Bookmark / Note', my: 'မှတ်စု / စာညှပ် ထည့်ရန်' },
  'reader.bookmarksDrawer': { en: 'Page Bookmarks', my: 'စာညှပ်များ' },
  'reader.noBookmarks': { en: 'No bookmarks on this chapter yet.', my: 'ဤအခန်းတွင် စာညှပ် မရှိသေးပါ။' },
  'reader.saveNote': { en: 'Save Note', my: 'မှတ်စု သိမ်းဆည်းရန်' },
  'reader.cancel': { en: 'Cancel', my: 'မလုပ်တော့ပါ' },
  'reader.page': { en: 'Page', my: 'စာမျက်နှာ' },

  // Circulation & Books
  'circ.title': { en: 'Circulation & Desk Operations', my: 'စာအုပ် ထုတ်/အပ် စီမံခန့်ခွဲမှု' },
  'circ.checkout': { en: 'Issue Book (Checkout)', my: 'စာအုပ် ထုတ်ပေးရန်' },
  'circ.checkin': { en: 'Return Book (Checkin)', my: 'စာအုပ် ပြန်လည်လက်ခံရန်' },
  'circ.fines': { en: 'Fines & Penalties', my: 'ဒဏ်ကြေး စီမံခန့်ခွဲမှု' },
  'circ.reservations': { en: 'Hold Reservations', my: 'ကြိုတင်စာရင်းသွင်းမှုများ' },

  // Admin & Analytics
  'admin.title': { en: 'Librarian & Admin Dashboard', my: 'စာကြည့်တိုက်မှူး စီမံခန့်ခွဲရေး စင်တာ' },
  'admin.overview': { en: 'Overview', my: 'အနှစ်ချုပ်' },
  'admin.comics': { en: 'Manage Comics', my: 'ကာတွန်း စီမံရန်' },
  'admin.analytics': { en: 'Executive Analytics', my: 'အဆင့်မြင့် စာရင်းအင်း သုတေသန' },
  'admin.exportCsv': { en: 'Export Circulation CSV', my: 'စာအုပ်စာရင်း CSV ဒေါင်းလုဒ်' },
  'admin.totalBorrowings': { en: 'Total Loans', my: 'စုစုပေါင်း ငှားရမ်းမှု' },
  'admin.activeLoans': { en: 'Active Loans', my: 'လက်ရှိ ငှားထားဆဲ' },
  'admin.returnedLoans': { en: 'Returned', my: 'ပြန်လည်အပ်နှံပြီး' },
  'admin.overdueLoans': { en: 'Overdue', my: 'ရက်ကျော်လွန်နေသော စာအုပ်' },
  'admin.finesCollected': { en: 'Fines Collected', my: 'ကောက်ခံရရှိ ဒဏ်ကြေး' },
  'admin.finesWaived': { en: 'Fines Waived', my: 'ကင်းလွတ်ခွင့်ပြု ဒဏ်ကြေး' },
  'admin.popularBooks': { en: 'Top Borrowed Books', my: 'လူကြိုက်အများဆုံး စာအုပ်များ' },
  'admin.popularComics': { en: 'Top Read Comics', my: 'လူဖတ်အများဆုံး ကာတွန်းများ' },

  // Profile & Gamification
  'profile.title': { en: 'Member Profile', my: 'အသင်းဝင် ကိုယ်ရေးမှတ်တမ်း' },
  'profile.streak': { en: 'Reading Streak', my: 'ဆက်တိုက် ဖတ်ရှုမှု ရက်ပေါင်း' },
  'profile.days': { en: 'Days Active', my: 'ရက်ကြာ ဆက်လက်ဖတ်ရှုမှု' },
  'profile.badges': { en: 'Achievement Badges', my: 'ရရှိထားသော ဂုဏ်ပြုတံဆိပ်များ' },
  'profile.loans': { en: 'My Borrowed Books', my: 'ကျွန်ုပ် ငှားထားသော စာအုပ်များ' },
  'profile.favorites': { en: 'My Favorite Comics', my: 'အကြိုက်ဆုံး ကာတွန်းများ' },
};

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private readonly storageKey = 'app_language';
  currentLang = signal<Language>((localStorage.getItem(this.storageKey) as Language) || 'en');

  setLanguage(lang: Language) {
    this.currentLang.set(lang);
    localStorage.setItem(this.storageKey, lang);
  }

  toggleLanguage() {
    const next = this.currentLang() === 'en' ? 'my' : 'en';
    this.setLanguage(next);
  }

  t(key: string): string {
    const entry = DICTIONARY[key];
    if (!entry) return key;
    return entry[this.currentLang()] || entry['en'] || key;
  }
}
