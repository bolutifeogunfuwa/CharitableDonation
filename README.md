# Charitable Donation Platform

A decentralized application (DApp) built on the Clarity blockchain that enables transparent charitable donations with milestone-based fund tracking.

## Overview

The Charitable Donation Platform provides a transparent and accountable system for managing charitable donations using blockchain technology. It allows donors to track their contributions, charities to set and report on milestones, and ensures complete transparency in fund allocation.

## Features

### For Donors
- Make secure donations using STX tokens
- Track donation history and impact
- View charity milestones and progress
- Access transparent fund utilization reports
- Verify charity reputation scores

### For Charities
- Receive donations directly to designated wallet
- Set and manage project milestones
- Provide proof of impact reports
- Build reputation through transparent operations
- Track total donations received

### For Administrators
- Register and verify charitable organizations
- Monitor donation flows
- Manage platform operations
- Ensure compliance and transparency

## Smart Contract Functions

### Administrative Functions
```clarity
(initialize-contract)
(register-charity (name (string-ascii 64)) (wallet principal))
```

### Donation Functions
```clarity
(donate (charity-id uint) (amount uint))
```

### Milestone Management
```clarity
(add-milestone (charity-id uint) (description (string-ascii 256)) (target-amount uint))
(update-milestone-progress (milestone-id uint) (amount uint))
```

### Read-Only Functions
```clarity
(get-charity-details (charity-id uint))
(get-donation-details (donation-id uint))
(get-milestone-details (milestone-id uint))
```

## Data Structures

### Charities
```clarity
{
  charity-id: uint,
  name: string-ascii,
  wallet: principal,
  total-received: uint,
  reputation-score: uint,
  active: bool
}
```

### Donations
```clarity
{
  donation-id: uint,
  donor: principal,
  charity-id: uint,
  amount: uint,
  timestamp: uint,
  status: string-ascii
}
```

### Milestones
```clarity
{
  milestone-id: uint,
  charity-id: uint,
  description: string-ascii,
  target-amount: uint,
  current-amount: uint,
  completed: bool
}
```

## Getting Started

### Prerequisites
- Clarity CLI
- STX wallet
- Node.js (for frontend integration)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/charitable-donation-platform
```

2. Install dependencies:
```bash
npm install
```

3. Deploy the contract:
```bash
clarity deploy charitable-donation.clar
```

## Usage Examples

### Making a Donation
```clarity
;; Donate 100 STX to charity with ID 1
(contract-call? .charitable-donation donate u1 u100)
```

### Adding a Milestone
```clarity
;; Add milestone for charity with ID 1
(contract-call? .charitable-donation add-milestone u1 "Build community center" u10000)
```

## Security Considerations

- Only the contract owner can register new charities
- Donations are directly transferred to charity wallets
- Milestone updates require charity authorization
- Active status tracking prevents donations to inactive charities
- All transactions are immutably recorded on the blockchain

## Contributing

We welcome contributions to improve the platform. Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Testing

Run the test suite:
```bash
npm test
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Roadmap

### Phase 1 (Current)
- Basic donation functionality
- Milestone tracking
- Charity registration

### Phase 2 (Planned)
- Enhanced reputation system
- Automated impact reporting
- Multi-token support
- Advanced analytics dashboard

### Phase 3 (Future)
- DAO governance
- Cross-chain integration
- AI-powered fraud detection
- Mobile application

## Acknowledgments

- Clarity blockchain team
- Open-source community
- Early adopters and testers

---

*Built with ❤️ for making charitable giving more transparent and accountable.*
