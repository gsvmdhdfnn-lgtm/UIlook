/* Guided walkthroughs (pass 12). Each one moves through real screens and
   roles; the banner above the page explains the step. Steps never change
   data on their own: the person does the step on the page, or presses
   Next step to look at the following screen. */
(function () {
  Hub.scenarios = {
    invoice: {
      title: 'Create and issue an invoice',
      icon: 'finance',
      summary: 'Northgate School, September',
      steps: [
        { role: 'management', route: 'mgmt-fin-drafts', title: 'Find the draft', text: 'September for Northgate School is still a draft. Open it.' },
        { role: 'management', route: 'mgmt-fin-draft/DRF-01', title: 'Check the lines', text: 'Each line comes from a delivered occurrence and the client’s terms. Add the purchase order number Northgate needs, then mark it ready.' },
        { role: 'management', route: 'mgmt-fin-draft/DRF-01', title: 'Issue it', text: 'Issue the invoice. It gets the next number and is frozen from then on: corrections go through a credit note or a replacement invoice.' },
        { role: 'management', route: 'mgmt-fin-invoices', title: 'See it issued', text: 'The new invoice sits at the top with Issued · frozen. Open it to send it, record a payment or raise a credit note.' },
        { role: 'management', route: 'mgmt-fin-invoice/INV-0011', title: 'A late one, for comparison', text: 'Harbour Lane’s £1,296.00 invoice is overdue. Its due date moved from 16 to 26 Sep, with who changed it and when.' },
        { role: 'management', route: 'mgmt-finance', title: 'Back to the overview', text: 'September income and the cash position now include what you issued.' }
      ]
    },
    register: {
      title: 'Take a register',
      icon: 'check',
      summary: 'U8 Development today, as the coach',
      steps: [
        { role: 'staff', coachRole: 'coach', route: 'coach-home', title: 'Coach home', text: 'You are signed in as a coach. Today’s session is at the top.' },
        { role: 'staff', coachRole: 'coach', route: 'coach-session/OCC-0033', title: 'Open the session', text: 'Venue access, parking, staff and who is expected. Medical details show only to coaches who may see them.' },
        { role: 'staff', coachRole: 'coach', route: 'coach-register/OCC-0033', title: 'Mark the register', text: 'Mark each player, add a note where needed, then complete it. Your name and the time are recorded.' },
        { role: 'staff', coachRole: 'learning', route: 'coach-register/OCC-0033', title: 'As a learning coach', text: 'A learning coach can mark players too, but sees names only.' },
        { role: 'management', route: 'mgmt-register/OCC-0033', title: 'What Management sees', text: 'The same register, with who marked it and when.' },
        { role: 'management', route: 'mgmt-registers', title: 'All registers', text: 'Incomplete registers raise a Needs Attention case until they are done.' }
      ]
    },
    cover: {
      title: 'Cover a holiday',
      icon: 'coaches',
      summary: 'Tom Reid is away 12–15 Oct',
      steps: [
        { role: 'staff', coachRole: 'coach', route: 'coach-availability', title: 'The coach marks a holiday', text: 'A coach marks the dates they are away. Sessions they lead on those dates need cover.' },
        { role: 'management', route: 'mgmt-attention', title: 'It shows in Needs Attention', text: 'Each affected occurrence raises a cover case, which grows more urgent as the date gets closer.' },
        { role: 'management', route: 'mgmt-cover', title: 'Cover board', text: 'Open cover across the next weeks, with who has been offered each one.' },
        { role: 'management', route: 'mgmt-cover-request/CVR-01', title: 'Offer the cover', text: 'Choose a compliant, available coach for each occurrence and offer it. Accepted cover updates the occurrence’s staff.' },
        { role: 'staff', coachRole: 'lead', route: 'coach-cover', title: 'The covering coach accepts', text: 'Coaches answer offers from their hub. Here Charlie (lead coach) has been offered Friday’s U13/14 session: accept or decline it.' },
        { role: 'management', route: 'mgmt-occurrences', title: 'Staffed again', text: 'Once accepted, the occurrences show the covering coach and the case clears.' }
      ]
    },
    family: {
      title: 'New family joins',
      icon: 'players',
      summary: 'From the public site to Parent home',
      steps: [
        { role: 'public', route: 'pub-offers', title: 'Find a session', text: 'A parent finds what they want on the public site.' },
        { role: 'public', route: 'pub-register', title: 'Create an account', text: 'They register with their email and add their child.' },
        { role: 'public', route: 'pub-check-email', title: 'Confirm the email', text: 'They confirm their email address before anything else happens.' },
        { role: 'management', route: 'mgmt-approvals', title: 'Management approves', text: 'New sign-ups and parent claims wait here. A partial match to an existing child is marked Needs review.' },
        { role: 'management', route: 'mgmt-parent-claims', title: 'Check the match', text: 'Compare what the parent entered with the child we hold before linking them.' },
        { role: 'management', route: 'mgmt-families', title: 'The family exists', text: 'The family, its parents and players are now linked, with who verified them and when.' },
        { role: 'client', route: 'parent-home', title: 'Parent home', text: 'The parent signs in and sees their children’s sessions, bookings and billing.' }
      ]
    },
    cancel: {
      title: 'Cancel a session',
      icon: 'calendar',
      summary: 'U9/10 Development on Thu 8 Oct',
      steps: [
        { role: 'management', route: 'mgmt-occurrence/OCC-0042', title: 'Open the occurrence', text: 'Thu 8 Oct, U9/10 Development. Cancel it with a reason.' },
        { role: 'management', route: 'mgmt-occurrence-outcome/OCC-0042', title: 'Decide the outcome', text: 'Choose what families get (credit or refund), what the venue owes and whether coaches are paid.' },
        { role: 'management', route: 'mgmt-occurrence-outcome/OCC-0019', title: 'A past example', text: 'The 17 Sep cancellation gave each family a £21.75 credit, with who decided and when.' },
        { role: 'client', route: 'parent-sessions', title: 'What the parent sees', text: 'The cancelled session shows with the credit it created.' },
        { role: 'management', route: 'mgmt-fin-parent-money', title: 'Family credits in Finance', text: 'Credits are used oldest first on the next charge. Nothing is edited; every credit has a source.' }
      ]
    }
  };
})();
