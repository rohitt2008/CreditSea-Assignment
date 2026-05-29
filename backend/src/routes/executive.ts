import { Router, Response } from 'express';
import { User } from '../models/User';
import { Loan } from '../models/Loan';
import { Payment } from '../models/Payment';
import { authenticate, restrictTo, AuthRequest } from '../middlewares/auth';

const router = Router();

// ==========================================
// 1. SALES MODULE (Leads tracking)
// ==========================================
// @route   GET /api/executive/sales/leads
// @desc    Get registered users who haven't completed/applied a loan yet (leads)
// @access  Private (Admin, Sales)
router.get(
  '/sales/leads',
  authenticate,
  restrictTo('Admin', 'Sales'),
  async (req: AuthRequest, res: Response) => {
    try {
      // Find all borrowers
      const borrowers = await User.find({ role: 'Borrower' }).select('-password');
      
      // Find all completed loan applications
      const activeLoans = await Loan.find({});
      const appliedBorrowerIds = new Set(
        activeLoans
          .filter(loan => loan.status !== 'PRE_APPLIED')
          .map(loan => loan.borrower.toString())
      );

      // Leads are users who have no application OR are still in PRE_APPLIED status
      const leads = [];
      for (const borrower of borrowers) {
        const userApp = activeLoans.find(l => l.borrower.toString() === borrower._id.toString());
        if (!userApp || userApp.status === 'PRE_APPLIED') {
          leads.push({
            user: borrower,
            status: userApp ? 'PRE_APPLIED' : 'NOT_STARTED',
            applicationId: userApp ? userApp._id : null,
            registeredAt: borrower.createdAt,
          });
        }
      }

      res.json({ leads });
    } catch (error) {
      console.error('Fetch Sales Leads error:', error);
      res.status(500).json({ message: 'Internal server error fetching leads' });
    }
  }
);

// ==========================================
// 2. SANCTION MODULE (Review & Decision)
// ==========================================
// @route   GET /api/executive/sanction/loans
// @desc    Get all loans in APPLIED status
// @access  Private (Admin, Sanction)
router.get(
  '/sanction/loans',
  authenticate,
  restrictTo('Admin', 'Sanction'),
  async (req: AuthRequest, res: Response) => {
    try {
      const loans = await Loan.find({ status: 'APPLIED' }).populate('borrower', 'name email');
      res.json({ loans });
    } catch (error) {
      console.error('Fetch Sanction Loans error:', error);
      res.status(500).json({ message: 'Internal server error fetching loans' });
    }
  }
);

// @route   POST /api/executive/sanction/loans/:id/action
// @desc    Approve (SANCTIONED) or Reject (REJECTED) an application
// @access  Private (Admin, Sanction)
router.post(
  '/sanction/loans/:id/action',
  authenticate,
  restrictTo('Admin', 'Sanction'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { action, rejectionReason } = req.body;
      const loanId = req.params.id;

      if (!action || !['APPROVE', 'REJECT'].includes(action)) {
        return res.status(400).json({ message: 'Action must be APPROVE or REJECT' });
      }

      if (action === 'REJECT' && !rejectionReason) {
        return res.status(400).json({ message: 'Rejection reason is required' });
      }

      const loan = await Loan.findById(loanId);
      if (!loan) {
        return res.status(404).json({ message: 'Loan application not found' });
      }

      if (loan.status !== 'APPLIED') {
        return res.status(400).json({ message: 'Loan is not in APPLIED state' });
      }

      if (action === 'APPROVE') {
        loan.status = 'SANCTIONED';
        loan.rejectionReason = undefined;
      } else {
        loan.status = 'REJECTED';
        loan.rejectionReason = rejectionReason;
      }

      await loan.save();

      res.json({
        message: `Application was successfully ${action === 'APPROVE' ? 'sanctioned' : 'rejected'}.`,
        loan,
      });
    } catch (error) {
      console.error('Action Sanction Loan error:', error);
      res.status(500).json({ message: 'Internal server error processing decision' });
    }
  }
);

// ==========================================
// 3. DISBURSEMENT MODULE (Release Funds)
// ==========================================
// @route   GET /api/executive/disbursement/loans
// @desc    Get all loans in SANCTIONED status
// @access  Private (Admin, Disbursement)
router.get(
  '/disbursement/loans',
  authenticate,
  restrictTo('Admin', 'Disbursement'),
  async (req: AuthRequest, res: Response) => {
    try {
      const loans = await Loan.find({ status: 'SANCTIONED' }).populate('borrower', 'name email');
      res.json({ loans });
    } catch (error) {
      console.error('Fetch Sanctioned Loans error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// @route   POST /api/executive/disbursement/loans/:id/disburse
// @desc    Mark loan as disbursed
// @access  Private (Admin, Disbursement)
router.post(
  '/disbursement/loans/:id/disburse',
  authenticate,
  restrictTo('Admin', 'Disbursement'),
  async (req: AuthRequest, res: Response) => {
    try {
      const loanId = req.params.id;
      const loan = await Loan.findById(loanId);

      if (!loan) {
        return res.status(404).json({ message: 'Loan not found' });
      }

      if (loan.status !== 'SANCTIONED') {
        return res.status(400).json({ message: 'Loan is not in SANCTIONED state' });
      }

      loan.status = 'DISBURSED';
      await loan.save();

      res.json({
        message: 'Funds released and loan status updated to DISBURSED.',
        loan,
      });
    } catch (error) {
      console.error('Disburse Loan error:', error);
      res.status(500).json({ message: 'Internal server error processing disbursement' });
    }
  }
);

// ==========================================
// 4. COLLECTION MODULE (Payments & Outstanding)
// ==========================================
// @route   GET /api/executive/collection/loans
// @desc    Get all loans in DISBURSED or CLOSED status (for active ledger lookup)
// @access  Private (Admin, Collection)
router.get(
  '/collection/loans',
  authenticate,
  restrictTo('Admin', 'Collection'),
  async (req: AuthRequest, res: Response) => {
    try {
      // Find loans in DISBURSED or CLOSED stages
      const loans = await Loan.find({ status: { $in: ['DISBURSED', 'CLOSED'] } }).populate('borrower', 'name email');
      
      const ledger = [];
      for (const loan of loans) {
        // Calculate paid amount
        const payments = await Payment.find({ loanId: loan._id });
        const totalPaid = payments.reduce((acc, curr) => acc + curr.amount, 0);
        const totalRepayment = loan.totalRepayment || 0;
        const outstanding = Math.max(0, totalRepayment - totalPaid);

        ledger.push({
          loan,
          totalPaid,
          outstandingBalance: outstanding,
          paymentsCount: payments.length,
        });
      }

      res.json({ ledger });
    } catch (error) {
      console.error('Fetch Ledger error:', error);
      res.status(500).json({ message: 'Internal server error fetching collection ledger' });
    }
  }
);

// @route   POST /api/executive/collection/loans/:id/payment
// @desc    Record borrower payment (UTR check, auto-close check)
// @access  Private (Admin, Collection)
router.post(
  '/collection/loans/:id/payment',
  authenticate,
  restrictTo('Admin', 'Collection'),
  async (req: AuthRequest, res: Response) => {
    try {
      const loanId = req.params.id;
      const { utr, amount, date } = req.body;
      const executiveId = req.user?.id;

      if (!utr || !amount) {
        return res.status(400).json({ message: 'UTR and payment amount are required' });
      }

      const payAmount = Number(amount);
      if (isNaN(payAmount) || payAmount <= 0) {
        return res.status(400).json({ message: 'Payment amount must be a positive number' });
      }

      const loan = await Loan.findById(loanId);
      if (!loan) {
        return res.status(404).json({ message: 'Loan record not found' });
      }

      if (loan.status !== 'DISBURSED') {
        return res.status(400).json({ message: `Cannot record payment. Loan is in '${loan.status}' status.` });
      }

      // Check UTR duplicate globally
      const existingPayment = await Payment.findOne({ utr: utr.trim() });
      if (existingPayment) {
        return res.status(400).json({ message: `Payment UTR '${utr}' already exists. No duplicates allowed.` });
      }

      // Calculate current outstanding to prevent overpaying
      const payments = await Payment.find({ loanId });
      const currentPaid = payments.reduce((acc, curr) => acc + curr.amount, 0);
      const totalRepayment = loan.totalRepayment || 0;
      const currentOutstanding = totalRepayment - currentPaid;

      if (payAmount > currentOutstanding) {
        return res.status(400).json({ 
          message: `Payment amount ₹${payAmount} exceeds outstanding balance of ₹${currentOutstanding}.` 
        });
      }

      // Create payment
      const paymentDate = date ? new Date(date) : new Date();
      const newPayment = new Payment({
        loanId,
        utr: utr.trim(),
        amount: payAmount,
        date: paymentDate,
        recordedBy: executiveId,
      });

      await newPayment.save();

      // Check if loan should auto-close
      const finalPaid = currentPaid + payAmount;
      if (finalPaid >= totalRepayment) {
        loan.status = 'CLOSED';
        await loan.save();
      }

      res.status(201).json({
        message: finalPaid >= totalRepayment 
          ? 'Payment recorded successfully. Loan is now fully paid and CLOSED!' 
          : `Payment of ₹${payAmount} recorded successfully.`,
        payment: newPayment,
        outstandingBalance: Math.max(0, totalRepayment - finalPaid),
        loanStatus: loan.status,
      });
    } catch (error) {
      console.error('Record Payment error:', error);
      res.status(500).json({ message: 'Internal server error recording payment' });
    }
  }
);

// @route   GET /api/executive/collection/loans/:id/payments
// @desc    Get all payments recorded for a loan
// @access  Private (Admin, Collection)
router.get(
  '/collection/loans/:id/payments',
  authenticate,
  restrictTo('Admin', 'Collection'),
  async (req: AuthRequest, res: Response) => {
    try {
      const loanId = req.params.id;
      const payments = await Payment.find({ loanId }).populate('recordedBy', 'name email');
      res.json({ payments });
    } catch (error) {
      console.error('Fetch payments error:', error);
      res.status(500).json({ message: 'Internal server error fetching payments list' });
    }
  }
);

export default router;
