import type { Block } from "./blocks";
import { SITE_EMAIL, SITE_SUMMARY } from "./site";

export interface Faq {
  question: string;
  answer: string;
}

export interface Feature {
  title: string;
  description: string;
}

export interface Step {
  title: string;
  description: string;
}

export interface UseCase {
  title: string;
  description: string;
}

export const features: Feature[] = [
  {
    title: "Drag-and-drop editor",
    description:
      "Add, edit, reorder, and remove fields in the browser. Set labels and options without writing form code.",
  },
  {
    title: "Style controls",
    description:
      "Set colors, type, spacing, corners, a logo, and the button label. Choose a solid, outline, or gradient button.",
  },
  {
    title: "Public link and embed",
    description:
      "Every published form has a link at /f/your-slug. Embed the same form in an iframe and add ?embed=true to hide the page chrome.",
  },
  {
    title: "Response dashboard",
    description:
      "Read submissions for the forms you own. The dashboard is filled from your account, not from sample numbers.",
  },
  {
    title: "Subscribers and campaigns",
    description:
      "Keep a subscriber list, export it to CSV or PDF, and send a campaign with an unsubscribe link in each message.",
  },
  {
    title: "Separated accounts",
    description:
      "Each account only reads its own forms, responses, subscribers, and campaigns. Public forms also include a honeypot and a too-fast submit check.",
  },
];

export const steps: Step[] = [
  {
    title: "Create the form",
    description: "Start from a blank form and add only the fields you will use.",
  },
  {
    title: "Set the look and the alert",
    description:
      "Choose colors, type, and button text. Add a notification email if you want a message when someone responds.",
  },
  {
    title: "Share it and read the answers",
    description:
      "Copy the public link or embed the form. Submissions stay on that form and, for a subscriber form, on your subscriber list.",
  },
];

export const useCases: UseCase[] = [
  {
    title: "Contact and lead forms",
    description:
      "Ask for the name and email you will reply to. Boltfy stores the response and can email you when it arrives.",
  },
  {
    title: "Surveys and feedback",
    description:
      "Collect ratings and written answers, then review them from the form's submissions instead of a spreadsheet you update by hand.",
  },
  {
    title: "Newsletter signup",
    description:
      "Add people to the subscriber list and send a campaign. Each campaign message includes a link to unsubscribe.",
  },
];

export const pricingFeatures: string[] = [
  "Drag-and-drop form builder",
  "Public link and iframe embed",
  "Response list for each form",
  "Subscriber list with CSV and PDF export",
  "Email templates and campaigns",
  "Notification email when a form is submitted",
  "Light, dark, and system theme in the app",
  `Email support at ${SITE_EMAIL}`,
];

export const faqs: Faq[] = [
  {
    question: "What is Boltfy?",
    answer: SITE_SUMMARY,
  },
  {
    question: "Can I build a form without writing code?",
    answer:
      "Yes. The editor is visual. You add fields, change labels, reorder them, and set colors, type, spacing, and the button label from the form settings.",
  },
  {
    question: "Is Boltfy free?",
    answer:
      "Creating an account and publishing forms does not require a credit card, and the app does not show paid tiers. Campaign email is delivered by Resend when that service is configured for the project. If it is not configured, Boltfy keeps the campaign record and does not send the mail.",
  },
  {
    question: "How do I share a form?",
    answer:
      "Open the published form's public link, which looks like https://boltfy.io/f/your-slug. To place it on another site, embed that URL in an iframe and add ?embed=true.",
  },
  {
    question: "Can I connect Slack, Zapier, or my own domain?",
    answer:
      "Not inside Boltfy. You can email yourself on each submission, and you can export subscribers to CSV or PDF for another tool. Boltfy does not attach a custom domain to a form, and it does not post responses to Slack or Zapier.",
  },
  {
    question: "How is one account's data kept separate?",
    answer:
      "Forms, submissions, subscribers, campaigns, and templates are stored per account. Row-level security policies only return rows owned by the signed-in user. A visitor can submit a published form; that write goes through a server function that assigns the form owner, so the visitor does not choose which account receives the data.",
  },
  {
    question: "Does Boltfy include a cookie banner or a one-click data export?",
    answer:
      "No. The app uses the session it needs to keep you signed in. You can delete subscriber records from the Subscribers page. Privacy questions go to support@boltfy.io. The privacy policy describes what the site collects.",
  },
];

export const aboutBlocks: Block[] = [
  {
    type: "p",
    text: SITE_SUMMARY,
  },
  {
    type: "h2",
    text: "Who it is for",
  },
  {
    type: "p",
    text: "Boltfy is for people who need a form on a site, a public link they can send, and a list of the people who answered. It fits contact forms, short surveys, feedback, and newsletter signup.",
  },
  {
    type: "h2",
    text: "What you can do",
  },
  {
    type: "ul",
    items: features.map((feature) => `${feature.title}. ${feature.description}`),
  },
  {
    type: "h2",
    text: "What it does not do",
  },
  {
    type: "p",
    text: "Boltfy does not include paid plans, a custom domain for forms, Slack or Zapier connections, or a cookie-consent banner. It is not a CRM. Export the subscriber file when you need the list somewhere else.",
  },
  {
    type: "h2",
    text: "How to reach Boltfy",
  },
  {
    type: "p",
    text: `Email ${SITE_EMAIL} or use the contact form. Include the form link if your question is about a published form. There is no public office address.`,
  },
];
