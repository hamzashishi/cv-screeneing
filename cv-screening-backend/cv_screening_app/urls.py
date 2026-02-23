from django.urls import path, include
from rest_framework.routers import DefaultRouter
from cv_screening_app.views import (
    UserAuthViewSet, HRPersonnelViewSet, ApplicantViewSet, AdminApprovalViewSet,
    JobPostingViewSet, CVUploadViewSet, JobApplicationViewSet,
    NotificationViewSet
)

router = DefaultRouter()
router.register(r'users', UserAuthViewSet, basename='user')
router.register(r'hr', HRPersonnelViewSet, basename='hr')
router.register(r'admin-approvals', AdminApprovalViewSet, basename='admin-approvals')
router.register(r'applicants', ApplicantViewSet, basename='applicant')
router.register(r'jobs', JobPostingViewSet, basename='job')
router.register(r'cvs', CVUploadViewSet, basename='cv')
router.register(r'applications', JobApplicationViewSet, basename='application')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
