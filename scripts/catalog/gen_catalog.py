# Generates src/data/catalog.ts: default products for every kind of shop.
# Row: (id, Arabic name, emoji, price EGP, unit, photo key or None, section)
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))

P = json.load(open(os.path.join(HERE, 'photos.json')))

KG, PC, BOX = 'كيلو', 'قطعة', 'علبة'

FISH = [
  ('tilapia','بلطي','🐟',90,KG,'Nile_tilapia','سمك نيلي ومزارع'),
  ('tilapia-large','بلطي كبير (سوبر)','🐟',110,KG,'Tilapia','سمك نيلي ومزارع'),
  ('mullet','بوري','🐟',160,KG,'Flathead_grey_mullet','سمك نيلي ومزارع'),
  ('catfish','قرموط','🐟',85,KG,'North_African_catfish','سمك نيلي ومزارع'),
  ('nileperch','قشر بياض','🐟',220,KG,'Nile_perch','سمك نيلي ومزارع'),
  ('bayad','بياض','🐟',180,KG,None,'سمك نيلي ومزارع'),
  ('bream','دنيس','🐠',260,KG,'Gilt-head_bream','سمك بحري'),
  ('seabass','قاروص','🐟',300,KG,'European_seabass','سمك بحري'),
  ('redmullet','بربوني','🐠',220,KG,'Red_mullet','سمك بحري'),
  ('macarona','مكرونة','🐟',120,KG,None,'سمك بحري'),
  ('shoor','شعور','🐠',280,KG,'Lethrinus','سمك بحري'),
  ('pandora','مرجان','🐠',280,KG,'Common_pandora','سمك بحري'),
  ('grouper','وقار','🐡',380,KG,'Grouper','سمك بحري'),
  ('sole','موسى','🐟',280,KG,'Common_sole','سمك بحري'),
  ('sardine','سردين','🐟',80,KG,'Sardine','سمك بحري'),
  ('mackerel','ماكريل','🐟',120,KG,'Atlantic_mackerel','سمك بحري'),
  ('anchovy','أنشوجة','🐟',140,KG,'Anchovy','سمك بحري'),
  ('salmon','سلمون','🍣',700,KG,'Salmon_as_food','سمك بحري'),
  ('shrimp','جمبري وسط','🦐',450,KG,'Shrimp','سي فود'),
  ('shrimp-jumbo','جمبري جامبو','🦐',750,KG,'Shrimp','سي فود'),
  ('crab','كابوريا','🦀',200,KG,'Blue_swimmer_crab','سي فود'),
  ('cuttlefish','سبيط','🦑',260,KG,'Cuttlefish','سي فود'),
  ('squid','كاليماري','🦑',300,KG,'Calamari','سي فود'),
  ('octopus','أخطبوط','🐙',380,KG,'Octopus_as_food','سي فود'),
  ('mussel','بلح البحر','🦪',180,KG,'Mussel','سي فود'),
  ('lobster','استاكوزا','🦞',1400,KG,'Lobster','سي فود'),
  ('fillet','فيليه بلطي','🐟',160,KG,'Fish_fillet','فيليه ومملح'),
  ('fillet-panga','فيليه بنجاسيوس','🐟',130,KG,'Fish_fillet','فيليه ومملح'),
  ('fesikh','فسيخ','🐟',350,KG,'Fesikh','فيليه ومملح'),
  ('renga','رنجة','🐟',160,KG,'Smoked_fish','فيليه ومملح'),
  ('tuna','تونة طازة','🐟',320,KG,'Tuna','فيليه ومملح'),
]
# Fish that a fish shop also grills (whole fish and shrimp)
GRILLABLE = {'tilapia','tilapia-large','mullet','catfish','nileperch','bayad','bream','seabass','redmullet','macarona','shoor','pandora','grouper','sole','sardine','mackerel','shrimp','shrimp-jumbo','cuttlefish','squid'}

POULTRY = [
  ('white-whole','فرخة بيضا كاملة','🐔',110,KG,'raw_whole_chicken','فراخ'),
  ('baladi-whole','فرخة بلدي','🐓',150,KG,'raw_whole_chicken','فراخ'),
  ('sasso','فرخة ساسو','🐔',130,KG,'raw_whole_chicken','فراخ'),
  ('breast','صدور فراخ','🍗',230,KG,'raw_chicken_breast','أجزاء الفراخ'),
  ('thigh','أوراك فراخ','🍗',140,KG,'raw_chicken_parts','أجزاء الفراخ'),
  ('drumstick','دبابيس','🍗',150,KG,'raw_chicken_parts','أجزاء الفراخ'),
  ('wings','أجنحة','🍗',90,KG,'raw_chicken_wings','أجزاء الفراخ'),
  ('liver-gizzard','كبد وقوانص','🫘',120,KG,'raw_chicken_liver','أجزاء الفراخ'),
  ('gizzard','قوانص','🫘',100,KG,'Gizzard','أجزاء الفراخ'),
  ('feet','أرجل فراخ','🐔',40,KG,'Chicken_feet','أجزاء الفراخ'),
  ('frames','هياكل للشوربة','🍲',35,KG,None,'أجزاء الفراخ'),
  ('pane','بانيه','🍗',260,KG,'Schnitzel','جاهز للطبخ'),
  ('strips','استربس','🍗',270,KG,'Chicken_fingers','جاهز للطبخ'),
  ('nuggets','ناجتس','🍗',220,KG,'Chicken_nugget','جاهز للطبخ'),
  ('shish','شيش طاووق متبل','🍢',260,KG,'Shish_taouk','جاهز للطبخ'),
  ('turkey-whole','رومي كامل','🦃',160,KG,'Turkey_meat','رومي'),
  ('turkey-breast','صدور رومي','🦃',260,KG,None,'رومي'),
  ('turkey-thigh','أوراك رومي','🦃',180,KG,None,'رومي'),
  ('rabbit','أرانب','🐇',220,KG,'raw_rabbit','أرانب وطيور'),
  ('duck','بط مسكوفي','🦆',180,KG,'Duck_as_food','أرانب وطيور'),
  ('duck-baladi','بط بلدي','🦆',200,KG,'Duck_as_food','أرانب وطيور'),
  ('goose','وز','🪿',230,KG,'c_goose','أرانب وطيور'),
  ('pigeon','حمام (جوز)','🐦',160,'جوز','Squab_(food)','أرانب وطيور'),
  ('pigeon-stuffed','حمام محشي جاهز','🐦',120,PC,'Hamam_mahshi','أرانب وطيور'),
  ('quail','سمان','🐦',40,PC,'Quail_as_food','أرانب وطيور'),
  ('eggs-white','بيض أبيض','🥚',170,'كرتونة 30','c_eggs','بيض'),
  ('eggs-red','بيض أحمر','🥚',180,'كرتونة 30','c_eggs','بيض'),
  ('eggs-baladi','بيض بلدي','🥚',8,PC,'c_eggs','بيض'),
]

BUTCHER = [
  ('veal','لحمة بتلو','🥩',480,KG,'raw_beef','لحوم'),
  ('kandouz','لحمة كندوز','🥩',420,KG,'meat_cuts','لحوم'),
  ('lamb','لحمة ضاني','🐑',500,KG,'Lamb_and_mutton','لحوم'),
  ('goat','لحمة ماعز','🐐',450,KG,'Goat_meat','لحوم'),
  ('camel','لحمة جملي','🐪',380,KG,None,'لحوم'),
  ('cubes','لحمة مكعبات','🥩',440,KG,'Stew_meat','قطعيات'),
  ('mouza','موزة','🍖',460,KG,'meat_cuts','قطعيات'),
  ('fillet','فيليه','🥩',650,KG,'Steak','قطعيات'),
  ('steak','استيك','🥩',560,KG,'Steak','قطعيات'),
  ('roast','روزبيف','🥩',520,KG,'Beef','قطعيات'),
  ('ribs','ريش ضاني','🍖',560,KG,'Rack_of_lamb','قطعيات'),
  ('akkawi','عكاوي','🍖',380,KG,'Oxtail','قطعيات'),
  ('minced','لحمة مفرومة','🥩',420,KG,'Ground_beef','مفروم ومصنع'),
  ('kofta','كفتة متبلة','🍢',430,KG,'Kofta_kebab','مفروم ومصنع'),
  ('sausage','سجق بلدي','🌭',380,KG,'Sujuk','مفروم ومصنع'),
  ('burger','برجر بيتي','🍔',400,KG,'c_burger','مفروم ومصنع'),
  ('basterma','بسطرمة','🥓',900,KG,'Basturma','مفروم ومصنع'),
  ('liver','كبدة بتلو','🫘',450,KG,'Liver_(food)','ممبار ومخاصي'),
  ('kidney','كلاوي','🫘',250,KG,'Kidney_(food)','ممبار ومخاصي'),
  ('brain','مخ','🧠',200,PC,'Brain_as_food','ممبار ومخاصي'),
  ('tongue','لسان','👅',300,KG,'Tongue_(food)','ممبار ومخاصي'),
  ('trotters','كوارع','🦴',250,'جوز','Sheep\'s_trotters','ممبار ومخاصي'),
  ('tripe','كرشة','🍲',160,KG,'Tripe','ممبار ومخاصي'),
  ('mombar','ممبار','🌭',180,KG,'Mombar','ممبار ومخاصي'),
  ('fat','دهن (لية)','🧈',120,KG,'Beef_tallow','ممبار ومخاصي'),
  ('bones','عظم للشوربة','🦴',80,KG,'Bone_marrow_(food)','ممبار ومخاصي'),
]

V='خضار'; L='ورقيات وأعشاب'; G='بقول خضرا'
VEG = [
  ('tomato','طماطم','🍅',15,KG,'Tomato',V),('potato','بطاطس','🥔',18,KG,'Potato',V),('onion','بصل أحمر','🧅',20,KG,'Onion',V),
  ('onion-white','بصل أبيض','🧅',22,KG,'Onion',V),('cucumber','خيار','🥒',15,KG,'Cucumber',V),('bellpepper','فلفل رومي','🫑',30,KG,'Bell_pepper',V),
  ('chili','فلفل حامي','🌶️',30,KG,'Chili_pepper',V),('eggplant','باذنجان رومي','🍆',15,KG,'Eggplant',V),('eggplant-white','باذنجان أبيض','🍆',18,KG,'Eggplant',V),
  ('zucchini','كوسة','🥒',20,KG,'Zucchini',V),('carrot','جزر','🥕',15,KG,'Carrot',V),('garlic','ثوم','🧄',80,KG,'Garlic',V),('lemon','ليمون بلدي','🍋',40,KG,'Lemon',V),
  ('cabbage','كرنب','🥬',10,KG,'Cabbage',V),('cauliflower','قرنبيط','🥦',15,KG,'Cauliflower',V),('beet','بنجر','🫚',15,KG,'Beetroot',V),
  ('sweetpotato','بطاطا','🍠',20,KG,'Sweet_potato',V),('taro','قلقاس','🥔',25,KG,'Taro',V),
  ('okra','بامية','🫛',40,KG,'Okra',G),('greenbean','فاصوليا خضرا','🫛',35,KG,'Green_bean',G),('peas','بسلة','🫛',35,KG,'Pea',G),
  ('molokhia','ملوخية خضرا','🌿',20,KG,'Corchorus_olitorius',L),('spinach','سبانخ','🥬',15,KG,'Spinach',L),('lettuce','خس','🥬',10,PC,'Lettuce',L),
  ('radish','فجل','🌱',5,'حزمة','Radish',L),('leek','كرات','🌱',5,'حزمة','Leek',L),('parsley','بقدونس','🌿',5,'حزمة','Parsley',L),
  ('dill','شبت','🌿',5,'حزمة','Dill',L),('coriander','كزبرة خضرا','🌿',5,'حزمة','Coriander',L),('mint','نعناع','🌿',5,'حزمة','Mentha',L),
  ('arugula','جرجير','🥬',5,'حزمة','c_arugula',L),
]
F='فاكهة الموسم'; FI='فاكهة مستوردة'
FRUIT = [
  ('banana','موز','🍌',35,KG,'Banana',F),('orange','برتقال','🍊',20,KG,'Orange_(fruit)',F),('mandarin','يوسفي','🍊',25,KG,'Mandarin_orange',F),
  ('grape','عنب','🍇',40,KG,'Grape',F),('mango','مانجو','🥭',50,KG,'Mango',F),('watermelon','بطيخ','🍉',8,KG,'Watermelon',F),
  ('cantaloupe','كانتلوب','🍈',20,KG,'Cantaloupe',F),('strawberry','فراولة','🍓',40,KG,'Strawberry',F),('guava','جوافة','🍐',25,KG,'Guava',F),
  ('pomegranate','رمان','🍎',30,KG,'Pomegranate',F),('peach','خوخ','🍑',50,KG,'Peach',F),('apricot','مشمش','🍑',60,KG,'Apricot',F),
  ('fig','تين','🫐',50,KG,'Common_fig',F),('dates','بلح','🌴',40,KG,'Date_palm',F),('persimmon','كاكا','🍅',40,KG,'Persimmon',F),
  ('grapefruit','جريب فروت','🍊',25,KG,'Grapefruit',F),('apple','تفاح','🍎',60,KG,'Apple',FI),('apple-red','تفاح أحمر مستورد','🍎',90,KG,'Apple',FI),
  ('pear','كمثرى','🍐',60,KG,'Pear',FI),('kiwi','كيوي','🥝',120,KG,'Kiwifruit',FI),('pineapple','أناناس','🍍',90,PC,'Pineapple',FI),
]

D='ألبان وجبن'; E='بيض'; O='زيوت وسمن'; S='رز وسكر ومكرونة'; B='بقوليات'; C='معلبات وصلصة'; T='شاي وقهوة'
DR='مشروبات'; SN='سناكس وحلويات'; BR='خبز وفطار'; CL='منظفات'; PE='عناية شخصية ومناديل'
SUPERMARKET = [
  ('milk','لبن كامل الدسم 1 لتر','🥛',45,PC,'Milk',D),('milk-small','لبن 200 مل','🥛',12,PC,'Milk',D),('yogurt','زبادي','🥣',10,PC,'Yogurt',D),
  ('feta','جبنة فيتا','🧀',35,'علبة 500 جم','Feta',D),('domiati','جبنة بيضا دمياطي','🧀',140,KG,'Domiati',D),('roumi','جبنة رومي','🧀',380,KG,None,D),
  ('processed','جبنة نستو (مثلثات)','🧀',40,BOX,'Processed_cheese',D),('labneh','لبنة','🥣',45,BOX,'Strained_yogurt',D),('butter','زبدة 100 جم','🧈',55,PC,'c_butter',D),
  ('eggs','بيض أبيض','🥚',170,'كرتونة 30','c_eggs',E),('eggs-red','بيض أحمر','🥚',180,'كرتونة 30','c_eggs',E),
  ('sunflower-oil','زيت عباد الشمس 1 لتر','🫗',95,PC,'c_oil',O),('corn-oil','زيت ذرة 1 لتر','🫗',110,PC,'c_oil',O),('olive-oil','زيت زيتون 500 مل','🫒',220,PC,'Vegetable_oil',O),
  ('ghee','سمنة 1 كيلو','🧈',150,PC,None,O),
  ('rice','رز مصري','🍚',35,KG,'c_rice',S),('sugar','سكر','🍬',35,KG,'Sugar',S),('pasta','مكرونة 400 جم','🍝',18,PC,'Pasta',S),
  ('vermicelli','شعرية','🍝',15,PC,'Vermicelli',S),('flour','دقيق 1 كيلو','🌾',30,PC,'c_flour',S),('salt','ملح','🧂',8,PC,'c_salt',S),
  ('lentil','عدس أصفر','🫘',60,KG,'Lentil',B),('beans','فول مدمس','🫘',45,KG,'Ful_medames',B),('chickpea','حمص','🫘',80,KG,'Chickpea',B),
  ('white-beans','فاصوليا بيضا','🫘',90,KG,'c_white_beans',B),('fool-can','فول معلب','🥫',15,'علبة',None,C),
  ('tuna-can','تونة','🥫',55,'علبة','Canned_fish',C),('luncheon','لانشون','🥓',60,PC,'c_luncheon',C),('corned-beef','بلوبيف','🥫',75,'علبة','Corned_beef',C),
  ('tomato-paste','صلصة طماطم','🍅',25,'علبة','Tomato_paste',C),('honey','عسل نحل','🍯',150,'برطمان','Honey',C),('jam','مربى','🍓',40,'برطمان','Fruit_preserves',C),
  ('halva','حلاوة طحينية','🍯',70,'علبة','Halva',C),
  ('tea','شاي 250 جم','🍵',75,PC,'Black_tea',T),('tea-bags','شاي فتلة 100 كيس','🍵',90,BOX,'Black_tea',T),('coffee-instant','نسكافيه','☕',120,'برطمان','Instant_coffee',T),
  ('water','مياه 1.5 لتر','💧',8,PC,'Bottled_water',DR),('water-6','مياه 1.5 لتر (6 زجاجات)','💧',45,'شرنك','Bottled_water',DR),
  ('cola','مشروب غازي 1 لتر','🥤',25,PC,'Soft_drink',DR),('juice-box','عصير علبة','🧃',10,PC,None,DR),
  ('chips','شيبسي','🥔',10,'كيس','Potato_chips',SN),('biscuits','بسكويت','🍪',10,'باكو','Biscuit',SN),('chocolate','شوكولاتة','🍫',25,PC,'Chocolate',SN),
  ('wafer','ويفر','🍫',8,PC,'c_wafer',SN),
  ('toast','عيش توست','🍞',35,'كيس','Sliced_bread',BR),('cornflakes','كورن فليكس','🥣',85,BOX,'Cornflakes',BR),('croissant','كرواسون معبأ','🥐',12,PC,'Croissant',BR),
  ('dish-soap','سائل أطباق','🧴',45,PC,'Dishwashing_liquid',CL),('detergent','مسحوق غسيل 1 كيلو','🧺',90,PC,'Laundry_detergent',CL),
  ('bleach','كلور','🧴',25,PC,'Bleach',CL),('floor','منظف أرضيات','🧽',50,PC,None,CL),('sponge','سفنج مواعين','🧽',10,PC,'Sponge_(tool)',CL),
  ('trash-bags','أكياس زبالة','🗑️',30,'رول',None,CL),
  ('toilet-paper','مناديل تواليت (6 بكر)','🧻',70,'شرنك','Toilet_paper',PE),('tissues','مناديل وش','🤧',25,BOX,'c_tissues',PE),
  ('soap','صابون','🧼',15,PC,'Soap',PE),('shampoo','شامبو','🧴',90,PC,'c_shampoo',PE),('toothpaste','معجون أسنان','🪥',45,PC,'Toothpaste',PE),
  ('diapers','حفاضات أطفال','👶',220,'باكو','Diaper',PE),
]

BREAD='عيش'; PAS='معجنات'; COOK='كحك وبسكويت'
BAKERY = [
  ('baladi','عيش بلدي','🫓',1,'رغيف','Eish_baladi',BREAD),('baladi-free','عيش بلدي سياحي','🫓',3,'رغيف','Eish_baladi',BREAD),
  ('shami','عيش شامي','🫓',3,'رغيف','Pita',BREAD),('fino','عيش فينو','🥖',3,PC,'Bread_roll',BREAD),('baguette','باجيت','🥖',10,PC,'Baguette',BREAD),
  ('toast','توست بلدي','🍞',30,'كيس','Sliced_bread',BREAD),('rusk','بقسماط','🍞',60,KG,'Rusk',BREAD),
  ('croissant','كرواسون','🥐',12,PC,'Croissant',PAS),('pate','باتيه','🥐',10,PC,None,PAS),('pizza-slice','بيتزا فرن','🍕',25,PC,'Pizza',PAS),
  ('kahk','كحك','🍪',240,KG,'Kahk',COOK),('ghorayeba','غريبة','🍪',220,KG,'Ghraybeh',COOK),('petitfour','بيتي فور','🍪',260,KG,'Petit_four',COOK),
  ('biscuit','بسكويت بالسمن','🍪',180,KG,'Biscuit',COOK),('maamoul','معمول','🍪',260,KG,"Ma'amoul",COOK),
]

OR='حلويات شرقية'; WE='حلويات غربي'; CU='حلويات علب'
SWEETS = [
  ('basbousa','بسبوسة','🍰',140,KG,'Basbousa',OR),('kunafa','كنافة','🍯',160,KG,'Konafa',OR),('baklava','بقلاوة','🥮',320,KG,'Baklava',OR),
  ('qatayef','قطايف','🥟',120,KG,'Qatayef',OR),('zalabia','زلابية (لقمة القاضي)','🍩',100,KG,'Luqaimat',OR),('goulash','جلاش بالمكسرات','🥮',300,KG,None,OR),
  ('gateau','جاتوه','🍰',25,PC,'Cake',WE),('eclair','إكلير','🍫',20,PC,'Éclair',WE),('millefeuille','ميل فاي','🍰',35,PC,'Mille-feuille',WE),
  ('torta','تورتة شوكولاتة','🎂',450,'تورتة','Chocolate_cake',WE),('donut','دونات','🍩',20,PC,'Donut',WE),('meringue','مارينج','🤍',150,KG,'Meringue',WE),
  ('roz','أرز بلبن','🍮',20,'علبة','Rice_pudding',CU),('mahalabia','مهلبية','🍮',20,'علبة','Muhallebi',CU),('omali','أم علي','🍮',45,'طبق','Umm_Ali',CU),
  ('icecream','آيس كريم','🍦',25,PC,'Ice_cream',CU),
]

SP='توابل'; HB='أعشاب ومشروبات'; NU='مكسرات وياميش'; OT='زيوت وحاجات تانية'
QK='ربع كيلو'
ATTAR = [
  ('cumin','كمون','🌰',90,QK,'c_cumin',SP),('pepper','فلفل أسود','⚫',120,QK,'c_pepper',SP),('paprika','بابريكا','🌶️',60,QK,'Paprika',SP),
  ('turmeric','كركم','🟡',50,QK,'c_turmeric',SP),('cinnamon','قرفة','🪵',70,QK,'Cinnamon',SP),('cardamom','حبهان','🫛',350,QK,'c_cardamom',SP),
  ('clove','قرنفل','🌰',200,QK,'c_clove',SP),('bayleaf','ورق لورا','🍃',30,QK,'Bay_leaf',SP),('coriander-seed','كزبرة ناشفة','🌿',40,QK,'c_coriander_seed',SP),
  ('mixed-spice','بهارات مشكلة','🧂',80,QK,'c_spices',SP),('dukkah','دقة','🧂',60,QK,'Dukkah',SP),('sumac','سماق','🔴',70,QK,'Sumac',SP),
  ('saffron','زعفران','🌸',150,'جرام','Saffron',SP),
  ('mint-dry','نعناع ناشف','🌿',40,QK,'Mentha',HB),('chamomile','بابونج','🌼',50,QK,'c_chamomile',HB),('anise','ينسون','🌱',50,QK,'c_anise',HB),
  ('fenugreek','حلبة','🌱',30,QK,None,HB),('karkade','كركديه','🌺',60,QK,'Hibiscus_tea',HB),('thyme','زعتر','🌿',50,QK,'Thyme',HB),
  ('ginger','جنزبيل','🫚',70,QK,'c_ginger',HB),('caraway','كراوية','🌱',50,QK,None,HB),('sahlab','سحلب','🥛',40,'كيس','Sahlab',HB),
  ('tamarind','تمر هندي','🟤',40,QK,'Tamarind',HB),('carob','خروب','🟤',30,QK,'c_carob',HB),('licorice','عرقسوس','🟤',40,QK,'c_licorice',HB),
  ('peanut','سوداني','🥜',35,QK,'c_peanut',NU),('almond','لوز','🌰',200,QK,'Almond',NU),('walnut','عين جمل','🌰',220,QK,'Walnut',NU),
  ('hazelnut','بندق','🌰',200,QK,'Hazelnut',NU),('cashew','كاجو','🌰',230,QK,'c_cashew',NU),('pistachio','فستق','🌰',300,QK,'c_pistachio',NU),
  ('seeds','لب سوري','🌻',60,QK,'Sunflower_seed',NU),('pumpkin','لب أبيض','🎃',70,QK,'Pumpkin_seed',NU),('raisin','زبيب','🍇',60,QK,'Raisin',NU),
  ('qamareddin','قمر الدين','🟠',50,'لفة','Qamar_al-Din',NU),('dates-paste','عجوة','🌴',40,KG,'c_dates',NU),
  ('blackseed','حبة البركة','⚫',40,QK,'c_blackseed',OT),('blackseed-oil','زيت حبة البركة','🫗',80,'زجاجة 125 مل',None,OT),('sesame','سمسم','⚪',50,QK,'c_sesame',OT),
]

CB='بن'; HD='مشروبات سخنة'; TK='تيك أواي'
COFFEE = [
  ('turkish-plain','بن تركي سادة','☕',140,QK,'Coffee_bean',CB),('turkish-mehawag','بن محوج','☕',150,QK,'Coffee_bean',CB),
  ('turkish-dark','بن غامق','☕',145,QK,'Coffee_bean',CB),('espresso-beans','بن إسبريسو','☕',180,QK,'Coffee_bean',CB),
  ('hazelnut-coffee','بن بالبندق','🌰',170,QK,'Coffee_bean',CB),('nescafe','نسكافيه كلاسيك','☕',120,'برطمان','Instant_coffee',CB),
  ('cocoa','كاكاو','🍫',90,QK,'c_cocoa',HD),('sahlab','سحلب','🥛',40,'كيس','Sahlab',HD),('hot-choc','هوت شوكليت بودرة','🍫',70,'كيس','c_cocoa',HD),
  ('green-tea','شاي أخضر','🍵',60,BOX,'Green_tea',HD),
  ('cup-turkish','فنجان قهوة تركي','☕',20,'فنجان','Turkish_coffee',TK),('espresso','إسبريسو','☕',30,'كوباية','Espresso',TK),
  ('cappuccino','كابتشينو','☕',45,'كوباية','Cappuccino',TK),
]

MK='لبن وزبادي'; CH='جبن'; BT='زبدة وقشطة وسمنة'
DAIRY = [
  ('cow-milk','لبن بقري','🥛',30,'لتر','Milk',MK),('buffalo-milk','لبن جاموسي','🥛',40,'لتر','Milk',MK),('yogurt','زبادي بلدي','🥣',10,'سلطانية','Yogurt',MK),
  ('rayeb','لبن رايب','🥛',25,'لتر','c_buttermilk',MK),('laban-zeer','لبن زير','🥛',30,'لتر',None,MK),
  ('domiati','جبنة دمياطي','🧀',140,KG,'Domiati',CH),('feta','جبنة فيتا','🧀',150,KG,'Feta',CH),('areesh','جبنة قريش','🧀',80,KG,'c_cottage',CH),
  ('roumi','جبنة رومي','🧀',380,KG,None,CH),('mish','مش','🧀',90,KG,None,CH),('cheddar','جبنة شيدر','🧀',350,KG,None,CH),
  ('labneh','لبنة','🥣',120,KG,'Strained_yogurt',CH),
  ('butter','زبدة فلاحي','🧈',350,KG,'c_butter',BT),('cream','قشطة','🥛',200,KG,'Kaymak',BT),('ghee','سمنة بلدي','🧈',400,KG,None,BT),
]

SC='أدوات مدرسية'; NB='كراريس وورق'; AR='رسم وألوان'; OF='مكتب'
STATIONERY = [
  ('pencil','قلم رصاص','✏️',5,PC,'Pencil',SC),('pen','قلم جاف','🖊️',7,PC,'Ballpoint_pen',SC),('eraser','أستيكة','🩹',5,PC,'Eraser',SC),
  ('sharpener','براية','✏️',5,PC,'Pencil_sharpener',SC),('ruler','مسطرة','📏',10,PC,'Ruler',SC),('geometry','طقم هندسة','📐',45,'طقم',None,SC),
  ('pencil-case','مقلمة','👝',60,PC,'c_pencil_case',SC),('bag','شنطة مدرسة','🎒',350,PC,'Backpack',SC),('scissors','مقص','✂️',20,PC,'Scissors',SC),
  ('glue','صمغ ستيك','🧴',15,PC,'Glue_stick',SC),('calculator','آلة حاسبة','🧮',150,PC,'Calculator',SC),
  ('notebook-40','كراسة 40 ورقة','📓',10,PC,'Notebook',NB),('notebook-100','كشكول 100 ورقة','📓',35,PC,'Notebook',NB),
  ('a4','ورق A4 (500 ورقة)','📄',250,'رزمة',None,NB),('cover','جلاد كتب','📘',5,PC,None,NB),('envelope','ظرف','✉️',3,PC,'Envelope',NB),
  ('colors','ألوان خشب 12 لون','🖍️',40,BOX,'Colored_pencil',AR),('crayons','ألوان شمع','🖍️',30,BOX,'Crayon',AR),('markers','أقلام فلوماستر','🖊️',50,BOX,'Marker_pen',AR),
  ('watercolor','ألوان مية','🎨',45,BOX,'c_watercolor',AR),('sketch','كراسة رسم','📒',25,PC,'c_sketch',AR),
  ('stapler','دباسة','📎',60,PC,'Stapler',OF),('highlighter','قلم فسفوري','🖍️',15,PC,'c_highlighter',OF),('file','دوسيه','📁',10,PC,None,OF),
  ('print','طباعة ورقة','🖨️',2,'ورقة','c_photocopier',OF),('photocopy','تصوير ورقة','🖨️',1,'ورقة','c_photocopier',OF),
]

KT='مطبخ'; CLN='تنظيف'; EL='كهرباء'; HM='بيت'
HOUSEWARES = [
  ('pan','طاسة','🍳',250,PC,'Frying_pan',KT),('pot','حلة ألومنيوم','🍲',300,PC,'c_pot',KT),('pressure','حلة ضغط','🍲',900,PC,'Pressure_cooking',KT),
  ('kettle','براد شاي','🫖',180,PC,'Teapot',KT),('kettle-water','غلاية مية','🫖',200,PC,'Kettle',KT),('plates','طقم أطباق 6 قطع','🍽️',250,'طقم','c_plates',KT),
  ('glasses','طقم كوبايات 6','🥛',150,'طقم','Drinking_glass',KT),('spoons','طقم معالق 6','🥄',90,'طقم','Spoon',KT),('knife','سكينة مطبخ','🔪',60,PC,'c_knife',KT),
  ('board','لوح تقطيع','🪵',70,PC,'Cutting_board',KT),('containers','علب حفظ بلاستيك','🥡',80,'طقم',None,KT),('tray','صينية فرن','🍽️',120,PC,'c_tray',KT),
  ('broom','مقشة','🧹',60,PC,'Broom',CLN),('mop','مساحة','🧹',80,PC,'Mop',CLN),('bucket','جردل','🪣',50,PC,'c_bucket',CLN),
  ('dustpan','جاروف','🧹',30,PC,'Dustpan',CLN),('sponge','سفنج','🧽',10,PC,'Sponge_(tool)',CLN),
  ('bulb','لمبة ليد','💡',45,PC,'c_bulb',EL),('strip','مشترك كهربا','🔌',120,PC,'Power_strip',EL),('fan','مروحة','🌀',900,PC,'Electric_fan',EL),
  ('batteries','حجارة بطارية (4)','🔋',40,'باكو','c_batteries',EL),
  ('hangers','شماعات (12)','👕',60,'باكو','Clothes_hanger',HM),('clothespins','مشابك غسيل','🧷',25,'باكو','c_clothespins',HM),('trash-bin','سلة زبالة','🗑️',70,PC,'c_trash_bin',HM),
]

# Pharmacy: the shared medicine list from the wip branch. Medicines keep their
# emoji: a stock photo of other pills would show the wrong product.
import re, ast
PHARMACY = []
src = open(os.path.join(HERE, 'pharmacy_source.ts')).read()
secs = ast.literal_eval('[' + re.search(r"PHARMACY_SECTIONS = \[(.*?)\] as const", src, re.S).group(1) + ']')
names = ['PAIN','COLD','ABX','STOMACH','CHRONIC','VIT','KIDS','SKIN','FIRST_AID','SUPPLIES']
secmap = dict(zip(names, secs))
for m in re.finditer(r"^  \[(.*)\],\s*$", src, re.M):
    row = m.group(1)
    for n in names: row = re.sub(r"(?<=, )%s(?=,)" % n, repr(secmap[n]), row)
    row = row.replace('true', 'True').replace('false', 'False')
    key, ar, en, sec, form, strength, pack, price, rx, emoji = ast.literal_eval('[' + row + ']')
    name = f"{ar} {strength}".strip() if strength and form != 'منتج' else ar
    PHARMACY.append((key, name, emoji, price, pack, None, sec, rx))

KINDS = [
  ('FISH', FISH, 'fish'), ('POULTRY', POULTRY, 'poultry'), ('BUTCHER', BUTCHER, 'butcher'),
  ('VEGETABLES', VEG, 'veg'), ('FRUITS', FRUIT, 'fruit'), ('SUPERMARKET', SUPERMARKET, 'grocery'),
  ('BAKERY', BAKERY, 'bakery'), ('SWEETS', SWEETS, 'sweets'), ('ATTAR', ATTAR, 'attar'),
  ('COFFEE', COFFEE, 'coffee'), ('DAIRY', DAIRY, 'dairy'), ('STATIONERY', STATIONERY, 'stationery'),
  ('HOUSEWARES', HOUSEWARES, 'housewares'), ('PHARMACY', PHARMACY, 'pharmacy'),
]

def ts(s): return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"
HALF = {KG}
out = []
missing = []
for const, rows, kind in KINDS:
    ids = [r[0] for r in rows]
    assert len(ids) == len(set(ids)), (const, [i for i in ids if ids.count(i) > 1])
    out.append(f"export const {const}: Product[] = [")
    for r in rows:
        id_, name, emoji, price, unit, key, section = r[:7]
        rx = r[7] if len(r) > 7 else False
        photo = P.get(key) if key else None
        if key and not photo: missing.append(key)
        parts = [f"id: {ts(id_)}", f"name: {ts(name)}", f"emoji: {ts(emoji)}", f"price: {price}",
                 f"unit: {ts(unit)}", f"step: {0.5 if unit in HALF else 1}", f"section: {ts(section)}"]
        if photo: parts.append(f"photo: {ts(photo)}")
        if kind == 'fish' and id_ in GRILLABLE: parts.append("grillable: true")
        if rx: parts.append("rx: true")
        out.append("  { " + ", ".join(parts) + " },")
    out.append("];\n")
if missing: print('MISSING PHOTO KEYS', missing, file=sys.stderr)

cur = open(os.path.join(ROOT, 'src/data/catalog.ts')).read()
end_mark = '/** The default list for each kind' if '/** The default list for each kind' in cur else '/** What a shop sells'
rest_block = cur[cur.index('export const FOOD_TYPE_LABELS'):cur.index(end_mark)]

header = """// ─── Products sold in shops and restaurants
//
// Every kind of shop has a full default list, in sections: every fish shop
// sells all the fish below, every butcher all the meats, and so on. A shop
// added later gets its kind's list with no extra work. Prices are sample
// prices in EGP. Photos are images from Wikipedia and Wikimedia Commons; an
// item without a matching photo (and every medicine) shows its emoji.
//
// Generated by scripts/catalog/gen_catalog.py: edit the lists there and run it again.

import type { FoodType, Product, Shop, ShopKind } from '@/types';

/** Grilling, per kilo, added to the fish price for "buy and grill". */
export const GRILL_PRICE_PER_KILO = 40;

"""
footer = """/** The default list for each kind of shop. Restaurants have their own menus. */
export const CATALOG_BY_KIND: Partial<Record<ShopKind, Product[]>> = {
""" + "".join(f"  {kind}: {const},\n" for const, _, kind in KINDS) + """};

/** What a shop sells, or null when it takes a free-text order (a salon, a workshop). */
export function productsForShop(shop: Pick<Shop, 'id' | 'kind'>): Product[] | null {
  if (shop.kind === 'restaurant') return MENUS[shop.id] ?? null;
  return (shop.kind && CATALOG_BY_KIND[shop.kind]) || null;
}

/** The sections of a list, in the order they first appear. */
export function sectionsOf(products: Product[]): string[] {
  return [...new Set(products.map((p) => p.section ?? ''))];
}
"""
open(os.path.join(ROOT, 'src/data/catalog.ts'), 'w').write(header + "\n".join(out) + "\n" + rest_block + footer)
total = sum(len(r) for _, r, _ in KINDS)
with_photo = sum(1 for _, rows, _ in KINDS for r in rows if r[5] and P.get(r[5]))
print('products', total, 'with photo', with_photo)
for const, rows, kind in KINDS:
    print(const, len(rows), sum(1 for r in rows if r[5] and P.get(r[5])))
