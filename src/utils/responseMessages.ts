export const SuccessResponseMessages = {
    // Success messages for Auth

    SIGNED_UP_SUCCESSFULLY: {
        message_en: "Signed up successfully.",
        message_ar: "تم انشاء حساب جديد بنجاح.",
    },
    LOGGED_IN_SUCCESSFULLY: {
        message_en: "Logged in successfully.",
        message_ar: "تم تسجيل الدخول بنجاح.",
    },
    LOGGED_OUT_SUCCESSFULLY: {
        message_en: "Logged out successfully.",
        message_ar: "تم تسجيل الخروج بنجاح.",
    },
    TOKEN_REFRESHED_SUCCESSFULLY: {
        message_en: "Token refreshed successfully.",
        message_ar: "تم تحديث رمز الدخول بنجاح.",
    },
    PROFILE_COMPLETED_SUCCESSFULLY: {
        message_en: "Profile completed successfully.",
        message_ar: "تم إكمال الملف الشخصي بنجاح.",
    },
    OTP_VERIFIED_SUCCESSFULLY: {
        message_en: "OTP verified successfully.",
        message_ar: "تم التحقق من رمز التحقق بنجاح.",
    },
    PASSWORD_RESET_EMAIL_SENT_SUCCESSFULLY: {
        message_en: "Password reset email sent successfully.",
        message_ar: "تم إرسال بريد إعادة تعيين كلمة المرور بنجاح.",
    },
    PASSWORD_RESET_SUCCESSFULLY: {
        message_en: "Password reset successfully.",
        message_ar: "تم إعادة تعيين كلمة المرور بنجاح.",
    },
    OTP_RESENT_SUCCESSFULLY: {
        message_en: "OTP resent successfully.",
        message_ar: "تم إعادة إرسال رمز التحقق بنجاح.",
    },


    // Success messages for Doctors by Admin

    DOCTOR_CREATED: {
        message_en: "Doctor created successfully.",
        message_ar: "تم إنشاء حساب الطبيب بنجاح.",
    },
    DOCTOR_RETRIEVED: {
        message_en: "Doctor retrieved successfully.",
        message_ar: "تم استرجاع بيانات الطبيب بنجاح.",
    },
    DOCTORS_RETRIEVED: {
        message_en: "Doctors retrieved successfully.",
        message_ar: "تم استرجاع بيانات الأطباء بنجاح.",
    },
    UNVERIFIED_DOCTORS_RETRIEVED: {
        message_en: "Unverified doctors retrieved successfully.",
        message_ar: "تم استرجاع بيانات الأطباء غير المعتمدين بنجاح.",
    },
    DOCTOR_VERIFICATION_STATUS_UPDATED: {
        message_en: "Doctor verification status updated successfully.",
        message_ar: "تم تحديث حالة اعتماد الطبيب بنجاح.",
    },

}

interface MultiLangMessageObj {
    message_en: string;
    message_ar: string;
}

export const createMultiLangMessage = (multiLangMessageObj: MultiLangMessageObj) => {
    return {
        messageEn: multiLangMessageObj.message_en,
        messageAr: multiLangMessageObj.message_ar,
    };
}