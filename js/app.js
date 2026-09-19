const foodGrid = document.getElementById('foodGrid');
const totalCostEl = document.getElementById('totalCost');
const nutritionTableBody = document.getElementById('nutritionTableBody');
const resultTableBody = document.getElementById('resultTableBody');
const toastEl = document.getElementById('toast');
const completeMenuBtn = document.getElementById('completeMenuBtn');
const resetBtn = document.getElementById('resetBtn');

function formatCurrency(value) {
  return `${Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫`;
}

function formatNumber(value, digits = 2) {
  return Number(value).toLocaleString('vi-VN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function clamp(value, min = 0) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, value);
}

function validateQuantity(rawValue, id) {
  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) return 0;

  if (id === 'egg') {
    return Math.max(0, Math.round(numericValue));
  }

  return Math.max(0, Number(numericValue.toFixed(4)));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) {
      storedDefaultState.forEach((item) => {
        const match = foods.find((food) => food.id === item.id);
        if (!match) return;
        match.price = Number(item.price) || match.price;
      });
      return;
    }

    saved.forEach((item) => {
      const match = foods.find((food) => food.id === item.id);
      if (!match) return;
      match.price = Number(item.price) || match.price;
    });
  } catch (error) {
    console.warn('Không đọc được localStorage:', error);
  }
}

function saveState() {
  const payload = foods.map((food) => ({ id: food.id, quantity: food.quantity, price: food.price }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function calcPlanGivenQuantities() {
  const totals = { energy: 0, protein: 0, lipid: 0, glucid: 0, calcium: 0 };

  foods.forEach((food) => {
    const q = Number(food.quantity) || 0;
    totals.energy += q * food.portionFactor * food.calories;
    totals.protein += q * food.portionFactor * food.protein;
    totals.lipid += q * food.portionFactor * food.lipid;
    totals.glucid += q * food.portionFactor * food.glucid;
    totals.calcium += q * food.portionFactor * food.calcium;
  });

  return totals;
}

function calculateCostFromQuantities() {
  return foods.reduce((sum, food) => sum + food.price * food.quantity * food.portionFactor, 0);
}

function formatQuantity(food, quantity) {
  if (!quantity) return '0';
  if (food.id === 'egg') return `${formatNumber(quantity, 0)} quả`;
  return `${formatNumber(quantity * 100, 2)} g`;
}

function renderFoodCard(food) {
  const card = document.createElement('article');
  card.className = 'food-card';
  const priceLabel = food.id === 'egg' ? 'Giá (VNĐ/2 quả)' : 'Giá (VNĐ/100g)';
  card.innerHTML = `
    <div class="food-name">${food.name}</div>
    <img src="${food.image}" alt="${food.name}" />
    <div class="price-row">
      <label class="price-label" for="price-${food.id}">${priceLabel}</label>
      <input id="price-${food.id}" class="price-input" type="number" min="0" step="100" value="${food.price}" data-id="${food.id}" aria-label="Giá ${food.name} bằng Việt Nam đồng" />
    </div>
    <label>Lượng tối ưu(${food.unit}):</label>
    <div class="quantity-result" data-id="${food.id}">${formatQuantity(food, food.quantity)}</div>
  `;
  return card;
}

function renderFoods() {
  foodGrid.innerHTML = '';
  foods.forEach((food) => {
    foodGrid.appendChild(renderFoodCard(food));
  });
}

function renderNutritionTable() {
  const totals = calcPlanGivenQuantities();
  const rows = [
    ['Năng lượng (Kcal)', totals.energy, targets.energy],
    ['Protein (g)', totals.protein, targets.protein],
    ['Lipid (g)', totals.lipid, targets.lipid],
    ['Glucid (g)', totals.glucid, targets.glucid],
    ['Canxi (mg)', totals.calcium, targets.calcium],
  ];

  nutritionTableBody.innerHTML = rows.map(([label, actual, target]) => {
    const meetsTarget = actual >= target - 0.01;
    const status = meetsTarget ? 'Đạt' : 'Chưa đạt';
    const statusClass = meetsTarget ? 'status-pass' : 'status-fail';
    return `
      <tr>
        <td>${label}</td>
        <td>${formatNumber(actual, 2)}</td>
        <td>≥</td>
        <td>${formatNumber(target, 2)}</td>
        <td><span class="status-badge ${statusClass}">${status}</span></td>
      </tr>
    `;
  }).join('');
}

function renderResultTable(rows) {
  if (!rows || rows.length === 0) {
    resultTableBody.innerHTML = '<tr><td colspan="5">Không tìm thấy thực đơn thỏa mãn tiêu chí dinh dưỡng.</td></tr>';
    return;
  }

  resultTableBody.innerHTML = rows
    .map((row) => `
      <tr>
        <td>${row.name}</td>
        <td>${formatCurrency(row.pricePer100)}</td>
        <td>${formatNumber(row.quantity, row.unit === 'quả' ? 0 : 2)} ${row.unit}</td>
        <td>${formatCurrency(row.amount)}</td>
        <td>100g</td>
      </tr>
    `)
    .join('');
}

function solveLinearSystem(matrix, vector) {
  const size = vector.length;
  const augmented = matrix.map((row, index) => [...row, vector[index]]);

  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    }

    if (Math.abs(augmented[pivot][column]) < 1e-9) return null;
    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];

    const divisor = augmented[column][column];
    for (let item = column; item <= size; item += 1) augmented[column][item] /= divisor;

    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let item = column; item <= size; item += 1) augmented[row][item] -= factor * augmented[column][item];
    }
  }

  return augmented.map((row) => row[size]);
}

function combinations(values, size) {
  const result = [];
  function visit(start, picked) {
    if (picked.length === size) {
      result.push(picked.slice());
      return;
    }
    for (let index = start; index < values.length; index += 1) {
      picked.push(values[index]);
      visit(index + 1, picked);
      picked.pop();
    }
  }
  visit(0, []);
  return result;
}

function computeOptimalPlan() {
  const nutrientKeys = ['energy', 'protein', 'lipid', 'glucid', 'calcium'];
  const eggIndex = foods.findIndex((food) => food.id === 'egg');
  const porkIndex = foods.findIndex((food) => food.id === 'pork');
  const constraints = nutrientKeys.map((key) => ({
    type: 'nutrient',
    key,
    coefficients: foods.map((food) => food.portionFactor * food[key === 'energy' ? 'calories' : key]),
    value: targets[key],
  }));
  foods.forEach((food, index) => {
    const coefficients = foods.map(() => 0);
    coefficients[index] = 1;
    constraints.push({ type: 'zero', coefficients, value: 0 });
  });

  let best = null;
  combinations(constraints, foods.length).forEach((active) => {
    const solution = solveLinearSystem(active.map((item) => item.coefficients), active.map((item) => item.value));
    if (!solution || solution.some((quantity) => quantity < -1e-7)) return;

    const adjustedSolution = solution.slice();
    if (eggIndex >= 0) adjustedSolution[eggIndex] = Math.ceil(adjustedSolution[eggIndex] - 1e-7);
    if (porkIndex >= 0 && adjustedSolution[porkIndex] < MIN_PORK_QUANTITY - 1e-7) return;

    const nutrients = calcNutrientsForQuantities(adjustedSolution);
    const meets = nutrientKeys.every((key) => nutrients[key] >= targets[key] - 1e-7);
    if (!meets) return;

    const cost = foods.reduce((sum, food, index) => sum + food.price * adjustedSolution[index] * food.portionFactor, 0);
    if (!best || cost < best.cost) best = { cost, quantities: adjustedSolution, nutrients };
  });

  if (!best) return { bestCost: Number.POSITIVE_INFINITY, rows: [], nutrients: null };

  const rows = foods
    .map((food, index) => {
      const quantity = Math.max(0, best.quantities[index]);
      if (quantity <= 0) return null;
      return {
        name: food.name,
        pricePer100: food.price,
        quantity: food.id === 'egg' ? Number(quantity.toFixed(0)) : Number(quantity.toFixed(4)) * 100,
        amount: quantity * food.price * food.portionFactor,
        unit: food.id === 'egg' ? 'quả' : 'g',
      };
    })
    .filter(Boolean);

  return { bestCost: best.cost, rows, nutrients: best.nutrients };
}

function calcNutrientsForQuantities(quantities) {
  return foods.reduce((totals, food, index) => {
    const quantity = quantities[index] || 0;
    totals.energy += quantity * food.portionFactor * food.calories;
    totals.protein += quantity * food.portionFactor * food.protein;
    totals.lipid += quantity * food.portionFactor * food.lipid;
    totals.glucid += quantity * food.portionFactor * food.glucid;
    totals.calcium += quantity * food.portionFactor * food.calcium;
    return totals;
  }, { energy: 0, protein: 0, lipid: 0, glucid: 0, calcium: 0 });
}

function updateTotalCost() {
  totalCostEl.textContent = formatCurrency(calculateCostFromQuantities());
}

function updateAll() {
  renderNutritionTable();
  updateTotalCost();
}

foodGrid.addEventListener('input', (event) => {
  const priceInput = event.target.closest('.price-input');
  if (!priceInput) return;

  const { id } = priceInput.dataset;
  const food = foods.find((item) => item.id === id);
  if (!food) return;

  food.price = Math.max(0, Number(priceInput.value) || 0);
  saveState();
  updateAll();
});

completeMenuBtn.addEventListener('click', () => {
  const optimal = computeOptimalPlan();
  foods.forEach((food, index) => {
    const row = optimal.rows.find((item) => item.name === food.name);
    food.quantity = row ? (food.id === 'egg' ? row.quantity : row.quantity / 100) : 0;
  });
  saveState();
  renderFoods();
  updateAll();
  totalCostEl.textContent = Number.isFinite(optimal.bestCost) ? formatCurrency(optimal.bestCost) : 'Không có nghiệm';
  renderResultTable(optimal.rows);
  showToast('✓ Chi phí bữa ăn tối ưu đã được tính');
});

resetBtn.addEventListener('click', () => {
  const confirmed = window.confirm('Bạn có chắc muốn đặt lại thực đơn?');
  if (!confirmed) return;

  foods.forEach((food) => {
    food.quantity = 0;
  });

  saveState();
  renderFoods();
  updateAll();
  resultTableBody.innerHTML = '<tr><td colspan="5">Chưa có thực đơn nào được tính.</td></tr>';
  showToast('✓ Thực đơn đã được đặt lại');
});

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2200);
}

loadState();
renderFoods();
updateAll();
resultTableBody.innerHTML = '<tr><td colspan="5">Chưa có thực đơn nào được tính.</td></tr>';
