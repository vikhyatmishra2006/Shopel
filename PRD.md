# Product Requirement Document (PRD) - Shopel

## 1. System Objectives
Shopel delivers a highly responsive, modern shopping landscape providing multi-tiered customer search, secure transactions, and verifiable user engagement metrics.

## 2. Advanced Review & Rating Core Specifications
To prevent spam metrics and maintain review integrity, Shopel implements a verified-purchase evaluation feedback loop:

### 2.1 Core Capabilities
- **Verified Purchase Validation:** Only accounts matching an order status of `Delivered` can submit ratings or narrative reviews for that specific Product ID.
- **Granular Review Metrics:** Users provide an integer score (1–5 stars) along with optional title text, body commentary, and image attachments.
- **Review Voting Engine:** Authenticated peers can upvote ("Helpful") or downvote reviews. 
- **Dynamic Aggregate Calculations:** The system recalculates `numReviews` and `rating` fields on the product model immediately upon a new entry, modification, or removal.
- **Moderation Protocol:** Administrators maintain authorization overrides to hide or delete reviews flag-marked as violating platform guidelines.

## 3. App Core Layout Mockups
- **Global Nav Header:** Application Logo, Global Structural Search query engine, active Dynamic Cart Counter badge, User Dropdown navigation, and Theme switcher utility toggle.
- **Product Details Showcase Grid:**
  - Left Column: Image multi-aspect media carousel.
  - Right Column: Title, Verified Rating Badge (e.g., "★ 4.7 (128 Reviews)"), Price configuration, Stock Indicator state, and Cart modifications.
  - Bottom Span: Tabbed panel rendering comprehensive item specifications alongside an Advanced Review list complete with filtering bars (e.g., "Filter by 5 Stars").