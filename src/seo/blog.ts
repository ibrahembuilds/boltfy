import type { Block } from "./blocks";

export interface BlogArticle {
  slug: string;
  title: string;
  description: string;
  published: string;
  modified: string;
  author: string;
  category: string;
  readTime: string;
  image: string;
  sections: Block[];
}

export const blogArticles: BlogArticle[] = [
  {
    slug: "best-form-builder-for-conversion-optimization-2026",
    title: "How to get more people to finish a form",
    description:
      "A form gets finished when the question is clear and the fields match the promise. Here is what to change before you redesign the page, and how to publish that form with Boltfy.",
    published: "2025-12-30",
    modified: "2026-10-22",
    author: "Elena Rivers",
    category: "Strategy",
    readTime: "7 min",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200",
    sections: [
      {
        type: "p",
        text: "People finish a form when they understand the question, the fields match what the page promised, and the next step is obvious. A new background will not rescue a form that asks for a phone number, a company size, and a budget before it says what the person gets back.",
      },
      {
        type: "h2",
        text: "What should you ask for?",
      },
      {
        type: "p",
        text: "Start from the decision you will make with the answer. A newsletter form needs an email address. A contact form usually needs a name, an email, and a message. Add another field only when you will treat that answer differently.",
      },
      {
        type: "ul",
        items: [
          "Put the ask in the form title, not only in the page around it.",
          "Keep labels visible. Placeholder text disappears while someone types.",
          "Say what happens after submit: a reply, a file, or a place on a list.",
          "Name the button for the action, such as \"Get the guide\" or \"Send the message\", when \"Submit\" is vague.",
        ],
      },
      {
        type: "h2",
        text: "What should you check on a phone?",
      },
      {
        type: "p",
        text: "Tap every field with a thumb. The keyboard should not cover the field you are filling. Errors should name the field that failed, and the space between inputs should be wide enough that the wrong row is hard to hit. Boltfy stores spacing, label size, and input size on the form, so you can change those without a separate mobile layout.",
      },
      {
        type: "h2",
        text: "How do you publish the shorter form with Boltfy?",
      },
      {
        type: "p",
        text: "Create the form in the editor and delete any field you will not use. Set the button label in the style controls. Publish it and copy the public link, which looks like /f/your-slug. To put the form on a page you already have, embed that link in an iframe and add ?embed=true so Boltfy's own page frame is left off.",
      },
      {
        type: "ul",
        items: [
          "Add a notification email on the form if you want a message for each response.",
          "Read submissions from that form's list. The numbers there are the responses stored for your account.",
          "Export subscribers to CSV or PDF when the list needs to live in another tool.",
        ],
      },
      {
        type: "h2",
        text: "What is worth comparing?",
      },
      {
        type: "p",
        text: "Compare how many people you sent to the form with how many submissions were stored that week. Boltfy does not invent a benchmark for you. If responses are low, remove a field or rewrite the button before you restyle the page.",
      },
      {
        type: "quote",
        text: "A shorter form is a product decision. Every field you keep should change what you do next.",
      },
    ],
  },
  {
    slug: "how-to-collect-leads-automatically-no-code",
    title: "How to collect leads with a no-code form",
    description:
      "Publish a Boltfy form, get an email when someone submits, keep subscribers on your account, and export or email them. No custom backend.",
    published: "2025-12-25",
    modified: "2026-10-22",
    author: "Marcus Chen",
    category: "Automation",
    readTime: "8 min",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200",
    sections: [
      {
        type: "p",
        text: "A lead form has to capture an address you will write to, store it on the account that owns the form, and tell you it arrived. Boltfy does those three things. It does not file the lead into a CRM, Slack, or Zapier for you.",
      },
      {
        type: "h2",
        text: "How do you set the form up?",
      },
      {
        type: "ul",
        items: [
          "Create a form and turn on subscriber collection if the response should join your subscriber list.",
          "Ask for an email address. Add a name only if the campaign will use it.",
          "Put your own address in the form's notification email so each submission can mail you.",
          "Share the public link (/f/your-slug), or embed the form and add ?embed=true.",
        ],
      },
      {
        type: "p",
        text: "A visitor submits the public form through a server function. That function attaches the response to the form owner. The visitor never picks which account receives the row.",
      },
      {
        type: "h2",
        text: "How do you follow up?",
      },
      {
        type: "p",
        text: "Open Subscribers to see who is active and who has unsubscribed. Write a campaign and send it to active subscribers. Each message includes an unsubscribe link. Delivery uses Resend when that key is configured for the Boltfy project. If the key is missing, Boltfy stores the campaign and does not send mail.",
      },
      {
        type: "h2",
        text: "How do you move leads into another tool?",
      },
      {
        type: "p",
        text: "Export the subscriber list to CSV or PDF from the Subscribers page, then import the file into the tool you already use. There is no built-in webhook, Slack post, or Zapier action. The export is the handoff.",
      },
      {
        type: "quote",
        text: "Collect the address, store it on your account, and export it when another system needs it.",
      },
    ],
  },
  {
    slug: "luxury-web-design-trends-for-saas-forms",
    title: "How to design a form people trust",
    description:
      "Contrast, spacing, visible labels, and a specific button do more than decoration. These are the style controls Boltfy stores on each form.",
    published: "2025-12-18",
    modified: "2026-10-22",
    author: "Elena Rivers",
    category: "Design",
    readTime: "6 min",
    image: "https://images.unsplash.com/photo-1558655146-23ecdd3f4040?auto=format&fit=crop&q=80&w=1200",
    sections: [
      {
        type: "p",
        text: "People trust a form they can read that looks like the same product as the page around it. They do not need a glass effect. They need contrast, a readable size, labels that stay visible, and a button that says what will happen.",
      },
      {
        type: "h2",
        text: "Which style controls does Boltfy store?",
      },
      {
        type: "p",
        text: "The editor saves a style object with the form. You can change it and the published form uses those values.",
      },
      {
        type: "ul",
        items: [
          "Primary, background, text, border, and input colors.",
          "Font family, plus sizes for the title, labels, and inputs.",
          "Alignment for the title and the labels.",
          "Corner radius, padding, and the space between fields.",
          "A logo image, its size, and whether it shows.",
          "Button label, size, and a solid, outline, or gradient button.",
          "A solid, gradient, or patterned background.",
        ],
      },
      {
        type: "h2",
        text: "How should you use them?",
      },
      {
        type: "ul",
        items: [
          "Put dark text on a light field, or light text on a dark field. If you cannot read a label at arm's length, raise the contrast.",
          "Keep one column. Several columns look dense and collapse badly on a phone.",
          "Match the button color to the site where the form is embedded.",
          "Hide the logo unless it is the same mark as that site.",
          "Replace a generic \"Submit\" label when the outcome can be named.",
        ],
      },
      {
        type: "h2",
        text: "Does the app theme change the published form?",
      },
      {
        type: "p",
        text: "The Boltfy workspace has a light theme, a dark theme, and a system theme. A published form does not follow that switch. It uses the colors saved on the form, so choose them for the page where the form will appear.",
      },
      {
        type: "quote",
        text: "Style the form so the question is the first thing a person sees.",
      },
    ],
  },
];

export function findArticle(slug: string | undefined): BlogArticle | undefined {
  if (!slug) return undefined;
  return blogArticles.find((article) => article.slug === slug);
}
