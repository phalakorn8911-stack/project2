require('dotenv').config();
const {Client} = require('pg');
const crypto = require('crypto');

const VT_M35 = '69f04ad6-f084-432b-bf55-a40b5da03d12';
const VT_FTS = '1916036a-5529-41ed-a8f0-c0ea67af6c90';
const VT_M50 = '40000001-0000-4000-8000-000000000001';
const VT_M51 = 'fdbffefd-d48e-49d1-8e60-7f8c9d3d84b0';
const VT_M718 = '40000001-0000-4000-8000-000000000003';
const VT_CHK = '40000001-0000-4000-8000-000000000004';
const VT_VAN = 'cb6246b4-ca2a-4414-9b57-5d75b98de975';
const VT_BUS = '7ca22c03-b792-4245-a140-5e4ea3914f72';
const VT_WT = '85fb86e6-768c-4086-8d9b-b5bda251fd59';
const U = '10000001-0000-4000-8000-000000000001';

const vehicles = [
  ['พล-0049','M35-049','REO','M35 2½-ton',2015,VT_M35,U,'Diesel',55000,'AVAILABLE'],
  ['พล-0050','M35-050','REO','M35 2½-ton',2016,VT_M35,U,'Diesel',42300,'AVAILABLE'],
  ['พล-0051','M35-051','REO','M35 2½-ton',2014,VT_M35,U,'Diesel',98700,'IN_REPAIR'],
  ['พล-0052','M35-052','REO','M35 2½-ton',2017,VT_M35,U,'Diesel',31200,'AVAILABLE'],
  ['พล-0053','M35-053','REO','M35 2½-ton',2013,VT_M35,U,'Diesel',145000,'OUT_OF_SERVICE'],
  ['พล-0054','FTS-054','Kia','FTS 2½-ton',2019,VT_FTS,U,'Diesel',28900,'AVAILABLE'],
  ['พล-0055','FTS-055','Kia','FTS 2½-ton',2020,VT_FTS,U,'Diesel',15600,'AVAILABLE'],
  ['พล-0056','FTS-056','Kia','FTS 2½-ton',2018,VT_FTS,U,'Diesel',63400,'DUE_SOON'],
  ['พล-0057','FTS-057','Kia','FTS 2½-ton',2021,VT_FTS,U,'Diesel',8900,'AVAILABLE'],
  ['พล-0058','FTS-058','Kia','FTS 2½-ton',2019,VT_FTS,U,'Diesel',44100,'WAITING_PARTS'],
  ['พล-0059','M50-059','Kaiser','M50 ต้นแบบ',1968,VT_M50,U,'Diesel',78200,'AVAILABLE'],
  ['พล-0060','M50-060','Kaiser','M50 ต้นแบบ',1969,VT_M50,U,'Diesel',65400,'AVAILABLE'],
  ['พล-0061','M50-061','Kaiser','M50 ต้นแบบ',1968,VT_M50,U,'Diesel',91300,'OVERDUE'],
  ['พล-0062','M50-062','Kaiser','M50 ต้นแบบ',1969,VT_M50,U,'Diesel',53700,'AVAILABLE'],
  ['พล-0063','M50-063','Kaiser','M50 ต้นแบบ',1968,VT_M50,U,'Diesel',87600,'IN_REPAIR'],
  ['พล-0064','M50-064','Kaiser','M50 ต้นแบบ',1969,VT_M50,U,'Diesel',72100,'AVAILABLE'],
  ['พล-0065','M50-065','Kaiser','M50 ต้นแบบ',1968,VT_M50,U,'Diesel',46800,'DUE_SOON'],
  ['พล-0066','M50-066','Kaiser','M50 ต้นแบบ',1969,VT_M50,U,'Diesel',99400,'AVAILABLE'],
  ['พล-0067','M50-067','Kaiser','M50 ต้นแบบ',1968,VT_M50,U,'Diesel',34500,'AVAILABLE'],
  ['พล-0068','M50-068','Kaiser','M50 ต้นแบบ',1969,VT_M50,U,'Diesel',82900,'WAITING_PARTS'],
  ['พล-0069','CHK-069','Chevrolet','Colorado 2.5Z 4x4',2023,VT_CHK,U,'Diesel',5200,'AVAILABLE'],
  ['พล-0070','CHK-070','Chevrolet','Colorado 2.5Z 4x4',2022,VT_CHK,U,'Diesel',18400,'AVAILABLE'],
  ['พล-0071','CHK-071','Chevrolet','Colorado 2.5Z 4x4',2023,VT_CHK,U,'Diesel',3100,'AVAILABLE'],
  ['พล-0072','CHK-072','Chevrolet','Colorado 2.5Z 4x4',2022,VT_CHK,U,'Diesel',22700,'DUE_SOON'],
  ['พล-0073','VAN-073','Toyota','Commuter',2022,VT_VAN,U,'Diesel',14800,'AVAILABLE'],
  ['พล-0074','VAN-074','Toyota','Commuter',2021,VT_VAN,U,'Diesel',26300,'AVAILABLE'],
  ['พล-0075','VAN-075','Toyota','Commuter',2023,VT_VAN,U,'Diesel',7600,'AVAILABLE'],
  ['พล-0076','AMB-076','Ford','M718 รถพยาบาล',1972,VT_M718,U,'Diesel',52100,'AVAILABLE'],
  ['พล-0077','AMB-077','Ford','M718 รถพยาบาล',1972,VT_M718,U,'Diesel',48900,'IN_REPAIR'],
  ['พล-0078','AMB-078','Ford','M718 รถพยาบาล',1973,VT_M718,U,'Diesel',39700,'AVAILABLE'],
  ['พล-0079','HR-079','Toyota','Hilux Revo หลังคาทรงสูง',2022,VT_CHK,U,'Diesel',16500,'AVAILABLE'],
  ['พล-0080','HR-080','Toyota','Hilux Revo หลังคาทรงสูง',2021,VT_CHK,U,'Diesel',33200,'AVAILABLE'],
  ['พล-0081','HR-081','Toyota','Hilux Revo หลังคาทรงสูง',2023,VT_CHK,U,'Diesel',4800,'AVAILABLE'],
  ['พล-0082','BUS-082','Daewoo','รถบัส 12 เมตร',2018,VT_BUS,U,'Diesel',112000,'AVAILABLE'],
  ['พล-0083','BUS-083','Daewoo','รถบัส 12 เมตร',2019,VT_BUS,U,'Diesel',87500,'AVAILABLE'],
  ['พล-0084','BUS-084','Daewoo','รถบัส 12 เมตร',2017,VT_BUS,U,'Diesel',156000,'OUT_OF_SERVICE'],
  ['พล-0085','WT-085','Hino','รถบรรทุกน้ำ 6,000 ลิตร',2021,VT_WT,U,'Diesel',28400,'AVAILABLE'],
  ['พล-0086','WT-086','Hino','รถบรรทุกน้ำ 6,000 ลิตร',2020,VT_WT,U,'Diesel',41200,'AVAILABLE'],
  ['พล-0087','M51-087','Kaiser','M51 ปรับปรุง',1971,VT_M51,U,'Diesel',38900,'AVAILABLE'],
  ['พล-0088','M51-088','Kaiser','M51 ปรับปรุง',1971,VT_M51,U,'Diesel',56200,'IN_REPAIR'],
  ['พล-0089','M51-089','Kaiser','M51 ปรับปรุง',1972,VT_M51,U,'Diesel',29700,'AVAILABLE'],
  ['พล-0090','M50R-090','Kaiser','M50 ปรับปรุง',1969,VT_M50,U,'Diesel',74300,'AVAILABLE'],
  ['พล-0091','M50R-091','Kaiser','M50 ปรับปรุง',1968,VT_M50,U,'Diesel',89600,'DUE_SOON'],
  ['พล-0092','M50R-092','Kaiser','M50 ปรับปรุง',1969,VT_M50,U,'Diesel',62800,'AVAILABLE'],
  ['พล-0093','M35-093','REO','M35 2½-ton',2016,VT_M35,U,'Diesel',47600,'AVAILABLE'],
  ['พล-0094','M35-094','REO','M35 2½-ton',2015,VT_M35,U,'Diesel',83200,'WAITING_PARTS'],
  ['พล-0095','M35-095','REO','M35 2½-ton',2017,VT_M35,U,'Diesel',29800,'AVAILABLE'],
  ['พล-0096','FTS-096','Kia','FTS 2½-ton',2020,VT_FTS,U,'Diesel',36100,'AVAILABLE'],
  ['พล-0097','FTS-097','Kia','FTS 2½-ton',2021,VT_FTS,U,'Diesel',11400,'AVAILABLE'],
  ['พล-0098','CHK-098','Chevrolet','Colorado 2.5Z 4x4',2023,VT_CHK,U,'Diesel',8900,'AVAILABLE'],
  ['พล-0099','M50-099','Kaiser','M50 ต้นแบบ',1968,VT_M50,U,'Diesel',104200,'OVERDUE'],
  ['พล-0100','M50-100','Kaiser','M50 ต้นแบบ',1969,VT_M50,U,'Diesel',67500,'AVAILABLE'],
];

(async () => {
  const c = new Client({connectionString: process.env.DATABASE_URL, ssl:{rejectUnauthorized:false}});
  await c.connect();
  
  let ok = 0, fail = 0;
  for (const v of vehicles) {
    const id = crypto.randomUUID();
    try {
      await c.query(
        'INSERT INTO "vehicles" ("id","registrationNumber","fleetNumber","brand","model","year","vehicleTypeId","unitId","fuelType","currentMileage","status","engineHours") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
        [id, ...v, 0]
      );
      ok++;
    } catch (e) {
      fail++;
      if (fail <= 5) console.log('FAIL:', v[0], e.code, e.message.substring(0, 80));
    }
  }
  
  const count = await c.query('SELECT COUNT(*)::int as cnt FROM vehicles');
  console.log(`Done: ${ok} added, ${fail} failed. Total: ${count.rows[0].cnt}`);
  await c.end();
})();
