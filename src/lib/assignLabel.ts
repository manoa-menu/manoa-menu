type Labels = {
  [category: string]: { [label: string]: string[] };
};

// Define the keyword mappings
const labelKeywords: Labels = {
  'Protein Type': {
    Chicken: [
      'Chicken',
      'Kiev',
      'Bruschetta',
      'Wings',
      'Stir-Fry',
      'Tenders',
      'Marsala',
      'Alfredo',
      'Jambalaya',
      'Pad Thai',
      'Tenders',
      'Jerk',
      'Breast',
      'Thigh',
    ],
    Turkey: ['Turkey', 'Guacamole', 'Stuffing', 'Sausage', 'Chili', 'BLT', 'Club'],
    Beef: [
      'Beef',
      'Ribeye',
      'Brisket',
      'Hamburger',
      'Steak',
      'Meatloaf',
      'Meatballs',
      'Cutlet',
      'Stew',
      'Chili',
      'Sirloin',
    ],
    Pork: [
      'Pork',
      'Ham',
      'Kalua',
      'BBQ Ribs',
      'Chops',
      'Carnitas',
      'Sausage',
      'Bacon',
      'Pastele',
      'Char Siu',
      'Pulled',
      'Braised',
    ],
    Seafood: ['Shrimp', 'Fish', 'Hoki', 'Salmon', 'Swai'],
  },
  'Cuisine Style': {
    American: [
      'Mac',
      'Cheese',
      'Hamburger',
      'Meatloaf',
      'Steak',
      'BBQ',
      'Grilled Cheese',
      'Pancakes',
      'Chili',
      'Fried Chicken',
      'Potatoes',
    ],
    Asian: ['Teriyaki', 'Mochiko', 'Katsu', 'Korean', 'Pad Thai', 'Bibimbap', 'Szechuan', 'Shoyu', 'Stir Fry'],
    Italian: [
      'Lasagna',
      'Parmesan',
      'Chopped Salad',
      'Pesto',
      'Marinara',
      'Spaghetti',
      'Ziti',
      'Pasta',
      'Alfredo',
      'Meatballs',
    ],
    Mexican: ['Birria', 'Chipotle', 'Quesadilla', 'Tortilla', 'Pico de Gallo', 'Carnitas', 'Guacamole'],
    'Hawaiian/Island Style': ['Island', 'Kalua', 'Lau Lau', 'Guava', 'Poke'],
    Greek: ['Greek', 'Falafel', 'Tabbouleh', 'Hummus'],
  },
  'Meal Type': {
    Salads: ['Salad', 'Caesar', 'Cobb', 'Greek', 'Chopped', 'Garden', 'Macaroni'],
    Entrées: [
      'Roast',
      'Steak',
      'Curry',
      'Meatloaf',
      'Tempura',
      'Wrap',
      'Pasta',
      'Pie',
      'Stir Fry',
      'Jambalaya',
      'Chili',
      'Pizza',
      'Bowl',
    ],
    Sides: ['Tater Tots', 'Chips', 'Fries', 'Potatoes', 'Rice', 'Beans', 'Corn', 'Broccoli'],
    'Soups & Stews': ['Soup', 'Stew', 'Chili', 'Bisque', 'Gumbo'],
  },
  'Flavor Profile': {
    BBQ: ['BBQ', 'Guava', 'Brisket', 'Pulled'],
    Spicy: ['Chipotle', 'Buffalo', 'Jerk', 'Bibimbap'],
    Sweet: ['Pineapple', 'Sweet', 'Pumpkin', 'Peach'],
    Savory: ['Gravy', 'Roast', 'Garlic', 'Herb'],
  },
  'Preparation Method': {
    'Grilled/Blackened': ['Blackened', 'Grilled', 'BBQ'],
    Fried: ['Fried', 'Tempura', 'Katsu', 'Crispy'],
    'Roasted/Baked': ['Roast', 'Baked', 'Braised'],
  },
};

export function getKeyByValue(value: string): string | undefined {
  for (const [key, mappings] of Object.entries(labelKeywords)) {
    for (const [label] of Object.entries(mappings)) {
      if (label === value) {
        return key;
      }
    }
  }
  return undefined;
}

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
