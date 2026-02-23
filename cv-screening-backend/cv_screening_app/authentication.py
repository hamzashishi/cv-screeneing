import jwt # type: ignore
from datetime import datetime, timedelta, timezone
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed, ValidationError


class JWTAuthentication(BaseAuthentication):
    """Custom JWT Authentication"""
    
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header:
            return None
        
        try:
            prefix, token = auth_header.split()
            if prefix.lower() != 'bearer':
                raise AuthenticationFailed('Invalid token prefix')
        except ValueError:
            raise AuthenticationFailed('Invalid authorization header')
        
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM]
            )
            
            from cv_screening_app.models import CustomUser
            user = CustomUser.objects.get(id=payload['user_id'])
            if not user.is_active or not user.is_active_user:
                raise AuthenticationFailed('Account is inactive')

            if user.role == 'hr' and not (user.is_staff or user.is_superuser):
                from cv_screening_app.models import HRPersonnel
                hr_profile = HRPersonnel.objects.filter(user=user).first()
                if not hr_profile:
                    raise AuthenticationFailed('HR profile not found')
                if not hr_profile.is_verified:
                    raise AuthenticationFailed('HR account is pending admin approval')
            return (user, token)
        
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token')
        except CustomUser.DoesNotExist:
            raise AuthenticationFailed('User not found')


def generate_jwt_token(user):
    """Generate JWT token for user"""
    now = datetime.now(timezone.utc)
    payload = {
        'user_id': str(user.id),
        'email': user.email,
        'role': user.role,
        'exp': now + timedelta(hours=settings.JWT_EXPIRATION_HOURS),
        'iat': now,
    }
    
    token = jwt.encode(
        payload,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return token


def verify_jwt_token(token):
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise ValidationError('Token has expired')
    except jwt.InvalidTokenError:
        raise ValidationError('Invalid token')
