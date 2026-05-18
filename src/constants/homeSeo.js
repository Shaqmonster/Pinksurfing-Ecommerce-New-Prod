import { SITE_URL } from "../components/PageSEO";

export const HOME_META = {
  title: "PinkSurfing | Marketplace for Products, Business & Gigs",
  description:
    "Shop and sell on PinkSurfing—multi-vendor marketplace for products, businesses for sale, real estate, cars, and GigHub freelance services. Browse categories today.",
  ogTitle: "PinkSurfing — Shop, Sell & Hire on One Marketplace",
  ogDescription:
    "Discover products, business acquisitions, real estate, and freelance services. Buy, list, or hire on PinkSurfing.",
};

export const HOME_FAQ = [
  {
    question: "What is PinkSurfing?",
    answer:
      "PinkSurfing is a multi-vendor marketplace where you can shop products, browse businesses for sale, explore real estate and vehicles, and hire freelancers through GigHub—all on one platform.",
  },
  {
    question: "What can I buy on PinkSurfing?",
    answer:
      "Active categories include businesses for sale, residential and commercial real estate, cars and trucks, perfumes, trading cards, and products from independent vendor stores in the shopping mall.",
  },
  {
    question: "How do I sell on PinkSurfing?",
    answer:
      "Register for a vendor account from the homepage or footer, complete your store profile, and list products or specialized listings such as businesses for sale through the vendor dashboard.",
  },
  {
    question: "What is GigHub on PinkSurfing?",
    answer:
      "GigHub is PinkSurfing's freelance services marketplace. Browse gigs, hire verified professionals, and manage orders with secure marketplace tools.",
  },
  {
    question: "Is PinkSurfing safe for buyers and sellers?",
    answer:
      "PinkSurfing provides marketplace tooling for orders, messaging, and category-specific flows such as NDAs for business listings. Always review listing details and seller profiles before you transact.",
  },
];

export const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "PinkSurfing",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.jpg`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "PinkSurfing",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: HOME_FAQ.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      })),
    },
  ],
};
