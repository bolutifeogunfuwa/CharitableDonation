import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  Client,
  Provider,
  Result,
  Receipt,
  Transaction
} from '@stacks/clarity';

// Mock wallet addresses
const CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const ADMIN_ADDRESS = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
const CHARITY_ADDRESS = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC';
const DONOR_ADDRESS = 'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND';

// Initialize test client
let client: Client;
let provider: Provider;

const initializeTestClient = async () => {
  provider = await Client.createProvider();
  client = new Client(CONTRACT_ADDRESS + ".charitable-donation", provider);
};

describe('Charitable Donation Platform Contract Tests', () => {
  beforeEach(async () => {
    await initializeTestClient();
    // Reset contract state before each test
    await client.executeMethod({
      method: { name: 'initialize-contract', args: [] },
      senderAddress: ADMIN_ADDRESS
    });
  });
  
  describe('Contract Initialization', () => {
    test('should initialize contract with correct owner', async () => {
      const receipt = await client.executeMethod({
        method: { name: 'get-contract-owner' },
        senderAddress: ADMIN_ADDRESS
      });
      
      expect(receipt.success).toBe(true);
      expect(receipt.result).toBe(ADMIN_ADDRESS);
    });
  });
  
  describe('Charity Registration', () => {
    test('should successfully register a new charity', async () => {
      const charityName = 'Test Charity';
      const receipt = await client.executeMethod({
        method: {
          name: 'register-charity',
          args: [charityName, CHARITY_ADDRESS]
        },
        senderAddress: ADMIN_ADDRESS
      });
      
      expect(receipt.success).toBe(true);
      
      // Verify charity details
      const charityDetails = await client.executeMethod({
        method: {
          name: 'get-charity-details',
          args: ['u1'] // First charity ID
        }
      });
      
      const charity = charityDetails.result.value;
      expect(charity.name).toBe(charityName);
      expect(charity.wallet).toBe(CHARITY_ADDRESS);
      expect(charity.active).toBe(true);
      expect(charity['total-received']).toBe('u0');
      expect(charity['reputation-score']).toBe('u100');
    });
    
    test('should fail when non-admin tries to register charity', async () => {
      const receipt = await client.executeMethod({
        method: {
          name: 'register-charity',
          args: ['Test Charity', CHARITY_ADDRESS]
        },
        senderAddress: DONOR_ADDRESS
      });
      
      expect(receipt.success).toBe(false);
      expect(receipt.error).toContain('u403');
    });
  });
  
  describe('Donation Management', () => {
    beforeEach(async () => {
      // Register a charity before donation tests
      await client.executeMethod({
        method: {
          name: 'register-charity',
          args: ['Test Charity', CHARITY_ADDRESS]
        },
        senderAddress: ADMIN_ADDRESS
      });
    });
    
    test('should process donation successfully', async () => {
      const donationAmount = 'u100';
      const receipt = await client.executeMethod({
        method: {
          name: 'donate',
          args: ['u1', donationAmount] // Charity ID 1, 100 STX
        },
        senderAddress: DONOR_ADDRESS
      });
      
      expect(receipt.success).toBe(true);
      
      // Verify donation details
      const donationDetails = await client.executeMethod({
        method: {
          name: 'get-donation-details',
          args: ['u1'] // First donation ID
        }
      });
      
      const donation = donationDetails.result.value;
      expect(donation.donor).toBe(DONOR_ADDRESS);
      expect(donation.amount).toBe(donationAmount);
      expect(donation.status).toBe('completed');
    });
    
    test('should fail donation to inactive charity', async () => {
      // Deactivate charity first
      await client.executeMethod({
        method: {
          name: 'deactivate-charity',
          args: ['u1']
        },
        senderAddress: ADMIN_ADDRESS
      });
      
      const receipt = await client.executeMethod({
        method: {
          name: 'donate',
          args: ['u1', 'u100']
        },
        senderAddress: DONOR_ADDRESS
      });
      
      expect(receipt.success).toBe(false);
      expect(receipt.error).toContain('u403');
    });
  });
  
  describe('Milestone Management', () => {
    beforeEach(async () => {
      // Register charity and add initial milestone
      await client.executeMethod({
        method: {
          name: 'register-charity',
          args: ['Test Charity', CHARITY_ADDRESS]
        },
        senderAddress: ADMIN_ADDRESS
      });
    });
    
    test('should add milestone successfully', async () => {
      const receipt = await client.executeMethod({
        method: {
          name: 'add-milestone',
          args: ['u1', 'Build community center', 'u10000']
        },
        senderAddress: ADMIN_ADDRESS
      });
      
      expect(receipt.success).toBe(true);
      
      // Verify milestone details
      const milestoneDetails = await client.executeMethod({
        method: {
          name: 'get-milestone-details',
          args: ['u1']
        }
      });
      
      const milestone = milestoneDetails.result.value;
      expect(milestone.description).toBe('Build community center');
      expect(milestone['target-amount']).toBe('u10000');
      expect(milestone.completed).toBe(false);
    });
    
    test('should update milestone progress correctly', async () => {
      // Add milestone first
      await client.executeMethod({
        method: {
          name: 'add-milestone',
          args: ['u1', 'Build community center', 'u10000']
        },
        senderAddress: ADMIN_ADDRESS
      });
      
      // Update progress
      const receipt = await client.executeMethod({
        method: {
          name: 'update-milestone-progress',
          args: ['u1', 'u5000']
        },
        senderAddress: CHARITY_ADDRESS
      });
      
      expect(receipt.success).toBe(true);
      
      // Verify updated progress
      const milestoneDetails = await client.executeMethod({
        method: {
          name: 'get-milestone-details',
          args: ['u1']
        }
      });
      
      const milestone = milestoneDetails.result.value;
      expect(milestone['current-amount']).toBe('u5000');
      expect(milestone.completed).toBe(false);
    });
    
    test('should mark milestone as completed when target reached', async () => {
      // Add milestone
      await client.executeMethod({
        method: {
          name: 'add-milestone',
          args: ['u1', 'Build community center', 'u10000']
        },
        senderAddress: ADMIN_ADDRESS
      });
      
      // Update progress to target amount
      const receipt = await client.executeMethod({
        method: {
          name: 'update-milestone-progress',
          args: ['u1', 'u10000']
        },
        senderAddress: CHARITY_ADDRESS
      });
      
      expect(receipt.success).toBe(true);
      
      // Verify milestone completion
      const milestoneDetails = await client.executeMethod({
        method: {
          name: 'get-milestone-details',
          args: ['u1']
        }
      });
      
      const milestone = milestoneDetails.result.value;
      expect(milestone['current-amount']).toBe('u10000');
      expect(milestone.completed).toBe(true);
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid charity ID', async () => {
      const receipt = await client.executeMethod({
        method: {
          name: 'donate',
          args: ['u999', 'u100'] // Non-existent charity ID
        },
        senderAddress: DONOR_ADDRESS
      });
      
      expect(receipt.success).toBe(false);
      expect(receipt.error).toContain('u404');
    });
    
    test('should prevent donation amount of zero', async () => {
      // Register charity first
      await client.executeMethod({
        method: {
          name: 'register-charity',
          args: ['Test Charity', CHARITY_ADDRESS]
        },
        senderAddress: ADMIN_ADDRESS
      });
      
      const receipt = await client.executeMethod({
        method: {
          name: 'donate',
          args: ['u1', 'u0']
        },
        senderAddress: DONOR_ADDRESS
      });
      
      expect(receipt.success).toBe(false);
      expect(receipt.error).toContain('Invalid amount');
    });
  });
  
  describe('Integration Tests', () => {
    test('should track total donations correctly', async () => {
      // Register charity
      await client.executeMethod({
        method: {
          name: 'register-charity',
          args: ['Test Charity', CHARITY_ADDRESS]
        },
        senderAddress: ADMIN_ADDRESS
      });
      
      // Make multiple donations
      await client.executeMethod({
        method: {
          name: 'donate',
          args: ['u1', 'u100']
        },
        senderAddress: DONOR_ADDRESS
      });
      
      await client.executeMethod({
        method: {
          name: 'donate',
          args: ['u1', 'u200']
        },
        senderAddress: DONOR_ADDRESS
      });
      
      // Verify total donations
      const charityDetails = await client.executeMethod({
        method: {
          name: 'get-charity-details',
          args: ['u1']
        }
      });
      
      const charity = charityDetails.result.value;
      expect(charity['total-received']).toBe('u300');
    });
    
    test('full donation and milestone workflow', async () => {
      // 1. Register charity
      await client.executeMethod({
        method: {
          name: 'register-charity',
          args: ['Test Charity', CHARITY_ADDRESS]
        },
        senderAddress: ADMIN_ADDRESS
      });
      
      // 2. Add milestone
      await client.executeMethod({
        method: {
          name: 'add-milestone',
          args: ['u1', 'Phase 1', 'u1000']
        },
        senderAddress: ADMIN_ADDRESS
      });
      
      // 3. Make donations
      await client.executeMethod({
        method: {
          name: 'donate',
          args: ['u1', 'u600']
        },
        senderAddress: DONOR_ADDRESS
      });
      
      await client.executeMethod({
        method: {
          name: 'donate',
          args: ['u1', 'u400']
        },
        senderAddress: DONOR_ADDRESS
      });
      
      // 4. Update milestone progress
      await client.executeMethod({
        method: {
          name: 'update-milestone-progress',
          args: ['u1', 'u1000']
        },
        senderAddress: CHARITY_ADDRESS
      });
      
      // 5. Verify final state
      const [charityDetails, milestoneDetails] = await Promise.all([
        client.executeMethod({
          method: {
            name: 'get-charity-details',
            args: ['u1']
          }
        }),
        client.executeMethod({
          method: {
            name: 'get-milestone-details',
            args: ['u1']
          }
        })
      ]);
      
      const charity = charityDetails.result.value;
      const milestone = milestoneDetails.result.value;
      
      expect(charity['total-received']).toBe('u1000');
      expect(milestone.completed).toBe(true);
      expect(milestone['current-amount']).toBe('u1000');
    });
  });
});
