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

    // Clinic errors
    CLINIC_NOT_FOUND: {
        en: 'Clinic not found',
        ar: 'العيادة غير موجودة',
    },
    UNAUTHORIZED_CLINIC_DELETION: {
        en: 'You are not authorized to delete this clinic',
        ar: 'ليس لديك صلاحية لحذف هذه العيادة',
    },
    // Generic errors
    SOMETHING_WENT_WRONG: {
        en: 'Something went wrong',
        ar: 'حدث خطأ ما',
    },
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
