INSERT INTO t_p3626951_support_pro_2_naviga.users (name, login, email, password_hash, role, status)
SELECT 'Александр Иванов', 'admin', 'admin@company.ru', 'admin123', 'admin', 'offline'
WHERE NOT EXISTS (SELECT 1 FROM t_p3626951_support_pro_2_naviga.users WHERE login = 'admin');

INSERT INTO t_p3626951_support_pro_2_naviga.users (name, login, email, password_hash, role, status)
SELECT 'Мария Петрова', 'okk', 'okk@company.ru', 'okk123', 'okk', 'offline'
WHERE NOT EXISTS (SELECT 1 FROM t_p3626951_support_pro_2_naviga.users WHERE login = 'okk');

INSERT INTO t_p3626951_support_pro_2_naviga.users (name, login, email, password_hash, role, status)
SELECT 'Сергей Козлов', 'operator', 'operator@company.ru', 'op123', 'operator', 'offline'
WHERE NOT EXISTS (SELECT 1 FROM t_p3626951_support_pro_2_naviga.users WHERE login = 'operator');