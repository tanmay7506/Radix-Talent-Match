import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app

class ChatRouterTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_empty_message_returns_400(self):
        response = self.client.post("/api/chat", json={"message": "   "})
        self.assertEqual(response.status_code, 400)

    @patch("routers.chat.model_genai")
    def test_chat_query_calls_llm_and_returns_reply(self, mock_genai):
        mock_response = MagicMock()
        mock_response.content = "RADIX evaluates candidates across 12 canonical technical skill categories."
        mock_genai.invoke.return_value = mock_response

        response = self.client.post("/api/chat", json={
            "message": "How does skill evaluation work in RADIX?",
            "history": [
                {"role": "user", "text": "Hi"},
                {"role": "assistant", "text": "Hello! How can I help?"}
            ]
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["reply"], "RADIX evaluates candidates across 12 canonical technical skill categories.")
        mock_genai.invoke.assert_called_once()

    @patch("routers.chat.model_genai")
    @patch("routers.chat.model")
    def test_chat_query_falls_back_to_openrouter_when_gemini_fails(self, mock_model, mock_genai):
        mock_genai.invoke.side_effect = RuntimeError("Gemini 503 unavailable")
        mock_response = MagicMock()
        mock_response.content = "OpenRouter fallback response: Roadmaps provide targeted paths."
        mock_model.invoke.return_value = mock_response

        response = self.client.post("/api/chat", json={
            "message": "Tell me about learning roadmaps."
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["reply"], "OpenRouter fallback response: Roadmaps provide targeted paths.")

    @patch("routers.chat.model_genai")
    @patch("routers.chat.model")
    def test_chat_query_contextual_fallback_when_all_llms_fail(self, mock_model, mock_genai):
        mock_genai.invoke.side_effect = RuntimeError("Network error")
        mock_model.invoke.side_effect = RuntimeError("Network error")

        response = self.client.post("/api/chat", json={
            "message": "What is an unassessed skill?"
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("Unassessed skills are requirements explicitly listed in the target Job Description", data["reply"])

if __name__ == "__main__":
    unittest.main()
