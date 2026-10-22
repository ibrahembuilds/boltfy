export interface FaqItem {
  question: string;
  answer: string;
}

/** Shared FAQ copy — used on the landing page and FAQPage JSON-LD for SEO/GEO. */
export const LANDING_FAQ: FaqItem[] = [
  {
    question: "Can I build forms without writing code?",
    answer:
      "Yes. Boltfy is a visual drag-and-drop form builder. Configure fields, validation, labels, and styling without touching code.",
  },
  {
    question: "Is Boltfy really free forever?",
    answer:
      "Yes. Boltfy is free with unlimited forms and unlimited responses. There are no paid tiers, trials, or hidden fees for core form building and collection.",
  },
  {
    question: "Are integrations and webhooks included?",
    answer:
      "Yes. Connect forms to Supabase, forward submissions to webhooks, and send notifications via email — supported on the free plan.",
  },
  {
    question: "Can I use a custom domain?",
    answer:
      "You can map custom domains or subdomains in settings. HTTPS/SSL is handled for published form links.",
  },
  {
    question: "Is Boltfy GDPR-friendly?",
    answer:
      "Boltfy is built with privacy in mind: encrypted storage, unsubscribe flows for email campaigns, and tools to manage subscriber data from your workspace.",
  },
  {
    question: "What is Boltfy best for?",
    answer:
      "Lead capture, contact forms, customer feedback, waitlists, and newsletter signups — especially when you want beautiful UI, fast setup, and built-in subscriber and campaign tools.",
  },
];
