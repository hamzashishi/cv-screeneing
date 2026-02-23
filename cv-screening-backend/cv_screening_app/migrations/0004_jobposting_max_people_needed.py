from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cv_screening_app', '0003_jobapplication_reapply_allowed'),
    ]

    operations = [
        migrations.AddField(
            model_name='jobposting',
            name='max_people_needed',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
