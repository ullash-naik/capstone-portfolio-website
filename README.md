# capstone-portfolio-website
# Portfolio Website & Achievement Tracker

A full-stack portfolio and milestone tracking web application where users can document their professional journey, manage achievements, milestones, and skills via full CRUD operations, and attach certificate documents/images.

---

## 1. Requirements & User Stories

### User Stories
* **Story 1 (Authentication):** As a user, I want to create an account, securely log in, and log out so that only I have authority to create, edit, or delete my portfolio records.
* **Story 2 (Content & Milestone Management):** As an authenticated user, I want to create, view, update, and delete entries under categories like Achievements, Milestones, and Skills.
* **Story 3 (Certificate Uploads):** As a user, I want to attach and store certificate media files alongside my milestones to serve as verified evidence of my skills[cite: 1, 5].
* **Story 4 (Public Showcase & Search):** As an external recruiter, evaluator, or peer, I want to browse published portfolio items and filter them by category without requiring write access[cite: 5].

### Wireframe Layout
```text
+-----------------------------------------------------------------------------+
| DevPortfolioHub                                 [Logged in as: User] [Logout]
+-----------------------------------------------------------------------------+
| ADD / EDIT ENTRY                                                            |
|  Title:        [ e.g., Cloud Computing Certification                     ]  |
|  Category:     [ Achievement | Milestone | Skill                        v]  |
|  Description:  [ Detailed summary of learning outcomes and tech used...  ]  |
|  Certificate:  [ Choose File: certificate.png / .pdf                     ]  |
|                [ Save Entry ] [ Cancel ]                                    |
+-----------------------------------------------------------------------------+
| PORTFOLIO SHOWCASE                              Filter: [ All Categories v ]|
|                                                                             |
| +--------------------------------+ +--------------------------------------+ |
| | [Achievement]                  | | [Skill]                              | |
| | Hackathon Winner               | | Full-Stack REST API & Node.js        | |
| | Developed real-time prototype. | | Built scalable modular endpoints.    | |
| | [View Certificate Image]       | | (No attachment)                      | |
| | Author: Ullash                 | | Author: Ullash                       | |
| | [Edit] [Delete]                | | [Edit] [Delete]                      | |
| +--------------------------------+ +--------------------------------------+ |
+-----------------------------------------------------------------------------+