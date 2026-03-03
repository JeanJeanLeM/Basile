# Le jardin du 48 - App Blueprint

This document outlines the features and functionality of the "basile" application, broken down by each screen.

---

## 1. Core Layout & Navigation

The main application is wrapped in a consistent layout that provides navigation and access to user-specific functions.

- **Sidebar Navigation**: A collapsible sidebar on the left provides the main navigation for the app.
  - **Desktop**: The sidebar can be expanded (showing icons and labels) or collapsed (showing only icons with tooltips). The state is saved in a cookie.
  - **Mobile**: The sidebar is replaced by a sheet that slides out from the left, triggered by a hamburger icon in the header.
- **User Menu**: Located at the bottom of the sidebar, this menu allows users to:
  - **Sign Out**: If logged in with an email/password.
  - **Sign In / Sign Up**: If using an anonymous account, it prompts the user to create a permanent account to save their data.
  - Displays the user's email or "Anonyme".
- **Anonymous Authentication**: New users are automatically signed in with a temporary anonymous account, allowing them to use the app immediately. Data is stored, but they are prompted to create a full account to persist it across devices/sessions.
- **Root Redirect**: Accessing the base URL (`/`) automatically redirects to the `/planning` screen.

---

## 2. Planification (Planning Screen)

**Route**: `/planning`

This is the central hub for managing the user's crop cultivation plans.

- **Header**: Displays the screen title and a brief description.
- **Controls**:
  - **Planifier une culture**: A button that opens a modal to add a new cultivation plan.
  - **Suggestions**: A button that navigates to the `/planning/suggestions` page for AI-driven recommendations.
- **Plans Table/List**:
  - Displays all crops the user has scheduled for planting or sowing.
  - **Desktop View**: A detailed table showing Crop Name, Type (Semis/Plantation), Quantity, Sowing Week, and Planting Week.
  - **Mobile View**: A responsive card-based list, with each card summarizing a single plan.
  - **Functionality**:
    - **Search**: Filter plans by crop name.
    - **Sort**: Sort plans by planting week, sowing week, or crop name.
    - **Pagination**: The list is paginated to handle a large number of plans.
    - **Actions**: Each plan has a dropdown menu with options to **Edit**, **Copy**, or **Delete** the plan (with a confirmation dialog for deletion).
- **Add/Edit Plan Modal**:
  - **Crop Selection**: A searchable combobox to select a crop from the user's database.
  - **Planting Week**: A dropdown to select the desired week for planting.
  - **Sowing Week Calculation**: Automatically calculates and displays the optimal sowing week based on the selected crop and planting week.
  - **Quantity**: An input for the number of items to plant.
  - **Notes**: A textarea for any additional notes.

---

## 3. To do list (Calendar Screen)

**Route**: `/todo`

This screen provides a year-long calendar view of all upcoming gardening tasks.

- **Header**: Displays the screen title and a description.
- **Annual Calendar**:
  - Organizes all 52 weeks of the year into monthly, collapsible accordion sections. The current month is expanded by default.
  - **Week View**: Each week is displayed as a card showing its number and date range. The current week is highlighted.
  - **Task Events**: Displays tasks for "Sowing" (Semis) and "Planting" (Plantation) based on the user's plans.
    - Events are color-coded for easy identification.
    - A combined "S/P" event is shown if both sowing and planting occur in the same week.
  - **Task Completion**: Each task has a checkbox next to it, allowing the user to mark `sowingDone` or `plantingDone` as complete. The change is saved to the database and visually reflected.
  - **Responsive Design**: Shows weeks in a horizontal scroll area on desktop and a vertical list on mobile.

---

## 4. Cultures (Crops Screen)

**Route**: `/crops`

This screen is a library of all crops available to the user for planning.

- **Header**: Displays the screen title and a description.
- **Add Crop Button**: Opens a modal to add a new type of crop to the database.
- **Crop Gallery**:
  - Displays all crops as a grid of cards.
  - **Functionality**:
    - **Search**: Filter crops by name.
    - **Sort**: Sort crops by name or type.
    - **Pagination**: The gallery is paginated.
  - **Crop Card**: Each card contains:
    - **Image**: An image of the crop (from `/public/assets`) with an emoji fallback.
    - **Name & Type**: The crop's name and category (e.g., Légume-fruit).
    - **Greenhouse Badge**: Displays "En serre", "Plein champ", or both badges to indicate planting requirements.
    - **Collapsible Calendar**: Clicking the card reveals a 12-month mini-calendar showing the ideal sowing and planting periods for that specific crop type.
    - **Actions**: Buttons to **Edit**, **Copy**, or **Delete** the crop type.
- **Add/Edit Crop Modal**:
  - A form to define all properties of a crop, including its name, type, time between sowing/planting/harvest, and planting season (start/end months).
  - A dropdown allows specifying its planting method: "En serre uniquement" (`TRUE`), "Plein champ uniquement" (`FALSE`), or "Plein champ et/ou sous serre" (`both`).

---

## 5. Basil (AI Assistant Screen)

**Route**: `/basil`

This screen features an interactive assistant named Basil that helps users build a personalized cultivation plan.

- **Header**: Introduces Basil and its purpose.
- **User Preference Questionnaire**: A series of questions to understand the user's gardening style and constraints.
  - 1. **Greenhouse**: Does the user have a greenhouse?
  - 2. **Direct Sowing**: Does the user want to sow directly in the ground?
  - 3. **Year-Long Crops**: Which crops does the user want to harvest all year? (Multi-select from suggestions or a full list).
  - 4. **Winter Cultivation**: How much winter cultivation is desired? (Yes, a little, no).
  - 5. **Season Extension**: Does the user want to plant early, late, or both?
- **AI-Driven Suggestions**: As the user answers the questions, their preferences are saved. Based on these settings, a `MonthlyCropSuggestions` component appears, showing a tailored list of suggested crops and actions (sowing/planting) for each month, drawn from a master plan.
- **Add to Plan**: Users can add any suggestion directly to their main plan with a single click.

---

## 6. Suggestions Screen

**Route**: `/planning/suggestions`

A dedicated page that displays the same AI-driven suggestions found on the Basil screen.

- **Purpose**: Provides a focused view of the recommendations generated from the user's preferences.
- **Content**:
  - Displays monthly, collapsible lists of suggested crops and actions.
  - Each suggestion has an "Ajouter" (Add) button to add it to the user's plan.
- **Onboarding**: If the user has not yet filled out the Basil questionnaire, this page prompts them to do so to receive personalized suggestions.

---

## 7. Partager (Share Screen)

**Route**: `/share`

A simple screen for sharing the application or providing feedback.

- **Share Link**: A button that uses the browser's native Share API (if available) or copies the application's URL to the clipboard.
- **Send Feedback**: A button with a `mailto:` link pre-filled with the developer's email address for user feedback.

---

## 8. Authentication Screens

**Routes**: `/login`, `/signup`

Standard forms for user account management.

- **Login**: A form for users to sign in with their email and password.
- **Signup**: A form for new users to create an account with an email and password (with password confirmation).
- **Functionality**:
  - Both forms use Firebase Authentication.
  - Includes input validation and displays error messages.
  - Shows success or error notifications using a toast component.
  - Provides navigation links between the login and signup pages.
 