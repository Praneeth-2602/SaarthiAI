from typing import Any


MOCK_POLICIES: dict[str, list[dict[str, Any]]] = {
    "ABCDE1234F": [
        {
            "source": "mock_bima_sugam",
            "insurerName": "LIC",
            "policyNumber": "LIC-77881234",
            "policyType": "term",
            "sumAssured": 1500000,
        },
        {
            "source": "mock_bima_sugam",
            "insurerName": "HDFC Life",
            "policyNumber": "HDFC-223344",
            "policyType": "group",
            "sumAssured": 500000,
        },
    ],
    "123412341234": [
        {
            "source": "mock_bima_sugam",
            "insurerName": "LIC",
            "policyNumber": "LIC-009988",
            "policyType": "life",
            "sumAssured": 800000,
        }
    ],
}


def _build_seed(aadhaar: str | None = None, pan: str | None = None) -> str | None:
    if pan:
        return pan.upper().strip()
    if aadhaar:
        return "".join(character for character in aadhaar if character.isdigit())
    return None


async def query_bima_sugam(
    aadhaar: str | None = None,
    pan: str | None = None,
) -> list[dict[str, Any]]:
    seed = _build_seed(aadhaar=aadhaar, pan=pan)
    if not seed:
        return []

    if seed in MOCK_POLICIES:
        return MOCK_POLICIES[seed]

    suffix = seed[-4:]
    return [
        {
            "source": "mock_bima_sugam",
            "insurerName": "LIC",
            "policyNumber": f"LIC-{suffix}",
            "policyType": "term",
            "sumAssured": 1000000,
        }
    ]
