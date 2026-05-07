from rest_framework import serializers
import os
import re
from django.conf import settings
from cv_screening_app.models import (
    CustomUser, HRPersonnel, Applicant, JobPosting, CVUpload,
    JobApplication, ParsedCVData, Notification, ScreeningCriteria
)


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 'role', 'profile_picture', 'is_staff', 'is_superuser', 'created_at']
        read_only_fields = ['id', 'created_at']


class CustomUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = CustomUser
        fields = ['email', 'username', 'first_name', 'last_name', 'phone_number', 'password', 'password_confirm', 'role']
    
    def validate(self, data):
        # Ensure passwords match
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({'password': "Passwords must match"})

        # Normalize email to lowercase
        email = data.get('email')
        if email:
            normalized_email = email.strip().lower()
            data['email'] = normalized_email
            try:
                domain = normalized_email.split('@', 1)[1]
            except Exception:
                domain = ''
            if domain != 'gmail.com':
                raise serializers.ValidationError({'email': 'Use an active Gmail address (example@gmail.com).'})

        # Check for existing users by email (case-insensitive), username, and phone
        if 'email' in data and CustomUser.objects.filter(email__iexact=data['email']).exists():
            raise serializers.ValidationError({'email': 'A user with this email already exists.'})

        if 'username' in data and CustomUser.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({'username': 'A user with this username already exists.'})

        if 'phone_number' in data and data.get('phone_number') and CustomUser.objects.filter(phone_number=data.get('phone_number')).exists():
            raise serializers.ValidationError({'phone_number': 'A user with this phone number already exists.'})

        return data
    
    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user


class HRPersonnelSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    
    class Meta:
        model = HRPersonnel
        fields = ['id', 'user', 'company_name', 'company_description', 'company_location', 'company_logo', 'company_website', 'industry', 'company_size', 'is_verified', 'created_at']
        read_only_fields = ['id', 'created_at']


class ApplicantSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    
    class Meta:
        model = Applicant
        fields = ['id', 'user', 'location', 'bio', 'years_experience', 'highest_qualification', 'skills', 'portfolio_url', 'linkedin_url', 'created_at']
        read_only_fields = ['id', 'created_at']


class JobPostingSerializer(serializers.ModelSerializer):
    hr_company_name = serializers.CharField(source='hr.company_name', read_only=True)
    
    class Meta:
        model = JobPosting
        fields = ['id', 'hr', 'hr_company_name', 'job_title', 'job_description', 'required_skills', 'preferred_skills', 'required_education', 'required_experience', 'years_of_experience_min', 'years_of_experience_max', 'max_people_needed', 'location', 'salary_min', 'salary_max', 'is_active', 'deadline', 'job_type', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'hr']


class ParsedCVDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParsedCVData
        fields = ['id', 'full_name', 'email', 'phone_number', 'location', 'summary', 'skills', 'education', 'highest_education', 'work_experience', 'total_years_experience', 'certifications', 'languages', 'extraction_confidence']
        read_only_fields = ['id']


class CVUploadSerializer(serializers.ModelSerializer):
    parsed_data_record = serializers.SerializerMethodField()

    def get_parsed_data_record(self, obj):
        try:
            record = obj.parsed_data_record
        except ParsedCVData.DoesNotExist:
            return None
        return ParsedCVDataSerializer(record).data
    
    class Meta:
        model = CVUpload
        fields = ['id', 'applicant', 'cv_file', 'is_primary', 'upload_date', 'parsed_data', 'parsed_data_record']
        read_only_fields = ['id', 'upload_date', 'applicant']


class JobApplicationSerializer(serializers.ModelSerializer):
    applicant_name = serializers.SerializerMethodField()
    applicant_email = serializers.SerializerMethodField()
    applicant_phone = serializers.SerializerMethodField()
    applicant_location = serializers.SerializerMethodField()
    job_title = serializers.CharField(source='job.job_title', read_only=True)
    cv_file = serializers.FileField(source='cv.cv_file', read_only=True)
    cv_is_uploaded = serializers.SerializerMethodField()
    cv_is_pdf = serializers.SerializerMethodField()
    cv_parsed_data = serializers.SerializerMethodField()
    cv_is_template = serializers.SerializerMethodField()
    cv_template_data = serializers.SerializerMethodField()
    applicant_uploaded_pdf_parsed_data = serializers.SerializerMethodField()
    applicant_uploaded_pdf_file = serializers.SerializerMethodField()
    cv_pdf_url = serializers.SerializerMethodField()

    def get_cv_is_uploaded(self, obj):
        cv = getattr(obj, 'cv', None)
        if not cv:
            return False
        parsed_meta = getattr(cv, 'parsed_data', None) or {}
        return parsed_meta.get('template_source') != 'builder'

    def _normalize_preview_text(self, text: str) -> str:
        if not text:
            return ''
        clean = text.replace('\r\n', '\n').replace('\r', '\n')
        clean = re.sub(r'[ \t]+', ' ', clean)
        clean = re.sub(r'\n{3,}', '\n\n', clean)
        clean = re.sub(r' ?([,.;:]) ?', r'\1 ', clean)
        clean = re.sub(r' +', ' ', clean)
        return clean.strip()

    def _build_structured_preview(self, cv, record) -> str:
        extracted = self._normalize_preview_text(getattr(cv, 'extracted_text', '') or '')
        summary = self._normalize_preview_text((record.summary or '') if record else '')
        skills = (record.skills or []) if record else []
        highest_education = (record.highest_education or '-') if record else '-'
        years = record.total_years_experience if record else None

        lines = []
        if record and record.full_name:
            lines.append(f"Name: {record.full_name}")
        if record and record.email:
            lines.append(f"Email: {record.email}")
        if record and record.phone_number:
            lines.append(f"Phone: {record.phone_number}")
        if record and record.location:
            lines.append(f"Location: {record.location}")
        if highest_education and highest_education != '-':
            lines.append(f"Highest education: {highest_education}")
        if years is not None:
            lines.append(f"Experience (years): {years}")
        if skills:
            lines.append(f"Skills: {', '.join(skills[:12])}")

        if summary:
            lines.append("")
            lines.append("Summary:")
            lines.append(summary[:180])

        if extracted:
            lines.append("")
            lines.append("Extracted CV text:")
            lines.append(extracted[:320])

        return '\n'.join(lines).strip()

    def _get_preferred_parsed_record(self, obj):
        applied_cv = getattr(obj, 'cv', None)
        if applied_cv:
            parsed_meta = getattr(applied_cv, 'parsed_data', None) or {}
            if parsed_meta.get('template_source') == 'builder':
                try:
                    record = applied_cv.parsed_data_record
                    if record:
                        return record
                except ParsedCVData.DoesNotExist:
                    pass

        # Priority: uploaded PDF extraction first (more reliable source for HR view).
        best_uploaded_pdf_cv = self._get_best_uploaded_pdf_cv(obj)
        if best_uploaded_pdf_cv:
            try:
                record = best_uploaded_pdf_cv.parsed_data_record
                if record:
                    return record
            except ParsedCVData.DoesNotExist:
                pass

        # Fallback: parsed record from currently applied CV (template/other format).
        if applied_cv:
            try:
                record = applied_cv.parsed_data_record
                if record:
                    return record
            except ParsedCVData.DoesNotExist:
                pass
        return None

    def get_applicant_name(self, obj):
        record = self._get_preferred_parsed_record(obj)
        if record and record.full_name:
            return record.full_name
        return obj.applicant.user.get_full_name()

    def get_applicant_email(self, obj):
        record = self._get_preferred_parsed_record(obj)
        if record and record.email:
            return record.email
        return obj.applicant.user.email

    def get_applicant_phone(self, obj):
        record = self._get_preferred_parsed_record(obj)
        if record and record.phone_number:
            return record.phone_number
        return obj.applicant.user.phone_number

    def get_applicant_location(self, obj):
        record = self._get_preferred_parsed_record(obj)
        if record and record.location:
            return record.location
        return obj.applicant.location

    def get_cv_is_pdf(self, obj):
        cv = getattr(obj, 'cv', None)
        if not self.get_cv_is_uploaded(obj):
            return False
        file_name = getattr(getattr(cv, 'cv_file', None), 'name', '') or ''
        return file_name.lower().endswith('.pdf')

    def get_cv_parsed_data(self, obj):
        cv = getattr(obj, 'cv', None)
        if not cv:
            return None
        if not self.get_cv_is_uploaded(obj):
            return None

        file_name = getattr(getattr(cv, 'cv_file', None), 'name', '') or ''
        if not file_name.lower().endswith('.pdf'):
            return None

        try:
            record = cv.parsed_data_record
        except ParsedCVData.DoesNotExist:
            return None

        return {
            'full_name': record.full_name,
            'email': record.email,
            'phone_number': record.phone_number,
            'location': record.location,
            'summary': record.summary,
            'skills': record.skills or [],
            'education': record.education or [],
            'highest_education': record.highest_education,
            'work_experience': record.work_experience or [],
            'total_years_experience': record.total_years_experience,
            'certifications': record.certifications or [],
            'languages': record.languages or [],
            'extraction_confidence': record.extraction_confidence,
            'text_preview': self._build_structured_preview(cv, record),
        }

    def get_cv_is_template(self, obj):
        cv = getattr(obj, 'cv', None)
        if not cv:
            return False
        parsed_meta = getattr(cv, 'parsed_data', None) or {}
        return parsed_meta.get('template_source') == 'builder'

    def get_cv_template_data(self, obj):
        cv = getattr(obj, 'cv', None)
        if not cv:
            return None
        parsed_meta = getattr(cv, 'parsed_data', None) or {}
        if parsed_meta.get('template_source') != 'builder':
            return None

        try:
            record = cv.parsed_data_record
        except ParsedCVData.DoesNotExist:
            record = None

        data = {
            'full_name': record.full_name if record else None,
            'email': record.email if record else None,
            'phone_number': record.phone_number if record else None,
            'location': record.location if record else None,
            'summary': record.summary if record else None,
            'skills': record.skills or [] if record else [],
            'education': record.education or [] if record else [],
            'highest_education': record.highest_education if record else None,
            'work_experience': record.work_experience or [] if record else [],
            'total_years_experience': record.total_years_experience if record else None,
            'certifications': record.certifications or [] if record else [],
            'languages': record.languages or [] if record else [],
        }
        data.update({
            'surname': parsed_meta.get('surname'),
            'given_names': parsed_meta.get('given_names'),
            'sex': parsed_meta.get('sex'),
            'marital_status': parsed_meta.get('marital_status'),
            'date_of_birth': parsed_meta.get('date_of_birth'),
            'nationality': parsed_meta.get('nationality'),
            'alt_phone': parsed_meta.get('alt_phone'),
            'training_workshop': parsed_meta.get('training_workshop') or [],
            'hobbies': parsed_meta.get('hobbies'),
            'declaration': parsed_meta.get('declaration'),
            'referees': parsed_meta.get('referees') or [],
            'additional_details': parsed_meta.get('additional_details'),
        })
        return data

    def _get_best_uploaded_pdf_cv(self, obj):
        applicant = getattr(obj, 'applicant', None)
        if not applicant:
            return None

        candidates = []
        for cv in applicant.cv_uploads.all():
            file_name = getattr(getattr(cv, 'cv_file', None), 'name', '') or ''
            if not file_name.lower().endswith('.pdf'):
                continue
            parsed_meta = getattr(cv, 'parsed_data', None) or {}
            if parsed_meta.get('template_source') == 'builder':
                continue
            candidates.append(cv)

        if not candidates:
            return None
        # Prefer primary uploaded PDF, then latest upload.
        candidates.sort(key=lambda c: (bool(getattr(c, 'is_primary', False)), getattr(c, 'upload_date', None)), reverse=True)
        return candidates[0]

    def get_applicant_uploaded_pdf_file(self, obj):
        cv = self._get_best_uploaded_pdf_cv(obj)
        if not cv or not getattr(cv, 'cv_file', None):
            return None
        return cv.cv_file.url

    def _ensure_cv_pdf_url(self, cv) -> str:
        if not cv or not getattr(cv, 'cv_file', None):
            return ''
        file_name = getattr(cv.cv_file, 'name', '') or ''
        if file_name.lower().endswith('.pdf'):
            return cv.cv_file.url

        if not file_name.lower().endswith('.docx'):
            return ''

        media_root = getattr(settings, 'MEDIA_ROOT', '')
        media_url = getattr(settings, 'MEDIA_URL', '/media/')
        if not media_root:
            return ''
        pdf_dir = os.path.join(media_root, 'cv_pdfs')
        os.makedirs(pdf_dir, exist_ok=True)
        pdf_name = f"{cv.id}.pdf"
        pdf_path = os.path.join(pdf_dir, pdf_name)
        if not os.path.exists(pdf_path):
            if os.name != 'nt':
                return ''
            try:
                from docx2pdf import convert
                convert(cv.cv_file.path, pdf_path)
            except Exception:
                return ''
        return f"{media_url.rstrip('/')}/cv_pdfs/{pdf_name}"

    def get_cv_pdf_url(self, obj):
        cv = getattr(obj, 'cv', None)
        return self._ensure_cv_pdf_url(cv) or None

    def get_applicant_uploaded_pdf_parsed_data(self, obj):
        cv = self._get_best_uploaded_pdf_cv(obj)
        if not cv:
            return None
        try:
            record = cv.parsed_data_record
        except ParsedCVData.DoesNotExist:
            return None
        return {
            'full_name': record.full_name,
            'email': record.email,
            'phone_number': record.phone_number,
            'location': record.location,
            'summary': record.summary,
            'skills': record.skills or [],
            'education': record.education or [],
            'highest_education': record.highest_education,
            'work_experience': record.work_experience or [],
            'total_years_experience': record.total_years_experience,
            'certifications': record.certifications or [],
            'languages': record.languages or [],
            'extraction_confidence': record.extraction_confidence,
            'text_preview': self._build_structured_preview(cv, record),
        }
    
    class Meta:
        model = JobApplication
        fields = ['id', 'applicant', 'applicant_name', 'applicant_email', 'applicant_phone', 'applicant_location', 'job', 'job_title', 'cv', 'cv_file', 'cv_is_uploaded', 'cv_is_pdf', 'cv_parsed_data', 'cv_is_template', 'cv_template_data', 'applicant_uploaded_pdf_file', 'applicant_uploaded_pdf_parsed_data', 'cv_pdf_url', 'status', 'application_score', 'application_rank', 'skills_score', 'experience_score', 'education_score', 'hr_notes', 'reapply_allowed', 'applied_date', 'updated_date']
        read_only_fields = ['id', 'applied_date', 'updated_date', 'application_score', 'application_rank']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'notification_type', 'title', 'message', 'related_job', 'related_application', 'is_read', 'created_at', 'read_at']
        read_only_fields = ['id', 'created_at']


class ScreeningCriteriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScreeningCriteria
        fields = ['id', 'job', 'skills_weight', 'experience_weight', 'education_weight', 'min_experience_years', 'min_skills_match', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
