from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from cv_screening_app.models import (
    CustomUser, HRPersonnel, Applicant, JobPosting, CVUpload,
    JobApplication, ParsedCVData, Notification, ScreeningCriteria, AuditLog, EmailVerificationOTP, PasswordResetOTP
)


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'get_full_name', 'role', 'phone_number', 'is_active_user', 'is_active', 'created_at']
    list_filter = ['role', 'is_active_user', 'is_active', 'created_at']
    search_fields = ['email', 'first_name', 'last_name', 'phone_number']
    readonly_fields = ['id', 'created_at', 'updated_at', 'last_login', 'date_joined']
    actions = ['mark_active_users', 'mark_inactive_users']
    ordering = ['-created_at']

    fieldsets = (
        ('Account', {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'phone_number', 'profile_picture', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_active_user', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')}),
        ('Identifiers', {'fields': ('id',)}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'first_name', 'last_name', 'phone_number', 'role', 'password1', 'password2', 'is_staff', 'is_superuser'),
        }),
    )

    @admin.action(description='Mark selected users as active')
    def mark_active_users(self, request, queryset):
        updated = queryset.update(is_active_user=True, is_active=True)
        self.message_user(request, f'{updated} user(s) marked as active.')

    @admin.action(description='Mark selected users as inactive')
    def mark_inactive_users(self, request, queryset):
        updated = queryset.update(is_active_user=False, is_active=False)
        self.message_user(request, f'{updated} user(s) marked as inactive.')


@admin.register(HRPersonnel)
class HRPersonnelAdmin(admin.ModelAdmin):
    list_display = ['company_name', 'user', 'is_verified', 'created_at']
    list_filter = ['is_verified', 'created_at']
    search_fields = ['company_name', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    actions = ['approve_selected_companies', 'reject_selected_companies']

    @admin.action(description='Approve selected HR companies')
    def approve_selected_companies(self, request, queryset):
        updated = queryset.update(is_verified=True)
        self.message_user(request, f'{updated} HR account(s) approved.')

    @admin.action(description='Reject selected HR companies')
    def reject_selected_companies(self, request, queryset):
        updated = 0
        for profile in queryset.select_related('user'):
            profile.is_verified = False
            profile.save(update_fields=['is_verified', 'updated_at'])
            profile.user.is_active = False
            profile.user.is_active_user = False
            profile.user.save(update_fields=['is_active', 'is_active_user', 'updated_at'])
            updated += 1
        self.message_user(request, f'{updated} HR account(s) rejected and disabled.')


@admin.register(Applicant)
class ApplicantAdmin(admin.ModelAdmin):
    list_display = ['user', 'location', 'years_experience', 'created_at']
    list_filter = ['highest_qualification', 'created_at']
    search_fields = ['user__email', 'location']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(JobPosting)
class JobPostingAdmin(admin.ModelAdmin):
    list_display = ['job_title', 'hr', 'location', 'is_active', 'created_at']
    list_filter = ['is_active', 'required_education', 'created_at']
    search_fields = ['job_title', 'hr__company_name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(CVUpload)
class CVUploadAdmin(admin.ModelAdmin):
    list_display = ['applicant', 'is_primary', 'upload_date']
    list_filter = ['is_primary', 'upload_date']
    search_fields = ['applicant__user__email']
    readonly_fields = ['id', 'upload_date', 'updated_date']


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ['applicant', 'job', 'status', 'application_score', 'applied_date']
    list_filter = ['status', 'applied_date']
    search_fields = ['applicant__user__email', 'job__job_title']
    readonly_fields = ['id', 'applied_date', 'updated_date']


@admin.register(ParsedCVData)
class ParsedCVDataAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'total_years_experience', 'extraction_date']
    list_filter = ['extraction_date']
    search_fields = ['full_name', 'email']
    readonly_fields = ['id', 'extraction_date']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'notification_type', 'title', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['user__email', 'title', 'message']
    readonly_fields = ['id', 'created_at']


@admin.register(ScreeningCriteria)
class ScreeningCriteriaAdmin(admin.ModelAdmin):
    list_display = ['job', 'skills_weight', 'experience_weight', 'education_weight']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'object_type', 'timestamp']
    list_filter = ['action', 'timestamp']
    search_fields = ['user__email', 'object_type']
    readonly_fields = ['id', 'timestamp']


@admin.register(EmailVerificationOTP)
class EmailVerificationOTPAdmin(admin.ModelAdmin):
    list_display = ['user', 'otp_code', 'expires_at', 'is_used', 'created_at']
    list_filter = ['is_used', 'created_at']
    search_fields = ['user__email']
    readonly_fields = ['id', 'created_at']


@admin.register(PasswordResetOTP)
class PasswordResetOTPAdmin(admin.ModelAdmin):
    list_display = ['user', 'otp_code', 'expires_at', 'is_used', 'created_at']
    list_filter = ['is_used', 'created_at']
    search_fields = ['user__email']
    readonly_fields = ['id', 'created_at']
