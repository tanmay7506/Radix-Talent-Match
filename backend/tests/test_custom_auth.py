import unittest
from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from uuid import uuid4

from argon2 import PasswordHasher
from fastapi import HTTPException, Response
from fastapi.security import HTTPAuthorizationCredentials

from routers import auth as auth_router
from functions.talent_check import supabase_client
from functions.talent_check.supabase_client import LoginRequest, RegisterRequest


class CustomAuthTests(unittest.TestCase):
    def test_postgrest_error_logs_diagnostics_without_exposing_values(self):
        response = SimpleNamespace(
            status_code=400,
            json=lambda: {
                "code": "42703",
                "message": "column users.password does not exist",
                "details": "Key (email)=(private@example.com) already exists",
                "hint": None,
            },
        )
        response.content = b"error"

        with (
            patch.object(supabase_client, "_auth_supabase_config", return_value=("https://example.test", "secret-key")),
            patch.object(supabase_client.requests, "request", return_value=response),
            self.assertLogs("functions.talent_check.supabase_client", level="ERROR") as captured,
        ):
            with self.assertRaises(HTTPException) as raised:
                supabase_client.auth_rest_request("POST", "users", json_body={"password": "never-log"})

        self.assertEqual(raised.exception.status_code, 503)
        logged = "\n".join(captured.output)
        self.assertIn("42703", logged)
        self.assertIn("column users.password does not exist", logged)
        self.assertNotIn("private@example.com", logged)
        self.assertNotIn("never-log", logged)

    def test_registration_stores_argon2id_hash_in_password_and_issues_session(self):
        user_id = uuid4()
        inserted_rows = [{"id": str(user_id), "name": "Test User", "email": "test@example.com"}]
        response = Response()

        with (
            patch.object(auth_router, "auth_rest_request", return_value=inserted_rows) as rest_request,
            patch.object(auth_router, "_issue_session", return_value="issued") as issue_session,
        ):
            result = auth_router.register(
                RegisterRequest(name="Test User", email="test@example.com", password="a-long-test-password"),
                response,
            )

        self.assertEqual(result, "issued")
        insert = rest_request.call_args.kwargs["json_body"]
        self.assertTrue(insert["password"].startswith("$argon2id$"))
        self.assertTrue(PasswordHasher().verify(insert["password"], "a-long-test-password"))
        issue_session.assert_called_once()

    def test_login_rejects_profile_without_a_password(self):
        with (
            patch.object(auth_router, "auth_rest_request", return_value=[{
                "id": str(uuid4()), "name": "Legacy Profile", "email": "legacy@example.com", "password": None,
            }]),
            patch.object(auth_router, "PASSWORD_HASHER", MagicMock(verify=MagicMock(return_value=True))) as hasher,
        ):
            with self.assertRaises(HTTPException) as raised:
                auth_router.login(LoginRequest(email="legacy@example.com", password="some-password"), Response())

        self.assertEqual(raised.exception.status_code, 401)
        hasher.verify.assert_called_once()

    def test_login_verifies_users_password_and_issues_session(self):
        password = "a-long-test-password"
        stored_password = PasswordHasher().hash(password)
        row = {
            "id": str(uuid4()), "name": "Test User", "email": "test@example.com", "password": stored_password,
        }
        with (
            patch.object(auth_router, "auth_rest_request", return_value=[row]) as rest_request,
            patch.object(auth_router, "_issue_session", return_value="issued") as issue_session,
        ):
            result = auth_router.login(LoginRequest(email="test@example.com", password=password), Response())

        self.assertEqual(result, "issued")
        self.assertIn("password", rest_request.call_args.kwargs["params"]["select"])
        issue_session.assert_called_once()

    def test_current_user_uses_custom_jwt_subject_for_user_lookup(self):
        user_id = uuid4()
        row = {"id": str(user_id), "name": "Test User", "email": "test@example.com"}
        token, _ = supabase_client.create_access_token(user_id)
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        with patch.object(supabase_client, "auth_rest_request", return_value=[row]) as rest_request:
            current_user = supabase_client.get_current_user(credentials)

        self.assertEqual(current_user.id, user_id)
        self.assertEqual(rest_request.call_args.kwargs["params"]["id"], f"eq.{user_id}")

    def test_profile_education_lookup_is_scoped_to_authenticated_owner(self):
        user_id = uuid4()
        user = auth_router.AuthenticatedUser(id=user_id, name="Test User", email="test@example.com")
        rows = [
            [{"id": str(user_id), "name": "Test User", "email": "test@example.com", "education_id": 7,
              "hackathons": [], "internships": [], "certifications": [], "preferred_roles": []}],
            [{"degree": "BSc", "college": "Test College", "graduation_year": "2025", "cgpa": 8.2}],
        ]

        with patch.object(auth_router, "auth_rest_request", side_effect=rows) as rest_request:
            profile = auth_router.get_profile(user)

        self.assertEqual(profile["education"]["college"], "Test College")
        self.assertEqual(rest_request.call_args_list[1].kwargs["params"]["owner_id"], f"eq.{user_id}")


if __name__ == "__main__":
    unittest.main()
