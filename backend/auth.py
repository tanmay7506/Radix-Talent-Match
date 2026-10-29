"""Compatibility exports for the authentication service implementation."""

from functions.talent_check.supabase_client import (
    PASSWORD_HASHER,
    REFRESH_TOKEN_DAYS,
    AuthenticatedUser,
    LoginRequest,
    ProfileUpdate,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserPublic,
    _hash_refresh_token,
    _new_refresh_token,
    _public_user,
    clear_refresh_cookie,
    create_access_token,
    auth_rest_request,
    get_current_user,
    get_refresh_token,
    normalize_email,
    set_refresh_cookie,
)
