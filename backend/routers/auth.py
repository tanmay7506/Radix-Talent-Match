from __future__ import annotations

from typing import Annotated
from uuid import uuid4

from argon2.exceptions import VerificationError, VerifyMismatchError
from fastapi import APIRouter, Depends, HTTPException, status

from auth import (
    PASSWORD_HASHER,
    AuthenticatedUser,
    LoginRequest,
    ProfileUpdate,
    RegisterRequest,
    TokenResponse,
    UserPublic,
    auth_rest_request,
    _public_user,
    create_access_token,
    get_current_user,
    normalize_email,
)

router = APIRouter(prefix="/auth", tags=["authentication"])
profiles_router = APIRouter(prefix="/profiles", tags=["profile"])

# A fixed valid Argon2id hash makes unknown-user logins perform a password check too.
_DUMMY_PASSWORD_HASH = PASSWORD_HASHER.hash("not-a-real-user-password")


def _issue_session(user: UserPublic) -> TokenResponse:
    access_token, access_expiry = create_access_token(user.id)
    return TokenResponse(user=user, access_token=access_token, expires_at=access_expiry)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def register(payload: RegisterRequest) -> TokenResponse:
    email = normalize_email(str(payload.email))
    user_id = uuid4()
    password = PASSWORD_HASHER.hash(payload.password)
    rows = auth_rest_request("POST", "users", params={"select": "id,name,email,education_id,hackathons,internships,certifications,preferred_roles,created_at,updated_at"}, json_body={"id": str(user_id), "name": payload.name, "email": email, "password": password}, prefer="return=representation")
    if not rows:
        raise HTTPException(status_code=503, detail="Authentication data service returned no user.")
    return _issue_session(_public_user(rows[0]))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    email = normalize_email(str(payload.email))
    rows = auth_rest_request("GET", "users", params={"select": "id,name,email,password,education_id,hackathons,internships,certifications,preferred_roles,created_at,updated_at", "email": f"eq.{email}", "limit": "1"})
    row = rows[0] if rows else None
    stored_hash = row.get("password") if row else None
    if not isinstance(stored_hash, str) or not stored_hash:
        stored_hash = _DUMMY_PASSWORD_HASH
        hash_is_usable = False
    else:
        hash_is_usable = True
    try:
        password_matches = PASSWORD_HASHER.verify(stored_hash, payload.password)
        valid_password = hash_is_usable and password_matches
    except (VerifyMismatchError, VerificationError):
        valid_password = False
    if not row or not valid_password:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    user = _public_user(row)
    return _issue_session(user)


@router.get("/me", response_model=UserPublic)
def me(user: Annotated[AuthenticatedUser, Depends(get_current_user)]) -> AuthenticatedUser:
    return user


@profiles_router.get("/me")
def get_profile(user: Annotated[AuthenticatedUser, Depends(get_current_user)]) -> dict[str, object]:
    users = auth_rest_request("GET", "users", params={"select": "id,name,email,skills,hackathons,internships,certifications,preferred_roles,education_id", "id": f"eq.{user.id}", "limit": "1"})
    if not users:
        raise HTTPException(status_code=404, detail="Profile not found.")
    row = users[0]
    education = None
    if row["education_id"] is not None:
        records = auth_rest_request("GET", "education", params={"select": "degree,college,graduation_year,cgpa", "id": f"eq.{row['education_id']}", "owner_id": f"eq.{user.id}", "limit": "1"})
        if records:
            education = {"degree": records[0]["degree"], "college": records[0]["college"], "graduation_year": records[0]["graduation_year"], "cgpa": records[0]["cgpa"]}
    return {"id": str(row["id"]), "name": row["name"], "email": row["email"], "skills": row.get("skills") or [], "hackathons": row["hackathons"], "internships": row["internships"], "certifications": row["certifications"], "preferred_roles": row["preferred_roles"], "education": education}


@profiles_router.put("/me")
def update_profile(payload: ProfileUpdate, user: Annotated[AuthenticatedUser, Depends(get_current_user)]) -> dict[str, object]:
    changes = payload.model_dump(exclude_unset=True)
    allowed_fields = {"name", "skills", "hackathons", "internships", "certifications", "preferred_roles"}
    user_changes = {field: changes[field] for field in allowed_fields if field in changes}
    if user_changes:
        auth_rest_request("PATCH", "users", params={"id": f"eq.{user.id}"}, json_body=user_changes, prefer="return=minimal")
    if "education" in changes:
        education = changes["education"]
        if not education:
            auth_rest_request("PATCH", "users", params={"id": f"eq.{user.id}"}, json_body={"education_id": None}, prefer="return=minimal")
        else:
            try:
                degree = str(education.get("degree", "")).strip()
                college = str(education.get("college", "")).strip()
                cgpa = float(education["cgpa"])
                year = str(education.get("graduation_year", education.get("graducation_year", "")))
                if not degree or not college or not year or not 1 < cgpa <= 10:
                    raise ValueError("Invalid education values")
            except (KeyError, TypeError, ValueError) as exc:
                raise HTTPException(status_code=422, detail="Education requires degree, college, graduation year, and CGPA.") from exc
            existing = auth_rest_request("GET", "users", params={"select": "education_id", "id": f"eq.{user.id}", "limit": "1"})
            edu_id = existing[0]["education_id"] if existing else None
            edu_payload = {"owner_id": str(user.id), "degree": degree, "college": college, "graduation_year": year, "cgpa": cgpa}
            if edu_id is None:
                saved = auth_rest_request("POST", "education", params={"select": "id"}, json_body=edu_payload, prefer="return=representation")
                if not saved:
                    raise HTTPException(status_code=503, detail="Authentication data service returned no education record.")
                auth_rest_request("PATCH", "users", params={"id": f"eq.{user.id}"}, json_body={"education_id": saved[0]["id"]}, prefer="return=minimal")
            else:
                auth_rest_request("PATCH", "education", params={"id": f"eq.{edu_id}", "owner_id": f"eq.{user.id}"}, json_body={key: value for key, value in edu_payload.items() if key != "owner_id"}, prefer="return=minimal")
    return get_profile(user)

