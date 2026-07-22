# Security Specification document for Paramastra Firestore DB

## Data Invariants
- Classrooms can only be read or modified with verified authority.
- Lecture recordings can only be updated by the CR (Class Representative) or Admin.
- Diary logs are private or scoped per class code.

## The Dirty Dozen Payloads to Avoid (Returns Permission Denied)
1. Injecting a massive string into `classCode` to bloat DB space.
2. An unauthorized student attempting to modify a CR's password.
3. Overwriting another student's diary entries.
4. Attempting to bypass validations during lecture updates.
5. Deleting classroom data as an unauthenticated viewer.
6. Writing orphan records without matching class codes.
7. Spoofing timestamps with client-provided dates instead of server timestamps.
8. Updating lecture records with arbitrary fields (e.g. `isVerifiedAdmin: true`).
9. Modifying static metadata like `createdAt` after creation.
10. Reading high-sensitivity PII info fields of classrooms.
11. Bypassing state checks during reset procedures.
12. Modifying another student's rbac role level directly.

## Secure Rules Ruleset Outline
The firestore rules will reject all unauthorized read/write attempts to non-conforming structures.
