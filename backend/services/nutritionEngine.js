// nutritionEngine.js

/**
 * Generates daily meal combinations from specific ingredients:
 * rice, ugali, beans, chapati, eggs, meat, liver, kales, avocado, oranges, bananas, milk
 */

const DEFAULT_INGREDIENTS = {
  carbs: ['rice', 'ugali', 'chapati'],
  proteins: ['beans', 'eggs', 'meat', 'liver', 'milk'],
  veg: ['kales'],
  fruits_fats: ['avocado', 'oranges', 'bananas']
};

function getRandom(arr) {
  if (!arr || arr.length === 0) return 'Meal Replacement';
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDailyMealPlan(userPantry = null) {
  const pantry = userPantry || DEFAULT_INGREDIENTS;
  
  // Breakfast: Protein + fruit/carb
  const breakfast = [];
  const bProtein = getRandom(pantry.proteins && pantry.proteins.length > 0 ? pantry.proteins : DEFAULT_INGREDIENTS.proteins);
  breakfast.push({ ingredient: bProtein, amount: '1 portion' });
  
  if (Math.random() > 0.5) {
    const bFruit = getRandom(pantry.fruits_fats && pantry.fruits_fats.length > 0 ? pantry.fruits_fats : DEFAULT_INGREDIENTS.fruits_fats);
    breakfast.push({ ingredient: bFruit, amount: '1 piece/serving' });
  } else {
    const bCarb = getRandom(pantry.carbs && pantry.carbs.length > 0 ? pantry.carbs : DEFAULT_INGREDIENTS.carbs);
    breakfast.push({ ingredient: bCarb, amount: '1 piece/serving' });
  }

  // Lunch: Heavy carb + protein + veg + fruit
  const lunch = [];
  const lCarb = getRandom(pantry.carbs && pantry.carbs.length > 0 ? pantry.carbs : DEFAULT_INGREDIENTS.carbs);
  const lProtein = getRandom(pantry.proteins && pantry.proteins.length > 0 ? pantry.proteins : DEFAULT_INGREDIENTS.proteins);
  const lVeg = getRandom(pantry.veg && pantry.veg.length > 0 ? pantry.veg : DEFAULT_INGREDIENTS.veg);
  const lFruit = getRandom(pantry.fruits_fats && pantry.fruits_fats.length > 0 ? pantry.fruits_fats : DEFAULT_INGREDIENTS.fruits_fats);
  
  lunch.push({ ingredient: lCarb, amount: '1 serving' });
  lunch.push({ ingredient: lProtein, amount: '1 portion' });
  lunch.push({ ingredient: lVeg, amount: '1 side' });
  lunch.push({ ingredient: lFruit, amount: '1 piece' });

  // Dinner: Carb + protein + veg
  const dinner = [];
  const dCarbPool = (pantry.carbs && pantry.carbs.length > 0 ? pantry.carbs : DEFAULT_INGREDIENTS.carbs).filter(c => c !== lCarb);
  const dCarb = dCarbPool.length > 0 ? getRandom(dCarbPool) : getRandom(pantry.carbs && pantry.carbs.length > 0 ? pantry.carbs : DEFAULT_INGREDIENTS.carbs);
  
  let dProtein = getRandom(pantry.proteins && pantry.proteins.length > 0 ? pantry.proteins : DEFAULT_INGREDIENTS.proteins);
  const dVeg = getRandom(pantry.veg && pantry.veg.length > 0 ? pantry.veg : DEFAULT_INGREDIENTS.veg);
  
  dinner.push({ ingredient: dCarb, amount: '1 serving' });
  dinner.push({ ingredient: dProtein, amount: '1 portion' });
  dinner.push({ ingredient: dVeg, amount: '1 side' });

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
