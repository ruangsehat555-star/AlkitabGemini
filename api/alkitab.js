const BOOK_ABBR = {
  "kejadian": "Kej", "keluaran": "Kel", "imamat": "Im", "bilangan": "Bil", "ulangan": "Ul",
  "yosua": "Yos", "hakim-hakim": "Hak", "rut": "Rut", "1 samuel": "1Sam", "2 samuel": "2Sam",
  "1 raja-raja": "1Raj", "2 raja-raja": "2Raj", "1 tawarikh": "1Taw", "2 tawarikh": "2Taw",
  "ezra": "Ezr", "nehemia": "Neh", "ester": "Est", "ayub": "Ayb", "mazmur": "Mzm",
  "amsal": "Ams", "pengkhotbah": "Pkh", "kidung agung": "Kid", "yesaya": "Yes", "yeremia": "Yer",
  "ratapan": "Rat", "yehezkiel": "Yeh", "daniel": "Dan", "hosea": "Hos", "yoel": "Yl",
  "amos": "Am", "obaja": "Ob", "yunus": "Yun", "mikha": "Mi", "nahum": "Nah",
  "habakuk": "Hab", "zefanya": "Zef", "hagai": "Hag", "zakharia": "Za", "maleakhi": "Mal",
  "matius": "Mat", "markus": "Mrk", "lukas": "Luk", "yohanes": "Yoh", "kisah para rasul": "Kis",
  "roma": "Rm", "1 korintus": "1Kor", "2 korintus": "2Kor", "galatia": "Gal", "efesus": "Ef",
  "filipi": "Flp", "kolose": "Kol", "1 tesalonika": "1Tes", "2 tesalonika": "2Tes",
  "1 timotius": "1Tim", "2 timotius": "2Tim", "titus": "Tit", "filemon": "Flm", "ibrani": "Ibr",
  "yakobus": "Yak", "1 petrus": "1Ptr", "2 petrus": "2Ptr", "1 yohanes": "1Yoh",
  "2 yohanes": "2Yoh", "3 yohanes": "3Yoh", "yudas": "Yud", "wahyu": "Why"
};

export default async function handler(req, res) {
  const apiKey = process.env.ALKITAB_API_KEY || process.env.API_INDONESIA_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Environment variable ALKITAB_API_KEY belum diatur di Vercel."
    });
  }

  const kitabRaw = String((req.query && req.query.kitab) || "Yohanes").trim();
  const pasal = String((req.query && req.query.pasal) || "3").trim();
  const abbr = BOOK_ABBR[kitabRaw.toLowerCase()] || kitabRaw;
  const baseUrl = (process.env.ALKITAB_API_URL || "https://use.apiindonesia.id/api/v1/alkitab").replace(/\/+$/, "");

  const candidates = [
    `${baseUrl}/verse/${encodeURIComponent(abbr)}/${encodeURIComponent(pasal)}`,
    `${baseUrl}/chapter/${encodeURIComponent(abbr)}/${encodeURIComponent(pasal)}`,
    `${baseUrl}/passage?book=${encodeURIComponent(abbr)}&chapter=${encodeURIComponent(pasal)}`
  ];

  let lastStatus = 502;
  let lastDetail = "";

  for (const targetUrl of candidates) {
    try {
      const upstream = await fetch(targetUrl, {
        headers: {
          "Accept": "application/json",
          "x-api-key": apiKey
        }
      });
      if (!upstream.ok) {
        lastStatus = upstream.status;
        lastDetail = await upstream.text();
        continue;
      }
      const data = await upstream.json();
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.status(200).json(data);
    } catch (err) {
      lastDetail = err && err.message ? err.message : "Network error";
    }
  }

  return res.status(lastStatus).json({
    error: `API Alkitab gagal merespons (HTTP ${lastStatus})${lastDetail ? ": " + lastDetail.slice(0, 140) : ""}`
  });
}
