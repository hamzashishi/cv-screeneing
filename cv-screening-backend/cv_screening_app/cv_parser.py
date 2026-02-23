import re
from typing import Dict, List, Optional, Tuple

import nltk
import pdfplumber
import spacy
from django.conf import settings
from django.utils import timezone
from docx import Document

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')


class CVParser:
    """CV/Resume parsing and text extraction"""

    def __init__(self):
        self.current_year = timezone.now().year
        self.skill_aliases = {
            'python': ['python'],
            'javascript': ['javascript', 'js', 'ecmascript'],
            'typescript': ['typescript', 'ts'],
            'java': ['java'],
            'c++': ['c++', 'cpp'],
            'c#': ['c#', 'csharp', '.net', 'dotnet'],
            'sql': ['sql', 't-sql', 'pl/sql'],
            'react': ['react', 'reactjs', 'react.js'],
            'angular': ['angular', 'angularjs'],
            'vue': ['vue', 'vuejs', 'vue.js'],
            'node': ['node', 'nodejs', 'node.js'],
            'django': ['django'],
            'flask': ['flask'],
            'fastapi': ['fastapi'],
            'postgresql': ['postgresql', 'postgres'],
            'mysql': ['mysql'],
            'mongodb': ['mongodb', 'mongo'],
            'docker': ['docker'],
            'kubernetes': ['kubernetes', 'k8s'],
            'aws': ['aws', 'amazon web services'],
            'azure': ['azure', 'microsoft azure'],
            'gcp': ['gcp', 'google cloud', 'google cloud platform'],
            'git': ['git'],
            'ci/cd': ['ci/cd', 'cicd', 'continuous integration', 'continuous delivery'],
            'rest api': ['rest api', 'restful api'],
            'machine learning': ['machine learning', 'ml'],
            'deep learning': ['deep learning'],
            'nlp': ['nlp', 'natural language processing'],
            'data science': ['data science'],
            'power bi': ['power bi', 'powerbi'],
            'tableau': ['tableau'],
            'agile': ['agile'],
            'scrum': ['scrum'],
        }
        try:
            self.nlp = spacy.load(settings.SPACY_MODEL)
        except Exception:
            # Production-safe fallback if model is unavailable.
            self.nlp = spacy.blank('en')
        if 'parser' not in self.nlp.pipe_names and 'senter' not in self.nlp.pipe_names:
            if 'sentencizer' not in self.nlp.pipe_names:
                self.nlp.add_pipe('sentencizer')

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text from PDF file"""
        text = ""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    text += (page.extract_text() or "") + "\n"
        except Exception as e:
            print(f"Error extracting PDF: {str(e)}")
        # Normalize noisy PDF text artifacts (line breaks/hyphenation/spacing).
        text = re.sub(r'-\s*\n\s*', '', text)
        text = re.sub(r'\s*\n\s*', '\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        return text

    def extract_text_from_docx(self, docx_path: str) -> str:
        """Extract text from DOCX file"""
        text = ""
        try:
            doc = Document(docx_path)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
        except Exception as e:
            print(f"Error extracting DOCX: {str(e)}")
        return text

    def extract_text(self, file_path: str) -> str:
        """Extract text from CV (PDF or DOCX)"""
        lower_path = file_path.lower()
        if lower_path.endswith('.pdf'):
            return self.extract_text_from_pdf(file_path)
        if lower_path.endswith('.docx'):
            return self.extract_text_from_docx(file_path)
        raise ValueError('Unsupported file format')

    def extract_email(self, text: str) -> Optional[str]:
        """Extract email address from text"""
        pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        matches = re.findall(pattern, text)
        return matches[0] if matches else None

    def extract_phone(self, text: str) -> Optional[str]:
        """Extract phone number from text"""
        pattern = r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        matches = re.findall(pattern, text)
        return matches[0] if matches else None

    def extract_name(self, text: str) -> Optional[str]:
        """Extract name from text using NLP"""
        doc = self.nlp(text[:500])
        for ent in getattr(doc, 'ents', []):
            if ent.label_ == 'PERSON':
                return ent.text
        return None

    def extract_location(self, text: str) -> Optional[str]:
        """Extract location from text"""
        doc = self.nlp(text[:1000])
        for ent in getattr(doc, 'ents', []):
            if ent.label_ == 'GPE':
                return ent.text
        return None

    def extract_skills(self, text: str) -> List[str]:
        """Extract canonical skills from CV text with alias matching."""
        normalized_text = f" {text.lower()} "
        found = set()
        for canonical, aliases in self.skill_aliases.items():
            for alias in aliases:
                pattern = r'(?<!\w)' + re.escape(alias.lower()) + r'(?!\w)'
                if re.search(pattern, normalized_text):
                    found.add(canonical)
                    break
        return sorted(found)

    def extract_education(self, text: str) -> List[Dict]:
        """Extract education information"""
        education_keywords = ['degree', 'bachelor', 'master', 'phd', 'diploma', 'certificate', 'university', 'college']
        education_list = []
        doc = self.nlp(text)
        for sent in getattr(doc, 'sents', []):
            sent_text = sent.text
            if any(keyword in sent_text.lower() for keyword in education_keywords):
                education_list.append({'text': sent_text})
        return education_list

    def infer_highest_education(self, text: str, education_records: List[Dict]) -> str:
        """Infer highest education level."""
        content = ' '.join([str(e.get('text', e)) for e in (education_records or [])]).lower()
        combined = f"{content} {text.lower()}"

        if any(k in combined for k in ['phd', 'doctorate']):
            return 'phd'
        if any(k in combined for k in ['master', 'msc', 'mba', 'm.s', 'm.a']):
            return 'master'
        if any(k in combined for k in ['bachelor', 'bsc', 'b.s', 'ba ', 'b.a']):
            return 'bachelor'
        if any(k in combined for k in ['diploma', 'associate']):
            return 'diploma'
        return 'high_school'

    def extract_experience(self, text: str) -> Tuple[List[Dict], Optional[float]]:
        """Extract work experience and estimate years."""
        experience_list = []
        experience_keywords = ['experience', 'worked', 'employed', 'job', 'position', 'role', 'engineer', 'developer', 'manager']
        doc = self.nlp(text)

        structured_entries, intervals = self._extract_structured_experience(text)
        if structured_entries:
            experience_list.extend(structured_entries)

        for sent in getattr(doc, 'sents', []):
            sent_text = sent.text
            if any(keyword in sent_text.lower() for keyword in experience_keywords):
                experience_list.append({'text': sent_text})

        total_years = self._years_from_intervals(intervals)
        return experience_list, (total_years if total_years > 0 else None)

    def _extract_structured_experience(self, text: str) -> Tuple[List[Dict], List[Tuple[int, int]]]:
        lines = [line.strip() for line in text.splitlines()]
        lines = [line for line in lines if line]
        if not lines:
            return [], []

        # Heuristic: treat date-range lines as anchors for experience blocks.
        entries = []
        intervals = []
        date_indexes = []
        date_meta = {}

        for idx, line in enumerate(lines):
            parsed = self._parse_date_range_line(line)
            if parsed:
                date_indexes.append(idx)
                date_meta[idx] = parsed

        for i, idx in enumerate(date_indexes):
            meta = date_meta[idx]
            prev_line = self._previous_non_empty_line(lines, idx)
            next_limit = date_indexes[i + 1] if i + 1 < len(date_indexes) else len(lines)
            duties = self._collect_duties(lines, idx + 1, next_limit)

            start_year, start_month = meta['start']
            end_year, end_month = meta['end']
            if start_year and end_year:
                start_idx = start_year * 12 + start_month
                end_idx = end_year * 12 + end_month
                if end_idx >= start_idx:
                    intervals.append((start_idx, end_idx))

            record = {
                'organization': prev_line,
                'role': None,
                'location': None,
                'date_range': meta['raw'],
                'start_year': start_year,
                'start_month': start_month,
                'end_year': end_year,
                'end_month': end_month,
                'responsibilities': duties or None,
            }
            record['text'] = self._format_experience_text(record)
            entries.append(record)

        return entries, intervals

    def _format_experience_text(self, record: Dict) -> str:
        parts = []
        if record.get('organization'):
            parts.append(str(record['organization']))
        if record.get('date_range'):
            parts.append(str(record['date_range']))
        if record.get('responsibilities'):
            parts.append(str(record['responsibilities']))
        return ' | '.join(parts)

    def _previous_non_empty_line(self, lines: List[str], idx: int) -> Optional[str]:
        for i in range(idx - 1, -1, -1):
            candidate = lines[i].strip()
            if candidate and not self._parse_date_range_line(candidate):
                return candidate
        return None

    def _collect_duties(self, lines: List[str], start: int, end: int) -> Optional[str]:
        duties = []
        for i in range(start, end):
            line = lines[i].strip()
            if not line:
                break
            if self._parse_date_range_line(line):
                break
            duties.append(line)
            if len(duties) >= 3:
                break
        if not duties:
            return None
        return ' '.join(duties).strip()

    def _parse_date_range_line(self, line: str) -> Optional[Dict]:
        raw = line.strip()
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

        # Example: Aug 2021 - Sep 2022
        pattern_full = rf'(?P<sm>{month_regex})\s+(?P<sy>\d{{4}})\s*{dash}\s*(?P<em>{month_regex})\s+(?P<ey>\d{{4}}|present|current)'
        match = re.search(pattern_full, clean, re.IGNORECASE)
        if match:
            sm = month_map[match.group('sm').lower()]
            sy = int(match.group('sy'))
            em = month_map[match.group('em').lower()]
            ey_raw = match.group('ey').lower()
            ey = self.current_year if ey_raw in ('present', 'current') else int(ey_raw)
            return {'start': (sy, sm), 'end': (ey, em), 'raw': raw}

        # Example: Aug - Sep 2021
        pattern_same_year = rf'(?P<sm>{month_regex})\s*{dash}\s*(?P<em>{month_regex})\s+(?P<ey>\d{{4}})'
        match = re.search(pattern_same_year, clean, re.IGNORECASE)
        if match:
            sm = month_map[match.group('sm').lower()]
            em = month_map[match.group('em').lower()]
            ey = int(match.group('ey'))
            return {'start': (ey, sm), 'end': (ey, em), 'raw': raw}

        # Example: 2020 - 2023 or 2020 - Present
        pattern_years = rf'(?P<sy>\d{{4}})\s*{dash}\s*(?P<ey>\d{{4}}|present|current)'
        match = re.search(pattern_years, clean, re.IGNORECASE)
        if match:
            sy = int(match.group('sy'))
            ey_raw = match.group('ey').lower()
            ey = self.current_year if ey_raw in ('present', 'current') else int(ey_raw)
            return {'start': (sy, 1), 'end': (ey, 12), 'raw': raw}

        return None

    def _years_from_intervals(self, intervals: List[Tuple[int, int]]) -> float:
        if not intervals:
            return 0.0
        # Merge overlapping month ranges to avoid double counting.
        merged = []
        for start, end in sorted(intervals, key=lambda x: x[0]):
            if not merged or start > merged[-1][1]:
                merged.append([start, end])
            else:
                merged[-1][1] = max(merged[-1][1], end)
        total_months = sum(max(0, end - start + 1) for start, end in merged)
        return round(total_months / 12.0, 2)

    def extract_certifications(self, text: str) -> List[Dict]:
        """Extract certifications"""
        cert_keywords = ['certification', 'certified', 'aws', 'azure', 'google', 'comptia', 'ccna', 'cissp', 'cpa']
        certifications = []
        doc = self.nlp(text)
        for sent in getattr(doc, 'sents', []):
            sent_text = sent.text
            if any(keyword in sent_text.lower() for keyword in cert_keywords):
                certifications.append({'text': sent_text})
        return certifications

    def extract_languages(self, text: str) -> List[str]:
        """Extract languages"""
        language_keywords = ['english', 'spanish', 'french', 'german', 'mandarin', 'portuguese', 'russian', 'arabic', 'hindi', 'japanese']
        text_lower = text.lower()
        return [language for language in language_keywords if language in text_lower]

    def parse_cv(self, file_path: str) -> Optional[Dict]:
        """Complete CV parsing"""
        try:
            text = self.extract_text(file_path)
            if not text or not text.strip():
                return None

            full_name = self.extract_name(text)
            email = self.extract_email(text)
            phone_number = self.extract_phone(text)
            location = self.extract_location(text)
            skills = self.extract_skills(text)
            education = self.extract_education(text)
            work_experience, total_years_experience = self.extract_experience(text)
            certifications = self.extract_certifications(text)
            languages = self.extract_languages(text)
            highest_education = self.infer_highest_education(text, education)
            summary = self.build_profile_summary(
                full_name=full_name,
                location=location,
                skills=skills,
                total_years_experience=total_years_experience,
                highest_education=highest_education,
                certifications=certifications,
                languages=languages,
                raw_text=text,
            )

            return {
                'full_name': full_name,
                'email': email,
                'phone_number': phone_number,
                'location': location,
                'summary': summary,
                'skills': skills,
                'education': education,
                'highest_education': highest_education,
                'work_experience': work_experience,
                'total_years_experience': total_years_experience,
                'certifications': certifications,
                'languages': languages,
                'extracted_text': text,
            }
        except Exception as e:
            print(f"Error parsing CV: {str(e)}")
            return None

    def build_profile_summary(
        self,
        *,
        full_name: Optional[str],
        location: Optional[str],
        skills: List[str],
        total_years_experience: Optional[float],
        highest_education: str,
        certifications: List[Dict],
        languages: List[str],
        raw_text: str,
    ) -> str:
        """Generate compact structured summary for HR from extracted CV fields."""
        parts = []

        if full_name:
            parts.append(f"Candidate: {full_name}.")
        if location:
            parts.append(f"Location: {location}.")
        if total_years_experience is not None:
            parts.append(f"Experience: approximately {total_years_experience:.1f} years.")
        if highest_education:
            parts.append(f"Education level: {highest_education.replace('_', ' ')}.")
        if skills:
            parts.append(f"Top skills: {', '.join(skills[:10])}.")
        if certifications:
            cert_text = []
            for cert in certifications[:3]:
                value = str(cert.get('text', '')).strip()
                if value:
                    cert_text.append(value)
            if cert_text:
                parts.append(f"Certifications: {' | '.join(cert_text)}.")
        if languages:
            parts.append(f"Languages: {', '.join(languages[:5])}.")

        summary = ' '.join(parts).strip()
        if summary:
            return summary[:1000]

        # Fallback when extraction is sparse: use first meaningful lines.
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        return ' '.join(lines[:8])[:1000]
