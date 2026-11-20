#!/usr/bin/env python3
"""Self-host the shop product photos that the live catalog still hot-links.

The supermarket, bakery, butcher, fish, poultry, veg, fruit, attar, coffee,
sweets, stationery and housewares items in Supabase (catalog_products) point
at Wikimedia thumbnails. This downloads each one (or the better photo listed in
REPLACE when the old one did not show the item), cuts it to a 420x420 WebP like
the rest of public/img, and adds it to src/config/catalogImageManifest.json
with originalPhoto = the row's old URL, so catalogProductPhoto() swaps it in.
A photo a merchant uploads later (any other URL) still wins.

Input: scripts/images/db_remote_photos.json  [{scope, id, name, url}]
Dairy is left out on purpose: its shops belong to the gold/dairy work.

Run: python3 scripts/images/selfhost_db_photos.py   (pip install pillow requests)
"""
import io, json, os, re, time, urllib.parse
import requests
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT_DIR = os.path.join(ROOT, 'public', 'img', 'catalog-db')
MANIFEST = os.path.join(ROOT, 'src', 'config', 'catalogImageManifest.json')
CREDITS = os.path.join(OUT_DIR, 'credits.json')
UA = {'User-Agent': 'QaryatyCatalogPhotos/1.0 (https://qaryaty.vercel.app)'}
API = 'https://commons.wikimedia.org/w/api.php'
SIZE = 420
QUALITY = 72

# Items whose old photo showed something else (checked by the file's own title
# and description): salmon was tuna sashimi, squid was a pasta dish, herring
# was smoked haddock, canned tuna was canned mackerel, cheese triangles were a
# sambal tub, soup bones were a dumpling soup, arugula was coleslaw, spinach
# was a flowering plant, coriander/dill/garlic/peach were old drawings,
# pomegranate was a glass of juice, fig was a drawing, quail was a cooked dish.
REPLACE = {
    'fish|salmon': 'File:Raw salmon fillets.jpg',
    'fish|squid': 'File:Liat Portal for Foodie Disorder - Fresh Calamari from San Francisco Farmer’s Market.jpg',
    'fish|renga': 'File:Smoked herring sold in Italy.jpg',
    'grocery|tuna-can': 'File:Lata de atún-Albo.jpg',
    'grocery|processed': 'File:Schmelzkäse-1.jpg',
    'butcher|bones': 'File:Beef Bones.jpg',
    'veg|arugula': 'File:Arugula for sale.jpg',
    'veg|spinach': 'File:Fresh Spinach leaves.jpg',
    'veg|coriander': 'File:Bunches of coriander leaves.jpg',
    'veg|dill': 'File:Liat Portal for Foodie Disorder - Fresh Dill.jpg',
    'veg|garlic': 'File:Garlic bulbs and cloves.jpg',
    'fruit|peach': 'File:Autumn Red peaches.jpg',
    'fruit|pomegranate': 'File:Pomegranate (opened).jpg',
    'fruit|fig': 'File:Ficus carica whole fruits and fruit cut open.jpg',
    'poultry|quail': 'File:Quail meat 01.jpg',
}


def get(url, **kw):
    for attempt in range(6):
        r = requests.get(url, headers=UA, timeout=60, **kw)
        if r.status_code == 200:
            return r
        time.sleep(3 * (attempt + 1))
    r.raise_for_status()


def info(title):
    params = {'action': 'query', 'format': 'json', 'titles': title, 'prop': 'imageinfo',
              'iiprop': 'url|extmetadata', 'iiurlwidth': 640}
    page = next(iter(get(API, params=params).json()['query']['pages'].values()))
    ii = page['imageinfo'][0]
    meta = ii.get('extmetadata') or {}
    strip = lambda k: re.sub(r'<[^>]+>', '', (meta.get(k) or {}).get('value', '')).strip()
    return ii['thumburl'], {'source': ii['descriptionurl'], 'author': strip('Artist')[:120],
                            'license': strip('LicenseShortName')}


def title_from_thumb(url):
    # .../commons/thumb/a/ab/Name.jpg/330px-Name.jpg?...  ->  File:Name.jpg
    parts = urllib.parse.urlparse(url).path.split('/')
    i = parts.index('thumb') if 'thumb' in parts else None
    name = parts[i + 3] if i is not None else parts[-1]
    return 'File:' + urllib.parse.unquote(name)


def main():
    items = json.load(open(os.path.join(HERE, 'db_remote_photos.json'), encoding='utf-8'))
    manifest = json.load(open(MANIFEST, encoding='utf-8'))
    os.makedirs(OUT_DIR, exist_ok=True)
    credits = {}
    cache = {}
    for it in items:
        key = f"{it['scope']}|{it['id']}"
        title = REPLACE.get(key) or title_from_thumb(it['url'])
        if title not in cache:
            thumb, credit = info(title)
            img = Image.open(io.BytesIO(get(thumb).content))
            img = ImageOps.exif_transpose(img).convert('RGB')
            cache[title] = (ImageOps.fit(img, (SIZE, SIZE), Image.LANCZOS), credit)
        img, credit = cache[title]
        name = f"{it['scope']}-{it['id']}.webp"
        img.save(os.path.join(OUT_DIR, name), 'WEBP', quality=QUALITY, method=6)
        manifest[key] = {'name': it['name'], 'originalPhoto': it['url'], 'photo': f'/img/catalog-db/{name}'}
        credits[name] = credit
        print(key, title)
    with open(MANIFEST, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write('\n')
    with open(CREDITS, 'w', encoding='utf-8') as f:
        json.dump(credits, f, ensure_ascii=False, indent=1)
        f.write('\n')


if __name__ == '__main__':
    main()
