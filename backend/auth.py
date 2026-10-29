"""Compatibility exports for the authentication service implementation."""

from functions.talent_check.supabase_client import (
    PASSWORD_HASHER,
    AuthenticatedUser,
    LoginRequest,
    ProfileUpdate,
    RegisterRequest,
    TokenResponse,
    UserPublic,
    _public_user,
    create_access_token,
    auth_rest_request,
    get_current_user,
    normalize_email,
)
