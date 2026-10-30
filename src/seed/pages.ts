/**
 * First versions of the standalone pages, written in Markdown and converted to
 * the editor's format when seeded. After that the admin panel owns them — the
 * seed never overwrites a page that already exists.
 *
 * Both keep the addresses they had on the WordPress site.
 */
export const SEED_PAGES: { slug: string; title: string; intro: string; markdown: string }[] = [
  {
    slug: 'terms-conditions',
    title: 'Terms & Conditions',
    intro:
      'The terms for using this website and for subscribing to the Encyclopedia of Balinese Gamelan Ensembles.',
    markdown: `## Who we are

This website is run by Mekar Bhuana Centre (Yayasan Semara Gita Bhuana), Jl. Gandapura III no. 501X, Kesiman Kertalangu, Denpasar, Bali, Indonesia. You can reach us at [info@balimusicanddance.com](mailto:info@balimusicanddance.com).

By creating an account or buying a subscription, you agree to these terms.

## Your account

- Use your real name and an email address you can receive mail at. It is how you sign in, and where password-reset links are sent.
- Keep your password to yourself. An account is for one person, and sharing a login is not allowed.
- Libraries, universities and other institutions can arrange access for their readers. Please write to us.

## Subscriptions and payment

- A subscription gives you access to the Encyclopedia of Balinese Gamelan Ensembles for the length of the plan you choose.
- Prices are shown in Indonesian rupiah (IDR). If you pay with a card issued abroad, your bank converts the amount into your own currency and may add its own fee.
- Payments are processed by Midtrans, an Indonesian payment provider. We never see or store your card details.
- Your access opens as soon as Midtrans confirms the payment. Bank transfers and some e-wallets can take a little longer to confirm than cards.
- **Subscriptions do not renew automatically.** You are only charged when you choose to buy a plan, and nothing is taken later without you asking for it.
- If you buy a new plan while your current one is still running, the new period starts when the current one ends, so you never lose time you have paid for.

## If something goes wrong with a payment

If you were charged but your access did not open, or you were charged twice, write to [info@balimusicanddance.com](mailto:info@balimusicanddance.com) with the email address on your account and the date of payment, and we will put it right.

## Using the encyclopedia

Your subscription is for your own study, teaching and research. Please do not copy, download, redistribute or republish the encyclopedia or its linked media, or share your access with anyone else.

## Copyright and artificial intelligence

Everything on this site is © Mekar Bhuana Centre unless stated otherwise.

Unauthorized use of any content on this site, including data mining, robots, or similar data gathering and extraction tools, is strictly prohibited. Any published articles, e-books, flipbooks or resources, including the content of the Encyclopedia of Balinese Gamelan Ensembles or Encyclopedia of Balinese Instruments, may not be used to train, or be incorporated into, any artificial intelligence (AI) or machine learning models without explicit written permission.

## Your information

We keep your name, email address, country (if you give it) and a record of your subscriptions, so that we can run your account. We email you about your account, such as password resets, and about new ensembles only if you ticked that box when you signed up. We do not sell or share your details. Payment details stay with Midtrans.

To have your account and its information deleted, write to us.

## Changes to these terms

We may update these terms from time to time. The date at the bottom of this page shows when they last changed.`,
  },
  {
    slug: 'troubleshooting-accessing-the-encyclopedia',
    title: 'Troubleshooting: accessing the encyclopedia',
    intro:
      'Quick fixes if you cannot sign in, your access has not opened after paying, or the flipbook will not load.',
    markdown: `## I can't sign in

- **Were you a member on our old website?** Your account has moved across. Sign in with the same email address and password you used before.
- **Forgotten your password?** Use [Forgot your password?](/forgot-password) on the login page. We email you a link to choose a new one, which works for one hour. If it has not arrived after a few minutes, check your spam folder.
- **Locked out?** After several wrong passwords in a row, the account is locked for ten minutes. Wait, then try again or reset your password.

## I've paid, but my access hasn't opened

- Card and most e-wallet payments open your access straight away. A bank transfer opens it as soon as the transfer reaches Midtrans, so follow the payment instructions Midtrans gave you and keep the virtual account number.
- Your [account page](/account) lists each subscription and its status. An order still marked *Awaiting payment* has a button to continue paying.
- If you have paid and it still says *Awaiting payment* an hour later, write to us with the email address on your account and the date of payment.

## The flipbook won't load

Because the encyclopedia is a large, high-resolution book, your browser sometimes holds on to old data that stops the latest version from loading. Try these in order:

1. **Refresh the page fully.** On Windows or Linux press Ctrl + F5; on a Mac press Cmd + Shift + R.
2. **Open it in a private window** (Incognito in Chrome, Private in Safari or Firefox). If the book loads there, your browser's saved data is the problem. Clear it as in the next step.
3. **Clear this site's data.** Click the icon at the left of the address bar, open *Cookies and site data* or *Site settings*, and delete what is stored for this site. Reload the page and sign in again.
4. **Check your connection.** The encyclopedia links out to recordings and video. A slow connection, a strict firewall or a VPN can stop parts of it from loading.

## Still stuck?

Email [info@balimusicanddance.com](mailto:info@balimusicanddance.com) with a screenshot of what you see, and tell us which device and browser you are using. We will help you get in.`,
  },
]
