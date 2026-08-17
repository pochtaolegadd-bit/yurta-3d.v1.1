import {
  CLADDING_MATERIALS,
  CONSTRUCTION_TYPES,
  DIAMETERS,
  DOOR_OPTIONS,
  DOME_OPTIONS,
  FOUNDATIONS,
  FRAME_MATERIALS,
  HEATING_OPTIONS,
  INSULATION_MATERIALS,
  POWER_OPTIONS,
  PURPOSE_OPTIONS,
  REGIONS,
  SHELL_PACKAGES,
  VENT_OPTIONS,
  WATER_OPTIONS,
  WINDOW_OPTIONS,
  findRegion,
} from './data.js';
import {
  buildComparisonVariants,
  calculateYurta,
  formatTenge,
} from './engine.js';

/** @typedef {import('./engine.js').CalcInput} CalcInput */
/** @typedef {import('./engine.js').CalcResult} CalcResult */

const DISCLAIMER = `Калькулятор является предварительным технико-экономическим инструментом.

Он не заменяет полноценный проект и окончательный инженерный расчёт:
• несущих конструкций;
• фундамента;
• соединений;
• пожарной безопасности;
• инженерных систем.

Окончательные решения должны подтверждаться проектной документацией и расчётами специалиста.`;

/**
 * @returns {CalcInput}
 */
function defaultInput() {
  return {
    mode: 'customer',
    constructionType: 'stationary',
    purpose: 'winter',
    diameter: 6,
    height: 3.2,
    people: 4,
    regionId: 'pavlodar',
    foundationId: 'pile',
    frameId: 'galv_steel',
    insulationId: 'basalt',
    insulationMm: 150,
    claddingId: 'metal_panel',
    windowsId: '4',
    doorId: 'insulated',
    domeId: 'insulated',
    heatingId: 'hybrid',
    ventId: 'mech',
    powerId: 'grid',
    waterId: 'full',
    solar: false,
    batteries: false,
    overrideMaterialCost: null,
    overrideMountCost: null,
    overrideTransportCost: null,
  };
}

/**
 * @param {HTMLElement} root
 */
export function initCalculator(root) {
  /** @type {'home' | 'customer' | 'engineer' | 'result'} */
  let screen = 'home';
  /** @type {CalcInput} */
  let input = defaultInput();
  let customerStep = 0;
  /** @type {CalcResult | null} */
  let lastResult = null;
  /** @type {ReturnType<typeof buildComparisonVariants> | null} */
  let comparison = null;
  /** @type {CalcInput | null} */
  let selectedVariantInput = null;

  const customerSteps = [
    'Тип и назначение',
    'Размер и вместимость',
    'Регион',
    'Конструкция',
    'Материалы',
    'Окна, двери, купол',
    'Инженерия',
  ];

  function render() {
    root.innerHTML = '';
    root.appendChild(renderChrome());

    const body = document.createElement('div');
    body.className = 'calc-body';

    if (screen === 'home') {
      body.appendChild(renderHome());
    } else if (screen === 'customer') {
      body.appendChild(renderCustomer());
    } else if (screen === 'engineer') {
      body.appendChild(renderEngineer());
    } else if (screen === 'result') {
      body.appendChild(renderResult());
    }

    body.appendChild(renderDisclaimer());
    root.appendChild(body);
  }

  function renderChrome() {
    const bar = document.createElement('div');
    bar.className = 'calc-chrome';

    const title = document.createElement('div');
    title.className = 'calc-chrome-title';
    title.innerHTML = '<strong>Калькулятор стоимости юрты</strong><span>₸ · РК</span>';

    const actions = document.createElement('div');
    actions.className = 'calc-chrome-actions';

    const homeBtn = document.createElement('button');
    homeBtn.type = 'button';
    homeBtn.className = 'calc-chip';
    homeBtn.textContent = 'В начало';
    homeBtn.addEventListener('click', () => {
      screen = 'home';
      customerStep = 0;
      render();
    });

    actions.append(homeBtn);
    bar.append(title, actions);
    return bar;
  }

  function renderHome() {
    const wrap = document.createElement('div');
    wrap.className = 'calc-home';

    const h = document.createElement('h1');
    h.textContent = 'Калькулятор стоимости юрты';

    const p = document.createElement('p');
    p.textContent =
      'Предварительный расчёт современной двухуровневой юрты с учётом региона Казахстана, материалов и инженерных систем.';

    const modes = document.createElement('div');
    modes.className = 'calc-mode-grid';

    modes.appendChild(
      modeCard(
        'Заказчик',
        'Простой пошаговый выбор параметров без технических формул.',
        () => {
          input = { ...defaultInput(), mode: 'customer' };
          customerStep = 0;
          screen = 'customer';
          render();
        }
      )
    );

    modes.appendChild(
      modeCard(
        'Инженер',
        'Расширенная, но простая настройка основных технических параметров.',
        () => {
          input = { ...defaultInput(), mode: 'engineer' };
          screen = 'engineer';
          render();
        }
      )
    );

    wrap.append(h, p, modes);
    return wrap;
  }

  /**
   * @param {string} title
   * @param {string} text
   * @param {() => void} onClick
   */
  function modeCard(title, text, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'calc-mode-card';
    btn.innerHTML = `<strong>${title}</strong><span>${text}</span>`;
    btn.addEventListener('click', onClick);
    return btn;
  }

  /** Справка всегда открыта внизу калькулятора */
  function renderDisclaimer() {
    const wrap = document.createElement('aside');
    wrap.className = 'calc-help-footer';
    wrap.setAttribute('aria-label', 'Справка');

    const h = document.createElement('h2');
    h.textContent = 'Справка';

    const box = document.createElement('div');
    box.className = 'calc-disclaimer';
    box.textContent = DISCLAIMER;

    wrap.append(h, box);
    return wrap;
  }

  function renderCustomer() {
    const wrap = document.createElement('div');
    wrap.className = 'calc-wizard';

    const progress = document.createElement('div');
    progress.className = 'calc-progress';
    progress.innerHTML = customerSteps
      .map(
        (label, i) =>
          `<span class="calc-progress-item${i === customerStep ? ' is-active' : ''}${i < customerStep ? ' is-done' : ''}">${i + 1}. ${label}</span>`
      )
      .join('');
    wrap.appendChild(progress);

    const panel = document.createElement('div');
    panel.className = 'calc-panel';
    panel.appendChild(renderCustomerStep());
    wrap.appendChild(panel);

    const nav = document.createElement('div');
    nav.className = 'calc-nav-row';

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'calc-btn calc-btn--ghost';
    back.textContent = customerStep === 0 ? 'К выбору режима' : 'Назад';
    back.addEventListener('click', () => {
      if (customerStep === 0) {
        screen = 'home';
      } else {
        customerStep -= 1;
      }
      render();
    });

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'calc-btn';
    next.textContent =
      customerStep === customerSteps.length - 1 ? 'Рассчитать' : 'Далее';
    next.addEventListener('click', () => {
      if (customerStep === customerSteps.length - 1) {
        runCalculation();
      } else {
        customerStep += 1;
        render();
      }
    });

    nav.append(back, next);
    wrap.appendChild(nav);
    return wrap;
  }

  function renderCustomerStep() {
    const frag = document.createElement('div');
    frag.className = 'calc-fields';

    if (customerStep === 0) {
      frag.appendChild(
        selectField(
          'Тип конструкции',
          CONSTRUCTION_TYPES,
          input.constructionType,
          (v) => {
            input.constructionType = /** @type {'stationary' | 'mobile'} */ (v);
          }
        )
      );
      frag.appendChild(
        selectField('Назначение', PURPOSE_OPTIONS, input.purpose, (v) => {
          input.purpose = /** @type {CalcInput['purpose']} */ (v);
          const p = PURPOSE_OPTIONS.find((x) => x.id === v);
          if (p) {
            input.insulationMm = Math.max(input.insulationMm, p.insulationMinMm);
          }
        })
      );
    }

    if (customerStep === 1) {
      frag.appendChild(
        selectField(
          'Диаметр',
          DIAMETERS.map((d) => ({ id: String(d), name: `${d} м` })),
          String(input.diameter),
          (v) => {
            input.diameter = Number(v);
            input.height = Number((Math.max(2.4, input.diameter * 0.35)).toFixed(1));
            render();
          }
        )
      );
      const areaHint = document.createElement('p');
      areaHint.className = 'calc-hint';
      const area = Math.PI * (input.diameter / 2) ** 2;
      areaHint.textContent = `Площадь жилого уровня ≈ ${area.toFixed(1)} м² · высота ≈ ${input.height} м`;
      frag.appendChild(areaHint);

      frag.appendChild(
        numberField('Количество человек', input.people, 1, 20, (v) => {
          input.people = v;
        })
      );
    }

    if (customerStep === 2) {
      frag.appendChild(
        selectField('Область / город Казахстана', REGIONS, input.regionId, (v) => {
          input.regionId = v;
        })
      );
      const region = findRegion(input.regionId);
      if (region) {
        const climate = document.createElement('div');
        climate.className = 'calc-climate';
        climate.innerHTML = `<strong>${region.name}</strong>
          <span>Лето: до +${region.summerMax} °C</span>
          <span>Зима: до ${region.winterMin} °C</span>
          <em>Температура подставляется автоматически</em>`;
        frag.appendChild(climate);
      }
    }

    if (customerStep === 3) {
      frag.appendChild(
        selectField('Основание', FOUNDATIONS, input.foundationId, (v) => {
          input.foundationId = v;
        })
      );
      frag.appendChild(
        selectField('Каркас (без древесины)', FRAME_MATERIALS, input.frameId, (v) => {
          input.frameId = v;
        })
      );
    }

    if (customerStep === 4) {
      frag.appendChild(
        selectField('Утеплитель', INSULATION_MATERIALS, input.insulationId, (v) => {
          input.insulationId = v;
        })
      );
      frag.appendChild(
        numberField('Толщина утеплителя, мм', input.insulationMm, 50, 300, (v) => {
          input.insulationMm = v;
        }, 10)
      );
      frag.appendChild(
        selectField('Наружная обшивка', CLADDING_MATERIALS, input.claddingId, (v) => {
          input.claddingId = v;
        })
      );
      const mat = document.createElement('p');
      mat.className = 'calc-hint';
      mat.textContent =
        'Характеристики материалов (теплопроводность, пожарный класс, долговечность) подставляются из базы автоматически.';
      frag.appendChild(mat);
    }

    if (customerStep === 5) {
      frag.appendChild(
        selectField('Окна', WINDOW_OPTIONS, input.windowsId, (v) => {
          input.windowsId = v;
        })
      );
      frag.appendChild(
        selectField('Двери', DOOR_OPTIONS, input.doorId, (v) => {
          input.doorId = v;
        })
      );
      frag.appendChild(
        selectField('Купол', DOME_OPTIONS, input.domeId, (v) => {
          input.domeId = v;
        })
      );
    }

    if (customerStep === 6) {
      frag.appendChild(
        selectField('Отопление', HEATING_OPTIONS, input.heatingId, (v) => {
          input.heatingId = v;
        })
      );
      frag.appendChild(
        selectField('Вентиляция', VENT_OPTIONS, input.ventId, (v) => {
          input.ventId = v;
        })
      );
      frag.appendChild(
        selectField('Электроснабжение', POWER_OPTIONS, input.powerId, (v) => {
          input.powerId = v;
        })
      );
      frag.appendChild(
        selectField('Водоснабжение', WATER_OPTIONS, input.waterId, (v) => {
          input.waterId = v;
        })
      );
      frag.appendChild(
        checkField('Солнечные панели', input.solar, (v) => {
          input.solar = v;
        })
      );
      frag.appendChild(
        checkField('Аккумуляторы', input.batteries, (v) => {
          input.batteries = v;
        })
      );
    }

    return frag;
  }

  function renderEngineer() {
    const wrap = document.createElement('div');
    wrap.className = 'calc-wizard';

    const panel = document.createElement('div');
    panel.className = 'calc-panel';
    const fields = document.createElement('div');
    fields.className = 'calc-fields';

    fields.appendChild(sectionTitle('1. Размер'));
    fields.appendChild(
      selectField(
        'Диаметр',
        DIAMETERS.map((d) => ({ id: String(d), name: `${d} м` })),
        String(input.diameter),
        (v) => {
          input.diameter = Number(v);
        }
      )
    );
    fields.appendChild(
      numberField('Высота, м', input.height, 2.2, 5, (v) => {
        input.height = v;
      }, 0.1)
    );
    fields.appendChild(
      numberField('Количество человек', input.people, 1, 20, (v) => {
        input.people = v;
      })
    );
    fields.appendChild(
      selectField('Тип конструкции', CONSTRUCTION_TYPES, input.constructionType, (v) => {
        input.constructionType = /** @type {'stationary' | 'mobile'} */ (v);
      })
    );
    fields.appendChild(
      selectField('Назначение', PURPOSE_OPTIONS, input.purpose, (v) => {
        input.purpose = /** @type {CalcInput['purpose']} */ (v);
      })
    );

    fields.appendChild(sectionTitle('2. Каркас'));
    fields.appendChild(
      selectField('Материал каркаса', FRAME_MATERIALS, input.frameId, (v) => {
        input.frameId = v;
      })
    );

    fields.appendChild(sectionTitle('3. Обшивка + утепление'));
    fields.appendChild(
      selectField(
        'Готовый вариант',
        SHELL_PACKAGES,
        SHELL_PACKAGES.find(
          (p) =>
            p.claddingId === input.claddingId && p.insulationId === input.insulationId
        )?.id ?? 'optimal',
        (v) => {
          const pack = SHELL_PACKAGES.find((p) => p.id === v);
          if (pack) {
            input.claddingId = pack.claddingId;
            input.insulationId = pack.insulationId;
            input.insulationMm = pack.thicknessMm;
          }
          render();
        }
      )
    );
    fields.appendChild(
      numberField('Толщина утеплителя, мм', input.insulationMm, 50, 300, (v) => {
        input.insulationMm = v;
      }, 10)
    );

    fields.appendChild(sectionTitle('4. Основание'));
    fields.appendChild(
      selectField('Основание', FOUNDATIONS, input.foundationId, (v) => {
        input.foundationId = v;
      })
    );

    fields.appendChild(sectionTitle('5. Климат'));
    fields.appendChild(
      selectField('Область Казахстана', REGIONS, input.regionId, (v) => {
        input.regionId = v;
        render();
      })
    );
    const region = findRegion(input.regionId);
    if (region) {
      const climate = document.createElement('div');
      climate.className = 'calc-climate';
      climate.innerHTML = `<strong>${region.name}</strong>
        <span>Лето: до +${region.summerMax} °C</span>
        <span>Зима: до ${region.winterMin} °C</span>`;
      fields.appendChild(climate);
    }

    fields.appendChild(sectionTitle('6. Инженерия'));
    fields.appendChild(
      selectField('Отопление', HEATING_OPTIONS, input.heatingId, (v) => {
        input.heatingId = v;
      })
    );
    fields.appendChild(
      selectField('Вентиляция', VENT_OPTIONS, input.ventId, (v) => {
        input.ventId = v;
      })
    );
    fields.appendChild(
      selectField('Электроснабжение', POWER_OPTIONS, input.powerId, (v) => {
        input.powerId = v;
      })
    );
    fields.appendChild(
      selectField('Водоснабжение', WATER_OPTIONS, input.waterId, (v) => {
        input.waterId = v;
      })
    );
    fields.appendChild(
      checkField('Солнечная система', input.solar, (v) => {
        input.solar = v;
      })
    );
    fields.appendChild(
      checkField('Аккумуляторы', input.batteries, (v) => {
        input.batteries = v;
      })
    );

    fields.appendChild(sectionTitle('7. Стоимость (опционально)'));
    fields.appendChild(
      numberField(
        'Переопределить стоимость материалов, ₸ (0 = авто)',
        input.overrideMaterialCost ?? 0,
        0,
        500000000,
        (v) => {
          input.overrideMaterialCost = v > 0 ? v : null;
        },
        1000
      )
    );
    fields.appendChild(
      numberField(
        'Стоимость монтажа, ₸ (0 = авто)',
        input.overrideMountCost ?? 0,
        0,
        100000000,
        (v) => {
          input.overrideMountCost = v > 0 ? v : null;
        },
        1000
      )
    );
    fields.appendChild(
      numberField(
        'Стоимость транспортировки, ₸ (0 = авто)',
        input.overrideTransportCost ?? 0,
        0,
        100000000,
        (v) => {
          input.overrideTransportCost = v > 0 ? v : null;
        },
        1000
      )
    );

    panel.appendChild(fields);
    wrap.appendChild(panel);

    const nav = document.createElement('div');
    nav.className = 'calc-nav-row';
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'calc-btn calc-btn--ghost';
    back.textContent = 'К выбору режима';
    back.addEventListener('click', () => {
      screen = 'home';
      render();
    });
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'calc-btn';
    next.textContent = 'Рассчитать';
    next.addEventListener('click', () => runCalculation());
    nav.append(back, next);
    wrap.appendChild(nav);
    return wrap;
  }

  function runCalculation() {
    lastResult = calculateYurta(input);
    comparison = buildComparisonVariants(input);
    selectedVariantInput = null;
    screen = 'result';
    render();
  }

  function renderResult() {
    const wrap = document.createElement('div');
    wrap.className = 'calc-result-view';
    if (!lastResult || !comparison) {
      wrap.textContent = 'Нет данных расчёта.';
      return wrap;
    }

    const r = lastResult;
    const card = document.createElement('article');
    card.className = 'calc-summary-card';
    card.innerHTML = `
      <h2>Современная юрта — ${r.meta.diameter} м</h2>
      <p class="calc-summary-meta">
        Тип: ${r.meta.constructionType}<br />
        Назначение: ${r.meta.purpose}<br />
        Площадь: ${r.area} м²<br />
        Вместимость: ${r.meta.people} человек<br />
        Регион: ${r.regionName}<br />
        Климат: лето до +${r.summerMax} °C · зима до ${r.winterMin} °C
      </p>
      <div class="calc-summary-grid">
        <div><span>Стоимость</span><strong>${formatTenge(r.buildCost)}</strong></div>
        <div><span>Теплопотери</span><strong>${r.heatLossKw} кВт</strong></div>
        <div><span>Отопление</span><strong>${r.heatingKw} кВт</strong></div>
        <div><span>Энергоэффективность</span><strong>${r.energyClass}</strong></div>
        <div><span>Срок службы</span><strong>${r.serviceYears} лет</strong></div>
        <div><span>Масса</span><strong>${r.massTons} т</strong></div>
        <div><span>Автономность</span><strong>${r.autonomy}</strong></div>
        <div><span>Эксплуатация</span><strong>${formatTenge(r.yearlyOps)}/год</strong></div>
      </div>
      <p class="calc-materials-line">
        <strong>Основные материалы:</strong><br />
        каркас — ${r.frameName};<br />
        утепление — ${r.insulationName};<br />
        наружная обшивка — ${r.claddingName}.
      </p>
    `;
    wrap.appendChild(card);

    if (r.warnings.length) {
      const warn = document.createElement('div');
      warn.className = 'calc-warnings';
      warn.innerHTML = r.warnings.map((w) => `<p>${w}</p>`).join('');
      wrap.appendChild(warn);
    }

    const breakdown = document.createElement('div');
    breakdown.className = 'calc-breakdown-box';
    breakdown.innerHTML = `<h3>Расшифровка стоимости</h3>${r.lines
      .map(
        (l) =>
          `<div class="calc-breakdown-row"><span>${l.label}</span><span>${formatTenge(l.value)}</span></div>`
      )
      .join('')}
      <div class="calc-breakdown-row calc-breakdown-row--total"><span>Итого строительство</span><span>${formatTenge(r.buildCost)}</span></div>
      <div class="calc-breakdown-row"><span>Владение 10 лет</span><span>${formatTenge(r.ownership10)}</span></div>
      <div class="calc-breakdown-row"><span>Владение 20 лет</span><span>${formatTenge(r.ownership20)}</span></div>`;
    wrap.appendChild(breakdown);

    const compare = document.createElement('div');
    compare.className = 'calc-compare';
    compare.innerHTML = '<h3>Сравнение вариантов</h3>';
    const grid = document.createElement('div');
    grid.className = 'calc-compare-grid';

    comparison.forEach((variant) => {
      const v = variant.result;
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'calc-compare-card';
      el.innerHTML = `
        <strong>${variant.title}</strong>
        <span>${formatTenge(v.buildCost)}</span>
        <small>Теплопотери: ${v.heatLossKw} кВт</small>
        <small>Энергоэфф.: ${v.energyClass}</small>
        <small>Срок: ${v.serviceYears} лет</small>
        <small>Масса: ${v.massTons} т</small>
        <small>Автономность: ${v.autonomy}</small>
        <small>Экспл.: ${formatTenge(v.yearlyOps)}/год</small>
      `;
      el.addEventListener('click', () => {
        input = { ...variant.input };
        selectedVariantInput = variant.input;
        lastResult = calculateYurta(input);
        render();
      });
      grid.appendChild(el);
    });
    compare.appendChild(grid);
    wrap.appendChild(compare);

    const actions = document.createElement('div');
    actions.className = 'calc-nav-row';

    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'calc-btn calc-btn--ghost';
    again.textContent = 'Изменить параметры';
    again.addEventListener('click', () => {
      screen = input.mode === 'engineer' ? 'engineer' : 'customer';
      render();
    });

    const offer = document.createElement('button');
    offer.type = 'button';
    offer.className = 'calc-btn';
    offer.textContent = 'Сформировать предложение';
    offer.addEventListener('click', () => {
      showOffer(selectedVariantInput ? calculateYurta(selectedVariantInput) : r);
    });

    actions.append(again, offer);
    wrap.appendChild(actions);
    return wrap;
  }

  /**
   * @param {CalcResult} r
   */
  function showOffer(r) {
    const text = `ПРЕДЛОЖЕНИЕ: Современная юрта ${r.meta.diameter} м

Тип: ${r.meta.constructionType}
Назначение: ${r.meta.purpose}
Площадь: ${r.area} м²
Вместимость: ${r.meta.people} чел.
Регион: ${r.regionName} (лето +${r.summerMax} °C / зима ${r.winterMin} °C)

Материалы:
• Каркас: ${r.frameName}
• Утепление: ${r.insulationName}
• Обшивка: ${r.claddingName}

Характеристики:
• Теплопотери: ${r.heatLossKw} кВт
• Отопление: ${r.heatingKw} кВт
• Энергоэффективность: ${r.energyClass}
• Срок службы: ${r.serviceYears} лет
• Масса: ${r.massTons} т
• Автономность: ${r.autonomy}

Ориентировочная стоимость строительства: ${formatTenge(r.buildCost)}
Ориентировочные эксплуатационные расходы: ${formatTenge(r.yearlyOps)}/год
Владение 10 лет: ${formatTenge(r.ownership10)}
Владение 20 лет: ${formatTenge(r.ownership20)}

${DISCLAIMER}`;

    const modal = document.createElement('div');
    modal.className = 'calc-modal';
    modal.innerHTML = `
      <div class="calc-modal-card">
        <h3>Коммерческое предложение</h3>
        <pre class="calc-offer">${text}</pre>
        <div class="calc-nav-row">
          <button type="button" class="calc-btn calc-btn--ghost" data-close>Закрыть</button>
          <button type="button" class="calc-btn" data-copy>Скопировать</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    modal.querySelector('[data-close]')?.addEventListener('click', () => modal.remove());
    modal.querySelector('[data-copy]')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(text);
        const btn = modal.querySelector('[data-copy]');
        if (btn) btn.textContent = 'Скопировано';
      } catch {
        // ignore
      }
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  /**
   * @param {string} title
   */
  function sectionTitle(title) {
    const h = document.createElement('h3');
    h.className = 'calc-section-title';
    h.textContent = title;
    return h;
  }

  /**
   * @param {string} label
   * @param {Array<{id: string, name: string, desc?: string}>} options
   * @param {string} value
   * @param {(v: string) => void} onChange
   */
  function selectField(label, options, value, onChange) {
    const wrap = document.createElement('label');
    wrap.className = 'calc-field';
    const span = document.createElement('span');
    span.className = 'calc-label';
    span.textContent = label;
    const select = document.createElement('select');
    options.forEach((opt) => {
      const o = document.createElement('option');
      o.value = opt.id;
      o.textContent = opt.name;
      if (opt.id === value) o.selected = true;
      select.appendChild(o);
    });

    const hint = document.createElement('p');
    hint.className = 'calc-option-desc';
    const selected = options.find((opt) => opt.id === value);
    if (selected?.desc) {
      hint.textContent = selected.desc;
    } else {
      hint.hidden = true;
    }

    select.addEventListener('change', () => {
      onChange(select.value);
      const opt = options.find((item) => item.id === select.value);
      if (opt?.desc) {
        hint.textContent = opt.desc;
        hint.hidden = false;
      } else {
        hint.hidden = true;
      }
      if (screen === 'customer' && customerStep === 2) {
        render();
      }
    });
    wrap.append(span, select, hint);
    return wrap;
  }

  /**
   * @param {string} label
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @param {(v: number) => void} onChange
   * @param {number} [step]
   */
  function numberField(label, value, min, max, onChange, step = 1) {
    const wrap = document.createElement('label');
    wrap.className = 'calc-field';
    const span = document.createElement('span');
    span.className = 'calc-label';
    span.textContent = label;
    const inputEl = document.createElement('input');
    inputEl.type = 'number';
    inputEl.min = String(min);
    inputEl.max = String(max);
    inputEl.step = String(step);
    inputEl.value = String(value);
    inputEl.addEventListener('change', () => {
      const n = Number(inputEl.value);
      const clamped = Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
      inputEl.value = String(clamped);
      onChange(clamped);
    });
    wrap.append(span, inputEl);
    return wrap;
  }

  /**
   * @param {string} label
   * @param {boolean} value
   * @param {(v: boolean) => void} onChange
   */
  function checkField(label, value, onChange) {
    const wrap = document.createElement('label');
    wrap.className = 'calc-check';
    const inputEl = document.createElement('input');
    inputEl.type = 'checkbox';
    inputEl.checked = value;
    inputEl.addEventListener('change', () => onChange(inputEl.checked));
    const span = document.createElement('span');
    span.textContent = label;
    wrap.append(inputEl, span);
    return wrap;
  }

  render();
}
