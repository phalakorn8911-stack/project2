-- ============================================================
-- เพิ่มยานพาหนะ 50 คัน (รวมเป็น 60 คัน)
-- รันใน Supabase SQL Editor หลัง seed.sql
-- ============================================================

-- ดึง vehicleTypeId แรกที่มีอยู่
DO $$
DECLARE
  vt_id UUID;
  u_id UUID;
BEGIN
  SELECT id INTO vt_id FROM "vehicle_types" LIMIT 1;
  SELECT id INTO u_id FROM "units" LIMIT 1;

  INSERT INTO "vehicles" ("registrationNumber", "fleetNumber", "brand", "model", "year", "unitId", "vehicleTypeId", "fuelType", "currentMileage", "status")
  VALUES
    ('พล-0049', 'M35-049', 'REO', 'M35 2½-ton', 2015, u_id, vt_id, 'Diesel', 55000, 'AVAILABLE'),
    ('พล-0050', 'M35-050', 'REO', 'M35 2½-ton', 2016, u_id, vt_id, 'Diesel', 42300, 'AVAILABLE'),
    ('พล-0051', 'M35-051', 'REO', 'M35 2½-ton', 2014, u_id, vt_id, 'Diesel', 98700, 'IN_REPAIR'),
    ('พล-0052', 'M35-052', 'REO', 'M35 2½-ton', 2017, u_id, vt_id, 'Diesel', 31200, 'AVAILABLE'),
    ('พล-0053', 'M35-053', 'REO', 'M35 2½-ton', 2013, u_id, vt_id, 'Diesel', 145000, 'OUT_OF_SERVICE'),
    ('พล-0054', 'FTS-054', 'Kia', 'FTS 2½-ton', 2019, u_id, vt_id, 'Diesel', 28900, 'AVAILABLE'),
    ('พล-0055', 'FTS-055', 'Kia', 'FTS 2½-ton', 2020, u_id, vt_id, 'Diesel', 15600, 'AVAILABLE'),
    ('พล-0056', 'FTS-056', 'Kia', 'FTS 2½-ton', 2018, u_id, vt_id, 'Diesel', 63400, 'DUE_SOON'),
    ('พล-0057', 'FTS-057', 'Kia', 'FTS 2½-ton', 2021, u_id, vt_id, 'Diesel', 8900, 'AVAILABLE'),
    ('พล-0058', 'FTS-058', 'Kia', 'FTS 2½-ton', 2019, u_id, vt_id, 'Diesel', 44100, 'WAITING_PARTS'),
    ('พล-0059', 'M50-059', 'Kaiser', 'M50 ต้นแบบ', 1968, u_id, vt_id, 'Diesel', 78200, 'AVAILABLE'),
    ('พล-0060', 'M50-060', 'Kaiser', 'M50 ต้นแบบ', 1969, u_id, vt_id, 'Diesel', 65400, 'AVAILABLE'),
    ('พล-0061', 'M50-061', 'Kaiser', 'M50 ต้นแบบ', 1968, u_id, vt_id, 'Diesel', 91300, 'OVERDUE'),
    ('พล-0062', 'M50-062', 'Kaiser', 'M50 ต้นแบบ', 1969, u_id, vt_id, 'Diesel', 53700, 'AVAILABLE'),
    ('พล-0063', 'M50-063', 'Kaiser', 'M50 ต้นแบบ', 1968, u_id, vt_id, 'Diesel', 87600, 'IN_REPAIR'),
    ('พล-0064', 'M50-064', 'Kaiser', 'M50 ต้นแบบ', 1969, u_id, vt_id, 'Diesel', 72100, 'AVAILABLE'),
    ('พล-0065', 'M50-065', 'Kaiser', 'M50 ต้นแบบ', 1968, u_id, vt_id, 'Diesel', 46800, 'DUE_SOON'),
    ('พล-0066', 'M50-066', 'Kaiser', 'M50 ต้นแบบ', 1969, u_id, vt_id, 'Diesel', 99400, 'AVAILABLE'),
    ('พล-0067', 'M50-067', 'Kaiser', 'M50 ต้นแบบ', 1968, u_id, vt_id, 'Diesel', 34500, 'AVAILABLE'),
    ('พล-0068', 'M50-068', 'Kaiser', 'M50 ต้นแบบ', 1969, u_id, vt_id, 'Diesel', 82900, 'WAITING_PARTS'),
    ('พล-0069', 'CHK-069', 'Chevrolet', 'Colorado 2.5Z 4x4', 2023, u_id, vt_id, 'Diesel', 5200, 'AVAILABLE'),
    ('พล-0070', 'CHK-070', 'Chevrolet', 'Colorado 2.5Z 4x4', 2022, u_id, vt_id, 'Diesel', 18400, 'AVAILABLE'),
    ('พล-0071', 'CHK-071', 'Chevrolet', 'Colorado 2.5Z 4x4', 2023, u_id, vt_id, 'Diesel', 3100, 'AVAILABLE'),
    ('พล-0072', 'CHK-072', 'Chevrolet', 'Colorado 2.5Z 4x4', 2022, u_id, vt_id, 'Diesel', 22700, 'DUE_SOON'),
    ('พล-0073', 'VAN-073', 'Toyota', 'Commuter', 2022, u_id, vt_id, 'Diesel', 14800, 'AVAILABLE'),
    ('พล-0074', 'VAN-074', 'Toyota', 'Commuter', 2021, u_id, vt_id, 'Diesel', 26300, 'AVAILABLE'),
    ('พล-0075', 'VAN-075', 'Toyota', 'Commuter', 2023, u_id, vt_id, 'Diesel', 7600, 'AVAILABLE'),
    ('พล-0076', 'AMB-076', 'Ford', 'M718 รถพยาบาล', 1972, u_id, vt_id, 'Diesel', 52100, 'AVAILABLE'),
    ('พล-0077', 'AMB-077', 'Ford', 'M718 รถพยาบาล', 1972, u_id, vt_id, 'Diesel', 48900, 'IN_REPAIR'),
    ('พล-0078', 'AMB-078', 'Ford', 'M718 รถพยาบาล', 1973, u_id, vt_id, 'Diesel', 39700, 'AVAILABLE'),
    ('พล-0079', 'HR-079', 'Toyota', 'Hilux Revo หลังคาทรงสูง', 2022, u_id, vt_id, 'Diesel', 16500, 'AVAILABLE'),
    ('พล-0080', 'HR-080', 'Toyota', 'Hilux Revo หลังคาทรงสูง', 2021, u_id, vt_id, 'Diesel', 33200, 'AVAILABLE'),
    ('พล-0081', 'HR-081', 'Toyota', 'Hilux Revo หลังคาทรงสูง', 2023, u_id, vt_id, 'Diesel', 4800, 'AVAILABLE'),
    ('พล-0082', 'BUS-082', 'Daewoo', 'รถบัส 12 เมตร', 2018, u_id, vt_id, 'Diesel', 112000, 'AVAILABLE'),
    ('พล-0083', 'BUS-083', 'Daewoo', 'รถบัส 12 เมตร', 2019, u_id, vt_id, 'Diesel', 87500, 'AVAILABLE'),
    ('พล-0084', 'BUS-084', 'Daewoo', 'รถบัส 12 เมตร', 2017, u_id, vt_id, 'Diesel', 156000, 'OUT_OF_SERVICE'),
    ('พล-0085', 'WT-085', 'Hino', 'รถบรรทุกน้ำ 6,000 ลิตร', 2021, u_id, vt_id, 'Diesel', 28400, 'AVAILABLE'),
    ('พล-0086', 'WT-086', 'Hino', 'รถบรรทุกน้ำ 6,000 ลิตร', 2020, u_id, vt_id, 'Diesel', 41200, 'AVAILABLE'),
    ('พล-0087', 'M51-087', 'Kaiser', 'M51 ปรับปรุง', 1971, u_id, vt_id, 'Diesel', 38900, 'AVAILABLE'),
    ('พล-0088', 'M51-088', 'Kaiser', 'M51 ปรับปรุง', 1971, u_id, vt_id, 'Diesel', 56200, 'IN_REPAIR'),
    ('พล-0089', 'M51-089', 'Kaiser', 'M51 ปรับปรุง', 1972, u_id, vt_id, 'Diesel', 29700, 'AVAILABLE'),
    ('พล-0090', 'M50R-090', 'Kaiser', 'M50 ปรับปรุง', 1969, u_id, vt_id, 'Diesel', 74300, 'AVAILABLE'),
    ('พล-0091', 'M50R-091', 'Kaiser', 'M50 ปรับปรุง', 1968, u_id, vt_id, 'Diesel', 89600, 'DUE_SOON'),
    ('พล-0092', 'M50R-092', 'Kaiser', 'M50 ปรับปรุง', 1969, u_id, vt_id, 'Diesel', 62800, 'AVAILABLE'),
    ('พล-0093', 'M35-093', 'REO', 'M35 2½-ton', 2016, u_id, vt_id, 'Diesel', 47600, 'AVAILABLE'),
    ('พล-0094', 'M35-094', 'REO', 'M35 2½-ton', 2015, u_id, vt_id, 'Diesel', 83200, 'WAITING_PARTS'),
    ('พล-0095', 'M35-095', 'REO', 'M35 2½-ton', 2017, u_id, vt_id, 'Diesel', 29800, 'AVAILABLE'),
    ('พล-0096', 'FTS-096', 'Kia', 'FTS 2½-ton', 2020, u_id, vt_id, 'Diesel', 36100, 'AVAILABLE'),
    ('พล-0097', 'FTS-097', 'Kia', 'FTS 2½-ton', 2021, u_id, vt_id, 'Diesel', 11400, 'AVAILABLE'),
    ('พล-0098', 'CHK-098', 'Chevrolet', 'Colorado 2.5Z 4x4', 2023, u_id, vt_id, 'Diesel', 8900, 'AVAILABLE'),
    ('พล-0099', 'M50-099', 'Kaiser', 'M50 ต้นแบบ', 1968, u_id, vt_id, 'Diesel', 104200, 'OVERDUE'),
    ('พล-0100', 'M50-100', 'Kaiser', 'M50 ต้นแบบ', 1969, u_id, vt_id, 'Diesel', 67500, 'AVAILABLE')
  ON CONFLICT ("registrationNumber") DO NOTHING;
END $$;
