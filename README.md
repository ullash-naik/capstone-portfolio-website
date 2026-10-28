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

# Folio – Make a Portfolio in a Minute

Folio is a lightweight, multi-tenant portfolio builder that allows anyone to create a professional, fully-featured portfolio website in under a minute. 

Instead of traditional user accounts and passwords, Folio uses a seamless, passwordless authentication system. When you create a portfolio, the system generates a secure, private edit link. As long as you have that link, you have full administrative control over your page.

## 🚀 Features

* **Instant Setup:** Pick a name and a username to instantly generate a live portfolio.
* **No Passwords:** Secure authentication via a unique, randomly generated private edit link.
* **Dynamic Content Management:** Add, edit, and delete entries including:
  * Selected Work / Projects
  * Toolkit / Skills (with progress bars)
  * Journey / Milestones & Achievements
  * Proof / Certificates
* **File Uploads:** Upload profile avatars, PDF résumés, project covers, and certificate images directly to local storage.
* **Contact System:** Built-in contact form with a private inbox for portfolio owners to view messages.
* **Customization:** Built-in Dark/Light mode toggle and customizable accent colors.
* **Preloaded Demo:** Automatically seeds a fully-featured example portfolio (`/p/aarav-mehta`) on the first run to demonstrate capabilities.

## 🛠️ Tech Stack

**Frontend:**
* HTML5 & CSS3 (Custom responsive styling, CSS variables for theming)
* Vanilla JavaScript (DOM manipulation, Intersection Observers for scroll reveals)
* Fonts: Fraunces, Hanken Grotesk, JetBrains Mono

**Backend:**
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (NoSQL)
* **File Handling:** Multer (for multipart/form-data image and PDF uploads)
* **Authentication:** Cryptographic edit keys (`crypto` module) via custom HTTP headers (`x-edit-key`)

## ⚙️ Prerequisites

Before running this project, ensure you have the following installed on your machine:
1. [Node.js](https://nodejs.org/) (v14 or higher recommended)
2. [MongoDB](https://www.mongodb.com/try/download/community) (Running locally on default port `27017`)
3. Git

## 💻 Installation & Setup

To clone and run this project locally from GitHub, run the following commands in your terminal:

**1. Clone the repository:**
```bash
git clone [https://github.com/ullash-naik/capstone-portfolio-website.git](https://github.com/ullash-naik/capstone-portfolio-website.git)
cd capstone-portfolio-website