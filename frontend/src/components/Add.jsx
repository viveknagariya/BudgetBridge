import React from "react";
import {
  X,
  FileText,
  IndianRupee,
  Tags,
  CalendarDays,
  ChevronDown,
} from "lucide-react";

const getTheme = (color) => {
  if (color === "teal") {
    return {
      accentText: "text-teal-700",
      accentBg: "bg-teal-600",
      accentHover: "hover:bg-teal-700",
      softBg: "bg-teal-50",
      softText: "text-teal-700",
      border: "focus:border-teal-500",
      ring: "focus:ring-teal-100",
    };
  }

  return {
    accentText: "text-orange-700",
    accentBg: "bg-orange-600",
    accentHover: "hover:bg-orange-700",
    softBg: "bg-orange-50",
    softText: "text-orange-700",
    border: "focus:border-orange-500",
    ring: "focus:ring-orange-100",
  };
};

const CATEGORY_KEYWORDS = {
  Food: [
    "apple", "apples", "banana", "bananas", "mango", "mangoes", "orange", "oranges", "grapes", "grape", "watermelon", "melon", "muskmelon", "papaya", "pineapple", "pomegranate", "anar", "guava", "jamfal", "chikoo", "sapota", "kiwi", "strawberry", "blueberry", "raspberry", "blackberry", "pear", "nashpati", "peach", "plum", "dragon fruit", "custard apple", "sitafal", "lychee", "litchi", "coconut", "nariyal", "lemon", "lime", "mosambi", "sweet lime", "fig", "anjeer", "dates", "khajur", "dry dates", "fruit", "fruits", "fruit basket", "fruit juice", "fresh fruit",
    "potato", "potatoes", "aloo", "onion", "onions", "pyaz", "tomato", "tomatoes", "chilli", "chili", "green chilli", "mirchi", "garlic", "lahsun", "ginger", "adrak", "coriander", "dhaniya", "mint", "pudina", "spinach", "palak", "fenugreek", "methi", "cabbage", "patta gobi", "cauliflower", "gobi", "brinjal", "baingan", "lady finger", "okra", "bhindi", "bitter gourd", "karela", "bottle gourd", "lauki", "ridge gourd", "turai", "capsicum", "bell pepper", "carrot", "gajar", "beetroot", "radish", "mooli", "cucumber", "kakdi", "beans", "green peas", "matar", "pumpkin", "kaddu", "sweet potato", "shakarkand", "corn", "makai", "mushroom", "broccoli", "lettuce", "spring onion", "drumstick", "sargavo", "vegetable", "vegetables", "sabji", "sabzi", "green vegetables", "fresh vegetables",
    "grocery", "groceries", "ration", "kirana", "rice", "chawal", "basmati", "wheat", "atta", "flour", "maida", "besan", "rava", "suji", "poha", "sabudana", "dalia", "oats", "corn flour", "dal", "daal", "lentils", "toor dal", "moong dal", "masoor dal", "chana dal", "urad dal", "rajma", "chole", "chickpeas", "kabuli chana", "soybean", "sugar", "chini", "jaggery", "gud", "salt", "namak", "rock salt", "black salt", "oil", "cooking oil", "sunflower oil", "groundnut oil", "mustard oil", "olive oil", "ghee", "vanaspati", "tea", "chai", "tea powder", "coffee", "coffee powder", "milk powder", "corn flakes", "breakfast cereal", "noodles", "maggi", "pasta", "vermicelli", "sevai", "bread", "bun", "toast", "jam", "honey", "peanut butter", "sauce", "ketchup", "vinegar", "mayonnaise", "pickle", "achar", "papad", "khakhra", "namkeen", "snacks", "biscuit", "biscuits", "cookies", "wafer", "chips", "dry fruits", "almond", "badam", "cashew", "kaju", "raisin", "kishmish", "pista", "walnut", "akhrot", "makhana", "spices", "masala", "turmeric", "haldi", "red chilli powder", "mirchi powder", "coriander powder", "dhaniya powder", "cumin", "jeera", "mustard seeds", "rai", "ajwain", "hing", "asafoetida", "garam masala", "chaat masala", "sambar masala", "pav bhaji masala", "biryani masala", "black pepper", "pepper", "elaichi", "cardamom", "clove", "laung", "cinnamon", "dalchini", "bay leaf", "tej patta", "ration shop", "monthly grocery", "monthly ration",
    "milk", "dudh", "curd", "dahi", "buttermilk", "chaas", "paneer", "cheese", "butter", "cream", "malai", "lassi", "yogurt", "milk packet", "amul milk", "amul", "dairy", "dairy product", "dairy products", "milkman",
    "egg", "eggs", "anda", "chicken", "mutton", "fish", "prawns", "seafood", "meat", "non veg", "non-veg", "omelette", "boiled egg",
    "restaurant", "hotel food", "outside food", "dinner", "lunch", "breakfast", "cafe", "coffee shop", "swiggy", "zomato", "dominos", "pizza", "burger", "sandwich", "vada pav", "dabeli", "pani puri", "street food", "chaat", "ice cream", "cake", "pastry", "cold drink", "soft drink", "juice shop", "tea stall", "chai tapri", "food delivery", "takeaway", "parcel food"
  ],
  Housing: [
    "rent", "house rent", "room rent", "flat rent", "pg rent", "hostel rent", "deposit", "security deposit", "brokerage", "home loan", "emi", "home emi", "furniture", "sofa", "bed", "mattress", "pillow", "bedsheet", "curtain", "doormat", "carpet", "chair", "table", "wardrobe", "almirah", "fan", "bulb", "tube light", "led bulb", "extension board", "switch", "home repair", "plumber", "electrician", "carpenter", "painting", "wall paint", "home decor", "repair", "maintenance", "home maintenance",
    "dishwash", "dish wash", "dishwash bar", "dish wash bar", "dishwash liquid", "vim", "pril", "soap bar", "detergent", "washing powder", "washing liquid", "surf excel", "tide", "rin", "fabric softener", "comfort", "floor cleaner", "phenyl", "lizol", "harpic", "toilet cleaner", "bathroom cleaner", "kitchen cleaner", "glass cleaner", "colin", "bleach", "disinfectant", "broom", "jhadu", "mop", "pocha", "bucket", "dustbin", "garbage bag", "trash bag", "tissue paper", "toilet paper", "paper towel", "napkin", "scrub", "scrubber", "sponge", "cleaning brush", "toilet brush", "room freshener", "air freshener", "agarbatti", "incense stick", "matchbox", "lighter", "mosquito coil", "mosquito liquid", "good night", "all out", "hit spray", "cockroach spray", "pest control", "cleaning", "house cleaning", "household item", "household items"
  ],
  Transport: [
    "bus", "brts", "metro", "train", "railway", "auto", "rickshaw", "taxi", "cab", "ola", "uber", "rapido", "petrol", "diesel", "fuel", "cng", "parking", "toll", "fastag", "vehicle service", "bike service", "car service", "puncture", "tyre", "helmet", "bus pass", "train ticket", "flight ticket", "air ticket", "travel", "trip", "hotel booking", "luggage", "suitcase"
  ],
  Shopping: [
    "shirt", "tshirt", "t-shirt", "jeans", "pant", "trouser", "kurta", "kurti", "saree", "dress", "jacket", "sweater", "hoodie", "innerwear", "undergarments", "socks", "cap", "belt", "wallet", "shoes", "slippers", "sandals", "footwear", "laundry", "dry cleaning", "tailor", "stitching", "clothes", "clothing",
    "mobile", "phone", "smartphone", "laptop", "computer", "keyboard", "mouse", "charger", "cable", "usb cable", "power bank", "earphones", "headphones", "speaker", "bluetooth", "adapter", "pendrive", "hard disk", "ssd", "memory card", "router", "wifi router", "monitor", "printer", "cartridge", "electronics", "gadget", "gadgets", "mobile cover", "screen guard", "tempered glass", "repair mobile", "laptop repair",
    "soap", "body soap", "bathing soap", "shampoo", "conditioner", "hair oil", "toothpaste", "tooth brush", "toothbrush", "mouthwash", "face wash", "facewash", "cream", "moisturizer", "lotion", "sunscreen", "lip balm", "deodorant", "perfume", "body spray", "talcum powder", "powder", "comb", "hair gel", "hair wax", "razor", "shaving cream", "after shave", "trimmer", "sanitary pad", "sanitary pads", "tampon", "menstrual cup", "diaper", "baby diaper", "wet wipes", "cotton buds", "nail cutter", "handwash", "hand wash", "sanitizer", "personal care", "skin care", "hair care"
  ],
  Entertainment: [
    "movie", "cinema", "pvr", "inox", "ticket", "concert", "game", "gaming", "playstation", "xbox", "outing", "picnic", "amusement", "fun", "club", "sports", "cricket", "football", "badminton", "gym", "fitness"
  ],
  Utilities: [
    "electricity", "electricity bill", "light bill", "bijli bill", "gas bill", "pipeline gas", "png gas", "lpg", "gas cylinder", "cylinder", "water bill", "pani bill", "internet bill", "wifi bill", "broadband", "fiber bill", "mobile bill", "postpaid bill", "landline bill", "dth bill", "cable bill", "tv bill", "maintenance bill", "society maintenance", "property tax", "house tax", "municipal tax", "bill", "bills", "utility", "utilities",
    "recharge", "mobile recharge", "phone recharge", "jio recharge", "airtel recharge", "vi recharge", "vodafone recharge", "bsnl recharge", "data pack", "internet pack", "top up", "dth recharge", "tataplay", "tata play", "dish tv", "sun direct", "netflix", "amazon prime", "prime video", "hotstar", "disney hotstar", "zee5", "sonyliv", "youtube premium", "spotify", "gaana", "jiosaavn", "subscription", "subscriptions", "ott", "app subscription", "software subscription", "domain renewal", "hosting renewal"
  ],
  Healthcare: [
    "medicine", "medicines", "tablet", "capsule", "syrup", "injection", "doctor", "doctor fee", "consultation", "hospital", "clinic", "medical", "pharmacy", "chemist", "lab test", "blood test", "x ray", "x-ray", "scan", "mri", "ct scan", "health checkup", "first aid", "bandage", "cotton", "dettol", "savlon", "painkiller", "paracetamol", "crocin", "dolo", "antibiotic", "eye drops", "health insurance", "medical insurance", "mask", "thermometer", "bp machine", "glucose meter", "health"
  ],
  Education: [
    "school fee", "sharpner", "college fee", "tuition fee", "school bag", "course fee", "exam fee", "admission fee", "book", "books", "notebook", "register", "pen", "pencil", "eraser", "sharpener", "marker", "highlighter", "file", "folder", "xerox", "photocopy", "printout", "printing", "assignment", "project file", "stationery", "online course", "udemy", "coursera", "certificate", "coaching", "classes", "education"
  ],
  Other: [
    "baby food", "baby powder", "baby soap", "baby shampoo", "toy", "toys", "kids dress", "kids shoes", "milk bottle", "baby wipes", "family expense", "kids", "child", "children", "gift", "gifts", "birthday gift", "anniversary gift", "wedding gift", "donation", "charity", "mandir donation", "temple donation", "help", "festival gift", "diwali gift", "rakhi gift", "bank charge", "bank charges", "atm charge", "transaction fee", "upi charge", "loan emi", "credit card bill", "debit card charge", "insurance", "life insurance", "vehicle insurance", "mutual fund", "sip", "investment", "interest", "penalty", "late fee", "finance", "banking", "other", "misc", "miscellaneous", "general", "cash", "unknown", "extra", "small expense", "daily expense"
  ]
};

const AddTransactionModal = ({
  showModal,
  setShowModal,
  newTransaction,
  setNewTransaction,
  handleAddTransaction,
  title = "Add Transaction",
  buttonText = "Add",
  categories = [],
  color = "orange",
  loading = false,
}) => {
  if (!showModal) return null;

  const theme = getTheme(color);

  const inputClass = `w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm font-medium text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 ${theme.border} focus:ring-4 ${theme.ring}`;

  const labelClass = "mb-2 block text-sm font-bold text-slate-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950">{title}</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Fill the details carefully to save your transaction
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className={labelClass}>Description</label>
            <div className="relative">
              <FileText className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={newTransaction.description}
                onChange={(e) => {
                  const desc = e.target.value;
                  const text = String(desc).toLowerCase();
                  let matchedCategory = newTransaction.category;

                  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
                    if (keywords.some((keyword) => text.includes(keyword))) {
                      matchedCategory = category;
                      break;
                    }
                  }

                  setNewTransaction({
                    ...newTransaction,
                    description: desc,
                    category: matchedCategory,
                  });
                }}
                className={inputClass}
                placeholder="What was this for?"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Amount (Rs.)</label>
            <div className="relative">
              <IndianRupee className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                min="1"
                value={newTransaction.amount}
                onChange={(e) =>
                  setNewTransaction({
                    ...newTransaction,
                    amount: e.target.value,
                  })
                }
                className={inputClass}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Category</label>
            <div className="relative">
              <Tags className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={newTransaction.category}
                onChange={(e) =>
                  setNewTransaction({
                    ...newTransaction,
                    category: e.target.value,
                  })
                }
                className={`${inputClass} cursor-pointer appearance-none pr-11`}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Date</label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={newTransaction.date}
                onChange={(e) =>
                  setNewTransaction({
                    ...newTransaction,
                    date: e.target.value,
                  })
                }
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddTransaction}
            disabled={loading}
            className={`mt-2 inline-flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-extrabold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 ${theme.accentBg} ${theme.accentHover}`}
          >
            {loading ? "Adding..." : buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;
