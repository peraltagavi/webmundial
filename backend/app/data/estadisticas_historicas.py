"""
Estadísticas históricas de mundiales por selección.
Cargadas una vez al importar el módulo desde el xlsx.
"""

from pathlib import Path
import openpyxl

_XLSX = Path(__file__).resolve().parents[3] / "database" / "estadisticas_wc2026.xlsx"

# Nombres en inglés → código interno FIFA
_NAME_TO_CODE: dict[str, str] = {
    "Brazil":                   "BRA",
    "Germany":                  "DEU",
    "Argentina":                "ARG",
    "England":                  "ENG",
    "France":                   "FRA",
    "Spain":                    "ESP",
    "Mexico":                   "MEX",
    "Uruguay":                  "URY",
    "Netherlands":              "NLD",
    "Belgium":                  "BEL",
    "Sweden":                   "SWE",
    "Switzerland":              "CHE",
    "South Korea":              "KOR",
    "United States":            "USA",
    "Portugal":                 "PRT",
    "Croatia":                  "HRV",
    "Austria":                  "AUT",
    "Paraguay":                 "PRY",
    "Japan":                    "JPN",
    "Morocco":                  "MAR",
    "Scotland":                 "SCO",
    "Colombia":                 "COL",
    "Australia":                "AUS",
    "Saudi Arabia":             "KSA",
    "Iran":                     "IRN",
    "Tunisia":                  "TUN",
    "Ghana":                    "GHA",
    "Ecuador":                  "ECU",
    "Algeria":                  "ALG",
    "Senegal":                  "SEN",
    "Turkey":                   "TUR",
    "Ivory Coast":              "CIV",
    "South Africa":             "RSA",
    "Norway":                   "NOR",
    "Egypt":                    "EGY",
    "Canada":                   "CAN",
    "New Zealand":              "NZL",
    "Bosnia and Herzegovina":   "BIH",
    "Czech Republic":           "CZE",
    "Qatar":                    "QAT",
    "Iraq":                     "IRQ",
    "Haiti":                    "HTI",
    "Panama":                   "PAN",
    "Jordan":                   "JOR",
    "Uzbekistan":               "UZB",
    "Cape Verde":               "CPV",
    "DR Congo":                 "COD",
    "Curaçao":                  "CUW",
}


def _cargar() -> dict[str, dict]:
    wb = openpyxl.load_workbook(_XLSX)
    ws = wb.active
    result: dict[str, dict] = {}
    for row in ws.iter_rows(min_row=2, values_only=True):
        nombre, mundiales, pj, pg, pe, pp, gf, gc, dg = row
        code = _NAME_TO_CODE.get(str(nombre).strip())
        if not code:
            continue
        pj = int(pj or 0)
        pg = int(pg or 0)
        result[code] = {
            "mundiales":  int(mundiales or 0),
            "pj":         pj,
            "pg":         pg,
            "pe":         int(pe or 0),
            "pp":         int(pp or 0),
            "gf":         int(gf or 0),
            "gc":         int(gc or 0),
            "dg":         int(dg or 0),
            "porcentaje_victorias": round(pg / pj * 100, 1) if pj else 0.0,
        }
    return result


STATS: dict[str, dict] = _cargar()


def get_stats(codigo: str) -> dict | None:
    return STATS.get(codigo)
