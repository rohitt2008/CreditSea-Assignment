import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';
import { Loan } from './models/Loan';
import { Payment } from './models/Payment';
import { connectDB } from './config/db';

dotenv.config();

const seed = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('Clearing existing database collections...');
    await User.deleteMany({});
    await Loan.deleteMany({});
    await Payment.deleteMany({});
    console.log('Database cleared!');

    console.log('Seeding executive & administrative users...');
    
    // Seed password for all: Password123
    const defaultPassword = 'Password123';

    const usersToCreate = [
      {
        name: 'LendFlow Administrator',
        email: 'admin@lendflow.com',
        password: defaultPassword,
        role: 'Admin',
      },
      {
        name: 'Siddharth Sales Executive',
        email: 'sales@lendflow.com',
        password: defaultPassword,
        role: 'Sales',
      },
      {
        name: 'Sarah Sanction Executive',
        email: 'sanction@lendflow.com',
        password: defaultPassword,
        role: 'Sanction',
      },
      {
        name: 'Daniel Disbursement Officer',
        email: 'disbursement@lendflow.com',
        password: defaultPassword,
        role: 'Disbursement',
      },
      {
        name: 'Clara Collection Executive',
        email: 'collection@lendflow.com',
        password: defaultPassword,
        role: 'Collection',
      },
    ];

    const createdExecutives: Record<string, any> = {};
    for (const item of usersToCreate) {
      const user = new User(item);
      await user.save();
      createdExecutives[item.role] = user;
      console.log(`Created ${item.role} user: ${item.email}`);
    }

    console.log('Seeding borrowers and active loan applications...');

    // 1. Borrower Lead (Sales Lead) - registered but hasn't applied
    const leadUser = new User({
      name: 'Rohan Lead',
      email: 'borrower1@lendflow.com',
      password: defaultPassword,
      role: 'Borrower',
    });
    await leadUser.save();
    console.log('Created Borrower Lead user (pre-application)');

    // 2. Borrower Applied (Pending Review)
    const appliedUser = new User({
      name: 'Amit Kumar',
      email: 'borrower2@lendflow.com',
      password: defaultPassword,
      role: 'Borrower',
    });
    await appliedUser.save();

    const appliedLoan = new Loan({
      borrower: appliedUser._id,
      status: 'APPLIED',
      personalDetails: {
        fullName: 'Amit Kumar',
        pan: 'ABCDE1234F',
        dob: new Date('1995-05-15'),
        monthlySalary: 45000,
        employmentMode: 'Salaried',
      },
      salarySlipUrl: '/uploads/sample-slip.png',
      loanAmount: 150000,
      tenureDays: 180,
      interestRate: 12,
      simpleInterest: 8877, // Math: (150000 * 12 * 180) / (365 * 100) = 8876.71 -> 8877
      totalRepayment: 158877,
    });
    await appliedLoan.save();
    console.log('Created Borrower user with APPLIED loan application');

    // 3. Borrower Sanctioned (Pending Disbursement)
    const sanctionedUser = new User({
      name: 'Sneha Patel',
      email: 'borrower3@lendflow.com',
      password: defaultPassword,
      role: 'Borrower',
    });
    await sanctionedUser.save();

    const sanctionedLoan = new Loan({
      borrower: sanctionedUser._id,
      status: 'SANCTIONED',
      personalDetails: {
        fullName: 'Sneha Patel',
        pan: 'XYZAB9876C',
        dob: new Date('1990-08-20'),
        monthlySalary: 75000,
        employmentMode: 'Salaried',
      },
      salarySlipUrl: '/uploads/sample-slip.png',
      loanAmount: 300000,
      tenureDays: 90,
      interestRate: 12,
      simpleInterest: 8877, // Math: (300000 * 12 * 90) / 36500 = 8876.71 -> 8877
      totalRepayment: 308877,
    });
    await sanctionedLoan.save();
    console.log('Created Borrower user with SANCTIONED loan application');

    // 4. Borrower Disbursed (In Repayment / Collection phase)
    const disbursedUser = new User({
      name: 'Vikram Singh',
      email: 'borrower4@lendflow.com',
      password: defaultPassword,
      role: 'Borrower',
    });
    await disbursedUser.save();

    const disbursedLoan = new Loan({
      borrower: disbursedUser._id,
      status: 'DISBURSED',
      personalDetails: {
        fullName: 'Vikram Singh',
        pan: 'KJHGF4321D',
        dob: new Date('1988-12-10'),
        monthlySalary: 120000,
        employmentMode: 'Self-Employed',
      },
      salarySlipUrl: '/uploads/sample-slip.png',
      loanAmount: 500000,
      tenureDays: 365,
      interestRate: 12,
      simpleInterest: 60000, // Math: (500000 * 12 * 365) / 36500 = 60000
      totalRepayment: 560000,
    });
    await disbursedLoan.save();
    console.log('Created Borrower user with DISBURSED loan application');

    // 5. Borrower Closed (Fully Repaid)
    const closedUser = new User({
      name: 'Pooja Sharma',
      email: 'borrower5@lendflow.com',
      password: defaultPassword,
      role: 'Borrower',
    });
    await closedUser.save();

    const closedLoan = new Loan({
      borrower: closedUser._id,
      status: 'CLOSED',
      personalDetails: {
        fullName: 'Pooja Sharma',
        pan: 'PLMNK7890E',
        dob: new Date('1993-02-28'),
        monthlySalary: 55000,
        employmentMode: 'Salaried',
      },
      salarySlipUrl: '/uploads/sample-slip.png',
      loanAmount: 100000,
      tenureDays: 60,
      interestRate: 12,
      simpleInterest: 1973, // Math: (100000 * 12 * 60) / 36500 = 1972.6 -> 1973
      totalRepayment: 101973,
    });
    await closedLoan.save();

    // Record fully matching payments for the closed loan
    const testPayment = new Payment({
      loanId: closedLoan._id,
      utr: 'UTR998877665544',
      amount: 101973,
      date: new Date(),
      recordedBy: createdExecutives['Collection']._id,
    });
    await testPayment.save();
    console.log('Created Borrower user with CLOSED loan application and payment recorded');

    console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
    console.log('Use email and "Password123" to log in for any role.');
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding script encountered an error:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

seed();
