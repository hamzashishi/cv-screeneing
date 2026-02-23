from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('cv_screening_app', '0004_jobposting_max_people_needed'),
    ]

    operations = [
        migrations.CreateModel(
            name='PasswordResetOTP',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('otp_code', models.CharField(max_length=6)),
                ('expires_at', models.DateTimeField()),
                ('is_used', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='password_reset_otps', to='cv_screening_app.customuser')),
            ],
            options={
                'verbose_name_plural': 'Password Reset OTPs',
                'db_table': 'password_reset_otps',
                'ordering': ['-created_at'],
            },
        ),
    ]
