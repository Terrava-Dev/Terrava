// ── Property type definitions with sub-types ─────────────────────────────────

export type SubType = {
  value: string
  label: string
  icon: string
}

export type PropertyTypeConfig = {
  value: string
  labelKey: string
  icon: string
  subTypes: SubType[]
}

export const PROPERTY_TYPES: PropertyTypeConfig[] = [
  {
    value: "land",
    labelKey: "type_land",
    icon: "🌿",
    subTypes: [
      { value: "agricultural", label: "Agricultural",  icon: "🌾" },
      { value: "residential",  label: "Residential",   icon: "🏘️" },
      { value: "industrial",   label: "Industrial",    icon: "🏭" },
      { value: "panchayat",    label: "Panchayat Land",icon: "📜" },
      { value: "waterfront",   label: "Waterfront",    icon: "🌊" },
      { value: "corner_plot",  label: "Corner Plot",   icon: "📐" },
    ],
  },
  {
    value: "home",
    labelKey: "type_home",
    icon: "🏠",
    subTypes: [
      { value: "1bhk",         label: "1 BHK",         icon: "🛏️" },
      { value: "2bhk",         label: "2 BHK",         icon: "🛏️" },
      { value: "3bhk",         label: "3 BHK",         icon: "🛏️" },
      { value: "4bhk",         label: "4 BHK",         icon: "🛏️" },
      { value: "duplex",       label: "Duplex",        icon: "🏡" },
      { value: "villa",        label: "Villa",         icon: "🏰" },
      { value: "independent",  label: "Independent",   icon: "🏠" },
      { value: "studio",       label: "Studio",        icon: "🪑" },
    ],
  },
  {
    value: "commercial",
    labelKey: "type_commercial",
    icon: "🏢",
    subTypes: [
      { value: "ground_floor",  label: "Ground Floor",  icon: "⬇️" },
      { value: "first_floor",   label: "1st Floor",     icon: "1️⃣" },
      { value: "second_floor",  label: "2nd Floor",     icon: "2️⃣" },
      { value: "furnished",     label: "Furnished",     icon: "🪑" },
      { value: "semi_furnished",label: "Semi Furnished",icon: "🛋️" },
      { value: "showroom",      label: "Showroom",      icon: "🏪" },
      { value: "office",        label: "Office Space",  icon: "💼" },
      { value: "warehouse",     label: "Warehouse",     icon: "🏬" },
      { value: "shop",          label: "Shop",          icon: "🛍️" },
    ],
  },
  {
    value: "farm",
    labelKey: "type_farm",
    icon: "🌾",
    subTypes: [
      { value: "mango",        label: "Mango Grove",   icon: "🥭" },
      { value: "coconut",      label: "Coconut Farm",  icon: "🥥" },
      { value: "paddy",        label: "Paddy Field",   icon: "🌾" },
      { value: "flower",       label: "Flower Farm",   icon: "🌸" },
      { value: "vegetable",    label: "Vegetable Farm",icon: "🥦" },
      { value: "poultry",      label: "Poultry Farm",  icon: "🐔" },
      { value: "fish_pond",    label: "Fish Pond",     icon: "🐟" },
      { value: "mixed_crop",   label: "Mixed Crop",    icon: "🌱" },
    ],
  },
  {
    value: "plot",
    labelKey: "type_plot",
    icon: "📐",
    subTypes: [
      { value: "dtcp_approved", label: "DTCP Approved", icon: "✅" },
      { value: "rera_approved", label: "RERA Approved", icon: "🏛️" },
      { value: "gated_community",label: "Gated Community",icon: "🔒" },
      { value: "villa_plot",    label: "Villa Plot",   icon: "🏰" },
      { value: "open_plot",     label: "Open Plot",    icon: "🟩" },
      { value: "corner_plot",   label: "Corner Plot",  icon: "📐" },
    ],
  },
]