/**
 * Lexora — Enterprise LegalTech Client Interactions
 * Handles the "Ask Lexora" preview and mobile menu.
 */

// Simulated Precedents & Assessments for Suggested Topics
const LEGAL_SIMULATION_RESPONSES = {
  contract: {
    title: "Contract Risk Assessment: Liability & Indemnity Under Indian Law",
    body: "Under Section 73 of the Indian Contract Act 1872, damages arising from breach must be foreseeable in the ordinary course of business. For B2B SaaS agreements, standard Indian enterprise benchmarks mandate: (1) An aggregate liability cap tied to 100% of fees paid over the preceding 12 months; (2) Mutual carve-out for breach of confidentiality and willful misconduct; (3) Explicit exclusion of speculative indirect damages.",
    sources: "Indian Contract Act 1872 Sec 73 • ONGC v. Saw Pipes (2003) 5 SCC 705"
  },
  corporate: {
    title: "Corporate Law: Section 180 Borrowing Powers & Special Resolutions",
    body: "Under Section 180(1)(c) of the Indian Companies Act 2013, the Board of Directors cannot borrow money exceeding the aggregate of paid-up share capital, free reserves, and securities premium without prior approval by Special Resolution in general meeting. For Series A / venture debt financings, ensure shareholder consent is filed on MCA Form MGT-14 within 30 days.",
    sources: "Companies Act 2013 Sec 180(1)(c) • MCA Filing Form MGT-14"
  },
  employment: {
    title: "Employment Law: Enforceability of Post-Termination Restrictive Covenants",
    body: "Under Section 27 of the Indian Contract Act 1872, agreements in restraint of lawful trade or profession are void ab initio. The Supreme Court in Percept D'Mark v. Zaheer Khan (2006) affirmed that non-compete clauses post-termination cannot be enforced regardless of reasonable duration. In-term restrictions and non-solicitation of clients/employees remain enforceable.",
    sources: "Indian Contract Act 1872 Sec 27 • Percept D'Mark v. Zaheer Khan (2006) 4 SCC 227"
  },
  ip: {
    title: "Intellectual Property: Founder IP Assignment & Copyright Vesting",
    body: "Under Section 17 of the Copyright Act 1957, absent an explicit written assignment agreement, copyright in software created before corporate incorporation vests in the individual founder/author. Pre-Series A diligence requires executing a retrospective Comprehensive IP Assignment Deed assigning all proprietary algorithms, architecture, and trademarks to the incorporated entity.",
    sources: "Copyright Act 1957 Sec 17 & 19 • Patents Act 1970 Sec 68"
  },
  compliance: {
    title: "Compliance Intelligence: Data Fiduciary Obligations Under DPDP Act 2023",
    body: "The Digital Personal Data Protection Act 2023 establishes mandatory obligations under Section 8: (1) Notice and verifiable consent before processing personal data; (2) Implementation of reasonable security safeguards to prevent personal data breaches; (3) Immediate notification to the Data Protection Board and impacted data principals in the event of an incident.",
    sources: "Digital Personal Data Protection Act 2023 Sec 8 & Sec 16 (Cross-Border Rules)"
  },
  default: {
    title: "Lexora Preliminary Intelligence Memo",
    body: "Lexora organises the relevant context to help business teams understand the question and consider possible next steps.",
    sources: "Codified Indian Central Acts • MCA & SEBI Gazette Notifications"
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // 1. "Ask Lexora" Search Box & Topic Chips
  const askInput = document.getElementById('ask-input-field');
  const askForm = document.getElementById('ask-lexora-form');
  const topicChips = document.querySelectorAll('.topic-chip');
  const outputBox = document.getElementById('ask-simulated-output');
  const outputTitle = document.getElementById('ask-output-title');
  const outputBody = document.getElementById('ask-output-body');

  function triggerAnalysis(data) {
    if (!outputBox) return;
    outputTitle.textContent = 'Your question is a good place to start.';
    outputBody.textContent = 'Lexora helps you organise the context, identify relevant legal sources, and understand possible next steps.';
    outputBox.classList.add('active');
    outputBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Clicking Suggested Topic Chips
  topicChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.getAttribute('data-query');
      if (askInput) askInput.value = query;

      const lower = query.toLowerCase();
      if (lower.includes('contract') || lower.includes('liability')) {
        triggerAnalysis(LEGAL_SIMULATION_RESPONSES.contract);
      } else if (lower.includes('companies') || lower.includes('corporate') || lower.includes('borrowing')) {
        triggerAnalysis(LEGAL_SIMULATION_RESPONSES.corporate);
      } else if (lower.includes('employment') || lower.includes('non-compete')) {
        triggerAnalysis(LEGAL_SIMULATION_RESPONSES.employment);
      } else if (lower.includes('ip') || lower.includes('founder') || lower.includes('software')) {
        triggerAnalysis(LEGAL_SIMULATION_RESPONSES.ip);
      } else if (lower.includes('dpdp') || lower.includes('compliance') || lower.includes('data')) {
        triggerAnalysis(LEGAL_SIMULATION_RESPONSES.compliance);
      } else {
        triggerAnalysis(LEGAL_SIMULATION_RESPONSES.default);
      }
    });
  });

  // Submitting Ask Lexora Form
  if (askForm) {
    askForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = askInput ? askInput.value.trim().toLowerCase() : '';
      if (!val) {
        if (askInput) askInput.focus();
        return;
      }

      if (val.includes('contract') || val.includes('liability') || val.includes('agreement')) {
        triggerAnalysis(LEGAL_SIMULATION_RESPONSES.contract);
      } else if (val.includes('company') || val.includes('share') || val.includes('mca') || val.includes('director')) {
        triggerAnalysis(LEGAL_SIMULATION_RESPONSES.corporate);
      } else if (val.includes('employ') || val.includes('worker') || val.includes('compete') || val.includes('esop')) {
        triggerAnalysis(LEGAL_SIMULATION_RESPONSES.employment);
      } else if (val.includes('ip') || val.includes('patent') || val.includes('trademark') || val.includes('copyright')) {
        triggerAnalysis(LEGAL_SIMULATION_RESPONSES.ip);
      } else if (val.includes('data') || val.includes('dpdp') || val.includes('privacy') || val.includes('complian')) {
        triggerAnalysis(LEGAL_SIMULATION_RESPONSES.compliance);
      } else {
        triggerAnalysis({
          title: `Statutory Evaluation: "${askInput.value}"`,
          body: "Lexora has organised the question into key legal considerations and possible next steps for your business.",
          sources: "Indexed Indian Bare Acts & Regulatory Notifications"
        });
      }
    });
  }

  // 2. Mobile Hamburger Navigation
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');
  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      const isVisible = mobileDrawer.style.display === 'block';
      mobileDrawer.style.display = isVisible ? 'none' : 'block';
      mobileToggle.setAttribute('aria-expanded', String(!isVisible));
    });
    document.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.style.display = 'none';
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 4. Smooth Anchor Link Scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
});
