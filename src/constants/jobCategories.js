// One list of job categories for both the job form (/create-bid) and the marketplace
// filters (/bids/marketplace), so what a buyer picks is what vendors can filter on.
// Keys are the top-level categories; values are the optional "narrow it down" choices.
export const JOB_CATEGORIES = {
  "Construction & Property": [
    "General Contracting", "Home Remodeling", "Kitchen Remodeling", "Bathroom Remodeling",
    "Roofing", "Flooring", "Painting", "Plumbing", "Electrical", "HVAC", "Landscaping",
    "Masonry", "Windows & Doors", "Pool Construction", "Demolition", "Structural Engineering",
    "Architecture & Design", "Commercial Construction", "Facility Maintenance",
  ],
  "Real Estate & Property Services": [
    "Property Management", "Appraisal", "Inspection", "Property Marketing",
    "Leasing Services", "Real Estate Photography", "Title & Escrow Services",
  ],
  "Professional Services": [
    "Legal", "Accounting", "Tax Preparation", "Business Consulting",
    "Management Consulting", "Financial Advisory", "HR & Recruiting",
    "Market Research", "Compliance & Regulatory",
  ],
  "Technology & Software": [
    "Software Development", "Web Development", "Mobile App Development",
    "AI / Machine Learning", "Blockchain", "Data Engineering", "Cybersecurity",
    "DevOps / Cloud", "IT Support", "System Integration", "ERP Implementation",
  ],
  "Creative & Marketing": [
    "Graphic Design", "Branding", "Advertising", "Digital Marketing", "SEO",
    "Social Media Management", "Content Creation", "Copywriting",
    "Video Production", "Photography", "UI / UX Design",
  ],
  "Manufacturing & Product Development": [
    "Industrial Design", "Prototyping", "Product Engineering", "Tooling",
    "Contract Manufacturing", "Packaging Design", "Quality Assurance",
  ],
  "Logistics & Transportation": [
    "Freight Shipping", "Trucking", "Last Mile Delivery", "Warehousing",
    "Fulfillment", "Supply Chain Logistics", "Customs Brokerage", "Moving",
  ],
  "Equipment & Procurement": [
    "Equipment Purchase", "Equipment Leasing", "Industrial Machinery",
    "Medical Equipment", "Construction Equipment", "IT Hardware",
  ],
  "Maintenance & Field Services": [
    "Appliance Repair", "Equipment Repair", "Cleaning Services",
    "Security Services", "Pest Control", "Elevator Maintenance",
  ],
  "Healthcare Services": [
    "Telehealth Providers", "Medical Staffing", "Medical Billing",
    "Healthcare IT", "Medical Equipment Installation",
  ],
  "Government & Public Contracts": [
    "Infrastructure Projects", "Public Works", "Government IT",
    "Defense Contracts", "Municipal Services",
  ],
};

export const JOB_CATEGORY_NAMES = Object.keys(JOB_CATEGORIES);

/** Text a request can be matched on: its job category and subcategory, else the legacy product category. */
export const requestCategoryText = (request) =>
  [request?.job_category, request?.job_subcategory, request?.category_name]
    .filter(Boolean)
    .join(" ");

/** Short label shown on a request card. */
export const requestCategoryLabel = (request) =>
  request?.job_subcategory || request?.job_category || request?.category_name || "";
