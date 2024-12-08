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
function assignLabels(itemName: string): Record<string, string[]> {
  const assignedLabels: Record<string, string[]> = {};

  for (const [category, mappings] of Object.entries(labelKeywords)) {
    assignedLabels[category] = Object.keys(mappings).filter(
      (label) =>
        // eslint-disable-next-line implicit-arrow-linebreak
        mappings[label].some((keyword) => itemName.toLowerCase().includes(keyword.toLowerCase())),
      // eslint-disable-next-line function-paren-newline
    );
  }

  return assignedLabels;
}

export default assignLabels;
