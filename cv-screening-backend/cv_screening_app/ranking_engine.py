import re
from typing import Dict, List, Optional, Tuple


class RankingEngine:
    """Candidate ranking and scoring system"""
    
    def __init__(self, screening_criteria: Dict = None):
        """
        Initialize ranking engine with screening criteria
        
        Args:
            screening_criteria: Dict with weights for skills, experience, education
        """
        self.screening_criteria = screening_criteria or {
            'skills_weight': 40,
            'experience_weight': 30,
            'education_weight': 30,
        }
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

    def _canonicalize_skill(self, skill: str) -> str:
        clean = (skill or '').strip().lower()
        if not clean:
            return ''
        for canonical, aliases in self.skill_aliases.items():
            for alias in aliases:
                pattern = r'(?<!\w)' + re.escape(alias.lower()) + r'(?!\w)'
                if re.search(pattern, f" {clean} "):
                    return canonical
        return clean

    def _tokenize_skill(self, skill: str) -> set:
        return set(re.findall(r'[a-z0-9]+', (skill or '').lower()))

    def _tokenize_text(self, text: str) -> set:
        tokens = set(re.findall(r'[a-z0-9]+', (text or '').lower()))
        return {t for t in tokens if len(t) >= 3}

    def normalize_score(self, score: float, min_val: float = 0, max_val: float = 100) -> float:
        """Normalize score to 0-100 range"""
        if max_val <= min_val:
            return 0
        normalized = ((score - min_val) / (max_val - min_val)) * 100
        return max(0, min(100, normalized))
    
    def _extract_skills_from_text(self, text: str) -> set:
        normalized_text = f" {(text or '').lower()} "
        found = set()
        for canonical, aliases in self.skill_aliases.items():
            for alias in aliases:
                pattern = r'(?<!\w)' + re.escape(alias.lower()) + r'(?!\w)'
                if re.search(pattern, normalized_text):
                    found.add(canonical)
                    break
        return found

    def calculate_skills_match(self, required_skills: List[str], candidate_skills: List[str], candidate_text: str = "") -> float:
        """
        Calculate skills match percentage using TF-IDF and cosine similarity
        
        Args:
            required_skills: List of required skills for job
            candidate_skills: List of skills from candidate CV
        
        Returns:
            float: Skills match score (0-100)
        """
        if not required_skills or not candidate_skills:
            return 0.0
        
        required_set = set(filter(None, (self._canonicalize_skill(s) for s in required_skills)))
        candidate_set = set(filter(None, (self._canonicalize_skill(s) for s in candidate_skills)))
        # Use both parsed skills and direct NLP keyword extraction from raw CV text.
        candidate_set |= self._extract_skills_from_text(candidate_text)

        if not required_set:
            return 0.0

        exact_matches = len(required_set & candidate_set)
        exact_ratio = exact_matches / len(required_set)

        # Partial token overlap for near matches (e.g., "react native" vs "react").
        token_partial = 0.0
        for req in required_set:
            if req in candidate_set:
                token_partial += 1.0
                continue
            req_tokens = self._tokenize_skill(req)
            best = 0.0
            for cand in candidate_set:
                cand_tokens = self._tokenize_skill(cand)
                if not req_tokens or not cand_tokens:
                    continue
                overlap = len(req_tokens & cand_tokens) / len(req_tokens)
                best = max(best, overlap)
            token_partial += best

        partial_ratio = token_partial / len(required_set)

        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity

            required_text = ' '.join(sorted(required_set))
            candidate_text = ' '.join(sorted(candidate_set))
            vectorizer = TfidfVectorizer(lowercase=True, ngram_range=(1, 2))
            tfidf_matrix = vectorizer.fit_transform([required_text, candidate_text])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]

            # Weighted blend: exact > partial > semantic similarity.
            skills_score = (exact_ratio * 0.5 + partial_ratio * 0.3 + similarity * 0.2) * 100
            return min(100, skills_score)

        except Exception:
            return min(100, (exact_ratio * 0.65 + partial_ratio * 0.35) * 100)
    
    def calculate_experience_match(self, 
                                  required_min_years: float,
                                  required_max_years: float,
                                  candidate_years: Optional[float],
                                  *,
                                  job_title: str = "",
                                  job_description: str = "",
                                  required_skills: List[str] = None,
                                  preferred_skills: List[str] = None,
                                  work_experience_records: List = None,
                                  candidate_text: str = "") -> float:
        """
        Calculate experience match score
        
        Args:
            required_min_years: Minimum years required
            required_max_years: Maximum years (preferred)
            candidate_years: Candidate's years of experience
        
        Returns:
            float: Experience match score (0-100)
        """
        if candidate_years is None:
            candidate_years = 0.0
        candidate_years = max(0.0, float(candidate_years))
        
        # Candidate meets minimum requirement
        if candidate_years < required_min_years:
            # Partial score based on gap
            gap = required_min_years - candidate_years
            score = max(0, 60 - (gap * 12))
            years_score = score
        
        # Candidate within optimal range
        elif candidate_years <= required_max_years:
            # Reward closeness to midpoint in desired range.
            midpoint = (required_min_years + required_max_years) / 2
            spread = max(1.0, (required_max_years - required_min_years) / 2)
            closeness = abs(candidate_years - midpoint) / spread
            years_score = max(80.0, 100.0 - (closeness * 12))
        
        # Candidate exceeds maximum (still good, just not ideal)
        else:
            excess = candidate_years - required_max_years
            score = max(55, 95 - (excess * 4))
            years_score = score

        content_score = self._experience_content_score(
            job_title=job_title,
            job_description=job_description,
            required_skills=required_skills or [],
            preferred_skills=preferred_skills or [],
            work_experience_records=work_experience_records or [],
            candidate_text=candidate_text or "",
        )
        if content_score is None:
            return years_score
        return min(100.0, (years_score * 0.3) + (content_score * 0.7))

    def _experience_content_score(self,
                                  *,
                                  job_title: str,
                                  job_description: str,
                                  required_skills: List[str],
                                  preferred_skills: List[str],
                                  work_experience_records: List,
                                  candidate_text: str) -> Optional[float]:
        # Build job keyword set from title/description/skills.
        job_text = " ".join(filter(None, [job_title, job_description]))
        job_tokens = self._tokenize_text(job_text)
        skill_tokens = set()
        for skill in (required_skills or []):
            skill_tokens |= self._tokenize_text(self._canonicalize_skill(skill))
        for skill in (preferred_skills or []):
            skill_tokens |= self._tokenize_text(self._canonicalize_skill(skill))
        job_tokens |= skill_tokens
        if not job_tokens:
            return None

        # Build experience text from structured records.
        exp_chunks = []
        position_chunks = []
        for item in (work_experience_records or []):
            if isinstance(item, dict):
                exp_chunks.append(str(item.get('organization') or ''))
                position = str(item.get('position') or '')
                exp_chunks.append(position)
                position_chunks.append(position)
                exp_chunks.append(str(item.get('responsibilities') or item.get('description') or ''))
            else:
                exp_chunks.append(str(item))
        exp_text = " ".join(exp_chunks).strip()
        if not exp_text:
            exp_text = candidate_text or ""

        candidate_tokens = self._tokenize_text(exp_text)
        if not candidate_tokens:
            return None

        overlap = len(job_tokens & candidate_tokens)
        coverage = overlap / max(1, len(job_tokens))
        base_score = min(100.0, coverage * 100.0)

        # Stronger job title match against candidate positions (role alignment).
        title_tokens = self._tokenize_text(job_title)
        position_text = " ".join(position_chunks).strip()
        position_tokens = self._tokenize_text(position_text)
        title_match = 0.0
        if title_tokens and position_tokens:
            title_overlap = len(title_tokens & position_tokens)
            title_match = title_overlap / max(1, len(title_tokens)) * 100.0

        # Blend: 60% content coverage + 40% job-title/position match.
        return min(100.0, (base_score * 0.6) + (title_match * 0.4))

    def _extract_years_from_text(self, text: str) -> Optional[float]:
        raw = (text or '').lower()
        if not raw:
            return None

        total_years = []
        # Examples: "5+ years", "3 years of experience", "2.5 yrs experience"
        for match in re.findall(r'(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years|year|yrs|yr)\b', raw):
            try:
                value = float(match)
                if 0 <= value <= 60:
                    total_years.append(value)
            except Exception:
                continue

        if not total_years:
            return None
        return max(total_years)

    def _experience_years_from_records(self, work_experience_records: List) -> Optional[float]:
        if not work_experience_records:
            return None
        intervals = []
        for item in work_experience_records:
            if not isinstance(item, dict):
                continue
            sy = item.get('start_year')
            sm = item.get('start_month', 1) or 1
            ey = item.get('end_year')
            em = item.get('end_month', 12) or 12
            if sy and ey:
                try:
                    start_idx = int(sy) * 12 + int(sm)
                    end_idx = int(ey) * 12 + int(em)
                    if end_idx >= start_idx:
                        intervals.append((start_idx, end_idx))
                except Exception:
                    continue

        if intervals:
            merged = []
            for start, end in sorted(intervals, key=lambda x: x[0]):
                if not merged or start > merged[-1][1]:
                    merged.append([start, end])
                else:
                    merged[-1][1] = max(merged[-1][1], end)
            total_months = sum(max(0, end - start + 1) for start, end in merged)
            return round(total_months / 12.0, 2)

        text = ' '.join(str(item.get('text', item)) for item in work_experience_records)
        return self._extract_years_from_text(text)

    def _infer_candidate_years(self,
                               candidate_years: Optional[float],
                               work_experience_records: List,
                               candidate_text: str) -> Optional[float]:
        if candidate_years is not None:
            try:
                value = float(candidate_years)
                if value >= 0:
                    return value
            except Exception:
                pass

        from_records = self._experience_years_from_records(work_experience_records)
        if from_records is not None:
            return from_records

        return self._extract_years_from_text(candidate_text)

    def _infer_candidate_education(self,
                                   candidate_education: str,
                                   education_records: List,
                                   candidate_text: str) -> str:
        valid = {'high_school', 'diploma', 'bachelor', 'master', 'phd'}
        if candidate_education in valid:
            return candidate_education

        combined = ' '.join([
            str(candidate_education or ''),
            ' '.join(str(item.get('text', item)) for item in (education_records or [])),
            str(candidate_text or ''),
        ]).lower()

        if any(k in combined for k in ['phd', 'doctorate']):
            return 'phd'
        if any(k in combined for k in ['master', 'msc', 'mba', 'm.s', 'm.a']):
            return 'master'
        if any(k in combined for k in ['bachelor', 'bsc', 'b.s', 'b.a', 'ba ']):
            return 'bachelor'
        if any(k in combined for k in ['diploma', 'associate']):
            return 'diploma'
        return 'high_school'
    
    def calculate_education_match(self, required_education: str, candidate_education: str) -> float:
        """
        Calculate education match score
        
        Args:
            required_education: Required education level
            candidate_education: Candidate's education level
        
        Returns:
            float: Education match score (0-100)
        """
        education_hierarchy = {
            'high_school': 1,
            'diploma': 2,
            'bachelor': 3,
            'master': 4,
            'phd': 5,
        }
        
        required_level = education_hierarchy.get(required_education, 0)
        candidate_level = education_hierarchy.get(candidate_education, 0)
        
        if candidate_level >= required_level:
            return 100.0
        elif candidate_level == required_level - 1:
            return 70.0
        elif candidate_level == required_level - 2:
            return 40.0
        else:
            return 0.0
    
    def calculate_overall_score(self,
                               skills_score: float,
                               experience_score: float,
                               education_score: float) -> float:
        """
        Calculate weighted overall score
        
        Args:
            skills_score: Skills match score (0-100)
            experience_score: Experience match score (0-100)
            education_score: Education match score (0-100)
        
        Returns:
            float: Overall score (0-100)
        """
        weights = self.screening_criteria
        total_weight = weights['skills_weight'] + weights['experience_weight'] + weights['education_weight']
        
        if total_weight == 0:
            return 0.0
        
        overall_score = (
            (skills_score * weights['skills_weight'] +
             experience_score * weights['experience_weight'] +
             education_score * weights['education_weight']) / total_weight
        )
        
        return min(100, overall_score)
    
    def rank_candidates(self, job_posting: Dict, candidates: List[Dict]) -> List[Tuple[Dict, float]]:
        """
        Rank candidates for a job position
        
        Args:
            job_posting: Job details with requirements
            candidates: List of candidate profiles with parsed CV data
        
        Returns:
            List[Tuple]: Sorted list of (candidate, score) tuples
        """
        ranked_candidates = []
        
        required_skills = [s.strip().lower() for s in str(job_posting.get('required_skills', '')).split(',') if s.strip()]
        preferred_skills = [s.strip().lower() for s in str(job_posting.get('preferred_skills', '')).split(',') if s.strip()]
        required_education = job_posting['required_education']
        required_min_years = float(job_posting.get('years_of_experience_min', 0) or 0)
        required_max_years = float(job_posting.get('years_of_experience_max', 10) or 10)
        job_title = str(job_posting.get('job_title', '') or '')
        job_description = str(job_posting.get('job_description', '') or '')
        # Fallback for broad/default ranges by mapping experience level.
        if required_min_years == 0 and required_max_years == 10:
            exp_level = str(job_posting.get('required_experience', '')).lower()
            if exp_level == 'entry':
                required_min_years, required_max_years = 0.0, 2.0
            elif exp_level == 'mid':
                required_min_years, required_max_years = 2.0, 5.0
            elif exp_level == 'senior':
                required_min_years, required_max_years = 5.0, 12.0
        
        for candidate in candidates:
            # Bias guardrail: ranking strictly ignores identity/contact fields.
            candidate_skills = [s.lower() for s in candidate.get('skills', [])]
            candidate_text = candidate.get('extracted_text', '')
            candidate_education = self._infer_candidate_education(
                candidate_education=candidate.get('highest_education', 'high_school'),
                education_records=candidate.get('education', []),
                candidate_text=candidate_text,
            )
            candidate_years = self._infer_candidate_years(
                candidate_years=candidate.get('total_years_experience', None),
                work_experience_records=candidate.get('work_experience', []),
                candidate_text=candidate_text,
            )
            if candidate_years is None:
                candidate_years = 0
            candidate_text = candidate.get('extracted_text', '')
            
            # Calculate component scores
            skills_score = self.calculate_skills_match(required_skills, candidate_skills, candidate_text)
            experience_score = self.calculate_experience_match(
                required_min_years,
                required_max_years,
                candidate_years,
                job_title=job_title,
                job_description=job_description,
                required_skills=required_skills,
                preferred_skills=preferred_skills,
                work_experience_records=candidate.get('work_experience', []),
                candidate_text=candidate_text,
            )
            education_score = self.calculate_education_match(required_education, candidate_education)
            
            # Calculate overall score
            overall_score = self.calculate_overall_score(
                skills_score,
                experience_score,
                education_score
            )
            
            candidate['scores'] = {
                'skills_score': skills_score,
                'experience_score': experience_score,
                'education_score': education_score,
                'overall_score': overall_score,
                'matched_required_skills': sorted(
                    list(set(filter(None, (self._canonicalize_skill(s) for s in required_skills))) &
                         (set(filter(None, (self._canonicalize_skill(s) for s in candidate_skills))) |
                          self._extract_skills_from_text(candidate_text)))
                ),
                'missing_required_skills': sorted(
                    list(set(filter(None, (self._canonicalize_skill(s) for s in required_skills))) -
                         (set(filter(None, (self._canonicalize_skill(s) for s in candidate_skills))) |
                          self._extract_skills_from_text(candidate_text)))
                ),
            }
            
            ranked_candidates.append((candidate, overall_score))
        
        # Sort by score descending
        ranked_candidates.sort(key=lambda x: x[1], reverse=True)
        
        return ranked_candidates
