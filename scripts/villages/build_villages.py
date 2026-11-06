"""Build one clean list of Egyptian villages (Arabic) with markaz + governorate.

Sources (all open):
  - Wikidata items with P31 = Q125366925 ("village in Egypt") plus Egyptian
    human settlements / villages (Q486972, Q532): Arabic label, markaz from P131.
  - GeoNames EG dump (populated places) + its Arabic alternate names, with coordinates.
  - OpenStreetMap (Overpass): place=village/hamlet/town/city with an Arabic name.
  - COD-AB Egypt admin boundaries (CAPMAS, via fieldmaps.io): Arabic markaz /
    governorate names and polygons, used to place every point (point in polygon).

Output: villages.json (list of dicts).
"""
import csv, json, re, sqlite3, struct, collections, math
from shapely import wkb
from shapely.geometry import Point
from shapely.strtree import STRtree

AR = re.compile('[\u0600-\u06FF]')
LATIN = re.compile('[A-Za-z]')
TASHKEEL = re.compile('[\u064B-\u0652\u0670\u0640\u200e\u200f\u202a-\u202e]')


def norm(s: str) -> str:
    s = TASHKEEL.sub('', s or '')
    s = re.sub('[\u0622\u0623\u0625\u0671]', '\u0627', s)
    s = s.replace('\u0629', '\u0647').replace('\u0649', '\u064a')
    s = s.replace('\u0624', '\u0648').replace('\u0626', '\u064a')
    s = re.sub(r'[^\u0600-\u06FF0-9 ]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def clean_name(s: str) -> str | None:
    if not s:
        return None
    s = TASHKEEL.sub('', s)
    s = re.sub(r'\(.*?\)', '', s)
    s = s.split('،')[0].split(',')[0]
    s = re.sub(r'^\s*(قرية|قريه|ناحية|مدينة|مدينه)\s+', '', s)
    s = re.sub(r'\s+', ' ', s).strip(' -_.')
    if not s or LATIN.search(s) or not AR.search(s) or len(s) < 2 or len(s) > 60:
        return None
    if re.match(r'^(أحياء|احياء|حي|قرى|فندق|منتجع|كمبوند|كومباوند|مجمع|قرية سياحية|منطقة)\s', s) or re.search(r'(فندق|منتجع|ريزورت|كمبوند)', s):
        return None
    return s


def unit_key(name: str) -> str:
    """markaz / governorate name without its prefix, normalized."""
    n = norm(name)
    n = re.sub(r'^(محافظه|مركز|قسم|مدينه|حي)\s+', '', n)
    n = n.replace('اول ', '').replace('ثان ', '').replace('ثاني ', '')
    return n


GOV_DISPLAY = {'مدينة الأقصر': 'الأقصر', 'بنى سويف': 'بني سويف', 'الوادى الجديد': 'الوادي الجديد',
               'الاسكندرية': 'الإسكندرية'}

# ── admin polygons ───────────────────────────────────────────────────────────

def gpkg_geom(blob):
    flags = blob[3]
    env = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}[(flags >> 1) & 7]
    return wkb.loads(bytes(blob[8 + env:]))


db = sqlite3.connect('egy.gpkg')
ADM = []
for geom, a2, a1, p2 in db.execute('select geom, ADM2_AR, ADM1_AR, ADM2_PCODE from egy_adm2'):
    ADM.append({'geom': gpkg_geom(geom), 'markaz': a2.strip(), 'gov': GOV_DISPLAY.get(a1.strip(), a1.strip()), 'pcode': p2})
TREE = STRtree([a['geom'] for a in ADM])
# (gov key, markaz key) -> adm row; markaz names repeat (قسم + مركز ميت غمر), prefer مركز
BY_NAME = {}
for a in ADM:
    k = (unit_key(a['gov']), unit_key(a['markaz']))
    if k not in BY_NAME or a['markaz'].startswith('مركز'):
        BY_NAME[k] = a
GOVS = {unit_key(a['gov']): a['gov'] for a in ADM}


def locate(lat, lng):
    p = Point(lng, lat)
    for i in TREE.query(p, predicate='intersects'):
        return ADM[int(i)]
    i = TREE.nearest(p)
    a = ADM[int(i)]
    if a['geom'].distance(p) < 0.03:  # ~3 km, coast / border slivers
        return a
    return None


records = []  # name, markaz, gov, lat, lng, kind, src ids

# ── Wikidata ─────────────────────────────────────────────────────────────────
W = json.load(open('wd_all.json'))
WA = W['adm']


def mk_key(name: str) -> str:
    return unit_key(re.sub(r'\(.*?\)', '', name or '')).replace(' ', '')


def mk_match(a: str, b: str) -> bool:
    a, b = mk_key(a), mk_key(b)
    if not a or not b:
        return False
    if a == b or a.startswith(b) or b.startswith(a):
        return True
    import difflib
    return difflib.SequenceMatcher(None, a, b).ratio() >= 0.8


def wd_place(adm_ids):
    for a in adm_ids:
        ent = WA.get(a)
        if not ent:
            continue
        lab = re.sub(r'\s*\(.*?\)', '', ent['labels'].get('ar', '')).strip()
        if norm(lab).startswith('محافظه') and unit_key(lab) in GOVS:
            return '', GOVS[unit_key(lab)]
        govs = [WA.get(p, {}).get('labels', {}).get('ar', '') for p in ent['p131']]
        for g in govs:
            gk = unit_key(g)
            if gk not in GOVS:
                continue
            for (gk2, _), v in BY_NAME.items():
                if gk2 == gk and v['markaz'].startswith(('مركز', 'قسم')) and mk_match(v['markaz'], lab):
                    return v['markaz'], v['gov']
            # a markaz newer than the CAPMAS boundaries: keep Wikidata's own name
            m = lab if lab.startswith(('مركز', 'قسم')) else 'مركز ' + lab
            return m, GOVS[gk]
        # adm is a town inside a markaz (أخميم -> مركز أخميم)
        for p in ent['p131']:
            pl = WA.get(p, {}).get('labels', {}).get('ar', '')
            cands = {v['markaz']: v for v in BY_NAME.values() if v['markaz'].startswith('مركز') and mk_key(v['markaz']) == mk_key(pl)}
            if len(cands) == 1:
                v = next(iter(cands.values()))
                return v['markaz'], v['gov']
    return None


wd_unplaced = 0
for q, r in W['rows'].items():
    name = clean_name(r['ar'])
    if not name:
        continue
    lat = lng = None
    m = re.match(r'Point\(([-\d.]+) ([-\d.]+)\)', r['coord'] or '')
    if m:
        lng, lat = float(m.group(1)), float(m.group(2))
    place = None
    if lat is not None:
        a = locate(lat, lng)
        if a:
            place = (a['markaz'], a['gov'])
    if not place:
        place = wd_place(r['adm'])
    if not place:
        wd_unplaced += 1
        continue
    kind = 'village'
    records.append(dict(name=name, markaz=place[0], gov=place[1], lat=lat, lng=lng, kind=kind,
                        src='wikidata', ref=q, official='Q125366925' in r['types']))

# ── GeoNames ─────────────────────────────────────────────────────────────────
alt = collections.defaultdict(list)
for r in csv.reader(open('alt/EG.txt'), delimiter='\t', quoting=csv.QUOTE_NONE):
    if r[2] == 'ar':
        alt[r[1]].append((r[4] == '1', r[3]))

KEEP = {'PPL', 'PPLA', 'PPLA2', 'PPLC', 'PPLF', 'PPLL'}
for r in csv.reader(open('EG.txt'), delimiter='\t', quoting=csv.QUOTE_NONE):
    if r[6] != 'P' or r[7] not in KEEP:
        continue
    cands = [n for pref, n in sorted(alt.get(r[0], []), key=lambda x: not x[0])]
    if not cands:
        cands = [n for n in r[3].split(',') if AR.search(n)]
    cands = [c for c in (clean_name(n) for n in cands) if c and not re.match(r'^(حي|قسم|مركز)\s', c)]
    if not cands:
        continue
    lat, lng = float(r[4]), float(r[5])
    a = locate(lat, lng)
    if not a:
        continue
    pop = int(r[14] or 0)
    kind = 'city' if r[7] in ('PPLA', 'PPLA2', 'PPLC') or pop > 50000 else 'village'
    records.append(dict(name=cands[0], markaz=a['markaz'], gov=a['gov'], lat=lat, lng=lng, kind=kind,
                        src='geonames', ref=r[0], official=False))

# ── OpenStreetMap ────────────────────────────────────────────────────────────
for e in json.load(open('overpass.json'))['elements']:
    t = e['tags']
    name = clean_name(t.get('name:ar') or (t.get('name') if AR.search(t.get('name', '')) else ''))
    if not name:
        continue
    lat = e.get('lat', e.get('center', {}).get('lat'))
    lng = e.get('lon', e.get('center', {}).get('lon'))
    if lat is None:
        continue
    a = locate(lat, lng)
    if not a:
        continue
    kind = {'village': 'village', 'hamlet': 'hamlet', 'town': 'city', 'city': 'city'}[t['place']]
    records.append(dict(name=name, markaz=a['markaz'], gov=a['gov'], lat=lat, lng=lng, kind=kind,
                        src='osm', ref=f"{e['type']}/{e['id']}", official=False))

# ── merge ────────────────────────────────────────────────────────────────────
# One village can come from three sources with slightly different markaz (CAPMAS polygons
# put منية سندوب in قسم أول المنصورة; Wikidata says مركز المنصورة). Same normalized name and
#   - both have points less than 4 km apart, or
#   - same / similar markaz and (points < 8 km apart, or one has no point)
# means the same village. Wikidata (official village list) wins for spelling and markaz.
def km(a, b):
    return math.hypot((a['lat'] - b['lat']) * 111, (a['lng'] - b['lng']) * 111 * math.cos(math.radians(a['lat'])))

PRIO = {'wikidata': 0, 'osm': 1, 'geonames': 2}
records.sort(key=lambda r: (PRIO[r['src']], not r['official']))
groups = collections.defaultdict(list)
for r in records:
    groups[norm(r['name'])].append(r)

merged = []
for key, rs in groups.items():
    clusters = []
    for r in rs:
        home = None
        for c in clusters:
            for o in c:
                has = r['lat'] is not None and o['lat'] is not None
                d = km(r, o) if has else None
                same_mk = (r['gov'] == o['gov'] or not has) and (mk_match(r['markaz'], o['markaz']) or (not r['markaz'] or not o['markaz']) and r['gov'] == o['gov'])
                if (has and d < 4) or (same_mk and (not has or d < 8)):
                    home = c
                    break
            if home:
                break
        if home:
            home.append(r)
        else:
            clusters.append([r])
    for c in clusters:
        best = c[0]
        pt = next((x for x in c if x['lat'] is not None and x['src'] == 'osm'), None) or next((x for x in c if x['lat'] is not None), None)
        merged.append(dict(best, lat=pt['lat'] if pt else None, lng=pt['lng'] if pt else None,
                           kind='city' if any(x['kind'] == 'city' for x in c) else best['kind'],
                           sources={x['src'] for x in c}, refs=[x['ref'] for x in c]))
merged = {i: v for i, v in enumerate(merged)}

# Drop governorate-only rows that never found a markaz but share a name with one
out = []
for v in merged.values():
    out.append(dict(name=v['name'], markaz=v['markaz'], governorate=v['gov'],
                    lat=round(v['lat'], 5) if v['lat'] is not None else None,
                    lng=round(v['lng'], 5) if v['lng'] is not None else None,
                    kind=v['kind'], sources=sorted(v['sources']), refs=v['refs'][:4]))
out.sort(key=lambda v: (v['governorate'], v['markaz'], v['name']))
json.dump(out, open('villages.json', 'w'), ensure_ascii=False)

c = collections.Counter(tuple(v['sources']) for v in out)
print('records', len(records), 'wikidata unplaced', wd_unplaced)
print('villages', len(out), c.most_common())
print('kinds', collections.Counter(v['kind'] for v in out))
print('no coords', sum(1 for v in out if v['lat'] is None), 'no markaz', sum(1 for v in out if not v['markaz']))
