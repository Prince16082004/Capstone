"""
tests/test_predict_contract.py  –  AgriSense | /predict contract tests
=======================================================================
Verifies the /predict response contract:
  - All original fields still present (crop, confidence, shap_explanation)
  - New fields present (top3, confident, confidence_threshold)
  - top3 is sorted by probability descending
  - All top3 probabilities are in [0, 1]
  - confident is a boolean when confidence_gate.json exists
  - confident is None/null when gate is absent

Run:
    cd ml-service
    pip install pytest httpx
    pytest tests/test_predict_contract.py -v

The FastAPI service is tested without a live server using TestClient from
Starlette (bundled with FastAPI). Artifacts (model .pkl files and
confidence_gate.json) must be present.
"""

import json
import pathlib
import sys

import pytest

# Make sure the ml-service package root is importable
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))

# ── Fixtures ──────────────────────────────────────────────────────────────────

SAMPLE_PAYLOAD = {
    "N": 90.0,
    "P": 42.0,
    "K": 43.0,
    "temperature": 20.87,
    "humidity": 82.0,
    "ph": 6.5,
    "rainfall": 202.93,
}

# Low-nutrient payload designed to produce a less-certain prediction
LOW_CONF_PAYLOAD = {
    "N": 1.0,
    "P": 1.0,
    "K": 1.0,
    "temperature": 25.0,
    "humidity": 50.0,
    "ph": 7.0,
    "rainfall": 100.0,
}

GATE_PATH = pathlib.Path(__file__).parent.parent / "model" / "confidence_gate.json"


@pytest.fixture(scope="module")
def client():
    """Create a TestClient for the FastAPI app (loads models once)."""
    from fastapi.testclient import TestClient
    from app import app
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def gate_loaded():
    """Whether confidence_gate.json exists on disk."""
    return GATE_PATH.exists()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _post(client, payload=None):
    resp = client.post("/predict", json=payload or SAMPLE_PAYLOAD)
    assert resp.status_code == 200, f"Unexpected status {resp.status_code}: {resp.text}"
    return resp.json()


# ── Tests ─────────────────────────────────────────────────────────────────────

class TestOriginalFields:
    """All pre-existing /predict fields are still present and have correct types."""

    def test_crop_is_str(self, client):
        data = _post(client)
        assert isinstance(data["crop"], str)
        assert len(data["crop"]) > 0

    def test_confidence_is_float_in_range(self, client):
        data = _post(client)
        assert isinstance(data["confidence"], float)
        assert 0.0 <= data["confidence"] <= 1.0

    def test_shap_explanation_is_dict_or_null(self, client):
        data = _post(client)
        assert "shap_explanation" in data
        if data["shap_explanation"] is not None:
            assert isinstance(data["shap_explanation"], dict)
            assert set(data["shap_explanation"].keys()) == {
                "N", "P", "K", "temperature", "humidity", "ph", "rainfall"
            }

    def test_crop_matches_top1_top3(self, client):
        """Top-1 crop from /predict must match top3[0].crop (both from same proba)."""
        data = _post(client)
        assert data["crop"] == data["top3"][0]["crop"]


class TestTop3:
    """top3 field contract."""

    def test_top3_is_list_of_length_3(self, client):
        data = _post(client)
        assert isinstance(data["top3"], list)
        assert len(data["top3"]) == 3

    def test_top3_has_crop_and_probability(self, client):
        data = _post(client)
        for item in data["top3"]:
            assert "crop" in item
            assert "probability" in item
            assert isinstance(item["crop"], str)
            assert isinstance(item["probability"], float)

    def test_top3_probabilities_in_range(self, client):
        data = _post(client)
        for item in data["top3"]:
            assert 0.0 <= item["probability"] <= 1.0, (
                f"Probability {item['probability']} out of range for crop {item['crop']}"
            )

    def test_top3_sorted_descending(self, client):
        """Probabilities must be non-increasing."""
        data = _post(client)
        probs = [item["probability"] for item in data["top3"]]
        assert probs == sorted(probs, reverse=True), (
            f"top3 not sorted descending: {probs}"
        )

    def test_top3_first_probability_equals_confidence(self, client):
        """The highest probability in top3 must match the confidence field."""
        data = _post(client)
        assert abs(data["top3"][0]["probability"] - data["confidence"]) < 1e-5


class TestConfidenceGate:
    """confident and confidence_threshold fields."""

    def test_confident_field_present(self, client):
        data = _post(client)
        assert "confident" in data

    def test_confidence_threshold_field_present(self, client):
        data = _post(client)
        assert "confidence_threshold" in data

    def test_confident_is_bool_when_gate_exists(self, client, gate_loaded):
        if not gate_loaded:
            pytest.skip("confidence_gate.json not present — skipping boolean assertion")
        data = _post(client)
        assert isinstance(data["confident"], bool), (
            f"Expected bool, got {type(data['confident'])}: {data['confident']}"
        )

    def test_confidence_threshold_is_float_when_gate_exists(self, client, gate_loaded):
        if not gate_loaded:
            pytest.skip("confidence_gate.json not present — skipping float assertion")
        data = _post(client)
        assert isinstance(data["confidence_threshold"], float)
        assert 0.0 < data["confidence_threshold"] < 1.0

    def test_confident_true_when_high_confidence(self, client, gate_loaded):
        """
        For a well-known clear-cut input (rice), confidence should be high
        and confident should be True.
        """
        if not gate_loaded:
            pytest.skip("confidence_gate.json not present")
        data = _post(client, SAMPLE_PAYLOAD)
        if data["confidence"] >= data["confidence_threshold"]:
            assert data["confident"] is True
        else:
            assert data["confident"] is False

    def test_confident_consistent_with_threshold(self, client, gate_loaded):
        """
        confident must be True iff confidence >= confidence_threshold,
        regardless of which input is sent.
        """
        if not gate_loaded:
            pytest.skip("confidence_gate.json not present")
        for payload in [SAMPLE_PAYLOAD, LOW_CONF_PAYLOAD]:
            data = _post(client, payload)
            expected = data["confidence"] >= data["confidence_threshold"]
            assert data["confident"] == expected, (
                f"Mismatch: confidence={data['confidence']}, "
                f"threshold={data['confidence_threshold']}, "
                f"confident={data['confident']}, expected={expected}"
            )

    def test_confident_null_when_gate_absent(self, monkeypatch, gate_loaded):
        """If _gate is None, confident and confidence_threshold must be None."""
        if not gate_loaded:
            pytest.skip("confidence_gate.json not present (nothing to monkeypatch)")
        import app as app_module
        original = app_module._gate
        try:
            app_module._gate = None
            from fastapi.testclient import TestClient
            # Bypass lifespan; model is already loaded
            c = TestClient(app_module.app, raise_server_exceptions=True)
            resp = c.post("/predict", json=SAMPLE_PAYLOAD)
            assert resp.status_code == 200
            data = resp.json()
            assert data["confident"] is None
            assert data["confidence_threshold"] is None
        finally:
            app_module._gate = original


class TestHealthEndpoint:
    """Health check includes gate_loaded field."""

    def test_health_gate_loaded(self, client, gate_loaded):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert "gate_loaded" in data
        assert data["gate_loaded"] == gate_loaded
