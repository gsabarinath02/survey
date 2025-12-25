// Internationalization (i18n) utilities
// Supports English, Hindi, Tamil, and Malayalam

export type Locale = 'en' | 'hi' | 'ta' | 'ml';

export interface LocaleInfo {
    code: Locale;
    name: string;
    nativeName: string;
    direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LOCALES: LocaleInfo[] = [
    { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', direction: 'ltr' },
];

// UI strings for each locale
const UI_STRINGS: Record<Locale, Record<string, string>> = {
    en: {
        // Survey UI
        'survey.title': 'Nurse Pulse Check',
        'survey.subtitle': 'Voice of the Nurse Survey',
        'survey.selectRole': 'Select Your Role',
        'survey.nurse': 'Nurse',
        'survey.doctor': 'Doctor',
        'survey.nurseDesc': 'Staff Nurse, ICU Nurse, OT Nurse, etc.',
        'survey.doctorDesc': 'Physician, Surgeon, Specialist, etc.',
        'survey.back': 'Back',
        'survey.next': 'Next',
        'survey.nextOptional': 'Next (Optional)',
        'survey.continue': 'Continue',
        'survey.confirm': 'Confirm',
        'survey.question': 'Question',
        'survey.of': 'of',
        'survey.loading': 'Loading...',
        'survey.nurseSurvey': 'Nurse Survey',
        'survey.doctorSurvey': 'Doctor Survey',
        'survey.exit': 'Exit',

        // Completion screen
        'complete.title': 'Survey Complete!',
        'complete.thanks': 'Thank you for sharing your valuable insights.',
        'complete.help': 'Your feedback will help shape the future of nursing technology.',
        'complete.questionsAnswered': 'Questions Answered',
        'complete.timeTaken': 'Time Taken',
        'complete.minutes': 'minutes',
        'complete.startNew': 'Start New Survey',

        // Voice recorder
        'voice.tapToSpeak': 'Tap mic to speak or type your response...',
        'voice.recording': 'Recording...',
        'voice.processing': 'Processing...',
        'voice.typeHere': 'Type here...',

        // Choices
        'choice.yes': 'Yes',
        'choice.no': 'No',
        'choice.other': 'Other',
        'choice.pleaseSpecify': 'Please specify...',

        // Session recovery
        'recovery.found': 'Resume Previous Survey?',
        'recovery.message': 'You have an incomplete survey. Would you like to continue where you left off?',
        'recovery.resume': 'Resume Survey',
        'recovery.startNew': 'Start Fresh',

        // Offline
        'offline.notice': 'You are currently offline. Your responses will be saved and synced when you reconnect.',
        'offline.syncing': 'Syncing responses...',
        'offline.synced': 'All responses synced!',

        // Errors
        'error.loadFailed': 'Failed to load survey. Please try again.',
        'error.submitFailed': 'Failed to submit response. Will retry automatically.',
        'error.networkError': 'Network error. Please check your connection.',
    },

    hi: {
        // Survey UI
        'survey.title': 'नर्स पल्स चेक',
        'survey.subtitle': 'नर्स की आवाज सर्वेक्षण',
        'survey.selectRole': 'अपनी भूमिका चुनें',
        'survey.nurse': 'नर्स',
        'survey.doctor': 'डॉक्टर',
        'survey.nurseDesc': 'स्टाफ नर्स, आईसीयू नर्स, ओटी नर्स आदि।',
        'survey.doctorDesc': 'चिकित्सक, सर्जन, विशेषज्ञ आदि।',
        'survey.back': 'वापस',
        'survey.next': 'आगे',
        'survey.nextOptional': 'आगे (वैकल्पिक)',
        'survey.continue': 'जारी रखें',
        'survey.confirm': 'पुष्टि करें',
        'survey.question': 'प्रश्न',
        'survey.of': 'का',
        'survey.loading': 'लोड हो रहा है...',
        'survey.nurseSurvey': 'नर्स सर्वेक्षण',
        'survey.doctorSurvey': 'डॉक्टर सर्वेक्षण',
        'survey.exit': 'बाहर निकलें',

        // Completion screen
        'complete.title': 'सर्वेक्षण पूर्ण!',
        'complete.thanks': 'अपनी मूल्यवान अंतर्दृष्टि साझा करने के लिए धन्यवाद।',
        'complete.help': 'आपकी प्रतिक्रिया नर्सिंग प्रौद्योगिकी के भविष्य को आकार देने में मदद करेगी।',
        'complete.questionsAnswered': 'प्रश्नों के उत्तर दिए गए',
        'complete.timeTaken': 'लगा समय',
        'complete.minutes': 'मिनट',
        'complete.startNew': 'नया सर्वेक्षण शुरू करें',

        // Voice recorder
        'voice.tapToSpeak': 'बोलने के लिए माइक पर टैप करें या टाइप करें...',
        'voice.recording': 'रिकॉर्डिंग...',
        'voice.processing': 'प्रोसेसिंग...',
        'voice.typeHere': 'यहाँ टाइप करें...',

        // Choices
        'choice.yes': 'हाँ',
        'choice.no': 'नहीं',
        'choice.other': 'अन्य',
        'choice.pleaseSpecify': 'कृपया निर्दिष्ट करें...',

        // Session recovery
        'recovery.found': 'पिछला सर्वेक्षण जारी रखें?',
        'recovery.message': 'आपका एक अपूर्ण सर्वेक्षण है। क्या आप जहां छोड़ा था वहां से जारी रखना चाहेंगे?',
        'recovery.resume': 'सर्वेक्षण जारी रखें',
        'recovery.startNew': 'नया शुरू करें',

        // Offline
        'offline.notice': 'आप वर्तमान में ऑफ़लाइन हैं। आपकी प्रतिक्रियाएँ सहेजी जाएंगी और पुनः कनेक्ट होने पर सिंक होंगी।',
        'offline.syncing': 'प्रतिक्रियाएँ सिंक हो रही हैं...',
        'offline.synced': 'सभी प्रतिक्रियाएँ सिंक हो गईं!',

        // Errors
        'error.loadFailed': 'सर्वेक्षण लोड करने में विफल। कृपया पुन: प्रयास करें।',
        'error.submitFailed': 'प्रतिक्रिया सबमिट करने में विफल। स्वचालित रूप से पुनः प्रयास करेंगे।',
        'error.networkError': 'नेटवर्क त्रुटि। कृपया अपना कनेक्शन जांचें।',
    },

    ta: {
        // Survey UI
        'survey.title': 'நர்ஸ் பல்ஸ் செக்',
        'survey.subtitle': 'நர்ஸின் குரல் கருத்துக்கணிப்பு',
        'survey.selectRole': 'உங்கள் பணியைத் தேர்ந்தெடுக்கவும்',
        'survey.nurse': 'நர்ஸ்',
        'survey.doctor': 'மருத்துவர்',
        'survey.nurseDesc': 'ஊழியர் நர்ஸ், ஐசியு நர்ஸ், ஓடி நர்ஸ் போன்றவை.',
        'survey.doctorDesc': 'மருத்துவர், அறுவை சிகிச்சை நிபுணர் போன்றவை.',
        'survey.back': 'பின்',
        'survey.next': 'அடுத்து',
        'survey.nextOptional': 'அடுத்து (விருப்பம்)',
        'survey.continue': 'தொடரவும்',
        'survey.confirm': 'உறுதிப்படுத்து',
        'survey.question': 'கேள்வி',
        'survey.of': 'இல்',
        'survey.loading': 'ஏற்றுகிறது...',
        'survey.nurseSurvey': 'நர்ஸ் கருத்துக்கணிப்பு',
        'survey.doctorSurvey': 'மருத்துவர் கருத்துக்கணிப்பு',
        'survey.exit': 'வெளியேறு',

        // Completion screen
        'complete.title': 'கருத்துக்கணிப்பு முடிந்தது!',
        'complete.thanks': 'உங்கள் மதிப்புமிக்க கருத்துக்களைப் பகிர்ந்ததற்கு நன்றி.',
        'complete.help': 'உங்கள் கருத்து நர்சிங் தொழில்நுட்பத்தின் எதிர்காலத்தை வடிவமைக்க உதவும்.',
        'complete.questionsAnswered': 'பதிலளிக்கப்பட்ட கேள்விகள்',
        'complete.timeTaken': 'எடுத்த நேரம்',
        'complete.minutes': 'நிமிடங்கள்',
        'complete.startNew': 'புதிய கருத்துக்கணிப்பைத் தொடங்கு',

        // Voice recorder
        'voice.tapToSpeak': 'பேச மைக்கைத் தட்டவும் அல்லது தட்டச்சு செய்யவும்...',
        'voice.recording': 'பதிவு செய்கிறது...',
        'voice.processing': 'செயலாக்குகிறது...',
        'voice.typeHere': 'இங்கே தட்டச்சு செய்யவும்...',

        // Choices
        'choice.yes': 'ஆம்',
        'choice.no': 'இல்லை',
        'choice.other': 'மற்றவை',
        'choice.pleaseSpecify': 'குறிப்பிடவும்...',

        // Session recovery
        'recovery.found': 'முந்தைய கருத்துக்கணிப்பைத் தொடரவா?',
        'recovery.message': 'முடிக்கப்படாத கருத்துக்கணிப்பு உள்ளது. விட்ட இடத்திலிருந்து தொடர விரும்புகிறீர்களா?',
        'recovery.resume': 'தொடரவும்',
        'recovery.startNew': 'புதிதாகத் தொடங்கு',

        // Offline
        'offline.notice': 'நீங்கள் தற்போது ஆஃப்லைனில் உள்ளீர்கள். உங்கள் பதில்கள் சேமிக்கப்பட்டு மீண்டும் இணைக்கும்போது ஒத்திசைக்கப்படும்.',
        'offline.syncing': 'பதில்களை ஒத்திசைக்கிறது...',
        'offline.synced': 'அனைத்து பதில்களும் ஒத்திசைக்கப்பட்டன!',

        // Errors
        'error.loadFailed': 'கருத்துக்கணிப்பை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
        'error.submitFailed': 'பதிலை சமர்ப்பிக்க முடியவில்லை. தானாக மீண்டும் முயற்சிக்கும்.',
        'error.networkError': 'நெட்வொர்க் பிழை. உங்கள் இணைப்பைச் சரிபார்க்கவும்.',
    },

    ml: {
        // Survey UI
        'survey.title': 'നഴ്സ് പൾസ് ചെക്ക്',
        'survey.subtitle': 'നഴ്സിന്റെ ശബ്ദം സർവ്വേ',
        'survey.selectRole': 'നിങ്ങളുടെ റോൾ തിരഞ്ഞെടുക്കുക',
        'survey.nurse': 'നഴ്സ്',
        'survey.doctor': 'ഡോക്ടർ',
        'survey.nurseDesc': 'സ്റ്റാഫ് നഴ്സ്, ഐസിയു നഴ്സ്, ഒടി നഴ്സ് മുതലായവ.',
        'survey.doctorDesc': 'ഫിസിഷ്യൻ, സർജൻ, സ്പെഷ്യലിസ്റ്റ് മുതലായവ.',
        'survey.back': 'മടങ്ങുക',
        'survey.next': 'അടുത്തത്',
        'survey.nextOptional': 'അടുത്തത് (ഓപ്ഷണൽ)',
        'survey.continue': 'തുടരുക',
        'survey.confirm': 'സ്ഥിരീകരിക്കുക',
        'survey.question': 'ചോദ്യം',
        'survey.of': 'ൽ',
        'survey.loading': 'ലോഡ് ചെയ്യുന്നു...',
        'survey.nurseSurvey': 'നഴ്സ് സർവ്വേ',
        'survey.doctorSurvey': 'ഡോക്ടർ സർവ്വേ',
        'survey.exit': 'പുറത്തുകടക്കുക',

        // Completion screen
        'complete.title': 'സർവ്വേ പൂർത്തിയായി!',
        'complete.thanks': 'നിങ്ങളുടെ വിലപ്പെട്ട അഭിപ്രായങ്ങൾ പങ്കുവച്ചതിന് നന്ദി.',
        'complete.help': 'നിങ്ങളുടെ ഫീഡ്ബാക്ക് നഴ്സിംഗ് ടെക്നോളജിയുടെ ഭാവി രൂപപ്പെടുത്താൻ സഹായിക്കും.',
        'complete.questionsAnswered': 'ഉത്തരം നൽകിയ ചോദ്യങ്ങൾ',
        'complete.timeTaken': 'എടുത്ത സമയം',
        'complete.minutes': 'മിനിറ്റ്',
        'complete.startNew': 'പുതിയ സർവ്വേ ആരംഭിക്കുക',

        // Voice recorder
        'voice.tapToSpeak': 'സംസാരിക്കാൻ മൈക്ക് ടാപ്പ് ചെയ്യുക അല്ലെങ്കിൽ ടൈപ്പ് ചെയ്യുക...',
        'voice.recording': 'റെക്കോർഡ് ചെയ്യുന്നു...',
        'voice.processing': 'പ്രോസസ് ചെയ്യുന്നു...',
        'voice.typeHere': 'ഇവിടെ ടൈപ്പ് ചെയ്യുക...',

        // Choices
        'choice.yes': 'അതെ',
        'choice.no': 'ഇല്ല',
        'choice.other': 'മറ്റുള്ളവ',
        'choice.pleaseSpecify': 'വ്യക്തമാക്കുക...',

        // Session recovery
        'recovery.found': 'മുമ്പത്തെ സർവ്വേ പുനരാരംഭിക്കണോ?',
        'recovery.message': 'നിങ്ങൾക്ക് പൂർത്തിയാകാത്ത ഒരു സർവ്വേ ഉണ്ട്. നിർത്തിയ ഇടത്തുനിന്ന് തുടരാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?',
        'recovery.resume': 'സർവ്വേ പുനരാരംഭിക്കുക',
        'recovery.startNew': 'പുതിയതായി ആരംഭിക്കുക',

        // Offline
        'offline.notice': 'നിങ്ങൾ നിലവിൽ ഓഫ്‌ലൈനാണ്. നിങ്ങളുടെ പ്രതികരണങ്ങൾ സേവ് ചെയ്യപ്പെടുകയും വീണ്ടും കണക്ട് ചെയ്യുമ്പോൾ സിങ്ക് ചെയ്യപ്പെടുകയും ചെയ്യും.',
        'offline.syncing': 'പ്രതികരണങ്ങൾ സിങ്ക് ചെയ്യുന്നു...',
        'offline.synced': 'എല്ലാ പ്രതികരണങ്ങളും സിങ്ക് ചെയ്തു!',

        // Errors
        'error.loadFailed': 'സർവ്വേ ലോഡ് ചെയ്യുന്നതിൽ പരാജയപ്പെട്ടു. വീണ്ടും ശ്രമിക്കുക.',
        'error.submitFailed': 'പ്രതികരണം സമർപ്പിക്കുന്നതിൽ പരാജയപ്പെട്ടു. സ്വയമേവ വീണ്ടും ശ്രമിക്കും.',
        'error.networkError': 'നെറ്റ്‌വർക്ക് പിശക്. നിങ്ങളുടെ കണക്ഷൻ പരിശോധിക്കുക.',
    },
};

// Current locale storage
let currentLocale: Locale = 'en';

// Detect browser language
export function detectLocale(): Locale {
    if (typeof navigator === 'undefined') return 'en';

    const browserLang = navigator.language.split('-')[0].toLowerCase();

    if (browserLang === 'hi') return 'hi';
    if (browserLang === 'ta') return 'ta';
    if (browserLang === 'ml') return 'ml';

    return 'en';
}

// Set current locale
export function setLocale(locale: Locale): void {
    currentLocale = locale;
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('survey_locale', locale);
    }
}

// Get current locale
export function getLocale(): Locale {
    if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('survey_locale') as Locale | null;
        if (saved && SUPPORTED_LOCALES.some(l => l.code === saved)) {
            currentLocale = saved;
        }
    }
    return currentLocale;
}

// Translate a key
export function t(key: string, locale?: Locale): string {
    const loc = locale || currentLocale;
    const strings = UI_STRINGS[loc] || UI_STRINGS.en;
    return strings[key] || UI_STRINGS.en[key] || key;
}

// Get all translations for a locale
export function getTranslations(locale: Locale): Record<string, string> {
    return UI_STRINGS[locale] || UI_STRINGS.en;
}

// Hook for React components
export function useTranslation() {
    return {
        t: (key: string) => t(key),
        locale: getLocale(),
        setLocale,
        locales: SUPPORTED_LOCALES,
    };
}

// Get locale-specific ASR language code for Web Speech API
export function getASRLanguageCode(locale: Locale): string {
    const codes: Record<Locale, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        ta: 'ta-IN',
        ml: 'ml-IN',
    };
    return codes[locale] || 'en-IN';
}
