# Scansheet

**Scansheet is a modern, lightweight, and user-friendly application that keeps track of attendance records through a QR code-based system. The application has the following features:**
* Create, edit, and delete entries and categories.
* Export a user-defined selection of entries and categories to CSV and PDF.
* Fetch all attendance records corresponding to an individual entry.
* Fetch all attendance records corresponding to an individual date.
* Filter attendance records for an individual entry by category, day, and date range.
* Filter attendance records for an individual date by category.
* Generate printable badges for a user-defined selection of entries.

[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000)](#)
[![Node.js](https://img.shields.io/badge/Node.js-6DA55F?logo=node.js&logoColor=white)](#)
[![npm](https://img.shields.io/badge/npm-CB3837?logo=npm&logoColor=fff)](#)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=fff)](#)
[![React](https://img.shields.io/badge/React-%2320232a.svg?logo=react&logoColor=%2361DAFB)](#)
[![Framer](https://img.shields.io/badge/Framer-05F?logo=framer&logoColor=fff)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-%2338B2AC.svg?logo=tailwind-css&logoColor=white)](#)
[![Express.js](https://img.shields.io/badge/Express.js-%23404d59.svg?logo=express&logoColor=%2361DAFB)](#)
[![SQLite](https://img.shields.io/badge/SQLite-%2307405e.svg?logo=sqlite&logoColor=white)](#)
[![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=fff)](#)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?logo=github-actions&logoColor=white)](#)

## Installation

1. Clone the repository and navigate to the project folder directory.

```
git clone https://github.com/michaeltin001/Scansheet.git
cd Scansheet
```

2. Install the project dependencies.

```
npm run install-all --prefix server
```

3. Start the development server.

```
npm run dev --prefix server
```

4. Run server-side tests.

```
npm run tests --prefix server
```

5. Build the client application.

```
npm run build --prefix client
```

## Overview

- [Home Page](#home-page)
- [Entries Page](#entries-page)
- [Entry Page](#entry-page)
- [Categories Page](#categories-page)
- [Dates Page](#dates-page)
- [Date Page](#date-page)
- [Settings Page](#settings-page)

### Home Page

The home page serves as the central dashboard for the application, providing quick access to all major features via a grid of interactive cards.

* **View Entries:** Navigates to the [**Entries Page**](#entries-page), where you can view, create, edit, and manage all scan entries.
* **View Categories:** Navigates to the [**Categories Page**](#categories-page) to create and manage the categories that scans can be assigned to.
* **View Dates:** Navigates to the [**Dates Page**](#dates-page), which provides a calendar-based view of all scan records.
* **Today's Report:** A shortcut that navigates directly to the [**Date Page**](#date-page) for the current date, showing all scans recorded today.
* **Open Scanner:** Opens the quick-scan modal. This modal is optimized for rapid scanning (e.g., using a hardware barcode scanner). It listens for a 36-character code and, upon receiving it, automatically submits a new scan record with the current timestamp and the selected category.
* **Add a Scan:** Opens a modal to manually create a new scan record. This form allows you to specify the entry code, select a category, and set a custom date and time, making it ideal for backdating scans or making manual corrections.

### Entries Page

The Entries Page is where you manage all scannable items, from creating new entries and importing them in bulk to exporting or deleting existing ones.

* **Reset Selection** (`history` icon): Clears all currently selected entries.
* **Select All** (`check_box` icon): Selects or deselects all entries visible on the current page. The icon changes to show an indeterminate state (`indeterminate_check_box`) if some, but not all, entries are selected.
* **Download Menu** (`download` icon): Opens a menu with options to export data for the selected entries. This button is disabled if no entries are selected.
    * **Print Badges:** Opens a modal to generate a printable PDF of QR code badges for the selected entries.
    * **Export to PDF:** Opens a modal to create a PDF document listing the selected entries' names and creation dates.
    * **Export to CSV:** Opens a modal to download a CSV file containing the data for the selected entries.
* **Delete** (`delete` icon): Opens a modal to confirm the deletion of all selected entries. This button is disabled if no entries are selected.
* **Search** (`search` icon): Toggles a search bar that filters the list of entries by name as you type.
* **Add Menu** (`add` icon): Opens a menu for adding new entries.
    * **Create New Entry:** Opens a modal to create a single new entry by typing its name.
    * **Import from CSV:** Allows you to upload a CSV file to batch-create multiple entries at once.

#### Per-Entry Actions

Each item in the list has its own set of controls:

* **Checkbox:** Selects or deselects a single entry.
* **View Profile** (`account_circle` icon): Navigates to that entry's detailed **Entry Page** to view its complete scan history.
* **Edit** (`edit` icon): Opens a modal to rename the entry.
* **Copy Code** (`content_copy` icon): Copies the entry's unique ID code (UUID) to your clipboard.
* **View QR Code** (`qr_code_2` icon): Opens a modal displaying the entry's scannable QR code, with options to download it as a PNG, print a badge, or generate a new code.
* **Delete** (`delete` icon): Opens a modal to delete only that specific entry.

#### Pagination and Sorting

Controls at the bottom of the page help navigate the list:

* **Page Navigation:** Buttons allow you to jump to the first, previous, next, or last page of entries.
* **Sort By:** A dropdown menu sorts the list by name (A-Z or Z-A) or by creation date (Newest or Oldest).
* **Results per Page:** A dropdown menu changes the number of entries displayed per page (options: 5, 10, 25, 50, 100).

### Entry Page

The Entry Page displays the complete scan history for a specific entry, allowing for detailed filtering, individual scan management, and data export.

* **Back** (`arrow_back` icon): Navigates back to the previously viewed page (e.g., the Entries list).
* **Download Menu** (`download` icon): Opens a menu with options to export the currently filtered scan history.
    * **Export to PDF:** Exports the currently visible (filtered) list of scans for this entry to a PDF document.
    * **Export to CSV:** Exports the currently visible (filtered) list of scans for this entry to a CSV file.
* **Filter** (`search` icon): Toggles a filter bar that allows you to narrow down the scan list.
    * **Open Filter Menu** (`menu` icon): Opens a modal to select which days of the week or which categories to display.
    * **Date Pickers:** Allows you to filter the scan list by a start and end date.
    * **Reset Filters** (`history` icon): Resets all filters (date range, day, and category) to their default values.
    * **Clear Dates** (`close` icon): Clears the date range, day, and category filters.
* **Options Menu** (`more_vert` icon): Opens a menu with actions related to the entry itself.
    * **Create New Scan:** Opens a modal to manually add a new scan record, pre-filling this entry's code.
    * **Edit Entry:** Opens a modal to rename this entry.
    * **Copy QR Code:** Copies the entry's unique ID code (UUID) to your clipboard.
    * **View QR Code:** Opens a modal displaying the entry's scannable QR code, with options to download it as a PNG, print a badge, or generate a new code.
    * **Delete Entry:** Opens a modal to permanently delete this entry and its entire scan history.

#### Per-Scan Actions

Each scan record in the list has its own set of controls:

* **Edit** (`edit` icon): Opens a modal to change the date and time of the individual scan record.
* **Delete** (`delete` icon): Opens a modal to delete only that specific scan record.

#### Pagination and Sorting

Controls at the bottom of the page help navigate the scan list:

* **Page Navigation:** Buttons allow you to jump to the first, previous, next, or last page of scans.
* **Sort By:** A dropdown menu sorts the scan list by date (Newest or Oldest).
* **Results per Page:** A dropdown menu changes the number of scans displayed per page (options: 5, 10, 25, 50, 100).

### Categories Page

The Categories Page is where you create and manage all the categories that scans can be assigned to, including importing, exporting, and deleting them.

* **Reset Selection** (`history` icon): Clears all currently selected categories.
* **Select All** (`check_box` icon): Selects or deselects all categories visible on the current page (excluding the "General" category). The icon changes to show an indeterminate state (`indeterminate_check_box`) if some, but not all, categories are selected.
* **Download Menu** (`download` icon): Opens a menu with options to export data for the selected categories. This button is disabled if no categories are selected.
    * **Export to PDF:** Opens a modal to create a PDF document listing the selected categories' names and creation dates.
    * **Export to CSV:** Opens a modal to download a CSV file containing the data for the selected categories.
* **Delete** (`delete` icon): Opens a modal to confirm the deletion of all selected categories. This button is disabled if no categories are selected.
* **Search** (`search` icon): Toggles a search bar that filters the list of categories by name as you type.
* **Add Menu** (`add` icon): Opens a menu for adding new categories.
    * **Create New Category:** Opens a modal to create a single new category by typing its name.
    * **Import from CSV:** Allows you to upload a CSV file to batch-create multiple categories at once.

#### Per-Category Actions

Each item in the list has its own set of controls (note: the default "General" category cannot be selected, edited, or deleted).

* **Checkbox:** Selects or deselects a single category.
* **Edit** (`edit` icon): Opens a modal to rename the category.
* **Delete** (`delete` icon): Opens a modal to delete only that specific category. When deleted, any scans assigned to it are automatically reassigned to the "General" category.

### Dates Page

The Dates Page lists all unique dates that have at least one scan record, allowing you to filter by date range, manage scans in bulk by date, and export date-based reports.

* **Reset Selection** (`history` icon): Clears all currently selected dates.
* **Select All** (`check_box` icon): Selects or deselects all dates visible on the current page. The icon changes to show an indeterminate state (`indeterminate_check_box`) if some, but not all, dates are selected.
* **Download Menu** (`download` icon): Opens a menu with options to export the selected dates. This button is disabled if no dates are selected.
    * **Export to PDF:** Opens a modal to create a PDF document listing the selected dates.
    * **Export to CSV:** Opens a modal to download a CSV file listing the selected dates.
* **Delete** (`delete` icon): Opens a modal to delete all scans associated with the selected dates. This button is disabled if no dates are selected.
* **Filter** (`search` icon): Toggles a filter bar that allows you to narrow down the list by date range or day of the week.
    * **Open Day Filter** (`menu` icon): Opens a modal to filter the list to only show specific days of the week (e.g., only Mondays).
    * **Date Pickers:** Allows you to filter the list by a start and end date.
    * **Reset Filters** (`history` icon): Resets the date range and day filter back to their default values.
    * **Clear Filters** (`close` icon): Clears the date range and day filter selections.
* **Add Menu** (`add` icon): Opens a menu for adding new scans.
    * **Create New Scan:** Opens a modal to manually create a new scan record, allowing you to specify the code, category, date, and time.

#### Per-Date Actions

Each date in the list has its own set of controls:

* **Checkbox:** Selects or deselects a single date.
* **View Date** (`calendar_today` icon): Navigates to that date's detailed **Date Page** to view all individual scans recorded on that day.
* **Delete** (`delete` icon): Opens a modal to delete **all** scan records associated with that specific date.

### Date Page

The Date Page displays all individual scan records for a specific date, allowing for category filtering, scan management, and advanced report exporting.

* **Back** (`arrow_back` icon): Navigates back to the previously viewed page (e.g., the Dates list).
* **Download Menu** (`download` icon): Opens a menu with options to export the currently filtered scan history.
    * **Export to PDF:** Opens a modal with advanced options (like removing duplicates, alphabetizing, or comparing against a CSV) before generating a PDF of the scan list.
    * **Export to CSV:** Opens a modal with the same advanced options before downloading a CSV file of the scan list.
* **Filter** (`search` icon): Toggles a filter bar that allows you to narrow down the scan list by category.
    * **Open Category Filter** (`menu` icon): Opens a modal to select which categories to display.
    * **Reset Filters** (`history` icon): Resets the category filter to include all categories.
* **Options Menu** (`more_vert` icon): Opens a menu with additional actions.
    * **Create New Scan:** Opens a modal to manually add a new scan record, pre-filling the date for this page.

#### Per-Scan Actions

Each scan record in the list has its own set of controls:

* **Edit** (`edit` icon): Opens a modal to change the date and time of the individual scan record.
* **Delete** (`delete` icon): Opens a modal to delete only that specific scan record.

### Settings Page

The Settings Page allows you to configure application-wide preferences and access project documentation.

* **Theme:** A dropdown menu to change the application's visual theme.
    * **System:** Sets the theme to match your operating system's preference (light or dark).
    * **Light:** Forces the application to use the light theme.
    * **Dark:** Forces the application to use the dark theme.
* **View on GitHub:** A button that opens the project's GitHub page, which contains its documentation.
