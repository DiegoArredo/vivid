import requests

def geocode_address(address: str):
    """
    Geocodifica una dirección textual con Nominatim (OSM).
    Retorna (lat, lng) como floats, o (None, None) si no hay resultado.
    """
    if not address:
        return None, None

    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": address, "format": "json", "limit": 1},
            headers={
                # Se recomienda un User-Agent identificable
                "User-Agent": "Vivid/1.0 (contacto@ejemplo.com)",
                "Accept-Language": "es"
            },
            timeout=10
        )
        resp.raise_for_status()
        data = resp.json()
        if data:
            lat = float(data[0]["lat"])
            lng = float(data[0]["lon"])
            return lat, lng
    except Exception:
        pass

    return None, None
