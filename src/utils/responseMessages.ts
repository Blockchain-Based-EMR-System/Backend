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

    // Success messages for Clinics
    CLINIC_CREATED_SUCCESSFULLY: {
        message_en: "Clinic created successfully.",
        message_ar: "تم إنشاء العيادة بنجاح.",
    },
    CLINIC_RETRIEVED: {
        message_en: "Clinic data retrieved successfully.",
        message_ar: "تم استرجاع بيانات العيادة بنجاح.",
    },
    CLINIC_UPDATED_SUCCESSFULLY: {
        message_en: "Clinic data updated successfully.",
        message_ar: "تم تحديث بيانات العيادة بنجاح.",
    },
    CLINIC_DELETED_SUCCESSFULLY: {
        message_en: "Clinic deleted successfully.",
        message_ar: "تم حذف العيادة بنجاح.",
    },
    CLINIC_DOCTORS_RETRIEVED: {
        message_en: "Clinic's doctors retrieved successfully.",
        message_ar: "تم استرجاع أطباء العيادة بنجاح.",
    },

    // Success messages for Doctors
    DOCTOR_CREATED_WAITING_VERIFICATION: {
        message_en: "Doctor account created successfully. Please wait for verification.",
        message_ar: "تم إنشاء حساب الطبيب بنجاح. يرجى الانتظار للموافقة عليه.",
    },
    PASSWORD_SET_SUCCESSFULLY_BY_DOCTOR: {
        message_en: "Password set successfully.",
        message_ar: "تم تعيين كلمة المرور بنجاح.",
    },

    // Success messages for Google Auth
    PHONE_NUMBER_UPDATED_SUCCESSFULLY: {
        message_en: "Phone number updated successfully.",
        message_ar: "تم تحديث رقم الهاتف بنجاح.",
    },
    GOOGLE_USER_DATA_RETRIEVED: {
        message_en: "Google user data retrieved successfully.",
        message_ar: "تم استرجاع بيانات مستخدم جوجل بنجاح.",
    },

    // Success messages for Super Admin
    ADMIN_ADDED_SUCCESSFULLY: {
        message_en: "Admin added successfully.",
        message_ar: "تم إضافة المسؤول بنجاح.",
    },
    ADMINS_RETRIEVED_SUCCESSFULLY: {
        message_en: "Admins retrieved successfully.",
        message_ar: "تم استرجاع بيانات المسؤولين بنجاح.",
    },
    ADMIN_RETRIEVED_SUCCESSFULLY: {
        message_en: "Admin retrieved successfully.",
        message_ar: "تم استرجاع بيانات المسؤول بنجاح.",
    },

    // Success messages for User
    PROFILE_PICTURE_UPDATED_SUCCESSFULLY: {
        message_en: "Profile picture updated successfully.",
        message_ar: "تم تحديث صورة الملف الشخصي بنجاح.",
    },
    PROFILE_PICTURE_RETRIEVED_SUCCESSFULLY: {
        message_en: "Profile picture retrieved successfully.",
        message_ar: "تم استرجاع صورة الملف الشخصي بنجاح.",
    },
    PROFILE_PICTURE_DELETED_SUCCESSFULLY: {
        message_en: "Profile picture deleted successfully.",
        message_ar: "تم حذف صورة الملف الشخصي بنجاح.",
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