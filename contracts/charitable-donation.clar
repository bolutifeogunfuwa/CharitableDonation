;; Charitable Donation Platform Smart Contract
;; Allows transparent tracking of donations and milestone-based fund releases

(define-data-var contract-owner principal tx-sender)
(define-map charities
  { charity-id: uint }
  {
    name: (string-ascii 64),
    wallet: principal,
    total-received: uint,
    reputation-score: uint,
    active: bool
  }
)

(define-map donations
  { donation-id: uint }
  {
    donor: principal,
    charity-id: uint,
    amount: uint,
    timestamp: uint,
    status: (string-ascii 20)
  }
)

(define-map milestones
  { milestone-id: uint }
  {
    charity-id: uint,
    description: (string-ascii 256),
    target-amount: uint,
    current-amount: uint,
    completed: bool
  }
)

(define-data-var donation-counter uint u0)
(define-data-var charity-counter uint u0)
(define-data-var milestone-counter uint u0)

;; Initialize contract
(define-public (initialize-contract)
  (begin
    (var-set contract-owner tx-sender)
    (ok true)))

;; Register new charity
(define-public (register-charity (name (string-ascii 64)) (wallet principal))
  (let ((charity-id (+ (var-get charity-counter) u1)))
    (begin
      (asserts! (is-eq tx-sender (var-get contract-owner)) (err u403))
      (map-set charities
        { charity-id: charity-id }
        {
          name: name,
          wallet: wallet,
          total-received: u0,
          reputation-score: u100,
          active: true
        }
      )
      (var-set charity-counter charity-id)
      (ok charity-id))))
