export const SPECIALIZATIONS = {
    CARDIOLOGY: {
        en: 'Cardiology',
        ar: 'أمراض القلب',
    },
    DERMATOLOGY: {
        en: 'Dermatology',
        ar: 'الأمراض الجلدية',
    },
    ENDOCRINOLOGY: {
        en: 'Endocrinology',
        ar: 'الغدد الصماء',
    },
    GASTROENTEROLOGY: {
        en: 'Gastroenterology',
        ar: 'الجهاز الهضمي',
    },
    GENERAL_PRACTICE: {
        en: 'General Practice',
        ar: 'الطب العام',
    },
    GYNECOLOGY: {
        en: 'Gynecology',
        ar: 'أمراض النساء',
    },
    HEMATOLOGY: {
        en: 'Hematology',
        ar: 'أمراض الدم',
    },
    INTERNAL_MEDICINE: {
        en: 'Internal Medicine',
        ar: 'الباطنية',
    },
    NEPHROLOGY: {
        en: 'Nephrology',
        ar: 'أمراض الكلى',
    },
    NEUROLOGY: {
        en: 'Neurology',
        ar: 'الأمراض العصبية',
    },
    NEUROSURGERY: {
        en: 'Neurosurgery',
        ar: 'جراحة المخ والأعصاب',
    },
    OBSTETRICS: {
        en: 'Obstetrics',
        ar: 'التوليد',
    },
    ONCOLOGY: {
        en: 'Oncology',
        ar: 'الأورام',
    },
    OPHTHALMOLOGY: {
        en: 'Ophthalmology',
        ar: 'طب العيون',
    },
    ORTHOPEDICS: {
        en: 'Orthopedics',
        ar: 'جراحة العظام',
    },
    OTOLARYNGOLOGY: {
        en: 'Otolaryngology (ENT)',
        ar: 'الأنف والأذن والحنجرة',
    },
    PEDIATRICS: {
        en: 'Pediatrics',
        ar: 'طب الأطفال',
    },
    PSYCHIATRY: {
        en: 'Psychiatry',
        ar: 'الطب النفسي',
    },
    PULMONOLOGY: {
        en: 'Pulmonology',
        ar: 'أمراض الصدر',
    },
    RADIOLOGY: {
        en: 'Radiology',
        ar: 'الأشعة',
    },
    RHEUMATOLOGY: {
        en: 'Rheumatology',
        ar: 'أمراض الروماتيزم',
    },
    SURGERY: {
        en: 'General Surgery',
        ar: 'الجراحة العامة',
    },
    UROLOGY: {
        en: 'Urology',
        ar: 'المسالك البولية',
    },
    ANESTHESIOLOGY: {
        en: 'Anesthesiology',
        ar: 'التخدير',
    },
    EMERGENCY_MEDICINE: {
        en: 'Emergency Medicine',
        ar: 'طب الطوارئ',
    },
    FAMILY_MEDICINE: {
        en: 'Family Medicine',
        ar: 'طب الأسرة',
    },
    PATHOLOGY: {
        en: 'Pathology',
        ar: 'علم الأمراض',
    },
    PHYSICAL_THERAPY: {
        en: 'Physical Therapy',
        ar: 'العلاج الطبيعي',
    },
    PLASTIC_SURGERY: {
        en: 'Plastic Surgery',
        ar: 'جراحة التجميل',
    },
    SPORTS_MEDICINE: {
        en: 'Sports Medicine',
        ar: 'طب الرياضة',
    },
} as const;

// Type for specialization keys
export type SpecializationKey = keyof typeof SPECIALIZATIONS;

// Get all valid specialization keys
export const VALID_SPECIALIZATION_KEYS = Object.keys(SPECIALIZATIONS) as SpecializationKey[];

// Get all English specialization values
export const VALID_SPECIALIZATIONS_EN = Object.values(SPECIALIZATIONS).map(spec => spec.en);

// Type for specialization english values
export type SpecializationEnglishValue = (typeof SPECIALIZATIONS)[keyof typeof SPECIALIZATIONS]['en'];

// Get all Arabic specialization values
export const VALID_SPECIALIZATIONS_AR = Object.values(SPECIALIZATIONS).map(spec => spec.ar);

// Type for specialization arabic values
export type SpecializationArabicValue = (typeof SPECIALIZATIONS)[keyof typeof SPECIALIZATIONS]['ar'];

// Helper function to get specialization by key
export const getSpecialization = (key: SpecializationKey) => {
    return SPECIALIZATIONS[key];
};

// Helper function to validate specialization
export const isValidSpecialization = (value: string): boolean => {
    return VALID_SPECIALIZATION_KEYS.includes(value as SpecializationKey);
};

// Helper function to get specialization key from English or Arabic value
export const getSpecializationKey = (value: string): SpecializationKey | null => {
    const entry = Object.entries(SPECIALIZATIONS).find(
        ([_, spec]) => spec.en === value || spec.ar === value
    );
    return entry ? (entry[0] as SpecializationKey) : null;
};
