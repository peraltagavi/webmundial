from typing import TypedDict


class EquipoMundial(TypedDict):
    nombre: str
    codigo: str
    grupo: str


EQUIPOS_MUNDIAL_2026: list[EquipoMundial] = [
    # Grupo A
    {"nombre": "México",               "codigo": "MEX", "grupo": "A"},
    {"nombre": "Sudáfrica",            "codigo": "RSA", "grupo": "A"},
    {"nombre": "República de Corea",   "codigo": "KOR", "grupo": "A"},
    {"nombre": "República Checa",      "codigo": "CZE", "grupo": "A"},
    # Grupo B
    {"nombre": "Canadá",               "codigo": "CAN", "grupo": "B"},
    {"nombre": "Bosnia y Herzegovina", "codigo": "BIH", "grupo": "B"},
    {"nombre": "Catar",                "codigo": "QAT", "grupo": "B"},
    {"nombre": "Suiza",                "codigo": "CHE", "grupo": "B"},
    # Grupo C
    {"nombre": "Brasil",               "codigo": "BRA", "grupo": "C"},
    {"nombre": "Marruecos",            "codigo": "MAR", "grupo": "C"},
    {"nombre": "Haití",                "codigo": "HTI", "grupo": "C"},
    {"nombre": "Escocia",              "codigo": "SCO", "grupo": "C"},
    # Grupo D
    {"nombre": "Estados Unidos",       "codigo": "USA", "grupo": "D"},
    {"nombre": "Paraguay",             "codigo": "PRY", "grupo": "D"},
    {"nombre": "Australia",            "codigo": "AUS", "grupo": "D"},
    {"nombre": "Turquía",              "codigo": "TUR", "grupo": "D"},
    # Grupo E
    {"nombre": "Alemania",             "codigo": "DEU", "grupo": "E"},
    {"nombre": "Curazao",              "codigo": "CUW", "grupo": "E"},
    {"nombre": "Costa de Marfil",      "codigo": "CIV", "grupo": "E"},
    {"nombre": "Ecuador",              "codigo": "ECU", "grupo": "E"},
    # Grupo F
    {"nombre": "Países Bajos",         "codigo": "NLD", "grupo": "F"},
    {"nombre": "Japón",                "codigo": "JPN", "grupo": "F"},
    {"nombre": "Suecia",               "codigo": "SWE", "grupo": "F"},
    {"nombre": "Túnez",                "codigo": "TUN", "grupo": "F"},
    # Grupo G
    {"nombre": "Bélgica",              "codigo": "BEL", "grupo": "G"},
    {"nombre": "Egipto",               "codigo": "EGY", "grupo": "G"},
    {"nombre": "Irán",                 "codigo": "IRN", "grupo": "G"},
    {"nombre": "Nueva Zelanda",        "codigo": "NZL", "grupo": "G"},
    # Grupo H
    {"nombre": "España",               "codigo": "ESP", "grupo": "H"},
    {"nombre": "Cabo Verde",           "codigo": "CPV", "grupo": "H"},
    {"nombre": "Arabia Saudí",         "codigo": "KSA", "grupo": "H"},
    {"nombre": "Uruguay",              "codigo": "URY", "grupo": "H"},
    # Grupo I
    {"nombre": "Francia",              "codigo": "FRA", "grupo": "I"},
    {"nombre": "Senegal",              "codigo": "SEN", "grupo": "I"},
    {"nombre": "Irak",                 "codigo": "IRQ", "grupo": "I"},
    {"nombre": "Noruega",              "codigo": "NOR", "grupo": "I"},
    # Grupo J
    {"nombre": "Argentina",            "codigo": "ARG", "grupo": "J"},
    {"nombre": "Argelia",              "codigo": "ALG", "grupo": "J"},
    {"nombre": "Austria",              "codigo": "AUT", "grupo": "J"},
    {"nombre": "Jordania",             "codigo": "JOR", "grupo": "J"},
    # Grupo K
    {"nombre": "Portugal",             "codigo": "PRT", "grupo": "K"},
    {"nombre": "RD de Congo",          "codigo": "COD", "grupo": "K"},
    {"nombre": "Uzbekistán",           "codigo": "UZB", "grupo": "K"},
    {"nombre": "Colombia",             "codigo": "COL", "grupo": "K"},
    # Grupo L
    {"nombre": "Inglaterra",           "codigo": "ENG", "grupo": "L"},
    {"nombre": "Croacia",              "codigo": "HRV", "grupo": "L"},
    {"nombre": "Ghana",                "codigo": "GHA", "grupo": "L"},
    {"nombre": "Panamá",               "codigo": "PAN", "grupo": "L"},
]

CODIGOS_2026: frozenset[str] = frozenset(e["codigo"] for e in EQUIPOS_MUNDIAL_2026)
GRUPOS_2026: dict[str, str] = {e["codigo"]: e["grupo"] for e in EQUIPOS_MUNDIAL_2026}
