import { Schema, model, Types } from 'mongoose';

export const LOAN_STATUSES = ['PRE_APPLIED', 'APPLIED', 'SANCTIONED', 'REJECTED', 'DISBURSED', 'CLOSED'] as const;
export type LoanStatus = typeof LOAN_STATUSES[number];

const personalDetailsSchema = new Schema({
  fullName: { type: String, required: true },
  pan: { type: String, required: true },
  dob: { type: Date, required: true },
  monthlySalary: { type: Number, required: true },
  employmentMode: { 
    type: String, 
    enum: ['Salaried', 'Self-Employed', 'Unemployed'], 
    required: true 
  },
}, { _id: false });

const loanSchema = new Schema(
  {
    borrower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // A borrower has exactly one application/loan in this simplified system
    },
    status: {
      type: String,
      enum: LOAN_STATUSES,
      default: 'PRE_APPLIED',
    },
    personalDetails: {
      type: personalDetailsSchema,
      required: false, // Not required initially in PRE_APPLIED status
    },
    salarySlipUrl: {
      type: String,
      required: false,
    },
    loanAmount: {
      type: Number,
      required: false,
    },
    tenureDays: {
      type: Number,
      required: false,
    },
    interestRate: {
      type: Number,
      default: 12, // 12% p.a.
    },
    simpleInterest: {
      type: Number,
      required: false,
    },
    totalRepayment: {
      type: Number,
      required: false,
    },
    rejectionReason: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Loan = model('Loan', loanSchema);
export default Loan;
