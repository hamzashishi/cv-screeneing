from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('cv_screening_app', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='EmailVerificationOTP',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('otp_code', models.CharField(max_length=6)),
                ('expires_at', models.DateTimeField()),
                ('is_used', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='email_otps', to='cv_screening_app.customuser')),
            ],
            options={
                'verbose_name_plural': 'Email Verification OTPs',
                'db_table': 'email_verification_otps',
                'ordering': ['-created_at'],
            },
        ),
    ]
