# Firestore Security Specification

## Data Invariants
1. Products must have a name and non-negative price/stock.
2. Tables must have unique numbers.
3. Orders must be linked to a valid table.
4. Finance records must have a type and non-negative amount.

## The Dirty Dozen (Attack Payloads)
1. **Unauthenticated Read**: Attempt to get `/products/123` without login. -> `PERMISSION_DENIED`
2. **Identity Spoofing**: Attempt to create an order as another user (N/A since we don't have ownerId on orders yet, but we check `request.auth != null`).
3. **Negative Price**: Create product with `price: -10`. -> `PERMISSION_DENIED`
4. **Invalid Status**: Update table with `status: 'broken'`. -> `PERMISSION_DENIED`
5. **Orphaned Order**: Create order with non-existent `tableId` (Hard to enforce without `get()` cost, but we check ID format).
6. **Time Spoofing**: Create order with `createdAt` in the future. -> `PERMISSION_DENIED`
7. **Large Junk ID**: Attempt to write to `/products/VERY_LONG_STRING_...`. -> `PERMISSION_DENIED`
8. **Malicious Finance Record**: Create expense with `amount: 'one million'`. -> `PERMISSION_DENIED`
9. **Bypassing App**: Direct update of product stock via script. -> Restricted by schema rules.
10. **Shadow Field Injection**: Create table with `isAdmin: true`. -> `PERMISSION_DENIED` (Keys checked).
11. **Update Immutable**: Try to change `createdAt` on an existing order. -> `PERMISSION_DENIED`
12. **PII Leak**: Unauthorized read of `customers` collection. -> Locked to auth users.

## Rule Analysis
- All writes require `isSignedIn()`.
- All writes validated via `isValid[Entity]`.
- Path variables validated via `isValidId()`.
