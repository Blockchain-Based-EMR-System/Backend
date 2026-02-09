export const ErrorMessages = {
    // Authentication errors
    USER_NOT_FOUND: {
        en: 'User not found',
        ar: 'المستخدم غير موجود',
    },

    EMAIL_EXISTS: {
        en: `This email already exists`,
        ar: `البريد الإلكتروني موجود بالفعل`,
    },
    USERNAME_EXISTS: {
        en: 'This username already exists',
        ar: 'اسم المستخدم موجود بالفعل'
    },
    USER_NOT_FOUND_CREDENTIALS: {
        en: 'User with the provided credentials was not found',
        ar: 'لم يتم العثور على المستخدم ببيانات الاعتماد المقدمة',
    },
    PASSWORD_NOT_MATCHING: {
        en: 'Password is not matching',
        ar: 'كلمة المرور غير صحيحة',
    },
    USER_NOT_EXIST: {
        en: "User doesn't exist",
        ar: 'المستخدم غير موجود',
    },
    REFRESH_TOKEN_NOT_PROVIDED: {
        en: 'Refresh token not provided',
        ar: 'لم يتم تقديم رمز التحديث',
    },
    INVALID_REFRESH_TOKEN: {
        en: 'Invalid or expired refresh token',
        ar: 'رمز التحديث غير صالح أو منتهي الصلاحية',
    },
    USER_EMAIL_NOT_FOUND: {
        en: 'User email not found',
        ar: 'البريد الإلكتروني للمستخدم غير موجود',
    },

    OTP_REQUIRED: {
        en: 'OTP is required',
        ar: 'رمز التحقق مطلوب',
    },
    INVALID_OTP: {
        en: 'Invalid OTP',
        ar: 'رمز التحقق غير صالح',
    },
    OTP_EXPIRED: {
        en: 'OTP has expired',
        ar: 'انتهت صلاحية رمز التحقق',
    },
    EMAIL_SENT_IF_EXISTS: {
        en: 'Email will be sent if account exists',
        ar: 'سيتم إرسال البريد الإلكتروني إذا كان الحساب موجودًا',
    },
    INVALID_PASSWORD_RESET_TOKEN: {
        en: 'Invalid or expired password reset token',
        ar: 'رمز إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية',
    },

    EMAIL_REQUIRED: {
        en: 'Email is required',
        ar: 'البريد الإلكتروني مطلوب',
    },

    // Authentication middleware errors
    WRONG_AUTHENTICATION_TOKEN: {
        en: 'Wrong authentication token',
        ar: 'رمز المصادقة غير صحيح',
    },
    AUTHENTICATION_REQUIRED: {
        en: 'Authentication required',
        ar: 'المصادقة مطلوبة',
    },

    // Validation errors
    VALIDATION_ERROR: {
        en: 'Validation error',
        ar: 'خطأ في التحقق من البيانات',
    },

    // Google Auth errors
    NO_EMAIL_IN_GOOGLE_PROFILE: {
        en: 'No email found in Google profile',
        ar: 'لم يتم العثور على البريد الإلكتروني في ملف Google الشخصي',
    },
    GOOGLE_AUTH_ERROR: {
        en: 'Error in Google authentication',
        ar: 'خطأ في المصادقة عبر Google',
    },

    //Doctor specific errors
    DOCTOR_ACCOUNT_NOT_APPROVED: {
        en: 'Doctor account is not approved yet',
        ar: 'حساب الطبيب غير مفعل بعد',
    },
    DOCTOR_PASSWORD_ALREADY_SET: {
        en: 'Password has already been set',
        ar: 'تم تعيين كلمة المرور بالفعل',
    },
    MAX_CLINICS_REACHED: {
        en: 'Maximum number of created clinics reached',
        ar: 'تم الوصول إلى الحد الأقصى لعدد العيادات',
    },
    // File upload errors
    NO_FILE_UPLOADED: {
        en: 'No file uploaded',
        ar: 'لم يتم تحميل أي ملف',
    },
    UNSUPPORTED_IMAGE_FILE_FORMAT: {
        en: 'Unsupported file format. Only JPEG and PNG allowed.',
        ar: 'تنسيق ملف غير مدعوم. يُسمح فقط بملفات JPEG و PNG.',
    },
    UNSUPPORTED_FILE_FORMAT_PDF: {
        en: 'Unsupported file format. Only PDF allowed.',
        ar: 'تنسيق ملف غير مدعوم. يُسمح فقط بملفات PDF.',
    },
    NO_PROFILE_PICTURE: {
        en: 'No profile picture found',
        ar: 'لم يتم العثور على صورة الملف الشخصي',
    },
    UNKNOWN_FILE_FIELDNAME: {
        en: 'Unknown file fieldname',
        ar: 'اسم حقل الملف غير معروف',
    },
    DOCTOR_NOT_WORKING_ON_DAY: {
        en: "Doctor is not available on this day",
        ar: "الطبيب غير متاح في هذا اليوم"
    },
    TIME_OUTSIDE_SCHEDULE: {
        en: "Requested time is outside doctor's working hours",
        ar: "الوقت المطلوب خارج ساعات عمل الطبيب"
    },
    DAY_OUTSIDE_SCHEDULE: {
        en: "Requested date is outside doctor's working days",
        ar: "الموعد المطلوب خارج أيام عمل الطبيب"
    },
    DOCTOR_NOT_ASSOCIATED_WITH_CLINIC: {
        en: 'Doctor is not associated with this clinic',
        ar: 'الطبيب غير مرتبط بهذه العيادة'
    },
    END_TIME_BEFORE_START_TIME: {
        en: 'End time must be after start time',
        ar: 'وقت الانتهاء يجب أن يكون بعد وقت البداية'
    },
    SCHEDULE_ALREADY_EXISTS: {
        en: 'Schedule already exists for this day and clinic',
        ar: 'الجدول موجود بالفعل لهذا اليوم والعيادة'
    },

    // Clinic errors
    CLINIC_NOT_FOUND: {
        en: 'Clinic not found',
        ar: 'العيادة غير موجودة',
    },
    CLINIC_REQUIRED_FOR_OFFLINE: {
        en: 'Clinic ID is required for offline appointments',
        ar: 'معرف العيادة مطلوب للمواعيد غير المتصلة بالإنترنت',
    },
    UNAUTHORIZED_CLINIC_DELETION: {
        en: 'You are not authorized to delete this clinic',
        ar: 'ليس لديك صلاحية لحذف هذه العيادة',
    },
    UNAUTHORIZED_CLINIC_UPDATE: {
        en: 'You are not authorized to update this clinic',
        ar: 'ليس لديك صلاحية لتحديث هذه العيادة',
    },
    SCHEDULE_ALREADY_DELETED: {
        en: 'This schedule has already been deleted',
        ar: 'تم حذف هذا الجدول مسبقًا',
    },
    SCHEDULE_ID_REQUIRED: {
        en: 'Schedule ID is required',
        ar: 'معرف الجدول مطلوب',
    },
    VACATION_DATES_REQUIRED: {
        en: 'Vacation dates are required',
        ar: 'تواريخ الإجازة مطلوبة',
    },
    INVALID_DATE_RANGE: {
        en: 'Invalid date range',
        ar: 'نطاق التاريخ غير صالح',
    },
    // appointments 
    DOCTOR_ID_REQUIRED: {
        en: 'Doctor ID is required',
        ar: 'معرف الطبيب مطلوب',
    },
    INVALID_FEES_RANGE: {
        en: 'Invalid fees range.',
        ar: 'نطاق الرسوم غير صالح.'
    },
    PATIENT_ID_REQUIRED: {
        en: 'Patient ID is required',
        ar: 'معرف المريض مطلوب',
    },
    SCHEDULED_TIME_REQUIRED: {
        en: 'Scheduled time is required',
        ar: 'وقت الموعد مطلوب',
    },
    INVALID_SCHEDULED_TIME: {
        en: 'Invalid scheduled time format',
        ar: 'تنسيق وقت الموعد غير صالح',
    },
    DATE_REQUIRED: {
        en: 'Date is required',
        ar: 'التاريخ مطلوب',
    },
    INVALID_DATE_FORMAT: {
        en: 'Invalid date format. Please use YYYY-MM-DD',
        ar: 'تنسيق التاريخ غير صالح. يرجى استخدام YYYY-MM-DD',
    },
    NO_AVAILABLE_DAYS: {
        en: 'No available days found for this doctor',
        ar: 'لم يتم العثور على أيام متاحة لهذا الطبيب',
    },
    SLOT_NOT_AVAILABLE: {
        en: 'This time slot is not available',
        ar: 'هذا الوقت غير متاح',
    },
    APPOINTMENT_IN_PAST: {
        en: 'Cannot book appointment in the past',
        ar: 'لا يمكن حجز موعد في الماضي',
    },
    TIME_SLOT_NOT_AVAILABLE: {
        en: "This time slot is not available",
        ar: "هذا الوقت غير متاح"
    },
    MINUTES_EXCEEDED_LIMIT: {
        en: "The maximum allowed delay must not exceed 60 minutes.",
        ar: "يجب ألا يتجاوز الحد الأقصى للتأجيل المسموح به 60 دقيقة."
    },
    SCHEDULE_NOT_FOUND: {
        en: "Schedule not found",
        ar: "لم يتم العثور على الجدول"
    },
    UNAUTHORIZED_SCHEDULE_ACCESS: {
        en: "You are not authorized to access this schedule",
        ar: "غير مصرح لك بالوصول إلى هذا الجدول"
    },
    SCHEDULE_CONFLICT_DIFFERENT_CLINIC: {
        en: "There is a scheduling conflict on another clinic",
        ar: "يوجد تعارض في المواعيد في عيادة اخرى"
    },
    ONLINE_OFFLINE_CONFLICT: {
        en: "There is a conflict between online and offline schedules",
        ar: "يوجد تعارض بين المواعيد الإلكترونية والحضورية"
    },
    EITHER_ONLINE_OR_OFFLINE: {
    en: "Please choose either online or offline",
    ar: "يرجى اختيار إما الإلكتروني أو الحضوري"
    },
    // Generic errors
    SOMETHING_WENT_WRONG: {
        en: 'Something went wrong',
        ar: 'حدث خطأ ما',
    },

    APPOINTMENT_NOT_FOUND: {
        en: "Appointment not found",
        ar: "الموعد غير موجود"
    },
    APPOINTMENT_ID_REQUIRED: {
        en: "Appointment ID is required",
        ar: "معرف الموعد مطلوب"
    },
    UNAUTHORIZED_APPOINTMENT_ACCESS: {
        en: "You are not authorized to access this appointment",
        ar: "غير مصرح لك بالوصول إلى هذا الموعد"
    },
    APPOINTMENT_ALREADY_DELETED: {
        en: "Appointment has already been deleted",
        ar: "تم حذف الموعد بالفعل"
    },
    INVALID_RESCHEDULE_PARAMETERS: {
        en: "Provide either new scheduled time or shift minutes",
        ar: "يرجى تقديم وقت موعد جديد أو عدد دقائق التغيير"
    }
};

// Helper function to create bilingual error
export const createBilingualError = (
    status: number,
    messageObj: { en: string; ar: string },
) => {
    const message = messageObj.en;
    const messageAr = messageObj.ar;

    return { status, message, messageAr };
};
