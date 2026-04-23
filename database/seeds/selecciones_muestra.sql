-- Muestra mínima — reemplazar con datos reales del ranking FIFA
INSERT INTO selecciones (nombre, codigo_fifa, confederacion, ranking_fifa, puntos_fifa) VALUES
  ('Argentina',  'ARG', 'CONMEBOL',  1, 1897.43),
  ('Francia',    'FRA', 'UEFA',       2, 1852.07),
  ('España',     'ESP', 'UEFA',       3, 1834.85),
  ('Inglaterra', 'ENG', 'UEFA',       4, 1802.55),
  ('Brasil',     'BRA', 'CONMEBOL',   5, 1782.09),
  ('Portugal',   'POR', 'UEFA',       6, 1764.20),
  ('Países Bajos','NED','UEFA',       7, 1760.44),
  ('Bélgica',    'BEL', 'UEFA',       8, 1752.10),
  ('Alemania',   'GER', 'UEFA',       9, 1745.88),
  ('Italia',     'ITA', 'UEFA',      10, 1740.23),
  ('México',     'MEX', 'CONCACAF',  15, 1696.50),
  ('Estados Unidos','USA','CONCACAF',16, 1685.30),
  ('Marruecos',  'MAR', 'CAF',       14, 1702.77),
  ('Japón',      'JPN', 'AFC',       18, 1665.20),
  ('Senegal',    'SEN', 'CAF',       20, 1648.99)
ON CONFLICT (codigo_fifa) DO NOTHING;
