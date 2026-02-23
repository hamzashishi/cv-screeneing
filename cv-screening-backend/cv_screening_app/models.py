from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import FileExtensionValidator
import uuid
import random

class CustomUser(AbstractUser):
    """Extended User model for both HR and Applicants"""
    USER_ROLE_CHOICES = (
        ('hr', 'HR Personnel'),
        ('applicant', 'Applicant'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(max_length=20, unique=True)
    role = models.CharField(max_length=10, choices=USER_ROLE_CHOICES)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active_user = models.BooleanField(default=True)
    
    groups = models.ManyToManyField('auth.Group', related_name='custom_user_groups', blank=True)
    user_permissions = models.ManyToManyField('auth.Permission', related_name='custom_user_permissions', blank=True)
    
    class Meta:
        db_table = 'custom_users'
        verbose_name_plural = 'Custom Users'
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"


class EmailVerificationOTP(models.Model):
    """OTP model for email verification during registration."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='email_otps')
    otp_code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'email_verification_otps'
        verbose_name_plural = 'Email Verification OTPs'
        ordering = ['-created_at']

    @staticmethod
    def generate_code():
        return f"{random.randint(0, 999999):06d}"

    def __str__(self):
        return f"OTP for {self.user.email} ({'used' if self.is_used else 'active'})"


class PasswordResetOTP(models.Model):
    """OTP model for password reset."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='password_reset_otps')
    otp_code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'password_reset_otps'
        verbose_name_plural = 'Password Reset OTPs'
        ordering = ['-created_at']

    @staticmethod
    def generate_code():
        return f"{random.randint(0, 999999):06d}"

    def __str__(self):
        return f"Password reset OTP for {self.user.email} ({'used' if self.is_used else 'active'})"


class HRPersonnel(models.Model):
    """Model for HR Personnel with company details"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='hr_profile')
    company_name = models.CharField(max_length=255)
    company_description = models.TextField()
    company_location = models.CharField(max_length=255)
    company_logo = models.ImageField(upload_to='company_logos/', null=True, blank=True)
    company_website = models.URLField(null=True, blank=True)
    industry = models.CharField(max_length=100, null=True, blank=True)
    company_size = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_verified = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'hr_personnel'
        verbose_name_plural = 'HR Personnel'
    
    def __str__(self):
        return f"{self.company_name} - {self.user.get_full_name()}"


class Applicant(models.Model):
    """Model for Job Applicants/Candidates"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='applicant_profile')
    location = models.CharField(max_length=255)
    bio = models.TextField(null=True, blank=True)
    years_experience = models.IntegerField(null=True, blank=True)
    highest_qualification = models.CharField(max_length=100, null=True, blank=True)
    skills = models.TextField(null=True, blank=True, help_text="Comma-separated skills")
    portfolio_url = models.URLField(null=True, blank=True)
    linkedin_url = models.URLField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'applicants'
        verbose_name_plural = 'Applicants'
    
    def __str__(self):
        return f"{self.user.get_full_name()} - Applicant"


class JobPosting(models.Model):
    """Model for Job Postings created by HR"""
    EXPERIENCE_CHOICES = (
        ('entry', 'Entry Level'),
        ('mid', 'Mid Level'),
        ('senior', 'Senior Level'),
    )
    
    EDUCATION_CHOICES = (
        ('high_school', 'High School'),
        ('diploma', 'Diploma'),
        ('bachelor', "Bachelor's Degree"),
        ('master', "Master's Degree"),
        ('phd', 'PhD'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hr = models.ForeignKey(HRPersonnel, on_delete=models.CASCADE, related_name='job_postings')
    job_title = models.CharField(max_length=255)
    job_description = models.TextField()
    required_skills = models.TextField(help_text="Comma-separated list of required skills")
    preferred_skills = models.TextField(null=True, blank=True, help_text="Comma-separated list of preferred skills")
    required_education = models.CharField(max_length=50, choices=EDUCATION_CHOICES)
    required_experience = models.CharField(max_length=20, choices=EXPERIENCE_CHOICES)
    years_of_experience_min = models.IntegerField(default=0)
    years_of_experience_max = models.IntegerField(default=10)
    max_people_needed = models.IntegerField(null=True, blank=True)
    location = models.CharField(max_length=255)
    salary_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deadline = models.DateTimeField(null=True, blank=True)
    job_type = models.CharField(max_length=50, default='Full-time', help_text="Full-time, Part-time, Contract, etc.")
    
    class Meta:
        db_table = 'job_postings'
        verbose_name_plural = 'Job Postings'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.job_title} - {self.hr.company_name}"


class CVUpload(models.Model):
    """Model for storing uploaded CVs"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    applicant = models.ForeignKey(Applicant, on_delete=models.CASCADE, related_name='cv_uploads')
    cv_file = models.FileField(
        upload_to='cvs/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'docx'])]
    )
    extracted_text = models.TextField(null=True, blank=True)
    parsed_data = models.JSONField(null=True, blank=True)
    is_primary = models.BooleanField(default=False, help_text="Primary CV for screening")
    upload_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cv_uploads'
        verbose_name_plural = 'CV Uploads'
        ordering = ['-upload_date']
    
    def __str__(self):
        return f"CV - {self.applicant.user.get_full_name()}"


class ParsedCVData(models.Model):
    """Model for storing extracted and parsed CV data"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cv_upload = models.OneToOneField(CVUpload, on_delete=models.CASCADE, related_name='parsed_data_record')
    full_name = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    summary = models.TextField(null=True, blank=True)
    
    # Skills
    skills = models.JSONField(default=list, help_text="List of extracted skills")
    
    # Education
    education = models.JSONField(default=list, help_text="List of education records")
    highest_education = models.CharField(max_length=100, null=True, blank=True)
    
    # Work Experience
    work_experience = models.JSONField(default=list, help_text="List of work experience records")
    total_years_experience = models.FloatField(null=True, blank=True)
    
    # Certifications
    certifications = models.JSONField(default=list, help_text="List of certifications")
    
    # Languages
    languages = models.JSONField(default=list, help_text="List of languages")
    
    extraction_date = models.DateTimeField(auto_now_add=True)
    extraction_confidence = models.FloatField(null=True, blank=True, help_text="Confidence score of extraction (0-100)")
    
    class Meta:
        db_table = 'parsed_cv_data'
        verbose_name_plural = 'Parsed CV Data'
    
    def __str__(self):
        return f"Parsed Data - {self.full_name or self.cv_upload.applicant.user.get_full_name()}"


class JobApplication(models.Model):
    """Model for Job Applications"""
    APPLICATION_STATUS_CHOICES = (
        ('applied', 'Applied'),
        ('shortlisted', 'Shortlisted'),
        ('interview_scheduled', 'Interview Scheduled'),
        ('hired', 'Hired'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    applicant = models.ForeignKey(Applicant, on_delete=models.CASCADE, related_name='job_applications')
    job = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name='applications')
    cv = models.ForeignKey(CVUpload, on_delete=models.SET_NULL, null=True, related_name='applications')
    status = models.CharField(max_length=20, choices=APPLICATION_STATUS_CHOICES, default='applied')
    application_score = models.FloatField(null=True, blank=True, help_text="Automated ranking score")
    application_rank = models.IntegerField(null=True, blank=True, help_text="Rank among applicants for this job")
    
    # Scoring breakdown
    skills_score = models.FloatField(null=True, blank=True)
    experience_score = models.FloatField(null=True, blank=True)
    education_score = models.FloatField(null=True, blank=True)
    
    hr_notes = models.TextField(null=True, blank=True)
    reapply_allowed = models.BooleanField(default=False, help_text="HR can allow candidate to apply again to this same job")
    applied_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'job_applications'
        verbose_name_plural = 'Job Applications'
        unique_together = ('applicant', 'job')
        ordering = ['-application_score', '-applied_date']
    
    def __str__(self):
        return f"{self.applicant.user.get_full_name()} - {self.job.job_title}"


class Notification(models.Model):
    """Model for storing notifications"""
    NOTIFICATION_TYPE_CHOICES = (
        ('application_status', 'Application Status Update'),
        ('job_new', 'New Job Posted'),
        ('interview', 'Interview Scheduled'),
        ('hiring_decision', 'Hiring Decision'),
        ('system', 'System Notification'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    related_job = models.ForeignKey(JobPosting, on_delete=models.SET_NULL, null=True, blank=True)
    related_application = models.ForeignKey(JobApplication, on_delete=models.SET_NULL, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'notifications'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.get_full_name()}"


class ScreeningCriteria(models.Model):
    """Model for custom screening criteria per job"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.OneToOneField(JobPosting, on_delete=models.CASCADE, related_name='screening_criteria')
    
    # Scoring weights (should sum to 100)
    skills_weight = models.FloatField(default=40, help_text="Weight for skills matching (0-100)")
    experience_weight = models.FloatField(default=30, help_text="Weight for experience (0-100)")
    education_weight = models.FloatField(default=30, help_text="Weight for education (0-100)")
    
    # Minimum thresholds
    min_experience_years = models.IntegerField(default=0)
    min_skills_match = models.FloatField(default=30, help_text="Minimum % of skills to match")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'screening_criteria'
        verbose_name_plural = 'Screening Criteria'
    
    def __str__(self):
        return f"Criteria - {self.job.job_title}"


class AuditLog(models.Model):
    """Model for audit logging"""
    ACTION_CHOICES = (
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('view', 'View'),
        ('download', 'Download'),
        ('decision', 'Decision Made'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    object_type = models.CharField(max_length=100)  # e.g., 'JobPosting', 'JobApplication'
    object_id = models.CharField(max_length=100)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_logs'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.action} - {self.object_type} by {self.user}"
