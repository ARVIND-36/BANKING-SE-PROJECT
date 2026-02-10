import { eq, desc } from "drizzle-orm";
import db from "../config/db.js";
import { loanApplications, userLoanProfiles } from "../models/schema.js";
import logger from "../utils/logger.js";

// ─── LOAN-TYPE-SPECIFIC FIELD DEFINITIONS ────────────────────
// Each loan type has its own unique questions/fields
const LOAN_FIELDS = {
  home: {
    fields: [
      { key: "propertyType",    label: "Property Type",       type: "select", options: ["Apartment", "Independent House", "Villa", "Plot + Construction"], required: true },
      { key: "propertyCity",    label: "Property Location",   type: "text",   placeholder: "City where property is", required: true },
      { key: "propertyValue",   label: "Property Value (₹)",  type: "number", placeholder: "e.g. 5000000", required: true },
      { key: "downPayment",     label: "Down Payment (₹)",    type: "number", placeholder: "e.g. 1000000", required: false },
      { key: "isFirstHome",     label: "Is this your first home?", type: "select", options: ["Yes", "No"], required: true },
      { key: "coApplicant",     label: "Co-Applicant",        type: "select", options: ["None", "Spouse", "Parent", "Sibling"], required: false },
    ],
  },
  education: {
    fields: [
      { key: "courseName",     label: "Course Name",          type: "text",   placeholder: "e.g. MBA, B.Tech", required: true },
      { key: "instituteName",  label: "Institute Name",       type: "text",   placeholder: "e.g. IIT Delhi", required: true },
      { key: "courseType",     label: "Course Type",           type: "select", options: ["Undergraduate", "Postgraduate", "Diploma", "PhD", "Professional"], required: true },
      { key: "courseDuration", label: "Course Duration (years)", type: "number", placeholder: "e.g. 4", required: true },
      { key: "studyCountry",  label: "Study Country",         type: "select", options: ["India", "USA", "UK", "Canada", "Australia", "Germany", "Other"], required: true },
      { key: "admissionStatus",label: "Admission Status",     type: "select", options: ["Confirmed", "Provisional", "Applied"], required: true },
      { key: "hasCollateral",  label: "Collateral Available?", type: "select", options: ["Yes", "No"], required: true },
    ],
  },
  vehicle: {
    fields: [
      { key: "vehicleType",   label: "Vehicle Type",          type: "select", options: ["Car - New", "Car - Used", "Two Wheeler", "Commercial Vehicle"], required: true },
      { key: "vehicleBrand",  label: "Brand & Model",         type: "text",   placeholder: "e.g. Hyundai Creta", required: true },
      { key: "onRoadPrice",   label: "On-Road Price (₹)",     type: "number", placeholder: "e.g. 1500000", required: true },
      { key: "downPayment",   label: "Down Payment (₹)",      type: "number", placeholder: "e.g. 300000", required: false },
      { key: "dealerCity",    label: "Dealer City",            type: "text",   placeholder: "e.g. Bangalore", required: false },
    ],
  },
  personal: {
    fields: [
      { key: "loanPurpose",   label: "Purpose of Loan",       type: "select", options: ["Medical Emergency", "Wedding", "Travel", "Home Renovation", "Debt Consolidation", "Other"], required: true },
      { key: "companyName",   label: "Company / Employer",    type: "text",   placeholder: "e.g. TCS, Infosys", required: true },
      { key: "yearsInJob",    label: "Years in Current Job",  type: "number", placeholder: "e.g. 3", required: true },
      { key: "hasSalaryAccount", label: "Salary Account Bank", type: "text",  placeholder: "e.g. HDFC, SBI", required: false },
    ],
  },
  business: {
    fields: [
      { key: "businessType",  label: "Business Type",         type: "select", options: ["Sole Proprietorship", "Partnership", "Private Limited", "LLP", "Startup"], required: true },
      { key: "businessName",  label: "Business Name",         type: "text",   placeholder: "e.g. ABC Enterprises", required: true },
      { key: "businessAge",   label: "Business Age (years)",  type: "number", placeholder: "e.g. 5", required: true },
      { key: "annualTurnover", label: "Annual Turnover (₹)",  type: "number", placeholder: "e.g. 5000000", required: true },
      { key: "gstRegistered", label: "GST Registered?",       type: "select", options: ["Yes", "No"], required: true },
      { key: "loanPurpose",   label: "Loan Purpose",          type: "select", options: ["Working Capital", "Equipment Purchase", "Expansion", "Inventory", "Other"], required: true },
    ],
  },
  credit_line: {
    fields: [
      { key: "purpose",       label: "Purpose",               type: "select", options: ["Business Cash Flow", "Emergency Fund", "Short-term Needs", "Other"], required: true },
      { key: "companyName",   label: "Company / Business",    type: "text",   placeholder: "e.g. XYZ Ltd", required: true },
      { key: "monthlySpend",  label: "Expected Monthly Usage (₹)", type: "number", placeholder: "e.g. 50000", required: true },
    ],
  },
};

// ─── STATIC BANK OFFERS DATA ────────────────────────────────
const BANK_OFFERS = {
  home: [
    { bank: "SBI",   rate: 8.50, maxTenure: 360, minScore: 650, minIncome: 25000, maxAmount: 10000000, logo: "🏛️" },
    { bank: "HDFC",  rate: 8.70, maxTenure: 360, minScore: 700, minIncome: 30000, maxAmount: 15000000, logo: "🔵" },
    { bank: "ICICI", rate: 8.75, maxTenure: 300, minScore: 680, minIncome: 28000, maxAmount: 12000000, logo: "🟠" },
    { bank: "BOB",   rate: 8.40, maxTenure: 360, minScore: 630, minIncome: 20000, maxAmount: 8000000,  logo: "🟤" },
    { bank: "PNB",   rate: 8.45, maxTenure: 360, minScore: 640, minIncome: 22000, maxAmount: 9000000,  logo: "🔴" },
    { bank: "Kotak", rate: 8.85, maxTenure: 240, minScore: 720, minIncome: 35000, maxAmount: 20000000, logo: "🔶" },
  ],
  education: [
    { bank: "SBI",        rate: 8.55, maxTenure: 180, minScore: 600, minIncome: 15000, maxAmount: 3000000,  logo: "🏛️" },
    { bank: "BOB",        rate: 8.80, maxTenure: 180, minScore: 600, minIncome: 12000, maxAmount: 2000000,  logo: "🟤" },
    { bank: "IDBI",       rate: 8.75, maxTenure: 180, minScore: 620, minIncome: 15000, maxAmount: 2500000,  logo: "🟢" },
    { bank: "Canara Bank",rate: 8.60, maxTenure: 180, minScore: 600, minIncome: 12000, maxAmount: 2000000,  logo: "🟡" },
    { bank: "ICICI",      rate: 9.50, maxTenure: 120, minScore: 650, minIncome: 20000, maxAmount: 4000000,  logo: "🟠" },
  ],
  vehicle: [
    { bank: "HDFC",     rate: 8.70, maxTenure: 84, minScore: 650, minIncome: 20000, maxAmount: 5000000, logo: "🔵" },
    { bank: "ICICI",    rate: 8.90, maxTenure: 84, minScore: 660, minIncome: 22000, maxAmount: 4000000, logo: "🟠" },
    { bank: "SBI",      rate: 8.65, maxTenure: 84, minScore: 640, minIncome: 18000, maxAmount: 4000000, logo: "🏛️" },
    { bank: "Axis",     rate: 9.00, maxTenure: 72, minScore: 680, minIncome: 25000, maxAmount: 5000000, logo: "🟣" },
    { bank: "Mahindra", rate: 9.50, maxTenure: 72, minScore: 620, minIncome: 15000, maxAmount: 3000000, logo: "🔴" },
  ],
  personal: [
    { bank: "HDFC",     rate: 10.50, maxTenure: 60, minScore: 700, minIncome: 25000, maxAmount: 4000000, logo: "🔵" },
    { bank: "ICICI",    rate: 10.75, maxTenure: 60, minScore: 700, minIncome: 25000, maxAmount: 3500000, logo: "🟠" },
    { bank: "Axis",     rate: 10.49, maxTenure: 60, minScore: 720, minIncome: 30000, maxAmount: 5000000, logo: "🟣" },
    { bank: "SBI",      rate: 11.00, maxTenure: 72, minScore: 650, minIncome: 15000, maxAmount: 2000000, logo: "🏛️" },
    { bank: "Kotak",    rate: 10.99, maxTenure: 60, minScore: 700, minIncome: 25000, maxAmount: 4000000, logo: "🔶" },
    { bank: "Bajaj Fin",rate: 11.00, maxTenure: 60, minScore: 680, minIncome: 22000, maxAmount: 3500000, logo: "🟢" },
  ],
  business: [
    { bank: "SBI",       rate: 11.00, maxTenure: 60, minScore: 680, minIncome: 30000, maxAmount: 5000000,  logo: "🏛️" },
    { bank: "HDFC",      rate: 11.50, maxTenure: 48, minScore: 700, minIncome: 40000, maxAmount: 7500000,  logo: "🔵" },
    { bank: "ICICI",     rate: 12.00, maxTenure: 48, minScore: 700, minIncome: 35000, maxAmount: 6000000,  logo: "🟠" },
    { bank: "Axis",      rate: 11.75, maxTenure: 60, minScore: 720, minIncome: 40000, maxAmount: 10000000, logo: "🟣" },
    { bank: "Bajaj Fin", rate: 12.00, maxTenure: 48, minScore: 680, minIncome: 30000, maxAmount: 5000000,  logo: "🟢" },
  ],
  credit_line: [
    { bank: "HDFC",       rate: 14.00, maxTenure: 36, minScore: 720, minIncome: 30000, maxAmount: 1000000, logo: "🔵" },
    { bank: "ICICI",      rate: 14.50, maxTenure: 36, minScore: 700, minIncome: 25000, maxAmount: 800000,  logo: "🟠" },
    { bank: "Kotak",      rate: 15.00, maxTenure: 24, minScore: 720, minIncome: 30000, maxAmount: 1000000, logo: "🔶" },
    { bank: "Bajaj Fin",  rate: 13.50, maxTenure: 36, minScore: 680, minIncome: 25000, maxAmount: 500000,  logo: "🟢" },
  ],
};

// ─── COMPUTE ELIGIBILITY ─────────────────────────────────────
const computeEligibility = (input) => {
  const { loanType, monthlyIncome, employmentType, creditScore, age, existingEmi, desiredTenure, desiredAmount } = input;

  if (age < 21 || age > 65) return { isEligible: false, eligibleAmount: 0, bankOffers: [], reason: "Age must be between 21 and 65 years." };
  if (creditScore < 300 || creditScore > 900) return { isEligible: false, eligibleAmount: 0, bankOffers: [], reason: "Invalid credit score. Must be 300-900." };
  if (creditScore < 600) return { isEligible: false, eligibleAmount: 0, bankOffers: [], reason: "Credit score too low. Minimum 600 required." };

  const maxEmiAffordable = (monthlyIncome * 0.50) - existingEmi;
  if (maxEmiAffordable <= 0) return { isEligible: false, eligibleAmount: 0, bankOffers: [], reason: "Existing EMIs exceed 50% of income." };

  const typeKey = loanType.toLowerCase().replace(/\s+/g, "_");
  const bankList = BANK_OFFERS[typeKey] || BANK_OFFERS["personal"];
  const matchedOffers = [];

  for (const offer of bankList) {
    if (creditScore < offer.minScore) continue;
    if (monthlyIncome < offer.minIncome) continue;
    if (desiredTenure > offer.maxTenure) continue;

    const monthlyRate = offer.rate / 100 / 12;
    const n = desiredTenure;
    const factor = Math.pow(1 + monthlyRate, n);
    const maxPrincipal = maxEmiAffordable * ((factor - 1) / (monthlyRate * factor));
    const eligibleAmt = Math.min(maxPrincipal, offer.maxAmount);
    if (eligibleAmt < 10000) continue;

    const finalAmount = Math.min(desiredAmount, eligibleAmt);
    const emi = finalAmount * monthlyRate * factor / (factor - 1);

    let approvalChance = "High";
    if (employmentType === "self_employed" && creditScore < 700) approvalChance = "Medium";
    if (employmentType === "self_employed" && creditScore < 650) approvalChance = "Low";

    matchedOffers.push({
      bank: offer.bank, logo: offer.logo, interestRate: offer.rate,
      maxEligibleAmount: Math.round(eligibleAmt), approvedAmount: Math.round(finalAmount),
      monthlyEmi: Math.round(emi), tenure: desiredTenure,
      totalPayable: Math.round(emi * desiredTenure),
      totalInterest: Math.round((emi * desiredTenure) - finalAmount),
      approvalChance,
    });
  }

  matchedOffers.sort((a, b) => a.interestRate - b.interestRate);
  const bestEligible = matchedOffers.length > 0 ? Math.max(...matchedOffers.map((o) => o.maxEligibleAmount)) : 0;

  return {
    isEligible: matchedOffers.length > 0, eligibleAmount: bestEligible, bankOffers: matchedOffers,
    reason: matchedOffers.length > 0 ? `You are eligible! ${matchedOffers.length} bank(s) matched.` : "No banks matched your profile. Try adjusting income, tenure, or amount.",
  };
};

// ─── GET LOAN FIELDS FOR A TYPE (GET) ────────────────────────
export const getLoanFields = async (req, res) => {
  const { type } = req.params;
  const fields = LOAN_FIELDS[type];
  if (!fields) return res.status(400).json({ success: false, message: "Invalid loan type" });
  return res.status(200).json({ success: true, data: fields });
};

// ─── CHECK ELIGIBILITY (POST) ────────────────────────────────
export const checkEligibility = async (req, res) => {
  try {
    const userId = req.user.id;
    const { loanType, monthlyIncome, employmentType, creditScore, age, existingEmi = 0, desiredTenure, desiredAmount, city, loanSpecificDetails = {} } = req.body;

    if (!loanType || !monthlyIncome || !employmentType || !creditScore || !age || !desiredTenure || !desiredAmount || !city) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const input = {
      loanType, monthlyIncome: parseFloat(monthlyIncome), employmentType,
      creditScore: parseInt(creditScore), age: parseInt(age),
      existingEmi: parseFloat(existingEmi || 0), desiredTenure: parseInt(desiredTenure),
      desiredAmount: parseFloat(desiredAmount),
    };

    const result = computeEligibility(input);

    const [saved] = await db.insert(loanApplications).values({
      userId, loanType,
      monthlyIncome: input.monthlyIncome.toString(), employmentType,
      creditScore: input.creditScore, age: input.age,
      existingEmi: input.existingEmi.toString(), desiredTenure: input.desiredTenure,
      desiredAmount: input.desiredAmount.toString(), city,
      eligibleAmount: result.eligibleAmount.toString(), isEligible: result.isEligible,
      bankOffers: result.bankOffers, loanSpecificDetails,
    }).returning();

    // Also save/update user profile for auto-fill
    await saveUserProfile(userId, input, city, loanType, loanSpecificDetails);

    logger.info(`Loan eligibility check for user ${userId}: ${result.isEligible ? "ELIGIBLE" : "NOT ELIGIBLE"}`);
    return res.status(200).json({ success: true, data: { applicationId: saved.id, ...result } });
  } catch (error) {
    logger.error(`Loan eligibility error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── SAVE USER PROFILE (internal helper) ─────────────────────
const saveUserProfile = async (userId, input, city, loanType, loanSpecificDetails) => {
  try {
    const existing = await db.select().from(userLoanProfiles).where(eq(userLoanProfiles.userId, userId));

    const savedDetails = existing.length > 0 && existing[0].savedDetails ? existing[0].savedDetails : {};
    savedDetails[loanType] = loanSpecificDetails;

    if (existing.length > 0) {
      await db.update(userLoanProfiles).set({
        monthlyIncome: input.monthlyIncome.toString(),
        employmentType: input.employmentType,
        creditScore: input.creditScore,
        age: input.age,
        existingEmi: input.existingEmi.toString(),
        city,
        savedDetails,
        updatedAt: new Date(),
      }).where(eq(userLoanProfiles.userId, userId));
    } else {
      await db.insert(userLoanProfiles).values({
        userId,
        monthlyIncome: input.monthlyIncome.toString(),
        employmentType: input.employmentType,
        creditScore: input.creditScore,
        age: input.age,
        existingEmi: input.existingEmi.toString(),
        city,
        savedDetails,
      });
    }
  } catch (err) {
    logger.error(`Save user loan profile error: ${err.message}`);
  }
};

// ─── GET USER LOAN PROFILE (GET) ─────────────────────────────
export const getUserLoanProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.select().from(userLoanProfiles).where(eq(userLoanProfiles.userId, userId));

    if (result.length === 0) {
      return res.status(200).json({ success: true, data: { profile: null } });
    }

    const p = result[0];
    return res.status(200).json({
      success: true,
      data: {
        profile: {
          monthlyIncome: p.monthlyIncome ? parseFloat(p.monthlyIncome) : null,
          employmentType: p.employmentType,
          creditScore: p.creditScore,
          age: p.age,
          existingEmi: p.existingEmi ? parseFloat(p.existingEmi) : null,
          city: p.city,
          savedDetails: p.savedDetails || {},
        },
      },
    });
  } catch (error) {
    logger.error(`Get user loan profile error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GET MY APPLICATIONS (GET) ───────────────────────────────
export const getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const applications = await db.select().from(loanApplications)
      .where(eq(loanApplications.userId, userId))
      .orderBy(desc(loanApplications.createdAt)).limit(10);

    const formatted = applications.map((app) => ({
      id: app.id, loanType: app.loanType,
      desiredAmount: parseFloat(app.desiredAmount), eligibleAmount: parseFloat(app.eligibleAmount),
      isEligible: app.isEligible, bankOffers: app.bankOffers || [],
      creditScore: app.creditScore, monthlyIncome: parseFloat(app.monthlyIncome),
      employmentType: app.employmentType, age: app.age, city: app.city,
      loanSpecificDetails: app.loanSpecificDetails || {},
      createdAt: app.createdAt,
    }));

    return res.status(200).json({ success: true, data: { applications: formatted } });
  } catch (error) {
    logger.error(`Get loan applications error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GET LOAN TYPES (GET) ────────────────────────────────────
export const getLoanTypes = async (req, res) => {
  const types = [
    { key: "home",        name: "Home Loan",    icon: "🏠", description: "Buy your dream home" },
    { key: "education",   name: "Education",    icon: "🎓", description: "Fund your studies" },
    { key: "vehicle",     name: "Vehicle Loan",  icon: "🚗", description: "Own your car or bike" },
    { key: "personal",    name: "Personal Loan", icon: "💼", description: "For any personal need" },
    { key: "business",    name: "Business Loan", icon: "🏪", description: "Grow your business" },
    { key: "credit_line", name: "Credit Line",   icon: "💳", description: "Revolving credit" },
  ];
  return res.status(200).json({ success: true, data: { types } });
};
