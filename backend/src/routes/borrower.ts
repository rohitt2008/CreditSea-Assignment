import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Loan } from '../models/Loan';
import { authenticate, restrictTo, AuthRequest } from '../middlewares/auth';

const router = Router();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req: AuthRequest, file, cb) => {
    const userId = req.user?.id || 'unknown';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `salary-slip-${userId}-${uniqueSuffix}${ext}`);
  },
});

// File Filter
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// Helper: Calculate age from DOB
const calculateAge = (dob: Date): number => {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// @route   GET /api/borrower/application
// @desc    Get active application of logged-in borrower
// @access  Private (Borrower)
router.get('/application', authenticate, restrictTo('Borrower'), async (req: AuthRequest, res: Response) => {
  try {
    const borrowerId = req.user?.id;
    let application = await Loan.findOne({ borrower: borrowerId });
    
    if (!application) {
      // Return 200 with message or default state
      return res.status(200).json({ 
        message: 'No active application found. Ready to apply.',
        application: null 
      });
    }

    res.json({ application });
  } catch (error) {
    console.error('Fetch application error:', error);
    res.status(500).json({ message: 'Internal server error fetching application' });
  }
});

// @route   POST /api/borrower/application/personal
// @desc    Save step 2: Personal Details + BRE validation
// @access  Private (Borrower)
router.post('/application/personal', authenticate, restrictTo('Borrower'), async (req: AuthRequest, res: Response) => {
  try {
    const borrowerId = req.user?.id;
    const { fullName, pan, dob, monthlySalary, employmentMode } = req.body;

    if (!fullName || !pan || !dob || !monthlySalary || !employmentMode) {
      return res.status(400).json({ message: 'All personal fields are required' });
    }

    // --- BUSINESS RULE ENGINE (BRE) VALIDATION ---
    const errors: string[] = [];

    // Rule 1: PAN validation
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan)) {
      errors.push('PAN format is invalid. Must be standard Indian PAN (e.g. ABCDE1234F)');
    }

    // Rule 2: Age between 23 and 50
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) {
      errors.push('Invalid Date of Birth');
    } else {
      const age = calculateAge(birthDate);
      if (age < 23 || age > 50) {
        errors.push(`Age must be between 23 and 50 years. Current calculated age is ${age}`);
      }
    }

    // Rule 3: Salary below 25,000 / month
    const salary = Number(monthlySalary);
    if (isNaN(salary) || salary < 25000) {
      errors.push('Monthly salary must be at least ₹25,000');
    }

    // Rule 4: Employment mode is Unemployed
    if (employmentMode === 'Unemployed') {
      errors.push('Unemployed applicants are not eligible for a loan');
    }

    // If BRE fails -> reject application
    if (errors.length > 0) {
      return res.status(400).json({ 
        message: 'Business Rule Engine (BRE) rejected this application.', 
        errors 
      });
    }

    // Find existing loan application or create a new one
    let application = await Loan.findOne({ borrower: borrowerId });
    if (!application) {
      application = new Loan({
        borrower: borrowerId,
        status: 'PRE_APPLIED',
      });
    }

    // If they already submitted and are in standard stages, they cannot edit it.
    if (application.status !== 'PRE_APPLIED' && application.status !== 'REJECTED') {
      return res.status(400).json({ 
        message: `Application is already under processing (${application.status}) and cannot be edited.` 
      });
    }

    // Reset status if it was previously rejected
    application.status = 'PRE_APPLIED';
    application.personalDetails = {
      fullName,
      pan,
      dob: birthDate,
      monthlySalary: salary,
      employmentMode,
    };

    await application.save();

    res.status(200).json({
      message: 'Personal details saved. BRE checks passed!',
      application,
    });
  } catch (error) {
    console.error('Save personal details error:', error);
    res.status(500).json({ message: 'Internal server error saving details' });
  }
});

// @route   POST /api/borrower/application/upload
// @desc    Save step 3: Upload Salary Slip (PDF/JPG/PNG, max 5MB)
// @access  Private (Borrower)
router.post('/application/upload', authenticate, restrictTo('Borrower'), (req: AuthRequest, res: Response) => {
  upload.single('salarySlip')(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    try {
      const borrowerId = req.user?.id;
      const application = await Loan.findOne({ borrower: borrowerId });

      if (!application) {
        return res.status(404).json({ message: 'No loan application in progress. Complete personal details first.' });
      }

      if (application.status !== 'PRE_APPLIED') {
        return res.status(400).json({ message: 'Application already submitted and cannot be modified' });
      }

      // Save relative file url
      application.salarySlipUrl = `/uploads/${req.file.filename}`;
      await application.save();

      res.status(200).json({
        message: 'Salary slip uploaded successfully',
        salarySlipUrl: application.salarySlipUrl,
        application,
      });
    } catch (error) {
      console.error('File upload save error:', error);
      res.status(500).json({ message: 'Internal server error saving file details' });
    }
  });
});

// @route   POST /api/borrower/application/apply
// @desc    Save step 4: Loan Config & Submit Application
// @access  Private (Borrower)
router.post('/application/apply', authenticate, restrictTo('Borrower'), async (req: AuthRequest, res: Response) => {
  try {
    const borrowerId = req.user?.id;
    const { loanAmount, tenureDays } = req.body;

    if (!loanAmount || !tenureDays) {
      return res.status(400).json({ message: 'Loan amount and tenure are required' });
    }

    const amount = Number(loanAmount);
    const tenure = Number(tenureDays);

    if (isNaN(amount) || amount < 50000 || amount > 500000) {
      return res.status(400).json({ message: 'Loan amount must be between ₹50,000 and ₹500,000' });
    }

    if (isNaN(tenure) || tenure < 30 || tenure > 365) {
      return res.status(400).json({ message: 'Tenure must be between 30 and 365 days' });
    }

    const application = await Loan.findOne({ borrower: borrowerId });
    if (!application) {
      return res.status(404).json({ message: 'Application in progress not found' });
    }

    if (!application.personalDetails) {
      return res.status(400).json({ message: 'Please complete Step 2: Personal Details first' });
    }

    if (!application.salarySlipUrl) {
      return res.status(400).json({ message: 'Please complete Step 3: Upload Salary Slip first' });
    }

    if (application.status !== 'PRE_APPLIED') {
      return res.status(400).json({ message: 'Application already submitted' });
    }

    // --- LOAN MATHEMATICS (Simple Interest) ---
    // Formula: SI = (P * R * T) / (365 * 100)
    const rate = 12; // 12% p.a.
    const simpleInterest = Math.round((amount * rate * tenure) / (365 * 100));
    const totalRepayment = amount + simpleInterest;

    // Save and submit
    application.loanAmount = amount;
    application.tenureDays = tenure;
    application.interestRate = rate;
    application.simpleInterest = simpleInterest;
    application.totalRepayment = totalRepayment;
    application.status = 'APPLIED'; // Mark as applied

    await application.save();

    res.status(200).json({
      message: 'Loan application submitted successfully!',
      application,
    });
  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({ message: 'Internal server error submitting application' });
  }
});

export default router;
