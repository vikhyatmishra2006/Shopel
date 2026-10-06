# Master Engineering AI Generation Framework - Shopel

## Prompt 1: Backend Review API Architecture Setup
```text
Context: You are a principal backend software engineer developing Shopel, a MERN e-commerce application.
Task: Write a production-ready Mongoose model and Express route controller handling the advanced review system.

Requirements:
1. Review Model: Embedded within Product schema or referencing User and Product schemas. Must track user, rating (1-5), comment title, comment text, and an array of helpfulVotes.
2. Verified Purchase Access Guard: Query the Order collection to confirm the user has a finalized, delivered order containing the product before allowing a POST request to '/api/products/:id/reviews'.
3. Real-Time Aggregate Calculation: On successful creation, edit, or deletion of a review, automatically compute and update the product's overall rating and numReviews fields using standard MongoDB aggregation or Mongoose middleware methods.
4. Provide absolute, production-grade JavaScript error validation handling using Try-Catch scopes. Do not abbreviate or write pseudocode.
```

## Prompt 2: Frontend Client Component Integration
```text
Context: You are a senior frontend engineer styling interfaces in Tailwind CSS and React for the Shopel ecosystem.
Task: Construct a responsive '<ProductReviewSection />' component that talks to the backend API generated in Prompt 1.

Requirements:
1. Render summary star metrics dynamically featuring visual feedback percentage indicator meters for each rating score group (5 stars, 4 stars, etc.).
2. Show an input form that renders only if the authenticated user has purchased the product. Include interactive star inputs, character count tracking for reviews, and a clear error display if the API returns validation errors.
3. Map out a clean feed layout demonstrating helpfulness vote buttons, sorting filters (e.g., "Most Helpful", "Most Recent"), and verified buyer check badges.
```