// nutritionEngine.js

/**
 * Generates daily meal combinations from specific ingredients:
 * rice, ugali, beans, chapati, eggs, meat, liver, kales, avocado, oranges, bananas, milk
 */

const INGREDIENTS = {
  carbs: ['rice', 'ugali', 'chapati'],
  proteins: ['beans', 'eggs', 'meat', 'liver', 'milk'],
  veg: ['kales'],
  fruits_fats: ['avocado', 'oranges', 'bananas']
};

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDailyMealPlan() {
  // Breakfast: Protein (milk/eggs) + fruit/carb
  const breakfast = [];
  const bProtein = getRandom(['eggs', 'milk']);
  breakfast.push({ ingredient: bProtein, amount: bProtein === 'milk' ? '1 glass' : '2 boiled/fried' });
  
  if (Math.random() > 0.5) {
    breakfast.push({ ingredient: 'bananas', amount: '2 pieces' });
  } else {
    breakfast.push({ ingredient: 'chapati', amount: '1 piece' });
  }

  // Lunch: Heavy carb + protein + veg + fruit
  const lunch = [];
  const lCarb = getRandom(['rice', 'ugali', 'chapati']);
  const lProtein = getRandom(['beans', 'meat', 'liver']);
  lunch.push({ ingredient: lCarb, amount: '1 serving' });
  lunch.push({ ingredient: lProtein, amount: '1 portion' });
  lunch.push({ ingredient: 'kales', amount: '1 side' });
  if (Math.random() > 0.5) {
    lunch.push({ ingredient: 'avocado', amount: 'Half' });
  } else {
    lunch.push({ ingredient: 'oranges', amount: '1 piece' });
  }

  // Dinner: Carb + protein + veg (Different from lunch if possible)
  const dinner = [];
  const dinnerCarbs = ['rice', 'ugali'].filter(c => c !== lCarb);
  const dCarb = dinnerCarbs.length > 0 ? getRandom(dinnerCarbs) : getRandom(['rice', 'ugali']);
  
  let dProtein = getRandom(['beans', 'meat', 'liver']);
  
  dinner.push({ ingredient: dCarb, amount: '1 serving' });
  dinner.push({ ingredient: dProtein, amount: '1 portion' });
  dinner.push({ ingredient: 'kales', amount: '1 side' });
  if (Math.random() > 0.7) {
    dinner.push({ ingredient: 'avocado', amount: 'Quarter' });
  }

  // Map 'ingredient' to 'item' for the frontend
  const mapIngredients = (arr) => arr.map(i => ({ item: i.ingredient, amount: i.amount }));

  return {
    breakfast: { name: 'Breakfast Menu', ingredients: mapIngredients(breakfast) },
    lunch: { name: 'Balanced Lunch', ingredients: mapIngredients(lunch) },
    dinner: { name: 'Recovery Dinner', ingredients: mapIngredients(dinner) }
  };
}

module.exports = {
  generateDailyMealPlan
};
