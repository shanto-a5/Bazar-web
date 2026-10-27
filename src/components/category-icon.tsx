import { createElement, type ComponentProps } from "react";

/**
 * Centralized category-to-icon mapping.
 *
 * The API returns ~128 categories with only emoji hints, and the homepage used
 * to fall back to initials. Instead of pulling in an icon library, this keeps
 * one maintainable table of hand-drawn 24x24 stroke icons (the same style as the
 * header icons) and picks one per category by normalized name keyword. Every
 * category resolves to *something* - the shopping bag is the generic fallback,
 * so initials are never shown.
 */

type IconProps = ComponentProps<"svg">;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const ShoppingBag = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M6 8h12l-1 12H7L6 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

const Basket = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M6 9h12l-1.2 10a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 9Z" />
    <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    <path d="M10 13v3M14 13v3" />
  </svg>
);

const Leaf = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 20c0-9 5-15 16-16 1 10-4 15-12 15" />
    <path d="M4 20c3-4 7-6 12-7" />
  </svg>
);

const Milk = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M9 3h6v3l2 3v10a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V9l2-3V3Z" />
    <path d="M7 12h10" />
  </svg>
);

const Cup = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 8h13v6a5 5 0 0 1-10 0V8Z" />
    <path d="M17 9h2a2 2 0 0 1 0 4h-2" />
    <path d="M6 21h9" />
  </svg>
);

const Cookie = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="9.2" cy="10.2" r="0.6" />
    <circle cx="14" cy="9.4" r="0.6" />
    <circle cx="15" cy="14" r="0.6" />
    <circle cx="10" cy="15" r="0.6" />
  </svg>
);

const Cake = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 20h16" />
    <path d="M5 20v-6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v6" />
    <path d="M8 11V7M12 11V5M16 11V7" />
  </svg>
);

const Shirt = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M9 3 4 6l2 4 2-1v11h8V9l2 1 2-4-5-3a3 3 0 0 1-6 0Z" />
  </svg>
);

const Dress = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M9 4 7 8l-3 3v9h16v-9l-3-3-2-4" />
    <path d="M9 4h6" />
    <path d="M9 20v-4a3 3 0 0 1 6 0v4" />
  </svg>
);

const Trousers = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M7 4h10v16l-3-1-2 1-2-1-3 1V4Z" />
    <path d="M7 9h10" />
  </svg>
);

const Hanger = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 5a3 3 0 0 1 2.1 5.2L12 12l-2.1-1.8A3 3 0 0 1 12 5Z" />
    <path d="M12 12v7" />
    <path d="M8 19h8" />
  </svg>
);

const Scarf = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M6 5a3 3 0 0 1 6 0v14l-3-2-3 2V5Z" />
    <path d="M12 7a3 3 0 0 1 6 0v12l-3-2" />
  </svg>
);

const GraduationCap = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 9 12 6l8 3-8 3-8-3Z" />
    <path d="M7 11v5l5 2 5-2v-5" />
    <path d="M19 9v5" />
  </svg>
);

const Shoe = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M5 20v-5.5a3 3 0 0 1 3-3h1V6a3 3 0 0 1 6 0v5.5a5 5 0 0 0 4 4.5v4H5Z" />
    <path d="M10 8h4" />
  </svg>
);

const Sparkles = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z" />
    <path d="M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" />
  </svg>
);

const Smartphone = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="7" y="3" width="10" height="18" rx="2" />
    <path d="M11 18h2" />
  </svg>
);

const Laptop = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="4" y="5" width="16" height="11" rx="1.5" />
    <path d="M2 19h20" />
  </svg>
);

const Tv = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="3" y="5" width="18" height="12" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);

const Camera = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const Plug = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M9 3v5M15 3v5" />
    <path d="M7 8h10v3a5 5 0 0 1-10 0V8Z" />
    <path d="M12 16v5" />
  </svg>
);

const Fridge = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="6" y="3" width="12" height="18" rx="2" />
    <path d="M6 10h12M9 6v2M9 13v3" />
  </svg>
);

const Utensils = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M5 3v6a2 2 0 0 0 4 0V3M7 11v10" />
    <path d="M17 3c-1.5 1-2 3-2 5s.5 3 2 3v10" />
  </svg>
);

const Sofa = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M5 12V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
    <path d="M4 11a2 2 0 0 0-2 2v4a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-4a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-2-2Z" />
  </svg>
);

const Ball = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5c2.3 3 2.3 14 0 17M3.5 12h17" />
  </svg>
);

const Paw = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="7" cy="9.5" r="1.5" />
    <circle cx="10" cy="6.5" r="1.5" />
    <circle cx="14" cy="6.5" r="1.5" />
    <circle cx="17" cy="9.5" r="1.5" />
    <path d="M12 11.5c2.8 0 4.5 1.8 4.5 4S14.5 20 12 20s-4.5-2.3-4.5-4.5S9.2 11.5 12 11.5Z" />
  </svg>
);

const Car = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M5 11l1.4-4A2 2 0 0 1 8.3 5.6h7.4a2 2 0 0 1 1.9 1.4L19 11v6H5v-6Z" />
    <path d="M5 12h14" />
    <circle cx="8" cy="17" r="1.4" />
    <circle cx="16" cy="17" r="1.4" />
  </svg>
);

const Book = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2V5Z" />
    <path d="M8 3v18" />
  </svg>
);

const Watch = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="5" />
    <path d="M12 10v2l1.4 1M9.2 3h5.6l.6 4M9.2 21h5.6l.6-4" />
  </svg>
);

const Gamepad = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="3" y="8" width="18" height="9" rx="4.5" />
    <path d="M8 11v3M6.5 12.5h3M15.5 12h.01M18 14h.01" />
  </svg>
);

const BabyFace = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="8" />
    <path d="M9 10h.01M15 10h.01M9 15c1.8 1.2 4.2 1.2 6 0" />
  </svg>
);

const Child = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="7" r="3" />
    <path d="M12 10v4M8 14l4 3 4-3" />
  </svg>
);

const Girl = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="8" r="2.5" />
    <path d="M12 10.5v3" />
    <path d="M10 14.5 12 13l2 1.5M9 19h6M10 19v-2M14 19v-2" />
  </svg>
);

interface Rule {
  icon: (props: IconProps) => React.JSX.Element;
  keywords: string[];
}

/** First matching rule wins, so more specific buckets come first. */
const RULES: Rule[] = [
  { icon: Car, keywords: ["automotive", "tyre", "tire", "vehicle", "motorcycle", "bike", "motor", "car ", "car-", "cars"] },
  { icon: Paw, keywords: ["pet", "cat food", "dog food", "aquarium", "fish"] },
  { icon: Fridge, keywords: ["refrigerator", "air conditioner", "washing machine", "vacuum", "appliance", "fridge", "fans", "irons"] },
  { icon: Utensils, keywords: ["cookware", "bakeware", "tableware", "utensil", "dinnerware", "kitchen", "cutlery"] },
  { icon: Tv, keywords: ["television", "audio", "speaker", "headphone", "earphone", "tv", "electronic"] },
  { icon: Camera, keywords: ["camera"] },
  { icon: Plug, keywords: ["charger", "cable", "power bank", "battery", "adapter"] },
  { icon: Smartphone, keywords: ["smartphone", "mobile", "phone", "case", "cover"] },
  { icon: Laptop, keywords: ["laptop", "tablet", "computer", "gadget", "wearable", "desktop", "monitor", "keyboard", "mouse", "networking", "router"] },
  { icon: Sparkles, keywords: ["beauty", "cosmetic", "skincare", "skin", "hair", "oral", "makeup", "perfume", "fragrance", "grooming", "wellness", "vitamin", "supplement", "first aid"] },
  { icon: BabyFace, keywords: ["baby", "kid", "maternity", "infant", "nappy", "diaper", "stroller", "feeding", "nursery"] },
  { icon: Child, keywords: ["boys' clothing", "boy clothing", "boys wear", "boy wear"] },
  { icon: Girl, keywords: ["girls' clothing", "girl clothing", "girls wear", "girl wear"] },
  { icon: Gamepad, keywords: ["toy", "action figure", "board game", "remote control", "puzzle", "game"] },
  { icon: Watch, keywords: ["watch", "jewel", "brooch", "ring", "necklace", "earring", "bangle", "sunglass", "watches", "jewellery", "jewelry"] },
  { icon: ShoppingBag, keywords: ["handbag", "bag", "backpack", "wallet", "luggage", "accessor"] },
  { icon: Shoe, keywords: ["shoe", "sneaker", "sandal", "boot", "footwear", "slipper", "heel"] },
  { icon: Scarf, keywords: ["hijab", "scarf"] },
  { icon: Hanger, keywords: ["main fashion", "men's fashion", "clothing", "apparel", "clothing sets"] },
  { icon: Shirt, keywords: ["shirt", "shirts", "t-shirt", "tshirt", "t-shirts", "kurta", "kurtas", "blouse", "saree", "sari", "panjabi", "blazer", "jacket", "tops & blouses"] },
  { icon: Dress, keywords: ["dress", "dresses", "kurti", "kurtis", "womens fashion", "women fashion", "women's fashion"] },
  { icon: Trousers, keywords: ["pants", "jeans", "trouser", "pant", "trousers", "pants & jeans", "jean"] },
  { icon: Leaf, keywords: ["fresh", "produce", "vegetable", "fruit", "grocery fresh"] },
  { icon: Milk, keywords: ["dairy", "egg", "milk"] },
  { icon: Cup, keywords: ["beverage", "drink", "tea", "coffee", "juice"] },
  { icon: Cookie, keywords: ["snack", "chocolate", "candy", "biscuit", "chips"] },
  { icon: Cake, keywords: ["bak", "bread", "cake"] },
  { icon: Basket, keywords: ["grocer", "staple", "essential", "rice", "spice", "cooking"] },
  { icon: Ball, keywords: ["sport", "cricket", "cycling", "camp", "outdoor", "fitness", "gym", "yoga", "cycle"] },
  { icon: Sofa, keywords: ["home", "bedding", "bed", "furniture", "sofa", "curtain", "decor", "storage", "lighting", "lamp"] },
  { icon: GraduationCap, keywords: ["school wear", "education", "academic", "university", "college", "learning"] },
  { icon: Book, keywords: ["book", "stationery", "pen", "marker", "office suppl", "art suppl", "notebook", "school suppl"] },
];

/** The icon component for a category id/name. Always returns an icon. */
export function categoryIcon(name: string, id?: string): (props: IconProps) => React.JSX.Element {
  const haystack = `${name} ${id ?? ""}`.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) return rule.icon;
  }
  return ShoppingBag;
}

/** Rendered category glyph with consistent sizing and theme-aware color. */
export function CategoryIcon({
  name,
  id,
  className,
}: {
  name: string;
  id?: string;
  className?: string;
}) {
  return createElement(categoryIcon(name, id), { className, "aria-hidden": true });
}
