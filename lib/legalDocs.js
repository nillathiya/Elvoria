// Content for the footer "legal" pages. Demonstration copy — not real legal text.
import {
  BRAND,
  SUPPORT_EMAIL,
  SUPPORT_WHATSAPP,
  SUPPORT_WHATSAPP_DISPLAY,
} from "./config";

const UPDATED = "January 2026";

// Ordered list drives the footer link order.
export const LEGAL_ORDER = [
  "client-agreement",
  "general-business-terms",
  "partnership-agreement",
  "bonus-terms",
  "confidentiality-policy",
  "key-facts-statement",
  "conflicts-of-interest",
  "privacy-agreement",
  "risk-disclosure",
  "kyc-verification",
  "preventing-money-laundering",
  "complaints-handling-policy",
  "contact",
];

const AMEND = {
  h: "Amendments",
  p: [
    `${BRAND} may update this document from time to time. The latest version is always available from the footer of the platform, and continued use after an update constitutes acceptance of the revised terms.`,
  ],
};
const GOVERN = {
  h: "Governing terms",
  p: [
    "This document should be read together with the other agreements and policies linked in the footer. Where a conflict arises, the specific terms of the relevant policy prevail.",
  ],
};

export const LEGAL_DOCS = {
  "client-agreement": {
    title: "Client Agreement",
    updated: UPDATED,
    intro: `This Client Agreement sets out the terms on which ${BRAND} provides access to its trading platform and related services. By opening an account you confirm that you have read, understood and accepted these terms.`,
    sections: [
      { h: "1. Scope of services", p: ["We provide an execution-only trading environment for contracts for difference (CFDs) and related instruments. We do not provide investment advice, and you are solely responsible for your trading decisions."] },
      { h: "2. Account eligibility", p: ["To open an account you must be of legal age in your jurisdiction and legally permitted to use leveraged trading products. We may request documents to verify your identity and source of funds."] },
      { h: "3. Orders and execution", p: ["Orders are executed on a best-efforts basis at prevailing market prices. Prices may move between order placement and execution, and slippage may occur during volatile market conditions."] },
      AMEND,
      GOVERN,
    ],
  },
  "general-business-terms": {
    title: "General Business Terms",
    updated: UPDATED,
    intro: `These General Business Terms describe how ${BRAND} conducts business with clients, including order handling, pricing and the general operation of trading accounts.`,
    sections: [
      { h: "1. Pricing", p: ["Quoted prices are derived from our liquidity providers plus any applicable spread. Spreads are variable and can widen during periods of low liquidity or high volatility."] },
      { h: "2. Margin and leverage", p: ["Trading on margin allows you to open positions larger than your deposited funds. Leverage magnifies both profits and losses, and positions may be closed automatically if your margin level falls below the required threshold."] },
      { h: "3. Fees and charges", p: ["Applicable fees, commissions and swap/overnight charges are displayed in the platform and may change with notice."] },
      AMEND,
    ],
  },
  "partnership-agreement": {
    title: "Partnership Agreement",
    updated: UPDATED,
    intro: `The Partnership Agreement governs the relationship between ${BRAND} and partners who refer new clients through the affiliate and introducing-broker programs.`,
    sections: [
      { h: "1. Commissions", p: ["Partners may earn a revenue share of up to 40% based on the trading activity of referred clients. Commission rates and qualifying criteria are set out in your partner dashboard."] },
      { h: "2. Marketing conduct", p: ["Partners must promote the service honestly and must not make misleading claims about potential returns or guarantee profits."] },
      { h: "3. Payments", p: ["Commissions accrue in real time and can be withdrawn subject to the minimum payout threshold and applicable checks."] },
      AMEND,
    ],
  },
  "bonus-terms": {
    title: "Bonus Terms and Conditions",
    updated: UPDATED,
    intro: `These Bonus Terms and Conditions apply to any promotional credits, rebates or bonuses offered by ${BRAND} from time to time.`,
    sections: [
      { h: "1. Eligibility", p: ["Bonuses are optional and may be limited to specific account types, regions or promotional periods. Each promotion may carry its own additional conditions."] },
      { h: "2. Withdrawal conditions", p: ["Bonus funds may be subject to trading-volume requirements before associated profits can be withdrawn. Withdrawing before these conditions are met may remove the bonus amount."] },
      { h: "3. Abuse", p: ["We reserve the right to remove bonuses and related profits where we identify abuse or activity intended solely to exploit a promotion."] },
      AMEND,
    ],
  },
  "confidentiality-policy": {
    title: "Confidentiality Policy",
    updated: UPDATED,
    intro: `This Confidentiality Policy explains how ${BRAND} treats confidential information exchanged between you and us.`,
    sections: [
      { h: "1. What we protect", p: ["Confidential information includes your account details, identity documents, transaction history and any non-public information shared with us."] },
      { h: "2. How we use it", p: ["We use confidential information only to operate your account, meet legal obligations and improve our services. We do not sell your information."] },
      { h: "3. Disclosure", p: ["We may disclose information where required by law, regulation or a valid request from a competent authority."] },
      GOVERN,
    ],
  },
  "key-facts-statement": {
    title: "Key Facts Statement",
    updated: UPDATED,
    intro: `This Key Facts Statement summarises the most important things you should know before trading with ${BRAND}.`,
    sections: [
      { h: "Product", p: ["We offer leveraged CFDs on forex, metals, indices, energies and cryptocurrencies. CFDs are complex instruments and are traded on margin."] },
      { h: "Costs", p: ["The main costs are spreads, commissions and overnight financing. These vary by instrument and account type."] },
      { h: "Risk", p: ["You can lose more than your initial deposit. Leveraged trading is not suitable for everyone — see the Risk Disclosure for details."] },
    ],
  },
  "conflicts-of-interest": {
    title: "Conflicts of Interest",
    updated: UPDATED,
    intro: `This policy describes how ${BRAND} identifies and manages conflicts of interest that could affect the fair treatment of clients.`,
    sections: [
      { h: "1. Identifying conflicts", p: ["A conflict may arise between the firm and a client, or between two clients, for example through fees, incentives or the way orders are handled."] },
      { h: "2. Managing conflicts", p: ["We maintain organisational and administrative controls, including staff policies and separation of functions, to prevent conflicts from harming clients."] },
      { h: "3. Disclosure", p: ["Where a conflict cannot be managed with reasonable confidence, we will disclose it to you before proceeding."] },
      AMEND,
    ],
  },
  "privacy-agreement": {
    title: "Privacy Agreement",
    updated: UPDATED,
    intro: `This Privacy Agreement explains what personal data ${BRAND} collects, why we collect it, and the rights you have over your data.`,
    sections: [
      { h: "1. Data we collect", p: ["We collect information you provide when registering, as well as technical data such as device and usage information needed to operate the service securely."] },
      { h: "2. Your rights", p: ["You may request access to, correction of, or deletion of your personal data, subject to legal retention requirements."] },
      { h: "3. Security", p: ["We apply technical and organisational measures designed to protect your data against unauthorised access, loss or misuse."] },
      AMEND,
    ],
  },
  "risk-disclosure": {
    title: "Risk Disclosure",
    updated: UPDATED,
    intro: `This Risk Disclosure highlights the key risks of trading leveraged products with ${BRAND}. Please read it carefully.`,
    sections: [
      { h: "1. Market risk", p: ["Prices can move rapidly and unpredictably. You may lose some or all of your invested capital, and losses can exceed your deposits when trading on leverage."] },
      { h: "2. Leverage risk", p: ["Leverage increases both potential gains and potential losses. A small market move can have a large effect on your account."] },
      { h: "3. Suitability", p: ["Leveraged trading is not suitable for all investors. Only trade with money you can afford to lose, and seek independent advice if you are unsure."] },
    ],
  },
  "kyc-verification": {
    title: "KYC & Verification",
    updated: UPDATED,
    intro: `Before you can deposit, withdraw or trade live, ${BRAND} verifies your identity — the standard "Know Your Customer" (KYC) check every regulated broker is required to carry out.`,
    sections: [
      { h: "1. Proof of identity", p: ["A clear photo of a valid government-issued document: passport, national ID card or driving licence. All four corners must be visible and every detail legible."] },
      { h: "2. Proof of address", p: ["A utility bill, bank statement or official letter issued within the last three months, showing your name and residential address."] },
      { h: "3. Source of funds", p: ["For larger deposits we may request a document evidencing your source of funds, such as a payslip or bank statement, in line with anti-money-laundering rules."] },
      { h: "4. Review time", p: ["Documents are usually reviewed within a few hours. You are notified in-app as soon as your account is verified, after which deposits and withdrawals are unlocked."] },
    ],
    // Rendered as a structured "licence" card by the legal page. Kept
    // deliberately fictional: a portfolio demo must never present itself as a
    // really-authorised broker (the disclaimer note is shown inside the card).
    licence: {
      rows: [
        { k: "Entity", v: `${BRAND} Demo Ltd` },
        { k: "Licence reference", v: "ELV-2026-0417" },
        { k: "Issuing body", v: `${BRAND} Demo Conduct Authority` },
        { k: "Jurisdiction", v: "Demonstration environment" },
        { k: "Issued", v: UPDATED },
        { k: "Status", v: "Illustrative — not a real authorisation" },
      ],
      note: `This licence is fictional. ${BRAND} is not a licensed or regulated broker, holds no authorisation from any real financial regulator, and you should never deposit real funds. The details above exist only so this portfolio demo looks complete.`,
    },
  },
  "preventing-money-laundering": {
    title: "Preventing Money Laundering",
    updated: UPDATED,
    intro: `${BRAND} is committed to preventing money laundering and the financing of illegal activity. This policy summarises the measures we apply.`,
    sections: [
      { h: "1. Know Your Customer", p: ["We verify the identity of every client and may request documents confirming identity, address and source of funds before enabling certain features."] },
      { h: "2. Monitoring", p: ["We monitor transactions for unusual patterns and may request additional information or restrict activity where necessary."] },
      { h: "3. Reporting", p: ["We cooperate with regulators and report suspicious activity in line with applicable law."] },
    ],
  },
  "complaints-handling-policy": {
    title: "Complaints Handling Policy",
    updated: UPDATED,
    intro: `This Complaints Handling Policy explains how to raise a complaint with ${BRAND} and how we will handle it.`,
    sections: [
      { h: "1. How to complain", p: ["You can submit a complaint through the in-app support channel or by contacting our support team. Please include your account number and a clear description of the issue."] },
      { h: "2. Our process", p: ["We acknowledge complaints promptly and aim to resolve them fairly and as quickly as possible, keeping you informed throughout."] },
      { h: "3. Escalation", p: ["If you are not satisfied with the outcome, you may escalate the matter through the channels described in our response."] },
    ],
  },
  contact: {
    title: "Contact",
    updated: UPDATED,
    intro: `Need help? The ${BRAND} support team is here for you 24/7. Reach us through any of the channels below.`,
    // Tappable channels rendered above the text sections. WhatsApp opens a chat
    // straight to the support number; email opens the user's mail client.
    // WhatsApp is included only when the number is configured (see config.js) —
    // otherwise it would render a dead wa.me/ link.
    channels: [
      ...(SUPPORT_WHATSAPP
        ? [
            {
              type: "whatsapp",
              label: "WhatsApp",
              value: SUPPORT_WHATSAPP_DISPLAY,
              href: `https://wa.me/${SUPPORT_WHATSAPP}`,
              external: true,
            },
          ]
        : []),
      {
        type: "email",
        label: "Email",
        value: SUPPORT_EMAIL,
        href: `mailto:${SUPPORT_EMAIL}`,
      },
    ],
    sections: [
      { h: "Live chat", p: ["Prefer to stay in the app? Use the chat bubble in the bottom-right corner of the platform to talk to us in real time."] },
      { h: "Help centre", p: ["Browse frequently asked questions and step-by-step guides in the in-app help centre."] },
    ],
  },
};

export function getLegalDoc(slug) {
  return LEGAL_DOCS[slug] || null;
}

export function legalLinks() {
  return LEGAL_ORDER.map((slug) => ({ slug, label: LEGAL_DOCS[slug].title }));
}
