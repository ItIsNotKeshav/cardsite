// Every rate, fee and benefit on the page comes from here, so the sections and the calculator agree.
// The figures are illustrative: Hermes Card is a design concept, not an offer of credit.

export const CATEGORIES = [
  { id: 'travel', label: 'Travel', note: 'Flights, hotels and cars booked through Hermes Travel' },
  { id: 'dining', label: 'Dining', note: 'Restaurants, cafés, bars and food delivery' },
  { id: 'groceries', label: 'Groceries', note: 'Supermarkets, on up to $25,000 a year' },
  { id: 'transit', label: 'Transit', note: 'Rideshare, trains, buses, tolls and parking' },
  { id: 'other', label: 'Everything else', note: 'Every other purchase, with no cap' },
];

// Annual cap on the boosted grocery rate; spend above it earns the plan's base rate.
export const GROCERY_CAP = 25000;
// One point is worth one cent as cash back.
export const POINT_VALUE = 0.01;

export const PLANS = [
  {
    id: 'courier',
    name: 'Courier',
    fee: 0,
    pitch: 'Cash back on the everyday, with no annual fee.',
    rates: { travel: 3, dining: 3, groceries: 2, transit: 2, other: 1.5 },
    bonus: { points: 20000, spend: 1000, months: 3 },
    intro: '0% intro APR for 15 months',
    perks: ['0% intro APR for 15 months', 'No foreign transaction fees', 'Purchase protection and extended warranty'],
  },
  {
    id: 'messenger',
    name: 'Messenger',
    fee: 95,
    featured: true,
    pitch: 'More back where most of the money goes: food, travel and the weekly shop.',
    rates: { travel: 5, dining: 4, groceries: 3, transit: 2, other: 1.5 },
    bonus: { points: 80000, spend: 4000, months: 3 },
    intro: '0% intro APR for 15 months',
    perks: ['$50 annual hotel credit', '4 airport lounge visits a year', 'Cell phone and trip cancellation cover'],
  },
  {
    id: 'olympian',
    name: 'Olympian',
    fee: 495,
    pitch: 'For people who are always somewhere else: credits, lounges and cover that pay for the fee.',
    rates: { travel: 8, dining: 5, groceries: 3, transit: 3, other: 2 },
    bonus: { points: 120000, spend: 6000, months: 3 },
    intro: null,
    perks: ['$300 annual travel credit', 'Unlimited lounge access, two guests', 'Global Entry or TSA PreCheck credit'],
  },
];

export const BENEFITS = [
  { title: 'Unlimited lounge access', body: 'More than 1,400 airport lounges worldwide, with two guests free. Messenger includes four visits a year.', plans: ['olympian', 'messenger'] },
  { title: '$300 travel credit', body: 'Applied automatically to flights, hotels, trains and rideshare each card year.', plans: ['olympian'] },
  { title: 'Trip cancellation cover', body: 'Up to $10,000 a trip when illness, weather or a missed connection gets in the way.', plans: ['olympian', 'messenger'] },
  { title: 'Primary rental car cover', body: 'Decline the counter’s collision waiver; theft and damage are covered first, not after your own insurer.', plans: ['olympian'] },
  { title: 'Cell phone protection', body: 'Up to $800 a claim against damage or theft when you pay your phone bill with the card.', plans: ['olympian', 'messenger'] },
  { title: 'Purchase protection', body: 'New purchases covered against damage or theft for 120 days, up to $10,000 a claim.', plans: ['olympian', 'messenger', 'courier'] },
  { title: 'Extended warranty', body: 'Adds a year to eligible manufacturer warranties of three years or less.', plans: ['olympian', 'messenger', 'courier'] },
  { title: 'No foreign transaction fees', body: 'Pay in any currency at the network rate, with nothing added on top.', plans: ['olympian', 'messenger', 'courier'] },
  { title: 'Zero fraud liability', body: 'You are never responsible for charges you didn’t make. Freeze the card from the app in a tap.', plans: ['olympian', 'messenger', 'courier'] },
  { title: 'Instant digital card', body: 'Approved today, spending today: add the card to Apple Pay or Google Pay before the titanium arrives.', plans: ['olympian', 'messenger', 'courier'] },
];

// Rows of the pricing table: one value per plan, or one value for all of them.
export const FEES = [
  { label: 'Annual fee', values: ['$0', '$95', '$495'] },
  { label: 'Additional cards', values: ['$0', '$0', '$175 each'] },
  { label: 'Purchase APR', values: ['0% intro for 15 months, then 20.24%–28.99% variable', '0% intro for 15 months, then 20.24%–28.99% variable', '21.24%–29.24% variable'] },
  { label: 'Balance transfer APR', values: ['0% intro for 15 months on transfers made in the first 60 days, then 20.24%–28.99% variable', '0% intro for 15 months on transfers made in the first 60 days, then 20.24%–28.99% variable', '21.24%–29.24% variable'] },
  { label: 'Balance transfer fee', all: '3% of each transfer ($5 minimum) in the first 60 days, then 5%' },
  { label: 'Cash advance APR', all: '29.99% variable' },
  { label: 'Cash advance fee', all: '5% of each advance ($10 minimum)' },
  { label: 'Foreign transaction fee', all: 'None' },
  { label: 'Late payment', all: 'Up to $40' },
  { label: 'Returned payment', all: 'Up to $40' },
];

export const STEPS = [
  { title: 'See if you’re approved', body: 'Answer a few questions and find out in about a minute. Checking uses a soft enquiry, so it doesn’t affect your credit score.' },
  { title: 'Make it yours', body: 'Pick black, silver, burgundy or gold titanium and the name we laser-mark on the front.' },
  { title: 'Spend today', body: 'Your digital card is ready the moment you’re approved. The titanium one arrives by courier in five to seven working days.' },
];

export const FAQ = [
  { q: 'How do points turn into cash back?', a: 'Every point is worth one cent as a statement credit or a deposit to your bank account, so 5x points is 5% back. Points can also go further when you move them to one of our airline and hotel partners.' },
  { q: 'When do I get the welcome bonus?', a: 'Once you’ve spent the qualifying amount in the first three months, the bonus points land with your next statement. Purchases count; balance transfers, cash advances and fees don’t.' },
  { q: 'Is there a limit to what I can earn?', a: 'Only on groceries: Messenger and Olympian earn 3x on the first $25,000 of supermarket spending each year, then the plan’s base rate. Every other category is uncapped.' },
  { q: 'Do points expire?', a: 'No. Points stay in your account for as long as the account is open, and you can redeem any amount from one point upwards.' },
  { q: 'Will checking my eligibility hurt my credit score?', a: 'No. Seeing if you’re approved uses a soft enquiry, which other lenders can’t see. A full credit check only happens if you accept the offer.' },
  { q: 'Can I switch plans later?', a: 'Yes, once a year, from the app. Moving up starts the new plan’s benefits straight away; moving down refunds the unused part of your annual fee.' },
  { q: 'Does a titanium card work everywhere?', a: 'Yes. The carbon core carries the contactless antenna, so it taps like any card, and the chip and stripe work in every reader and ATM.' },
  { q: 'What if I want a different finish?', a: 'One replacement a year is free, in any finish. Lost or stolen cards are replaced at no cost, and you can keep spending with the digital card while it travels.' },
  { q: 'Is Hermes Card real?', a: 'No. Hermes Card is a design concept. The rates, fees and benefits on this page are illustrative, it isn’t an offer of credit, and it isn’t affiliated with any company that uses the Hermes name.' },
];
