"""
Supabase client and data access layer for RADIX Talent Check.
Fetches live company records and 12-skill requirements from Supabase tables:
- `company_json` (company metadata, directory)
- `company_skill_levels` (per-company required skill levels)
- `skill_set_master` (12 RADIX categories mapping)

Includes fallback to project data files for legacy test fixtures if requested.
"""

import os
import json
import logging
import re
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any, Annotated
from uuid import UUID

import jwt
import requests
from argon2 import PasswordHasher
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

logger = logging.getLogger(__name__)

# Authentication primitives live alongside the backend's Supabase data client.
load_dotenv(Path(__file__).resolve().parents[2] / ".env", override=False)
APP_AUTH_SECRET = os.getenv("APP_AUTH_SECRET", "")
JWT_ISSUER = os.getenv("APP_AUTH_ISSUER", "radix-talent-match")
ACCESS_TOKEN_MINUTES = int(os.getenv("APP_ACCESS_TOKEN_MINUTES", "43200"))
JWT_ALGORITHM = "HS256"
PASSWORD_HASHER = PasswordHasher()
BEARER = HTTPBearer(auto_error=False)


def _auth_supabase_config() -> tuple[str, str]:
    url = os.getenv("SUPABASE_URL", "").strip() or DEFAULT_SUPABASE_URL
    # Prefer the explicitly named service-role alias, while supporting existing
    # deployments where SUPABASE_KEY is already the privileged server key.
    key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
        or os.getenv("SUPABASE_KEY", "").strip()
        or DEFAULT_SUPABASE_KEY
    )
    if not url or not key:
        raise HTTPException(
            status_code=503,
            detail="Privileged authentication database access is not configured.",
        )
    return url.rstrip("/"), key


def auth_rest_request(
    method: str,
    path: str,
    *,
    params: dict[str, str] | None = None,
    json_body: object | None = None,
    prefer: str | None = None,
) -> list[dict[str, Any]]:
    url, key = _auth_supabase_config()
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    try:
        response = requests.request(
            method,
            f"{url}/rest/v1/{path}",
            headers=headers,
            params=params,
            json=json_body,
            timeout=10,
        )
    except requests.RequestException as exc:
        logger.error(
            "Auth PostgREST request %s %s failed (%s)", method, path, type(exc).__name__
        )
        raise HTTPException(
            status_code=503, detail="Authentication data service is unavailable."
        ) from exc
    if response.status_code >= 400:
        if response.status_code == 409:
            raise HTTPException(
                status_code=409, detail="An account with this email already exists."
            )
        try:
            error_body = response.json()
        except ValueError:
            error_body = {}
        if not isinstance(error_body, dict):
            error_body = {}

        def safe_diagnostic(value: object) -> str | None:
            if value is None:
                return None
            diagnostic = str(value)[:500]
            diagnostic = re.sub(
                r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}",
                "[redacted-email]",
                diagnostic,
                flags=re.IGNORECASE,
            )
            diagnostic = re.sub(
                r"\([^)]*\)=\([^)]*\)", "(value)=[redacted]", diagnostic
            )
            diagnostic = re.sub(
                r"\b(?:eyJ[A-Za-z0-9_-]{20,}|[A-Za-z0-9_-]{40,})\b",
                "[redacted-token]",
                diagnostic,
            )
            return diagnostic

        logger.error(
            "Auth PostgREST request %s %s returned HTTP %s: code=%s message=%s details=%s hint=%s",
            method,
            path,
            response.status_code,
            safe_diagnostic(error_body.get("code")),
            safe_diagnostic(error_body.get("message")),
            safe_diagnostic(error_body.get("details")),
            safe_diagnostic(error_body.get("hint")),
        )
        raise HTTPException(
            status_code=503, detail="Authentication data service is unavailable."
        )
    if not response.content:
        return []
    data = response.json()
    if not isinstance(data, list):
        raise HTTPException(
            status_code=503,
            detail="Authentication data service returned an invalid response.",
        )
    return data


def normalize_email(email: str) -> str:
    return email.strip().lower()


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    email: EmailStr
    education_id: int | None = None
    hackathons: list[str] = Field(default_factory=list)
    internships: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    preferred_roles: list[str] = Field(default_factory=list)
    created_at: datetime | None = None
    updated_at: datetime | None = None


class AuthenticatedUser(UserPublic):
    pass


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Name cannot be empty.")
        return cleaned


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    user: UserPublic
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime


class ProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    skills: list[dict[str, Any]] | None = None
    hackathons: list[str] | None = None
    internships: list[str] | None = None
    certifications: list[str] | None = None
    preferred_roles: list[str] | None = None
    education: dict[str, str | int | float | None] | None = None


def _auth_configured() -> None:
    if not APP_AUTH_SECRET or len(APP_AUTH_SECRET.encode()) < 32:
        raise HTTPException(
            status_code=503, detail="Authentication secret is not configured securely."
        )


def create_access_token(user_id: UUID) -> tuple[str, datetime]:
    _auth_configured()
    now = datetime.now(UTC)
    expires = now + timedelta(minutes=ACCESS_TOKEN_MINUTES)
    token = jwt.encode(
        {
            "sub": str(user_id),
            "iat": now,
            "exp": expires,
            "iss": JWT_ISSUER,
            "type": "access",
        },
        APP_AUTH_SECRET,
        algorithm=JWT_ALGORITHM,
    )
    return token, expires


def _decode_access_token(token: str) -> UUID:
    _auth_configured()
    try:
        claims = jwt.decode(
            token,
            APP_AUTH_SECRET,
            algorithms=[JWT_ALGORITHM],
            issuer=JWT_ISSUER,
            options={"require": ["sub", "iat", "exp", "iss", "type"]},
        )
        if claims.get("type") != "access":
            raise jwt.InvalidTokenError("Wrong token type")
        return UUID(claims["sub"])
    except (jwt.PyJWTError, ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def _public_user(row: dict[str, object]) -> UserPublic:
    return UserPublic.model_validate(
        {
            key: value
            for key, value in row.items()
            if key not in {"password", "token_hash"}
        }
    )


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(BEARER)],
) -> AuthenticatedUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = _decode_access_token(credentials.credentials)
    rows = auth_rest_request(
        "GET",
        "users",
        params={
            "select": "id,name,email,education_id,hackathons,internships,certifications,preferred_roles,created_at,updated_at",
            "id": f"eq.{user_id}",
            "limit": "1",
        },
    )
    if not rows:
        raise HTTPException(status_code=401, detail="Invalid or expired access token.")
    return AuthenticatedUser.model_validate(rows[0])


# Fallback defaults for URL and Key if not in environment
DEFAULT_SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
DEFAULT_SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip()

# In-memory caches to minimize repeated remote HTTP calls
_COMPANIES_CACHE: list[dict[str, Any]] | None = None
_REQUIREMENTS_CACHE: dict[Any, dict[str, int]] = {}

LEGACY_DATA_FILE = (
    Path(__file__).resolve().parent.parent / "data" / "company_skillsets.json"
)
FALLBACK_COMPANY_DATA_FILE = (
    Path(__file__).resolve().parent / "fallback_company_data.json"
)


def get_supabase_credentials() -> tuple[str, str]:
    url = os.getenv("SUPABASE_URL", "").strip() or DEFAULT_SUPABASE_URL
    key = os.getenv("SUPABASE_KEY", "").strip() or DEFAULT_SUPABASE_KEY
    return url.rstrip("/"), key


def _get_headers() -> dict[str, str]:
    _, key = get_supabase_credentials()
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


def _load_legacy_fixture_companies() -> dict[str, dict[str, int]]:
    """Helper to load legacy demo fixture if requested."""
    if LEGACY_DATA_FILE.exists():
        try:
            with LEGACY_DATA_FILE.open("r", encoding="utf-8-sig") as f:
                data = json.load(f)
                return data.get("companies", {})
        except Exception:
            pass
    return {}


def fetch_all_companies(force_refresh: bool = False) -> list[dict[str, Any]]:
    """
    Fetch the list of all available companies from Supabase `company_json`.
    """
    global _COMPANIES_CACHE
    if _COMPANIES_CACHE is not None and not force_refresh:
        return _COMPANIES_CACHE

    url, _ = get_supabase_credentials()
    endpoint = f"{url}/rest/v1/company_json?select=company_id,short_json&order=company_id.asc&limit=300"

    try:
        resp = requests.get(endpoint, headers=_get_headers(), timeout=10)
        resp.raise_for_status()
        raw_list = resp.json()

        companies = []
        for item in raw_list:
            cid = item.get("company_id")
            sj = item.get("short_json") or {}
            name = sj.get("name") or f"Company {cid}"
            category = sj.get("category") or "Technology"
            logo_url = sj.get("logo_url") or ""
            short_name = sj.get("short_name") or name.split()[0]

            companies.append(
                {
                    "company_id": cid,
                    "name": name,
                    "short_name": short_name,
                    "category": category,
                    "logo_url": logo_url,
                }
            )

        _COMPANIES_CACHE = companies
        return companies
    except Exception as err:
        logger.error(f"Failed to fetch companies from Supabase: {err}")
        if _COMPANIES_CACHE:
            return _COMPANIES_CACHE
        if FALLBACK_COMPANY_DATA_FILE.exists():
            try:
                with FALLBACK_COMPANY_DATA_FILE.open("r", encoding="utf-8") as f:
                    data = json.load(f)
                    _COMPANIES_CACHE = data.get("companies", [])
                    return _COMPANIES_CACHE
            except Exception as fb_err:
                logger.error(f"Failed to load fallback company data: {fb_err}")
        raise RuntimeError(f"Could not load companies from Supabase: {err}") from err


def fetch_company_matching_data() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Fetch the existing company directory and relational skill requirements."""
    try:
        companies = fetch_all_companies()
        url, _ = get_supabase_credentials()
        skill_response = requests.get(
            f"{url}/rest/v1/skill_set_master",
            params={
                "select": "skill_set_id,short_name,skill_set_name",
                "order": "skill_set_id.asc",
            },
            headers=_get_headers(),
            timeout=10,
        )
        skill_response.raise_for_status()
        skill_sets = skill_response.json()
        if not isinstance(skill_sets, list):
            raise RuntimeError(
                "Supabase returned an invalid skill_set_master response."
            )

        company_ids = [
            company["company_id"]
            for company in companies
            if company.get("company_id") is not None
        ]
        requirements_by_company: dict[Any, dict[int, int]] = {
            company_id: {} for company_id in company_ids
        }
        # Keep each relation request below PostgREST's usual 1,000-row response cap.
        for offset in range(0, len(company_ids), 50):
            company_batch = company_ids[offset : offset + 50]
            id_filter = (
                f"in.({','.join(str(int(company_id)) for company_id in company_batch)})"
            )
            requirement_response = requests.get(
                f"{url}/rest/v1/company_skill_levels",
                params={
                    "select": "company_id,skill_set_id,required_level",
                    "company_id": id_filter,
                    "order": "company_id.asc,skill_set_id.asc",
                },
                headers=_get_headers(),
                timeout=10,
            )
            requirement_response.raise_for_status()
            requirement_rows = requirement_response.json()
            if not isinstance(requirement_rows, list):
                raise RuntimeError(
                    "Supabase returned an invalid company_skill_levels response."
                )
            for row in requirement_rows:
                company_requirements = requirements_by_company.get(
                    row.get("company_id")
                )
                try:
                    skill_id = int(row["skill_set_id"])
                    level = int(row["required_level"])
                except (KeyError, TypeError, ValueError):
                    continue
                if company_requirements is not None and 1 <= level <= 10:
                    company_requirements[skill_id] = level

        enriched_companies = []
        for company in companies:
            company_id = company.get("company_id")
            enriched_companies.append(
                {
                    **company,
                    "skill_requirements": requirements_by_company.get(company_id, {}),
                }
            )
        return skill_sets, enriched_companies
    except Exception as err:
        logger.warning(
            f"Live Supabase company matching fetch failed: {err}. Attempting fallback data."
        )
        if FALLBACK_COMPANY_DATA_FILE.exists():
            try:
                with FALLBACK_COMPANY_DATA_FILE.open("r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data.get("skill_sets", []), data.get("companies", [])
            except Exception as fb_err:
                logger.error(f"Failed to load fallback company data: {fb_err}")
        raise


def fetch_company_requirements(
    company_id_or_name: int | str,
) -> tuple[dict[str, Any], dict[str, int]]:
    """
    Fetch requirements for one company from Supabase.
    Falls back to legacy fixture if querying a legacy demo company name.
    """
    # 1. Check legacy fixtures first for backward-compatible test fixtures (e.g. "Demo Backend Co")
    legacy_companies = _load_legacy_fixture_companies()
    if isinstance(company_id_or_name, str) and company_id_or_name in legacy_companies:
        company_info = {
            "company_id": 9999,
            "name": company_id_or_name,
            "short_name": company_id_or_name,
            "category": "Demo Fixture",
            "logo_url": "",
        }
        return company_info, legacy_companies[company_id_or_name]

    companies = fetch_all_companies()
    matched_company = None

    # Resolve company_id or name
    if isinstance(company_id_or_name, int) or (
        isinstance(company_id_or_name, str) and company_id_or_name.isdigit()
    ):
        cid = int(company_id_or_name)
        matched_company = next((c for c in companies if c["company_id"] == cid), None)
    elif isinstance(company_id_or_name, str):
        target = company_id_or_name.strip().lower()
        matched_company = next(
            (c for c in companies if c["name"].lower() == target), None
        )
        if not matched_company:
            matched_company = next(
                (c for c in companies if target in c["name"].lower()), None
            )

    if not matched_company:
        raise ValueError(f"Company '{company_id_or_name}' not found in Supabase.")

    cid = matched_company["company_id"]

    # Check cache
    if cid in _REQUIREMENTS_CACHE:
        return matched_company, _REQUIREMENTS_CACHE[cid]

    url, _ = get_supabase_credentials()
    endpoint = (
        f"{url}/rest/v1/company_skill_levels"
        f"?company_id=eq.{cid}"
        f"&select=skill_set_id,required_level,skill_set_master(short_name,skill_set_name)"
        f"&order=skill_set_id.asc"
    )

    try:
        resp = requests.get(endpoint, headers=_get_headers(), timeout=10)
        resp.raise_for_status()
        rows = resp.json()

        if not rows:
            raise ValueError(
                f"No skill requirements configured in Supabase for '{matched_company['name']}' (ID {cid})."
            )

        requirements = {}
        for row in rows:
            ssm = row.get("skill_set_master") or {}
            short_name = ssm.get("short_name")
            level = row.get("required_level")
            if short_name and level is not None:
                requirements[short_name] = int(level)

        if not requirements:
            raise ValueError(
                f"Empty skill requirements for '{matched_company['name']}' in Supabase."
            )

        _REQUIREMENTS_CACHE[cid] = requirements
        return matched_company, requirements

    except Exception as err:
        logger.error(f"Error fetching skill levels for company_id={cid}: {err}")
        raise RuntimeError(
            f"Database error fetching requirements for {matched_company['name']}: {err}"
        ) from err
