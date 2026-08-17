import {
  CLADDING_MATERIALS,
  FOUNDATIONS,
  FRAME_MATERIALS,
  INSULATION_MATERIALS,
  PURPOSE_OPTIONS,
  findMaterial,
  findRegion,
} from './data.js';

/**
 * @typedef {object} CalcInput
 * @property {'customer' | 'engineer'} mode
 * @property {'stationary' | 'mobile'} constructionType
 * @property {'seasonal' | 'winter' | 'permanent'} purpose
 * @property {number} diameter
 * @property {number} height
 * @property {number} people
 * @property {string} regionId
 * @property {string} foundationId
 * @property {string} frameId
 * @property {string} insulationId
 * @property {number} insulationMm
 * @property {string} claddingId
 * @property {string} windowsId
 * @property {string} doorId
 * @property {string} domeId
 * @property {string} heatingId
 * @property {string} ventId
 * @property {string} powerId
 * @property {string} waterId
 * @property {boolean} solar
 * @property {boolean} batteries
 * @property {number | null} overrideMaterialCost
 * @property {number | null} overrideMountCost
 * @property {number | null} overrideTransportCost
 */

/**
 * @typedef {object} CostLine
 * @property {string} label
 * @property {number} value
 */

/**
 * @typedef {object} CalcResult
 * @property {number} area
 * @property {number} wallArea
 * @property {number} roofArea
 * @property {CostLine[]} lines
 * @property {number} buildCost
 * @property {number} yearlyOps
 * @property {number} ownership10
 * @property {number} ownership20
 * @property {number} heatLossKw
 * @property {number} heatingKw
 * @property {'высокая' | 'средняя' | 'базовая'} energyClass
 * @property {number} massTons
 * @property {number} serviceYears
 * @property {'высокая' | 'средняя' | 'базовая'} autonomy
 * @property {string[]} warnings
 * @property {string} frameName
 * @property {string} insulationName
 * @property {string} claddingName
 * @property {string} regionName
 * @property {number} summerMax
 * @property {number} winterMin
 * @property {object} meta
 */

/**
 * Площадь круга
 * @param {number} diameter
 */
export function circleArea(diameter) {
  return Math.PI * (diameter / 2) ** 2;
}

/**
 * @param {CalcInput} input
 * @returns {CalcResult}
 */
export function calculateYurta(input) {
  const region = findRegion(input.regionId);
  const purpose = PURPOSE_OPTIONS.find((p) => p.id === input.purpose) ?? PURPOSE_OPTIONS[1];
  const foundation = FOUNDATIONS.find((f) => f.id === input.foundationId) ?? FOUNDATIONS[0];
  const frame = findMaterial(input.frameId, FRAME_MATERIALS) ?? FRAME_MATERIALS[0];
  const insulation =
    findMaterial(input.insulationId, INSULATION_MATERIALS) ?? INSULATION_MATERIALS[0];
  const cladding =
    findMaterial(input.claddingId, CLADDING_MATERIALS) ?? CLADDING_MATERIALS[0];

  const diameter = input.diameter;
  const height = input.height || Math.max(2.4, diameter * 0.35);
  const area = circleArea(diameter);
  // 1 уровень (техн.) + 2 уровень (жилая юрта) — считаем ограждающие поверхности
  const wallArea = Math.PI * diameter * height;
  const roofArea = area * 1.15;
  const envelope = wallArea + roofArea + area;

  const summerMax = region?.summerMax ?? 40;
  const winterMin = region?.winterMin ?? -40;
  const deltaT = purpose.heatTarget - winterMin;

  const thicknessM = Math.max(0.05, (input.insulationMm || 100) / 1000);
  const uValue = insulation.lambda / thicknessM;
  // Ориентировочные теплопотери, кВт
  const heatLossKw = Number(((envelope * uValue * deltaT) / 1000).toFixed(2));
  const heatingKw = Number((heatLossKw * 1.2).toFixed(1));

  /** @type {CostLine[]} */
  const lines = [];

  const foundationCost = Math.round(area * 55000 * foundation.costFactor);
  lines.push({ label: 'Основание (1 уровень)', value: foundationCost });

  const frameCost = Math.round(envelope * frame.costPerM2 * 0.35);
  lines.push({ label: `Каркас — ${frame.name}`, value: frameCost });

  const floorCost = Math.round(area * 28000);
  lines.push({ label: 'Перекрытие', value: floorCost });

  const insulationCost = Math.round(envelope * insulation.costPerM2 * (thicknessM / 0.1));
  lines.push({ label: `Утепление — ${insulation.name}`, value: insulationCost });

  const claddingCost = Math.round(envelope * cladding.costPerM2);
  lines.push({ label: `Наружная обшивка — ${cladding.name}`, value: claddingCost });

  const interiorCost = Math.round(area * 35000);
  lines.push({ label: 'Внутренняя отделка', value: interiorCost });

  const windowsCount = Number(input.windowsId) || 4;
  const windowsCost = windowsCount * 95000;
  lines.push({ label: `Окна × ${windowsCount}`, value: windowsCost });

  const doorCost =
    input.doorId === 'fire' ? 420000 : input.doorId === 'insulated' ? 280000 : 180000;
  lines.push({ label: 'Двери', value: doorCost });

  const domeCost =
    input.domeId === 'smart' ? 560000 : input.domeId === 'insulated' ? 420000 : 250000;
  lines.push({ label: 'Купол', value: domeCost });

  const heatingMap = {
    electric: 450000,
    solid: 380000,
    heat_pump: 1200000,
    hybrid: 900000,
  };
  const heatingCost = Math.round(
    (heatingMap[input.heatingId] ?? 450000) * (0.7 + heatingKw / 10)
  );
  lines.push({ label: 'Отопление', value: heatingCost });

  const ventMap = { natural: 80000, mech: 280000, hrv: 650000 };
  const ventCost = ventMap[input.ventId] ?? 80000;
  lines.push({ label: 'Вентиляция', value: ventCost });

  const powerCost = input.powerId === 'autonomous' ? 420000 : 150000;
  lines.push({ label: 'Электроснабжение', value: powerCost });

  const waterMap = { none: 0, basic: 220000, full: 480000 };
  const waterCost = waterMap[input.waterId] ?? 0;
  if (waterCost > 0) {
    lines.push({ label: 'Водоснабжение', value: waterCost });
  }

  let solarCost = 0;
  if (input.solar) {
    solarCost = Math.round(850000 + area * 12000);
    lines.push({ label: 'Солнечные панели', value: solarCost });
  }

  let batteryCost = 0;
  if (input.batteries) {
    batteryCost = Math.round(600000 + heatingKw * 40000);
    lines.push({ label: 'Аккумуляторы', value: batteryCost });
  }

  let materialsSum = lines.reduce((s, l) => s + l.value, 0);

  if (input.overrideMaterialCost != null && input.overrideMaterialCost > 0) {
    const scale = input.overrideMaterialCost / materialsSum;
    lines.forEach((l) => {
      l.value = Math.round(l.value * scale);
    });
    materialsSum = input.overrideMaterialCost;
  }

  const mountDefault = Math.round(materialsSum * 0.18);
  const transportDefault = Math.round(
    materialsSum * (input.constructionType === 'mobile' ? 0.08 : 0.05)
  );
  const mountCost =
    input.overrideMountCost != null && input.overrideMountCost >= 0
      ? input.overrideMountCost
      : mountDefault;
  const transportCost =
    input.overrideTransportCost != null && input.overrideTransportCost >= 0
      ? input.overrideTransportCost
      : transportDefault;

  lines.push({ label: 'Монтаж', value: mountCost });
  lines.push({ label: 'Транспортировка', value: transportCost });

  if (input.constructionType === 'mobile') {
    const assemble = Math.round(materialsSum * 0.04);
    lines.push({ label: 'Сборка / разборка (передвижная)', value: assemble });
  }

  const buildCost = lines.reduce((s, l) => s + l.value, 0);

  // Эксплуатация: отопление + обслуживание
  const energyPrice = 30; // ₸/кВт·ч ориентир
  const hoursYear = purpose.id === 'seasonal' ? 1200 : 3500;
  const yearlyOps = Math.round(heatingKw * hoursYear * energyPrice * 0.35 + buildCost * 0.015);
  const ownership10 = buildCost + yearlyOps * 10;
  const ownership20 = buildCost + yearlyOps * 20;

  /** @type {string[]} */
  const warnings = [];

  if (!frame.nonCombustible || !insulation.nonCombustible || !cladding.nonCombustible) {
    warnings.push(
      '⚠️ Выбранный материал имеет недостаточные показатели пожаробезопасности.'
    );
  }

  if (input.insulationMm < purpose.insulationMinMm) {
    warnings.push(
      '⚠️ Недостаточная теплоизоляция для выбранного температурного режима.'
    );
  }

  if (winterMin <= -40 && input.insulationMm < 150) {
    warnings.push(
      '⚠️ Для выбранного региона требуется усиленное утепление (рекомендуется ≥ 150 мм).'
    );
  }

  if (heatingKw > 12 && input.heatingId === 'electric' && !input.solar) {
    warnings.push('⚠️ Недостаточная мощность / автономность системы отопления.');
  }

  if (input.constructionType === 'mobile' && !foundation.mobileOk) {
    warnings.push(
      '⚠️ Выбранное основание плохо подходит для разборно-передвижной юрты.'
    );
  }

  if (frame.strength < 7 && diameter >= 8) {
    warnings.push('⚠️ Требуется усиление конструкции для выбранного диаметра.');
  }

  // Энергоэффективность
  const heatPerM2 = heatLossKw / area;
  /** @type {'высокая' | 'средняя' | 'базовая'} */
  let energyClass = 'базовая';
  if (heatPerM2 < 0.08 && input.insulationMm >= 150) {
    energyClass = 'высокая';
  } else if (heatPerM2 < 0.14) {
    energyClass = 'средняя';
  }

  const massTons = Number(
    (
      foundation.massTonsBase * (diameter / 5) +
      envelope * frame.massFactor * 0.02 +
      envelope * insulation.massFactor * (thicknessM / 0.1) +
      envelope * cladding.massFactor
    ).toFixed(1)
  );

  const serviceYears = Math.min(
    frame.durabilityYears,
    insulation.durabilityYears,
    cladding.durabilityYears,
    foundation.durabilityYears
  );

  let autonomyScore = 0;
  if (input.solar) autonomyScore += 3;
  if (input.batteries) autonomyScore += 3;
  if (input.powerId === 'autonomous') autonomyScore += 2;
  if (input.heatingId === 'hybrid' || input.heatingId === 'heat_pump') autonomyScore += 2;
  if (input.waterId === 'full') autonomyScore += 1;
  /** @type {'высокая' | 'средняя' | 'базовая'} */
  const autonomy =
    autonomyScore >= 7 ? 'высокая' : autonomyScore >= 4 ? 'средняя' : 'базовая';

  return {
    area: Number(area.toFixed(1)),
    wallArea: Number(wallArea.toFixed(1)),
    roofArea: Number(roofArea.toFixed(1)),
    lines,
    buildCost,
    yearlyOps,
    ownership10,
    ownership20,
    heatLossKw,
    heatingKw,
    energyClass,
    massTons,
    serviceYears,
    autonomy,
    warnings,
    frameName: frame.name,
    insulationName: insulation.name,
    claddingName: cladding.name,
    regionName: region?.name ?? '—',
    summerMax,
    winterMin,
    meta: {
      diameter,
      height,
      people: input.people,
      purpose: purpose.name,
      constructionType:
        input.constructionType === 'mobile' ? 'Разборно-передвижная' : 'Стационарная',
    },
  };
}

/**
 * Три готовых варианта сравнения
 * @param {CalcInput} base
 */
export function buildComparisonVariants(base) {
  /** @type {Array<{ key: string, title: string, input: CalcInput }>} */
  const variants = [
    {
      key: 'eco',
      title: 'Эконом',
      input: {
        ...base,
        frameId: 'steel',
        insulationId: 'mineral',
        insulationMm: Math.max(100, PURPOSE_OPTIONS.find((p) => p.id === base.purpose)?.insulationMinMm ?? 100),
        claddingId: 'profiled_sheet',
        foundationId: base.constructionType === 'mobile' ? 'metal' : 'metal',
        heatingId: 'electric',
        ventId: 'natural',
        powerId: 'grid',
        waterId: 'basic',
        solar: false,
        batteries: false,
        doorId: 'insulated',
        domeId: 'basic',
      },
    },
    {
      key: 'optimal',
      title: 'Оптимальный',
      input: {
        ...base,
        frameId: 'galv_steel',
        insulationId: 'basalt',
        insulationMm: Math.max(150, PURPOSE_OPTIONS.find((p) => p.id === base.purpose)?.insulationMinMm ?? 150),
        claddingId: 'metal_panel',
        foundationId: base.constructionType === 'mobile' ? 'metal' : 'pile',
        heatingId: 'hybrid',
        ventId: 'mech',
        powerId: 'grid',
        waterId: 'full',
        solar: true,
        batteries: false,
        doorId: 'insulated',
        domeId: 'insulated',
      },
    },
    {
      key: 'premium',
      title: 'Премиальный / автономный',
      input: {
        ...base,
        frameId: 'combo_metal',
        insulationId: 'certified_nc',
        insulationMm: Math.max(200, PURPOSE_OPTIONS.find((p) => p.id === base.purpose)?.insulationMinMm ?? 200),
        claddingId: 'facade_nc',
        foundationId: base.constructionType === 'mobile' ? 'metal' : 'concrete',
        heatingId: 'heat_pump',
        ventId: 'hrv',
        powerId: 'autonomous',
        waterId: 'full',
        solar: true,
        batteries: true,
        doorId: 'fire',
        domeId: 'smart',
      },
    },
  ];

  return variants.map((v) => ({
    key: v.key,
    title: v.title,
    result: calculateYurta(v.input),
    input: v.input,
  }));
}

/**
 * @param {number} value
 * @returns {string}
 */
export function formatTenge(value) {
  return `${new Intl.NumberFormat('ru-RU').format(Math.round(value))} ₸`;
}
