from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cv_screening_app', '0002_emailverificationotp'),
    ]

    operations = [
        migrations.AddField(
            model_name='jobapplication',
            name='reapply_allowed',
            field=models.BooleanField(default=False, help_text='HR can allow candidate to apply again to this same job'),
        ),
    ]
