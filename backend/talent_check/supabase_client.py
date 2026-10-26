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
from pathlib import Path
from typing import Any
import requests

logger = logging.getLogger(__name__)

# Fallback defaults for URL and Key if not in environment
DEFAULT_SUPABASE_URL = "https://tesuflnbaoijcdudfxwl.supabase.co"
DEFAULT_SUPABASE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3VmbG5iYW9pamNkdWRmeHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0ODc0MzQsImV4cCI6MjEwODA2MzQzNH0."
    "9AD11-CYeh0bXqNZWFYaxx7Q4o_vG1rgCHjDfERuAic"
)

# In-memory caches to minimize repeated remote HTTP calls
_COMPANIES_CACHE: list[dict[str, Any]] | None = None
_REQUIREMENTS_CACHE: dict[Any, dict[str, int]] = {}

LEGACY_DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "company_skillsets.json"


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

            companies.append({
                "company_id": cid,
                "name": name,
                "short_name": short_name,
                "category": category,
                "logo_url": logo_url,
            })

        _COMPANIES_CACHE = companies
        return companies
    except Exception as err:
        logger.error(f"Failed to fetch companies from Supabase: {err}")
        if _COMPANIES_CACHE:
            return _COMPANIES_CACHE
        raise RuntimeError(f"Could not load companies from Supabase: {err}") from err


def fetch_company_requirements(company_id_or_name: int | str) -> tuple[dict[str, Any], dict[str, int]]:
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
    if isinstance(company_id_or_name, int) or (isinstance(company_id_or_name, str) and company_id_or_name.isdigit()):
        cid = int(company_id_or_name)
        matched_company = next((c for c in companies if c["company_id"] == cid), None)
    elif isinstance(company_id_or_name, str):
        target = company_id_or_name.strip().lower()
        matched_company = next((c for c in companies if c["name"].lower() == target), None)
        if not matched_company:
            matched_company = next((c for c in companies if target in c["name"].lower()), None)

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
            raise ValueError(f"No skill requirements configured in Supabase for '{matched_company['name']}' (ID {cid}).")

        requirements = {}
        for row in rows:
            ssm = row.get("skill_set_master") or {}
            short_name = ssm.get("short_name")
            level = row.get("required_level")
            if short_name and level is not None:
                requirements[short_name] = int(level)

        if not requirements:
            raise ValueError(f"Empty skill requirements for '{matched_company['name']}' in Supabase.")

        _REQUIREMENTS_CACHE[cid] = requirements
        return matched_company, requirements

    except Exception as err:
        logger.error(f"Error fetching skill levels for company_id={cid}: {err}")
        raise RuntimeError(f"Database error fetching requirements for {matched_company['name']}: {err}") from err
