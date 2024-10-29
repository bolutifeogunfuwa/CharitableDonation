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

;; Make donation
(define-public (donate (charity-id uint) (amount uint))
  (let (
    (donation-id (+ (var-get donation-counter) u1))
    (charity (unwrap! (map-get? charities { charity-id: charity-id }) (err u404)))
  )
    (begin
      (asserts! (is-eq (get active charity) true) (err u403))
      (try! (stx-transfer? amount tx-sender (get wallet charity)))
      (map-set donations
        { donation-id: donation-id }
        {
          donor: tx-sender,
          charity-id: charity-id,
          amount: amount,
          timestamp: block-height,
          status: "completed"
        }
      )
      (map-set charities
        { charity-id: charity-id }
        (merge charity { total-received: (+ (get total-received charity) amount) })
      )
      (var-set donation-counter donation-id)
      (ok donation-id))))

;; Add milestone
(define-public (add-milestone
    (charity-id uint)
    (description (string-ascii 256))
    (target-amount uint)
  )
  (let ((milestone-id (+ (var-get milestone-counter) u1)))
    (begin
      (asserts! (is-eq tx-sender (var-get contract-owner)) (err u403))
      (map-set milestones
        { milestone-id: milestone-id }
        {
          charity-id: charity-id,
          description: description,
          target-amount: target-amount,
          current-amount: u0,
          completed: false
        }
      )
      (var-set milestone-counter milestone-id)
      (ok milestone-id))))

;; Update milestone progress
(define-public (update-milestone-progress
    (milestone-id uint)
    (amount uint)
  )
  (let (
    (milestone (unwrap! (map-get? milestones { milestone-id: milestone-id }) (err u404)))
    (charity (unwrap! (map-get? charities { charity-id: (get charity-id milestone) }) (err u404)))
  )
    (begin
      (asserts! (is-eq tx-sender (get wallet charity)) (err u403))
      (map-set milestones
        { milestone-id: milestone-id }
        (merge milestone {
          current-amount: (+ (get current-amount milestone) amount),
          completed: (>= (+ (get current-amount milestone) amount) (get target-amount milestone))
        })
      )
      (ok true))))
