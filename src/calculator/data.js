/**
 * База данных калькулятора современной юрты (цены в ₸)
 */

/** @typedef {{ id: string, name: string, summerMax: number, winterMin: number }} Region */

/** Области РК + города республиканского значения */
/** @type {Region[]} */
export const REGIONS = [
  { id: 'abay', name: 'Абайская область', summerMax: 40, winterMin: -42 },
  { id: 'akmola', name: 'Акмолинская область', summerMax: 40, winterMin: -45 },
  { id: 'aktobe', name: 'Актюбинская область', summerMax: 42, winterMin: -40 },
  { id: 'almaty_obl', name: 'Алматинская область', summerMax: 40, winterMin: -35 },
  { id: 'atyrau', name: 'Атырауская область', summerMax: 44, winterMin: -30 },
  { id: 'vko', name: 'Восточно-Казахстанская область', summerMax: 38, winterMin: -45 },
  { id: 'zhambyl', name: 'Жамбылская область', summerMax: 42, winterMin: -35 },
  { id: 'zhetisu', name: 'Область Жетісу', summerMax: 40, winterMin: -38 },
  { id: 'zko', name: 'Западно-Казахстанская область', summerMax: 42, winterMin: -38 },
  { id: 'karaganda', name: 'Карагандинская область', summerMax: 40, winterMin: -42 },
  { id: 'kostanay', name: 'Костанайская область', summerMax: 40, winterMin: -42 },
  { id: 'kyzylorda', name: 'Кызылординская область', summerMax: 45, winterMin: -32 },
  { id: 'mangystau', name: 'Мангистауская область', summerMax: 44, winterMin: -28 },
  { id: 'pavlodar', name: 'Павлодарская область', summerMax: 42, winterMin: -49 },
  { id: 'sko', name: 'Северо-Казахстанская область', summerMax: 38, winterMin: -45 },
  { id: 'turkestan', name: 'Туркестанская область', summerMax: 45, winterMin: -28 },
  { id: 'ulytau', name: 'Область Ұлытау', summerMax: 40, winterMin: -40 },
  { id: 'astana', name: 'г. Астана', summerMax: 40, winterMin: -45 },
  { id: 'almaty', name: 'г. Алматы', summerMax: 40, winterMin: -30 },
  { id: 'shymkent', name: 'г. Шымкент', summerMax: 44, winterMin: -25 },
];

/**
 * @typedef {object} Material
 * @property {string} id
 * @property {string} name
 * @property {string} desc — краткое пояснение
 * @property {string} category
 * @property {number} costPerM2
 * @property {number} density
 * @property {number} strength
 * @property {number} lambda
 * @property {string} fireClass
 * @property {boolean} nonCombustible
 * @property {number} moisture
 * @property {number} durabilityYears
 * @property {number} massFactor
 */

/** @type {Material[]} */
export const FRAME_MATERIALS = [
  {
    id: 'steel',
    name: 'Конструкционная сталь',
    desc: 'Прочный несущий каркас из стали. Высокая нагрузка, негорючий, тяжелее алюминия.',
    category: 'frame',
    costPerM2: 85000,
    density: 7850,
    strength: 9,
    lambda: 50,
    fireClass: 'НГ (негорючий каркас)',
    nonCombustible: true,
    moisture: 6,
    durabilityYears: 50,
    massFactor: 1.2,
  },
  {
    id: 'galv_steel',
    name: 'Оцинкованная сталь',
    desc: 'Стальной каркас с цинковым покрытием. Лучше защищён от коррозии, чем обычная сталь.',
    category: 'frame',
    costPerM2: 95000,
    density: 7850,
    strength: 9,
    lambda: 50,
    fireClass: 'НГ',
    nonCombustible: true,
    moisture: 8,
    durabilityYears: 55,
    massFactor: 1.15,
  },
  {
    id: 'aluminum',
    name: 'Алюминиевый конструкционный профиль',
    desc: 'Лёгкий металлический каркас. Удобен для перевозки, не ржавеет, чуть мягче стали.',
    category: 'frame',
    costPerM2: 120000,
    density: 2700,
    strength: 7,
    lambda: 160,
    fireClass: 'НГ',
    nonCombustible: true,
    moisture: 9,
    durabilityYears: 45,
    massFactor: 0.55,
  },
  {
    id: 'combo_metal',
    name: 'Комбинированный металлический каркас',
    desc: 'Сочетание разных металлов. Баланс прочности, массы и долговечности.',
    category: 'frame',
    costPerM2: 110000,
    density: 5200,
    strength: 8,
    lambda: 80,
    fireClass: 'НГ',
    nonCombustible: true,
    moisture: 8,
    durabilityYears: 50,
    massFactor: 0.9,
  },
];

/** @type {Material[]} */
export const INSULATION_MATERIALS = [
  {
    id: 'basalt',
    name: 'Базальтовая / каменная вата',
    desc: 'Негорючий утеплитель из каменных волокон. Хорошо держит тепло и звук.',
    category: 'insulation',
    costPerM2: 4500,
    density: 80,
    strength: 5,
    lambda: 0.037,
    fireClass: 'НГ',
    nonCombustible: true,
    moisture: 6,
    durabilityYears: 40,
    massFactor: 0.08,
  },
  {
    id: 'mineral',
    name: 'Минеральная вата',
    desc: 'Доступный негорючий утеплитель. Дешевле базальта, чуть слабее по сроку службы.',
    category: 'insulation',
    costPerM2: 3200,
    density: 60,
    strength: 4,
    lambda: 0.04,
    fireClass: 'НГ',
    nonCombustible: true,
    moisture: 5,
    durabilityYears: 30,
    massFactor: 0.06,
  },
  {
    id: 'noncomb_board',
    name: 'Негорючие теплоизоляционные плиты',
    desc: 'Жёсткие плиты утеплителя. Стабильная форма, высокая пожаробезопасность.',
    category: 'insulation',
    costPerM2: 7800,
    density: 120,
    strength: 7,
    lambda: 0.034,
    fireClass: 'НГ',
    nonCombustible: true,
    moisture: 8,
    durabilityYears: 45,
    massFactor: 0.12,
  },
  {
    id: 'certified_nc',
    name: 'Сертифицированный негорючий утеплитель',
    desc: 'Премиальный негорючий утеплитель с подтверждёнными характеристиками.',
    category: 'insulation',
    costPerM2: 9200,
    density: 100,
    strength: 7,
    lambda: 0.032,
    fireClass: 'НГ (сертифицирован)',
    nonCombustible: true,
    moisture: 8,
    durabilityYears: 50,
    massFactor: 0.1,
  },
];

/** @type {Material[]} */
export const CLADDING_MATERIALS = [
  {
    id: 'metal_panel',
    name: 'Металлические панели',
    desc: 'Готовые панели наружной стены. Прочные, влагостойкие, быстро монтируются.',
    category: 'cladding',
    costPerM2: 12000,
    density: 7800,
    strength: 8,
    lambda: 45,
    fireClass: 'НГ',
    nonCombustible: true,
    moisture: 9,
    durabilityYears: 40,
    massFactor: 0.15,
  },
  {
    id: 'profiled_sheet',
    name: 'Профилированный металлический лист',
    desc: 'Профнастил. Экономичная наружная обшивка, защищает от дождя и ветра.',
    category: 'cladding',
    costPerM2: 8500,
    density: 7800,
    strength: 7,
    lambda: 45,
    fireClass: 'НГ',
    nonCombustible: true,
    moisture: 8,
    durabilityYears: 35,
    massFactor: 0.12,
  },
  {
    id: 'fiber_cement',
    name: 'Фиброцементные панели',
    desc: 'Панели на основе цемента и волокон. Негорят, устойчивы к влаге и ударам.',
    category: 'cladding',
    costPerM2: 15000,
    density: 1400,
    strength: 8,
    lambda: 0.25,
    fireClass: 'НГ',
    nonCombustible: true,
    moisture: 8,
    durabilityYears: 45,
    massFactor: 0.22,
  },
  {
    id: 'facade_nc',
    name: 'Негорючие фасадные панели',
    desc: 'Сертифицированная фасадная обшивка. Максимум по пожаробезопасности и сроку службы.',
    category: 'cladding',
    costPerM2: 18000,
    density: 1200,
    strength: 8,
    lambda: 0.2,
    fireClass: 'НГ (сертифицирован)',
    nonCombustible: true,
    moisture: 9,
    durabilityYears: 50,
    massFactor: 0.2,
  },
];

/** Готовые комплекты обшивка+утепление для инженера */
export const SHELL_PACKAGES = [
  {
    id: 'eco',
    name: 'Эконом: профнастил + минеральная вата',
    desc: 'Базовый комплект стены: дешевле, достаточен для умеренных требований.',
    claddingId: 'profiled_sheet',
    insulationId: 'mineral',
    thicknessMm: 100,
  },
  {
    id: 'optimal',
    name: 'Оптимальный: металлпанели + базальт',
    desc: 'Баланс цены, тепла и пожаробезопасности для большинства регионов.',
    claddingId: 'metal_panel',
    insulationId: 'basalt',
    thicknessMm: 150,
  },
  {
    id: 'premium',
    name: 'Премиум: фасад НГ + сертифицированный утеплитель',
    desc: 'Максимальная энергоэффективность и пожаробезопасность комплекта стены.',
    claddingId: 'facade_nc',
    insulationId: 'certified_nc',
    thicknessMm: 200,
  },
];

export const FOUNDATIONS = [
  {
    id: 'metal',
    name: 'Металлическое основание',
    desc: 'Лёгкий 1-й уровень из металла. Подходит для передвижной юрты, быстрее монтируется.',
    costFactor: 1,
    massTonsBase: 1.2,
    mobileOk: true,
    durabilityYears: 40,
  },
  {
    id: 'pile',
    name: 'Свайное основание с металлическим ростверком',
    desc: 'Сваи в грунте + металлическая рама сверху. Стабильно на слабых и пучинистых грунтах.',
    costFactor: 1.35,
    massTonsBase: 2.5,
    mobileOk: false,
    durabilityYears: 50,
  },
  {
    id: 'concrete',
    name: 'Железобетонное основание',
    desc: 'Капитальный бетонный 1-й уровень. Максимальная прочность, только для стационарной юрты.',
    costFactor: 1.6,
    massTonsBase: 8,
    mobileOk: false,
    durabilityYears: 60,
  },
];

export const PURPOSE_OPTIONS = [
  { id: 'seasonal', name: 'Сезонная', insulationMinMm: 80, heatTarget: 20 },
  { id: 'winter', name: 'Зимняя', insulationMinMm: 150, heatTarget: 22 },
  { id: 'permanent', name: 'Постоянное проживание', insulationMinMm: 200, heatTarget: 22 },
];

export const CONSTRUCTION_TYPES = [
  {
    id: 'stationary',
    name: 'Стационарная',
    desc: 'Юрта ставится на постоянное место. Можно выбрать тяжёлое основание и максимальную прочность.',
  },
  {
    id: 'mobile',
    name: 'Разборно-передвижная',
    desc: 'Конструкцию можно разобрать и перевезти. Важны меньшая масса и металлическое основание.',
  },
];

export const DIAMETERS = [4, 5, 6, 7, 8, 9, 10];

export const HEATING_OPTIONS = [
  { id: 'electric', name: 'Электрическое', costBase: 450000, autonomy: 2 },
  { id: 'solid', name: 'Твёрдотопливное', costBase: 380000, autonomy: 4 },
  { id: 'heat_pump', name: 'Тепловой насос', costBase: 1200000, autonomy: 6 },
  { id: 'hybrid', name: 'Гибридное', costBase: 900000, autonomy: 7 },
];

export const VENT_OPTIONS = [
  { id: 'natural', name: 'Естественная', cost: 80000 },
  { id: 'mech', name: 'Механическая', cost: 280000 },
  { id: 'hrv', name: 'Приточно-вытяжная с рекуперацией', cost: 650000 },
];

export const POWER_OPTIONS = [
  { id: 'grid', name: 'Сеть', cost: 150000 },
  { id: 'autonomous', name: 'Автономное', cost: 420000 },
];

export const WATER_OPTIONS = [
  { id: 'none', name: 'Без водоснабжения', cost: 0 },
  { id: 'basic', name: 'Базовое', cost: 220000 },
  { id: 'full', name: 'Полное', cost: 480000 },
];

export const WINDOW_OPTIONS = [
  {
    id: '2',
    name: '2 окна',
    desc: 'Минимум света. Меньше теплопотерь через остекление.',
    count: 2,
    costEach: 95000,
  },
  {
    id: '4',
    name: '4 окна',
    desc: 'Оптимальный баланс освещения и тепла для большинства юрт.',
    count: 4,
    costEach: 95000,
  },
  {
    id: '6',
    name: '6 окон',
    desc: 'Больше дневного света и обзора. Теплопотери через окна выше.',
    count: 6,
    costEach: 95000,
  },
];

export const DOOR_OPTIONS = [
  {
    id: 'standard',
    name: 'Стандартная дверь',
    desc: 'Обычный входной блок. Подходит для сезонного использования.',
  },
  {
    id: 'insulated',
    name: 'Утеплённая дверь',
    desc: 'Дверь с теплоизоляцией. Снижает сквозняки и потери тепла зимой.',
  },
  {
    id: 'fire',
    name: 'Противопожарная дверь',
    desc: 'Усиленная негорючая дверь. Выше пожаробезопасность и прочность.',
  },
];

export const DOME_OPTIONS = [
  {
    id: 'basic',
    name: 'Базовый купол',
    desc: 'Верхний световой / вентиляционный узел без усиленного утепления.',
  },
  {
    id: 'insulated',
    name: 'Утеплённый купол',
    desc: 'Купол с теплоизоляцией. Важен для зимней и постоянной эксплуатации.',
  },
  {
    id: 'smart',
    name: 'Купол с вентиляцией',
    desc: 'Купол с управляемой вентиляцией. Лучше воздухообмен и комфорт.',
  },
];

/**
 * @param {string} id
 * @param {Material[]} list
 * @returns {Material | undefined}
 */
export function findMaterial(id, list) {
  return list.find((m) => m.id === id);
}

/**
 * @param {string} regionId
 * @returns {Region | undefined}
 */
export function findRegion(regionId) {
  return REGIONS.find((r) => r.id === regionId);
}
