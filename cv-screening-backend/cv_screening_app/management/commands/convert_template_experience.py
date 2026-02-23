import re

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from cv_screening_app.models import ParsedCVData


class Command(BaseCommand):
    help = "Convert legacy template CV work_experience strings into structured entries."

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Optional limit for number of CVs to convert.",
        )

    def handle(self, *args, **options):
        limit = int(options.get("limit") or 0)
        queryset = ParsedCVData.objects.select_related("cv_upload").filter(
            cv_upload__parsed_data__template_source="builder"
        ).order_by("extraction_date")
        if limit > 0:
            queryset = queryset[:limit]

        total = queryset.count()
        if total == 0:
            self.stdout.write(self.style.WARNING("No template CVs found to convert."))
            return

        updated = 0
        skipped = 0

        for record in queryset:
            items = record.work_experience or []
            if not items:
                skipped += 1
                continue
            if all(isinstance(item, dict) for item in items):
                skipped += 1
                continue

            structured = [self._convert_item(item) for item in items]
            structured = [item for item in structured if item]
            if not structured:
                skipped += 1
                continue

            total_years = record.total_years_experience or 0
            if total_years <= 0:
                total_years = self._years_from_items(structured)

            with transaction.atomic():
                record.work_experience = structured
                record.total_years_experience = total_years
                record.save(update_fields=["work_experience", "total_years_experience"])

                cv = record.cv_upload
                if cv and cv.extracted_text:
                    cv.extracted_text = self._rewrite_extracted_text(
                        cv.extracted_text, structured
                    )
                    cv.save(update_fields=["extracted_text"])

            updated += 1

        self.stdout.write(self.style.SUCCESS(
            f"Conversion complete. Updated {updated} CV(s), skipped {skipped}."
        ))

    def _convert_item(self, item):
        if isinstance(item, dict):
            return item
        text = str(item or "").strip()
        if not text:
            return None

        date_range = self._find_date_range(text)
        org = ""
        responsibilities = text

        if date_range:
            date_pos = text.lower().find(date_range.lower())
            if date_pos != -1:
                before = text[:date_pos].strip(" -|")
                after = text[date_pos + len(date_range):].strip(" -|")
                org = before.strip()
                responsibilities = after.strip() if after else ""

        return {
            "organization": org,
            "date_range": date_range or "",
            "responsibilities": responsibilities,
        }

    def _find_date_range(self, text: str) -> str:
        # Try to locate a date range substring within the text.
        month_regex = r'(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'
        dash = r'[-\u2013\u2014]'

        patterns = [
            rf'{month_regex}\s+\d{{4}}\s*{dash}\s*{month_regex}\s+(?:\d{{4}}|present|current)',
            rf'{month_regex}\s*{dash}\s*{month_regex}\s+\d{{4}}',
            rf'\d{{4}}\s*{dash}\s*(?:\d{{4}}|present|current)',
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0).strip()
        return ""

    def _years_from_items(self, items):
        intervals = []
        for item in items:
            if not isinstance(item, dict):
                continue
            parsed = self._parse_date_range_line(item.get("date_range"))
            if not parsed:
                continue
            sy, sm, ey, em = parsed
            start_idx = sy * 12 + sm
            end_idx = ey * 12 + em
            if end_idx >= start_idx:
                intervals.append((start_idx, end_idx))
        if not intervals:
            return 0
        merged = []
        for start, end in sorted(intervals, key=lambda x: x[0]):
            if not merged or start > merged[-1][1]:
                merged.append([start, end])
            else:
                merged[-1][1] = max(merged[-1][1], end)
        total_months = sum(max(0, end - start + 1) for start, end in merged)
        return round(total_months / 12.0, 2)

    def _parse_date_range_line(self, value):
        if not value:
            return None
        raw = str(value).strip()
        if not raw:
            return None
        clean = re.sub(r'^[\(\[]\s*|\s*[\)\]]$', '', raw).strip()

        month_map = {
            'jan': 1, 'january': 1,
            'feb': 2, 'february': 2,
            'mar': 3, 'march': 3,
            'apr': 4, 'april': 4,
            'may': 5,
            'jun': 6, 'june': 6,
            'jul': 7, 'july': 7,
            'aug': 8, 'august': 8,
            'sep': 9, 'sept': 9, 'september': 9,
            'oct': 10, 'october': 10,
            'nov': 11, 'november': 11,
            'dec': 12, 'december': 12,
        }
        month_regex = r'(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'
        dash = r'[-\u2013\u2014]'

        pattern_full = rf'(?P<sm>{month_regex})\s+(?P<sy>\d{{4}})\s*{dash}\s*(?P<em>{month_regex})\s+(?P<ey>\d{{4}}|present|current)'
        match = re.search(pattern_full, clean, re.IGNORECASE)
        if match:
            sm = month_map[match.group('sm').lower()]
            sy = int(match.group('sy'))
            em = month_map[match.group('em').lower()]
            ey_raw = match.group('ey').lower()
            ey = timezone.now().year if ey_raw in ('present', 'current') else int(ey_raw)
            return (sy, sm, ey, em)

        pattern_same_year = rf'(?P<sm>{month_regex})\s*{dash}\s*(?P<em>{month_regex})\s+(?P<ey>\d{{4}})'
        match = re.search(pattern_same_year, clean, re.IGNORECASE)
        if match:
            sm = month_map[match.group('sm').lower()]
            em = month_map[match.group('em').lower()]
            ey = int(match.group('ey'))
            return (ey, sm, ey, em)

        pattern_years = rf'(?P<sy>\d{{4}})\s*{dash}\s*(?P<ey>\d{{4}}|present|current)'
        match = re.search(pattern_years, clean, re.IGNORECASE)
        if match:
            sy = int(match.group('sy'))
            ey_raw = match.group('ey').lower()
            ey = timezone.now().year if ey_raw in ('present', 'current') else int(ey_raw)
            return (sy, 1, ey, 12)

        return None

    def _rewrite_extracted_text(self, text: str, items):
        if not text:
            return text
        prefix = "Work Experience:"
        if prefix not in text:
            return text
        before, _, tail = text.partition(prefix)
        rest = tail
        for label in [
            "Highest Education:",
            "Total Years Experience:",
            "Certifications:",
            "Languages:",
            "Referees:",
            "Additional Details:",
        ]:
            if label in rest:
                rest = rest.split(label, 1)[1]
                rest = f"{label}{rest}"
                break
        formatted = " | ".join(
            f"{item.get('organization', '').strip()} ({item.get('date_range', '').strip()}) - {item.get('responsibilities', '').strip()}"
            if item.get("date_range") else
            f"{item.get('organization', '').strip()} - {item.get('responsibilities', '').strip()}"
            for item in items
        )
        formatted = " ".join(formatted.split())
        rebuilt = f"{before}{prefix} {formatted}\n{rest}".strip()
        return rebuilt
