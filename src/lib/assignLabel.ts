type Labels = {
  [category: string]: { [label: string]: string[] };
};

// Define the keyword mappings
const labelKeywords: Labels = {
  'Protein Type': {
    Chicken: ['Chicken', 'Kiev', 'Bruschetta'],
    Turkey: ['Turkey'],
    Beef: ['Beef', 'Ribeye', 'Brisket', 'Hamburger'],
    Pork: ['Pork', 'Ham', 'Kalua', 'BBQ Ribs'],
    Seafood: ['Shrimp', 'Fish', 'Hoki'],
    Vegetarian: ['Vegetarian', 'Veggie', 'Lasagna', 'Salad'],
  },
  'Cuisine Style': {
    American: ['Mac', 'Cheese', 'Hamburger', 'Meatloaf'],
    Asian: ['Teriyaki', 'Mochiko', 'Katsu', 'Korean'],
    Italian: ['Lasagna', 'Parmesan', 'Chopped Salad', 'Pesto'],
    Mexican: ['Birria', 'Chipotle'],
    'Hawaiian/Island Style': ['Island', 'Kalua', 'Lau Lau', 'Guava'],
    Greek: ['Greek'],
  },
  'Meal Type': {
    Salads: ['Salad'],
    Entrées: ['Roast', 'Steak', 'Curry', 'Meatloaf', 'Tempura'],
    Sides: ['Tater Tots', 'Chips'],
    'Soups & Stews': ['Soup', 'Stew'],
  },
  'Flavor Profile': {
    BBQ: ['BBQ', 'Guava'],
    Spicy: ['Chipotle', 'Buffalo'],
    Sweet: ['Pineapple', 'Sweet', 'Pumpkin'],
    Savory: ['Gravy', 'Roast'],
  },
  'Preparation Method': {
    'Grilled/Blackened': ['Blackened', 'Grilled'],
    Fried: ['Fried', 'Tempura', 'Katsu'],
    'Roasted/Baked': ['Roast', 'Baked'],
  },
  'Dietary Labels': {
    Vegetarian: ['Vegetarian', 'Veggie'],
  },
};

// Function to assign labels based on keywords
function assignLabels(itemName: string): string[] {
  const assignedLabels: string[] = [];

  for (const mappings of Object.values(labelKeywords)) {
    for (const [label, keywords] of Object.entries(mappings)) {
      if (keywords.some((keyword) => itemName.toLowerCase().includes(keyword.toLowerCase()))) {
        assignedLabels.push(label);
      }
    }
  }

  return assignedLabels;
}

export default assignLabels;
